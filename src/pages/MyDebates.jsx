import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Clock3,
  MessageSquare,
  RefreshCw,
  Search,
  Trophy,
  Activity,
  CheckCircle2,
  Target,
  ArrowDownUp,
  X
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' }
];

function MyDebates() {
  const navigate = useNavigate();

  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('ALL');
  const [newestFirst, setNewestFirst] = useState(true);

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

  const stats = useMemo(() => {
    const completed = debates.filter((item) => item.status === 'COMPLETED');
    const active = debates.filter((item) => item.status === 'ACTIVE');
    const wins = completed.filter((item) => item.winner === 'USER');
    const scored = completed.filter((item) => typeof item.userScore === 'number');

    const average = scored.length
      ? scored.reduce((sum, item) => sum + item.userScore, 0) / scored.length
      : null;

    return {
      total: debates.length,
      active: active.length,
      completed: completed.length,
      wins: wins.length,
      average
    };
  }, [debates]);

  const visibleDebates = useMemo(() => {
    const term = query.trim().toLowerCase();

    return debates
      .filter((item) => tab === 'ALL' || item.status === tab)
      .filter((item) => !term || item.topic?.toLowerCase().includes(term))
      .sort((a, b) => {
        const first = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const second = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return newestFirst ? second - first : first - second;
      });
  }, [debates, query, tab, newestFirst]);

  const tabCount = (key) => {
    if (key === 'ALL') return stats.total;
    if (key === 'ACTIVE') return stats.active;
    return stats.completed;
  };

  if (loading) {
    return (
      <div className="my-debates-page" aria-busy="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />

        <div className="history-stats">
          {[0, 1, 2, 3].map((item) => (
            <div className="skeleton skeleton-stat" key={item} />
          ))}
        </div>

        <div className="history-list">
          {[0, 1, 2].map((item) => (
            <div className="skeleton skeleton-row" key={item} />
          ))}
        </div>
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

      <div className="history-stats">
        <div className="history-stat">
          <span className="history-stat-icon"><MessageSquare size={18} /></span>
          <div>
            <strong>{stats.total}</strong>
            <span>Total debates</span>
          </div>
        </div>

        <div className="history-stat">
          <span className="history-stat-icon"><Activity size={18} /></span>
          <div>
            <strong>{stats.active}</strong>
            <span>In progress</span>
          </div>
        </div>

        <div className="history-stat">
          <span className="history-stat-icon"><Trophy size={18} /></span>
          <div>
            <strong>{stats.wins}</strong>
            <span>Victories</span>
          </div>
        </div>

        <div className="history-stat">
          <span className="history-stat-icon"><Target size={18} /></span>
          <div>
            <strong>
              {stats.average === null ? '—' : stats.average.toFixed(1)}
            </strong>
            <span>Average score</span>
          </div>
        </div>
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
        <>
          <div className="history-toolbar">
            <div className="history-tabs" role="tablist">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  className={tab === item.key ? 'history-tab active' : 'history-tab'}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                  <em>{tabCount(item.key)}</em>
                </button>
              ))}
            </div>

            <div className="history-toolbar-right">
              <div className="history-search">
                <Search size={15} />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search debates"
                  aria-label="Search debates"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="history-sort"
                onClick={() => setNewestFirst(!newestFirst)}
              >
                <ArrowDownUp size={14} />
                {newestFirst ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>

          {visibleDebates.length === 0 ? (
            <div className="history-no-results">
              <Search size={22} />
              <h3>No debates match your filters</h3>
              <p>Try a different search term or switch the status tab.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setTab('ALL');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="history-list">
              {visibleDebates.map((debate, index) => {
                const completed = debate.status === 'COMPLETED';

                const result =
                  debate.winner === 'USER'
                    ? { label: 'Won', className: 'win' }
                    : debate.winner === 'AI'
                      ? { label: 'Lost', className: 'loss' }
                      : { label: 'Draw', className: 'draw' };

                return (
                  <article
                    className="history-item"
                    key={debate._id}
                    style={{ '--i': index }}
                  >
                    <div className="history-item-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="history-item-content">
                      <div className="history-item-top">
                        <span className="history-topic-label">
                          DEBATE {String(index + 1).padStart(2, '0')}
                        </span>

                        <span className={`history-status ${debate.status?.toLowerCase()}`}>
                          {completed
                            ? <CheckCircle2 size={11} />
                            : <span className="history-live-dot" />}
                          {completed ? 'Completed' : 'In progress'}
                        </span>

                        {completed && (
                          <span className={`history-result ${result.className}`}>
                            {result.label}
                          </span>
                        )}
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

                    {completed && typeof debate.userScore === 'number' && (
                      <div className="history-score" title="Your score">
                        <strong>{debate.userScore.toFixed(1)}</strong>
                        <span>/10</span>
                      </div>
                    )}

                    <button
                      className="history-open-button"
                      onClick={() => openDebate(debate)}
                      aria-label={`Open debate: ${debate.topic}`}
                    >
                      <span>{completed ? 'View results' : 'Continue'}</span>
                      <ArrowUpRight size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyDebates;