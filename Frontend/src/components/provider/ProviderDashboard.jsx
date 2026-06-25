// src/pages/dashboard/ProviderDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaDollarSign,
  FaCalendarCheck,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
  FaChartLine,
  FaUsers,
  FaServicestack,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaRegClock,
  FaWallet,
  FaAward,
  FaBell,
  FaCog,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHourglassHalf,
  FaPercentage,
  FaFire,
  FaRocket,
  FaCrown,
  FaMedal,
  FaTrophy,
  FaUserTie,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from 'date-fns';

// ============================================================
// STYLES
// ============================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f4f8',
    padding: '24px',
  },

  // Welcome Card
  welcomeCard: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    borderRadius: '24px',
    padding: '32px 40px',
    color: 'white',
    marginBottom: '28px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
  },
  welcomeCardBg: {
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  welcomeCardBg2: {
    position: 'absolute',
    bottom: '-30%',
    left: '20%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  welcomeContent: {
    position: 'relative',
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  welcomeSubtitle: {
    fontSize: '16px',
    opacity: 0.9,
    marginBottom: '16px',
  },
  welcomeStats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  welcomeStat: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '14px',
    backdropFilter: 'blur(10px)',
  },
  welcomeActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnLight: {
    background: 'white',
    color: '#10b981',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '50px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnOutlineLight: {
    background: 'transparent',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.4)',
    padding: '10px 24px',
    borderRadius: '50px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  statCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  statCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
  },
  statIconWrapper: (color, bgColor) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
    fontSize: '22px',
    flexShrink: 0,
  }),
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c',
    lineHeight: 1.2,
    marginBottom: '2px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: 0,
  },
  statTrend: (isUp) => ({
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    color: isUp ? '#10b981' : '#ef4444',
  }),
  statDetail: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #edf2f7',
    fontSize: '13px',
    color: '#4a5568',
    display: 'flex',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: '4px',
    borderRadius: '2px',
    background: '#e2e8f0',
    marginBottom: '8px',
    overflow: 'hidden',
  },
  progressFill: (percent, color) => ({
    width: `${Math.min(percent, 100)}%`,
    height: '100%',
    background: color || 'linear-gradient(90deg, #10b981, #059669)',
    borderRadius: '2px',
    transition: 'width 0.6s ease',
  }),

  // Main Grid
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '24px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  // Cards
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f0f4f8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardBody: {
    padding: '20px 24px',
  },
  viewAllLink: {
    fontSize: '13px',
    color: '#10b981',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
  },

  // Schedule Item
  scheduleItem: {
    padding: '16px 0',
    borderBottom: '1px solid #f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  scheduleItemLast: {
    borderBottom: 'none',
    paddingBottom: 0,
  },
  scheduleTime: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: '80px',
  },
  scheduleTimeText: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#1a202c',
  },
  scheduleBadge: (bg, color) => ({
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: '50px',
    background: bg,
    color: color,
    marginTop: '2px',
  }),
  scheduleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: '200px',
  },
  scheduleDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    flexShrink: 0,
  },
  scheduleService: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c',
    margin: 0,
  },
  scheduleCustomer: {
    fontSize: '13px',
    color: '#718096',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  scheduleActions: {
    display: 'flex',
    gap: '8px',
  },

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#1a202c',
    borderBottom: '1px solid #f0f4f8',
  },
  tdLast: {
    borderBottom: 'none',
  },

  // Badge
  badge: (bg, color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: '500',
    background: bg,
    color: color,
  }),

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#cbd5e0',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '16px',
    color: '#4a5568',
    marginBottom: '4px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '16px',
  },

  // Performance Card
  performanceCard: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '16px',
    padding: '24px',
  },
  performanceMetric: {
    marginBottom: '16px',
  },
  performanceLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '4px',
  },
  performanceProgress: {
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  performanceFill: (percent) => ({
    width: `${Math.min(percent, 100)}%`,
    height: '100%',
    background: 'white',
    borderRadius: '3px',
    transition: 'width 0.6s ease',
  }),

  // Quick Actions
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  quickActionBtn: (bg, color) => ({
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    background: bg,
    color: color,
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
  }),

  // Notification Item
  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f4f8',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  notificationIcon: (bg) => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '14px',
  }),
  notificationMessage: {
    fontSize: '13px',
    color: '#1a202c',
    margin: 0,
  },
  notificationTime: {
    fontSize: '11px',
    color: '#a0aec0',
  },

  // Service Item
  serviceItem: {
    padding: '12px',
    borderRadius: '12px',
    background: '#f8fafc',
    marginBottom: '12px',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  serviceItemHover: {
    background: '#f1f5f9',
  },

  // Responsive
  '@media (max-width: 1024px)': {
    mainGrid: {
      gridTemplateColumns: '1fr',
    },
  },
  '@media (max-width: 640px)': {
    container: {
      padding: '16px',
    },
    welcomeCard: {
      padding: '24px',
    },
    welcomeTitle: {
      fontSize: '22px',
    },
    statsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    },
    statCard: {
      padding: '16px',
    },
    statValue: {
      fontSize: '22px',
    },
    scheduleItem: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    scheduleActions: {
      width: '100%',
      justifyContent: 'flex-start',
    },
  },
};

