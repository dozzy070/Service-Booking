// src/components/Layout/AdminLayout.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { adminAPI, notificationAPI } from '../../api/api';

const AdminLayout = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved || 'light';
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
  });

  const layoutStyles = `
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #f0f4f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .admin-main {
      flex: 1;
      margin-left: ${collapsed ? '72px' : '260px'};
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 991px) {
      .admin-main {
        margin-left: 0;
      }
    }

    .page-content {
      flex: 1;
      padding: 24px;
    }

    @media (max-width: 768px) {
      .page-content {
        padding: 16px;
      }
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
  `;

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
        pendingApprovals: response.data.pending_approvals || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const response = await notificationAPI.getNotifications({ limit: 10 });
      const notificationsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.notifications || [];
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
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
    } catch (error) {
      console.error('Error marking all as read:', error);
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

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchStats();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchStats();
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchNotifications]);

  return (
    <>
      <style>{layoutStyles}</style>
      <div className={`admin-layout theme-${theme}`}>
        <AdminSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          closeMobileSidebar={closeMobileSidebar}
          totalUsers={stats.totalUsers}
          pendingApprovals={stats.pendingApprovals}
          pendingBookings={stats.pendingBookings}
          user={user}
        />

        <main className="admin-main">
          <AdminTopbar
            toggleSidebar={toggleSidebar}
            theme={theme}
            setTheme={setTheme}
            notifications={notifications}
            unreadCount={unreadCount}
            loadingNotifications={loadingNotifications}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            user={user}
          />

          <div className="page-content">
            <Outlet />
          </div>
        </main>

        {mobileOpen && <div className="sidebar-overlay" onClick={closeMobileSidebar} />}
      </div>
    </>
  );
};

export default AdminLayout;