
import { NavLink, useNavigate } from 'react-router-dom';
import {
  House,
  Plus,
  BookOpen,
  UserRound,
  LogOut
} from 'lucide-react';

const menuItems = [
  { name: 'Home', path: '/', icon: House },
  { name: 'Start a Debate', path: '/start-debate', icon: Plus },
  { name: 'My Debates', path: '/my-debates', icon: BookOpen },
  { name: 'Profile', path: '/profile', icon: UserRound }
];

function Sidebar() {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = token
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <LinkLogo />

      <div className="sidebar-menu">
        <p className="menu-label">NAVIGATION</p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              to={item.path}
              key={item.name}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} strokeWidth={1.5} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {token && user && (
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {user.name?.charAt(0).toUpperCase() || 'D'}
            </div>

            <div className="sidebar-profile-info">
              <h4>{user.name}</h4>
              <p>{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}

function LinkLogo() {
  return (
    <div className="sidebar-logo">
      <span>DebateAI.</span>
      <small>THE ART OF REASON</small>
    </div>
  );
}

export default Sidebar;
