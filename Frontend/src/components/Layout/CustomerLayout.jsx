// src/components/Layout/CustomerLayout.jsx
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
  FaHeart,
  FaStar,
  FaAngleLeft,
  FaAngleRight,
  FaHome,
  FaSearch,
  FaCreditCard,
  FaWallet,
  FaGift,
  FaQuestionCircle,
  FaMoon,
  FaSun,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaShoppingBag,
  FaHistory,
  FaCrown,
  FaFire,
  FaRocket,
  FaHeadset,
  FaChartLine,
  FaUserCircle,
  FaStore,
  FaTags,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { customerAPI, notificationAPI } from '../../api/api';
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
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
    color: '#6366f1',
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
    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    color: '#92400e',
    padding: '2px 10px',
    borderRadius: '50px',
    marginTop: '2px',
  },

  profileWallet: {
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
    color: active ? '#6366f1' : '#4a5568',
    background: active ? '#eef2ff' : 'transparent',
    transition: 'all 0.2s',
    marginBottom: '2px',
    position: 'relative',
    cursor: 'pointer',
    justifyContent: collapsed ? 'center' : 'flex-start',
    '&:hover': {
      background: active ? '#eef2ff' : '#f8fafc',
      color: '#6366f1',
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
      color: '#6366f1',
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

  // Collapse Toggle
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
      background: '#6366f1',
      color: 'white',
      borderColor: '#6366f1',
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

  // Connection Status
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

  // Icon Buttons
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

  // Theme Toggle
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

  // Profile Button
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

  // Book Button
  bookBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textDecoration: 'none',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
      color: 'white',
    },
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
    color: '#6366f1',
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
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  // Profile Dropdown
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
      color: '#6366f1',
    },
  },

  divider: {
    height: '1px',
    background: '#f0f4f8',
    margin: '4px 12px',
  },

  // ============================================================
  // MOBILE
  // ============================================================
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

  // ============================================================
  // RESPONSIVE BREAKPOINTS
  // ============================================================
  '@media (max-width: 991px)': {
    topbar: {
      padding: '8px 16px',
    },
    profileBtnInfo: {
      display: 'none',
    },
    bookBtnSpan: {
      display: 'none',
    },
    bookBtn: {
      padding: '8px 14px',
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

const CustomerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isConnected, unreadMessages } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('customer_theme');
    return saved || 'light';
  });

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [savedServicesCount, setSavedServicesCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  // Refs
  const notificationRef = useRef();
  const profileRef = useRef();

  // Format currency
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Fetch data
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

  const fetchUpcomingBookings = useCallback(async () => {
    try {
      const response = await customerAPI.getUpcomingBookings();
      setUpcomingBookingsCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
    }
  }, []);

  const fetchSavedServices = useCallback(async () => {
    try {
      const response = await customerAPI.getFavorites();
      setSavedServicesCount(response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching saved services:', error);
    }
  }, []);

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

  // Handlers
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

  // Get notification icon
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

  // Get membership tier
  const getMembershipTier = () => {
    // This could be dynamic based on spending
    return { name: 'Gold', icon: FaCrown };
  };

  const tier = getMembershipTier();
  const TierIcon = tier.icon;

  // Navigation items
  const navItems = [
    { path: '/customer/dashboard', label: 'Dashboard', icon: FaTachometerAlt, description: 'Overview', badge: null },
    { path: '/customer/bookings', label: 'Bookings', icon: FaCalendarCheck, description: 'Manage bookings', badge: upcomingBookingsCount },
    { path: '/customer/favorites', label: 'Favorites', icon: FaHeart, description: 'Saved services', badge: savedServicesCount },
    { path: '/customer/reviews', label: 'Reviews', icon: FaStar, description: 'Your feedback', badge: null },
    { path: '/customer/chat', label: 'Messages', icon: FaComments, description: 'Chat with providers', badge: unreadMessages },
    { path: '/customer/wallet', label: 'Wallet', icon: FaWallet, description: formatNaira(walletBalance), badge: null },
    { path: '/customer/payment-methods', label: 'Payments', icon: FaCreditCard, description: 'Payment methods', badge: null },
    { path: '/customer/profile', label: 'Profile', icon: FaUser, description: 'Manage account', badge: null },
    { path: '/customer/settings', label: 'Settings', icon: FaCog, description: 'Preferences', badge: null },
    { path: '/customer/help', label: 'Help', icon: FaQuestionCircle, description: 'Support & FAQs', badge: null },
  ];

  // Click outside
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

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme
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

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUpcomingBookings();
      fetchSavedServices();
      fetchWalletBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUpcomingBookings, fetchSavedServices, fetchWalletBalance]);

  return (
    <div style={styles.layout}>
      {/* ============================================================
          SIDEBAR
          ============================================================ */}
      <aside style={styles.sidebar(collapsed, mobileOpen)}>
        {/* Sidebar Header */}
        <div style={styles.sidebarHeader}>
          <Link to="/customer/dashboard" style={styles.brand} onClick={closeMobileSidebar}>
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

        {/* Profile Section */}
        <div style={styles.sidebarProfile(collapsed)}>
          <div style={styles.profileAvatarWrapper}>
            <img
              src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 80)}
              alt={user?.name || 'Customer'}
              style={styles.profileAvatar}
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 80))}
            />
            <span style={styles.statusDot(isConnected)}></span>
          </div>
          {!collapsed && (
            <div style={styles.profileInfo(collapsed)}>
              <p style={styles.profileName}>{user?.name?.split(' ')[0] || 'Customer'}</p>
              <div style={styles.profileTier}>
                <TierIcon size={10} /> {tier.name} Member
              </div>
              <div style={styles.profileWallet}>
                <FaWallet size={10} /> {formatNaira(walletBalance)}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
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

        {/* Sidebar Footer */}
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

        {/* Collapse Toggle */}
        {window.innerWidth >= 992 && (
          <button style={styles.collapseToggle} onClick={toggleSidebar}>
            {collapsed ? <FaAngleRight size={12} /> : <FaAngleLeft size={12} />}
          </button>
        )}
      </aside>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <main style={styles.mainContent(collapsed)}>
        {/* Topbar */}
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
            {/* Connection Status */}
            <div style={styles.connectionStatus}>
              <span style={styles.connectionDot(isConnected)}></span>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Theme Toggle */}
            <button
              style={styles.themeToggle}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* Notifications */}
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
                        <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
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
                      <Link to="/customer/notifications" style={styles.dropdownFooterLink}>
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button style={styles.profileBtn} onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <img
                  src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 40)}
                  alt={user?.name || 'Customer'}
                  style={styles.profileBtnAvatar}
                  onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 40))}
                />
                <div style={styles.profileBtnInfo}>
                  <span style={styles.profileBtnName}>{user?.name?.split(' ')[0] || 'Customer'}</span>
                  <span style={styles.profileBtnRole}>Customer</span>
                </div>
              </button>

              {profileMenuOpen && (
                <div style={styles.profileDropdown}>
                  <div style={styles.profileDropdownHeader}>
                    <img
                      src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 60)}
                      alt={user?.name || 'Customer'}
                      style={styles.profileDropdownAvatar}
                    />
                    <div>
                      <p style={styles.profileDropdownName}>{user?.name || 'Customer'}</p>
                      <p style={styles.profileDropdownEmail}>{user?.email || 'customer@servicehub.com'}</p>
                    </div>
                  </div>
                  <div style={styles.profileDropdownItems}>
                    <Link to="/customer/profile" style={styles.profileDropdownLink}>
                      <FaUser size={14} /> Profile
                    </Link>
                    <Link to="/customer/wallet" style={styles.profileDropdownLink}>
                      <FaWallet size={14} /> Wallet: {formatNaira(walletBalance)}
                    </Link>
                    <Link to="/customer/settings" style={styles.profileDropdownLink}>
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

            {/* Book Service Button */}
            <Link to="/services" style={styles.bookBtn}>
              <FaSearch size={14} />
              <span style={styles.bookBtnSpan}>Book Service</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div style={styles.pageContent}>{children}</div>
      </main>

      {/* Mobile Overlay */}
      {mobileOpen && <div style={styles.overlay} onClick={() => setMobileOpen(false)} />}

      {/* ============================================================
          GLOBAL STYLES
          ============================================================ */}
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

        /* Dark Theme */
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

        /* Scrollbar */
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

        /* Responsive overrides */
        @media (max-width: 991px) {
          ${styles.sidebarClose} {
            display: block !important;
          }
          ${styles.menuToggle} {
            display: block !important;
          }
        }

        @media (max-width: 576px) {
          ${styles.topbar} {
            padding: 8px 12px !important;
          }
          ${styles.pageContent} {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerLayout;