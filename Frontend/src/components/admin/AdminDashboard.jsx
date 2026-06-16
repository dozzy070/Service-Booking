// src/pages/dashboard/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Table, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaUsers, FaServicestack, FaCalendarCheck, FaChartLine, FaMoneyBillWave,
  FaStar, FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaExclamationCircle,
  FaUserPlus, FaUserCheck, FaUserClock, FaUserTimes, FaDollarSign, FaPercentage,
  FaChartPie, FaRocket, FaShieldAlt, FaHeartbeat, FaAward, FaTrophy, FaMedal,
  FaCrown, FaGem, FaExclamationTriangle, FaCog, FaFileAlt, FaInfoCircle,
  FaWallet, FaTrendingUp, FaTrendingDown, FaSync, FaEye, FaEyeSlash,
  FaBell, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaLink,
  FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaYoutube,
  FaWhatsapp, FaTelegram, FaDiscord, FaSlack, FaGithub
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { Line, Bar, Pie, Doughnut, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [timeAgo, setTimeAgo] = useState('');
  const [selectedChartView, setSelectedChartView] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // State for all dashboard data
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, active: 0, suspended: 0, verified: 0, unverified: 0,
             providers: 0, customers: 0, admins: 0, growth: 0 },
    services: { total: 0, pending: 0, approved: 0, rejected: 0, featured: 0,
                categories: 0, growth: 0 },
    bookings: { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0,
                disputes: 0, growth: 0 },
    revenue: { total: 0, monthly: 0, weekly: 0, daily: 0, average: 0,
               commission: 0, growth: 0 },
    ratings: { average: 0, total: 0, fiveStar: 0, fourStar: 0, threeStar: 0,
               twoStar: 0, oneStar: 0 }
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
    api: { status: 'healthy', requests: 450, errors: 2 }
  });

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  const formatNumber = (num) => num?.toLocaleString() || 0;
  const getGrowthIcon = (growth) => growth > 0 ? <FaArrowUp className="text-success" size={12} /> : <FaArrowDown className="text-danger" size={12} />;
  
  const getStatusBadge = (status) => {
    const badges = {
      healthy: { bg: 'success', text: 'Healthy' },
      warning: { bg: 'warning', text: 'Warning' },
      critical: { bg: 'danger', text: 'Critical' }
    };
    return badges[status] || badges.healthy;
  };

  // API Calls
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getDashboardStats();
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
      setRecentActivities(res.data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  }, []);

  const fetchTopProviders = useCallback(async () => {
    try {
      const res = await adminAPI.getTopProviders();
      setTopProviders(res.data);
    } catch (err) {
      console.error('Failed to fetch top providers:', err);
    }
  }, []);

  const fetchPopularServices = useCallback(async () => {
    try {
      const res = await adminAPI.getPopularServices();
      setPopularServices(res.data);
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
      fetchSystemHealth()
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
    // Set greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Clock updater
    const updateTimeAgo = () => {
      const now = new Date();
      setTimeAgo(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTimeAgo();
    const timeInterval = setInterval(updateTimeAgo, 1000);

    // Fetch all data
    fetchAllData();

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 60000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, [fetchAllData]);

  // Refetch chart when view changes
  useEffect(() => {
    fetchChartData(selectedChartView);
  }, [selectedChartView, fetchChartData]);

  const handleBarClick = (label, value) => {
    toast.info(`${label} Revenue: ${formatNaira(value)}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Welcome Section */}
        <div className="welcome-card mb-4">
          <Row className="align-items-center">
            <Col lg={7}>
              <h1 className="welcome-title">
                {greeting}, {user?.name?.split(' ')[0] || 'Admin'}! 👋
              </h1>
              <p className="welcome-subtitle">
                Welcome back to your admin dashboard. Here's what's happening on your platform today.
                <span className="welcome-time ms-3">
                  <FaClock className="me-1" /> {timeAgo}
                </span>
              </p>
            </Col>
            <Col lg={5} className="text-lg-end mt-3 mt-lg-0">
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                <Button as={Link} to="/admin/reports" variant="light" className="px-4 py-2 rounded-pill">
                  <FaChartLine className="me-2" /> Reports
                </Button>
                <Button as={Link} to="/admin/settings" variant="outline-light" className="px-4 py-2 rounded-pill">
                  <FaCog className="me-2" /> Settings
                </Button>
                <Button variant="outline-light" onClick={refreshData} disabled={refreshing} className="px-4 py-2 rounded-pill">
                  <FaSync className={refreshing ? 'spin' : ''} />
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Key Metrics */}
        <Row className="g-4 mb-4">
          <Col xl={3} lg={6} md={6}>
            <Card className="metric-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="metric-icon-wrapper bg-primary bg-opacity-10">
                    <FaUsers className="text-primary" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="metric-value">{formatNumber(stats.users.total)}</h3>
                    <p className="metric-label mb-0">Total Users</p>
                  </div>
                  <div className={`metric-growth ${stats.users.growth >= 0 ? 'up' : 'down'}`}>
                    <span>{stats.users.growth >= 0 ? '+' : ''}{stats.users.growth}%</span>
                    {getGrowthIcon(stats.users.growth)}
                  </div>
                </div>
                <div className="metric-details mt-3">
                  <ProgressBar now={(stats.users.active / (stats.users.total || 1)) * 100} variant="success" className="mb-2" style={{ height: '4px' }} />
                  <div className="d-flex justify-content-between small">
                    <span><FaUserCheck className="text-success me-1" /> {formatNumber(stats.users.active)} Active</span>
                    <span><FaUserPlus className="text-info me-1" /> +{stats.users.new} Today</span>
                    <span><FaUserTimes className="text-danger me-1" /> {stats.users.suspended} Suspended</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6}>
            <Card className="metric-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="metric-icon-wrapper bg-success bg-opacity-10">
                    <FaServicestack className="text-success" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="metric-value">{formatNumber(stats.services.total)}</h3>
                    <p className="metric-label mb-0">Total Services</p>
                  </div>
                  <div className={`metric-growth ${stats.services.growth >= 0 ? 'up' : 'down'}`}>
                    <span>{stats.services.growth >= 0 ? '+' : ''}{stats.services.growth}%</span>
                    {getGrowthIcon(stats.services.growth)}
                  </div>
                </div>
                <div className="metric-details mt-3">
                  <div className="d-flex justify-content-between small">
                    <span><FaCheckCircle className="text-success me-1" /> {stats.services.approved} Approved</span>
                    <span><FaClock className="text-warning me-1" /> {stats.services.pending} Pending</span>
                    <span><FaExclamationCircle className="text-danger me-1" /> {stats.services.rejected} Rejected</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6}>
            <Card className="metric-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="metric-icon-wrapper bg-warning bg-opacity-10">
                    <FaCalendarCheck className="text-warning" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="metric-value">{formatNumber(stats.bookings.total)}</h3>
                    <p className="metric-label mb-0">Total Bookings</p>
                  </div>
                  <div className={`metric-growth ${stats.bookings.growth >= 0 ? 'up' : 'down'}`}>
                    <span>{stats.bookings.growth >= 0 ? '+' : ''}{stats.bookings.growth}%</span>
                    {getGrowthIcon(stats.bookings.growth)}
                  </div>
                </div>
                <div className="metric-details mt-3">
                  <div className="d-flex justify-content-between small">
                    <span><FaRocket className="text-info me-1" /> {stats.bookings.active} Active</span>
                    <span><FaCheckCircle className="text-success me-1" /> {stats.bookings.completed} Completed</span>
                    <span><FaExclamationTriangle className="text-danger me-1" /> {stats.bookings.disputes} Disputes</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6}>
            <Card className="metric-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="metric-icon-wrapper bg-info bg-opacity-10">
                    <FaMoneyBillWave className="text-info" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="metric-value">{formatCompactNaira(stats.revenue.total)}</h3>
                    <p className="metric-label mb-0">Total Revenue</p>
                  </div>
                  <div className={`metric-growth ${stats.revenue.growth >= 0 ? 'up' : 'down'}`}>
                    <span>{stats.revenue.growth >= 0 ? '+' : ''}{stats.revenue.growth}%</span>
                    {getGrowthIcon(stats.revenue.growth)}
                  </div>
                </div>
                <div className="metric-details mt-3">
                  <div className="d-flex justify-content-between small">
                    <span><FaWallet className="text-success me-1" /> {formatCompactNaira(stats.revenue.monthly)} This Month</span>
                    <span><FaPercentage className="text-info me-1" /> {formatCompactNaira(stats.revenue.commission)} Commission</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3">Quick Actions</h6>
                <div className="d-flex flex-wrap gap-2">
                  <Button as={Link} to="/admin/users" variant="outline-warning" size="sm" className="rounded-pill">
                    <FaUserClock className="me-2" /> Pending Users ({pendingApprovals.users})
                  </Button>
                  <Button as={Link} to="/admin/services" variant="outline-info" size="sm" className="rounded-pill">
                    <FaClock className="me-2" /> Pending Services ({pendingApprovals.services})
                  </Button>
                  <Button as={Link} to="/admin/analytics" variant="outline-success" size="sm" className="rounded-pill">
                    <FaStar className="me-2" /> Moderate Reviews ({pendingApprovals.reviews})
                  </Button>
                  <Button as={Link} to="/admin/bookings" variant="outline-danger" size="sm" className="rounded-pill">
                    <FaExclamationTriangle className="me-2" /> Disputes ({pendingApprovals.disputes})
                  </Button>
                  <Button as={Link} to="/admin/reports" variant="outline-primary" size="sm" className="rounded-pill">
                    <FaChartLine className="me-2" /> Generate Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Grid */}
        <Row className="g-4">
          {/* Left Column */}
          <Col lg={8}>
            {/* Revenue Chart */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <h5 className="fw-bold mb-0">
                    <FaChartLine className="text-primary me-2" /> Revenue Overview
                  </h5>
                  <div>
                    {['weekly', 'monthly', 'yearly'].map(view => (
                      <Button key={view} 
                        variant="link" 
                        size="sm"
                        className={`text-decoration-none me-2 ${selectedChartView === view ? 'active fw-bold text-primary' : 'text-secondary'}`}
                        onClick={() => setSelectedChartView(view)}
                        style={{ cursor: 'pointer' }}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.labels?.map((label, idx) => ({ 
                    name: label, 
                    value: chartData.data[idx] || 0 
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => formatCompactNaira(v)} />
                    <Tooltip formatter={(v) => formatNaira(v)} />
                    <Bar dataKey="value" fill="#667eea" radius={[8, 8, 0, 0]}>
                      {chartData.labels?.map((_, idx) => (
                        <Cell key={idx} fill={`hsl(${240 - (chartData.data[idx] / (chartData.maxValue || 1)) * 120}, 70%, 60%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center mt-3">
                  <small className="text-muted">
                    <FaInfoCircle className="me-1" /> Click any bar for details
                  </small>
                </div>
              </Card.Body>
            </Card>

            {/* Recent Activities */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <FaRocket className="text-primary me-2" /> Recent Activities
                  </h5>
                  <Button variant="link" className="text-primary text-decoration-none small p-0">
                    <FaFileAlt className="me-1" /> View All Logs
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-4">
                    <FaClock size={32} className="text-muted opacity-50" />
                    <p className="text-muted mb-0">No recent activities</p>
                  </div>
                ) : (
                  <div className="activity-timeline">
                    {recentActivities.slice(0, 5).map((activity, idx) => (
                      <div key={activity.id || idx} className="activity-item">
                        <div className="activity-icon" style={{ backgroundColor: `${activity.color || '#667eea'}20` }}>
                          {activity.type === 'user' && <FaUserPlus />}
                          {activity.type === 'service' && <FaServicestack />}
                          {activity.type === 'booking' && <FaCalendarCheck />}
                          {activity.type === 'payment' && <FaMoneyBillWave />}
                          {activity.type === 'review' && <FaStar />}
                          {activity.type === 'dispute' && <FaExclamationTriangle />}
                        </div>
                        <div className="activity-content">
                          <p className="mb-1">
                            <span className="fw-semibold">{activity.user}</span> {activity.action}
                          </p>
                          <small className="text-muted">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </small>
                        </div>
                        {idx < recentActivities.length - 1 && <div className="activity-line" />}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Top Providers */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <FaTrophy className="text-warning me-2" /> Top Performing Providers
                  </h5>
                  <Link to="/admin/users" className="text-primary text-decoration-none small">View All</Link>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px' }}>Provider</th>
                        <th style={{ padding: '16px' }} className="text-center">Services</th>
                        <th style={{ padding: '16px' }} className="text-center">Bookings</th>
                        <th style={{ padding: '16px' }} className="text-center">Rating</th>
                        <th style={{ padding: '16px' }} className="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProviders.slice(0, 5).map(provider => (
                        <tr key={provider.id}>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center">
                              <img 
                                src={provider.avatar || `https://ui-avatars.com/api/?name=${provider.name}&background=667eea&color=fff&size=30`} 
                                alt={provider.name} 
                                className="rounded-circle me-2" 
                                style={{ width: 30, height: 30 }} 
                              />
                              <span className="fw-semibold">{provider.name}</span>
                            </div>
                          </td>
                          <td className="text-center">{provider.services}</td>
                          <td className="text-center">{provider.bookings}</td>
                          <td className="text-center">
                            <span className="text-warning">
                              <FaStar className="me-1" size={12} />
                              {provider.rating}
                            </span>
                          </td>
                          <td className="text-end fw-semibold text-primary">{formatNaira(provider.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col lg={4}>
            {/* System Health */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">
                  <FaHeartbeat className="text-danger me-2" /> System Health
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="health-item mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Server</span>
                    <Badge bg={getStatusBadge(systemHealth.server.status).bg}>
                      {getStatusBadge(systemHealth.server.status).text}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Uptime: {systemHealth.server.uptime}</span>
                    <span className="text-muted">Response: {systemHealth.server.responseTime}ms</span>
                  </div>
                </div>
                <div className="health-item mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Database</span>
                    <Badge bg={getStatusBadge(systemHealth.database.status).bg}>
                      {getStatusBadge(systemHealth.database.status).text}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Queries: {systemHealth.database.queries}/s</span>
                    <span className="text-warning">Slow: {systemHealth.database.slowQueries}</span>
                  </div>
                </div>
                <div className="health-item mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Cache</span>
                    <Badge bg={getStatusBadge(systemHealth.cache.status).bg}>
                      {getStatusBadge(systemHealth.cache.status).text}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Hit Rate: {systemHealth.cache.hitRate}%</span>
                  </div>
                </div>
                <div className="health-item">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">API</span>
                    <Badge bg={getStatusBadge(systemHealth.api.status).bg}>
                      {getStatusBadge(systemHealth.api.status).text}
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span className="text-muted">Requests: {systemHealth.api.requests}/min</span>
                    <span className="text-danger">Errors: {systemHealth.api.errors}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* User Distribution */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">
                  <FaChartPie className="text-primary me-2" /> User Distribution
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="distribution-item mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Customers</span>
                    <span className="text-primary fw-bold">{formatNumber(stats.users.customers)}</span>
                  </div>
                  <ProgressBar now={(stats.users.customers / (stats.users.total || 1)) * 100} variant="primary" style={{ height: '6px', borderRadius: '3px' }} />
                  <small className="text-muted">{((stats.users.customers / (stats.users.total || 1)) * 100).toFixed(1)}%</small>
                </div>
                <div className="distribution-item mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Providers</span>
                    <span className="text-success fw-bold">{formatNumber(stats.users.providers)}</span>
                  </div>
                  <ProgressBar now={(stats.users.providers / (stats.users.total || 1)) * 100} variant="success" style={{ height: '6px', borderRadius: '3px' }} />
                  <small className="text-muted">{((stats.users.providers / (stats.users.total || 1)) * 100).toFixed(1)}%</small>
                </div>
                <div className="distribution-item">
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Admins</span>
                    <span className="text-info fw-bold">{formatNumber(stats.users.admins)}</span>
                  </div>
                  <ProgressBar now={(stats.users.admins / (stats.users.total || 1)) * 100} variant="info" style={{ height: '6px', borderRadius: '3px' }} />
                  <small className="text-muted">{((stats.users.admins / (stats.users.total || 1)) * 100).toFixed(2)}%</small>
                </div>
              </Card.Body>
            </Card>

            {/* Popular Services */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">
                    <FaStar className="text-warning me-2" /> Popular Services
                  </h5>
                  <Link to="/admin/services" className="text-primary text-decoration-none small">View All</Link>
                </div>
              </Card.Header>
              <Card.Body>
                {popularServices.slice(0, 3).map((service, idx) => (
                  <div key={service.id} className="popular-service-item mb-3">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="mb-1">{service.title}</h6>
                        <small className="text-muted">{service.category}</small>
                      </div>
                      <div className="text-end">
                        <Badge bg="warning" text="dark" className="mb-1">
                          <FaStar className="me-1" size={10} />
                          {service.rating}
                        </Badge>
                        <div>
                          <small className="text-primary fw-semibold">{service.bookings} bookings</small>
                        </div>
                      </div>
                    </div>
                    {idx < popularServices.length - 1 && <hr className="my-2" />}
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Platform Achievements */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">
                  <FaGem className="text-warning me-2" /> Platform Achievements
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col xs={6}>
                    <div className="achievement-card text-center p-3">
                      <FaAward className="text-primary mb-2" size={24} />
                      <h6 className="mb-1">{formatNumber(stats.bookings.total)}</h6>
                      <small className="text-muted">Total Bookings</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="achievement-card text-center p-3">
                      <FaTrophy className="text-warning mb-2" size={24} />
                      <h6 className="mb-1">{formatNumber(stats.users.total)}</h6>
                      <small className="text-muted">Total Users</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="achievement-card text-center p-3">
                      <FaMedal className="text-info mb-2" size={24} />
                      <h6 className="mb-1">{stats.ratings.average.toFixed(1)}</h6>
                      <small className="text-muted">Avg Rating</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="achievement-card text-center p-3">
                      <FaCrown className="text-success mb-2" size={24} />
                      <h6 className="mb-1">{formatCompactNaira(stats.revenue.total)}</h6>
                      <small className="text-muted">Revenue</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }

        .welcome-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          border-radius: 20px;
          color: #fff;
        }
        .welcome-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .welcome-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 0;
        }
        .welcome-time {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        .metric-card {
          border-radius: 15px;
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        .metric-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .metric-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
          color: #2d3748;
        }
        .metric-label {
          color: #718096;
          font-size: 0.9rem;
        }
        .metric-growth {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .metric-growth.up {
          background: rgba(72,187,120,0.1);
          color: #48bb78;
        }
        .metric-growth.down {
          background: rgba(245,101,101,0.1);
          color: #f56565;
        }
        .activity-timeline {
          position: relative;
          padding-left: 30px;
        }
        .activity-item {
          position: relative;
          padding-bottom: 20px;
        }
        .activity-icon {
          position: absolute;
          left: -30px;
          top: 0;
          width: 24px;
          height: 24px;
          background: #f7fafc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          z-index: 1;
        }
        .activity-content {
          padding-left: 15px;
        }
        .activity-line {
          position: absolute;
          left: -18px;
          top: 24px;
          bottom: -10px;
          width: 2px;
          background: #e2e8f0;
        }
        .popular-service-item {
          transition: all 0.3s ease;
        }
        .popular-service-item:hover {
          transform: translateX(5px);
        }
        .achievement-card {
          background: #f7fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .achievement-card:hover {
          background: #edf2f7;
          transform: scale(1.05);
        }
        .health-item {
          padding: 10px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .health-item:hover {
          background: #f7fafc;
        }
        @media (max-width: 768px) {
          .welcome-title {
            font-size: 1.5rem;
          }
          .metric-value {
            font-size: 1.5rem;
          }
          .welcome-time {
            display: block;
            margin-left: 0 !important;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;