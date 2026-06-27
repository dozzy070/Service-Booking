// src/components/Layout/ProviderSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaUser,
  FaCog,
  FaComments,
  FaStar,
  FaAngleLeft,
  FaAngleRight,
  FaHome,
  FaWallet,
  FaQuestionCircle,
  FaServicestack,
  FaRocket,
  FaCrown,
  FaSignOutAlt,
  FaCreditCard,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';

const ProviderSidebar = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  closeMobileSidebar,
  pendingBookingsCount,
  walletBalance,
  unreadMessages,
  user,
}) => {
  const { logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

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

  // ✅ ALL provider navigation items
  const navItems = [
    { path: '/provider/dashboard', label: 'Dashboard', icon: FaTachometerAlt, description: 'Overview & stats', badge: null },
    { path: '/provider/my-services', label: 'My Services', icon: FaServicestack, description: 'Manage your services', badge: null },
    { path: '/provider/bookings', label: 'Bookings', icon: FaCalendarCheck, description: 'Manage appointments', badge: pendingBookingsCount },
    { path: '/provider/wallet', label: 'Wallet', icon: FaWallet, description: formatNaira(walletBalance), badge: null },
    { path: '/provider/reviews', label: 'Reviews', icon: FaStar, description: 'Customer feedback', badge: null },
    { path: '/provider/chat', label: 'Messages', icon: FaComments, description: 'Chat with customers', badge: unreadMessages },
    { path: '/provider/payment-methods', label: 'Payments', icon: FaCreditCard, description: 'Payment methods', badge: null },
    { path: '/provider/profile', label: 'Profile', icon: FaUser, description: 'Manage account', badge: null },
    { path: '/provider/settings', label: 'Settings', icon: FaCog, description: 'Preferences', badge: null },
    { path: '/provider/help', label: 'Help', icon: FaQuestionCircle, description: 'Support & guides', badge: null },
  ];

  const getProviderTier = () => {
    return { name: 'Professional', icon: FaCrown };
  };

  const tier = getProviderTier();
  const TierIcon = tier.icon;

  return (
    <>
      <style>{`
        /* ============================================================
           SIDEBAR CONTAINER
           ============================================================ */
        .provider-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: ${collapsed ? '72px' : '260px'} !important;
          height: 100vh;
          background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
          border-right: 1px solid #e2e8f0;
          display: flex !important;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1050;
          overflow-x: hidden;
          overflow-y: auto;
          box-shadow: 2px 0 12px rgba(0,0,0,0.06);
        }

        .provider-sidebar::-webkit-scrollbar {
          width: 3px;
        }

        .provider-sidebar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }

        @media (max-width: 991px) {
          .provider-sidebar {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            width: 280px !important;
          }
        }

        @media (min-width: 992px) {
          .provider-sidebar {
            transform: translateX(0) !important;
          }
        }

        /* ============================================================
           SIDEBAR HEADER
           ============================================================ */
        .sidebar-header {
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'space-between'};
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
          min-height: 70px;
          background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
          color: white;
          overflow: hidden;
          white-space: nowrap;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          flex-shrink: 0;
          backdrop-filter: blur(10px);
        }

        .brand-text {
          transition: opacity 0.2s;
          font-size: 18px;
          color: white;
        }

        .sidebar-close {
          display: none;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
        }

        @media (max-width: 991px) {
          .sidebar-close {
            display: block;
          }
        }

        /* ============================================================
           PROFILE SECTION
           ============================================================ */
        .sidebar-profile {
          padding: ${collapsed ? '16px 0' : '20px 24px'};
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '14px'};
          flex-direction: ${collapsed ? 'column' : 'row'};
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
        }

        .profile-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .profile-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #10b981;
          transition: all 0.2s;
        }

        .profile-avatar:hover {
          border-color: #059669;
          transform: scale(1.05);
        }

        .status {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          transition: all 0.3s;
        }

        .status.online {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .status.offline {
          background: #ef4444;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }

        .profile-info {
          flex: 1;
          min-width: 0;
          display: ${collapsed ? 'none' : 'block'};
        }

        .profile-name {
          font-weight: 600;
          font-size: 15px;
          color: #1a202c;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-tier {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
          padding: 2px 10px;
          border-radius: 50px;
          margin-top: 2px;
        }

        .profile-stats {
          font-size: 12px;
          color: #718096;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ============================================================
           NAVIGATION
           ============================================================ */
        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-item {
          display: flex !important;
          align-items: center !important;
          gap: ${collapsed ? '0' : '12px'} !important;
          padding: ${collapsed ? '10px' : '10px 14px'} !important;
          justify-content: ${collapsed ? 'center' : 'flex-start'} !important;
          border-radius: 10px;
          text-decoration: none;
          color: #4a5568;
          transition: all 0.2s ease;
          margin-bottom: 2px;
          position: relative;
          cursor: pointer;
          min-height: 44px;
          width: 100%;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .nav-item:hover {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          color: #10b981;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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

        .nav-icon {
          font-size: 18px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
        }

        .nav-text {
          flex: 1;
          overflow: hidden;
          display: ${collapsed ? 'none' : 'block'};
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          color: #1a202c;
        }

        .nav-description {
          font-size: 11px;
          color: #a0aec0;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 50px;
          flex-shrink: 0;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .nav-badge-collapsed {
          position: absolute;
          top: 4px;
          right: 4px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 50px;
          min-width: 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        /* ============================================================
           SIDEBAR FOOTER
           ============================================================ */
        .sidebar-footer {
          border-top: 1px solid #e2e8f0;
          padding: ${collapsed ? '12px 0' : '12px 16px'};
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #f8f9fa;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '12px'};
          padding: ${collapsed ? '10px' : '8px 14px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          border-radius: 8px;
          text-decoration: none;
          color: #4a5568;
          transition: all 0.2s;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          font-family: inherit;
          font-size: 14px;
          min-height: 40px;
        }

        .footer-link:hover {
          background: #ecfdf5;
          color: #10b981;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '12px'};
          padding: ${collapsed ? '10px' : '8px 14px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          border-radius: 8px;
          text-decoration: none;
          color: #ef4444;
          transition: all 0.2s;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          font-family: inherit;
          font-size: 14px;
          min-height: 40px;
        }

        .logout-btn:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .footer-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        /* ============================================================
           COLLAPSE TOGGLE
           ============================================================ */
        .collapse-toggle {
          position: absolute;
          bottom: 20px;
          right: -12px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #4a5568;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.2s;
          z-index: 10;
        }

        .collapse-toggle:hover {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-color: #10b981;
          transform: scale(1.1);
        }

        /* ============================================================
           DARK THEME
           ============================================================ */
        [data-theme="dark"] .provider-sidebar {
          background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
          border-right-color: #2d3748;
        }

        [data-theme="dark"] .sidebar-header {
          border-bottom-color: #2d3748;
        }

        [data-theme="dark"] .brand {
          color: white;
        }

        [data-theme="dark"] .sidebar-profile {
          border-bottom-color: #2d3748;
          background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
        }

        [data-theme="dark"] .profile-name {
          color: #f1f5f9;
        }

        [data-theme="dark"] .profile-stats {
          color: #a0aec0;
        }

        [data-theme="dark"] .nav-item {
          color: #a0aec0;
        }

        [data-theme="dark"] .nav-item:hover {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        [data-theme="dark"] .nav-item.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        [data-theme="dark"] .collapse-toggle {
          background: #2d3748;
          border-color: #4a5568;
          color: #a0aec0;
        }

        [data-theme="dark"] .collapse-toggle:hover {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        /* ============================================================
           RESPONSIVE
           ============================================================ */
        @media (max-width: 768px) {
          .brand-text {
            font-size: 16px;
          }
          .profile-name {
            font-size: 14px;
          }
          .nav-label {
            font-size: 13px;
          }
        }
      `}</style>

      <aside className={`provider-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header with Green Gradient */}
        <div className="sidebar-header">
          <Link to="/provider/dashboard" className="brand" onClick={closeMobileSidebar}>
            <span className="brand-icon">
              <FaRocket size={16} />
            </span>
            {!collapsed && (
              <span className="brand-text">
                Service
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
              src={user?.avatar || getAvatarUrl(user?.name || 'Provider', 80)}
              alt={user?.name || 'Provider'}
              className="profile-avatar"
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Provider', 80))}
            />
            <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
          </div>
          {!collapsed && (
            <div className="profile-info">
              <p className="profile-name">{user?.name?.split(' ')[0] || 'Provider'}</p>
              <div className="profile-tier">
                <TierIcon size={10} /> {tier.name}
              </div>
              <div className="profile-stats">
                <FaStar style={{ color: '#f59e0b' }} size={10} />
                {user?.rating || 'New'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation - All items visible */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasBadge = item.badge !== null && item.badge > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={closeMobileSidebar}
              >
                <span className="nav-icon">
                  <Icon />
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

export default ProviderSidebar;