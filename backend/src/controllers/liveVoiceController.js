
const jwt = require('jsonwebtoken');
const Debate = require('../models/Debate');
const { createLiveVoiceSession } = require('../services/liveVoiceService');

const sendToClient = (socket, data) => {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(data));
  }
};

const handleLiveVoiceConnection = (socket) => {
  let liveSession = null;
  let debate = null;
  let authenticated = false;
  let closing = false;
  let saveQueue = Promise.resolve();
  let aiResponseActive = false;

  const transcriptBuffers = {
    USER: '',
    AI: ''
  };

  const appendTranscript = (role, text) => {
    const chunk = text?.trim();

    if (!chunk) {
      return;
    }

    const current = transcriptBuffers[role];

    if (!current) {
      transcriptBuffers[role] = chunk;
      return;
    }

    const needsSpace =
      !/\s$/.test(current) &&
      !/^[\s.,!?;:)\]}]/.test(chunk);

    transcriptBuffers[role] += `${needsSpace ? ' ' : ''}${chunk}`;
  };

  const saveTranscript = (role, content) => {
    const cleanContent = content?.trim();

    if (!cleanContent || !debate) {
      return Promise.resolve();
    }

    saveQueue = saveQueue
      .then(async () => {
        if (!debate) {
          return;
        }

        const updatedDebate = await Debate.findOneAndUpdate(
          {
            _id: debate._id,
            userId: debate.userId,
            status: 'ACTIVE'
          },
          {
            $push: {
              messages: {
                role,
                content: cleanContent
              }
            }
          },
          { new: true }
        );

        if (updatedDebate) {
          debate = updatedDebate;

          sendToClient(socket, {
            type: 'transcript',
            role,
            text: cleanContent
          });
        }
      })
      .catch((error) => {
        console.error('Transcript save error:', error.message);

        sendToClient(socket, {
          type: 'error',
          message: 'Unable to save the conversation transcript.'
        });
      });

    return saveQueue;
  };

  const flushTranscript = (role) => {
    const content = transcriptBuffers[role].trim();

    if (!content) {
      return Promise.resolve();
    }

    transcriptBuffers[role] = '';

    return saveTranscript(role, content);
  };

  const flushAllTranscripts = async () => {
    await flushTranscript('USER');
    await flushTranscript('AI');
  };

  const notifyAIStarted = () => {
    if (aiResponseActive) {
      return;
    }

    aiResponseActive = true;

    sendToClient(socket, {
      type: 'aiStarted'
    });
  };

  const handleGeminiMessage = async (message) => {
    const serverContent = message.serverContent;

    if (!serverContent) {
      return;
    }

    if (serverContent.interrupted) {
      await flushTranscript('AI');

      aiResponseActive = false;

      sendToClient(socket, {
        type: 'interrupted'
      });
    }

    if (serverContent.inputTranscription?.text) {
      appendTranscript(
        'USER',
        serverContent.inputTranscription.text
      );
    }

    if (serverContent.outputTranscription?.text) {
      await flushTranscript('USER');

      notifyAIStarted();

      appendTranscript(
        'AI',
        serverContent.outputTranscription.text
      );
    }

    const audioParts = serverContent.modelTurn?.parts || [];

    for (const part of audioParts) {
      if (
        part.inlineData?.data &&
        part.inlineData.mimeType?.startsWith('audio/')
      ) {
        notifyAIStarted();

        sendToClient(socket, {
          type: 'audio',
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        });
      }
    }

    if (serverContent.turnComplete) {
      await flushAllTranscripts();

      aiResponseActive = false;

      sendToClient(socket, {
        type: 'turnComplete'
      });
    }
  };

  const startSession = async (data) => {
    if (authenticated) {
      return;
    }

    try {
      if (!data.token || !data.debateId) {
        throw new Error('Authentication token and debate ID are required.');
      }

      const decoded = jwt.verify(
        data.token,
        process.env.JWT_SECRET
      );

      debate = await Debate.findOne({
        _id: data.debateId,
        userId: decoded.id,
        status: 'ACTIVE'
      });

      if (!debate) {
        throw new Error('Active debate not found or access denied.');
      }

      authenticated = true;

      liveSession = await createLiveVoiceSession({
        debate,
        onMessage: handleGeminiMessage,

        onError: (error) => {
          console.error('Gemini Live error:', error.message);

          sendToClient(socket, {
            type: 'error',
            message: 'The AI voice connection encountered an error.'
          });
        },

        onClose: () => {
          sendToClient(socket, {
            type: 'closed'
          });
        }
      });

      sendToClient(socket, {
        type: 'ready'
      });

      console.log(
        `Live voice session started for debate ${debate._id}`
      );
    } catch (error) {
      console.error('Live voice startup error:', error.message);

      sendToClient(socket, {
        type: 'error',
        message: error.message || 'Unable to start the voice debate.'
      });

      socket.close(1008, 'Unable to start voice session.');
    }
  };

  socket.on('message', async (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.type === 'start') {
        await startSession(data);
        return;
      }

      if (!authenticated || !liveSession) {
        throw new Error('Voice session is not authenticated or ready.');
      }

      if (data.type === 'audio') {
        if (!data.data || closing) {
          return;
        }

        liveSession.sendRealtimeInput({
          audio: {
            data: data.data,
            mimeType: data.mimeType || 'audio/pcm;rate=16000'
          }
        });

        return;
      }

      if (data.type === 'stop') {
        if (closing) {
          return;
        }

        closing = true;

        await flushAllTranscripts();
        await saveQueue;

        sendToClient(socket, {
          type: 'stopComplete'
        });

        if (liveSession) {
          liveSession.close();
          liveSession = null;
        }

        socket.close();
      }
    } catch (error) {
      console.error('Voice WebSocket message error:', error.message);

      sendToClient(socket, {
        type: 'error',
        message: error.message || 'Invalid voice message.'
      });
    }
  });

  socket.on('close', async () => {
    if (!closing) {
      await flushAllTranscripts();
      closing = true;
    }

    try {
      await saveQueue;

      if (liveSession) {
        liveSession.close();
      }
    } catch (error) {
      console.error('Voice session cleanup error:', error.message);
    }

    console.log('Voice WebSocket connection closed.');
  });

  socket.on('error', (error) => {
    console.error('Voice WebSocket error:', error.message);
  });
};

module.exports = {
  handleLiveVoiceConnection
};
