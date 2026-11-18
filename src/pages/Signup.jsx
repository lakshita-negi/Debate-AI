import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserRound,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import './Login.css';

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

const getPasswordStrength = (value) => {
  let score = 0;

  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  return score;
};

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDiffer = confirmPassword.length > 0 && password !== confirmPassword;

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

              <div className="login-input">
                <UserRound size={17} className="field-icon" />
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
            </div>

            <div className="login-field">
              <label htmlFor="email">Email address</label>

              <div className="login-input">
                <Mail size={17} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-input password-input-wrapper">
                <Lock size={17} className="field-icon" />
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

              {password.length > 0 && (
                <div className="password-strength" aria-live="polite">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={strength >= level ? `on level-${strength}` : ''}
                      />
                    ))}
                  </div>
                  <span className="strength-label">
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div className="login-input">
                <Lock size={17} className="field-icon" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={passwordsDiffer ? 'invalid' : ''}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {passwordsMatch && (
                <span className="field-hint ok">
                  <CheckCircle2 size={14} /> Passwords match
                </span>
              )}

              {passwordsDiffer && (
                <span className="field-hint bad">
                  <AlertCircle size={14} /> Passwords do not match yet
                </span>
              )}
            </div>

            {error && (
              <div className="login-alert error" role="alert">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading && <span className="login-spinner" />}
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