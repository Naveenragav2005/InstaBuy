import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { token, logout } = useAuth();

  // Decode JWT to extract username
  const username = useMemo(() => {
    if (!token) return 'User';
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.sub || decoded.username || 'User';
    } catch {
      return 'User';
    }
  }, [token]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
            <rect width="32" height="32" rx="8" fill="url(#nav-grad)" />
            <path d="M10 13L16 9L22 13V19L16 25L10 19V13Z" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M16 9V25" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="nav-grad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span>InstaBuy</span>
        </div>
        <div className="nav-actions">
          <div className="nav-user">
            <div className="avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="nav-username">{username}</span>
          </div>
          <button onClick={logout} className="btn-logout" id="logout-btn">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>{getGreeting()}, <span className="highlight">{username}</span></h1>
            <p>Welcome to your InstaBuy dashboard. Here's what's happening today.</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orders-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Orders</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon wishlist-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Wishlist</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cart-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">0</span>
              <span className="stat-label">Cart Items</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon account-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">Active</span>
              <span className="stat-label">Account Status</span>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Browse Products</span>
            </button>
            <button className="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span>Payment Methods</span>
            </button>
            <button className="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
