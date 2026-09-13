import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/listings', label: 'Listings' },
    { path: '/rentals', label: 'Rentals' },
    { path: '/projects', label: 'Projects' },
    { path: '/saved', label: '♥ Saved' },
    { path: '/insights', label: 'Insights' },
  ];

  if (!isAuthenticated) return null;

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/listings" className="logo">
          <div className="logo-icon">🏠</div>
          <span>Ivy Homes</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={toggleTheme} 
            title="Toggle Theme"
            style={{ borderRadius: '50%', padding: 4 }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="user-menu">
            <div className="user-avatar">
              {user?.email?.[4]?.toUpperCase() || 'U'}
            </div>
            <span className="hide-mobile">{user?.email?.split('@')[0]}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
