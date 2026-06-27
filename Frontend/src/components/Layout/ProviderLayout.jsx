// src/components/Layout/ProviderLayout.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import ProviderSidebar from './ProviderSidebar';
import ProviderTopbar from './ProviderTopbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { providerAPI, notificationAPI } from '../../api/api';
import WebSocketStatus from '../common/WebSocketStatus'; // Add this import

const ProviderLayout = () => {
  const { user } = useAuth();
  // ✅ Always call useSocket at the top level, before any conditional logic
  const { isConnected, unreadMessages } = useSocket();

  const [collapsed, setCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('provider_sidebar_collapsed');
    return saved === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('provider_theme');
    return saved || 'light';
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  const layoutStyles = `
    .provider-layout {
      display: flex;
      min-height: 100vh;
      background: #f0f4f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .provider-main {
      flex: 1;
      margin-left: ${collapsed ? '72px' : '260px'};
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 991px) {
      .provider-main {
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

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.3s ease;
    }

    .websocket-status-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
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

  // ✅ FIX: providerAPI.getBookings doesn't accept params like this
  // Use the correct endpoint or handle differently
  const fetchPendingBookings = useCallback(async () => {
    try {
      // Use the correct API endpoint for pending bookings
      const response = await providerAPI.getDashboardStats();
      setPendingBookingsCount(response.data?.pendingBookings || 0);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      setPendingBookingsCount(0);
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await providerAPI.getWallet();
      setWalletBalance(response.data?.available_balance || response.data?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0);
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
      localStorage.setItem('provider_sidebar_collapsed', String(!collapsed));
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(false);
    }
  };

  // Save theme to localStorage
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('provider_theme', theme);
  }, [theme]);

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchPendingBookings();
    fetchWalletBalance();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingBookings();
      fetchWalletBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPendingBookings, fetchWalletBalance]);

  return (
    <>
      <style>{layoutStyles}</style>
      <div className={`provider-layout theme-${theme}`}>
        <ProviderSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          closeMobileSidebar={closeMobileSidebar}
          pendingBookingsCount={pendingBookingsCount}
          walletBalance={walletBalance}
          unreadMessages={unreadMessages}
          user={user}
        />

        <main className="provider-main">
          <ProviderTopbar
            toggleSidebar={toggleSidebar}
            theme={theme}
            setTheme={setTheme}
            notifications={notifications}
            unreadCount={unreadCount}
            loadingNotifications={loadingNotifications}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            walletBalance={walletBalance}
            user={user}
          />

          <div className="page-content">
            <Outlet />
          </div>
        </main>

        {/* ✅ WebSocketStatus - Always rendered, not conditionally */}
        <div className="websocket-status-container">
          <WebSocketStatus />
        </div>

        {mobileOpen && <div className="sidebar-overlay" onClick={closeMobileSidebar} />}
      </div>
    </>
  );
};

export default ProviderLayout;