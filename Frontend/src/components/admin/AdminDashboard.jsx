// src/pages/dashboard/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaServicestack,
  FaCalendarCheck,
  FaChartLine,
  FaMoneyBillWave,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserPlus,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaDollarSign,
  FaPercentage,
  FaChartPie,
  FaRocket,
  FaShieldAlt,
  FaHeartbeat,
  FaAward,
  FaTrophy,
  FaMedal,
  FaCrown,
  FaGem,
  FaExclamationTriangle,
  FaCog,
  FaFileAlt,
  FaInfoCircle,
  FaWallet,
  FaSync,
  FaEye,
  FaRegClock,
  FaFire,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// ============================================================
// STYLES
// ============================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f0f4f8',
    padding: '24px',
  },

  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '24px',
    padding: '32px 40px',
    color: 'white',
    marginBottom: '28px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
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
  welcomeTime: {
    fontSize: '14px',
    opacity: 0.8,
    marginLeft: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  welcomeActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  btnLight: {
    background: 'white',
    color: '#667eea',
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
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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
    background: color || 'linear-gradient(90deg, #667eea, #764ba2)',
    borderRadius: '2px',
    transition: 'width 0.6s ease',
  }),

  quickActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  quickActionBtn: (color, bg) => ({
    padding: '8px 18px',
    borderRadius: '50px',
    border: '1px solid #e2e8f0',
    background: bg || 'transparent',
    color: color || '#4a5568',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
  }),

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
    flexWrap: 'wrap',
    gap: '12px',
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
    color: '#667eea',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
  },

  chartContainer: {
    width: '100%',
    height: '300px',
    position: 'relative',
  },
  chartViewBtn: (active) => ({
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: active ? '600' : '400',
    color: active ? '#667eea' : '#a0aec0',
    cursor: 'pointer',
    padding: '4px 12px',
    transition: 'all 0.2s',
    '&:hover': {
      color: '#667eea',
    },
  }),
  chartHint: {
    textAlign: 'center',
    marginTop: '12px',
    fontSize: '12px',
    color: '#a0aec0',
  },

  activityTimeline: {
    position: 'relative',
    paddingLeft: '30px',
  },
  activityItem: {
    position: 'relative',
    paddingBottom: '20px',
  },
  activityIcon: (color) => ({
    position: 'absolute',
    left: '-30px',
    top: '0',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: color || '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#4a5568',
    zIndex: 1,
  }),
  activityContent: {
    paddingLeft: '15px',
  },
  activityText: {
    marginBottom: '4px',
    fontSize: '14px',
    color: '#1a202c',
  },
  activityTime: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  activityLine: {
    position: 'absolute',
    left: '-18px',
    top: '24px',
    bottom: '-10px',
    width: '2px',
    background: '#e2e8f0',
  },

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

  healthItem: {
    padding: '10px 12px',
    borderRadius: '10px',
    transition: 'all 0.2s',
    marginBottom: '12px',
  },
  healthItemHover: {
    background: '#f8fafc',
  },

  distributionItem: {
    marginBottom: '16px',
  },

  popularServiceItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f0f4f8',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  popularServiceItemLast: {
    borderBottom: 'none',
    paddingBottom: 0,
  },

  achievementCard: {
    textAlign: 'center',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  achievementCardHover: {
    background: '#edf2f7',
    transform: 'scale(1.05)',
  },

  emptyState: {
    textAlign: 'center',
    padding: '30px 20px',
  },
  emptyIcon: {
    fontSize: '32px',
    color: '#cbd5e0',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#a0aec0',
    margin: 0,
  },

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
    welcomeTime: {
      display: 'block',
      marginLeft: '0',
      marginTop: '8px',
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
    quickActions: {
      flexDirection: 'column',
    },
    chartContainer: {
      height: '200px',
    },
  },
};

