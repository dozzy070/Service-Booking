// src/components/Layout/CustomerLayout.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Image, Badge, Spinner } from 'react-bootstrap';
import {
  FaBars, FaTimes, FaBell, FaSignOutAlt,
  FaTachometerAlt, FaCalendarCheck, FaUser, FaCog,
  FaComments, FaHeart, FaStar,
  FaAngleLeft, FaAngleRight,
  FaHome, FaSearch, FaCreditCard, FaWallet,
  FaGift,
  FaExclamationCircle, FaRocket, FaShieldAlt,
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaGlobe,
  FaShoppingBag, FaHistory, FaQuestionCircle,
  FaFileAlt, FaBookmark, FaCrown,
  FaMoon, FaSun, FaMoneyBillWave,
  FaStore, FaTags, FaUserTie, FaUserCircle,
  FaClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { customerAPI, notificationAPI } from '../../api/api';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isConnected, unreadMessages } = useSocket();
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
    const saved = localStorage.getItem('customer_theme');
    return saved || 'light';
  });

  // Real-time notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Dynamic badge counts
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [savedServicesCount, setSavedServicesCount] = useState(0);
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

  // Fetch notifications
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

  // Fetch upcoming bookings count
  const fetchUpcomingBookings = useCallback(async () => {
    try {
      const response = await customerAPI.getUpcomingBookings();
      setUpcomingBookingsCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    }
  }, []);

  // Fetch saved services count
  const fetchSavedServices = useCallback(async () => {
    try {
      const response = await customerAPI.getFavorites();
      setSavedServicesCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching saved services:', error);
    }
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await customerAPI.getWallet();
      setWalletBalance(response.data?.balance || 0);
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
    localStorage.setItem('customer_theme', theme);
  }, [theme]);

  // Load data
  useEffect(() => {
    fetchNotifications();
    fetchUpcomingBookings();
    fetchSavedServices();
    fetchWalletBalance();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUpcomingBookings();
      fetchSavedServices();
      fetchWalletBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUpcomingBookings, fetchSavedServices, fetchWalletBalance]);

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
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <FaCalendarCheck className="text-success" />;
      case 'payment':
        return <FaMoneyBillWave className="text-info" />;
      case 'review':
        return <FaStar className="text-warning" />;
      case 'promotion':
        return <FaGift className="text-pink" />;
      case 'reminder':
        return <FaClock className="text-primary" />;
      default:
        return <FaBell className="text-secondary" />;
    }
  };

  // Navigation items with dynamic badges
  const navItems = [
    {
      path: '/customer/dashboard',
      label: 'Dashboard',
      icon: <FaTachometerAlt />,
      description: 'Overview & activity',
      color: '#6366f1',
      badge: null
    },
    {
      path: '/customer/bookings',
      label: 'Bookings',
      icon: <FaCalendarCheck />,
      description: 'Manage your bookings',
      color: '#10b981',
      badge: upcomingBookingsCount > 0 ? upcomingBookingsCount : null
    },
    {
      path: '/customer/favorites',
      label: 'Favorites',
      icon: <FaHeart />,
      description: 'Saved services',
      color: '#ef4444',
      badge: savedServicesCount > 0 ? savedServicesCount : null
    },
    {
      path: '/customer/reviews',
      label: 'Reviews',
      icon: <FaStar />,
      description: 'Your feedback',
      color: '#f59e0b',
      badge: null
    },
    {
      path: '/customer/chat',
      label: 'Messages',
      icon: <FaComments />,
      description: 'Chat with providers',
      color: '#8b5cf6',
      badge: unreadMessages > 0 ? unreadMessages : null
    },
    {
      path: '/customer/wallet',
      label: 'Wallet',
      icon: <FaWallet />,
      description: `Balance: ${formatNaira(walletBalance)}`,
      color: '#14b8a6',
      badge: null
    },
    {
      path: '/customer/payment-methods',
      label: 'Payment Methods',
      icon: <FaCreditCard />,
      description: 'Manage payment methods',
      color: '#f97316',
      badge: null
    },
    {
      path: '/customer/profile',
      label: 'Profile',
      icon: <FaUser />,
      description: 'Manage account',
      color: '#6b7280',
      badge: null
    },
    {
      path: '/customer/settings',
      label: 'Settings',
      icon: <FaCog />,
      description: 'Preferences',
      color: '#4b5563',
      badge: null
    },
    {
      path: '/customer/help',
      label: 'Help Center',
      icon: <FaQuestionCircle />,
      description: 'Support & FAQs',
      color: '#9ca3af',
      badge: null
    }
  ];

  // Get membership tier based on spending
  const getMembershipTier = () => {
    // This could be dynamic based on total spending
    return 'Gold';
  };

  const membershipTier = getMembershipTier();

  return (
    <div className={`customer-layout theme-${theme}`}>
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/customer/dashboard" className="brand">
            <span className="brand-icon">👤</span>
            {!collapsed && (
              <span className="brand-text">
                Customer<span className="text-primary">Panel</span>
              </span>
            )}
          </Link>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <FaTimes />
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar-wrapper">
            <Image
              src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 80)}
              alt={user?.name || 'Customer'}
              className="profile-avatar"
              roundedCircle
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 80))}
            />
            <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
          </div>

          {!collapsed && (
            <div className="profile-info">
              <h5 className="profile-name">{user?.name?.split(' ')[0] || 'Customer'}</h5>
              <Badge bg="warning" text="dark" className="profile-tier">
                <FaCrown className="me-1" size={10} /> {membershipTier} Member
              </Badge>
              <div className="profile-stats">
                <small className="text-muted d-block">
                  <FaWallet className="me-1" size={10} />
                  {formatNaira(walletBalance)}
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
              {item.badge && collapsed && (
                <span className="nav-badge-collapsed">{item.badge}</span>
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
              <span className="status-text">{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Search Toggle (Mobile) */}
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

            {/* Notifications */}
            <div className="notifications-wrapper" ref={notificationRef}>
              <button
                className="notification-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
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
                      <Link to="/customer/notifications">View all notifications</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="profile-menu-wrapper" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <Image
                  src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 40)}
                  alt={user?.name || 'Customer'}
                  className="profile-avatar-small"
                  roundedCircle
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 40))}
                />
                <div className="profile-info-small">
                  <span className="profile-name-small">{user?.name?.split(' ')[0] || 'Customer'}</span>
                  <span className="profile-role">Customer</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <Image
                      src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 60)}
                      alt={user?.name || 'Customer'}
                      className="dropdown-avatar"
                      roundedCircle
                    />
                    <div>
                      <h6>{user?.name || 'Customer'}</h6>
                      <small>{user?.email || 'customer@servicehub.com'}</small>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-menu-items">
                    <Link to="/customer/profile" onClick={() => setProfileMenuOpen(false)}>
                      <FaUser /> Profile
                    </Link>
                    <Link to="/customer/wallet" onClick={() => setProfileMenuOpen(false)}>
                      <FaWallet /> Wallet: {formatNaira(walletBalance)}
                    </Link>
                    <Link to="/customer/settings" onClick={() => setProfileMenuOpen(false)}>
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

            {/* Book Service Button */}
            <Link to="/services" className="book-btn">
              <FaSearch />
              <span>Book Service</span>
            </Link>
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

      {/* Global Styles */}
      <style jsx="true">{`
        .customer-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          transition: transform 0.3s ease, width 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        @media (max-width: 991px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 280px;
          transition: margin-left 0.3s ease;
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
          font-size: 12px;
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

        /* Notifications Dropdown */
        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 360px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          margin-top: 8px;
          z-index: 1000;
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

        /* Profile Dropdown */
        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          width: 280px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          margin-top: 8px;
          z-index: 1000;
        }

        /* Book Button */
        .book-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 8px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .book-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
          color: white;
        }

        /* Nav Badge */
        .nav-badge {
          background: #ef4444;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: auto;
        }

        .nav-badge-collapsed {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          padding: 2px 5px;
          border-radius: 10px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .topbar {
            padding: 10px 16px;
          }
          .profile-info-small {
            display: none;
          }
          .book-btn span {
            display: none;
          }
          .book-btn {
            padding: 8px 12px;
          }
          .notification-dropdown {
            width: 300px;
            right: -60px;
          }
          .profile-dropdown {
            width: 260px;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerLayout;