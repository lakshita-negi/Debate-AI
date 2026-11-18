
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRound,
  Mail,
  CalendarDays,
  ShieldCheck,
  Trophy,
  Target,
  BookOpen,
  Clock,
  Pencil,
  Check,
  X,
  ArrowUpRight,
  Activity,
  Award
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatDate = (date) => {
  if (!date) return 'Not available';

  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [recentDebates, setRecentDebates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Please login to view your profile.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load profile.');
      }

      setUser(data.user);
      setName(data.user.name);
      setStats(data.stats);
      setPerformance(data.performance || []);
      setRecentDebates(data.recentDebates || []);

      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email
        })
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile.');
      }

      setUser(data.user);
      setName(data.user.name);

      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email
        })
      );

      setEditing(false);
      setSuccess('Your profile has been updated.');

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openDebate = (debate) => {
    navigate('/debate-room', {
      state: {
        debate
      }
    });
  };

  if (loading) {
    return (
      <div className="page-content profile-page">
        <p className="profile-message">Loading your profile...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="page-content profile-page">
        <p className="profile-message profile-error">{error}</p>
      </div>
    );
  }

  const memberSince = formatDate(user?.createdAt);

  return (
    <div className="page-content profile-page">

      <section className="profile-intro">
        <span className="profile-eyebrow">YOUR ACCOUNT</span>
        <h1>Personal Profile</h1>
        <p>
          Your space to reflect on your progress, understand your
          strengths, and continue growing as a thoughtful debater.
        </p>
      </section>

      {error && (
        <div className="profile-notice profile-notice-error">
          {error}
        </div>
      )}

      {success && (
        <div className="profile-notice profile-notice-success">
          {success}
        </div>
      )}

      <section className="profile-details">

        <div className="profile-identity">
          <div className="profile-large-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="profile-identity-content">
            <span className="profile-eyebrow">DEBATEAI MEMBER</span>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>

          <button
            className="profile-edit-button"
            onClick={() => {
              setName(user.name);
              setEditing(!editing);
              setError('');
              setSuccess('');
            }}
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        </div>

        {editing && (
          <form
            className="profile-edit-form"
            onSubmit={handleUpdateProfile}
          >
            <label htmlFor="profile-name">Full Name</label>

            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              required
            />

            <div className="profile-edit-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={saving}
              >
                <Check size={15} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                className="profile-cancel-button"
                onClick={() => {
                  setEditing(false);
                  setName(user.name);
                  setError('');
                }}
              >
                <X size={15} />
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="profile-divider" />

        <div className="profile-information">

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <UserRound size={18} />
            </div>
            <div>
              <span>Full Name</span>
              <p>{user?.name}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <Mail size={18} />
            </div>
            <div>
              <span>Email Address</span>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <CalendarDays size={18} />
            </div>
            <div>
              <span>Member Since</span>
              <p>{memberSince}</p>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span>Account Status</span>
              <p>Active</p>
            </div>
          </div>

        </div>
      </section>

      <section className="profile-statistics-section">
        <div className="profile-section-heading">
          <div>
            <span className="profile-eyebrow">YOUR PROGRESS</span>
            <h2>Debate Statistics</h2>
            <p>A look at your journey and overall performance.</p>
          </div>
        </div>

        <div className="profile-statistics-grid">

          <div className="profile-stat-card">
            <div className="profile-stat-top">
              <span>Total Debates</span>
              <BookOpen size={19} />
            </div>
            <strong>{stats?.totalDebates ?? 0}</strong>
            <small>All your debate sessions</small>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-top">
              <span>Victories</span>
              <Trophy size={19} />
            </div>
            <strong>{stats?.wins ?? 0}</strong>
            <small>Debates won against AI</small>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-top">
              <span>Average Score</span>
              <Target size={19} />
            </div>
            <strong>{stats?.averageScore ?? 0}<small>/10</small></strong>
            <small>Across completed debates</small>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-top">
              <span>Win Rate</span>
              <Award size={19} />
            </div>
            <strong>{stats?.winRate ?? 0}<small>%</small></strong>
            <small>Of completed debates</small>
          </div>

        </div>

        <div className="profile-result-summary">
          <div>
            <span className="profile-result-number">
              {stats?.completedDebates ?? 0}
            </span>
            <span>Completed</span>
          </div>

          <div>
            <span className="profile-result-number">
              {stats?.activeDebates ?? 0}
            </span>
            <span>In Progress</span>
          </div>

          <div>
            <span className="profile-result-number">
              {stats?.losses ?? 0}
            </span>
            <span>AI Victories</span>
          </div>

          <div>
            <span className="profile-result-number">
              {stats?.draws ?? 0}
            </span>
            <span>Draws</span>
          </div>
        </div>
      </section>


      <section className="profile-performance-section">
        <div className="profile-section-heading">
          <div>
            <span className="profile-eyebrow">YOUR EVALUATION</span>
            <h2>Performance Breakdown</h2>
            <p>
              Discover where you excel and where you can continue improving.
            </p>
          </div>
        </div>

        <div className="profile-performance-list">
          <div className="profile-performance-header">
            <span>DEBATE CRITERIA</span>
            <span>AVERAGE SCORE</span>
          </div>

          {performance.map((criterion, index) => (
            <div className="profile-performance-item" key={criterion.key}>
              <div className="profile-performance-info">
                <span className="profile-performance-number">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div>
                  <h3>{criterion.label}</h3>
                  <p>
                    {[
                      'Strength and structure of your arguments',
                      'Use of supporting facts and examples',
                      'Ability to challenge opposing arguments',
                      'Clarity and effectiveness of communication',
                      'Logical thinking and topic relevance'
                    ][index]}
                  </p>
                </div>
              </div>

              <div className="profile-performance-score">
                <strong>{Number(criterion.average).toFixed(1)}</strong>
                <span>/ 10</span>
              </div>
            </div>
          ))}

          {performance.length === 0 && (
            <p className="profile-message">
              Complete a debate to see your performance breakdown.
            </p>
          )}
        </div>
      </section>


      <section className="profile-recent-section">
        <div className="profile-section-heading">
          <div>
            <span className="profile-eyebrow">YOUR ACTIVITY</span>
            <h2>Recent Debates</h2>
            <p>Revisit your latest debate sessions and evaluations.</p>
          </div>

          <button
            className="profile-view-all"
            onClick={() => navigate('/my-debates')}
          >
            View All Debates
            <ArrowUpRight size={16} />
          </button>
        </div>

        {recentDebates.length > 0 ? (
          <div className="profile-recent-list">
            {recentDebates.map((debate, index) => (
              <div className="profile-recent-item" key={debate._id}>
                <span className="profile-recent-number">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="profile-recent-content">
                  <h3>{debate.topic}</h3>

                  <div className="profile-recent-meta">
                    <span>{debate.position}</span>
                    <span>{debate.difficulty}</span>
                    <span>{formatDate(debate.updatedAt)}</span>
                  </div>
                </div>

                <div className="profile-recent-result">
                  {debate.status === 'COMPLETED' ? (
                    <>
                      <span className={`profile-result-badge ${debate.winner === 'USER'
                          ? 'profile-result-win'
                          : debate.winner === 'AI'
                            ? 'profile-result-loss'
                            : 'profile-result-draw'
                        }`}>
                        {debate.winner === 'USER'
                          ? 'Won'
                          : debate.winner === 'AI'
                            ? 'Lost'
                            : 'Draw'}
                      </span>
                      <strong>{debate.userScore?.toFixed(1) ?? '—'}/10</strong>
                    </>
                  ) : (
                    <span className="profile-result-badge profile-result-active">
                      In Progress
                    </span>
                  )}
                </div>

                <button
                  className="profile-recent-open"
                  onClick={() => openDebate(debate)}
                  aria-label="Open debate"
                >
                  <ArrowUpRight size={17} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="profile-empty">
            <Activity size={27} />
            <h3>Your journey starts here</h3>
            <p>
              You haven't started a debate yet. Begin your first session
              and your activity will appear here.
            </p>
            <button
              className="profile-start-button"
              onClick={() => navigate('/start-debate')}
            >
              Start Your First Debate
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

export default Profile;
