
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Shuffle } from 'lucide-react';
import './StartDebate.css';

const topics = [
  {
    category: 'TECHNOLOGY',
    title: 'Can artificial intelligence surpass human creativity?',
    description: 'Explore originality, innovation, and the limits of machine intelligence.'
  },
  {
    category: 'EDUCATION',
    title: 'Should higher education be free for everyone?',
    description: 'Consider equal opportunity, public responsibility, and educational quality.'
  },
  {
    category: 'SOCIETY',
    title: 'Has social media weakened human relationships?',
    description: 'Examine digital communication and its influence on real connections.'
  },
  {
    category: 'ETHICS',
    title: 'Should personal privacy outweigh public security?',
    description: 'Discuss individual freedom, surveillance, and collective safety.'
  },
  {
    category: 'ENVIRONMENT',
    title: 'Should governments prioritise the environment over economic growth?',
    description: 'Weigh sustainability against development and economic interests.'
  },
  {
    category: 'POLITICS',
    title: 'Is democracy the most effective form of government?',
    description: 'Question representation, accountability, and alternative systems.'
  }
];

const categories = [
  'ALL TOPICS',
  'TECHNOLOGY',
  'EDUCATION',
  'SOCIETY',
  'ETHICS',
  'ENVIRONMENT',
  'POLITICS'
];

function StartDebate() {
  const navigate = useNavigate();

  const [category, setCategory] = useState('ALL TOPICS');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [position, setPosition] = useState('random');
  const [difficulty, setDifficulty] = useState('intermediate');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredTopics = category === 'ALL TOPICS'
    ? topics
    : topics.filter(topic => topic.category === category);

  const activeTopic = customTopic.trim() || selectedTopic;

  const handleCustomTopic = (value) => {
    setCustomTopic(value);
    setSelectedTopic('');
    setError('');
  };

  const handleStartDebate = async () => {
    if (!activeTopic || loading) return;

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', {
        state: { from: '/start-debate' }
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/debates/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: activeTopic,
          position,
          difficulty
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to start the debate.');
      }

      navigate('/debate-room', {
        state: {
          debate: data.debate
        }
      });

    } catch (error) {
      console.error('Start debate error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-debate-page">
      <section className="debate-intro">
        <div>
          <span className="debate-eyebrow">THE FORUM OF IDEAS / 01</span>
          <h1>Choose a question worth <em>exploring.</em></h1>
          <p>
            Every meaningful argument begins with a question.
            Select a subject, decide your position, and prepare
            to challenge your thinking.
          </p>
        </div>

        <div className="debate-intro-note">
          <span>YOUR NEXT CHALLENGE</span>
          <strong>A conversation with an AI opponent.</strong>
        </div>
      </section>

      <section className="topic-selection-section">
        <div className="debate-section-heading">
          <div>
            <span className="debate-eyebrow">01 / SELECT A SUBJECT</span>
            <h2>What shall we discuss?</h2>
          </div>
          <span className="debate-step">STEP 01 OF 03</span>
        </div>

        <div className="topic-filters">
          {categories.map(item => (
            <button
              key={item}
              type="button"
              className={category === item ? 'topic-filter active' : 'topic-filter'}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="debate-topic-grid">
          {filteredTopics.map((topic, index) => (
            <button
              type="button"
              key={topic.title}
              className={`debate-topic-card ${
                selectedTopic === topic.title ? 'selected' : ''
              }`}
              onClick={() => {
                setSelectedTopic(topic.title);
                setCustomTopic('');
                setError('');
              }}
            >
              <div className="topic-card-top">
                <span>{String(index + 1).padStart(2, '0')}</span>
                {selectedTopic === topic.title && (
                  <span className="topic-check">
                    <Check size={14} />
                  </span>
                )}
              </div>

              <span className="topic-category">{topic.category}</span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </button>
          ))}
        </div>

        <div className="custom-topic">
          <label htmlFor="custom-topic">HAVE ANOTHER SUBJECT IN MIND?</label>
          <input
            id="custom-topic"
            type="text"
            placeholder="Enter your own debate topic..."
            value={customTopic}
            onChange={event => handleCustomTopic(event.target.value)}
            maxLength={200}
          />
        </div>
      </section>

      <section className="debate-preferences-section">
        <div className="debate-section-heading">
          <div>
            <span className="debate-eyebrow">02 / DEFINE YOUR POSITION</span>
            <h2>Which side will you take?</h2>
          </div>
          <span className="debate-step">STEP 02 OF 03</span>
        </div>

        <div className="position-options">
          <button
            type="button"
            className={position === 'for' ? 'position-option active' : 'position-option'}
            onClick={() => setPosition('for')}
          >
            <span className="position-number">01</span>
            <strong>In favour</strong>
            <p>Defend and support the statement.</p>
          </button>

          <button
            type="button"
            className={position === 'against' ? 'position-option active' : 'position-option'}
            onClick={() => setPosition('against')}
          >
            <span className="position-number">02</span>
            <strong>Against</strong>
            <p>Challenge and oppose the statement.</p>
          </button>

          <button
            type="button"
            className={position === 'random' ? 'position-option active' : 'position-option'}
            onClick={() => setPosition('random')}
          >
            <span className="position-number">03</span>
            <strong>Surprise me</strong>
            <p><Shuffle size={13} /> Let the system assign your position.</p>
          </button>
        </div>
      </section>

      <section className="difficulty-section">
        <div className="debate-section-heading">
          <div>
            <span className="debate-eyebrow">03 / SET YOUR CHALLENGE</span>
            <h2>Choose your level.</h2>
          </div>
          <span className="debate-step">STEP 03 OF 03</span>
        </div>

        <div className="difficulty-options">
          {[
            {
              value: 'beginner',
              title: 'Beginner',
              description: 'Build confidence with straightforward arguments.'
            },
            {
              value: 'intermediate',
              title: 'Intermediate',
              description: 'Explore complex ideas and opposing perspectives.'
            },
            {
              value: 'advanced',
              title: 'Advanced',
              description: 'Face rigorous reasoning and challenging rebuttals.'
            }
          ].map(level => (
            <button
              type="button"
              key={level.value}
              className={difficulty === level.value ? 'difficulty-option active' : 'difficulty-option'}
              onClick={() => setDifficulty(level.value)}
            >
              <span className="difficulty-radio">
                {difficulty === level.value && <span />}
              </span>
              <span>
                <strong>{level.title}</strong>
                <small>{level.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="debate-launch">
        <div>
          <span className="debate-eyebrow">READY WHEN YOU ARE</span>
          <h2>Your next exchange of ideas awaits.</h2>
          <p>
            Choose your subject and preferences to begin.
            Your AI opponent will be ready to challenge your reasoning.
          </p>
        </div>

        <button
          type="button"
          className="launch-debate-button"
          onClick={handleStartDebate}
          disabled={!activeTopic || loading}
        >
          {loading ? 'Preparing Debate...' : 'Start Debate'}
          {!loading && <ArrowRight size={17} />}
        </button>
      </section>

      {error && (
        <p className="debate-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default StartDebate;
