// src/components/Layout/ProviderSidebar.jsx
import React from 'react';
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
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 992);

  React.useEffect(() => {
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

  const sidebarStyles = `
    .provider-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: ${collapsed ? '72px' : '260px'};
      height: 100vh;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1050;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'};
    }

    @media (min-width: 992px) {
      .provider-sidebar {
        transform: translateX(0);
      }
    }

    .sidebar-header {
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f0f4f8;
      flex-shrink: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      color: #1a202c;
      overflow: hidden;
      white-space: nowrap;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      flex-shrink: 0;
    }

    .brand-text {
      transition: opacity 0.2s;
    }

    .brand-highlight {
      color: #10b981;
    }

    .sidebar-close {
      display: none;
      background: none;
      border: none;
      color: #4a5568;
      font-size: 20px;
      cursor: pointer;
      padding: 4px;
    }

    @media (max-width: 991px) {
      .sidebar-close {
        display: block;
      }
    }

    .sidebar-profile {
      padding: ${collapsed ? '16px 0' : '20px 24px'};
      display: flex;
      align-items: center;
      gap: ${collapsed ? '0' : '14px'};
      flex-direction: ${collapsed ? 'column' : 'row'};
      border-bottom: 1px solid #f0f4f8;
      flex-shrink: 0;
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
      border: 2px solid #e2e8f0;
      transition: all 0.2s;
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
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
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

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 12px 10px;
    }

    .sidebar-nav::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 2px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: ${collapsed ? '0' : '12px'};
      padding: ${collapsed ? '10px' : '10px 14px'};
      justify-content: ${collapsed ? 'center' : 'flex-start'};
      border-radius: 10px;
      text-decoration: none;
      color: #4a5568;
      transition: all 0.2s;
      margin-bottom: 2px;
      position: relative;
      cursor: pointer;
    }

    .nav-item:hover {
      background: #f8fafc;
      color: #10b981;
    }

    .nav-item.active {
      background: #ecfdf5;
      color: #10b981;
    }

    .nav-icon {
      font-size: 18px;
      flex-shrink: 0;
      width: 24px;
      text-align: center;
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
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 50px;
      flex-shrink: 0;
      min-width: 20px;
      text-align: center;
    }

    .nav-badge-collapsed {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ef4444;
      color: white;
      font-size: 9px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 50px;
      min-width: 16px;
      text-align: center;
    }

    .sidebar-footer {
      border-top: 1px solid #f0f4f8;
      padding: ${collapsed ? '12px 0' : '12px 16px'};
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
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
    }

    .footer-link:hover {
      background: #f8fafc;
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
    }

    .logout-btn:hover {
      background: #fef2f2;
      color: #dc2626;
    }

    .footer-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

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
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: all 0.2s;
    }

    .collapse-toggle:hover {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.3);
      z-index: 1040;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Dark Theme */
    [data-theme="dark"] .provider-sidebar {
      background: #1a202c;
      border-right-color: #2d3748;
    }

    [data-theme="dark"] .brand {
      color: #f1f5f9;
    }

    [data-theme="dark"] .sidebar-header,
    [data-theme="dark"] .sidebar-profile,
    [data-theme="dark"] .sidebar-footer {
      border-color: #2d3748;
    }

    [data-theme="dark"] .nav-item {
      color: #a0aec0;
    }

    [data-theme="dark"] .nav-item:hover {
      background: rgba(255,255,255,0.05);
      color: #10b981;
    }

    [data-theme="dark"] .nav-item.active {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    [data-theme="dark"] .profile-name {
      color: #f1f5f9;
    }
  `;

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside className="provider-sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/provider/dashboard" className="brand" onClick={closeMobileSidebar}>
            <span className="brand-icon">
              <FaRocket size={16} />
            </span>
            {!collapsed && (
              <span className="brand-text">
                Service<span className="brand-highlight">Hub</span>
              </span>
            )}
          </Link>
          <button className="sidebar-close" onClick={closeMobileSidebar}>
            ✕
          </button>
        </div>

        {/* Profile Section */}
        <div className="sidebar-profile">
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

        {/* Navigation */}
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
        <div className="sidebar-footer">
          <Link to="/" className="footer-link" onClick={closeMobileSidebar}>
            <span className="footer-icon"><FaHome size={18} /></span>
            {!collapsed && <span>Homepage</span>}
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
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