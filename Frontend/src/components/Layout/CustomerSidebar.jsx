import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Nav,
  Button,
  Dropdown,
  Badge,
  OverlayTrigger,
  Tooltip,
  Spinner
} from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  ShoppingBag,
  Heart,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  Gift,
  HelpCircle,
  Moon,
  Sun,
  Wallet,
  DollarSign,
  FaArrowTrendUp,
  Award,
  Shield,
  MapPin,
  Search,
  Menu,
  X,
  CreditCard,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { customerAPI, notificationAPI } from '../../api/api';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CustomerSidebar = ({ children, initialCollapsed = false }) => {
  const { user, logout } = useAuth();
  const { isConnected, unreadMessages } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('customer_theme');
    return saved ? saved === 'dark' : false;
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [savedServicesCount, setSavedServicesCount] = useState(0);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);

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

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await customerAPI.getWallet();
      setWalletBalance(response.data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
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

  // Fetch upcoming bookings count
  const fetchUpcomingBookings = useCallback(async () => {
    try {
      const response = await customerAPI.getUpcomingBookings();
      setUpcomingBookingsCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
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

  // Toggle sidebar
  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Close mobile sidebar
  const closeMobileSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(false);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('customer_theme', newMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  // Handle logout
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
      if (window.innerWidth >= 992) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set theme on mount
  useEffect(() => {
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Load data
  useEffect(() => {
    fetchNotifications();
    fetchWalletBalance();
    fetchSavedServices();
    fetchUpcomingBookings();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchWalletBalance();
      fetchSavedServices();
      fetchUpcomingBookings();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchWalletBalance, fetchSavedServices, fetchUpcomingBookings]);

  // Menu items with dynamic badges
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/customer/dashboard', badge: null },
    { icon: Calendar, label: 'My Bookings', path: '/customer/bookings', badge: upcomingBookingsCount > 0 ? upcomingBookingsCount : null },
    { icon: Clock, label: 'Upcoming Services', path: '/customer/upcoming', badge: upcomingBookingsCount > 0 ? upcomingBookingsCount : null },
    { icon: ShoppingBag, label: 'Service History', path: '/customer/history', badge: null },
    { icon: Heart, label: 'Saved Services', path: '/customer/favorites', badge: savedServicesCount > 0 ? savedServicesCount : null },
    { icon: Star, label: 'My Reviews', path: '/customer/reviews', badge: null },
    { icon: MessageSquare, label: 'Messages', path: '/customer/chat', badge: unreadMessages > 0 ? unreadMessages : null },
    { icon: Wallet, label: 'Wallet', path: '/customer/wallet', badge: null },
    { icon: Gift, label: 'Rewards', path: '/customer/rewards', badge: 'New' },
    { icon: User, label: 'Profile', path: '/customer/profile', badge: null },
    { icon: Settings, label: 'Settings', path: '/customer/settings', badge: null },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar size={14} className="text-success" />;
      case 'payment':
        return <DollarSign size={14} className="text-info" />;
      case 'review':
        return <Star size={14} className="text-warning" />;
      case 'promotion':
        return <Gift size={14} className="text-pink" />;
      default:
        return <Bell size={14} className="text-secondary" />;
    }
  };

  return (
    <div className={`customer-layout theme-${darkMode ? 'dark' : 'light'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/customer/dashboard" className="brand" onClick={closeMobileSidebar}>
            <span className="brand-icon">✨</span>
            {!collapsed && <span className="brand-text">Service<span className="text-primary">Hub</span></span>}
          </Link>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar-wrapper">
            <img
              src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 80)}
              alt={user?.name || 'Customer'}
              className="profile-avatar"
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 80))}
            />
            <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
          </div>

          {!collapsed && (
            <div className="profile-info">
              <h5 className="profile-name">{user?.name?.split(' ')[0] || 'Customer'}</h5>
              <div className="profile-stats">
                <span className="stat">
                  <Star size={12} className="text-warning" />
                  {user?.rating || 'New'}
                </span>
                <span className="stat">
                  <Wallet size={12} />
                  {formatNaira(walletBalance)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeMobileSidebar}
            >
              <span className="nav-icon">{item.icon && <item.icon size={20} />}</span>
              {!collapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="nav-badge-collapsed">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link to="/help" className="footer-link" onClick={closeMobileSidebar}>
            <HelpCircle size={18} />
            {!collapsed && <span>Help Center</span>}
          </Link>
          <button onClick={toggleDarkMode} className="footer-link">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={handleLogout} className="footer-link logout">
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        {window.innerWidth >= 992 && (
          <button className="collapse-toggle" onClick={toggleSidebar}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </aside>

      {/* Main Content */}
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <div className="page-info">
              <h4 className="page-title">
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h4>
            </div>
          </div>

          <div className="topbar-right">
            {/* Connection Status */}
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              <span className="status-text">{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Notifications */}
            <div className="notifications-wrapper" ref={notificationRef}>
              <button 
                className="icon-btn" 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="dropdown-header">
                    <h6>Notifications</h6>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="mark-read-btn">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="dropdown-list">
                    {loadingNotifications ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-4">
                        <Bell size={32} className="text-muted mb-2 opacity-50" />
                        <p className="text-muted small mb-0">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className="notification-icon">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="notification-content">
                            <p className="notification-message">{notif.message}</p>
                            <span className="notification-time">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="dropdown-footer">
                      <Link to="/customer/notifications">View all notifications</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu-wrapper" ref={profileRef}>
              <button className="user-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <img
                  src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 40)}
                  alt={user?.name || 'Customer'}
                  className="user-avatar"
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 40))}
                />
                <div className="user-info">
                  <span className="user-name">{user?.name?.split(' ')[0] || 'Customer'}</span>
                  <span className="user-role">Customer</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <img
                      src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 60)}
                      alt={user?.name || 'Customer'}
                      className="dropdown-avatar"
                    />
                    <div>
                      <h6>{user?.name || 'Customer'}</h6>
                      <small>{user?.email || 'customer@servicehub.com'}</small>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-menu-items">
                    <Link to="/customer/profile" onClick={() => setProfileMenuOpen(false)}>
                      <User size={16} /> Profile
                    </Link>
                    <Link to="/customer/wallet" onClick={() => setProfileMenuOpen(false)}>
                      <Wallet size={16} /> Wallet: {formatNaira(walletBalance)}
                    </Link>
                    <Link to="/customer/settings" onClick={() => setProfileMenuOpen(false)}>
                      <Settings size={16} /> Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link to="/" onClick={() => setProfileMenuOpen(false)}>
                      <Home size={16} /> Homepage
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Book Service Button */}
            <Link to="/services" className="book-btn">
              <Search size={16} />
              <span>Book Service</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

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
        .notifications-dropdown {
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

        /* User Dropdown */
        .user-dropdown {
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
          .user-info {
            display: none;
          }
          .book-btn span {
            display: none;
          }
          .book-btn {
            padding: 8px 12px;
          }
          .notifications-dropdown {
            width: 300px;
            right: -60px;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerSidebar;