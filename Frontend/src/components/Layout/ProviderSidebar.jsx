import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  Clock,
  Users,
  DollarSign,
  Briefcase,
  Star,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  FaArrowTrendUp,
  Award,
  HelpCircle,
  Moon,
  Sun,
  UserCircle,
  FileText,
  Wallet,
  PlusCircle,
  Activity,
  BarChart2,
  Shield,
  Gift,
  Heart,
  Zap
} from 'lucide-react';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { providerAPI, notificationAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderSidebar = ({ children, initialCollapsed = false }) => {
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers, unreadMessages } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('provider_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    pendingBookings: 0,
    completedJobs: 0,
    rating: 0,
    totalReviews: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

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

  // Toggle sidebar
  const toggleSidebar = () => setCollapsed(!collapsed);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('provider_dark_mode', JSON.stringify(newMode));
    document.body.setAttribute('data-bs-theme', newMode ? 'dark' : 'light');
  };

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await providerAPI.getDashboardStats();
      setStats({
        todayEarnings: response.data.today_earnings || 0,
        pendingBookings: response.data.pending_bookings || 0,
        completedJobs: response.data.completed_jobs || 0,
        rating: response.data.rating || 0,
        totalReviews: response.data.total_reviews || 0
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
      const response = await notificationAPI.getNotifications({ limit: 5 });
      setNotifications(response.data || []);
      setUnreadNotifications(response.data.filter(n => !n.is_read).length);
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
      setUnreadNotifications(prev => Math.max(0, prev - 1));
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
      setUnreadNotifications(0);
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

  // Load data on mount
  useEffect(() => {
    fetchStats();
    fetchNotifications();
    
    // Set initial theme
    if (darkMode) {
      document.body.setAttribute('data-bs-theme', 'dark');
    }
    
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchNotifications, darkMode]);

  // Listen for socket notifications
  useEffect(() => {
    if (!isConnected) return;
    
    // This would be handled by your socket service
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 5));
      setUnreadNotifications(prev => prev + 1);
      toast.success(notification.message);
    };
    
    // Assuming socket service emits 'new-notification'
    // You would add a listener here
    // socket.on('new-notification', handleNewNotification);
    
    return () => {
      // socket.off('new-notification', handleNewNotification);
    };
  }, [isConnected]);

  // Menu items with routes
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/provider/dashboard', badge: null },
    { icon: Calendar, label: 'Bookings', path: '/provider/bookings', badge: stats.pendingBookings > 0 ? stats.pendingBookings.toString() : null },
    { icon: Clock, label: 'Schedule', path: '/provider/schedule', badge: null },
    { icon: Briefcase, label: 'My Services', path: '/provider/my-services', badge: null },
    { icon: DollarSign, label: 'Earnings', path: '/provider/earnings', badge: null },
    { icon: Wallet, label: 'Wallet', path: '/provider/wallet', badge: null },
    { icon: Star, label: 'Reviews', path: '/provider/reviews', badge: stats.rating > 0 ? stats.rating.toFixed(1) : null },
    { icon: MessageSquare, label: 'Messages', path: '/provider/chat', badge: unreadMessages > 0 ? unreadMessages.toString() : null },
    { icon: Users, label: 'Customers', path: '/provider/customers', badge: null },
    { icon: BarChart2, label: 'Analytics', path: '/provider/analytics', badge: null },
    { icon: Gift, label: 'Rewards', path: '/provider/rewards', badge: 'New' },
    { icon: Settings, label: 'Settings', path: '/provider/settings', badge: null },
  ];

  // Apply dark mode styles
  const getStyles = () => ({
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    sidebar: {
      width: collapsed ? '80px' : '280px',
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      color: darkMode ? '#e2e8f0' : '#1e293b',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'fixed',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      zIndex: 1000,
      borderRight: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
    },
    toggleBtn: {
      position: 'absolute',
      right: '-12px',
      top: '20px',
      backgroundColor: darkMode ? '#334155' : '#ffffff',
      border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 1001,
      transition: 'all 0.2s',
      color: darkMode ? '#e2e8f0' : '#475569',
    },
    logo: {
      padding: collapsed ? '24px 0' : '24px 20px',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      marginBottom: '20px',
      textAlign: collapsed ? 'center' : 'left',
    },
    logoText: {
      fontSize: '20px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: collapsed ? 'none' : 'inline',
    },
    logoIcon: {
      fontSize: '28px',
      display: collapsed ? 'block' : 'none',
    },
    userProfile: {
      padding: collapsed ? '16px 0' : '16px 20px',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      gap: collapsed ? '0' : '12px',
    },
    userAvatar: {
      width: collapsed ? '40px' : '48px',
      height: collapsed ? '40px' : '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: collapsed ? '16px' : '18px',
      flexShrink: 0,
    },
    userInfo: {
      display: collapsed ? 'none' : 'block',
      flex: 1,
    },
    userName: {
      fontSize: '14px',
      fontWeight: 600,
      marginBottom: '4px',
      color: darkMode ? '#f1f5f9' : '#0f172a',
    },
    userEmail: {
      fontSize: '11px',
      opacity: 0.7,
      color: darkMode ? '#cbd5e1' : '#475569',
      wordBreak: 'break-all',
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '4px',
      fontSize: '11px',
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '8px',
      fontSize: '10px',
      padding: '4px 8px',
      borderRadius: '20px',
      backgroundColor: darkMode ? '#334155' : '#f1f5f9',
      width: 'fit-content',
    },
    nav: {
      flex: 1,
      padding: '0 12px',
    },
    navItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      margin: '4px 0',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: isActive ? (darkMode ? '#10b98120' : '#ecfdf5') : 'transparent',
      color: isActive ? '#10b981' : (darkMode ? '#e2e8f0' : '#475569'),
      position: 'relative',
      textDecoration: 'none',
    }),
    icon: {
      minWidth: '24px',
      marginRight: collapsed ? '0' : '12px',
    },
    label: {
      flex: 1,
      fontSize: '14px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      display: collapsed ? 'none' : 'block',
    },
    badge: {
      backgroundColor: '#ef4444',
      color: 'white',
      borderRadius: '20px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      marginLeft: '8px',
      display: collapsed ? 'none' : 'inline-block',
    },
    ratingBadge: {
      backgroundColor: '#fbbf24',
      color: '#92400e',
      borderRadius: '20px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      marginLeft: '8px',
      display: collapsed ? 'none' : 'inline-block',
    },
    bottomSection: {
      padding: '20px 12px',
      borderTop: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      marginTop: 'auto',
    },
    content: {
      marginLeft: collapsed ? '80px' : '280px',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%',
      padding: '20px',
    },
    header: {
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      borderRadius: '16px',
      padding: '16px 24px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    },
    headerTitle: {
      margin: 0,
      fontSize: '24px',
      fontWeight: 600,
      color: darkMode ? '#f1f5f9' : '#0f172a',
    },
    headerSubtitle: {
      margin: '4px 0 0',
      fontSize: '14px',
      opacity: 0.7,
      color: darkMode ? '#cbd5e1' : '#475569',
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
  });

  const styles = getStyles();
  const currentPath = location.pathname;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.toggleBtn} onClick={toggleSidebar}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </div>

        <div style={styles.logo}>
          <span style={styles.logoIcon}>🔧</span>
          <span style={styles.logoText}>ServiceHub</span>
        </div>

        {/* User Profile Section */}
        <div style={styles.userProfile}>
          <div style={styles.userAvatar}>
            {user?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
          {!collapsed && (
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name || 'Provider'}</div>
              <div style={styles.userEmail}>{user?.email || 'provider@servicehub.com'}</div>
              <div style={styles.rating}>
                <Star size={12} fill="#fbbf24" color="#fbbf24" />
                <span>{stats.rating.toFixed(1)}</span>
                <span style={{ opacity: 0.6 }}>({stats.totalReviews} reviews)</span>
              </div>
              <div style={styles.connectionStatus}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10b981' : '#ef4444',
                }} />
                <span>{isConnected ? 'Connected' : 'Offline'}</span>
                {!collapsed && onlineUsers > 0 && (
                  <span style={{ marginLeft: '4px' }}>• {onlineUsers} online</span>
                )}
              </div>
            </div>
          )}
        </div>

        <Nav style={styles.nav} className="flex-column">
          {menuItems.map((item, idx) => {
            const isActive = currentPath === item.path;
            return (
              <OverlayTrigger
                key={idx}
                placement="right"
                overlay={collapsed ? <Tooltip>{item.label}</Tooltip> : <></>}
              >
                <Link to={item.path} style={styles.navItem(isActive)}>
                  <div style={styles.icon}>
                    <item.icon size={20} strokeWidth={1.5} />
                  </div>
                  <span style={styles.label}>{item.label}</span>
                  {item.badge && !collapsed && (
                    <Badge style={item.label === 'Reviews' ? styles.ratingBadge : styles.badge} bg={item.label === 'Reviews' ? 'warning' : 'danger'}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </OverlayTrigger>
            );
          })}
        </Nav>

        <div style={styles.bottomSection}>
          <OverlayTrigger
            placement="right"
            overlay={collapsed ? <Tooltip>Help Center</Tooltip> : <></>}
          >
            <Link to="/provider/help" style={styles.navItem(false)}>
              <div style={styles.icon}>
                <HelpCircle size={20} strokeWidth={1.5} />
              </div>
              <span style={styles.label}>Help Center</span>
            </Link>
          </OverlayTrigger>

          <OverlayTrigger
            placement="right"
            overlay={collapsed ? <Tooltip>{darkMode ? 'Light Mode' : 'Dark Mode'}</Tooltip> : <></>}
          >
            <div style={styles.navItem(false)} onClick={toggleDarkMode}>
              <div style={styles.icon}>
                {darkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
              </div>
              <span style={styles.label}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </OverlayTrigger>

          <OverlayTrigger
            placement="right"
            overlay={collapsed ? <Tooltip>Logout</Tooltip> : <></>}
          >
            <div style={styles.navItem(false)} onClick={handleLogout}>
              <div style={styles.icon}>
                <LogOut size={20} strokeWidth={1.5} />
              </div>
              <span style={styles.label}>Logout</span>
            </div>
          </OverlayTrigger>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h4 style={styles.headerTitle}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Provider'}! 👋
            </h4>
            <p style={styles.headerSubtitle}>
              Here's your service provider dashboard
            </p>
          </div>

          <div style={styles.headerActions}>
            <Dropdown align="end">
              <Dropdown.Toggle as={Button} variant="link" style={{ padding: 0, textDecoration: 'none' }}>
                <div style={{ position: 'relative' }}>
                  <Bell size={22} strokeWidth={1.5} style={{ cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#475569' }} />
                  {unreadNotifications > 0 && (
                    <Badge
                      bg="danger"
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-12px',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ width: '320px', padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      style={{ fontSize: '12px', padding: 0 }}
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                {loadingNotifications ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-4">
                    <Bell size={32} className="text-muted mb-2 opacity-50" />
                    <p className="text-muted small mb-0">No notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <Dropdown.Item 
                      key={notif.id} 
                      style={{ whiteSpace: 'normal', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <span style={{ fontWeight: !notif.is_read ? 600 : 400, fontSize: '13px' }}>
                          {notif.message}
                        </span>
                        {!notif.is_read && <Badge bg="primary" pill style={{ fontSize: '8px', marginLeft: '8px' }}>New</Badge>}
                      </div>
                      <small style={{ opacity: 0.6, fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </small>
                    </Dropdown.Item>
                  ))
                )}
                <Dropdown.Divider />
                <Dropdown.Item 
                  style={{ textAlign: 'center', fontSize: '13px' }}
                  as={Link}
                  to="/provider/notifications"
                >
                  View all notifications
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Button 
              as={Link}
              to="/provider/create-service"
              variant="success" 
              style={{ 
                borderRadius: '12px', 
                padding: '8px 20px',
                fontWeight: 500,
                fontSize: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none'
              }}
            >
              <PlusCircle size={16} className="me-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {!loadingStats && (
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ opacity: 0.7, fontSize: '13px' }}>Today's Earnings</span>
                <DollarSign size={20} color="#10b981" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{formatCompactNaira(stats.todayEarnings)}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ opacity: 0.7, fontSize: '13px' }}>Pending Bookings</span>
                <Calendar size={20} color="#f59e0b" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats.pendingBookings}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ opacity: 0.7, fontSize: '13px' }}>Completed Jobs</span>
                <CheckCircle size={20} color="#10b981" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats.completedJobs}</h3>
            </div>

            <div style={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ opacity: 0.7, fontSize: '13px' }}>Rating</span>
                <Award size={20} color="#fbbf24" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>{stats.rating.toFixed(1)} ★</h3>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div>{children}</div>
      </div>

      <style>{`
        * {
          scrollbar-width: thin;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#1e293b' : '#f1f5f9'};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#475569' : '#cbd5e1'};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#64748b' : '#94a3b8'};
        }
        .dropdown-menu {
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid ${darkMode ? '#334155' : '#e2e8f0'} !important;
          background-color: ${darkMode ? '#1e293b' : '#ffffff'} !important;
          color: ${darkMode ? '#e2e8f0' : '#1e293b'} !important;
        }
        .dropdown-item {
          transition: all 0.2s !important;
        }
        .dropdown-item:hover {
          background-color: ${darkMode ? '#334155' : '#f8fafc'} !important;
        }
        .btn-link {
          text-decoration: none !important;
        }
        .btn-link:focus {
          box-shadow: none !important;
        }
        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          transition: all 0.2s;
        }
        a {
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default ProviderSidebar;