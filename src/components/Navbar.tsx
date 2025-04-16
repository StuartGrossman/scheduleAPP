import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Schedule Manager
        </Link>
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/calendar" 
            className={`navbar-link ${location.pathname === '/calendar' ? 'active' : ''}`}
          >
            Calendar
          </Link>
          <Link 
            to="/estimates" 
            className={`navbar-link ${location.pathname === '/estimates' ? 'active' : ''}`}
          >
            Estimates
          </Link>
          <Link 
            to="/settings" 
            className={`navbar-link ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 