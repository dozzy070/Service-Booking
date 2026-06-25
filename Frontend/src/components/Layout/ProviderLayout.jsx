// src/components/provider/ProviderLayout.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaBell,
  FaSignOutAlt,
  FaTachometerAlt,
  FaCalendarCheck,
  FaUser,
  FaCog,
  FaComments,
  FaStar,
  FaAngleLeft,
  FaAngleRight,
  FaHome,
  FaSearch,
  FaWallet,
  FaGift,
  FaQuestionCircle,
  FaMoon,
  FaSun,
  FaServicestack,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaCrown,
  FaRocket,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { providerAPI, notificationAPI } from '../../api/api';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ============================================================
// STYLES
// ============================================================

const styles = {
  // Layout Container
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f0f4f8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // ============================================================
  // SIDEBAR
  // ============================================================
  sidebar: (collapsed, mobileOpen) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: collapsed ? '72px' : '260px',
    height: '100vh',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1050,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    '@media (min-width: 992px)': {
      transform: 'translateX(0)',
    },
  }),

  sidebarHeader: {
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f0f4f8',
    flexShrink: 0,
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '18px',
    color: '#1a202c',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },

  brandIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    flexShrink: 0,
  },

  brandText: {
    transition: 'opacity 0.2s',
  },
  brandHighlight: {
    color: '#10b981',
  },

  sidebarClose: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#4a5568',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    '@media (max-width: 991px)': {
      display: 'block',
    },
  },

  // Profile Section
  sidebarProfile: (collapsed) => ({
    padding: collapsed ? '16px 0' : '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '14px',
    flexDirection: collapsed ? 'column' : 'row',
    borderBottom: '1px solid #f0f4f8',
    flexShrink: 0,
  }),

  profileAvatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },

  profileAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
    transition: 'all 0.2s',
  },

  statusDot: (isConnected) => ({
    position: 'absolute',
    bottom: '1px',
    right: '1px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    background: isConnected ? '#10b981' : '#ef4444',
    transition: 'all 0.3s',
    animation: isConnected ? 'pulse 2s infinite' : 'none',
  }),

  profileInfo: (collapsed) => ({
    display: collapsed ? 'none' : 'block',
    flex: 1,
    minWidth: 0,
  }),

  profileName: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#1a202c',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  profileTier: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    color: '#065f46',
    padding: '2px 10px',
    borderRadius: '50px',
    marginTop: '2px',
  },

  profileStats: {
    fontSize: '12px',
    color: '#718096',
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },

  // Navigation
  sidebarNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 10px',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#e2e8f0',
      borderRadius: '2px',
    },
  },

  navItem: (active, collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '12px',
    padding: collapsed ? '10px' : '10px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: active ? '#10b981' : '#4a5568',
    background: active ? '#ecfdf5' : 'transparent',
    transition: 'all 0.2s',
    marginBottom: '2px',
    position: 'relative',
    cursor: 'pointer',
    justifyContent: collapsed ? 'center' : 'flex-start',
    '&:hover': {
      background: active ? '#ecfdf5' : '#f8fafc',
      color: '#10b981',
    },
  }),

  navIcon: {
    fontSize: '18px',
    flexShrink: 0,
    width: '24px',
    textAlign: 'center',
  },

  navContent: (collapsed) => ({
    display: collapsed ? 'none' : 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  }),

  navLabel: {
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  navDescription: {
    fontSize: '11px',
    color: '#a0aec0',
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  navBadge: (count) => ({
    background: count > 0 ? '#ef4444' : '#e2e8f0',
    color: count > 0 ? 'white' : '#a0aec0',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '50px',
    flexShrink: 0,
    minWidth: '20px',
    textAlign: 'center',
  }),

  navBadgeCollapsed: (count) => ({
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: '#ef4444',
    color: 'white',
    fontSize: '9px',
    fontWeight: '600',
    padding: '1px 6px',
    borderRadius: '50px',
    minWidth: '16px',
    textAlign: 'center',
  }),

  // Sidebar Footer
  sidebarFooter: (collapsed) => ({
    borderTop: '1px solid #f0f4f8',
    padding: collapsed ? '12px 0' : '12px 16px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  }),

  footerLink: (collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '12px',
    padding: collapsed ? '10px' : '8px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#4a5568',
    transition: 'all 0.2s',
    justifyContent: collapsed ? 'center' : 'flex-start',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: '14px',
    '&:hover': {
      background: '#f8fafc',
      color: '#10b981',
    },
  }),

  logoutBtn: (collapsed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '12px',
    padding: collapsed ? '10px' : '8px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#ef4444',
    transition: 'all 0.2s',
    justifyContent: collapsed ? 'center' : 'flex-start',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: '14px',
    '&:hover': {
      background: '#fef2f2',
      color: '#dc2626',
    },
  }),

  collapseToggle: {
    position: 'absolute',
    bottom: '20px',
    right: '-12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'white',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#4a5568',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#10b981',
      color: 'white',
      borderColor: '#10b981',
    },
  },

  // ============================================================
  // MAIN CONTENT
  // ============================================================
  mainContent: (collapsed) => ({
    flex: 1,
    marginLeft: collapsed ? '72px' : '260px',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 991px)': {
      marginLeft: 0,
    },
  }),

  // ============================================================
  // TOPBAR
  // ============================================================
  topbar: {
    position: 'sticky',
    top: 0,
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e2e8f0',
    padding: '10px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    minHeight: '64px',
  },

  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },

  menuToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#4a5568',
    cursor: 'pointer',
    padding: '4px',
    '@media (max-width: 991px)': {
      display: 'block',
    },
  },

  pageInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  pageTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
    lineHeight: 1.3,
  },

  pagePath: {
    fontSize: '12px',
    color: '#a0aec0',
  },

  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: '#f8fafc',
    borderRadius: '50px',
    fontSize: '12px',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
  },

  connectionDot: (isConnected) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: isConnected ? '#10b981' : '#ef4444',
    animation: isConnected ? 'pulse 2s infinite' : 'none',
  }),

  iconBtn: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'transparent',
    border: 'none',
    color: '#4a5568',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f0f4f8',
    },
  },

  iconBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '1px 6px',
    borderRadius: '50px',
    minWidth: '18px',
    textAlign: 'center',
  },

  themeToggle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'transparent',
    border: 'none',
    color: '#4a5568',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f0f4f8',
    },
  },

  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 12px 4px 4px',
    borderRadius: '50px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f0f4f8',
    },
  },

  profileBtnAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e2e8f0',
  },

  profileBtnInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.3,
  },

  profileBtnName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a202c',
  },

  profileBtnRole: {
    fontSize: '11px',
    color: '#a0aec0',
  },

  // ============================================================
  // DROPDOWNS
  // ============================================================
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: '340px',
    maxWidth: 'calc(100vw - 32px)',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 1060,
  },

  dropdownHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f4f8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },

  dropdownAction: {
    fontSize: '12px',
    color: '#10b981',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  dropdownList: {
    maxHeight: '360px',
    overflowY: 'auto',
  },

  dropdownItem: (unread) => ({
    display: 'flex',
    gap: '12px',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f4f8',
    cursor: 'pointer',
    transition: 'background 0.15s',
    background: unread ? '#f8faff' : 'transparent',
    '&:hover': {
      background: '#f8fafc',
    },
  }),

  dropdownItemIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '14px',
  },

  dropdownItemContent: {
    flex: 1,
    minWidth: 0,
  },

  dropdownItemMessage: {
    fontSize: '14px',
    color: '#1a202c',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  dropdownItemTime: {
    fontSize: '12px',
    color: '#a0aec0',
  },

  dropdownFooter: {
    padding: '12px 20px',
    borderTop: '1px solid #f0f4f8',
    textAlign: 'center',
  },

  dropdownFooterLink: {
    fontSize: '14px',
    color: '#10b981',
    textDecoration: 'none',
    fontWeight: '500',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  profileDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '260px',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 1060,
  },

  profileDropdownHeader: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f0f4f8',
  },

  profileDropdownAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  profileDropdownName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },

  profileDropdownEmail: {
    fontSize: '12px',
    color: '#a0aec0',
  },

  profileDropdownItems: {
    padding: '8px',
  },

  profileDropdownLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    color: '#4a5568',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    fontFamily: 'inherit',
    '&:hover': {
      background: '#f8fafc',
      color: '#10b981',
    },
  },

  divider: {
    height: '1px',
    background: '#f0f4f8',
    margin: '4px 12px',
  },

  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.3)',
    zIndex: 1040,
    animation: 'fadeIn 0.3s ease',
  },

  pageContent: {
    flex: 1,
    padding: '24px',
  },

  '@media (max-width: 991px)': {
    topbar: {
      padding: '8px 16px',
    },
    profileBtnInfo: {
      display: 'none',
    },
    dropdown: {
      minWidth: '300px',
      right: '-40px',
    },
    profileDropdown: {
      right: '-20px',
    },
  },

  '@media (max-width: 576px)': {
    topbar: {
      padding: '8px 12px',
      flexWrap: 'wrap',
      gap: '8px',
    },
    topbarRight: {
      gap: '6px',
    },
    connectionStatus: {
      display: 'none',
    },
    dropdown: {
      minWidth: '280px',
      right: '-60px',
    },
    pageContent: {
      padding: '16px',
    },
  },
};

