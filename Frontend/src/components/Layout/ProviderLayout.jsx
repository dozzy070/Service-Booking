// src/components/provider/ProviderLayout.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Image, Badge, Spinner } from 'react-bootstrap';
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
  FaCrown, FaGem, FaWallet as FaWalletIcon,
  FaBriefcase, FaCalendarAlt
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { providerAPI, notificationAPI } from '../../api/api';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { format, formatDistanceToNow } from 'date-fns';
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
    case 'alert':
      return <FaExclamationCircle className="text-danger" />;
    default:
      return <FaBell className="text-secondary" />;
  }
};

const ProviderLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers, unreadMessages } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // State Management
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('provider_theme');
    return saved || 'light';
  });
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Stats for badge counts
  const [pendingBookings, setPendingBookings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  const notificationRef = useRef();
  const profileRef = useRef();

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const response = await notificationAPI.getNotifications({ limit: 10 });
      setNotifications(response.data || []);
      setUnreadCount(response.data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Fetch pending bookings count
  const fetchPendingBookings = useCallback(async () => {
    try {
      const response = await providerAPI.getBookings({ status: 'pending', limit: 1 });
      setPendingBookings(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await providerAPI.getWallet();
      setWalletBalance(response.data?.available_balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Handle notification dropdown open
  const handleNotificationsOpen = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen && unreadCount > 0) {
      // Optionally mark as read when opened
      // markAllAsRead();
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    fetchNotifications();
    fetchPendingBookings();
    fetchWalletBalance();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingBookings();
      fetchWalletBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPendingBookings, fetchWalletBalance]);

  // Listen for socket notifications
  useEffect(() => {
    if (!isConnected) return;

    // Handle new notification via socket
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
      toast.success(notification.message);
    };

    // This would be set up in your socket context
    // socket.on('new-notification', handleNewNotification);

    return () => {
      // socket.off('new-notification', handleNewNotification);
    };
  }, [isConnected]);

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
    localStorage.setItem('provider_theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
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
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation items with real-time badges
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
      color: '#48bb78'
    },
    {
      path: '/provider/bookings',
      label: 'Bookings',
      icon: <FaCalendarCheck />,
      description: 'Manage appointments',
      color: '#f59e0b',
      badge: pendingBookings > 0 ? pendingBookings : null
    },
    {
      path: '/provider/wallet',
      label: 'Wallet',
      icon: <FaWalletIcon />,
      description: `Balance: ${formatNaira(walletBalance)}`,
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
      label: 'Messages',
      icon: <FaComments />,
      description: 'Chat with customers',
      color: '#8b5cf6',
      badge: unreadMessages > 0 ? unreadMessages : null
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

  // Provider tier based on stats
  const getProviderTier = () => {
    // This could be dynamic based on completed jobs or rating
    return 'Professional';
  };

  const providerTier = getProviderTier();

  return (
    <div className={`provider-layout theme-${theme}`}>
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/provider/dashboard" className="brand">
            <span className="brand-icon">🔧</span>
            {!collapsed && (
              <span className="brand-text">
                Service<span className="text-primary">Hub</span>
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
              alt={user?.name || 'Provider'}
              className="profile-avatar"
              roundedCircle
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 80))}
            />
            <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
          </div>

          {!collapsed && (
            <div className="profile-info">
              <h5 className="profile-name">{user?.name || 'Provider'}</h5>
              <Badge bg="success" className="profile-tier">
                <FaCrown className="me-1" size={10} /> {providerTier}
              </Badge>
              <div className="profile-stats">
                <small className="text-muted d-block">
                  <FaStar className="text-warning me-1" size={10} />
                  {user?.rating || 'New'}
                </small>
              </div>
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

              {item.badge && !collapsed && (
                <span className="nav-badge">{item.badge}</span>
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
            {/* Connection Status */}
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              <small className="status-text">
                {isConnected ? 'Live' : 'Offline'}
              </small>
            </div>

            {/* Search Toggle */}
            <button className="search-toggle" onClick={() => setSearchOpen(!searchOpen)}>
              <FaSearch />
            </button>

            {/* Theme Toggle */}
            <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* Notifications */}
            <div className="notifications-wrapper" ref={notificationRef}>
              <button className="notification-btn" onClick={handleNotificationsOpen}>
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h6>Notifications</h6>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="mark-read-btn">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {loadingNotifications ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-item text-center">
                        <FaBell size={32} className="text-muted mb-2 opacity-50" />
                        <p className="text-muted small mb-0">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(notification => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="notification-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="notification-content">
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <Link to="/provider/notifications">View all notifications</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="user-menu-wrapper" ref={profileRef}>
              <button className="user-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <Image
                  src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 40)}
                  alt={user?.name || 'Provider'}
                  roundedCircle
                  className="user-avatar"
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 40))}
                />
                <div className="user-info">
                  <span className="user-name">{user?.name?.split(' ')[0] || 'Provider'}</span>
                  <span className="user-role">Provider</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <Image
                      src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 60)}
                      alt={user?.name || 'Provider'}
                      roundedCircle
                      className="dropdown-avatar"
                    />
                    <div>
                      <h6>{user?.name || 'Provider'}</h6>
                      <small>{user?.email || 'provider@servicehub.com'}</small>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-menu-items">
                    <Link to="/provider/profile" onClick={() => setProfileMenuOpen(false)}>
                      <FaUser /> Profile
                    </Link>
                    <Link to="/provider/settings" onClick={() => setProfileMenuOpen(false)}>
                      <FaCog /> Settings
                    </Link>
                    <Link to="/provider/wallet" onClick={() => setProfileMenuOpen(false)}>
                      <FaWallet /> Wallet: {formatNaira(walletBalance)}
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
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Global Styles */}
      <style jsx="true">{`
        .provider-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-primary);
          transition: all 0.3s ease;
        }

        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar.mobile-open {
          transform: translateX(0);
        }

        @media (max-width: 991px) {
          .sidebar {
            transform: translateX(-100%);
          }
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 280px;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 100vh;
        }

        .main-content.expanded {
          margin-left: 80px;
        }

        @media (max-width: 991px) {
          .main-content {
            margin-left: 0;
          }
        }

        /* Topbar */
        .topbar {
          position: sticky;
          top: 0;
          background: var(--topbar-bg);
          border-bottom: 1px solid var(--border-color);
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }

        /* Connection Status */
        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--bg-secondary);
          border-radius: 20px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.connected {
          background: #10b981;
        }

        .status-dot.disconnected {
          background: #ef4444;
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Notification Dropdown */
        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 360px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          margin-top: 8px;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: background 0.2s;
        }

        .notification-item:hover {
          background: var(--hover-bg);
        }

        .notification-item.unread {
          background: var(--unread-bg);
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
        }

        /* User Dropdown */
        .user-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 280px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          margin-top: 8px;
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .dropdown-menu-items {
          padding: 8px 0;
        }

        .dropdown-menu-items a,
        .dropdown-menu-items button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          color: var(--text-color);
          text-decoration: none;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dropdown-menu-items a:hover,
        .dropdown-menu-items button:hover {
          background: var(--hover-bg);
        }

        /* Nav Item Badge */
        .nav-badge {
          background: #ef4444;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: auto;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .topbar {
            padding: 10px 16px;
          }
          
          .user-info {
            display: none;
          }
          
          .notification-dropdown {
            width: 300px;
            right: -80px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProviderLayout;