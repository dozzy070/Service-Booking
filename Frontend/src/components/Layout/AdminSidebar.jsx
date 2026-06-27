// src/components/Layout/AdminSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUsers,
  FaServicestack,
  FaCalendarCheck,
  FaChartLine,
  FaTags,
  FaFileAlt,
  FaUser,
  FaCog,
  FaAngleLeft,
  FaAngleRight,
  FaHome,
  FaMoneyBillWave,
  FaQuestionCircle,
  FaRocket,
  FaCrown,
  FaSignOutAlt,
  FaUserShield,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';

const AdminSidebar = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  closeMobileSidebar,
  totalUsers,
  pendingApprovals,
  pendingBookings,
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

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
  };

  // ✅ ALL admin navigation items
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt, description: 'Overview', badge: null },
    { path: '/admin/users', label: 'Users', icon: FaUsers, description: 'Manage users', badge: totalUsers },
    { path: '/admin/services', label: 'Services', icon: FaServicestack, description: 'Manage services', badge: pendingApprovals > 0 ? pendingApprovals : null },
    { path: '/admin/bookings', label: 'Bookings', icon: FaCalendarCheck, description: 'Track bookings', badge: pendingBookings > 0 ? pendingBookings : null },
    { path: '/admin/payments', label: 'Payments', icon: FaMoneyBillWave, description: 'Financial overview', badge: null },
    { path: '/admin/categories', label: 'Categories', icon: FaTags, description: 'Manage categories', badge: null },
    { path: '/admin/analytics', label: 'Analytics', icon: FaChartLine, description: 'View analytics', badge: null },
    { path: '/admin/reports', label: 'Reports', icon: FaFileAlt, description: 'Generate reports', badge: null },
    { path: '/admin/settings', label: 'Settings', icon: FaCog, description: 'System settings', badge: null },
  ];

  return (
    <>
      <style>{`
        /* ============================================================
           SIDEBAR CONTAINER
           ============================================================ */
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: ${collapsed ? '72px' : '260px'} !important;
          height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-right: 1px solid #334155;
          display: flex !important;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1050;
          overflow-x: hidden;
          overflow-y: auto;
          box-shadow: 2px 0 12px rgba(0,0,0,0.3);
        }

        .admin-sidebar::-webkit-scrollbar {
          width: 3px;
        }

        .admin-sidebar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        @media (max-width: 991px) {
          .admin-sidebar {
            transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            width: 280px !important;
          }
        }

        @media (min-width: 992px) {
          .admin-sidebar {
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
          border-bottom: 1px solid #334155;
          flex-shrink: 0;
          min-height: 70px;
          background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 50%, #a78bfa 100%);
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
          border-bottom: 1px solid #334155;
          flex-shrink: 0;
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
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
          border: 3px solid #8b5cf6;
          transition: all 0.2s;
        }

        .profile-avatar:hover {
          border-color: #a78bfa;
          transform: scale(1.05);
        }

        .status {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #1e293b;
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
          color: white;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-role {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          background: linear-gradient(135deg, #6d28d9, #8b5cf6);
          color: white;
          padding: 2px 10px;
          border-radius: 50px;
          margin-top: 2px;
        }

        .profile-stats {
          font-size: 11px;
          color: #94a3b8;
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
          color: #94a3b8;
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
          background: rgba(139, 92, 246, 0.15);
          color: #c4b5fd;
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
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
          color: #8b5cf6;
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
          color: white;
        }

        .nav-description {
          font-size: 11px;
          color: #94a3b8;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 50px;
          flex-shrink: 0;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }

        .nav-badge-collapsed {
          position: absolute;
          top: 4px;
          right: 4px;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 50px;
          min-width: 16px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }

        /* ============================================================
           SIDEBAR FOOTER
           ============================================================ */
        .sidebar-footer {
          border-top: 1px solid #334155;
          padding: ${collapsed ? '12px 0' : '12px 16px'};
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #0f172a;
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: ${collapsed ? '0' : '12px'};
          padding: ${collapsed ? '10px' : '8px 14px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          border-radius: 8px;
          text-decoration: none;
          color: #94a3b8;
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
          background: rgba(139, 92, 246, 0.15);
          color: #c4b5fd;
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
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
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
          background: #1e293b;
          border: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          z-index: 10;
        }

        .collapse-toggle:hover {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          border-color: #8b5cf6;
          transform: scale(1.1);
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

      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header with Purple Gradient */}
        <div className="sidebar-header">
          <Link to="/admin/dashboard" className="brand" onClick={closeMobileSidebar}>
            <span className="brand-icon">
              <FaRocket size={16} />
            </span>
            {!collapsed && (
              <span className="brand-text">
                Admin
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
              src={user?.avatar || getAvatarUrl(user?.name || 'Admin', 80)}
              alt={user?.name || 'Admin'}
              className="profile-avatar"
              onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Admin', 80))}
            />
            <span className={`status ${isConnected ? 'online' : 'offline'}`}></span>
          </div>
          {!collapsed && (
            <div className="profile-info">
              <p className="profile-name">{user?.name?.split(' ')[0] || 'Admin'}</p>
              <div className="profile-role">
                <FaUserShield size={10} /> Super Admin
              </div>
              <div className="profile-stats">
                <FaUsers size={10} /> {totalUsers?.toLocaleString() || 0} Users
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

export default AdminSidebar;