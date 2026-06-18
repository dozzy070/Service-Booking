// src/components/Layout/AdminSidebar.jsx
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
  LayoutDashboard,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Package,
  HelpCircle,
  Moon,
  Sun,
  UserCircle,
  DollarSign,
  
  Award,
  Shield,
  Activity,
  FileText,
  Calendar,
  MessageSquare,
  Star,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
  Menu,
  X,
  PlusCircle,
  BarChart2,
  Gift,
  Heart,
  Zap
} from 'lucide-react';
// No duplicate imports from react-icons/fa

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { adminAPI, notificationAPI } from '../../api/api';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminSidebar = ({ children, initialCollapsed = false }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved ? saved === 'dark' : false;
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

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

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await adminAPI.getStats();
      setStats({
        totalUsers: response.data.total_users || 0,
        totalProviders: response.data.total_providers || 0,
        totalCustomers: response.data.total_customers || 0,
        totalBookings: response.data.total_bookings || 0,
        pendingBookings: response.data.pending_bookings || 0,
        completedBookings: response.data.completed_bookings || 0,
        totalRevenue: response.data.total_revenue || 0,
        pendingApprovals: response.data.pending_approvals || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

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
    localStorage.setItem('admin_theme', newMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', newMode ? 'dark' : 'light');
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
    fetchStats();
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchNotifications]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user':
        return <Users size={14} className="text-success" />;
      case 'booking':
        return <Calendar size={14} className="text-primary" />;
      case 'payment':
        return <DollarSign size={14} className="text-info" />;
      case 'review':
        return <Star size={14} className="text-warning" />;
      case 'alert':
        return <AlertTriangle size={14} className="text-danger" />;
      case 'approval':
        return <CheckCircle size={14} className="text-success" />;
      default:
        return <Bell size={14} className="text-secondary" />;
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Menu items with dynamic badges
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', badge: null },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', badge: 'New' },
    { icon: Users, label: 'Users', path: '/admin/users', badge: stats.totalUsers > 0 ? stats.totalUsers : null },
    { icon: ShoppingCart, label: 'Bookings', path: '/admin/bookings', badge: stats.pendingBookings > 0 ? stats.pendingBookings : null },
    { icon: Package, label: 'Services', path: '/admin/services', badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null },
    { icon: CreditCard, label: 'Payments', path: '/admin/payments', badge: null },
    { icon: FileText, label: 'Reports', path: '/admin/reports', badge: null },
    { icon: MessageSquare, label: 'Support', path: '/admin/support', badge: null },
    { icon: Settings, label: 'Settings', path: '/admin/settings', badge: null },
  ];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className={`admin-layout theme-${darkMode ? 'dark' : 'light'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin/dashboard" className="brand" onClick={closeMobileSidebar}>
            <span className="brand-icon">⚡</span>
            {!collapsed && <span className="brand-text">Admin<span className="text-primary">Hub</span></span>}
          </Link>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Admin Profile */}
        <div className="sidebar-profile">
          <div className="profile-avatar-wrapper">
            <img
              src={user?.avatar || getAvatarUrl(user?.name || 'Admin', 80)}
              alt={user?.name || 'Admin'}
              className="profile-avatar"
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Admin', 80))}
            />
            <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
          </div>

          {!collapsed && (
            <div className="profile-info">
              <h5 className="profile-name">{user?.name || 'Administrator'}</h5>
              <Badge bg="primary" className="profile-role">Super Admin</Badge>
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
            {!collapsed && <span>Help & Support</span>}
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
                      <Link to="/admin/notifications">View all notifications</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu-wrapper" ref={profileRef}>
              <button className="user-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <img
                  src={user?.avatar || getAvatarUrl(user?.name || 'Admin', 40)}
                  alt={user?.name || 'Admin'}
                  className="user-avatar"
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Admin', 40))}
                />
                <div className="user-info">
                  <span className="user-name">{user?.name?.split(' ')[0] || 'Admin'}</span>
                  <span className="user-role">Administrator</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <img
                      src={user?.avatar || getAvatarUrl(user?.name || 'Admin', 60)}
                      alt={user?.name || 'Admin'}
                      className="dropdown-avatar"
                    />
                    <div>
                      <h6>{user?.name || 'Administrator'}</h6>
                      <small>{user?.email || 'admin@servicehub.com'}</small>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-menu-items">
                    <Link to="/admin/profile" onClick={() => setProfileMenuOpen(false)}>
                      <UserCircle size={16} /> Profile
                    </Link>
                    <Link to="/admin/settings" onClick={() => setProfileMenuOpen(false)}>
                      <Settings size={16} /> Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <Link to="/" onClick={() => setProfileMenuOpen(false)}>
                      <LayoutDashboard size={16} /> Homepage
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Quick Stats Row */}
        {!loadingStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">
                <Users size={20} />
              </div>
              <div className="stat-info">
                <h3>{stats.totalUsers.toLocaleString()}</h3>
                <span>Total Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">
                <ShoppingCart size={20} />
              </div>
              <div className="stat-info">
                <h3>{stats.totalBookings.toLocaleString()}</h3>
                <span>Total Bookings</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">
                <Clock size={20} />
              </div>
              <div className="stat-info">
                <h3>{stats.pendingBookings}</h3>
                <span>Pending</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <DollarSign size={20} />
              </div>
              <div className="stat-info">
                <h3>{formatCompactNaira(stats.totalRevenue)}</h3>
                <span>Revenue</span>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <style jsx="true">{`
        .admin-layout {
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

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 20px 24px;
          background: var(--bg-primary);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--card-bg);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-icon.orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .stat-info h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .stat-info span {
          font-size: 13px;
          color: var(--text-muted);
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
          width: 260px;
          background: var(--dropdown-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          margin-top: 8px;
          z-index: 1000;
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
          .stats-grid {
            padding: 16px;
            gap: 12px;
          }
          .stat-card {
            padding: 12px 16px;
          }
          .stat-info h3 {
            font-size: 18px;
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

export default AdminSidebar;