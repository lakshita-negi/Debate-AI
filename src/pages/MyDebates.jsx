
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Clock3, MessageSquare, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function MyDebates() {
  const navigate = useNavigate();

  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDebates = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/debates/my-debates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load your debates.');
      }

      setDebates(data.debates || []);

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebates();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const openDebate = (debate) => {
    navigate('/debate-room', {
      state: { debate }
    });
  };

  if (loading) {
    return (
      <div className="my-debates-state">
        <p>Loading your debate history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-debates-state">
        <p className="my-debates-error">{error}</p>

        <button onClick={fetchDebates} className="history-retry-button">
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="my-debates-page">
      <div className="my-debates-intro">
        <div>
          <span className="section-eyebrow">YOUR DEBATE JOURNAL</span>
          <h2>Every argument is a step forward.</h2>
          <p>
            Revisit your discussions, review your positions,
            and continue sharpening your reasoning.
          </p>
        </div>

        <button
          className="history-new-debate"
          onClick={() => navigate('/start-debate')}
        >
          Start New Debate
          <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="history-summary">
        <div>
          <span className="history-count">{debates.length}</span>
          <span className="history-count-label">TOTAL DEBATES</span>
        </div>

        <p>
          Your personal record of discussions and arguments.
        </p>
      </div>

      {debates.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <MessageSquare size={23} strokeWidth={1.4} />
          </div>

          <h3>Your debate journal is waiting.</h3>

          <p>
            You haven't started a debate yet. Choose a topic
            and begin building your argumentation skills.
          </p>

          <button onClick={() => navigate('/start-debate')}>
            Start Your First Debate
            <ArrowUpRight size={15} />
          </button>
        </div>
      ) : (
        <div className="history-list">
          {debates.map((debate, index) => (
            <article className="history-item" key={debate._id}>
              <div className="history-item-number">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="history-item-content">
                <div className="history-item-top">
                  <span className="history-topic-label">
                    DEBATE {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className={`history-status ${debate.status?.toLowerCase()}`}>
                    {debate.status}
                  </span>
                </div>

                <h3>{debate.topic}</h3>

                <div className="history-item-details">
                  <span>
                    POSITION: <strong>{debate.position}</strong>
                  </span>

                  <span>
                    LEVEL: <strong>{debate.difficulty}</strong>
                  </span>

                  <span>
                    <Clock3 size={13} />
                    {formatDate(debate.updatedAt || debate.createdAt)}
                  </span>
                </div>
              </div>

              <button
                className="history-open-button"
                onClick={() => openDebate(debate)}
                aria-label={`Open debate: ${debate.topic}`}
              >
                <ArrowUpRight size={19} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyDebates;
