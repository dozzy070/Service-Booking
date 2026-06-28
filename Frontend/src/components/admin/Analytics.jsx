// src/pages/admin/Analytics.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Dropdown,
  Modal,
  Nav,
  ProgressBar,
  Pagination,
  Toast,
  ToastContainer,
  Spinner,
  Alert,
} from 'react-bootstrap';
import {
  FaChartLine,
  FaUsers,
  FaServicestack,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaStar,
  FaDownload,
  FaPrint,
  FaShare,
  FaFilter,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaFlag,
  FaReply,
  FaTrash,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaRedo,
  FaInfoCircle,
  FaTag,
  FaThumbsUp,
  FaThumbsDown,
  FaCalendarAlt,
  FaFilePdf,
  FaFileExcel,
  FaFileAlt,
  FaUserPlus,
  FaUserMinus,
  FaUserCheck,
  FaUserTimes,
  FaShoppingCart,
  FaWallet,
  FaMinus,
  FaPlus,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaExternalLinkAlt,
  FaLink,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaWhatsapp,
  FaTelegram
} from 'react-icons/fa';

import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

// ============================================================
// ANALYTICS CHART COMPONENT (Built-in)
// ============================================================

const AnalyticsChart = ({
  data = [],
  type = 'line',
  xKey = 'name',
  yKey = 'value',
  title,
  subtitle,
  height = 300,
  colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'],
  currency = false,
  currencySymbol = '₦',
  showDataPoints = true,
  animated = true,
  showControls = true,
  onBarClick,
  loading = false
}) => {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
        <Card.Body className="d-flex align-items-center justify-content-center" style={{ height: `${height}px` }}>
          <Spinner animation="border" variant="primary" />
        </Card.Body>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
        <Card.Body className="d-flex align-items-center justify-content-center" style={{ height: `${height}px` }}>
          <p className="text-muted">No data available</p>
        </Card.Body>
      </Card>
    );
  }

  const formatValue = (value) => {
    const num = Number(value) || 0;
    if (currency) {
      return `${currencySymbol}${num.toLocaleString()}`;
    }
    return num.toLocaleString();
  };

  // Calculate max value for chart scaling
  const maxValue = Math.max(...data.map(d => Number(d[yKey] || 0)), 1);
  const chartHeight = height - 60;

  // Render different chart types using pure SVG
  const renderChart = () => {
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };
    const chartWidth = '100%';
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const getPoint = (index, value) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - ((value / maxValue) * 100);
      return { x: `${x}%`, y: `${y}%` };
    };

    const getBarWidth = () => {
      const barCount = data.length;
      if (barCount <= 5) return '15%';
      if (barCount <= 10) return '8%';
      if (barCount <= 20) return '4%';
      return '2.5%';
    };

    switch (type) {
      case 'pie': {
        const total = data.reduce((sum, d) => sum + Number(d[yKey] || 0), 0);
        let cumulativeAngle = 0;
        const pieData = data.map((d, i) => {
          const value = Number(d[yKey] || 0);
          const percentage = total > 0 ? (value / total) * 100 : 0;
          const angle = (value / total) * 360 || 0;
          const startAngle = cumulativeAngle;
          cumulativeAngle += angle;
          return { ...d, value, percentage, startAngle, angle, color: colors[i % colors.length] };
        });

        const size = Math.min(innerHeight, 200);
        const radius = size / 2;
        const centerX = 50;
        const centerY = 50;

        return (
          <svg viewBox={`0 0 100 100`} style={{ width: '100%', height: '100%' }}>
            {pieData.map((d, i) => {
              const startRad = (d.startAngle * Math.PI) / 180;
              const endRad = ((d.startAngle + d.angle) * Math.PI) / 180;
              const x1 = 50 + radius * 0.7 * Math.cos(startRad);
              const y1 = 50 + radius * 0.7 * Math.sin(startRad);
              const x2 = 50 + radius * 0.7 * Math.cos(endRad);
              const y2 = 50 + radius * 0.7 * Math.sin(endRad);
              const largeArc = d.angle > 180 ? 1 : 0;
              
              const pathData = `
                M 50 50
                L ${x1} ${y1}
                A ${radius * 0.7} ${radius * 0.7} 0 ${largeArc} 1 ${x2} ${y2}
                Z
              `;
              
              return (
                <g key={i}>
                  <path d={pathData} fill={d.color} stroke="white" strokeWidth="1" />
                  {d.percentage > 3 && (
                    <text
                      x={50 + radius * 0.5 * Math.cos((d.startAngle + d.angle / 2) * Math.PI / 180)}
                      y={50 + radius * 0.5 * Math.sin((d.startAngle + d.angle / 2) * Math.PI / 180) + 2}
                      textAnchor="middle"
                      fontSize="3"
                      fill="white"
                      fontWeight="bold"
                    >
                      {d.percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        );
      }

      case 'bar': {
        const barWidth = getBarWidth();
        const gapWidth = parseFloat(barWidth) * 0.3;
        const actualBarWidth = parseFloat(barWidth) - gapWidth;

        return (
          <svg viewBox={`0 0 100 100`} style={{ width: '100%', height: '100%' }}>
            {/* Y-axis grid lines */}
            {[0, 25, 50, 75, 100].map((val) => (
              <line
                key={val}
                x1="5"
                y1={100 - val}
                x2="95"
                y2={100 - val}
                stroke="#e2e8f0"
                strokeWidth="0.3"
                strokeDasharray="1 1"
              />
            ))}
            
            {/* Bars */}
            {data.map((d, i) => {
              const value = Number(d[yKey] || 0);
              const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const x = (i / data.length) * 90 + 5 + parseFloat(barWidth) / 2;
              const barX = x - parseFloat(barWidth) / 2 + gapWidth / 2;
              const barHeight = percent * 0.85;
              const y = 100 - barHeight - 5;

              return (
                <g key={i}>
                  <rect
                    x={`${barX}%`}
                    y={`${y}%`}
                    width={`${actualBarWidth}%`}
                    height={`${barHeight}%`}
                    fill={colors[i % colors.length]}
                    rx="1"
                    onClick={() => onBarClick && onBarClick(d)}
                    style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                  >
                    {animated && (
                      <animate
                        attributeName="height"
                        from="0%"
                        to={`${barHeight}%`}
                        dur="0.6s"
                        fill="freeze"
                      />
                    )}
                  </rect>
                  <text
                    x={`${x}%`}
                    y="98%"
                    textAnchor="middle"
                    fontSize="3"
                    fill="#94a3b8"
                    transform="rotate(-30, x, 98)"
                  >
                    {String(d[xKey] || '').substring(0, 8)}
                  </text>
                  {value > 0 && (
                    <text
                      x={`${x}%`}
                      y={`${y - 2}%`}
                      textAnchor="middle"
                      fontSize="3"
                      fill="#1e293b"
                      fontWeight="bold"
                    >
                      {formatValue(value)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        );
      }

      case 'area': {
        const points = data.map((d, i) => {
          const value = Number(d[yKey] || 0);
          const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const x = (i / (data.length - 1 || 1)) * 90 + 5;
          const y = 100 - (percent * 0.85 + 5);
          return `${x},${y}`;
        }).join(' ');

        const areaPoints = data.map((d, i) => {
          const value = Number(d[yKey] || 0);
          const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const x = (i / (data.length - 1 || 1)) * 90 + 5;
          const y = 100 - (percent * 0.85 + 5);
          return `${x},${y}`;
        }).join(' ');

        return (
          <svg viewBox={`0 0 100 100`} style={{ width: '100%', height: '100%' }}>
            {/* Y-axis grid lines */}
            {[0, 25, 50, 75, 100].map((val) => (
              <line
                key={val}
                x1="5"
                y1={100 - val}
                x2="95"
                y2={100 - val}
                stroke="#e2e8f0"
                strokeWidth="0.3"
                strokeDasharray="1 1"
              />
            ))}
            
            {/* Area fill */}
            <polygon
              points={`5,95 ${areaPoints} 95,95`}
              fill={colors[0] || '#6366f1'}
              opacity="0.15"
            />
            
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={colors[0] || '#6366f1'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {showDataPoints && data.map((d, i) => {
              const value = Number(d[yKey] || 0);
              const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const x = (i / (data.length - 1 || 1)) * 90 + 5;
              const y = 100 - (percent * 0.85 + 5);
              return (
                <circle key={i} cx={`${x}%`} cy={`${y}%`} r="1.5" fill={colors[0] || '#6366f1'} stroke="white" strokeWidth="0.5" />
              );
            })}
          </svg>
        );
      }

      case 'line':
      default: {
        const points = data.map((d, i) => {
          const value = Number(d[yKey] || 0);
          const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const x = (i / (data.length - 1 || 1)) * 90 + 5;
          const y = 100 - (percent * 0.85 + 5);
          return `${x},${y}`;
        }).join(' ');

        return (
          <svg viewBox={`0 0 100 100`} style={{ width: '100%', height: '100%' }}>
            {/* Y-axis grid lines */}
            {[0, 25, 50, 75, 100].map((val) => (
              <line
                key={val}
                x1="5"
                y1={100 - val}
                x2="95"
                y2={100 - val}
                stroke="#e2e8f0"
                strokeWidth="0.3"
                strokeDasharray="1 1"
              />
            ))}
            
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={colors[0] || '#6366f1'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {showDataPoints && data.map((d, i) => {
              const value = Number(d[yKey] || 0);
              const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const x = (i / (data.length - 1 || 1)) * 90 + 5;
              const y = 100 - (percent * 0.85 + 5);
              return (
                <circle key={i} cx={`${x}%`} cy={`${y}%`} r="1.5" fill="white" stroke={colors[0] || '#6366f1'} strokeWidth="1" />
              );
            })}
          </svg>
        );
      }
    }
  };

  return (
    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
      <Card.Body>
        {title && (
          <div className="mb-3">
            <h6 className="fw-bold mb-1">{title}</h6>
            {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
          </div>
        )}
        <div style={{ width: '100%', height: `${height}px` }}>
          {renderChart()}
        </div>
      </Card.Body>
    </Card>
  );
};

// ============================================================
// MAIN ANALYTICS COMPONENT
// ============================================================

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [error, setError] = useState(null);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  // Analytics Data
  const [overview, setOverview] = useState({
    totalUsers: 0, newUsers: 0, activeUsers: 0, totalServices: 0, newServices: 0,
    pendingServices: 0, totalBookings: 0, completedBookings: 0, totalRevenue: 0,
    monthlyRevenue: 0, weeklyRevenue: 0, averageRating: 0, totalReviews: 0,
    conversionRate: 0, customerSatisfaction: 0, totalCustomers: 0, totalProviders: 0
  });
  const [trends, setTrends] = useState({ users: [], bookings: [], revenue: [] });
  const [distribution, setDistribution] = useState({
    usersByRole: [], servicesByCategory: [], revenueBySource: [], bookingsByStatus: []
  });
  const [performance, setPerformance] = useState({
    topProviders: [], topServices: [], peakHours: [], conversionRate: 0,
    averageResponseTime: 0, customerSatisfaction: 0
  });
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ✅ SAFE FORMATTING FUNCTIONS
  const formatNaira = (amount) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatCompactNaira = (amount) => {
    const num = Number(amount) || 0;
    if (num >= 1000000) return `₦${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₦${(num / 1000).toFixed(0)}k`;
    return formatNaira(num);
  };

  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  const formatRating = (rating) => {
    const num = Number(rating) || 0;
    return num.toFixed(1);
  };

  // Prepare chart data
  const userGrowthData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const users = Array.isArray(trends.users) ? trends.users : [];
    const bookings = Array.isArray(trends.bookings) ? trends.bookings : [];
    const revenue = Array.isArray(trends.revenue) ? trends.revenue : [];
    
    return users.map((val, idx) => ({
      month: monthNames[idx] || `Month ${idx + 1}`,
      users: val || 0,
      bookings: bookings[idx] || 0,
      revenue: revenue[idx] || 0
    }));
  }, [trends]);

  const bookingStatusData = useMemo(() => {
    const statuses = Array.isArray(distribution.bookingsByStatus) ? distribution.bookingsByStatus : [];
    return statuses.map(item => ({
      name: item.status || item.name || 'Unknown',
      value: item.count || item.value || 0,
      percentage: item.percentage || 0
    }));
  }, [distribution.bookingsByStatus]);

  const userRoleData = useMemo(() => {
    const roles = Array.isArray(distribution.usersByRole) ? distribution.usersByRole : [];
    return roles.map(item => ({
      name: item.role || item.name || 'Unknown',
      value: item.count || item.value || 0,
      percentage: item.percentage || 0
    }));
  }, [distribution.usersByRole]);

  const serviceCategoryData = useMemo(() => {
    const categories = Array.isArray(distribution.servicesByCategory) ? distribution.servicesByCategory : [];
    return categories.map(item => ({
      name: item.category || item.name || 'Uncategorized',
      value: item.count || item.value || 0
    }));
  }, [distribution.servicesByCategory]);

  const peakHoursData = useMemo(() => {
    const hours = Array.isArray(performance.peakHours) ? performance.peakHours : [];
    return hours.map(item => ({
      hour: item.hour || item.name || 'N/A',
      bookings: item.bookings || item.value || 0
    }));
  }, [performance.peakHours]);

  const topServicesData = useMemo(() => {
    const services = Array.isArray(performance.topServices) ? performance.topServices : [];
    return services.map(item => ({
      name: item.title || item.name || 'Unknown',
      bookings: item.bookings || 0,
      revenue: item.revenue || 0,
      rating: item.rating || 0
    }));
  }, [performance.topServices]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // ✅ Fetch analytics data from real API
  const fetchAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const params = { startDate: dateRange.start, endDate: dateRange.end };
      
      // Try multiple API methods with fallbacks
      let overviewData = {};
      let trendsData = { users: [], bookings: [], revenue: [] };
      let distributionData = { usersByRole: [], servicesByCategory: [], revenueBySource: [], bookingsByStatus: [] };
      let performanceData = { topProviders: [], topServices: [], peakHours: [], conversionRate: 0, averageResponseTime: 0, customerSatisfaction: 0 };
      let reviewsData = [];

      // Fetch overview stats
      if (typeof adminAPI.getStats === 'function') {
        try {
          const res = await adminAPI.getStats(params);
          overviewData = res?.data || {};
        } catch (e) { console.warn('getStats failed:', e); }
      }
      
      // Fetch trends
      if (typeof adminAPI.getTrends === 'function') {
        try {
          const res = await adminAPI.getTrends(params);
          trendsData = res?.data || { users: [], bookings: [], revenue: [] };
        } catch (e) { console.warn('getTrends failed:', e); }
      }
      
      // Fetch distribution
      if (typeof adminAPI.getDistribution === 'function') {
        try {
          const res = await adminAPI.getDistribution(params);
          distributionData = res?.data || { usersByRole: [], servicesByCategory: [], revenueBySource: [], bookingsByStatus: [] };
        } catch (e) { console.warn('getDistribution failed:', e); }
      }
      
      // Fetch performance
      if (typeof adminAPI.getPerformance === 'function') {
        try {
          const res = await adminAPI.getPerformance(params);
          performanceData = res?.data || { topProviders: [], topServices: [], peakHours: [], conversionRate: 0, averageResponseTime: 0, customerSatisfaction: 0 };
        } catch (e) { console.warn('getPerformance failed:', e); }
      }
      
      // Fetch reviews
      if (typeof adminAPI.getReviews === 'function') {
        try {
          const res = await adminAPI.getReviews(params);
          reviewsData = res?.data || [];
        } catch (e) { console.warn('getReviews failed:', e); }
      }

      setOverview(overviewData);
      setTrends(trendsData);
      setDistribution(distributionData);
      setPerformance(performanceData);
      setReviews(reviewsData);
      setFilteredReviews(reviewsData);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics data');
      showToast('Failed to load analytics data', 'danger');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  // ✅ Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData(false);
    showToast('Data refreshed', 'info');
  };

  // ✅ Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchAllData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 60000); // Poll every 60 seconds for real-time updates
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    isPolling.current = false;
  };

  // Initial data load
  useEffect(() => {
    fetchAllData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Refetch when date range changes
  useEffect(() => {
    if (!loading) {
      fetchAllData(false);
    }
  }, [dateRange]);

  // Filter reviews
  useEffect(() => {
    let filtered = [...reviews];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.customerName?.toLowerCase().includes(term) ||
        r.providerName?.toLowerCase().includes(term) ||
        r.serviceTitle?.toLowerCase().includes(term) ||
        r.comment?.toLowerCase().includes(term)
      );
    }
    if (filterRating !== 'all') filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    if (filterStatus !== 'all') filtered = filtered.filter(r => r.status?.toLowerCase() === filterStatus);
    if (filterService !== 'all') filtered = filtered.filter(r => r.serviceId === parseInt(filterService));
    
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'rating' || sortConfig.key === 'helpful') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (sortConfig.key === 'createdAt') {
        aVal = aVal ? new Date(aVal) : 0;
        bVal = bVal ? new Date(bVal) : 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, searchTerm, filterRating, filterStatus, filterService, sortConfig]);

  // Date range handler
  const handleDateRangeChange = (period) => {
    setSelectedPeriod(period);
    if (period === 'custom') return;
    
    const today = new Date();
    let start = new Date();
    switch (period) {
      case '7days': start = subDays(today, 7); break;
      case '30days': start = subDays(today, 30); break;
      case '90days': start = subDays(today, 90); break;
      case '12months': start = subMonths(today, 12); break;
      case 'ytd': start = new Date(today.getFullYear(), 0, 1); break;
      default: start = subDays(today, 30);
    }
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  // ✅ Review actions with real API
  const handleApproveReview = async (reviewId) => {
    if (!reviewId) return;
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.approveReview !== 'function') {
        throw new Error('Approve review API not available');
      }
      await adminAPI.approveReview(reviewId);
      showToast('Review approved', 'success');
      await fetchAllData(false);
    } catch (error) {
      console.error('Approve review error:', error);
      showToast(error.message || 'Failed to approve review', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlagReview = async () => {
    if (!selectedReview) return;
    const reviewId = selectedReview.id || selectedReview._id;
    if (!reviewId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.flagReview !== 'function') {
        throw new Error('Flag review API not available');
      }
      await adminAPI.flagReview(reviewId);
      showToast('Review flagged', 'warning');
      setShowFlagModal(false);
      setSelectedReview(null);
      await fetchAllData(false);
    } catch (error) {
      console.error('Flag review error:', error);
      showToast(error.message || 'Failed to flag review', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    const reviewId = selectedReview.id || selectedReview._id;
    if (!reviewId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.deleteReview !== 'function') {
        throw new Error('Delete review API not available');
      }
      await adminAPI.deleteReview(reviewId);
      showToast('Review deleted', 'success');
      setShowDeleteModal(false);
      setSelectedReview(null);
      await fetchAllData(false);
    } catch (error) {
      console.error('Delete review error:', error);
      showToast(error.message || 'Failed to delete review', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText) return;
    const reviewId = selectedReview.id || selectedReview._id;
    if (!reviewId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.respondToReview !== 'function') {
        throw new Error('Respond to review API not available');
      }
      await adminAPI.respondToReview(reviewId, { response: responseText });
      showToast('Response added', 'success');
      setShowResponseModal(false);
      setResponseText('');
      setSelectedReview(null);
      await fetchAllData(false);
    } catch (error) {
      console.error('Submit response error:', error);
      showToast(error.message || 'Failed to add response', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) return;
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.bulkReviewAction !== 'function') {
        throw new Error('Bulk action API not available');
      }
      await adminAPI.bulkReviewAction({ reviewIds: selectedReviews, action });
      showToast(`${selectedReviews.length} reviews ${action}ed`, 'success');
      setSelectedReviews([]);
      setShowBulkActions(false);
      await fetchAllData(false);
    } catch (error) {
      console.error('Bulk action error:', error);
      showToast(error.message || 'Bulk action failed', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Analytics Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 38);
    doc.setFontSize(14);
    doc.text('Key Metrics', 14, 48);
    const metricsData = [
      ['Metric', 'Value'],
      ['Total Users', formatNumber(overview.totalUsers)],
      ['New Users', formatNumber(overview.newUsers)],
      ['Active Users', formatNumber(overview.activeUsers)],
      ['Total Services', formatNumber(overview.totalServices)],
      ['Total Bookings', formatNumber(overview.totalBookings)],
      ['Total Revenue', formatNaira(overview.totalRevenue)],
      ['Average Rating', formatRating(overview.averageRating)]
    ];
    doc.autoTable({
      startY: 52,
      head: [metricsData[0]],
      body: metricsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    showToast('PDF exported', 'success');
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const metrics = [
      ['Total Users', formatNumber(overview.totalUsers)],
      ['New Users', formatNumber(overview.newUsers)],
      ['Active Users', formatNumber(overview.activeUsers)],
      ['Total Services', formatNumber(overview.totalServices)],
      ['Total Bookings', formatNumber(overview.totalBookings)],
      ['Total Revenue', formatNaira(overview.totalRevenue)],
      ['Average Rating', formatRating(overview.averageRating)]
    ];
    const topProviders = Array.isArray(performance.topProviders) ? performance.topProviders : [];
    const csvRows = [
      headers.join(','),
      ...metrics.map(row => row.join(',')),
      '',
      'Top Providers',
      ['Provider', 'Services', 'Bookings', 'Rating', 'Revenue'].join(','),
      ...topProviders.map(p =>
        [p.name || 'Unknown', p.services || 0, p.bookings || 0, p.rating || 0, formatNaira(p.revenue || 0)].join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return <Badge bg="secondary" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill"><FaClock className="me-1" /> Unknown</Badge>;
    }
    
    const lowerStatus = status.toLowerCase();
    const badges = {
      approved: { bg: 'success', icon: <FaCheckCircle />, label: 'Approved' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      flagged: { bg: 'danger', icon: <FaFlag />, label: 'Flagged' },
      rejected: { bg: 'danger', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const b = badges[lowerStatus] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(<FaStar key={i} className={i <= numRating ? 'text-warning' : 'text-secondary'} size={14} />);
    }
    return stars;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id || r._id).filter(Boolean));
    }
  };

  const handleSelectReview = (id) => {
    if (!id) return;
    setSelectedReviews(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredReviews.slice(start, end);
  }, [filteredReviews, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  // ✅ CORRECTED Loading state with Container
  if (loading) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <Container fluid className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3 text-muted">Loading analytics...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Toast */}
        <ToastContainer position="top-end" className="p-3">
          <Toast show={toastMessage.show} onClose={() => setToastMessage({ show: false, message: '', type: '' })} delay={3000} autohide bg={toastMessage.type}>
            <Toast.Header closeButton={false}>
              <strong className="me-auto">{toastMessage.type === 'success' ? 'Success' : toastMessage.type === 'danger' ? 'Error' : 'Info'}</strong>
            </Toast.Header>
            <Toast.Body>{toastMessage.message}</Toast.Body>
          </Toast>
        </ToastContainer>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Analytics & Insights</h2>
            <p className="text-muted mb-0">Monitor platform performance and manage user feedback</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={refreshData} disabled={refreshing} className="d-flex align-items-center gap-2">
              <FaRedo className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                <FaDownload /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToPDF}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
                <Dropdown.Item onClick={exportToCSV}><FaFileAlt className="me-2 text-info" /> CSV</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}

        {/* Date Range */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Row className="align-items-center g-3">
              <Col lg={3}>
                <Form.Label className="fw-semibold">Period</Form.Label>
                <Form.Select value={selectedPeriod} onChange={(e) => handleDateRangeChange(e.target.value)}>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="12months">Last 12 Months</option>
                  <option value="ytd">Year to Date</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Col>
              {selectedPeriod === 'custom' && (
                <>
                  <Col lg={3}>
                    <Form.Label className="fw-semibold">Start Date</Form.Label>
                    <Form.Control type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                  </Col>
                  <Col lg={3}>
                    <Form.Label className="fw-semibold">End Date</Form.Label>
                    <Form.Control type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                  </Col>
                </>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Tabs */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Nav variant="tabs" className="px-3 pt-3" style={{ borderBottom: 'none' }}>
              <Nav.Item><Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><FaChartLine className="me-2" /> Overview</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'users'} onClick={() => setActiveTab('users')}><FaUsers className="me-2" /> Users</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'services'} onClick={() => setActiveTab('services')}><FaServicestack className="me-2" /> Services</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')}><FaCalendarCheck className="me-2" /> Bookings</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')}><FaMoneyBillWave className="me-2" /> Revenue</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}><FaStar className="me-2" /> Reviews</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}><FaChartLine className="me-2" /> Performance</Nav.Link></Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Rest of the component remains the same... */}
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <Row className="g-4 mb-4">
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}><FaUsers size={24} color="#3b82f6" /></div>
                      <div>
                        <p className="text-muted mb-0 small">Total Users</p>
                        <h3 className="fw-bold mb-0">{formatNumber(overview.totalUsers)}</h3>
                      </div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {formatNumber(overview.newUsers)} new this month</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#10b98120' }}><FaServicestack size={24} color="#10b981" /></div>
                      <div>
                        <p className="text-muted mb-0 small">Total Services</p>
                        <h3 className="fw-bold mb-0">{formatNumber(overview.totalServices)}</h3>
                      </div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {formatNumber(overview.newServices)} new</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}><FaCalendarCheck size={24} color="#f59e0b" /></div>
                      <div>
                        <p className="text-muted mb-0 small">Total Bookings</p>
                        <h3 className="fw-bold mb-0">{formatNumber(overview.totalBookings)}</h3>
                      </div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {formatNumber(overview.completedBookings)} completed</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}><FaMoneyBillWave size={24} color="#8b5cf6" /></div>
                      <div>
                        <p className="text-muted mb-0 small">Total Revenue</p>
                        <h3 className="fw-bold mb-0">{formatCompactNaira(overview.totalRevenue)}</h3>
                      </div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {formatCompactNaira(overview.monthlyRevenue)} this month</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4">
              <Col lg={8}>
                <AnalyticsChart
                  data={userGrowthData}
                  type="line"
                  xKey="month"
                  yKey="users"
                  title="Platform Growth"
                  subtitle="Monthly user growth trend"
                  height={300}
                  colors={['#3b82f6', '#10b981', '#f59e0b']}
                  currency={false}
                  showDataPoints={true}
                  animated={true}
                />
              </Col>
              <Col lg={4}>
                <AnalyticsChart
                  data={userRoleData}
                  type="pie"
                  xKey="name"
                  yKey="value"
                  title="User Distribution"
                  subtitle="Breakdown by role"
                  height={300}
                  colors={['#3b82f6', '#10b981', '#8b5cf6']}
                  showControls={false}
                />
              </Col>
            </Row>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <Row className="g-4">
            <Col lg={8}>
              <AnalyticsChart
                data={userGrowthData}
                type="area"
                xKey="month"
                yKey="users"
                title="User Growth"
                subtitle="Monthly active users trend"
                height={300}
                colors={['#10b981']}
                currency={false}
                showDataPoints={true}
                animated={true}
              />
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <Card.Body className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '150px', height: '150px' }}>
                    <FaUsers size={60} className="text-primary opacity-50" />
                  </div>
                  <Row>
                    <Col xs={6}><h6>Customers</h6><h4 className="text-primary">{formatNumber(overview.totalCustomers)}</h4></Col>
                    <Col xs={6}><h6>Providers</h6><h4 className="text-success">{formatNumber(overview.totalProviders)}</h4></Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <>
            <Row className="g-4 mb-4">
              <Col md={4}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Total Services</h5><h2 className="text-primary">{formatNumber(overview.totalServices)}</h2></Card.Body></Card></Col>
              <Col md={4}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Pending Approval</h5><h2 className="text-warning">{formatNumber(overview.pendingServices)}</h2></Card.Body></Card></Col>
              <Col md={4}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Categories</h5><h2 className="text-info">{distribution.servicesByCategory?.length || 0}</h2></Card.Body></Card></Col>
            </Row>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Top Performing Services</h5></Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead><tr><th>Service</th><th>Category</th><th className="text-center">Bookings</th><th className="text-end">Revenue</th><th className="text-center">Rating</th></tr></thead>
                  <tbody>
                    {(Array.isArray(performance.topServices) ? performance.topServices : []).map(s => (
                      <tr key={s.id || s._id}>
                        <td>{s.title || s.name || 'Unknown'}</td>
                        <td><Badge bg="secondary" className="rounded-pill"><FaTag className="me-1" /> {s.category || 'Uncategorized'}</Badge></td>
                        <td className="text-center">{s.bookings || 0}</td>
                        <td className="text-end fw-bold text-primary">{formatNaira(s.revenue)}</td>
                        <td className="text-center"><span className="text-warning"><FaStar className="me-1" /> {formatRating(s.rating)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <Row className="g-4">
            <Col lg={8}>
              <AnalyticsChart
                data={userGrowthData}
                type="bar"
                xKey="month"
                yKey="bookings"
                title="Booking Trends"
                subtitle="Monthly booking volume"
                height={300}
                colors={['#f59e0b']}
                currency={false}
                showDataPoints={true}
                animated={true}
              />
            </Col>
            <Col lg={4}>
              <AnalyticsChart
                data={bookingStatusData}
                type="pie"
                xKey="name"
                yKey="value"
                title="Booking Status"
                subtitle="Distribution by status"
                height={300}
                colors={['#10b981', '#f59e0b', '#ef4444', '#6366f1']}
                showControls={false}
              />
            </Col>
          </Row>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <Row className="g-4">
            <Col lg={8}>
              <AnalyticsChart
                data={userGrowthData}
                type="area"
                xKey="month"
                yKey="revenue"
                title="Revenue Growth"
                subtitle="Monthly revenue trend"
                height={300}
                colors={['#10b981']}
                currency={true}
                currencySymbol="₦"
                showDataPoints={true}
                animated={true}
              />
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Body>
                  <h6 className="fw-bold mb-4">Revenue Summary</h6>
                  <div className="mb-3"><small className="text-muted">Total Revenue</small><h3 className="text-primary">{formatNaira(overview.totalRevenue)}</h3></div>
                  <div className="mb-3"><small className="text-muted">Monthly Revenue</small><h5>{formatNaira(overview.monthlyRevenue)}</h5></div>
                  <div><small className="text-muted">Average Booking Value</small><h5 className="text-success">{formatNaira((overview.totalBookings || 0) > 0 ? (overview.totalRevenue || 0) / (overview.totalBookings || 1) : 0)}</h5></div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <>
            <Row className="g-4 mb-4">
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Total Reviews</h5><h2 className="text-primary">{formatNumber(overview.totalReviews)}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Average Rating</h5><h2 className="text-warning">{formatRating(overview.averageRating)} <FaStar size={20} /></h2></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Pending Moderation</h5><h2 className="text-warning">{reviews.filter(r => r.status?.toLowerCase() === 'pending').length}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Flagged Reviews</h5><h2 className="text-danger">{reviews.filter(r => r.flagged || r.status?.toLowerCase() === 'flagged').length}</h2></Card.Body></Card></Col>
            </Row>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col lg={4}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search reviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></InputGroup></Col>
                  <Col lg={2}><Form.Select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}><option value="all">All Ratings</option><option value="5">5 Stars</option><option value="4">4 Stars</option><option value="3">3 Stars</option><option value="2">2 Stars</option><option value="1">1 Star</option></Form.Select></Col>
                  <Col lg={2}><Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="flagged">Flagged</option></Form.Select></Col>
                  <Col lg={2}><Form.Select value={filterService} onChange={(e) => setFilterService(e.target.value)}><option value="all">All Services</option>{(Array.isArray(performance.topServices) ? performance.topServices : []).map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.title || s.name || 'Unknown'}</option>)}</Form.Select></Col>
                  <Col lg={2}><Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></Form.Select></Col>
                </Row>
                {selectedReviews.length > 0 && (
                  <div className="d-flex gap-2 mt-3 pt-3 border-top">
                    <Button size="sm" variant="success" onClick={() => handleBulkAction('approved')}><FaCheckCircle className="me-2" /> Approve ({selectedReviews.length})</Button>
                    <Button size="sm" variant="danger" onClick={() => handleBulkAction('flagged')}><FaFlag className="me-2" /> Flag ({selectedReviews.length})</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleBulkAction('deleted')}><FaTrash className="me-2" /> Delete ({selectedReviews.length})</Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Reviews Table */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}><Form.Check type="checkbox" checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0} onChange={handleSelectAll} /></th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('customerName')}>Customer {getSortIcon('customerName')}</th>
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('rating')}>Rating {getSortIcon('rating')}</th>
                        <th style={{ padding: '16px' }}>Review</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('helpful')}>Helpful {getSortIcon('helpful')}</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Date {getSortIcon('createdAt')}</th>
                        <th style={{ padding: '16px', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReviews.map(review => {
                        const reviewId = review.id || review._id;
                        return (
                          <tr key={reviewId} className={selectedReviews.includes(reviewId) ? 'table-active' : ''}>
                            <td style={{ padding: '16px' }}><Form.Check type="checkbox" checked={selectedReviews.includes(reviewId)} onChange={() => handleSelectReview(reviewId)} /></td>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex align-items-center gap-2">
                                <img src={review.customerAvatar || `https://ui-avatars.com/api/?name=${review.customerName || 'User'}&background=6366f1&color=fff&size=30`} className="rounded-circle" style={{ width: '30px', height: '30px' }} alt="" />
                                <div><div className="fw-semibold">{review.customerName || 'Unknown'}</div><small className="text-muted">to {review.providerName || 'Unknown'}</small></div>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}><div className="fw-semibold">{review.serviceTitle || 'Unknown'}</div></td>
                            <td style={{ padding: '16px' }}><div className="text-warning">{getRatingStars(review.rating)}</div></td>
                            <td style={{ padding: '16px' }}>
                              <div>{(review.comment || '').substring(0, 50)}...</div>
                              {review.response && <div className="text-success mt-1"><FaReply className="me-1" size={10} /> Responded</div>}
                            </td>
                            <td style={{ padding: '16px' }}>{getStatusBadge(review.status)}</td>
                            <td style={{ padding: '16px' }} className="text-center"><div className="fw-semibold">{review.helpful || 0}</div></td>
                            <td style={{ padding: '16px' }}><small>{review.createdAt ? format(new Date(review.createdAt), 'MMM dd, yyyy') : 'N/A'}</small></td>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex gap-1">
                                <Button size="sm" variant="outline-primary" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowReviewModal(true); }}><FaEye size={14} /></Button>
                                {review.status?.toLowerCase() === 'pending' && <Button size="sm" variant="outline-success" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => handleApproveReview(reviewId)}><FaCheckCircle size={14} /></Button>}
                                {review.status?.toLowerCase() !== 'flagged' && <Button size="sm" variant="outline-danger" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowFlagModal(true); }}><FaFlag size={14} /></Button>}
                                {!review.response && <Button size="sm" variant="outline-info" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowResponseModal(true); }}><FaReply size={14} /></Button>}
                                <Button size="sm" variant="outline-danger" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowDeleteModal(true); }}><FaTrash size={14} /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                {filteredReviews.length === 0 && (
                  <div className="text-center py-5"><FaStar size={48} className="text-muted mb-3 opacity-50" /><h6 className="text-muted">No reviews found</h6><Button variant="link" onClick={() => { setSearchTerm(''); setFilterRating('all'); setFilterStatus('all'); setFilterService('all'); }}>Reset Filters</Button></div>
                )}
                {filteredReviews.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length}</div>
                    <Pagination>
                      <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} />
                      {[...Array(Math.min(5, totalPages)).keys()].map(num => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = num + 1;
                        else if (currentPage <= 3) pageNum = num + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + num;
                        else pageNum = currentPage - 2 + num;
                        return <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;
                      })}
                      <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Top Providers</h5></Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead><tr><th>Provider</th><th className="text-center">Bookings</th><th className="text-end">Revenue</th><th className="text-center">Rating</th></tr></thead>
                    <tbody>
                      {(Array.isArray(performance.topProviders) ? performance.topProviders : []).map(p => (
                        <tr key={p.id || p._id}>
                          <td><div className="d-flex align-items-center gap-2"><img src={`https://ui-avatars.com/api/?name=${p.name || 'User'}&background=10b981&color=fff&size=30`} className="rounded-circle" style={{ width: '30px', height: '30px' }} alt="" /><span className="fw-semibold">{p.name || 'Unknown'}</span></div></td>
                          <td className="text-center">{p.bookings || 0}</td>
                          <td className="text-end fw-bold text-primary">{formatNaira(p.revenue)}</td>
                          <td className="text-center"><span className="text-warning"><FaStar className="me-1" /> {formatRating(p.rating)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <AnalyticsChart
                data={peakHoursData}
                type="bar"
                xKey="hour"
                yKey="bookings"
                title="Peak Hours"
                subtitle="Booking volume by hour"
                height={300}
                colors={['#8b5cf6']}
                currency={false}
                showDataPoints={true}
                animated={true}
              />
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}>
                <Card.Body className="py-5"><h1 className="display-1 text-primary mb-0">{formatNumber(performance.conversionRate)}%</h1><p className="text-muted">Conversion Rate</p><ProgressBar now={Number(performance.conversionRate) || 0} variant="primary" style={{ height: '8px', borderRadius: '4px' }} /></Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}>
                <Card.Body className="py-5"><h1 className="display-1 text-warning mb-0">{formatRating(performance.customerSatisfaction)}</h1><div className="text-warning mb-3">{getRatingStars(performance.customerSatisfaction)}</div><p className="text-muted">Customer Satisfaction</p></Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Modals */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Review Details</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          {selectedReview && (
            <>
              <div className="d-flex gap-3 mb-4">
                <img src={selectedReview.customerAvatar || `https://ui-avatars.com/api/?name=${selectedReview.customerName || 'User'}&background=6366f1&color=fff&size=60`} className="rounded-circle" style={{ width: '60px', height: '60px' }} alt="" />
                <div><h5>{selectedReview.customerName || 'Unknown'}</h5><div className="text-warning">{getRatingStars(selectedReview.rating)}</div></div>
              </div>
              <h6>{selectedReview.title || 'No title'}</h6>
              <p>{selectedReview.comment || 'No comment'}</p>
              {selectedReview.response && (
                <div className="mt-3 p-3 bg-light rounded-3"><strong>Response:</strong> {selectedReview.response}</div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showFlagModal} onHide={() => setShowFlagModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-danger"><FaFlag className="me-2" /> Flag Review</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>Flag this review for inappropriate content?</Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowFlagModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleFlagReview} disabled={processing}>{processing ? 'Processing...' : 'Flag'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold"><FaReply className="me-2" /> Respond to Review</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <Form.Group><Form.Label className="fw-semibold">Your Response</Form.Label><Form.Control as="textarea" rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your response..." /></Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmitResponse} disabled={processing || !responseText}>{processing ? 'Submitting...' : 'Submit Response'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-danger"><FaTrash className="me-2" /> Delete Review</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>Are you sure you want to delete this review? This action cannot be undone.</Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteReview} disabled={processing}>{processing ? 'Deleting...' : 'Delete'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Bulk Actions</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkAction('approved')}><FaCheckCircle className="me-2" /> Approve All</Button>
            <Button variant="danger" onClick={() => handleBulkAction('flagged')}><FaFlag className="me-2" /> Flag All</Button>
            <Button variant="outline-danger" onClick={() => handleBulkAction('deleted')}><FaTrash className="me-2" /> Delete All</Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowBulkActions(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
        .nav-tabs .nav-link {
          color: #4b5563;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px 12px 0 0;
        }
        .nav-tabs .nav-link.active {
          color: #6366f1;
          font-weight: 600;
          border-bottom: 3px solid #6366f1;
          background: none;
        }
        .nav-tabs .nav-link:hover { background: #f8fafc; }
        .table > :not(caption) > * > * { padding: 16px 12px; vertical-align: middle; }
        .table tbody tr:hover { background-color: #f8fafc; }
        .table-active { background-color: #e7f1ff !important; }
      `}</style>
    </div>
  );
}

export default Analytics;