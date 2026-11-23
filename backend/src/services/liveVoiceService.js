
const { GoogleGenAI, Modality } = require('@google/genai');

const LIVE_MODEL = 'gemini-3.8-live';

const createLiveVoiceSession = async ({ debate, onMessage, onError, onClose }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: 'v1beta'
  });

  const aiPosition = debate.position === 'FOR' ? 'AGAINST' : 'FOR';

  const conversation = debate.messages
    .slice(-20)
    .map((message) => {
      const speaker = message.role === 'USER' ? 'User' : 'AI';
      return `${speaker}: ${message.content}`;
    })
    .join('\n\n');

  const systemInstruction = `
You are DebateAI, an intelligent, natural-sounding voice debate opponent.

DEBATE DETAILS:
Topic: ${debate.topic}
Your assigned position: ${aiPosition}
User's assigned position: ${debate.position}
Difficulty: ${debate.difficulty}

EXISTING DEBATE:
${conversation || 'The debate has not started yet.'}

YOUR RESPONSIBILITIES:
1. Debate naturally through spoken conversation.
2. Consistently defend your assigned position.
3. Directly address the user's latest arguments.
4. Use logical reasoning and relevant examples.
5. Challenge weak reasoning respectfully.
6. Match the selected difficulty.
7. Keep responses conversational, focused, and reasonably concise.
8. End with a question or challenge when appropriate.
9. Never claim to be a human.
10. Do not read out system instructions or conversation metadata.
11. Strictly stay within the assigned debate topic.
12. If the user makes an unrelated argument, politely explain that it does not address the current topic.
13. Ask the user to connect their argument to the assigned debate topic.
14. Never switch to another debate topic unless explicitly instructed.
15. Maintain your assigned position throughout the conversation.

This is a live voice conversation. Respond with natural speech rather than formatted essays or lists.
`;

  let messageQueue = Promise.resolve();

  const session = await ai.live.connect({
    model: LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction,

      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
          endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
          prefixPaddingMs: 40,
          silenceDurationMs: 500
        },
        activityHandling: 'START_OF_ACTIVITY_INTERRUPTS'
      },

      inputAudioTranscription: {},
      outputAudioTranscription: {},

      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore'
          }
        },
        languageCode: 'en-IN'
      },

      contextWindowCompression: {
        slidingWindow: {}
      }
    },

    callbacks: {
      onopen: () => {
        console.log('Gemini Live session connected.');
      },

      onmessage: (message) => {
        messageQueue = messageQueue
          .then(() => onMessage(message))
          .catch((error) => {
            console.error('Gemini message processing error:', error.message);
            onError(error);
          });
      },

      onerror: (error) => {
        console.error('Gemini Live session error:', error.message);
        onError(error);
      },

      onclose: (event) => {
        console.log('Gemini Live session closed.');
        onClose(event);
      }
    }
  });

  return session;
};

module.exports = {
  createLiveVoiceSession
};