// ============================================================
// COMPONENT
// ============================================================

const ProviderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredService, setHoveredService] = useState(null);

  const [stats, setStats] = useState({
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    activeServices: 0,
    pendingApproval: 0,
    totalClients: 0,
    newClientsThisMonth: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 100,
    responseTime: '< 1 hour',
    completionRate: 0,
    earningsGrowth: 0,
    bookingGrowth: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [newDateTime, setNewDateTime] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Format currency
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // Fetch data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, servicesRes, scheduleRes, notifsRes] = await Promise.all([
        api.get('/provider/dashboard/stats'),
        api.get('/provider/dashboard/recent-bookings'),
        api.get('/provider/services'),
        api.get('/provider/dashboard/today-schedule'),
        api.get('/provider/notifications?limit=5'),
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data || []);
      setServices(servicesRes.data || []);
      setUpcomingSchedule(scheduleRes.data || []);
      setNotifications(notifsRes.data || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status !== 404) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard updated');
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Handlers
  const handleStart = async (scheduleItem) => {
    try {
      await api.post(`/provider/bookings/${scheduleItem.bookingId}/start`);
      toast.success('Service started successfully');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start service');
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      await api.put(`/provider/bookings/${bookingId}/complete`);
      toast.success('Service completed successfully');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete service');
    }
  };

  const handleRescheduleClick = (scheduleItem) => {
    setSelectedSchedule(scheduleItem);
    const dt = new Date(scheduleItem.bookingDate);
    const localDateTime = dt.toISOString().slice(0, 16);
    setNewDateTime(localDateTime);
    setShowRescheduleModal(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!selectedSchedule || !newDateTime) return;

    try {
      await api.put(`/provider/bookings/${selectedSchedule.bookingId}/reschedule`, {
        new_date: newDateTime,
      });
      toast.success('Booking rescheduled successfully');
      setShowRescheduleModal(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/provider/services/${serviceToDelete.id}`);
      toast.success('Service deleted successfully');
      setShowDeleteModal(false);
      setServiceToDelete(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service');
    } finally {
      setDeleting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending', icon: FaClock },
      confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed', icon: FaCheckCircle },
      in_progress: { bg: '#e0e7ff', color: '#4338ca', label: 'In Progress', icon: FaRegClock },
      started: { bg: '#dbeafe', color: '#1d4ed8', label: 'Started', icon: FaCheckCircle },
      completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed', icon: FaCheckCircle },
      cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled', icon: FaExclamationCircle },
    };
    const item = map[status] || map.pending;
    const Icon = item.icon;
    return (
      <span style={styles.badge(item.bg, item.color)}>
        <Icon size={10} /> {item.label}
      </span>
    );
  };

  const getScheduleTimeBadge = (bookingDate) => {
    const date = new Date(bookingDate);
    if (isToday(date)) {
      return <span style={styles.scheduleBadge('#d1fae5', '#065f46')}>Today</span>;
    } else if (isTomorrow(date)) {
      return <span style={styles.scheduleBadge('#dbeafe', '#1d4ed8')}>Tomorrow</span>;
    } else {
      const days = differenceInDays(date, new Date());
      return <span style={styles.scheduleBadge('#e2e8f0', '#4a5568')}>In {days} days</span>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#718096' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ============================================================
          WELCOME CARD
          ============================================================ */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeCardBg}></div>
        <div style={styles.welcomeCardBg2}></div>
        <div style={styles.welcomeContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={styles.welcomeTitle}>
                {greeting}, {user?.name?.split(' ')[0] || 'Provider'}! 👋
              </h1>
              <p style={styles.welcomeSubtitle}>
                Here's your business performance overview. You have <strong>{stats.pendingBookings}</strong> pending {stats.pendingBookings === 1 ? 'booking' : 'bookings'} to attend to.
              </p>
              <div style={styles.welcomeStats}>
                <span style={styles.welcomeStat}>
                  <FaDollarSign size={12} /> {formatCompactNaira(stats.weeklyEarnings)} this week
                </span>
                <span style={styles.welcomeStat}>
                  <FaStar size={12} /> {stats.averageRating.toFixed(1)} ★ ({stats.totalReviews} reviews)
                </span>
                <span style={styles.welcomeStat}>
                  <FaUsers size={12} /> {stats.totalClients} clients
                </span>
              </div>
            </div>
            <div style={styles.welcomeActions}>
              <button
                onClick={refreshData}
                disabled={refreshing}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
              </button>
              <Link to="/provider/create-service" style={styles.btnLight}>
                <FaPlus size={14} /> Add Service
              </Link>
              <Link to="/provider/schedule" style={styles.btnOutlineLight}>
                <FaRegClock size={14} /> Schedule
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          STATS CARDS
          ============================================================ */}
      <div style={styles.statsGrid}>
        {[
          { key: 'earnings', icon: FaDollarSign, label: "Today's Earnings", value: formatCompactNaira(stats.todayEarnings), color: '#10b981', bg: '#ecfdf5', trend: stats.earningsGrowth, detail: `Weekly: ${formatCompactNaira(stats.weeklyEarnings)}` },
          { key: 'bookings', icon: FaCalendarCheck, label: 'Total Bookings', value: stats.totalBookings, color: '#6366f1', bg: '#eef2ff', trend: stats.bookingGrowth, detail: `${stats.completedBookings} completed • ${stats.pendingBookings} pending` },
          { key: 'rating', icon: FaStar, label: 'Average Rating', value: stats.averageRating.toFixed(1), color: '#f59e0b', bg: '#fffbeb', trend: null, detail: `${stats.totalReviews} reviews` },
          { key: 'services', icon: FaServicestack, label: 'Active Services', value: stats.activeServices, color: '#3b82f6', bg: '#eff6ff', trend: null, detail: `${stats.pendingApproval} pending approval` },
        ].map((item, idx) => {
          const Icon = item.icon;
          const isHovered = hoveredStat === idx;
          const isUp = item.trend !== null && item.trend >= 0;
          return (
            <div
              key={idx}
              style={{
                ...styles.statCard,
                ...(isHovered ? styles.statCardHover : {}),
              }}
              onMouseEnter={() => setHoveredStat(idx)}
              onMouseLeave={() => setHoveredStat(null)}
              onClick={() => {
                const paths = ['/provider/wallet', '/provider/bookings', '/provider/reviews', '/provider/my-services'];
                navigate(paths[idx]);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={styles.statIconWrapper(item.color, item.bg)}>
                  <Icon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={styles.statValue}>{item.value}</div>
                    {item.trend !== null && (
                      <div style={styles.statTrend(isUp)}>
                        {isUp ? '↑' : '↓'} {Math.abs(item.trend)}%
                      </div>
                    )}
                  </div>
                  <div style={styles.statLabel}>{item.label}</div>
                </div>
              </div>
              <div style={styles.statDetail}>
                <span>{item.detail}</span>
                <FaArrowRight size={12} style={{ color: '#cbd5e0' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================
          MAIN GRID
          ============================================================ */}
      <div style={styles.mainGrid}>
        {/* LEFT COLUMN */}
        <div style={styles.leftColumn}>
          {/* Today's Schedule */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaClock style={{ color: '#10b981' }} /> Today's Schedule
              </h5>
              <Link to="/provider/schedule" style={styles.viewAllLink}>
                Manage Schedule <FaArrowRight size={12} />
              </Link>
            </div>
            <div style={styles.cardBody}>
              {upcomingSchedule.length === 0 ? (
                <div style={styles.emptyState}>
                  <FaCalendarAlt style={styles.emptyIcon} />
                  <h6 style={styles.emptyTitle}>No appointments today</h6>
                  <p style={styles.emptyText}>Your schedule is clear for today</p>
                  <Link to="/provider/schedule" style={{ ...styles.quickActionBtn('#10b981', 'white'), display: 'inline-flex', width: 'auto', padding: '8px 20px' }}>
                    Set Availability
                  </Link>
                </div>
              ) : (
                upcomingSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.scheduleItem,
                      ...(idx === upcomingSchedule.length - 1 ? styles.scheduleItemLast : {}),
                    }}
                  >
                    <div style={styles.scheduleTime}>
                      <span style={styles.scheduleTimeText}>{item.time}</span>
                      {getScheduleTimeBadge(item.bookingDate)}
                    </div>
                    <div style={styles.scheduleInfo}>
                      <div style={styles.scheduleDot}></div>
                      <div>
                        <p style={styles.scheduleService}>{item.service}</p>
                        <p style={styles.scheduleCustomer}>
                          <FaUserTie size={12} /> {item.customer}
                          {item.address && (
                            <><FaMapMarkerAlt size={10} style={{ marginLeft: '8px' }} /> {item.address}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div style={styles.scheduleActions}>
                      <button
                        style={{
                          padding: '6px 16px',
                          borderRadius: '50px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: 'none',
                          background: '#10b981',
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleStart(item)}
                        disabled={item.status === 'started' || item.status === 'completed'}
                      >
                        <FaCheckCircle size={12} style={{ marginRight: '4px' }} />
                        Start
                      </button>
                      <button
                        style={{
                          padding: '6px 16px',
                          borderRadius: '50px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: '1px solid #e2e8f0',
                          background: 'white',
                          color: '#4a5568',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleRescheduleClick(item)}
                      >
                        <FaClock size={12} style={{ marginRight: '4px' }} />
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaCalendarCheck style={{ color: '#10b981' }} /> Recent Bookings
              </h5>
              <Link to="/provider/bookings" style={styles.viewAllLink}>
                View All <FaArrowRight size={12} />
              </Link>
            </div>
            <div style={{ ...styles.cardBody, padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Customer</th>
                      <th style={styles.th}>Service</th>
                      <th style={styles.th}>Date & Time</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                          <p style={{ color: '#a0aec0' }}>No recent bookings</p>
                        </td>
                      </tr>
                    ) : (
                      recentBookings.map((booking, idx) => (
                        <tr key={booking.id}>
                          <td style={{ ...styles.td, ...(idx === recentBookings.length - 1 ? styles.tdLast : {}) }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img
                                src={booking.customerAvatar || `https://ui-avatars.com/api/?name=${booking.customer}&background=10b981&color=fff&size=32`}
                                alt={booking.customer}
                                style={{ width: 32, height: 32, borderRadius: '50%' }}
                              />
                              <span style={{ fontWeight: '500' }}>{booking.customer}</span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, ...(idx === recentBookings.length - 1 ? styles.tdLast : {}) }}>
                            {booking.service}
                          </td>
                          <td style={{ ...styles.td, ...(idx === recentBookings.length - 1 ? styles.tdLast : {}) }}>
                            <div>{format(new Date(booking.date), 'MMM dd, yyyy')}</div>
                            <div style={{ fontSize: '12px', color: '#a0aec0' }}>{booking.time}</div>
                          </td>
                          <td style={{ ...styles.td, ...(idx === recentBookings.length - 1 ? styles.tdLast : {}), fontWeight: '600', color: '#10b981' }}>
                            {formatNaira(booking.amount)}
                          </td>
                          <td style={{ ...styles.td, ...(idx === recentBookings.length - 1 ? styles.tdLast : {}) }}>
                            {getStatusBadge(booking.status)}
                          </td>
                          <td style={{ ...styles.td, ...(idx === recentBookings.length - 1 ? styles.tdLast : {}) }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <Link to={`/provider/bookings/${booking.id}`} style={{ color: '#10b981', padding: '4px' }}>
                                <FaEye size={14} />
                              </Link>
                              {booking.status === 'pending' && (
                                <>
                                  <button onClick={() => handleStart(booking)} style={{ color: '#10b981', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <FaCheckCircle size={14} />
                                  </button>
                                  <button onClick={() => handleRescheduleClick(booking)} style={{ color: '#ef4444', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <FaExclamationCircle size={14} />
                                  </button>
                                </>
                              )}
                              {booking.status === 'in_progress' && (
                                <button onClick={() => handleComplete(booking.id)} style={{ color: '#10b981', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  <FaCheckCircle size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightColumn}>
          {/* Performance Metrics */}
          <div style={styles.performanceCard}>
            <h5 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaChartLine size={18} /> Performance Metrics
            </h5>
            <div style={styles.performanceMetric}>
              <div style={styles.performanceLabel}>
                <span>Response Rate</span>
                <span style={{ fontWeight: '600' }}>{stats.responseRate}%</span>
              </div>
              <div style={styles.performanceProgress}>
                <div style={styles.performanceFill(stats.responseRate)}></div>
              </div>
            </div>
            <div style={styles.performanceMetric}>
              <div style={styles.performanceLabel}>
                <span>Completion Rate</span>
                <span style={{ fontWeight: '600' }}>{stats.completionRate}%</span>
              </div>
              <div style={styles.performanceProgress}>
                <div style={styles.performanceFill(stats.completionRate)}></div>
              </div>
            </div>
            <div style={styles.performanceMetric}>
              <div style={styles.performanceLabel}>
                <span>Customer Satisfaction</span>
                <span style={{ fontWeight: '600' }}>{((stats.averageRating / 5) * 100).toFixed(0)}%</span>
              </div>
              <div style={styles.performanceProgress}>
                <div style={styles.performanceFill((stats.averageRating / 5) * 100)}></div>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
              ⚡ Avg. Response Time: <strong>{stats.responseTime}</strong>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaCog style={{ color: '#10b981' }} /> Quick Actions
              </h5>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.quickActions}>
                <Link to="/provider/create-service" style={styles.quickActionBtn('#10b981', 'white')}>
                  <FaPlus size={14} /> Add New Service
                </Link>
                <Link to="/provider/schedule" style={styles.quickActionBtn('#6366f1', 'white')}>
                  <FaRegClock size={14} /> Update Availability
                </Link>
                <Link to="/provider/wallet" style={styles.quickActionBtn('#f59e0b', 'white')}>
                  <FaWallet size={14} /> Withdraw Earnings
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaBell style={{ color: '#10b981' }} /> Recent Notifications
              </h5>
              <Link to="/provider/notifications" style={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <div style={{ ...styles.cardBody, padding: 0 }}>
              {notifications.length === 0 ? (
                <div style={styles.emptyState}>
                  <FaBell style={styles.emptyIcon} />
                  <p style={styles.emptyText}>No new notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const iconMap = {
                    booking: { icon: FaCalendarCheck, bg: '#3b82f620', color: '#3b82f6' },
                    payment: { icon: FaDollarSign, bg: '#10b98120', color: '#10b981' },
                    review: { icon: FaStar, bg: '#f59e0b20', color: '#f59e0b' },
                    alert: { icon: FaExclamationCircle, bg: '#ef444420', color: '#ef4444' },
                  };
                  const { icon: Icon, bg, color } = iconMap[notif.type] || iconMap.booking;
                  return (
                    <div key={notif.id} style={styles.notificationItem}>
                      <div style={styles.notificationIcon(bg)}>
                        <Icon style={{ color }} size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={styles.notificationMessage}>{notif.message}</p>
                        <span style={styles.notificationTime}>
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Services */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaServicestack style={{ color: '#10b981' }} /> Top Services
              </h5>
              <Link to="/provider/my-services" style={styles.viewAllLink}>
                Manage
              </Link>
            </div>
            <div style={styles.cardBody}>
              {services.length === 0 ? (
                <div style={styles.emptyState}>
                  <FaServicestack style={styles.emptyIcon} />
                  <p style={styles.emptyText}>No services added yet</p>
                  <Link to="/provider/create-service" style={{ ...styles.quickActionBtn('#10b981', 'white'), display: 'inline-flex', width: 'auto', padding: '8px 20px' }}>
                    <FaPlus size={12} style={{ marginRight: '4px' }} /> Add Service
                  </Link>
                </div>
              ) : (
                services.slice(0, 3).map((service, idx) => {
                  const isHovered = hoveredService === idx;
                  return (
                    <div
                      key={service.id}
                      style={{
                        ...styles.serviceItem,
                        ...(isHovered ? styles.serviceItemHover : {}),
                      }}
                      onMouseEnter={() => setHoveredService(idx)}
                      onMouseLeave={() => setHoveredService(null)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>{service.title}</h6>
                          <span style={{ fontSize: '12px', color: '#718096' }}>{service.category}</span>
                        </div>
                        <span style={styles.badge(
                          service.status === 'active' ? '#d1fae5' : '#fef3c7',
                          service.status === 'active' ? '#065f46' : '#b45309'
                        )}>
                          {service.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '700', color: '#10b981' }}>{formatNaira(service.price)}</span>
                          <span style={{ margin: '0 8px', color: '#e2e8f0' }}>•</span>
                          <span><FaStar style={{ color: '#f59e0b' }} size={12} /> {service.rating || 'New'}</span>
                          <span style={{ color: '#a0aec0', fontSize: '12px', marginLeft: '4px' }}>({service.bookings || 0} bookings)</span>
                        </div>
                        <div>
                          <Link to={`/provider/edit-service/${service.id}`} style={{ color: '#10b981', padding: '4px' }}>
                            <FaEdit size={14} />
                          </Link>
                          <button
                            onClick={() => {
                              setServiceToDelete(service);
                              setShowDeleteModal(true);
                            }}
                            style={{ color: '#ef4444', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS (Inline simplified)
          ============================================================ */}
      {showRescheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease',
        }} onClick={() => setShowRescheduleModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            margin: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '8px', fontWeight: '700' }}>Reschedule Booking</h3>
            <p style={{ color: '#718096', marginBottom: '20px' }}>Select a new date and time for this booking.</p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' }}>New Date & Time</label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRescheduleModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#4a5568',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleConfirm}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.3s ease',
        }} onClick={() => setShowDeleteModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            margin: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <FaExclamationCircle size={24} />
              </div>
              <h3 style={{ margin: 0, fontWeight: '700' }}>Delete Service</h3>
            </div>
            <p style={{ color: '#4a5568', marginBottom: '20px' }}>
              Are you sure you want to delete "<strong>{serviceToDelete?.title}</strong>"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: '#4a5568',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                disabled={deleting}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: '500',
                  cursor: 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          GLOBAL STYLES
          ============================================================ */}
      <style>{`
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
        a {
          text-decoration: none;
        }
        button {
          font-family: inherit;
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
      `}</style>
    </div>
  );
};

export default ProviderDashboard;