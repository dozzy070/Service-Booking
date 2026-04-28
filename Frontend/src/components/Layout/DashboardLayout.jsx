// src/components/Layout/DashboardLayout.jsx (Provider Layout)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Image, Badge } from 'react-bootstrap';
import {
  FaBars, FaTimes, FaBell, FaSignOutAlt,
  FaTachometerAlt, FaCalendarCheck, FaUser, FaCog,
  FaComments, FaStar,
  FaAngleLeft, FaAngleRight,
  FaHome, FaSearch, FaCreditCard, FaWallet,
  FaGift, FaClock, FaCheckCircle, FaTimesCircle,
  FaExclamationCircle, FaRocket, FaShieldAlt,
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaGlobe,
  FaShoppingBag, FaHistory, FaQuestionCircle,
  FaFileAlt, FaServicestack, FaPlus,
  FaMoon, FaSun, FaLanguage, FaPalette,
  FaMoneyBillWave, FaDollarSign,
  FaUserTie, FaUserCircle, FaUserCheck,
  FaEdit, FaTrash, FaEye,
  FaChartLine, FaChartBar, FaAward,
  FaCrown, FaGem
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

// Helper to map notification type to icon
const getNotificationIcon = (type) => {
  switch (type) {
    case 'booking':
      return <FaCalendarCheck className="text-success" />;
    case 'payment':
      return <FaMoneyBillWave className="text-info" />;
    case 'review':
      return <FaStar className="text-warning" />;
    default:
      return <FaBell className="text-secondary" />;
  }
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef();
  const profileRef = useRef();
  const pollingInterval = useRef(null);

  // Helper to get the auth token (adjust to your storage method)
  const getAuthToken = () => {
    // Option 1: From AuthContext user object (if your context provides token)
    if (user?.token) return user.token;
    // Option 2: From localStorage (common pattern)
    const storedToken = localStorage.getItem('token');
    if (storedToken) return storedToken;
    // Option 3: From cookies (if using httpOnly, you may need a different approach)
    return null;
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      // No token, cannot fetch. Keep empty state.
      return;
    }

    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Unauthorized – clear polling to avoid spamming
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
        console.warn('Unauthorized – notifications polling stopped');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      // Expected format: { notifications: [...], unreadCount: number } or just array
      let fetchedNotifications = Array.isArray(data) ? data : data.notifications || [];
      let fetchedUnreadCount = data.unreadCount !== undefined 
        ? data.unreadCount 
        : fetchedNotifications.filter(n => !n.read).length;
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Silent fail – no spinner, no user disruption
    }
  }, [user?.token]);

  // Mark all notifications as read (when dropdown opens)
  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Refetch to update UI
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [unreadCount, fetchNotifications]);

  // Handle opening notification dropdown – mark as read
  const handleNotificationsOpen = async () => {
    setNotificationsOpen(true);
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  };

  // Set up polling for real-time updates (every 15 seconds)
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Start polling only if we have a token
    const token = getAuthToken();
    if (token) {
      pollingInterval.current = setInterval(fetchNotifications, 15000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchNotifications]);

  // Handle click outside
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

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setCollapsed(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${searchQuery}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // ✅ MAIN NAVIGATION ITEMS ONLY - NO SUBMENUS
  const navItems = [
    {
      path: '/provider/dashboard',
      label: 'Dashboard',
      icon: <FaTachometerAlt />,
      description: 'Overview & stats',
      color: '#10b981'
    },
    {
      path: '/provider/my-services',
      icon: <FaServicestack />,
      label: 'My Services',
      description: 'Manage your services',
      color: '#48bb78',
      badge: 5 // Number of services (could be dynamic)
    },
    {
      path: '/provider/bookings',
      label: 'Bookings',
      icon: <FaCalendarCheck />,
      description: 'Manage appointments',
      color: '#f59e0b'
    },
    {
      path: '/provider/wallet',
      label: 'Wallet',
      icon: <FaWallet />,
      description: 'Balance & payouts',
      color: '#14b8a6'
    },
    {
      path: '/provider/reviews',
      label: 'Reviews',
      icon: <FaStar />,
      description: 'Customer feedback',
      color: '#f59e0b'
    },
    {
      path: '/provider/chat',
      icon: <FaComments />,
      label: 'Messages',
      description: 'Chat with customers',
      color: '#8b5cf6',
      badge: 2 // Unread count (could be dynamic)
    },
    {
      path: '/provider/profile',
      label: 'Profile',
      icon: <FaUser />,
      description: 'Manage account',
      color: '#6b7280'
    },
    {
      path: '/provider/settings',
      label: 'Settings',
      icon: <FaCog />,
      description: 'Preferences',
      color: '#718096'
    },
    {
      path: '/provider/help',
      label: 'Help Center',
      icon: <FaQuestionCircle />,
      description: 'Support & guides',
      color: '#9ca3af'
    }
  ];

  // Provider tier for display
  const providerTier = 'Professional';

  return (
    <div className={`provider-layout theme-${theme}`}>
      {/* SIDEBAR - unchanged */}
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/provider/dashboard" className="brand">
            <span className="brand-icon">🔧</span>
            {!collapsed && (
              <span className="brand-text">
                Provider<span className="text-primary">Panel</span>
              </span>
            )}
          </Link>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <FaTimes />
          </button>
        </div>

        {/* Provider Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar-wrapper">
            <Image
              src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 80)}
              alt={user?.name}
              className="profile-avatar"
              roundedCircle
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 80))}
            />
            <span className="status online"></span>
          </div>

          {!collapsed && (
            <div className="profile-info">
              <h5 className="profile-name">{user?.name || 'Provider'}</h5>
              <Badge bg="success" className="profile-tier">
                <FaCrown className="me-1" size={10} /> {providerTier}
              </Badge>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && setMobileOpen(false)}
            >
              <span className="nav-icon" style={{ color: item.color }}>
                {item.icon}
              </span>

              {!collapsed && (
                <div className="nav-text">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <Link to="/" className="footer-link">
            <FaHome className="footer-icon" />
            {!collapsed && <span>Back to Home</span>}
          </Link>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="footer-icon" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        {!mobileOpen && window.innerWidth >= 992 && (
          <button className="collapse-toggle" onClick={toggleSidebar}>
            {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <FaBars />
            </button>

            <div className="page-info">
              <h4 className="page-title">
                {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h4>
              <span className="page-path">{location.pathname}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Search Toggle */}
            <button
              className="search-toggle d-lg-none"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <FaSearch />
            </button>

            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* Notifications - Real-time */}
            <div className="notifications-wrapper" ref={notificationRef}>
              <button
                className="notification-btn"
                onClick={handleNotificationsOpen}
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h6>Notifications</h6>
                    <span>{unreadCount} new</span>
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-item">
                        <div className="notification-content">
                          <p className="notification-message">No notifications yet</p>
                        </div>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        >
                          <div className="notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="notification-content">
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="notification-footer">
                    <Link to="/provider/notifications">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu-wrapper" ref={profileRef}>
              <button
                className="user-btn"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <Image
                  src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 40)}
                  alt={user?.name}
                  roundedCircle
                  className="user-avatar"
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 40))}
                />
                <div className="user-info">
                  <span className="user-name">{user?.name || 'Provider'}</span>
                  <span className="user-role">
                    <FaCrown className="text-success" size={10} /> {providerTier}
                  </span>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <Image
                      src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 60)}
                      alt={user?.name}
                      roundedCircle
                      className="dropdown-avatar"
                    />
                    <div>
                      <h6>{user?.name || 'Provider'}</h6>
                      <small>{user?.email || 'provider@example.com'}</small>
                    </div>
                  </div>

                  <div className="dropdown-menu">
                    <Link to="/provider/profile" onClick={() => setProfileMenuOpen(false)}>
                      <FaUser /> Profile
                    </Link>
                    <Link to="/provider/wallet" onClick={() => setProfileMenuOpen(false)}>
                      <FaWallet /> Wallet
                    </Link>
                    <Link to="/provider/settings" onClick={() => setProfileMenuOpen(false)}>
                      <FaCog /> Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link to="/" onClick={() => setProfileMenuOpen(false)}>
                      <FaHome /> Homepage
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="mobile-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit">
                <FaSearch />
              </button>
            </form>
          </div>
        )}

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* STYLES - unchanged (same as your original) */}
      <style jsx="true">{`
        /* ========== CSS Variables ========== */
        :root {
          --primary: #10b981;
          --primary-dark: #059669;
          --primary-light: #34d399;
          --success: #10b981;
          --warning: #f59e0b;
          --danger: #ef4444;
          --dark: #1e293b;
          --darker: #0f172a;
          --light: #f8fafc;
          --lighter: #ffffff;
          --border: #e2e8f0;
          --text: #334155;
          --text-light: #64748b;
          --text-lighter: #94a3b8;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
          --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
          --shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.1);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Dark Theme */
        .theme-dark {
          --dark: #f8fafc;
          --darker: #ffffff;
          --light: #1e293b;
          --lighter: #0f172a;
          --border: #334155;
          --text: #e2e8f0;
          --text-light: #94a3b8;
          --text-lighter: #64748b;
        }

        /* ========== Layout ========== */
        .provider-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--light);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ========== Sidebar ========== */
        .sidebar {
          width: 300px;
          background: linear-gradient(180deg, var(--darker) 0%, var(--dark) 100%);
          color: #fff;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 1000;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          overflow-y: auto;
          scrollbar-width: none;
        }

        .sidebar::-webkit-scrollbar {
          display: none;
        }

        .sidebar.collapsed {
          width: 90px;
        }

        .sidebar.mobile-open {
          transform: translateX(0);
        }

        /* Sidebar Header */
        .sidebar-header {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          text-decoration: none;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .brand-icon {
          font-size: 2rem;
        }

        .brand-text {
          background: linear-gradient(135deg, #fff 0%, #e2e8f0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .text-primary {
          color: var(--primary) !important;
          -webkit-text-fill-color: var(--primary);
        }

        .sidebar-close {
          display: none;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition);
          align-items: center;
          justify-content: center;
        }

        .sidebar-close:hover {
          background: var(--danger);
          transform: rotate(90deg);
        }

        /* Profile Section */
        .sidebar-profile {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .profile-avatar-wrapper {
          position: relative;
        }

        .profile-avatar {
          width: 70px !important;
          height: 70px !important;
          border: 3px solid var(--primary);
          box-shadow: 0 4px 15px rgba(16,185,129,0.4);
          transition: var(--transition);
        }

        .profile-avatar:hover {
          transform: scale(1.05);
        }

        .status {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 3px solid var(--darker);
        }

        .status.online {
          background: var(--success);
        }

        .profile-info {
          flex: 1;
        }

        .profile-name {
          margin: 0 0 4px;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
        }

        .profile-tier {
          font-size: 0.7rem;
          padding: 4px 8px;
          border-radius: 30px;
        }

        /* Navigation - MAIN ITEMS ONLY */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: none;
        }

        .sidebar-nav::-webkit-scrollbar {
          display: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          border-radius: 12px;
          transition: var(--transition);
          margin: 4px 0;
          border: 1px solid transparent;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
          transform: translateX(6px);
          border-color: rgba(255,255,255,0.1);
        }

        .nav-item.active {
          background: linear-gradient(90deg, var(--primary), #059669);
          color: #fff;
          box-shadow: 0 4px 15px rgba(16,185,129,0.4);
        }

        .nav-icon {
          margin-right: 14px;
          font-size: 1.3rem;
          width: 28px;
          text-align: center;
          transition: var(--transition);
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.1);
        }

        .nav-text {
          flex: 1;
        }

        .nav-label {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .nav-description {
          display: block;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.4;
        }

        .active .nav-description {
          color: rgba(255,255,255,0.9);
        }

        /* Sidebar Footer */
        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: 16px;
        }

        .footer-link {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          border-radius: 12px;
          transition: var(--transition);
          margin-bottom: 8px;
        }

        .footer-link:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        .footer-icon {
          margin-right: 14px;
          font-size: 1.2rem;
          width: 28px;
          text-align: center;
        }

        .logout-btn {
          width: 100%;
          padding: 14px 16px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 12px;
          color: #fc8181;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: var(--transition);
          font-size: 1rem;
        }

        .logout-btn:hover {
          background: var(--danger);
          color: #fff;
          border-color: var(--danger);
        }

        /* Collapse Toggle */
        .collapse-toggle {
          position: absolute;
          bottom: 30px;
          right: -14px;
          width: 32px;
          height: 32px;
          background: var(--primary);
          border: 3px solid #fff;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
          z-index: 1001;
          box-shadow: 0 4px 15px rgba(16,185,129,0.5);
        }

        .collapse-toggle:hover {
          background: #059669;
          transform: scale(1.15) rotate(180deg);
        }

        /* ========== Main Content ========== */
        .main-content {
          flex: 1;
          margin-left: 300px;
          transition: var(--transition);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--light);
        }

        .main-content.expanded {
          margin-left: 90px;
        }

        /* Topbar */
        .topbar {
          background: var(--lighter);
          padding: 16px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--shadow-md);
          position: sticky;
          top: 0;
          z-index: 99;
          backdrop-filter: blur(12px);
          background: rgba(var(--lighter-rgb), 0.85);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .menu-toggle {
          background: var(--light);
          border: 1px solid var(--border);
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          cursor: pointer;
          transition: var(--transition);
        }

        .menu-toggle:hover {
          background: var(--primary);
          color: #fff;
          transform: rotate(90deg);
        }

        .page-info {
          display: flex;
          flex-direction: column;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          background: linear-gradient(135deg, var(--dark), var(--primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-path {
          font-size: 0.8rem;
          color: var(--text-light);
          font-family: monospace;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Search Toggle */
        .search-toggle {
          background: var(--light);
          border: 1px solid var(--border);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          cursor: pointer;
          transition: var(--transition);
        }

        .search-toggle:hover {
          background: var(--primary);
          color: #fff;
        }

        /* Theme Toggle */
        .theme-toggle {
          background: var(--light);
          border: 1px solid var(--border);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          cursor: pointer;
          transition: var(--transition);
        }

        .theme-toggle:hover {
          background: var(--primary);
          color: #fff;
        }

        /* Notifications */
        .notifications-wrapper {
          position: relative;
        }

        .notification-btn {
          background: var(--light);
          border: 1px solid var(--border);
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
        }

        .notification-btn:hover {
          background: var(--primary);
          color: #fff;
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--danger);
          color: #fff;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 20px;
          min-width: 18px;
          text-align: center;
          border: 2px solid var(--lighter);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .notification-dropdown {
          position: absolute;
          top: 60px;
          right: 0;
          width: 360px;
          background: var(--lighter);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          z-index: 1000;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .notification-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, var(--light), var(--lighter));
          border-radius: 16px 16px 0 0;
        }

        .notification-header h6 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
        }

        .notification-header span {
          font-size: 0.75rem;
          color: var(--primary);
          background: rgba(16,185,129,0.1);
          padding: 4px 12px;
          border-radius: 30px;
        }

        .notification-list {
          max-height: 350px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 16px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          transition: var(--transition);
        }

        .notification-item:hover {
          background: var(--light);
        }

        .notification-item.unread {
          background: rgba(16,185,129,0.04);
          border-left: 4px solid var(--primary);
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          background: var(--light);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          margin: 0 0 4px;
          font-size: 0.9rem;
          color: var(--text);
          font-weight: 500;
        }

        .notification-time {
          font-size: 0.7rem;
          color: var(--text-light);
        }

        .notification-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          text-align: center;
        }

        .notification-footer a {
          color: var(--primary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: var(--transition);
        }

        .notification-footer a:hover {
          color: #059669;
        }

        /* User Menu */
        .user-menu-wrapper {
          position: relative;
        }

        .user-btn {
          background: var(--light);
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 4px 12px 4px 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: var(--transition);
          height: 48px;
        }

        .user-btn:hover {
          background: var(--lighter);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.2);
        }

        .user-avatar {
          width: 38px !important;
          height: 38px !important;
          border: 2px solid var(--primary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text);
        }

        .user-role {
          font-size: 0.7rem;
          color: var(--text-light);
        }

        .user-dropdown {
          position: absolute;
          top: 60px;
          right: 0;
          width: 280px;
          background: var(--lighter);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
          z-index: 1000;
          animation: slideDown 0.3s ease;
        }

        .dropdown-header {
          padding: 20px;
          background: linear-gradient(135deg, var(--primary), #059669);
          color: #fff;
          border-radius: 16px 16px 0 0;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dropdown-avatar {
          width: 50px !important;
          height: 50px !important;
          border: 3px solid rgba(255,255,255,0.3);
        }

        .dropdown-header h6 {
          margin: 0 0 4px;
          font-size: 1rem;
          font-weight: 600;
        }

        .dropdown-header small {
          font-size: 0.75rem;
          opacity: 0.9;
        }

        .dropdown-menu {
          padding: 8px;
        }

        .dropdown-menu a,
        .dropdown-menu button {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          color: var(--text);
          text-decoration: none;
          border-radius: 10px;
          transition: var(--transition);
          width: 100%;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.95rem;
        }

        .dropdown-menu a:hover,
        .dropdown-menu button:hover {
          background: rgba(16,185,129,0.1);
          color: var(--primary);
          transform: translateX(4px);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 8px 0;
        }

        /* Mobile Search */
        .mobile-search {
          padding: 16px;
          background: var(--lighter);
          border-bottom: 1px solid var(--border);
        }

        .mobile-search form {
          display: flex;
          gap: 8px;
        }

        .mobile-search input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid var(--border);
          border-radius: 30px;
          font-size: 0.9rem;
          background: var(--light);
          color: var(--text);
        }

        .mobile-search input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .mobile-search button {
          background: var(--primary);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          transition: var(--transition);
        }

        .mobile-search button:hover {
          background: #059669;
          transform: scale(1.05);
        }

        /* Page Content */
        .page-content {
          flex: 1;
          padding: 30px;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Overlay */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          z-index: 999;
          backdrop-filter: blur(4px);
          display: none;
        }

        /* ========== Responsive ========== */
        @media (max-width: 1200px) {
          .sidebar { width: 280px; }
          .main-content { margin-left: 280px; }
          .page-title { font-size: 1.3rem; }
        }

        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
            width: 300px;
          }
          .sidebar.mobile-open { transform: translateX(0); }
          .main-content, .main-content.expanded { margin-left: 0; }
          .menu-toggle, .sidebar-close { display: flex; }
          .collapse-toggle { display: none; }
          .sidebar-overlay { display: block; }
        }

        @media (max-width: 768px) {
          .topbar { padding: 12px 16px; }
          .page-content { padding: 16px; }
          .page-title { font-size: 1.2rem; }
          .page-path { display: none; }
          .user-info { display: none; }
          .notification-dropdown { width: 320px; right: -20px; }
        }

        @media (max-width: 576px) {
          .notification-dropdown { width: 300px; right: -40px; }
          .menu-toggle, .theme-toggle, .search-toggle, .notification-btn { width: 40px; height: 40px; }
          .user-btn { padding: 4px; }
          .user-dropdown { width: 260px; }
        }

        /* Print Styles */
        @media print {
          .sidebar, .topbar, .sidebar-overlay { display: none !important; }
          .main-content { margin: 0 !important; }
          .page-content { padding: 0 !important; background: #fff; }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: var(--light);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: var(--primary-light);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;