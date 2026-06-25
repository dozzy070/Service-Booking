// src/components/Layout/CustomerTopbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBars,
  FaBell,
  FaSearch,
  FaMoon,
  FaSun,
  FaUser,
  FaWallet,
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaCalendarCheck,
  FaStar,
  FaGift,
  FaClock,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';

const CustomerTopbar = ({
  toggleSidebar,
  theme,
  setTheme,
  notifications,
  unreadCount,
  loadingNotifications,
  markAsRead,
  markAllAsRead,
  walletBalance,
  user,
}) => {
  const { logout } = useAuth();
  const { isConnected } = useSocket();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notificationRef = useRef();
  const profileRef = useRef();

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      booking: { icon: FaCalendarCheck, color: '#6366f1' },
      payment: { icon: FaWallet, color: '#10b981' },
      review: { icon: FaStar, color: '#f59e0b' },
      promotion: { icon: FaGift, color: '#ec4899' },
      reminder: { icon: FaClock, color: '#3b82f6' },
    };
    const item = icons[type] || icons.booking;
    const Icon = item.icon;
    return <Icon style={{ color: item.color }} size={14} />;
  };

  const topbarStyles = `
    .customer-topbar {
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      min-height: 64px;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .menu-toggle {
      display: none;
      background: none;
      border: none;
      font-size: 20px;
      color: #4a5568;
      cursor: pointer;
      padding: 4px;
    }

    @media (max-width: 991px) {
      .menu-toggle {
        display: block;
      }
    }

    .page-info {
      display: flex;
      flex-direction: column;
    }

    .page-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
      line-height: 1.3;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: #f8fafc;
      border-radius: 50px;
      font-size: 12px;
      color: #4a5568;
      border: 1px solid #e2e8f0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.connected {
      background: #10b981;
      animation: pulse 2s infinite;
    }

    .status-dot.disconnected {
      background: #ef4444;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .icon-btn {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #4a5568;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: #f0f4f8;
    }

    .icon-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 50px;
      min-width: 18px;
      text-align: center;
    }

    .theme-toggle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #4a5568;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .theme-toggle:hover {
      background: #f0f4f8;
    }

    .dropdown-wrapper {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 340px;
      max-width: calc(100vw - 32px);
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      overflow: hidden;
      z-index: 1060;
    }

    .dropdown-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f4f8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdown-title {
      font-size: 15px;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
    }

    .dropdown-action {
      font-size: 12px;
      color: #6366f1;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    .dropdown-action:hover {
      text-decoration: underline;
    }

    .dropdown-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .dropdown-item {
      display: flex;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid #f0f4f8;
      cursor: pointer;
      transition: background 0.15s;
    }

    .dropdown-item:hover {
      background: #f8fafc;
    }

    .dropdown-item.unread {
      background: #f8faff;
    }

    .dropdown-item-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f0f4f8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 14px;
    }

    .dropdown-item-content {
      flex: 1;
      min-width: 0;
    }

    .dropdown-item-message {
      font-size: 14px;
      color: #1a202c;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dropdown-item-time {
      font-size: 12px;
      color: #a0aec0;
    }

    .dropdown-footer {
      padding: 12px 20px;
      border-top: 1px solid #f0f4f8;
      text-align: center;
    }

    .dropdown-footer-link {
      font-size: 14px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
    }

    .dropdown-footer-link:hover {
      text-decoration: underline;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .profile-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 12px 4px 4px;
      border-radius: 50px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .profile-btn:hover {
      background: #f0f4f8;
    }

    .profile-btn-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
    }

    .profile-btn-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.3;
    }

    .profile-btn-name {
      font-size: 14px;
      font-weight: 500;
      color: #1a202c;
    }

    .profile-btn-role {
      font-size: 11px;
      color: #a0aec0;
    }

    .profile-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 260px;
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      overflow: hidden;
      z-index: 1060;
    }

    .profile-dropdown-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #f0f4f8;
    }

    .profile-dropdown-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile-dropdown-name {
      font-size: 15px;
      font-weight: 600;
      color: #1a202c;
      margin: 0;
    }

    .profile-dropdown-email {
      font-size: 12px;
      color: #a0aec0;
    }

    .profile-dropdown-items {
      padding: 8px;
    }

    .profile-dropdown-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      color: #4a5568;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      font-family: inherit;
    }

    .profile-dropdown-link:hover {
      background: #f8fafc;
      color: #6366f1;
    }

    .dropdown-divider {
      height: 1px;
      background: #f0f4f8;
      margin: 4px 12px;
    }

    .book-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
    }

    .book-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(99,102,241,0.35);
      color: white;
    }

    /* Dark Theme */
    [data-theme="dark"] .customer-topbar {
      background: rgba(26, 32, 44, 0.9);
      border-bottom-color: #2d3748;
    }

    [data-theme="dark"] .page-title {
      color: #f1f5f9;
    }

    [data-theme="dark"] .dropdown-menu {
      background: #1a202c;
      border-color: #2d3748;
    }

    [data-theme="dark"] .dropdown-title {
      color: #f1f5f9;
    }

    [data-theme="dark"] .dropdown-item {
      border-bottom-color: #2d3748;
    }

    [data-theme="dark"] .dropdown-item-message {
      color: #f1f5f9;
    }

    [data-theme="dark"] .profile-dropdown {
      background: #1a202c;
      border-color: #2d3748;
    }

    [data-theme="dark"] .profile-dropdown-name {
      color: #f1f5f9;
    }

    [data-theme="dark"] .profile-dropdown-link {
      color: #a0aec0;
    }

    [data-theme="dark"] .profile-dropdown-link:hover {
      background: rgba(255,255,255,0.05);
      color: #8b5cf6;
    }

    [data-theme="dark"] .connection-status {
      background: #2d3748;
      border-color: #4a5568;
      color: #a0aec0;
    }

    [data-theme="dark"] .icon-btn {
      color: #a0aec0;
    }

    [data-theme="dark"] .icon-btn:hover {
      background: rgba(255,255,255,0.05);
    }

    [data-theme="dark"] .theme-toggle {
      color: #a0aec0;
    }

    [data-theme="dark"] .theme-toggle:hover {
      background: rgba(255,255,255,0.05);
    }

    [data-theme="dark"] .profile-btn {
      color: #a0aec0;
    }

    [data-theme="dark"] .profile-btn:hover {
      background: rgba(255,255,255,0.05);
    }

    [data-theme="dark"] .profile-btn-name {
      color: #f1f5f9;
    }

    @media (max-width: 768px) {
      .customer-topbar {
        padding: 8px 16px;
      }
      .profile-btn-info {
        display: none;
      }
      .book-btn span {
        display: none;
      }
      .book-btn {
        padding: 8px 14px;
      }
      .dropdown-menu {
        min-width: 300px;
        right: -40px;
      }
      .profile-dropdown {
        right: -20px;
      }
    }

    @media (max-width: 576px) {
      .customer-topbar {
        padding: 8px 12px;
      }
      .connection-status {
        display: none;
      }
      .dropdown-menu {
        min-width: 280px;
        right: -60px;
      }
    }
  `;

  return (
    <>
      <style>{topbarStyles}</style>
      <header className="customer-topbar">
        <div className="topbar-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="page-info">
            <h4 className="page-title">Customer Dashboard</h4>
          </div>
        </div>

        <div className="topbar-right">
          {/* Connection Status */}
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>

          {/* Notifications */}
          <div className="dropdown-wrapper" ref={notificationRef}>
            <button className="icon-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <FaBell />
              {unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}
            </button>

            {notificationsOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <h6 className="dropdown-title">Notifications</h6>
                  {unreadCount > 0 && (
                    <button className="dropdown-action" onClick={markAllAsRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="dropdown-list">
                  {loadingNotifications ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <FaBell size={32} style={{ color: '#e2e8f0', marginBottom: '8px' }} />
                      <p style={{ color: '#a0aec0', fontSize: '14px', margin: 0 }}>No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`dropdown-item ${!notif.is_read ? 'unread' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="dropdown-item-icon">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="dropdown-item-content">
                          <p className="dropdown-item-message">{notif.message}</p>
                          <span className="dropdown-item-time">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="dropdown-footer">
                    <Link to="/customer/notifications" className="dropdown-footer-link">
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="dropdown-wrapper" ref={profileRef}>
            <button className="profile-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <img
                src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 40)}
                alt={user?.name || 'Customer'}
                className="profile-btn-avatar"
                onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 40))}
              />
              <div className="profile-btn-info">
                <span className="profile-btn-name">{user?.name?.split(' ')[0] || 'Customer'}</span>
                <span className="profile-btn-role">Customer</span>
              </div>
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <img
                    src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 60)}
                    alt={user?.name || 'Customer'}
                    className="profile-dropdown-avatar"
                  />
                  <div>
                    <p className="profile-dropdown-name">{user?.name || 'Customer'}</p>
                    <p className="profile-dropdown-email">{user?.email || 'customer@servicehub.com'}</p>
                  </div>
                </div>
                <div className="profile-dropdown-items">
                  <Link to="/customer/profile" className="profile-dropdown-link">
                    <FaUser size={14} /> Profile
                  </Link>
                  <Link to="/customer/wallet" className="profile-dropdown-link">
                    <FaWallet size={14} /> Wallet: {formatNaira(walletBalance)}
                  </Link>
                  <Link to="/customer/settings" className="profile-dropdown-link">
                    <FaCog size={14} /> Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <Link to="/" className="profile-dropdown-link">
                    <FaHome size={14} /> Homepage
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="profile-dropdown-link" style={{ color: '#ef4444' }} onClick={handleLogout}>
                    <FaSignOutAlt size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Book Service Button */}
          <Link to="/services" className="book-btn">
            <FaSearch size={14} />
            <span>Book Service</span>
          </Link>
        </div>
      </header>
    </>
  );
};

export default CustomerTopbar;