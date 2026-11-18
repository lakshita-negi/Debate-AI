import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import './Login.css';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const destination = location.state?.from || '/';

      navigate(destination, { replace: true });

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
            <span className="login-eyebrow">WELCOME BACK</span>
            <h1>Every great argument begins with a thought.</h1>
            <p>
              Continue your journey towards clearer thinking,
              stronger arguments and more meaningful discussions.
            </p>
          </div>

          {location.state?.message && (
            <div className="login-alert success" role="status">
              <CheckCircle2 size={17} />
              <span>{location.state.message}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="login-signup">
            Don't have an account?
            <Link to="/signup"> Create an account</Link>
          </p>
        </div>

        <p className="login-copyright">
          © 2026 DebateAI. A space for reasoned discussion.
        </p>
      </section>

      <section className="login-editorial-section">
        <div className="editorial-topline">
          <span>THE ART OF REASON</span>
          <span>01 — 03</span>
        </div>

        <div className="editorial-content">
          <span className="editorial-mark">“</span>

          <h2>
            The strength of an argument lies not in how loudly it is
            spoken, but in how thoughtfully it is built.
          </h2>

          <div className="editorial-divider" />

          <p>
            Question your assumptions. Examine different perspectives.
            Learn to make every word count.
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

export default Login;