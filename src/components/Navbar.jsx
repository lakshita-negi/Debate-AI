
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

function Navbar({ title, subtitle }) {
  const navigate = useNavigate();

  const handleNewDebate = () => {
    const token = localStorage.getItem('token');

    if (token) {
      navigate('/start-debate');
    } else {
      navigate('/login', {
        state: { from: '/start-debate' }
      });
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-heading">
        <span className="navbar-eyebrow">DEBATEAI / THE FORUM</span>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="navbar-actions">
        <span className="navbar-status">
          A SPACE FOR REASONED DISCUSSION
        </span>

        <button
          type="button"
          onClick={handleNewDebate}
          className="navbar-debate-link"
        >
          New Debate <ArrowUpRight size={14} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
