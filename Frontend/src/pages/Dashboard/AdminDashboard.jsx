// src/pages/dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaUsers, FaServicestack, FaCalendarCheck, FaChartLine, FaMoneyBillWave,
  FaStar, FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaExclamationCircle,
  FaUserPlus, FaUserCheck, FaUserClock, FaUserTimes, FaDollarSign, FaPercentage,
  FaChartPie, FaRocket, FaShieldAlt, FaHeartbeat, FaAward, FaTrophy, FaMedal,
  FaCrown, FaGem, FaExclamationTriangle, FaCog, FaFileAlt, FaInfoCircle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [timeAgo, setTimeAgo] = useState('');
  const [selectedChartView, setSelectedChartView] = useState('monthly');

  // ========== Real-time state (all start empty/default) ==========
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
    server: { status: 'healthy', uptime: '0%', responseTime: 0 },
    database: { status: 'healthy', queries: 0, slowQueries: 0 },
    cache: { status: 'healthy', hitRate: 0 },
    api: { status: 'healthy', requests: 0, errors: 0 }
  });

  // ========== Helper functions ==========
  const formatCurrency = (amount) => `$${amount?.toLocaleString() || 0}`;
  const formatNumber = (num) => num?.toLocaleString() || 0;
  const getGrowthIcon = (growth) => growth > 0 ? <FaArrowUp className="text-success" /> : <FaArrowDown className="text-danger" />;
  const getStatusBadge = (status) => {
    const badges = {
      healthy: { bg: 'success', text: 'Healthy' },
      warning: { bg: 'warning', text: 'Warning' },
      critical: { bg: 'danger', text: 'Critical' }
    };
    return badges[status] || badges.healthy;
  };

  // ========== API calls (non‑blocking, no spinners) ==========
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  };

  const fetchChartData = async (view) => {
    try {
      const res = await api.get(`/admin/dashboard/revenue-chart?view=${view}`);
      setChartData(res.data);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/admin/dashboard/activities');
      setRecentActivities(res.data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const fetchTopProviders = async () => {
    try {
      const res = await api.get('/admin/dashboard/top-providers');
      setTopProviders(res.data);
    } catch (err) {
      console.error('Failed to fetch top providers:', err);
    }
  };

  const fetchPopularServices = async () => {
    try {
      const res = await api.get('/admin/dashboard/popular-services');
      setPopularServices(res.data);
    } catch (err) {
      console.error('Failed to fetch popular services:', err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await api.get('/admin/dashboard/pending-approvals');
      setPendingApprovals(res.data);
    } catch (err) {
      console.error('Failed to fetch pending approvals:', err);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const res = await api.get('/admin/dashboard/system-health');
      setSystemHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  };

  // ========== Initial data fetch ==========
  useEffect(() => {
    // Greeting
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
    const interval = setInterval(updateTimeAgo, 1000);

    // Fetch all data
    fetchStats();
    fetchChartData(selectedChartView);
    fetchActivities();
    fetchTopProviders();
    fetchPopularServices();
    fetchPendingApprovals();
    fetchSystemHealth();

    return () => clearInterval(interval);
  }, []);

  // Refetch chart when view changes
  useEffect(() => {
    fetchChartData(selectedChartView);
  }, [selectedChartView]);

  // Chart bar click handler
  const handleBarClick = (label, value) => {
    alert(`${label} Revenue: ${formatCurrency(value)}`);
  };

  // View all logs (example – you can implement a modal or navigate)
  const handleViewAllLogs = () => {
    alert(`Recent Activities (${recentActivities.length} items):\n` +
          recentActivities.map(a => `${a.user}: ${a.action} (${a.time})`).join('\n'));
  };

  return (
    <Container fluid className="admin-dashboard">
      {/* Welcome Section (static, no mock) */}
      <Row className="mb-4">
        <Col>
          <div className="welcome-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="welcome-title">{greeting}, {user?.name || 'Admin'}! 👋</h1>
                <p className="welcome-subtitle">
                  Welcome back to your admin dashboard. Here's what's happening on your platform today.
                  <span className="welcome-time ms-3"><FaClock className="me-1" /> {timeAgo}</span>
                </p>
              </Col>
              <Col md={4} className="text-md-end">
                <Button as={Link} to="/admin/reports" variant="light" className="px-4 py-2 rounded-pill me-2">
                  <FaChartLine className="me-2" /> Reports
                </Button>
                <Button as={Link} to="/admin/settings" variant="outline-light" className="px-4 py-2 rounded-pill">
                  <FaCog className="me-2" /> Settings
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Key Metrics Cards – all values come from real stats */}
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
                <div className="metric-growth up">
                  <span>+{stats.users.growth}%</span>
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
                  <p className="metric-label mb-0">Active Services</p>
                </div>
                <div className="metric-growth up">
                  <span>+{stats.services.growth}%</span>
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
                <div className="metric-growth up">
                  <span>+{stats.bookings.growth}%</span>
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
                  <h3 className="metric-value">{formatCurrency(stats.revenue.total)}</h3>
                  <p className="metric-label mb-0">Total Revenue</p>
                </div>
                <div className="metric-growth up">
                  <span>+{stats.revenue.growth}%</span>
                  {getGrowthIcon(stats.revenue.growth)}
                </div>
              </div>
              <div className="metric-details mt-3">
                <div className="d-flex justify-content-between small">
                  <span><FaDollarSign className="text-success me-1" /> {formatCurrency(stats.revenue.monthly)} This Month</span>
                  <span><FaPercentage className="text-info me-1" /> {formatCurrency(stats.revenue.commission)} Commission</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions (pending counts come from API) */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="mb-3">Quick Actions</h6>
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
                <Button as={Link} to="/admin/settings" variant="outline-secondary" size="sm" className="rounded-pill">
                  <FaShieldAlt className="me-2" /> Backup System
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
          {/* Revenue Chart – dynamic from API */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaChartLine className="text-primary me-2" /> Revenue Overview</h5>
                <div>
                  {['weekly', 'monthly', 'yearly'].map(view => (
                    <Button key={view} variant="link" size="sm"
                      className={`text-decoration-none me-2 ${selectedChartView === view ? 'active fw-bold text-primary' : 'text-secondary'}`}
                      onClick={() => setSelectedChartView(view)}>
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="revenue-chart" style={{ height: '300px' }}>
                <Row className="h-100 align-items-end">
                  {chartData.labels?.map((label, idx) => {
                    const value = chartData.data[idx] || 0;
                    const height = chartData.maxValue ? (value / chartData.maxValue) * 100 : 0;
                    return (
                      <Col key={idx} className="text-center" style={{ cursor: 'pointer' }}>
                        <div className="chart-bar" style={{ height: `${height}%`, backgroundColor: `hsl(${240 - (value / (chartData.maxValue || 1)) * 120}, 70%, 60%)` }} onClick={() => handleBarClick(label, value)}>
                          <span className="chart-value">{selectedChartView === 'yearly' ? formatCurrency(value) : value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}</span>
                        </div>
                        <small className="text-muted mt-2 d-block">{label}</small>
                      </Col>
                    );
                  })}
                </Row>
              </div>
              <div className="text-center mt-3"><small className="text-muted"><FaInfoCircle className="me-1" /> Click any bar for details</small></div>
            </Card.Body>
          </Card>

          {/* Recent Activities – from API */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaRocket className="text-primary me-2" /> Recent Activities</h5>
                <Button variant="link" className="text-primary text-decoration-none small p-0" onClick={handleViewAllLogs}>
                  <FaFileAlt className="me-1" /> View All Logs
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="activity-timeline">
                {recentActivities.map((activity, idx) => (
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
                      <p className="mb-1"><span className="fw-semibold">{activity.user}</span> {activity.action}</p>
                      <small className="text-muted">{activity.time}</small>
                    </div>
                    {idx < recentActivities.length - 1 && <div className="activity-line" />}
                  </div>
                ))}
                {recentActivities.length === 0 && <p className="text-muted text-center">No recent activities</p>}
              </div>
            </Card.Body>
          </Card>

          {/* Top Providers – from API */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaTrophy className="text-warning me-2" /> Top Performing Providers</h5>
                <Link to="/admin/users" className="text-primary text-decoration-none small">View All</Link>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive className="mb-0">
                <thead><tr><th>Provider</th><th className="text-center">Services</th><th className="text-center">Bookings</th><th className="text-center">Rating</th><th className="text-end">Revenue</th></tr></thead>
                <tbody>
                  {topProviders.map(provider => (
                    <tr key={provider.id}>
                      <td><div className="d-flex align-items-center"><img src={provider.avatar} alt={provider.name} className="rounded-circle me-2" style={{ width: 30, height: 30 }} /><span className="fw-semibold">{provider.name}</span></div></td>
                      <td className="text-center">{provider.services}</td><td className="text-center">{provider.bookings}</td>
                      <td className="text-center"><span className="text-warning"><FaStar className="me-1" size={12} />{provider.rating}</span></td>
                      <td className="text-end fw-semibold text-primary">{formatCurrency(provider.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* System Health – from API */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0"><FaHeartbeat className="text-danger me-2" /> System Health</h5></Card.Header>
            <Card.Body>
              <div className="health-item mb-3"><div className="d-flex justify-content-between"><span className="fw-semibold">Server</span><Badge bg={getStatusBadge(systemHealth.server.status).bg}>{getStatusBadge(systemHealth.server.status).text}</Badge></div><div className="d-flex justify-content-between small"><span className="text-muted">Uptime: {systemHealth.server.uptime}</span><span className="text-muted">Response: {systemHealth.server.responseTime}ms</span></div></div>
              <div className="health-item mb-3"><div className="d-flex justify-content-between"><span className="fw-semibold">Database</span><Badge bg={getStatusBadge(systemHealth.database.status).bg}>{getStatusBadge(systemHealth.database.status).text}</Badge></div><div className="d-flex justify-content-between small"><span className="text-muted">Queries: {systemHealth.database.queries}/s</span><span className="text-warning">Slow: {systemHealth.database.slowQueries}</span></div></div>
              <div className="health-item mb-3"><div className="d-flex justify-content-between"><span className="fw-semibold">Cache</span><Badge bg={getStatusBadge(systemHealth.cache.status).bg}>{getStatusBadge(systemHealth.cache.status).text}</Badge></div><div className="d-flex justify-content-between small"><span className="text-muted">Hit Rate: {systemHealth.cache.hitRate}%</span></div></div>
              <div className="health-item"><div className="d-flex justify-content-between"><span className="fw-semibold">API</span><Badge bg={getStatusBadge(systemHealth.api.status).bg}>{getStatusBadge(systemHealth.api.status).text}</Badge></div><div className="d-flex justify-content-between small"><span className="text-muted">Requests: {systemHealth.api.requests}/min</span><span className="text-danger">Errors: {systemHealth.api.errors}</span></div></div>
            </Card.Body>
          </Card>

          {/* User Distribution – from stats */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0"><FaChartPie className="text-primary me-2" /> User Distribution</h5></Card.Header>
            <Card.Body>
              <div className="distribution-item mb-3"><div className="d-flex justify-content-between"><span className="fw-semibold">Customers</span><span className="text-primary fw-bold">{formatNumber(stats.users.customers)}</span></div><ProgressBar now={(stats.users.customers / (stats.users.total || 1)) * 100} variant="primary" style={{ height: '6px' }} /><small className="text-muted">{((stats.users.customers / (stats.users.total || 1)) * 100).toFixed(1)}%</small></div>
              <div className="distribution-item mb-3"><div className="d-flex justify-content-between"><span className="fw-semibold">Providers</span><span className="text-success fw-bold">{formatNumber(stats.users.providers)}</span></div><ProgressBar now={(stats.users.providers / (stats.users.total || 1)) * 100} variant="success" style={{ height: '6px' }} /><small className="text-muted">{((stats.users.providers / (stats.users.total || 1)) * 100).toFixed(1)}%</small></div>
              <div className="distribution-item"><div className="d-flex justify-content-between"><span className="fw-semibold">Admins</span><span className="text-info fw-bold">{stats.users.admins}</span></div><ProgressBar now={(stats.users.admins / (stats.users.total || 1)) * 100} variant="info" style={{ height: '6px' }} /><small className="text-muted">{((stats.users.admins / (stats.users.total || 1)) * 100).toFixed(2)}%</small></div>
            </Card.Body>
          </Card>

          {/* Popular Services – from API */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4"><div className="d-flex justify-content-between"><h5 className="mb-0"><FaStar className="text-warning me-2" /> Popular Services</h5><Link to="/admin/services" className="text-primary text-decoration-none small">View All</Link></div></Card.Header>
            <Card.Body>
              {popularServices.map((service, idx) => (
                <div key={service.id} className="popular-service-item mb-3">
                  <div className="d-flex justify-content-between"><div><h6 className="mb-1">{service.title}</h6><small className="text-muted">{service.category}</small></div><div className="text-end"><Badge bg="warning" text="dark" className="mb-1"><FaStar className="me-1" size={10} />{service.rating}</Badge><div><small className="text-primary fw-semibold">{service.bookings} bookings</small></div></div></div>
                  {idx < popularServices.length - 1 && <hr className="my-2" />}
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Platform Achievements – from stats */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0"><FaGem className="text-warning me-2" /> Platform Achievements</h5></Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col xs={6}><div className="achievement-card text-center p-3"><FaAward className="text-primary mb-2" size={24} /><h6 className="mb-1">{formatNumber(stats.bookings.total)}</h6><small className="text-muted">Total Bookings</small></div></Col>
                <Col xs={6}><div className="achievement-card text-center p-3"><FaTrophy className="text-warning mb-2" size={24} /><h6 className="mb-1">{formatNumber(stats.users.total)}</h6><small className="text-muted">Total Users</small></div></Col>
                <Col xs={6}><div className="achievement-card text-center p-3"><FaMedal className="text-info mb-2" size={24} /><h6 className="mb-1">{stats.ratings.average}</h6><small className="text-muted">Avg Rating</small></div></Col>
                <Col xs={6}><div className="achievement-card text-center p-3"><FaCrown className="text-success mb-2" size={24} /><h6 className="mb-1">{formatCurrency(stats.revenue.total)}</h6><small className="text-muted">Revenue</small></div></Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Inline styles (unchanged) */}
      <style jsx="true">{`
        .admin-dashboard { padding-bottom: 40px; }
        .welcome-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; color: #fff; box-shadow: 0 10px 30px rgba(102,126,234,0.3); }
        .welcome-title { font-size: 2rem; font-weight: 700; margin-bottom: 10px; }
        .welcome-subtitle { font-size: 1rem; opacity: 0.9; margin-bottom: 0; }
        .welcome-time { font-size: 0.9rem; opacity: 0.8; }
        .metric-card { border-radius: 15px; transition: all 0.3s ease; }
        .metric-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
        .metric-icon-wrapper { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .metric-value { font-size: 1.8rem; font-weight: 700; margin: 0; line-height: 1.2; color: #2d3748; }
        .metric-label { color: #718096; font-size: 0.9rem; }
        .metric-growth { padding: 3px 8px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .metric-growth.up { background: rgba(72,187,120,0.1); color: #48bb78; }
        .metric-growth.down { background: rgba(245,101,101,0.1); color: #f56565; }
        .metric-details { font-size: 0.85rem; color: #718096; }
        .revenue-chart { position: relative; }
        .chart-bar { width: 100%; background: #667eea; border-radius: 8px 8px 0 0; position: relative; transition: all 0.3s ease; min-height: 20px; cursor: pointer; }
        .chart-bar:hover { opacity: 0.8; transform: scale(1.02); }
        .chart-value { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 0.8rem; font-weight: 600; color: #2d3748; white-space: nowrap; opacity: 0; transition: opacity 0.3s ease; }
        .chart-bar:hover .chart-value { opacity: 1; }
        .activity-timeline { position: relative; padding-left: 30px; }
        .activity-item { position: relative; padding-bottom: 20px; }
        .activity-icon { position: absolute; left: -30px; top: 0; width: 24px; height: 24px; background: #f7fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; z-index: 1; }
        .activity-content { padding-left: 15px; }
        .activity-line { position: absolute; left: -18px; top: 24px; bottom: -10px; width: 2px; background: #e2e8f0; }
        .popular-service-item { transition: all 0.3s ease; }
        .popular-service-item:hover { transform: translateX(5px); }
        .achievement-card { background: #f7fafc; border-radius: 12px; transition: all 0.3s ease; }
        .achievement-card:hover { background: #edf2f7; transform: scale(1.05); }
        .health-item { padding: 10px; border-radius: 10px; transition: all 0.3s ease; }
        .health-item:hover { background: #f7fafc; }
        @media (max-width: 768px) {
          .welcome-title { font-size: 1.5rem; }
          .metric-value { font-size: 1.5rem; }
          .welcome-time { display: block; margin-left: 0 !important; margin-top: 10px; }
        }
      `}</style>
    </Container>
  );
};

export default AdminDashboard;