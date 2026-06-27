// src/components/Layout/CustomerLayout.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import CustomerTopbar from './CustomerTopbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { customerAPI, notificationAPI } from '../../api/api';

const CustomerLayout = () => {
  const { user } = useAuth();
  const { isConnected, unreadMessages } = useSocket();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('customer_theme');
    return saved || 'light';
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [savedServicesCount, setSavedServicesCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  // Add debug logging
  console.log('🔍 CustomerLayout - User:', user);
  console.log('🔍 CustomerLayout - isConnected:', isConnected);
  console.log('🔍 CustomerLayout - unreadMessages:', unreadMessages);

  const layoutStyles = `
    .customer-layout {
      display: flex;
      min-height: 100vh;
      background: #f0f4f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .customer-main {
      flex: 1;
      margin-left: ${collapsed ? '72px' : '260px'};
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 991px) {
      .customer-main {
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

  const fetchUpcomingBookings = useCallback(async () => {
    try {
      const response = await customerAPI.getUpcomingBookings();
      const bookings = Array.isArray(response.data) 
        ? response.data 
        : response.data?.bookings || [];
      setUpcomingBookingsCount(bookings.length || 0);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      setUpcomingBookingsCount(0);
    }
  }, []);

  const fetchSavedServices = useCallback(async () => {
    try {
      const response = await customerAPI.getFavorites();
      const favorites = Array.isArray(response.data) 
        ? response.data 
        : response.data?.favorites || [];
      setSavedServicesCount(favorites.length || 0);
    } catch (error) {
      console.error('Error fetching saved services:', error);
      setSavedServicesCount(0);
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await customerAPI.getWallet();
      setWalletBalance(response.data?.balance || 0);
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
    }
  };

  const closeMobileSidebar = () => {
    if (window.innerWidth < 992) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('customer_theme', theme);
  }, [theme]);

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

  // Log state to debug
  console.log('📊 CustomerLayout State:', {
    upcomingBookingsCount,
    savedServicesCount,
    walletBalance,
    unreadMessages,
    collapsed,
    mobileOpen,
    theme
  });

  return (
    <>
      <style>{layoutStyles}</style>
      <div className={`customer-layout theme-${theme}`}>
        <CustomerSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          closeMobileSidebar={closeMobileSidebar}
          upcomingBookingsCount={upcomingBookingsCount}
          savedServicesCount={savedServicesCount}
          walletBalance={walletBalance}
          unreadMessages={unreadMessages}
          user={user}
        />

        <main className="customer-main">
          <CustomerTopbar
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

        {mobileOpen && <div className="sidebar-overlay" onClick={closeMobileSidebar} />}
      </div>
    </>
  );
};

export default CustomerLayout;