// ============================================================
// COMPONENT
// ============================================================

const ProviderLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isConnected, unreadMessages } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('provider_theme');
    return saved || 'light';
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

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

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const response = await notificationAPI.getNotifications({ limit: 10 });
      setNotifications(response.data || []);
      setUnreadCount(response.data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const fetchPendingBookings = useCallback(async () => {
    try {
      const response = await providerAPI.getBookings({ status: 'pending', limit: 1 });
      setPendingBookings(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await providerAPI.getWallet();
      setWalletBalance(response.data?.available_balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(false);
    }
  };

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

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking: { icon: FaCalendarCheck, color: '#6366f1' },
      payment: { icon: FaMoneyBillWave, color: '#10b981' },
      review: { icon: FaStar, color: '#f59e0b' },
      alert: { icon: FaExclamationCircle, color: '#ef4444' },
    };
    const item = icons[type] || icons.booking;
    const Icon = item.icon;
    return <Icon style={{ color: item.color }} size={14} />;
  };

  const navItems = [
    { path: '/provider/dashboard', label: 'Dashboard', icon: FaTachometerAlt, description: 'Overview & stats', badge: null },
    { path: '/provider/my-services', label: 'My Services', icon: FaServicestack, description: 'Manage your services', badge: null },
    { path: '/provider/bookings', label: 'Bookings', icon: FaCalendarCheck, description: 'Manage appointments', badge: pendingBookings },
    { path: '/provider/wallet', label: 'Wallet', icon: FaWallet, description: `Balance: ${formatNaira(walletBalance)}`, badge: null },
    { path: '/provider/reviews', label: 'Reviews', icon: FaStar, description: 'Customer feedback', badge: null },
    { path: '/provider/chat', label: 'Messages', icon: FaComments, description: 'Chat with customers', badge: unreadMessages },
    { path: '/provider/profile', label: 'Profile', icon: FaUser, description: 'Manage account', badge: null },
    { path: '/provider/settings', label: 'Settings', icon: FaCog, description: 'Preferences', badge: null },
    { path: '/provider/help', label: 'Help', icon: FaQuestionCircle, description: 'Support & guides', badge: null },
  ];

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('provider_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchNotifications();
    fetchPendingBookings();
    fetchWalletBalance();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingBookings();
      fetchWalletBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPendingBookings, fetchWalletBalance]);

  const getProviderTier = () => {
    return 'Professional';
  };

  const providerTier = getProviderTier();
  const TierIcon = FaCrown;

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar(collapsed, mobileOpen)}>
        <div style={styles.sidebarHeader}>
          <Link to="/provider/dashboard" style={styles.brand} onClick={closeMobileSidebar}>
            <div style={styles.brandIcon}>
              <FaRocket size={16} />
            </div>
            {!collapsed && (
              <span style={styles.brandText}>
                Service<span style={styles.brandHighlight}>Hub</span>
              </span>
            )}
          </Link>
          <button style={styles.sidebarClose} onClick={() => setMobileOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div style={styles.sidebarProfile(collapsed)}>
          <div style={styles.profileAvatarWrapper}>
            <img
              src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 80)}
              alt={user?.name || 'Provider'}
              style={styles.profileAvatar}
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 80))}
            />
            <span style={styles.statusDot(isConnected)}></span>
          </div>
          {!collapsed && (
            <div style={styles.profileInfo(collapsed)}>
              <p style={styles.profileName}>{user?.name?.split(' ')[0] || 'Provider'}</p>
              <div style={styles.profileTier}>
                <TierIcon size={10} /> {providerTier}
              </div>
              <div style={styles.profileStats}>
                <FaStar style={{ color: '#f59e0b' }} size={10} />
                {user?.rating || 'New'}
              </div>
            </div>
          )}
        </div>

        <nav style={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasBadge = item.badge !== null && item.badge > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={styles.navItem(active, collapsed)}
                onClick={closeMobileSidebar}
              >
                <span style={styles.navIcon}>
                  <Icon />
                </span>
                {!collapsed ? (
                  <div style={styles.navContent(collapsed)}>
                    <span>
                      <span style={styles.navLabel}>{item.label}</span>
                      <span style={styles.navDescription}>{item.description}</span>
                    </span>
                    {hasBadge && <span style={styles.navBadge(item.badge)}>{item.badge}</span>}
                  </div>
                ) : (
                  hasBadge && <span style={styles.navBadgeCollapsed(item.badge)}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter(collapsed)}>
          <Link to="/" style={styles.footerLink(collapsed)} onClick={closeMobileSidebar}>
            <FaHome size={18} />
            {!collapsed && <span>Homepage</span>}
          </Link>
          <button style={styles.logoutBtn(collapsed)} onClick={handleLogout}>
            <FaSignOutAlt size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {window.innerWidth >= 992 && (
          <button style={styles.collapseToggle} onClick={toggleSidebar}>
            {collapsed ? <FaAngleRight size={12} /> : <FaAngleLeft size={12} />}
          </button>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent(collapsed)}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <button style={styles.menuToggle} onClick={toggleSidebar}>
              <FaBars />
            </button>
            <div style={styles.pageInfo}>
              <h4 style={styles.pageTitle}>
                {navItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
              </h4>
              <span style={styles.pagePath}>{location.pathname}</span>
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.connectionStatus}>
              <span style={styles.connectionDot(isConnected)}></span>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            <button
              style={styles.themeToggle}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            <div style={{ position: 'relative' }} ref={notificationRef}>
              <button
                style={styles.iconBtn}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FaBell />
                {unreadCount > 0 && <span style={styles.iconBadge}>{unreadCount}</span>}
              </button>

              {notificationsOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <h6 style={styles.dropdownTitle}>Notifications</h6>
                    {unreadCount > 0 && (
                      <button style={styles.dropdownAction} onClick={markAllAsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={styles.dropdownList}>
                    {loadingNotifications ? (
                      <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
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
                          style={styles.dropdownItem(!notif.is_read)}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div style={styles.dropdownItemIcon}>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div style={styles.dropdownItemContent}>
                            <p style={styles.dropdownItemMessage}>{notif.message}</p>
                            <span style={styles.dropdownItemTime}>
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div style={styles.dropdownFooter}>
                      <Link to="/provider/notifications" style={styles.dropdownFooterLink}>
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={profileRef}>
              <button style={styles.profileBtn} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <img
                  src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 40)}
                  alt={user?.name || 'Provider'}
                  style={styles.profileBtnAvatar}
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 40))}
                />
                <div style={styles.profileBtnInfo}>
                  <span style={styles.profileBtnName}>{user?.name?.split(' ')[0] || 'Provider'}</span>
                  <span style={styles.profileBtnRole}>Provider</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div style={styles.profileDropdown}>
                  <div style={styles.profileDropdownHeader}>
                    <img
                      src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 60)}
                      alt={user?.name || 'Provider'}
                      style={styles.profileDropdownAvatar}
                    />
                    <div>
                      <p style={styles.profileDropdownName}>{user?.name || 'Provider'}</p>
                      <p style={styles.profileDropdownEmail}>{user?.email || 'provider@servicehub.com'}</p>
                    </div>
                  </div>
                  <div style={styles.profileDropdownItems}>
                    <Link to="/provider/profile" style={styles.profileDropdownLink}>
                      <FaUser size={14} /> Profile
                    </Link>
                    <Link to="/provider/wallet" style={styles.profileDropdownLink}>
                      <FaWallet size={14} /> Wallet: {formatNaira(walletBalance)}
                    </Link>
                    <Link to="/provider/settings" style={styles.profileDropdownLink}>
                      <FaCog size={14} /> Settings
                    </Link>
                    <div style={styles.divider}></div>
                    <Link to="/" style={styles.profileDropdownLink}>
                      <FaHome size={14} /> Homepage
                    </Link>
                    <div style={styles.divider}></div>
                    <button style={{ ...styles.profileDropdownLink, color: '#ef4444' }} onClick={handleLogout}>
                      <FaSignOutAlt size={14} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={styles.pageContent}>{children}</div>
      </main>

      {mobileOpen && <div style={styles.overlay} onClick={() => setMobileOpen(false)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f0f4f8;
        }

        [data-theme="dark"] {
          --bg-primary: #0f172a;
          --bg-secondary: #1e293b;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --border-color: #334155;
        }

        [data-theme="dark"] body {
          background: #0f172a;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }

        [data-theme="dark"] ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        [data-theme="dark"] ::-webkit-scrollbar-thumb {
          background: #475569;
        }

        @media (max-width: 991px) {
          ${styles.sidebarClose} {
            display: block !important;
          }
          ${styles.menuToggle} {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProviderLayout;