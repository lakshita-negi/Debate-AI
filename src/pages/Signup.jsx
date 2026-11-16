
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import './Login.css';

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/login', {
        replace: true,
        state: {
          message: 'Your account has been created successfully. Please sign in.'
        }
      });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-form-section">
        <Link to="/" className="login-logo">
          DebateAI<span>.</span>
        </Link>

        <div className="login-content">
          <div className="login-heading">
            <span className="login-eyebrow">BEGIN YOUR JOURNEY</span>
            <h1>A new perspective begins with a question.</h1>
            <p>
              Create your account and start developing clearer thoughts,
              stronger arguments and better reasoning.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Enter your password again"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p role="alert" style={{ color: '#B04757', fontSize: '14px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="login-signup">
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </p>
        </div>

        <p className="login-copyright">
          © 2026 DebateAI. A space for reasoned discussion.
        </p>
      </section>

      <section className="login-editorial-section">
        <div className="editorial-topline">
          <span>THE ART OF REASON</span>
          <span>02 — 03</span>
        </div>

        <div className="editorial-content">
          <span className="editorial-mark">“</span>

          <h2>
            A thoughtful mind is never afraid to question,
            reconsider and grow.
          </h2>

          <div className="editorial-divider" />

          <p>
            Every discussion is an opportunity to discover
            something beyond your own perspective.
          </p>
        </div>

        <div className="editorial-bottom">
          <span>THINK CLEARLY.</span>
          <span>ARGUE THOUGHTFULLY.</span>
          <span>GROW CONSTANTLY.</span>
        </div>
      </section>
    </div>
  );
}

export default Signup;