// ============================================================
// COMPONENT
// ============================================================

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [timeAgo, setTimeAgo] = useState('');
  const [selectedChartView, setSelectedChartView] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredAchievement, setHoveredAchievement] = useState(null);
  const [hoveredHealth, setHoveredHealth] = useState(null);

  const [stats, setStats] = useState({
    users: { total: 0, new: 0, active: 0, suspended: 0, verified: 0, unverified: 0, providers: 0, customers: 0, admins: 0, growth: 0 },
    services: { total: 0, pending: 0, approved: 0, rejected: 0, featured: 0, categories: 0, growth: 0 },
    bookings: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0, disputes: 0, growth: 0 },
    revenue: { total: 0, monthly: 0, weekly: 0, daily: 0, average: 0, commission: 0, growth: 0 },
    ratings: { average: 0, total: 0, fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
  });

  const [chartData, setChartData] = useState({ labels: [], data: [], maxValue: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState({ users: 0, services: 0, reviews: 0, disputes: 0 });
  const [systemHealth, setSystemHealth] = useState({
    server: { status: 'healthy', uptime: '99.9%', responseTime: 45 },
    database: { status: 'healthy', queries: 1200, slowQueries: 3 },
    cache: { status: 'healthy', hitRate: 92 },
    api: { status: 'healthy', requests: 450, errors: 2 },
  });

  // Format helpers
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

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const getStatusBadge = (status) => {
    const map = {
      healthy: { bg: '#d1fae5', color: '#065f46', label: 'Healthy' },
      warning: { bg: '#fef3c7', color: '#b45309', label: 'Warning' },
      critical: { bg: '#fee2e2', color: '#991b1b', label: 'Critical' },
    };
    const item = map[status] || map.healthy;
    return <span style={styles.badge(item.bg, item.color)}>{item.label}</span>;
  };

  // ✅ FIXED API Calls - Using correct adminAPI methods
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('Failed to load statistics');
    }
  }, []);

  const fetchChartData = useCallback(async (view) => {
    try {
      const res = await adminAPI.getRevenueChart(view);
      setChartData(res.data);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await adminAPI.getActivities();
      setRecentActivities(res.data || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  }, []);

  const fetchTopProviders = useCallback(async () => {
    try {
      const res = await adminAPI.getTopProviders();
      setTopProviders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch top providers:', err);
    }
  }, []);

  const fetchPopularServices = useCallback(async () => {
    try {
      const res = await adminAPI.getPopularServices();
      setPopularServices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch popular services:', err);
    }
  }, []);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      const res = await adminAPI.getPendingApprovals();
      setPendingApprovals(res.data);
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    }
  }, []);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const res = await adminAPI.getSystemHealth();
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchStats(),
      fetchChartData(selectedChartView),
      fetchActivities(),
      fetchTopProviders(),
      fetchPopularServices(),
      fetchPendingApprovals(),
      fetchSystemHealth(),
    ]);
    setLoading(false);
  }, [selectedChartView, fetchStats, fetchChartData, fetchActivities, fetchTopProviders, fetchPopularServices, fetchPendingApprovals, fetchSystemHealth]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // Initial load
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const updateTimeAgo = () => {
      const now = new Date();
      setTimeAgo(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTimeAgo();
    const timeInterval = setInterval(updateTimeAgo, 1000);

    fetchAllData();

    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, [fetchAllData]);

  useEffect(() => {
    fetchChartData(selectedChartView);
  }, [selectedChartView, fetchChartData]);

  const handleBarClick = (label, value) => {
    toast.info(`${label} Revenue: ${formatNaira(value)}`);
  };

  const getActivityIcon = (type) => {
    const icons = {
      user: FaUserPlus,
      service: FaServicestack,
      booking: FaCalendarCheck,
      payment: FaMoneyBillWave,
      review: FaStar,
      dispute: FaExclamationTriangle,
    };
    const Icon = icons[type] || FaClock;
    return Icon;
  };

  const getActivityColor = (type) => {
    const colors = {
      user: '#10b981',
      service: '#3b82f6',
      booking: '#8b5cf6',
      payment: '#f59e0b',
      review: '#ec4899',
      dispute: '#ef4444',
    };
    return colors[type] || '#667eea';
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#718096' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { key: 'users', icon: FaUsers, label: 'Total Users', value: formatNumber(stats.users.total), color: '#667eea', bg: 'rgba(102, 126, 234, 0.1)', growth: stats.users.growth, detail: `${formatNumber(stats.users.active)} Active • +${stats.users.new} Today` },
    { key: 'services', icon: FaServicestack, label: 'Total Services', value: formatNumber(stats.services.total), color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', growth: stats.services.growth, detail: `${stats.services.approved} Approved • ${stats.services.pending} Pending` },
    { key: 'bookings', icon: FaCalendarCheck, label: 'Total Bookings', value: formatNumber(stats.bookings.total), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', growth: stats.bookings.growth, detail: `${stats.bookings.active} Active • ${stats.bookings.completed} Completed` },
    { key: 'revenue', icon: FaMoneyBillWave, label: 'Total Revenue', value: formatCompactNaira(stats.revenue.total), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', growth: stats.revenue.growth, detail: `${formatCompactNaira(stats.revenue.monthly)} This Month` },
  ];

  const achievements = [
    { icon: FaAward, label: 'Total Bookings', value: formatNumber(stats.bookings.total), color: '#667eea' },
    { icon: FaTrophy, label: 'Total Users', value: formatNumber(stats.users.total), color: '#f59e0b' },
    { icon: FaMedal, label: 'Avg Rating', value: stats.ratings.average.toFixed(1), color: '#10b981' },
    { icon: FaCrown, label: 'Revenue', value: formatCompactNaira(stats.revenue.total), color: '#8b5cf6' },
  ];

  const healthItems = [
    { key: 'server', label: 'Server', status: systemHealth.server.status, details: [`Uptime: ${systemHealth.server.uptime}`, `Response: ${systemHealth.server.responseTime}ms`] },
    { key: 'database', label: 'Database', status: systemHealth.database.status, details: [`Queries: ${systemHealth.database.queries}/s`, `Slow: ${systemHealth.database.slowQueries}`] },
    { key: 'cache', label: 'Cache', status: systemHealth.cache.status, details: [`Hit Rate: ${systemHealth.cache.hitRate}%`] },
    { key: 'api', label: 'API', status: systemHealth.api.status, details: [`Requests: ${systemHealth.api.requests}/min`, `Errors: ${systemHealth.api.errors}`] },
  ];

  return (
    <div style={styles.container}>
      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeCardBg}></div>
        <div style={styles.welcomeCardBg2}></div>
        <div style={styles.welcomeContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={styles.welcomeTitle}>
                {greeting}, {user?.name?.split(' ')[0] || 'Admin'}! 👋
              </h1>
              <p style={styles.welcomeSubtitle}>
                Welcome back to your admin dashboard. Here's what's happening on your platform today.
                <span style={styles.welcomeTime}>
                  <FaClock size={12} /> {timeAgo}
                </span>
              </p>
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
              <Link to="/admin/reports" style={styles.btnLight}>
                <FaChartLine size={14} /> Reports
              </Link>
              <Link to="/admin/settings" style={styles.btnOutlineLight}>
                <FaCog size={14} /> Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          const isHovered = hoveredStat === idx;
          const isUp = item.growth >= 0;
          return (
            <div
              key={idx}
              style={{
                ...styles.statCard,
                ...(isHovered ? styles.statCardHover : {}),
              }}
              onMouseEnter={() => setHoveredStat(idx)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={styles.statIconWrapper(item.color, item.bg)}>
                  <Icon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={styles.statValue}>{item.value}</div>
                    <div style={styles.statTrend(isUp)}>
                      {isUp ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                      {Math.abs(item.growth)}%
                    </div>
                  </div>
                  <div style={styles.statLabel}>{item.label}</div>
                </div>
              </div>
              <div style={styles.statDetail}>
                <span>{item.detail}</span>
                <FaArrowUp size={12} style={{ color: '#cbd5e0' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '24px' }}>
        <div style={styles.card}>
          <div style={{ ...styles.cardBody, padding: '16px 24px' }}>
            <div style={styles.quickActions}>
              <Link to="/admin/users" style={styles.quickActionBtn('#b45309', '#fef3c7')}>
                <FaUserClock size={12} /> Pending Users ({pendingApprovals.users})
              </Link>
              <Link to="/admin/services" style={styles.quickActionBtn('#1d4ed8', '#dbeafe')}>
                <FaClock size={12} /> Pending Services ({pendingApprovals.services})
              </Link>
              <Link to="/admin/reviews" style={styles.quickActionBtn('#b45309', '#fef3c7')}>
                <FaStar size={12} /> Moderate Reviews ({pendingApprovals.reviews})
              </Link>
              <Link to="/admin/bookings" style={styles.quickActionBtn('#991b1b', '#fee2e2')}>
                <FaExclamationTriangle size={12} /> Disputes ({pendingApprovals.disputes})
              </Link>
              <Link to="/admin/reports" style={styles.quickActionBtn('#1e40af', '#dbeafe')}>
                <FaFileAlt size={12} /> Generate Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* LEFT COLUMN */}
        <div style={styles.leftColumn}>
          {/* Revenue Chart */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaChartLine style={{ color: '#667eea' }} /> Revenue Overview
              </h5>
              <div>
                {['weekly', 'monthly', 'yearly'].map((view) => (
                  <button
                    key={view}
                    style={styles.chartViewBtn(selectedChartView === view)}
                    onClick={() => setSelectedChartView(view)}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.chartContainer}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '12px', paddingTop: '20px' }}>
                  {chartData.labels?.map((label, idx) => {
                    const value = chartData.data?.[idx] || 0;
                    const max = chartData.maxValue || 1;
                    const height = (value / max) * 250;
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleBarClick(label, value)}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(height, 10)}px`,
                            background: `linear-gradient(180deg, #667eea 0%, #764ba2 100%)`,
                            borderRadius: '8px 8px 0 0',
                            transition: 'all 0.3s ease',
                            opacity: value > 0 ? 1 : 0.3,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                            e.currentTarget.style.transform = 'scaleY(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scaleY(1)';
                          }}
                        />
                        <div style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center' }}>
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={styles.chartHint}>
                <FaInfoCircle size={12} /> Click any bar for details
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaRocket style={{ color: '#667eea' }} /> Recent Activities
              </h5>
              <Link to="/admin/logs" style={styles.viewAllLink}>
                <FaFileAlt size={12} /> View All Logs
              </Link>
            </div>
            <div style={styles.cardBody}>
              {recentActivities.length === 0 ? (
                <div style={styles.emptyState}>
                  <FaClock style={styles.emptyIcon} />
                  <p style={styles.emptyText}>No recent activities</p>
                </div>
              ) : (
                <div style={styles.activityTimeline}>
                  {recentActivities.slice(0, 5).map((activity, idx) => {
                    const Icon = getActivityIcon(activity.type);
                    const color = getActivityColor(activity.type);
                    return (
                      <div key={activity.id || idx} style={styles.activityItem}>
                        <div style={styles.activityIcon(color + '20')}>
                          <Icon style={{ color }} size={12} />
                        </div>
                        <div style={styles.activityContent}>
                          <p style={styles.activityText}>
                            <span style={{ fontWeight: '600' }}>{activity.user}</span> {activity.action}
                          </p>
                          <span style={styles.activityTime}>
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        {idx < recentActivities.length - 1 && <div style={styles.activityLine} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Providers */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaTrophy style={{ color: '#f59e0b' }} /> Top Performing Providers
              </h5>
              <Link to="/admin/users" style={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <div style={{ ...styles.cardBody, padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Provider</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Services</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Bookings</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Rating</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProviders.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '30px' }}>
                          <p style={{ color: '#a0aec0' }}>No providers yet</p>
                        </td>
                      </tr>
                    ) : (
                      topProviders.slice(0, 5).map((provider, idx) => (
                        <tr key={provider.id}>
                          <td style={{ ...styles.td, ...(idx === topProviders.length - 1 ? styles.tdLast : {}) }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <img
                                src={provider.avatar || `https://ui-avatars.com/api/?name=${provider.name}&background=667eea&color=fff&size=30`}
                                alt={provider.name}
                                style={{ width: 30, height: 30, borderRadius: '50%' }}
                              />
                              <span style={{ fontWeight: '500' }}>{provider.name}</span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center', ...(idx === topProviders.length - 1 ? styles.tdLast : {}) }}>
                            {provider.services || 0}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center', ...(idx === topProviders.length - 1 ? styles.tdLast : {}) }}>
                            {provider.bookings || 0}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center', ...(idx === topProviders.length - 1 ? styles.tdLast : {}) }}>
                            <span style={{ color: '#f59e0b' }}>
                              <FaStar size={12} style={{ marginRight: '4px' }} />
                              {provider.rating || '0.0'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right', fontWeight: '600', color: '#667eea', ...(idx === topProviders.length - 1 ? styles.tdLast : {}) }}>
                            {formatNaira(provider.revenue || 0)}
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
          {/* System Health */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaHeartbeat style={{ color: '#ef4444' }} /> System Health
              </h5>
            </div>
            <div style={styles.cardBody}>
              {healthItems.map((item, idx) => {
                const isHovered = hoveredHealth === idx;
                return (
                  <div
                    key={item.key}
                    style={{
                      ...styles.healthItem,
                      ...(isHovered ? styles.healthItemHover : {}),
                    }}
                    onMouseEnter={() => setHoveredHealth(idx)}
                    onMouseLeave={() => setHoveredHealth(null)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{item.label}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#718096' }}>
                      {item.details.map((detail, i) => (
                        <span key={i} style={detail.includes('Slow') || detail.includes('Errors') ? { color: '#ef4444' } : {}}>
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Distribution */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaChartPie style={{ color: '#667eea' }} /> User Distribution
              </h5>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.distributionItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Customers</span>
                  <span style={{ fontWeight: '600', color: '#667eea' }}>{formatNumber(stats.users.customers)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill((stats.users.customers / (stats.users.total || 1)) * 100, '#667eea')} />
                </div>
                <small style={{ color: '#a0aec0' }}>{((stats.users.customers / (stats.users.total || 1)) * 100).toFixed(1)}%</small>
              </div>
              <div style={styles.distributionItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Providers</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>{formatNumber(stats.users.providers)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill((stats.users.providers / (stats.users.total || 1)) * 100, '#10b981')} />
                </div>
                <small style={{ color: '#a0aec0' }}>{((stats.users.providers / (stats.users.total || 1)) * 100).toFixed(1)}%</small>
              </div>
              <div style={styles.distributionItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>Admins</span>
                  <span style={{ fontWeight: '600', color: '#3b82f6' }}>{formatNumber(stats.users.admins)}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill((stats.users.admins / (stats.users.total || 1)) * 100, '#3b82f6')} />
                </div>
                <small style={{ color: '#a0aec0' }}>{((stats.users.admins / (stats.users.total || 1)) * 100).toFixed(2)}%</small>
              </div>
            </div>
          </div>

          {/* Popular Services */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaStar style={{ color: '#f59e0b' }} /> Popular Services
              </h5>
              <Link to="/admin/services" style={styles.viewAllLink}>
                View All
              </Link>
            </div>
            <div style={styles.cardBody}>
              {popularServices.length === 0 ? (
                <div style={styles.emptyState}>
                  <FaServicestack style={styles.emptyIcon} />
                  <p style={styles.emptyText}>No services yet</p>
                </div>
              ) : (
                popularServices.slice(0, 3).map((service, idx) => (
                  <div
                    key={service.id}
                    style={{
                      ...styles.popularServiceItem,
                      ...(idx === popularServices.length - 1 ? styles.popularServiceItemLast : {}),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>{service.title}</h6>
                        <small style={{ color: '#a0aec0' }}>{service.category}</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={styles.badge('#fef3c7', '#b45309')}>
                          <FaStar size={10} style={{ marginRight: '4px' }} />
                          {service.rating || '0.0'}
                        </span>
                        <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600', marginTop: '4px' }}>
                          {service.bookings || 0} bookings
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Platform Achievements */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaGem style={{ color: '#f59e0b' }} /> Platform Achievements
              </h5>
            </div>
            <div style={styles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {achievements.map((item, idx) => {
                  const Icon = item.icon;
                  const isHovered = hoveredAchievement === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        ...styles.achievementCard,
                        ...(isHovered ? styles.achievementCardHover : {}),
                      }}
                      onMouseEnter={() => setHoveredAchievement(idx)}
                      onMouseLeave={() => setHoveredAchievement(null)}
                    >
                      <Icon size={24} style={{ color: item.color, marginBottom: '8px' }} />
                      <h6 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a202c' }}>{item.value}</h6>
                      <small style={{ color: '#a0aec0' }}>{item.label}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

export default AdminDashboard;