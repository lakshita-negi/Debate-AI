
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Bot,
  UserRound,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  Keyboard
} from 'lucide-react';
import './DebateRoom.css';

const API_URL = 'http://localhost:5000/api';


const cleanAIText = (text = '') => {
  return text
    .replace(/\*\*(.*?)\*\*/gs, '$1')
    .replace(/\*(.*?)\*/gs, '$1')
    .replace(/__(.*?)__/gs, '$1')
    .replace(/_(.*?)_/gs, '$1')
    .replace(/`{1,3}/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};


function DebateRoom() {

  const location = useLocation();
  const navigate = useNavigate();

  const [debate, setDebate] = useState(
    location.state?.debate || null
  );

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [openingLoading, setOpeningLoading] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);
  const [endingDebate, setEndingDebate] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const voiceModeRef = useRef(false);
  const loadingRef = useRef(false);
  const voiceEnabledRef = useRef(true);
  

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    setRecognitionAvailable(Boolean(SpeechRecognition));

    if (!debate?._id) return;

    const fetchDebate = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          `${API_URL}/debates/${debate._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load debate.');
        }

        setDebate(data.debate);

        if (
          data.debate.position === 'AGAINST' &&
          data.debate.messages.length === 0
        ) {
          setOpeningLoading(true);

          const openingResponse = await fetch(
            `${API_URL}/debates/${debate._id}/opening`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const openingData = await openingResponse.json();

          if (!openingResponse.ok) {
            throw new Error(
              openingData.message || 'Unable to generate the opening argument.'
            );
          }

          setDebate(openingData.debate);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setOpeningLoading(false);
      }
    };
    
    fetchDebate();
  }, [debate?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [debate?.messages]);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (
      !SpeechRecognition ||
      !voiceModeRef.current ||
      loadingRef.current ||
      openingLoading
    ) {
      return;
    }

    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();

    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    transcriptRef.current = '';

    recognition.onstart = () => {
      setListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      transcriptRef.current = event.results[0][0].transcript;
    };

    
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      setError(`Microphone error: ${event.error}. Please check your microphone permissions.`);

      voiceModeRef.current = false;
      setVoiceMode(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      const spokenMessage = transcriptRef.current.trim();
      transcriptRef.current = '';

      if (!voiceModeRef.current) return;

      if (spokenMessage) {
        submitArgument(spokenMessage, true);
      } else {
        startListening();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      setListening(false);
      setError('Unable to start the microphone. Please try again.');
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setVoiceSpeaking(false);
    setVoicePaused(false);
  };

  const speakText = (text, continueListening = false) => {
    if (!text || !voiceEnabledRef.current || !('speechSynthesis' in window)) {
      if (continueListening && voiceModeRef.current) {
        startListening();
      }

      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanAIText(text));
    const voices = window.speechSynthesis.getVoices();

    const preferredVoice =
      voices.find((voice) => voice.lang.toLowerCase() === 'en-in') ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith('en-gb')) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith('en-us'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setVoiceSpeaking(true);
      setVoicePaused(false);
    };

    utterance.onend = () => {
      setVoiceSpeaking(false);
      setVoicePaused(false);

      if (continueListening && voiceModeRef.current) {
        startListening();
      }
    };

    utterance.onerror = () => {
      setVoiceSpeaking(false);
      setVoicePaused(false);

      if (continueListening && voiceModeRef.current) {
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const submitArgument = async (argument, fromVoice = false) => {
    const trimmedMessage = argument.trim();

    if (
      !trimmedMessage ||
      loadingRef.current ||
      openingLoading ||
      !debate?._id
    ) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/debates/${debate._id}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            message: trimmedMessage
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send your argument.');
      }

      setDebate(data.debate);

      if (!fromVoice) {
        setMessage('');
      }

      if (fromVoice && voiceModeRef.current) {
        speakText(data.aiResponse, true);
      }

    } catch (err) {
      setError(err.message);

    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const startVoiceDebate = () => {
    if (openingLoading) return;
    if (!recognitionAvailable) {
      setError('Voice input is not supported. Please use Chrome or Edge.');
      return;
    }

    if (!('speechSynthesis' in window)) {
      setError('AI voice playback is not supported in this browser.');
      return;
    }

    voiceModeRef.current = true;
    setVoiceMode(true);
    setVoiceEnabled(true);
    voiceEnabledRef.current = true;
    setError('');

    const latestAIMessage = [...(debate?.messages || [])]
      .reverse()
      .find((item) => item.role === 'AI');

    if (latestAIMessage?.content) {
      speakText(latestAIMessage.content, true);
    } else {
      startListening();
    }
  };

  const endVoiceDebate = () => {
    voiceModeRef.current = false;
    setVoiceMode(false);

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    stopSpeech();
    setListening(false);
    transcriptRef.current = '';
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading) return;

    await submitArgument(message, false);
  };

    const handleEndDebate = async () => {
    if (!debate?._id || endingDebate || loading || openingLoading) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to end this debate and view your evaluation?'
    );

    if (!confirmed) return;

    endVoiceDebate();
    setEndingDebate(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/debates/${debate._id}/end`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to evaluate the debate.');
      }

      setDebate(data.debate);
    } catch (error) {
      setError(error.message);
    } finally {
      setEndingDebate(false);
    }
  };

  const replayAIResponse = () => {
    const latestAIMessage = [...(debate?.messages || [])]
      .reverse()
      .find((item) => item.role === 'AI');

    if (latestAIMessage?.content) {
      speakText(latestAIMessage.content);
    }
  };

  useEffect(() => {
    return () => {
      voiceModeRef.current = false;
      recognitionRef.current?.stop();

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!debate) {
    return (
      <div className="debate-room-empty">
        <h2>No active debate found</h2>
        <p>Start a new debate to enter your debate room.</p>

        <button onClick={() => navigate('/start-debate')}>
          <ArrowLeft size={16} />
          Start a Debate
        </button>
      </div>
    );
  }

  
  const latestAIMessage = [...(debate.messages || [])]
    .reverse()
    .find((item) => item.role === 'AI');

  const evaluationCriteria = [
    {
      key: 'argumentQuality',
      label: 'Argument Quality',
      weight: '30%'
    },
    {
      key: 'evidenceExamples',
      label: 'Evidence & Examples',
      weight: '25%'
    },
    {
      key: 'rebuttals',
      label: 'Rebuttals',
      weight: '20%'
    },
    {
      key: 'clarityCommunication',
      label: 'Clarity & Communication',
      weight: '15%'
    },
    {
      key: 'relevanceReasoning',
      label: 'Relevance & Reasoning',
      weight: '10%'
    }
  ];

  if (debate.status === 'COMPLETED') {
    const winnerText = {
      USER: 'You Won!',
      AI: 'DebateAI Won',
      DRAW: 'It’s a Draw!'
    };

    return (
      <div className="debate-results-page">
        <div className="debate-results-header">
          <span className="debate-room-label">DEBATEAI · FINAL EVALUATION</span>

          <h1>Debate Results</h1>

          <p>{debate.topic}</p>
        </div>

        <div className="debate-verdict">
          <span className="verdict-label">FINAL VERDICT</span>

          <h2>
            {winnerText[debate.winner] || 'Evaluation Complete'}
          </h2>

          <p>
            {debate.evaluation?.summary ||
              'Your debate has been evaluated successfully.'}
          </p>
        </div>

        <div className="debate-score-cards">
          <div className="debate-score-card user-score-card">
            <span>YOUR SCORE</span>
            <strong>{Number(debate.userScore ?? 0).toFixed(1)}</strong>
            <small>OUT OF 10</small>
          </div>

          <div className="debate-score-card ai-score-card">
            <span>DEBATEAI SCORE</span>
            <strong>{Number(debate.aiScore ?? 0).toFixed(1)}</strong>
            <small>OUT OF 10</small>
          </div>
        </div>

        <section className="evaluation-section">
          <div className="evaluation-section-heading">
            <span className="debate-room-label">PERFORMANCE ANALYSIS</span>
            <h2>Evaluation Breakdown</h2>
            <p>Scores across five debate performance criteria.</p>
          </div>

          <div className="evaluation-criteria">
            {evaluationCriteria.map((criterion) => {
              const scores = debate.criterionScores?.[criterion.key];

              return (
                <div className="evaluation-criterion" key={criterion.key}>
                  <div className="criterion-heading">
                    <div>
                      <h3>{criterion.label}</h3>
                      <span>Weight: {criterion.weight}</span>
                    </div>
                  </div>

                  <div className="criterion-scores">
                    <div className="criterion-score-row">
                      <span>You</span>
                      <strong>
                        {scores?.userScore ?? '—'}/10
                      </strong>
                    </div>

                    <div className="criterion-score-row">
                      <span>DebateAI</span>
                      <strong>
                        {scores?.aiScore ?? '—'}/10
                      </strong>
                    </div>
                  </div>

                  <div className="criterion-bars">
                    <div className="criterion-bar-track">
                      <div
                        className="criterion-bar user-criterion-bar"
                        style={{
                          width: `${Math.max(0, Math.min(100, (scores?.userScore || 0) * 10))}%`
                        }}
                      />
                    </div>

                    <div className="criterion-bar-track">
                      <div
                        className="criterion-bar ai-criterion-bar"
                        style={{
                          width: `${Math.max(0, Math.min(100, (scores?.aiScore || 0) * 10))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="evaluation-legend">
            <span><i className="legend-user" /> Your performance</span>
            <span><i className="legend-ai" /> DebateAI performance</span>
          </div>
        </section>

        <section className="evaluation-section feedback-section">
          <div className="evaluation-section-heading">
            <span className="debate-room-label">PERSONAL FEEDBACK</span>
            <h2>Your Evaluation</h2>
          </div>

          <div className="evaluation-feedback">
            <h3>Judge's Feedback</h3>
            <p>
              {debate.evaluation?.userFeedback ||
                debate.evaluation?.feedback ||
                'No additional feedback available.'}
            </p>
          </div>

          <div className="evaluation-feedback">
            <h3>Your Strengths</h3>

            {debate.evaluation?.userStrengths?.length > 0 ? (
              <ul>
                {debate.evaluation.userStrengths.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No strengths recorded.</p>
            )}
          </div>

          <div className="evaluation-feedback">
            <h3>Areas for Improvement</h3>

            {debate.evaluation?.userImprovements?.length > 0 ? (
              <ul>
                {debate.evaluation.userImprovements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No improvement suggestions recorded.</p>
            )}
          </div>
        </section>

        <div className="debate-results-actions">
          <button
            type="button"
            onClick={() => navigate('/my-debates')}
          >
            <ArrowLeft size={16} />
            Back to My Debates
          </button>

          <button
            type="button"
            onClick={() => navigate('/start-debate')}
          >
            Start a New Debate
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="debate-room">
      <div className="debate-room-heading">
        <div>
          <span className="debate-room-label">CURRENT SESSION</span>
          <h2>{debate.topic}</h2>
          <p>
            Your position: <strong>{debate.position}</strong>
            {' · '}
            Difficulty: <strong>{debate.difficulty}</strong>
          </p>
        </div>

        <span className={`debate-status ${debate.status.toLowerCase()}`}>
          {debate.status}
        </span>
      </div>

      <div className="debate-mode-selector">
        <div className="debate-mode-heading">
          <span>CHOOSE YOUR DEBATE MODE</span>
          <p>Debate in the way that feels most comfortable.</p>
        </div>

        <div className="debate-mode-buttons">
          <button
            type="button"
            className={!voiceMode ? 'active' : ''}
            onClick={endVoiceDebate}
          >
            <Keyboard size={17} />
            Text Debate
          </button>

          <button
            type="button"
            className={voiceMode ? 'active' : ''}
            onClick={voiceMode ? endVoiceDebate : startVoiceDebate}
            disabled={debate.status !== 'ACTIVE' || openingLoading}
          >
            {voiceMode ? <MicOff size={17} /> : <Mic size={17} />}
            {voiceMode ? 'End Voice Debate' : 'Start Voice Debate'}
          </button>
        </div>
      </div>

      {voiceMode && (
        <div className="voice-session-status">
          <span className={`voice-status-dot ${listening ? 'listening' : loading ? 'thinking' : voiceSpeaking ? 'speaking' : ''}`} />

          <span>
            {listening
              ? 'Listening to your argument...'
              : loading
                ? 'DebateAI is preparing its response...'
                : voiceSpeaking
                  ? 'DebateAI is speaking...'
                  : 'Voice session is active.'}
          </span>
        </div>
      )}

      <div className="debate-voice-toolbar">
        <div className="voice-toolbar-label">
          <Volume2 size={16} />
          <span>AI VOICE CONTROLS</span>
        </div>

        <div className="voice-toolbar-controls">
          <button
            type="button"
            onClick={() => {
              const nextValue = !voiceEnabled;
              voiceEnabledRef.current = nextValue;
              setVoiceEnabled(nextValue);

              if (!nextValue) {
                stopSpeech();
              } else {
                replayAIResponse();
              }
            }}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (voicePaused) {
                window.speechSynthesis.resume();
                setVoicePaused(false);
              } else if (voiceSpeaking) {
                window.speechSynthesis.pause();
                setVoicePaused(true);
              } else {
                replayAIResponse();
              }
            }}
            disabled={!voiceEnabled || !latestAIMessage?.content}
          >
            {voicePaused ? <Play size={15} /> : voiceSpeaking ? <Pause size={15} /> : <Play size={15} />}
            {voicePaused ? 'Resume' : voiceSpeaking ? 'Pause' : 'Replay'}
          </button>

          <button
            type="button"
            onClick={stopSpeech}
            disabled={!voiceSpeaking && !voicePaused}
          >
            <Square size={14} />
            Stop
          </button>
        </div>
      </div>

      <div className="debate-conversation">
        {debate.messages?.map((item, index) => (
          <div
            key={item._id || index}
            className={`debate-message ${
              item.role === 'USER' ? 'user-message' : 'ai-message'
            }`}
          >
            <div className="message-avatar">
              {item.role === 'USER'
                ? <UserRound size={18} />
                : <Bot size={18} />}
            </div>

            <div className="message-content">
              <span className="message-author">
                {item.role === 'USER' ? 'YOU' : 'DEBATEAI'}
              </span>

              <p>
                {item.role === 'AI' ? cleanAIText(item.content) : item.content}
              </p>
            </div>
          </div>
        ))}

        {openingLoading && (
          <div className="ai-thinking">
            DebateAI is preparing its opening argument...
          </div>
        )}

        {loading && (
          <div className="ai-thinking">
            DebateAI is preparing its response...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="debate-room-error" role="alert">
          {error}
        </p>
      )}

      {!voiceMode && debate.status === 'ACTIVE' && (
        <form
          className="debate-input-area"
          onSubmit={handleTextSubmit}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Present your argument..."
            rows={3}
            maxLength={3000}
            disabled={loading || openingLoading}
          />

          <div className="debate-input-footer">
            <span>{message.length}/3000 characters</span>

            <button
              type="submit"
              disabled={loading || openingLoading || !message.trim()}
            >
              {loading ? 'Thinking...' : 'Send Argument'}
              <Send size={15} />
            </button>

            {debate?.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={handleEndDebate}
                disabled={loading || openingLoading || endingDebate}
                className="end-debate-button"
              >
                {endingDebate ? 'Evaluating Debate...' : 'End Debate & View Results'}
              </button>
            )}
          </div>
        </form>
      )}

      {debate.status === 'COMPLETED' && (
        <p className="debate-completed-message">
          This debate has been completed.
        </p>
      )}
    </div>
  );
}

export default DebateRoom;
