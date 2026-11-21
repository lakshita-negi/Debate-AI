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
  Keyboard,
  RotateCcw,
  PhoneOff,
  X,
  Trophy,
  Clock3
} from 'lucide-react';
import './DebateRoom.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


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


const PHASE_COPY = {
  connecting: {
    title: 'Connecting...',
    hint: 'Setting up your live debate session.'
  },
  listening: {
    title: 'Listening',
    hint: 'Speak naturally. DebateAI responds when you pause.'
  },
  you: {
    title: "You're speaking",
    hint: 'Make your point. You can interrupt at any time.'
  },
  thinking: {
    title: 'DebateAI is thinking',
    hint: 'Preparing a rebuttal to your argument.'
  },
  speaking: {
    title: 'DebateAI is speaking',
    hint: 'Start talking to interrupt.'
  },
  muted: {
    title: 'Microphone muted',
    hint: 'Tap the mic or press M to unmute.'
  },
  paused: {
    title: 'Playback paused',
    hint: 'Resume to continue hearing the response.'
  }
};

const WAVE_BARS = Array.from({ length: 32 }, (_, i) => ({
  i,
  k: Number(
    (
      (0.35 + 0.65 * Math.abs(Math.sin(i * 1.9 + 1))) *
      (1 - Math.abs(i - 15.5) / 22)
    ).toFixed(3)
  )
}));

