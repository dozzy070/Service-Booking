// src/pages/dashboard/CustomerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCalendarCheck,
  FaHeart,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
  FaUserTie,
  FaWallet,
  FaGift,
  FaTrophy,
  FaMedal,
  FaAward,
  FaRocket,
  FaHeadset,
  FaRegClock,
  FaFire,
  FaCrown,
  FaBell,
  FaChartLine,
  FaPercentage,
  FaShoppingBag,
  FaUserCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import toast from 'react-hot-toast';

// ============================================================
// STYLED COMPONENTS (CSS-in-JS)
// ============================================================

const styles = {
  // Container
  container: {
    minHeight: '100vh',
    background: '#f0f4f8',
    padding: '24px',
  },

  // Header / Welcome
  welcomeCard: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    borderRadius: '24px',
    padding: '32px 40px',
    color: 'white',
    marginBottom: '28px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
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
  exploreBtn: {
    background: 'white',
    color: '#6366f1',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '50px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
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
  statDetail: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #edf2f7',
    fontSize: '13px',
    color: '#4a5568',
    display: 'flex',
    justifyContent: 'space-between',
  },

  // Membership Card
  membershipCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '16px',
    padding: '24px 32px',
    marginBottom: '28px',
    border: 'none',
  },
  tierIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f59e0b',
    fontSize: '28px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  progressBar: {
    height: '6px',
    borderRadius: '3px',
    background: '#e2e8f0',
    marginTop: '8px',
    overflow: 'hidden',
  },
  progressFill: (percent) => ({
    width: `${percent}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #f59e0b, #f97316)',
    borderRadius: '3px',
    transition: 'width 0.6s ease',
  }),

  // Main Layout
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
    color: '#6366f1',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '500',
  },

  // Booking Item
  bookingItem: {
    padding: '16px 0',
    borderBottom: '1px solid #f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  bookingItemLast: {
    borderBottom: 'none',
    paddingBottom: 0,
  },
  bookingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: '200px',
  },
  providerAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '16px',
    flexShrink: 0,
  },
  bookingMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  bookingService: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#1a202c',
    margin: 0,
  },
  bookingProvider: {
    fontSize: '13px',
    color: '#718096',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  bookingDate: {
    fontSize: '13px',
    color: '#4a5568',
    textAlign: 'center',
    minWidth: '80px',
  },
  bookingDateDay: {
    fontWeight: '600',
    fontSize: '15px',
  },
  bookingPrice: {
    fontWeight: '700',
    color: '#6366f1',
    fontSize: '16px',
    minWidth: '80px',
    textAlign: 'right',
  },
  bookingActions: {
    display: 'flex',
    gap: '8px',
  },
  btnSmall: {
    padding: '6px 16px',
    borderRadius: '50px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid #e2e8f0',
    background: 'white',
    color: '#4a5568',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  btnPrimary: {
    background: '#6366f1',
    color: 'white',
    border: 'none',
  },

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

  // Activity Item
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 0',
    borderBottom: '1px solid #f0f4f8',
  },
  activityIcon: (color, bg) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  }),
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#1a202c',
    margin: 0,
  },
  activityTime: {
    fontSize: '12px',
    color: '#a0aec0',
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

  // Quick Actions
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
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
  }),

  // Recommended Service
  recommendedItem: {
    display: 'flex',
    gap: '14px',
    padding: '12px',
    borderRadius: '12px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f4f8',
  },
  recommendedImg: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  recommendedInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  recommendedTitle: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#1a202c',
    margin: 0,
  },
  recommendedRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#718096',
  },
  recommendedFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedPrice: {
    fontWeight: '700',
    color: '#6366f1',
    fontSize: '15px',
  },
  recommendedBookBtn: {
    padding: '4px 16px',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid #6366f1',
    background: 'transparent',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },

  // Reminder
  reminderItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #f0f4f8',
  },
  reminderDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f59e0b',
    marginTop: '6px',
    flexShrink: 0,
  },
  reminderText: {
    fontSize: '14px',
    color: '#1a202c',
    margin: 0,
  },
  reminderTime: {
    fontSize: '12px',
    color: '#a0aec0',
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
    bookingItem: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    bookingPrice: {
      textAlign: 'left',
    },
    quickActions: {
      gridTemplateColumns: '1fr',
    },
  },
};

// ============================================================
// COMPONENT
// ============================================================

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    favorites: 0,
    reviews: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    nextReward: 500,
    savings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [trendingServices, setTrendingServices] = useState([]);
  const [hoveredStat, setHoveredStat] = useState(null);

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

  // Set greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, recommendationsRes, remindersRes, featuredRes, trendingRes] =
        await Promise.all([
          customerAPI.getDashboardStats(),
          customerAPI.getRecentBookings(),
          customerAPI.getRecommendedServices(),
          customerAPI.getReminders(),
          customerAPI.getFeaturedServices(),
          customerAPI.getTrendingServices(),
        ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data || []);
      setRecommendedServices(recommendationsRes.data || []);
      setUpcomingReminders(remindersRes.data || []);
      setFeaturedServices(featuredRes.data || []);
      setTrendingServices(trendingRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
  }, [fetchDashboardData]);

  // Get status badge
  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending', icon: FaClock },
      confirmed: { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed', icon: FaCheckCircle },
      in_progress: { bg: '#e0e7ff', color: '#4338ca', label: 'In Progress', icon: FaRegClock },
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

  // Get date badge
  const getDateBadge = (date) => {
    const d = new Date(date);
    if (isToday(d)) {
      return <span style={{ ...styles.badge('#d1fae5', '#065f46'), fontSize: '10px' }}>Today</span>;
    }
    if (isTomorrow(d)) {
      return <span style={{ ...styles.badge('#dbeafe', '#1d4ed8'), fontSize: '10px' }}>Tomorrow</span>;
    }
    return null;
  };

  // Get membership tier
  const getMembershipTier = () => {
    if (stats.totalSpent >= 500000) return { name: 'Platinum', icon: FaCrown, color: '#7c3aed' };
    if (stats.totalSpent >= 200000) return { name: 'Gold', icon: FaTrophy, color: '#d97706' };
    if (stats.totalSpent >= 50000) return { name: 'Silver', icon: FaMedal, color: '#6b7280' };
    return { name: 'Bronze', icon: FaAward, color: '#b45309' };
  };

  const tier = getMembershipTier();
  const TierIcon = tier.icon;

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
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
                {greeting}, {user?.name?.split(' ')[0] || 'Customer'}! 👋
              </h1>
              <p style={styles.welcomeSubtitle}>
                Welcome back! Here's what's happening with your services today.
              </p>
              <div style={styles.welcomeStats}>
                <span style={styles.welcomeStat}>
                  <FaStar size={12} /> {stats.completedBookings} Services Completed
                </span>
                <span style={styles.welcomeStat}>
                  <FaFire size={12} /> {stats.loyaltyPoints} Points
                </span>
                <span style={styles.welcomeStat}>
                  <FaWallet size={12} /> {formatCompactNaira(stats.totalSpent)} Spent
                </span>
              </div>
            </div>
            <div>
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
                  marginRight: '12px',
                }}
              >
                {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
              </button>
              <Link to="/services" style={styles.exploreBtn}>
                Explore Services <FaArrowRight size={14} />
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
          { key: 'total', icon: FaCalendarCheck, label: 'Total Bookings', value: stats.totalBookings, color: '#6366f1', bg: '#eef2ff', detail: `${stats.upcomingBookings} upcoming` },
          { key: 'favorites', icon: FaHeart, label: 'Favorites', value: stats.favorites, color: '#ef4444', bg: '#fef2f2', detail: 'View all →' },
          { key: 'reviews', icon: FaStar, label: 'Reviews', value: stats.reviews, color: '#f59e0b', bg: '#fffbeb', detail: 'Write a review →' },
          { key: 'spent', icon: FaWallet, label: 'Total Spent', value: formatCompactNaira(stats.totalSpent), color: '#10b981', bg: '#ecfdf5', detail: `Saved ${formatCompactNaira(stats.savings)}` },
        ].map((item, idx) => {
          const Icon = item.icon;
          const isHovered = hoveredStat === idx;
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
                const paths = ['/customer/bookings', '/customer/favorites', '/customer/reviews', '/customer/wallet'];
                navigate(paths[idx]);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={styles.statIconWrapper(item.color, item.bg)}>
                  <Icon />
                </div>
                <div>
                  <div style={styles.statValue}>{item.value}</div>
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
          MEMBERSHIP CARD
          ============================================================ */}
      <div style={styles.membershipCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={styles.tierIcon}>
              <TierIcon />
            </div>
            <div>
              <h5 style={{ margin: 0, fontWeight: '600', color: '#92400e' }}>{tier.name} Member</h5>
              <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
                {stats.loyaltyPoints} points • {formatCompactNaira(stats.totalSpent)} spent
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#78350f' }}>Next Reward</div>
              <div style={{ fontWeight: '600', color: '#92400e' }}>{stats.nextReward} points needed</div>
            </div>
            <button
              style={{
                background: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '50px',
                fontWeight: '500',
                fontSize: '14px',
                color: '#92400e',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <FaGift style={{ marginRight: '6px' }} /> View Rewards
            </button>
          </div>
        </div>
        <div style={styles.progressBar}>
          <div
            style={styles.progressFill(
              (stats.loyaltyPoints / (stats.loyaltyPoints + stats.nextReward)) * 100
            )}
          />
        </div>
      </div>

      {/* ============================================================
          MAIN GRID
          ============================================================ */}
      <div style={styles.mainGrid}>
        {/* LEFT COLUMN */}
        <div style={styles.leftColumn}>
          {/* Upcoming Bookings */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaClock style={{ color: '#6366f1' }} /> Upcoming Bookings
              </h5>
              <Link to="/customer/bookings" style={styles.viewAllLink}>
                View All <FaArrowRight size={12} />
              </Link>
            </div>
            <div style={styles.cardBody}>
              {recentBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length > 0 ? (
                recentBookings
                  .filter(b => b.status === 'pending' || b.status === 'confirmed')
                  .map((booking, idx) => (
                    <div
                      key={booking.id}
                      style={{
                        ...styles.bookingItem,
                        ...(idx === recentBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length - 1
                          ? styles.bookingItemLast
                          : {}),
                      }}
                    >
                      <div style={styles.bookingInfo}>
                        <div style={styles.providerAvatar}>
                          {booking.provider_name?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div style={styles.bookingMeta}>
                          <p style={styles.bookingService}>{booking.service_name}</p>
                          <p style={styles.bookingProvider}>
                            <FaUserTie size={12} /> {booking.provider_name}
                          </p>
                        </div>
                      </div>
                      <div style={styles.bookingDate}>
                        <div style={styles.bookingDateDay}>
                          {format(new Date(booking.date), 'MMM dd')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#a0aec0' }}>{booking.time}</div>
                        {getDateBadge(booking.date)}
                      </div>
                      <div style={styles.bookingPrice}>
                        {formatCompactNaira(booking.amount)}
                      </div>
                      <div style={styles.bookingActions}>
                        <Link
                          to={`/customer/bookings/${booking.id}`}
                          style={{ ...styles.btnSmall, ...styles.btnPrimary }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))
              ) : (
                <div style={styles.emptyState}>
                  <FaCalendarCheck style={styles.emptyIcon} />
                  <h6 style={styles.emptyTitle}>No upcoming bookings</h6>
                  <p style={styles.emptyText}>Book a service to get started</p>
                  <Link to="/services" style={{ ...styles.btnSmall, ...styles.btnPrimary }}>
                    Browse Services
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <FaChartLine style={{ color: '#6366f1' }} /> Recent Activity
              </h5>
            </div>
            <div style={styles.cardBody}>
              {recentBookings.slice(0, 4).map((booking, idx) => {
                const statusColors = {
                  completed: { color: '#10b981', bg: '#ecfdf5' },
                  cancelled: { color: '#ef4444', bg: '#fef2f2' },
                  pending: { color: '#f59e0b', bg: '#fffbeb' },
                  confirmed: { color: '#3b82f6', bg: '#eff6ff' },
                };
                const sc = statusColors[booking.status] || statusColors.pending;
                return (
                  <div key={booking.id} style={{ ...styles.activityItem, borderBottom: idx < 3 ? '1px solid #f0f4f8' : 'none' }}>
                    <div style={styles.activityIcon(sc.color, sc.bg)}>
                      {booking.status === 'completed' ? <FaCheckCircle /> :
                       booking.status === 'cancelled' ? <FaExclamationCircle /> :
                       <FaClock />}
                    </div>
                    <div style={styles.activityContent}>
                      <p style={styles.activityTitle}>{booking.service_name}</p>
                      <span style={styles.activityTime}>
                        {formatDistanceToNow(new Date(booking.date), { addSuffix: true })} • {formatCompactNaira(booking.amount)}
                      </span>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightColumn}>
          {/* Quick Actions */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Quick Actions</h5>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.quickActions}>
                <Link to="/services" style={styles.quickActionBtn('#6366f1', 'white')}>
                  <FaRocket /> Book Service
                </Link>
                <Link to="/customer/wallet" style={styles.quickActionBtn('#10b981', 'white')}>
                  <FaWallet /> Add Funds
                </Link>
                <Link to="/customer/support" style={styles.quickActionBtn('#3b82f6', 'white')}>
                  <FaHeadset /> Support
                </Link>
                <Link to="/customer/favorites" style={styles.quickActionBtn('#ef4444', 'white')}>
                  <FaHeart /> Favorites
                </Link>
              </div>
            </div>
          </div>

          {/* Recommended Services */}
          {recommendedServices.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h5 style={styles.cardTitle}>
                  <FaFire style={{ color: '#f59e0b' }} /> Recommended
                </h5>
                <Link to="/services" style={styles.viewAllLink}>
                  View All
                </Link>
              </div>
              <div style={styles.cardBody}>
                {recommendedServices.slice(0, 3).map(service => (
                  <div key={service.id} style={styles.recommendedItem}>
                    <img
                      src={service.image || 'https://via.placeholder.com/64'}
                      alt={service.title}
                      style={styles.recommendedImg}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/64'; }}
                    />
                    <div style={styles.recommendedInfo}>
                      <div>
                        <p style={styles.recommendedTitle}>{service.title}</p>
                        <div style={styles.recommendedRating}>
                          <FaStar style={{ color: '#f59e0b' }} size={12} />
                          {service.rating} ({service.reviews} reviews)
                        </div>
                      </div>
                      <div style={styles.recommendedFooter}>
                        <span style={styles.recommendedPrice}>{formatCompactNaira(service.price)}</span>
                        <Link to={`/services/${service.id}`} style={styles.recommendedBookBtn}>
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminders */}
          {upcomingReminders.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h5 style={styles.cardTitle}>
                  <FaBell style={{ color: '#f59e0b' }} /> Reminders
                </h5>
              </div>
              <div style={styles.cardBody}>
                {upcomingReminders.slice(0, 3).map(reminder => (
                  <div key={reminder.id} style={styles.reminderItem}>
                    <div style={styles.reminderDot}></div>
                    <div>
                      <p style={styles.reminderText}>{reminder.message}</p>
                      <span style={styles.reminderTime}>
                        {formatDistanceToNow(new Date(reminder.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          GLOBAL STYLES
          ============================================================ */}
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
        }
        a {
          text-decoration: none;
        }
        button {
          font-family: inherit;
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
      `}</style>
    </div>
  );
};

export default CustomerDashboard;