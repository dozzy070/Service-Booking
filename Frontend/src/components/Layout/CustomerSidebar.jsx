// src/components/Layout/CustomerSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
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
  FaCreditCard,
  FaWallet,
  FaQuestionCircle,
  FaRocket,
  FaCrown,
  FaSignOutAlt,
  FaBell,
  FaGift,
  FaTicketAlt,
  FaHistory,
  FaChartLine,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';

const CustomerSidebar = ({ 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  closeMobileSidebar,
  upcomingBookingsCount,
  savedServicesCount,
  walletBalance,
  unreadMessages,
  user,
  notificationsCount = 0,
  loyaltyPoints = 0,
}) => {
  const { logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { 
      path: '/customer/dashboard', 
      label: 'Dashboard', 
      icon: FaTachometerAlt, 
      description: 'Overview & stats', 
      badge: null,
      color: '#6366f1'
    },
    { 
      path: '/customer/bookings', 
      label: 'Bookings', 
      icon: FaCalendarCheck, 
      description: 'Manage bookings', 
      badge: upcomingBookingsCount,
      color: '#f59e0b'
    },
    { 
      path: '/customer/favorites', 
      label: 'Favorites', 
      icon: FaHeart, 
      description: 'Saved services', 
      badge: savedServicesCount,
      color: '#ef4444'
    },
    { 
      path: '/customer/reviews', 
      label: 'Reviews', 
      icon: FaStar, 
      description: 'Your feedback', 
      badge: null,
      color: '#10b981'
    },
    { 
      path: '/customer/chat', 
      label: 'Messages', 
      icon: FaComments, 
      description: 'Chat with providers', 
      badge: unreadMessages,
      color: '#3b82f6'
    },
    { 
      path: '/customer/wallet', 
      label: 'Wallet', 
      icon: FaWallet, 
      description: formatNaira(walletBalance), 
      badge: null,
      color: '#8b5cf6'
    },
    { 
      path: '/customer/payment-methods', 
      label: 'Payments', 
      icon: FaCreditCard, 
      description: 'Payment methods', 
      badge: null,
      color: '#06b6d4'
    },
    { 
      path: '/customer/profile', 
      label: 'Profile', 
      icon: FaUser, 
      description: 'Manage account', 
      badge: null,
      color: '#14b8a6'
    },
    { 
      path: '/customer/settings', 
      label: 'Settings', 
      icon: FaCog, 
      description: 'Preferences', 
      badge: null,
      color: '#6b7280'
    },
    { 
      path: '/customer/help', 
      label: 'Help', 
      icon: FaQuestionCircle, 
      description: 'Support & FAQs', 
      badge: null,
      color: '#f97316'
    },
  ];

  const getMembershipTier = () => {
    const spent = walletBalance || 0;
    if (spent >= 500000) return { name: 'Platinum', icon: FaCrown, color: '#7c3aed' };
    if (spent >= 200000) return { name: 'Gold', icon: FaCrown, color: '#d97706' };
    if (spent >= 50000) return { name: 'Silver', icon: FaCrown, color: '#6b7280' };
    return { name: 'Bronze', icon: FaCrown, color: '#b45309' };
  };

  const tier = getMembershipTier();
  const TierIcon = tier.icon;

  return (
    <>
      <style>{`
        /* ============================================================
           SIDEBAR CONTAINER - IMPROVED VISIBILITY
           ============================================================ */
        .customer-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: ${collapsed ? '72px' : '270px'} !important;
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
          border-right: 1px solid #e2e8f0;
          display: flex !important;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1050;
          overflow-x: hidden;
          overflow-y: auto;
          box-shadow: 4px 0 20px rgba(0,0,0,0.05);
        }

        /* ✅ SCROLLBAR - ALWAYS VISIBLE AND STYLED */
        .customer-sidebar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        .customer-sidebar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .customer-sidebar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 10px;
          transition: all 0.3s;
        }

        .customer-sidebar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
          width: 7px;
        }

        /* Firefox */
        .customer-sidebar {
          scrollbar-width: thin;
          scrollbar-color: #6366f1 #f1f1f1;
        }

        @media (max-width: 991px) {
          .customer-sidebar {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            width: 290px !important;
            box-shadow: 4px 0 30px rgba(0,0,0,0.15);
          }
        }

        @media (min-width: 992px) {
          .customer-sidebar {
            transform: translateX(0) !important;
          }
        }

        /* ============================================================
           SIDEBAR HEADER - PREMIUM DESIGN
           ============================================================ */
        .sidebar-header {
          padding: 20px 20px;
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'space-between'};
          border-bottom: 1px solid rgba(255,255,255,0.15);
          flex-shrink: 0;
          min-height: 72px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          position: relative;
          overflow: hidden;
        }

        .sidebar-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -30%;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }

        .sidebar-header::after {
          content: '';
          position: absolute;
          bottom: -40%;
          left: -20%;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 20px;
          color: white;
          overflow: hidden;
          white-space: nowrap;
          position: relative;
          z-index: 1;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          flex-shrink: 0;
          backdrop-filter: blur(10px);
          transition: all 0.3s;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .brand:hover .brand-icon {
          transform: rotate(-10deg) scale(1.05);
          background: rgba(255,255,255,0.3);
        }

        .brand-text {
          transition: opacity 0.3s;
          font-size: 20px;
          color: white;
          letter-spacing: -0.5px;
          font-weight: 800;
        }

        .brand-text span {
          color: rgba(255,255,255,0.7);
        }

        .sidebar-close {
          display: none;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 8px;
          transition: all 0.2s;
          position: relative;
          z-index: 1;
        }

        .sidebar-close:hover {
          background: rgba(255,255,255,0.3);
        }

        @media (max-width: 991px) {
          .sidebar-close {
            display: block;
          }
        }

        /* ============================================================
           PROFILE SECTION - ENHANCED
           ============================================================ */
        .sidebar-profile {
          padding: ${collapsed ? '18px 0' : '22px 24px'};
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '16px'};
          flex-direction: ${collapsed ? 'column' : 'row'};
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
          position: relative;
        }

        .profile-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #6366f1;
          transition: all 0.3s;
          box-shadow: 0 2px 12px rgba(99, 102, 241, 0.2);
        }

        .profile-avatar:hover {
          border-color: #8b5cf6;
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }

        .status {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2.5px solid white;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .status.online {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .status.offline {
          background: #ef4444;
        }

        .status.away {
          background: #f59e0b;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        .profile-info {
          flex: 1;
          min-width: 0;
          display: ${collapsed ? 'none' : 'block'};
        }

        .profile-name {
          font-weight: 700;
          font-size: 16px;
          color: #1a202c;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .profile-tier {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          padding: 2px 14px;
          border-radius: 50px;
          margin-top: 3px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .profile-tier .tier-icon {
          color: #d97706;
        }

        .profile-wallet {
          font-size: 12px;
          color: #718096;
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .profile-wallet .wallet-icon {
          color: #10b981;
        }

        .profile-wallet .wallet-amount {
          color: #10b981;
          font-weight: 600;
        }

        /* ============================================================
           LOYALTY POINTS BADGE
           ============================================================ */
        .loyalty-badge {
          display: ${collapsed ? 'none' : 'flex'};
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-radius: 8px;
          padding: 6px 14px;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #92400e;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .loyalty-badge .points-icon {
          color: #f59e0b;
        }

        /* ============================================================
           NAVIGATION - IMPROVED VISIBILITY
           ============================================================ */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* ✅ Ensure nav items are always visible */
        .nav-item {
          display: flex !important;
          align-items: center !important;
          gap: ${collapsed ? '0' : '14px'} !important;
          padding: ${collapsed ? '12px' : '12px 16px'} !important;
          justify-content: ${collapsed ? 'center' : 'flex-start'} !important;
          border-radius: 12px;
          text-decoration: none;
          color: #4a5568;
          transition: all 0.25s ease;
          margin-bottom: 2px;
          position: relative;
          cursor: pointer;
          min-height: 48px;
          width: 100%;
          visibility: visible !important;
          opacity: 1 !important;
          background: transparent;
          border: none;
        }

        .nav-item:hover {
          background: linear-gradient(135deg, #eef2ff 0%, #f8faff 100%);
          color: #6366f1;
          transform: translateX(6px);
          box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
          transform: none;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: white;
          border-radius: 0 3px 3px 0;
        }

        .nav-item.active .nav-icon {
          color: white !important;
        }

        .nav-item.active .nav-label {
          color: white !important;
        }

        .nav-item.active .nav-description {
          color: rgba(255,255,255,0.8) !important;
        }

        .nav-item .nav-icon {
          font-size: 20px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          transition: all 0.3s;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.1);
        }

        .nav-item.active .nav-icon {
          color: white !important;
        }

        .nav-text {
          flex: 1;
          overflow: hidden;
          display: ${collapsed ? 'none' : 'block'};
        }

        .nav-label {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          color: #1a202c;
          transition: all 0.3s;
        }

        .nav-description {
          font-size: 11px;
          color: #a0aec0;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.3s;
        }

        .nav-item.active .nav-description {
          color: rgba(255,255,255,0.7) !important;
        }

        .nav-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 50px;
          flex-shrink: 0;
          min-width: 22px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
          animation: badgePulse 2s infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .nav-badge-collapsed {
          position: absolute;
          top: 4px;
          right: 4px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 50px;
          min-width: 18px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
          animation: badgePulse 2s infinite;
        }

        /* ============================================================
           SIDEBAR FOOTER
           ============================================================ */
        .sidebar-footer {
          border-top: 1px solid #e2e8f0;
          padding: ${collapsed ? '12px 0' : '14px 16px'};
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #f8f9fa;
          margin-top: auto;
        }

        .footer-link, .logout-btn {
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '14px'};
          padding: ${collapsed ? '12px' : '10px 16px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          border-radius: 10px;
          text-decoration: none;
          color: #4a5568;
          transition: all 0.25s;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          font-family: inherit;
          font-size: 14px;
          min-height: 44px;
          font-weight: 500;
        }

        .footer-link:hover {
          background: #eef2ff;
          color: #6366f1;
          transform: translateX(4px);
        }

        .logout-btn {
          color: #ef4444;
        }

        .logout-btn:hover {
          background: #fef2f2;
          color: #dc2626;
          transform: translateX(4px);
        }

        .footer-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        /* ============================================================
           COLLAPSE TOGGLE - IMPROVED
           ============================================================ */
        .collapse-toggle {
          position: fixed;
          bottom: 100px;
          left: ${collapsed ? '60px' : '258px'};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #4a5568;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1060;
          padding: 0;
        }

        .collapse-toggle:hover {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-color: #6366f1;
          transform: scale(1.1);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
        }

        /* ============================================================
           DARK THEME SUPPORT
           ============================================================ */
        [data-theme="dark"] .customer-sidebar {
          background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
          border-right-color: #2d3748;
        }

        [data-theme="dark"] .customer-sidebar::-webkit-scrollbar-track {
          background: #2d3748;
        }

        [data-theme="dark"] .customer-sidebar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #7c3aed, #6d28d9);
        }

        [data-theme="dark"] .sidebar-profile {
          border-bottom-color: #2d3748;
          background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
        }

        [data-theme="dark"] .profile-name {
          color: #f1f5f9;
        }

        [data-theme="dark"] .profile-wallet {
          color: #a0aec0;
        }

        [data-theme="dark"] .nav-item {
          color: #a0aec0;
        }

        [data-theme="dark"] .nav-item:hover {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }

        [data-theme="dark"] .nav-item.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
        }

        [data-theme="dark"] .nav-label {
          color: #f1f5f9;
        }

        [data-theme="dark"] .nav-description {
          color: #a0aec0;
        }

        [data-theme="dark"] .sidebar-footer {
          border-top-color: #2d3748;
          background: #1a202c;
        }

        [data-theme="dark"] .footer-link {
          color: #a0aec0;
        }

        [data-theme="dark"] .footer-link:hover {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }

        [data-theme="dark"] .collapse-toggle {
          background: #2d3748;
          border-color: #4a5568;
          color: #a0aec0;
        }

        [data-theme="dark"] .collapse-toggle:hover {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
        }

        [data-theme="dark"] .loyalty-badge {
          background: linear-gradient(135deg, #2d3748, #4a5568);
          color: #f1f5f9;
          border-color: #4a5568;
        }

        /* ============================================================
           RESPONSIVE
           ============================================================ */
        @media (max-width: 768px) {
          .brand-text {
            font-size: 18px;
          }
          .profile-name {
            font-size: 15px;
          }
          .nav-label {
            font-size: 13px;
          }
          .collapse-toggle {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .customer-sidebar {
            width: 280px !important;
          }
          .sidebar-header {
            padding: 16px 18px;
          }
          .brand-text {
            font-size: 17px;
          }
          .profile-avatar {
            width: 42px;
            height: 42px;
          }
          .nav-item {
            padding: 10px 14px !important;
            min-height: 42px;
          }
        }

        /* ============================================================
           TOOLTIP FOR COLLAPSED STATE
           ============================================================ */
        .nav-tooltip {
          display: none;
        }

        .nav-item:hover .nav-tooltip {
          display: ${collapsed ? 'block' : 'none'};
        }
      `}</style>

      <aside className={`customer-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header with Gradient */}
        <div className="sidebar-header">
          <Link to="/customer/dashboard" className="brand" onClick={closeMobileSidebar}>
            <span className="brand-icon">
              <FaRocket size={16} />
            </span>
            {!collapsed && (
              <span className="brand-text">
                Service<span>Hub</span>
              </span>
            )}
          </Link>
          <button className="sidebar-close" onClick={closeMobileSidebar}>
            ✕
          </button>
        </div>

        {/* Profile Section */}
        <div className={`sidebar-profile ${collapsed ? 'collapsed' : ''}`}>
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
              <p className="profile-name">{user?.name?.split(' ')[0] || 'Customer'}</p>
              <div className="profile-tier">
                <TierIcon size={10} className="tier-icon" /> {tier.name} Member
              </div>
              <div className="profile-wallet">
                <FaWallet size={10} className="wallet-icon" />
                <span className="wallet-amount">{formatNaira(walletBalance)}</span>
              </div>
              {loyaltyPoints > 0 && (
                <div className="loyalty-badge">
                  <FaGift size={12} className="points-icon" />
                  {loyaltyPoints} Points
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasBadge = item.badge !== null && item.badge > 0;
            const isHovered = hoveredItem === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={closeMobileSidebar}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <span className="nav-icon">
                  <Icon style={{ color: active ? 'white' : item.color }} />
                </span>
                {!collapsed && (
                  <div className="nav-text">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                )}
                {!collapsed && hasBadge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
                {collapsed && hasBadge && (
                  <span className="nav-badge-collapsed">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`sidebar-footer ${collapsed ? 'collapsed' : ''}`}>
          <Link to="/" className={`footer-link ${collapsed ? 'collapsed' : ''}`} onClick={closeMobileSidebar}>
            <span className="footer-icon"><FaHome size={18} /></span>
            {!collapsed && <span>Homepage</span>}
          </Link>
          <button className={`logout-btn ${collapsed ? 'collapsed' : ''}`} onClick={handleLogout}>
            <span className="footer-icon"><FaSignOutAlt size={18} /></span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        {!isMobile && (
          <button className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FaAngleRight size={12} /> : <FaAngleLeft size={12} />}
          </button>
        )}
      </aside>
    </>
  );
};

export default CustomerSidebar;