const formatTime = (totalSeconds = 0) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
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
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSpeaking, setVoiceSpeaking] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);
  const [endingDebate, setEndingDebate] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [userTalking, setUserTalking] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  const messagesEndRef = useRef(null);
  const voiceModeRef = useRef(false);
  const voiceEnabledRef = useRef(true);
  const voiceSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const microphoneSourceRef = useRef(null);
  const processorRef = useRef(null);
  const muteGainRef = useRef(null);
  const playbackSourcesRef = useRef(new Set());
  const nextPlayTimeRef = useRef(0);
  const currentAIChunksRef = useRef([]);
  const lastAIChunksRef = useRef([]);
  const loadingRef = useRef(false);
  const autoEndTriggeredRef = useRef(false);
  const autoEndDebateIdRef = useRef(null);
  const stageRef = useRef(null);
  const conversationRef = useRef(null);
  const textareaRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const playbackAnalyserRef = useRef(null);


  useEffect(() => {
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
        console.log("Active Debate ID:", data.debate._id);

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
    const container = conversationRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [debate?.messages, loading, openingLoading, voiceMode]);

  const stopAudioPlayback = () => {
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (error) {}
    });

    playbackSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;
    setVoiceSpeaking(false);
    setVoicePaused(false);
  };

  const playAudioData = async (base64Audio) => {
    const audioContext = playbackContextRef.current;

    if (!audioContext || !voiceEnabledRef.current || !base64Audio) {
      return;
    }

    try {
      const binary = atob(base64Audio);
      const pcmData = new Int16Array(binary.length / 2);

      for (let i = 0; i < pcmData.length; i += 1) {
        const low = binary.charCodeAt(i * 2);
        const high = binary.charCodeAt(i * 2 + 1);
        let sample = (high << 8) | low;

        if (sample >= 0x8000) {
          sample -= 0x10000;
        }

        pcmData[i] = sample;
      }

      const audioBuffer = audioContext.createBuffer(
        1,
        pcmData.length,
        24000
      );
      const channel = audioBuffer.getChannelData(0);

      for (let i = 0; i < pcmData.length; i += 1) {
        channel[i] = pcmData[i] / 32768;
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playbackAnalyserRef.current || audioContext.destination);

      const startAt = Math.max(
        audioContext.currentTime + 0.02,
        nextPlayTimeRef.current
      );

      source.onended = () => {
        playbackSourcesRef.current.delete(source);

        if (playbackSourcesRef.current.size === 0) {
          setVoiceSpeaking(false);
        }
      };

      playbackSourcesRef.current.add(source);
      source.start(startAt);
      nextPlayTimeRef.current = startAt + audioBuffer.duration;
      setVoiceSpeaking(true);
    } catch (audioError) {
      console.error('Unable to play Gemini audio:', audioError);
      setError('Unable to play the AI voice response.');
    }
  };

  const encodeAudioForGemini = (audioData, inputSampleRate) => {
    const targetSampleRate = 16000;
    const ratio = inputSampleRate / targetSampleRate;
    const outputLength = Math.floor(audioData.length / ratio);
    const pcmBytes = new Uint8Array(outputLength * 2);
    const dataView = new DataView(pcmBytes.buffer);

    for (let i = 0; i < outputLength; i += 1) {
      const sourceStart = Math.floor(i * ratio);
      const sourceEnd = Math.min(
        Math.floor((i + 1) * ratio),
        audioData.length
      );

      let total = 0;
      let count = 0;

      for (let j = sourceStart; j < sourceEnd; j += 1) {
        total += audioData[j];
        count += 1;
      }

      const average = count ? total / count : 0;
      const sample = Math.max(-1, Math.min(1, average));
      const pcmSample = sample < 0
        ? sample * 0x8000
        : sample * 0x7fff;

      dataView.setInt16(i * 2, pcmSample, true);
    }

    let binary = '';
    const chunkSize = 8192;

    for (let i = 0; i < pcmBytes.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...pcmBytes.subarray(i, i + chunkSize)
      );
    }

    return btoa(binary);
  };

  const startMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    mediaStreamRef.current = stream;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const microphoneSource = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const muteGain = audioContext.createGain();

    muteGain.gain.value = 0;

    processor.onaudioprocess = (event) => {
      const socket = voiceSocketRef.current;

      if (!voiceModeRef.current || socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      const input = event.inputBuffer.getChannelData(0);
      const encodedAudio = encodeAudioForGemini(
        input,
        audioContext.sampleRate
      );

      socket.send(JSON.stringify({
        type: 'audio',
        data: encodedAudio,
        mimeType: 'audio/pcm;rate=16000'
      }));
    };

    microphoneSource.connect(processor);

    const micAnalyser = audioContext.createAnalyser();
    micAnalyser.fftSize = 512;
    microphoneSource.connect(micAnalyser);
    micAnalyserRef.current = micAnalyser;
    processor.connect(muteGain);
    muteGain.connect(audioContext.destination);

    microphoneSourceRef.current = microphoneSource;
    processorRef.current = processor;
    muteGainRef.current = muteGain;
    setListening(true);
  };

  const stopMicrophone = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    microphoneSourceRef.current?.disconnect();
    microphoneSourceRef.current = null;
    micAnalyserRef.current = null;

    muteGainRef.current?.disconnect();
    muteGainRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    setListening(false);
  };

  const cleanupVoiceResources = () => {
    stopMicrophone();
    stopAudioPlayback();

    if (audioContextRef.current) {
      audioContextRef.current.close().catch((error) => {
        console.error('Microphone audio context cleanup error:', error);
      });
      audioContextRef.current = null;
    }

    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch((error) => {
        console.error('Playback audio context cleanup error:', error);
      });
      playbackContextRef.current = null;
      playbackAnalyserRef.current = null;
    }
  };

  const submitArgument = async (argument) => {
    const trimmedMessage = argument.trim();

    if (
      !trimmedMessage ||
      loadingRef.current ||
      openingLoading ||
      !debate?._id ||
      (debate.endsAt && Date.now() >= new Date(debate.endsAt).getTime())
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
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const startVoiceDebate = async () => {
    if (
      openingLoading ||
      voiceModeRef.current ||
      debate?.status !== 'ACTIVE' ||
      (debate?.endsAt && Date.now() >= new Date(debate.endsAt).getTime())
    ) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is unavailable. Open the app on localhost or HTTPS and check browser permissions.');
      return;
    }

    try {
      setError('');
      setVoiceMode(true);
      setVoiceEnabled(true);
      setMicMuted(false);
      voiceEnabledRef.current = true;
      voiceModeRef.current = true;
      currentAIChunksRef.current = [];
      lastAIChunksRef.current = [];

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error('Web Audio is not supported in this browser.');
      }

      playbackContextRef.current = new AudioContextClass();
      await playbackContextRef.current.resume();

      const playbackAnalyser = playbackContextRef.current.createAnalyser();
      playbackAnalyser.fftSize = 512;
      playbackAnalyser.connect(playbackContextRef.current.destination);
      playbackAnalyserRef.current = playbackAnalyser;

      const backendUrl = new URL(API_URL, window.location.origin);

      const socketProtocol = backendUrl.protocol === 'https:'
        ? 'wss:'
        : 'ws:';

      const socketPath = `${backendUrl.pathname.replace(/\/$/, '')}/debates/voice`;

      const socketUrl = `${socketProtocol}//${backendUrl.host}${socketPath}`;

      const socket = new WebSocket(socketUrl);
      voiceSocketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: 'start',
          token: localStorage.getItem('token'),
          debateId: debate._id
        }));
      };

      socket.onmessage = async (event) => {
        let data;

        try {
          data = JSON.parse(event.data);
        } catch (parseError) {
          console.error('Invalid voice server message:', parseError);
          return;
        }

        if (data.type === 'ready') {
          try {
            await startMicrophone();
          } catch (microphoneError) {
            setError(microphoneError.message || 'Unable to access your microphone.');
            endVoiceDebate();
          }
          return;
        }

        if (data.type === 'transcript') {
          setDebate((currentDebate) => {
            if (!currentDebate) return currentDebate;

            return {
              ...currentDebate,
              messages: [
                ...(currentDebate.messages || []),
                {
                  role: data.role,
                  content: data.text,
                  _id: `live-${Date.now()}-${Math.random()}`
                }
              ]
            };
          });
          return;
        }

        if (data.type === 'audio') {
          currentAIChunksRef.current.push(data.data);

          if (voiceEnabledRef.current) {
            await playAudioData(data.data);
          }
          return;
        }

        if (data.type === 'interrupted') {
          stopAudioPlayback();
          currentAIChunksRef.current = [];
          return;
        }

        if (data.type === 'turnComplete') {
          if (currentAIChunksRef.current.length > 0) {
            lastAIChunksRef.current = currentAIChunksRef.current;
            currentAIChunksRef.current = [];
          }

          if (playbackSourcesRef.current.size === 0) {
            setVoiceSpeaking(false);
          }
          return;
        }

        if (data.type === 'error') {
          setError(data.message || 'The live voice session encountered an error.');
          return;
        }

        if (data.type === 'closed') {
          setVoiceSpeaking(false);
        }
      };

      socket.onerror = () => {
        if (voiceModeRef.current) {
          setError('Unable to connect to the live voice server. Check that the backend is running.');
        }
      };

      socket.onclose = () => {
        if (voiceModeRef.current) {
          cleanupVoiceResources();
          voiceModeRef.current = false;
          setVoiceMode(false);
        }
      };
    } catch (startError) {
      setError(startError.message || 'Unable to start the live voice debate.');
      endVoiceDebate();
    }
  };

  const endVoiceDebate = () => {
    voiceModeRef.current = false;
    setVoiceMode(false);
    setMicMuted(false);
    cleanupVoiceResources();

    const socket = voiceSocketRef.current;
    voiceSocketRef.current = null;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'stop' }));
    } else if (
      socket &&
      socket.readyState !== WebSocket.CLOSED &&
      socket.readyState !== WebSocket.CLOSING
    ) {
      socket.close();
    }
  };

  const toggleVoicePlayback = async () => {
    const audioContext = playbackContextRef.current;

    if (!audioContext) return;

    try {
      if (voicePaused) {
        await audioContext.resume();
        setVoicePaused(false);
      } else if (voiceSpeaking) {
        await audioContext.suspend();
        setVoicePaused(true);
      } else {
        replayAIResponse();
      }
    } catch (playbackError) {
      setError('Unable to change audio playback state.');
    }
  };

  const stopSpeech = () => {
    stopAudioPlayback();
  };

  const replayAIResponse = async () => {
    if (!voiceEnabledRef.current || lastAIChunksRef.current.length === 0) {
      return;
    }

    stopAudioPlayback();

    for (const chunk of lastAIChunksRef.current) {
      await playAudioData(chunk);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading) return;

    await submitArgument(message);
  };

  const handleEndDebate = async (automatic = false) => {
    if (!debate?._id || endingDebate) return;

    if (loading || openingLoading) {
      if (automatic) autoEndTriggeredRef.current = false;
      return;
    }

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

  useEffect(() => {
    if (!debate?._id || debate.status !== 'ACTIVE' || !debate.endsAt) {
      setRemainingSeconds(null);
      return undefined;
    }

    if (autoEndDebateIdRef.current !== debate._id) {
      autoEndDebateIdRef.current = debate._id;
      autoEndTriggeredRef.current = false;
    }

    const updateCountdown = () => {
      const deadline = new Date(debate.endsAt).getTime();
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (
        remaining === 0 &&
        !autoEndTriggeredRef.current &&
        !loadingRef.current &&
        !openingLoading &&
        !endingDebate
      ) {
        autoEndTriggeredRef.current = true;
        handleEndDebate(true);
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [debate?._id, debate?.endsAt, debate?.status, loading, openingLoading, endingDebate]);

  useEffect(() => {
    return () => {
      voiceModeRef.current = false;
      cleanupVoiceResources();

      const socket = voiceSocketRef.current;
      voiceSocketRef.current = null;

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'stop' }));
      } else if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    };
  }, []);

  const toggleMute = () => {
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);

    mediaStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
  };

  // Call timer
  useEffect(() => {
    if (!voiceMode) {
      setVoiceSeconds(0);
      return undefined;
    }

    const timer = setInterval(() => {
      setVoiceSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [voiceMode]);

  // Live audio level (drives the orb and waveform through a CSS variable)
  useEffect(() => {
    if (!voiceMode) return undefined;

    const samples = new Uint8Array(512);
    let frame;
    let level = 0;
    let talking = false;
    let lastTalk = 0;

    const measure = (analyser) => {
      if (!analyser) return 0;

      analyser.getByteTimeDomainData(samples);

      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const value = (samples[i] - 128) / 128;
        sum += value * value;
      }

      return Math.sqrt(sum / samples.length);
    };

    const tick = (now) => {
      const mic = measure(micAnalyserRef.current);
      const ai = measure(playbackAnalyserRef.current);
      const target = Math.min(1, Math.max(mic, ai) * 5);

      level = level * 0.65 + target * 0.35;
      stageRef.current?.style.setProperty('--level', level.toFixed(3));

      if (mic > 0.035) {
        lastTalk = now;

        if (!talking) {
          talking = true;
          setUserTalking(true);
        }
      } else if (talking && now - lastTalk > 500) {
        talking = false;
        setUserTalking(false);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      setUserTalking(false);
    };
  }, [voiceMode]);

  // Keyboard shortcut: M to mute during voice debates
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!voiceMode) return;

      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [voiceMode, micMuted]);

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

  const aiPosition = debate.position === 'FOR' ? 'AGAINST' : 'FOR';
  
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

        <div className={`debate-verdict winner-${(debate.winner || 'none').toLowerCase()}`}>
          <Trophy size={26} className="verdict-icon" />
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
          <div className={`debate-score-card user-score-card${debate.winner === 'USER' ? ' is-winner' : ''}`}>
            <span>YOUR SCORE</span>
            <strong>{Number(debate.userScore ?? 0).toFixed(1)}</strong>
            <small>OUT OF 10</small>
          </div>

          <div className={`debate-score-card ai-score-card${debate.winner === 'AI' ? ' is-winner' : ''}`}>
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

                  <div className="criterion-score-cards">
                    <div className="criterion-score-card user-criterion-score">
                      <span className="criterion-player">YOU</span>
                      <strong>
                        {scores?.userScore ?? '—'}
                        <small>/10</small>
                      </strong>
                    </div>

                    <div className="criterion-score-card ai-criterion-score">
                      <span className="criterion-player">DEBATEAI</span>
                      <strong>
                        {scores?.aiScore ?? '—'}
                        <small>/10</small>
                      </strong>
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

  const isActive = debate.status === 'ACTIVE';
  const timeExpired = Boolean(
    debate.endsAt &&
    (remainingSeconds === 0 || Date.now() >= new Date(debate.endsAt).getTime())
  );
  const messages = debate.messages || [];
  const lastMessage = messages[messages.length - 1];
  const userTurns = messages.filter((item) => item.role === 'USER').length;
  const awaitingAI =
    voiceMode &&
    !micMuted &&
    lastMessage?.role === 'USER' &&
    String(lastMessage?._id || '').startsWith('live-');

  let voicePhase = 'connecting';

  if (voiceMode) {
    if (voicePaused) voicePhase = 'paused';
    else if (voiceSpeaking) voicePhase = 'speaking';
    else if (loading || awaitingAI) voicePhase = 'thinking';
    else if (userTalking && !micMuted) voicePhase = 'you';
    else if (micMuted) voicePhase = 'muted';
    else if (listening) voicePhase = 'listening';
  }

  const phaseText = PHASE_COPY[voicePhase];

  const PhaseIcon =
    voicePhase === 'speaking' || voicePhase === 'thinking'
      ? Bot
      : voicePhase === 'muted'
        ? MicOff
        : voicePhase === 'paused'
          ? Pause
          : Mic;

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  const handleTextChange = (e) => {
    setMessage(e.target.value);

    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  const toggleVoiceOutput = () => {
    const nextValue = !voiceEnabled;
    voiceEnabledRef.current = nextValue;
    setVoiceEnabled(nextValue);

    if (!nextValue) {
      stopSpeech();
    } else {
      replayAIResponse();
    }
  };

  const handlePlaybackButton = () => {
    if (voicePaused || voiceSpeaking) {
      toggleVoicePlayback();
    } else {
      replayAIResponse();
    }
  };

  const playbackDisabled =
    !voiceEnabled ||
    !voiceMode ||
    (!voiceSpeaking &&
      !voicePaused &&
      lastAIChunksRef.current.length === 0);

  const conversation = (
    <div className="debate-conversation" ref={conversationRef}>
      {messages.length === 0 && !openingLoading && (
        <div className="debate-conversation-empty">
          <Bot size={22} />
          <p>
            {voiceMode
              ? 'Your transcript will appear here as you speak.'
              : 'The floor is yours. Open with your strongest argument.'}
          </p>
        </div>
      )}

      {messages.map((item, index) => (
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

      {(openingLoading || loading) && (
        <div className="debate-message ai-message typing-message">
          <div className="message-avatar">
            <Bot size={18} />
          </div>

          <div className="message-content">
            <span className="message-author">DEBATEAI</span>

            <div className="typing-dots" aria-hidden="true">
              <i /><i /><i />
            </div>

            <small>
              {openingLoading
                ? 'Preparing its opening argument...'
                : 'Preparing its response...'}
            </small>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );

  return (

    <div className="debate-room">
      <div className="debate-room-heading">
        <div className="debate-room-heading-main">
          <span className="debate-room-label">CURRENT SESSION</span>
          <h2>{debate.topic}</h2>

          <div className="debate-meta-chips">
            <span className="meta-chip">
              You <strong>{debate.position}</strong>
            </span>
            <span className="meta-chip">
              DebateAI <strong>{aiPosition}</strong>
            </span>
            <span className="meta-chip">
              Difficulty <strong>{debate.difficulty}</strong>
            </span>
            <span className="meta-chip">
              Round <strong>{Math.max(userTurns, 1)}</strong>
            </span>
          </div>
        </div>

        <div className="debate-heading-side">
          {isActive && debate.endsAt && (
            <div
              className={`debate-countdown ${remainingSeconds !== null && remainingSeconds <= 60 ? 'urgent' : ''}`}
              role="timer"
              aria-label={`Time remaining ${formatTime(remainingSeconds ?? 0)}`}
            >
              <Clock3 size={16} />
              <span>Time remaining</span>
              <strong>{remainingSeconds === null ? '--:--' : formatTime(remainingSeconds)}</strong>
            </div>
          )}

          <span className={`debate-status ${debate.status.toLowerCase()}`}>
            {debate.status}
          </span>

        </div>
      </div>

      <div className="debate-mode-selector">
        <div className="debate-mode-heading">
          <span>DEBATE MODE</span>
          <p>Type your arguments, or speak them out loud in a live debate.</p>
        </div>

        <div
          className="debate-mode-buttons"
          data-mode={voiceMode ? 'voice' : 'text'}
        >
          <span className="mode-slider" aria-hidden="true" />

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
            disabled={debate.status !== 'ACTIVE' || openingLoading || timeExpired || endingDebate}
          >
            <Mic size={17} />
            {voiceMode ? 'Live Voice' : 'Voice Debate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="debate-room-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setError('')}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {voiceMode ? (
        <div className="voice-layout">
          <section
            className="voice-stage"
            ref={stageRef}
            data-phase={voicePhase}
          >
            <div className="voice-stage-top">
              <span className="live-pill">
                <i /> LIVE
              </span>
              <span className="voice-timer">{formatTime(voiceSeconds)}</span>
            </div>

            <div className="voice-orb-wrap">
              <span className="orb-ring ring-3" />
              <span className="orb-ring ring-2" />
              <span className="orb-ring ring-1" />

              <div className="orb-scale">
                <div className="voice-orb">
                  <PhaseIcon size={38} strokeWidth={1.6} />
                </div>
              </div>
            </div>

            <div className="voice-wave" aria-hidden="true">
              {WAVE_BARS.map((bar) => (
                <span
                  key={bar.i}
                  style={{ '--k': bar.k, '--i': bar.i }}
                />
              ))}
            </div>

            <div className="voice-phase" aria-live="polite">
              <h3>{phaseText.title}</h3>
              <p>{phaseText.hint}</p>
            </div>

            {lastMessage && (
              <div className="voice-caption" key={lastMessage._id || messages.length}>
                <span>
                  {lastMessage.role === 'USER' ? 'YOU' : 'DEBATEAI'}
                </span>
                <p>
                  {lastMessage.role === 'AI'
                    ? cleanAIText(lastMessage.content)
                    : lastMessage.content}
                </p>
              </div>
            )}

            <div className="voice-controls">
              <button
                type="button"
                className={`vc-btn ${micMuted ? 'is-off' : ''}`}
                onClick={toggleMute}
                aria-pressed={micMuted}
                title="Mute / unmute (M)"
              >
                <i className="vc-icon">
                  {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </i>
                <span>{micMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                type="button"
                className={`vc-btn ${!voiceEnabled ? 'is-off' : ''}`}
                onClick={toggleVoiceOutput}
                aria-pressed={!voiceEnabled}
              >
                <i className="vc-icon">
                  {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </i>
                <span>{voiceEnabled ? 'AI Voice' : 'Voice Off'}</span>
              </button>

              <button
                type="button"
                className="vc-btn"
                onClick={handlePlaybackButton}
                disabled={playbackDisabled}
              >
                <i className="vc-icon">
                  {voiceSpeaking && !voicePaused
                    ? <Pause size={19} />
                    : voicePaused
                      ? <Play size={19} />
                      : <RotateCcw size={19} />}
                </i>
                <span>
                  {voicePaused ? 'Resume' : voiceSpeaking ? 'Pause' : 'Replay'}
                </span>
              </button>

              <button
                type="button"
                className="vc-btn"
                onClick={stopSpeech}
                disabled={!voiceSpeaking && !voicePaused}
              >
                <i className="vc-icon">
                  <Square size={17} />
                </i>
                <span>Skip</span>
              </button>

              <button
                type="button"
                className="vc-btn vc-end"
                onClick={endVoiceDebate}
                title="Leave the voice session"
              >
                <i className="vc-icon">
                  <PhoneOff size={20} />
                </i>
                <span>Leave</span>
              </button>
            </div>

            <p className="voice-shortcut-hint">
              Press <kbd>M</kbd> to mute · Speak over the AI to interrupt
            </p>
          </section>

          <section className="voice-transcript">
            <div className="voice-transcript-header">
              <span>LIVE TRANSCRIPT</span>
              <small>{messages.length} {messages.length === 1 ? 'message' : 'messages'}</small>
            </div>

            {conversation}
          </section>
        </div>
      ) : (
        <>
          {conversation}

          {isActive && (
            <form
              className="debate-input-area"
              onSubmit={handleTextSubmit}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextChange}
                onKeyDown={handleTextKeyDown}
                placeholder="Present your argument..."
                rows={3}
                maxLength={3000}
                disabled={loading || openingLoading || timeExpired || endingDebate}
              />

              <div className="debate-input-footer">
                <div className="debate-input-meta">
                  <span className="char-count">
                    {message.length}/3000
                  </span>
                  <span className="input-hint">
                    <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
                  </span>
                </div>

                <button
                  type="submit"
                  className="send-argument-button"
                  disabled={loading || openingLoading || timeExpired || endingDebate || !message.trim()}
                >
                  {loading ? 'Thinking...' : 'Send Argument'}
                  <Send size={15} />
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {debate.status === 'COMPLETED' && (
        <p className="debate-completed-message">
          This debate has been completed.
        </p>
      )}

      {endingDebate && (
        <div className="debate-evaluating-overlay" role="status">
          <span className="evaluating-spinner" />
          <h3>Evaluating your debate</h3>
          <p>The judge is scoring both sides. This takes a few seconds.</p>
        </div>
      )}
    </div>
  );
}

export default DebateRoom;