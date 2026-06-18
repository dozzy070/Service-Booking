// src/pages/dashboard/ProviderDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Table, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
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
  FaArrowUp,        // ✅ Changed from FaTrendingUp / FaArrowTrendUp
  FaAward,
  FaBell,
  FaCog,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaHourglassHalf,
  FaPercentage,
  FaArrowDown       // ✅ Changed from FaTrendingDown / FaArrowTrendDown
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from 'date-fns';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0, totalEarnings: 0,
    totalBookings: 0, completedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
    activeServices: 0, pendingApproval: 0, totalClients: 0, newClientsThisMonth: 0,
    averageRating: 0, totalReviews: 0, responseRate: 100, responseTime: '< 1 hour',
    completionRate: 0, earningsGrowth: 0, bookingGrowth: 0
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

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, servicesRes, scheduleRes, notifsRes] = await Promise.all([
        api.get('/provider/dashboard/stats'),
        api.get('/provider/dashboard/recent-bookings'),
        api.get('/provider/services'),
        api.get('/provider/dashboard/today-schedule'),
        api.get('/provider/notifications?limit=5')
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setServices(servicesRes.data);
      setUpcomingSchedule(scheduleRes.data);
      setNotifications(notifsRes.data);
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

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard updated');
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Start a booking
  const handleStart = async (scheduleItem) => {
    try {
      await api.post(`/provider/bookings/${scheduleItem.bookingId}/start`);
      toast.success('Service started successfully');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start service');
    }
  };

  // Complete a booking
  const handleComplete = async (bookingId) => {
    try {
      await api.put(`/provider/bookings/${bookingId}/complete`);
      toast.success('Service completed successfully');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete service');
    }
  };

  // Reschedule booking
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
        new_date: newDateTime
      });
      toast.success('Booking rescheduled successfully');
      setShowRescheduleModal(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    }
  };

  // Delete service
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'warning', text: 'warning', label: 'Pending', icon: FaClock },
      confirmed: { bg: 'info', text: 'info', label: 'Confirmed', icon: FaCheckCircle },
      in_progress: { bg: 'primary', text: 'primary', label: 'In Progress', icon: FaClock },
      started: { bg: 'info', text: 'info', label: 'Started', icon: FaCheckCircle },
      completed: { bg: 'success', text: 'success', label: 'Completed', icon: FaCheckCircle },
      cancelled: { bg: 'danger', text: 'danger', label: 'Cancelled', icon: FaExclamationCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <Badge bg={badge.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={10} />
        <span className="ms-1">{badge.label}</span>
      </Badge>
    );
  };

  const getScheduleTimeBadge = (bookingDate) => {
    const date = new Date(bookingDate);
    if (isToday(date)) {
      return <Badge bg="success" className="rounded-pill">Today</Badge>;
    } else if (isTomorrow(date)) {
      return <Badge bg="info" className="rounded-pill">Tomorrow</Badge>;
    } else {
      const days = differenceInDays(date, new Date());
      return <Badge bg="secondary" className="rounded-pill">In {days} days</Badge>;
    }
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
        {/* Header with Refresh */}
        <div className="d-flex justify-content-end mb-3">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="d-flex align-items-center gap-2"
          >
            <FaClock className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Welcome Section */}
        <Row className="mb-4">
          <Col>
            <div className="welcome-card">
              <Row className="align-items-center">
                <Col lg={7}>
                  <h1 className="welcome-title">{greeting}, {user?.name?.split(' ')[0] || 'Provider'}! 👋</h1>
                  <p className="welcome-subtitle">
                    Here's your business performance overview. You have <strong>{stats.pendingBookings}</strong> pending {stats.pendingBookings === 1 ? 'booking' : 'bookings'} to attend to.
                  </p>
                  <div className="d-flex gap-2 mt-3">
                    <div className="welcome-stat">
                      <FaDollarSign size={16} />
                      <span>{formatCompactNaira(stats.weeklyEarnings)} this week</span>
                    </div>
                    <div className="welcome-stat">
                      <FaStar size={16} />
                      <span>{stats.averageRating} ★ ({stats.totalReviews} reviews)</span>
                    </div>
                  </div>
                </Col>
                <Col lg={5} className="text-lg-end mt-3 mt-lg-0">
                  <Button as={Link} to="/provider/create-service" variant="light" className="px-4 py-2 rounded-pill me-2">
                    <FaPlus className="me-2" /> Add Service
                  </Button>
                  <Button as={Link} to="/provider/schedule" variant="outline-light" className="px-4 py-2 rounded-pill">
                    <FaRegClock className="me-2" /> Update Schedule
                  </Button>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col xl={3} lg={6} md={6}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon-wrapper bg-success bg-opacity-10">
                    <FaDollarSign className="text-success" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="stat-value">{formatCompactNaira(stats.todayEarnings)}</h3>
                    <p className="stat-label mb-0">Today's Earnings</p>
                  </div>
                  <div className={`stat-trend ${stats.earningsGrowth >= 0 ? 'up' : 'down'}`}>
                    <small>{stats.earningsGrowth >= 0 ? '+' : ''}{stats.earningsGrowth}%</small>
                  </div>
                </div>
                <div className="stat-details mt-3">
                  <div className="d-flex justify-content-between">
                    <span><FaClock className="text-warning me-1" size={12} /> Weekly: {formatCompactNaira(stats.weeklyEarnings)}</span>
                    <span><FaChartLine className="text-success me-1" size={12} /> Monthly: {formatCompactNaira(stats.monthlyEarnings)}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon-wrapper bg-primary bg-opacity-10">
                    <FaCalendarCheck className="text-primary" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="stat-value">{stats.totalBookings}</h3>
                    <p className="stat-label mb-0">Total Bookings</p>
                  </div>
                  <div className={`stat-trend ${stats.bookingGrowth >= 0 ? 'up' : 'down'}`}>
                    <small>{stats.bookingGrowth >= 0 ? '+' : ''}{stats.bookingGrowth}%</small>
                  </div>
                </div>
                <div className="stat-details mt-3">
                  <ProgressBar
                    now={stats.totalBookings ? (stats.completedBookings / stats.totalBookings) * 100 : 0}
                    variant="success"
                    className="mb-2"
                    style={{ height: '4px' }}
                  />
                  <div className="d-flex justify-content-between small">
                    <span><FaCheckCircle className="text-success me-1" /> {stats.completedBookings} Completed</span>
                    <span><FaClock className="text-warning me-1" /> {stats.pendingBookings} Pending</span>
                    <span><FaExclamationCircle className="text-danger me-1" /> {stats.cancelledBookings} Cancelled</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon-wrapper bg-warning bg-opacity-10">
                    <FaStar className="text-warning" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="stat-value">{stats.averageRating.toFixed(1)}</h3>
                    <p className="stat-label mb-0">Average Rating</p>
                  </div>
                </div>
                <div className="stat-details mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span><FaUsers className="text-info me-1" /> {stats.totalReviews} reviews</span>
                    <Link to="/provider/reviews" className="text-decoration-none small">View All <FaArrowRight size={10} /></Link>
                  </div>
                  <div className="mt-2">
                    <div className="d-flex align-items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FaStar key={star} size={14} color={star <= Math.floor(stats.averageRating) ? '#fbbf24' : '#e2e8f0'} />
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} md={6}>
            <Card className="stat-card border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="stat-icon-wrapper bg-info bg-opacity-10">
                    <FaServicestack className="text-info" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="stat-value">{stats.activeServices}</h3>
                    <p className="stat-label mb-0">Active Services</p>
                  </div>
                  {stats.pendingApproval > 0 && (
                    <Badge bg="warning" className="ms-2">{stats.pendingApproval} pending</Badge>
                  )}
                </div>
                <div className="stat-details mt-3">
                  <div className="d-flex justify-content-between">
                    <span><FaUsers className="text-primary me-1" /> {stats.totalClients} total clients</span>
                    <span><FaArrowUp className="text-success me-1" /> +{stats.newClientsThisMonth} new this month</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Grid */}
        <Row className="g-4">
          <Col lg={8}>
            {/* Today's Schedule */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaClock className="text-primary me-2" />Today's Schedule</h5>
                  <Link to="/provider/schedule" className="text-primary text-decoration-none small">Manage Schedule <FaArrowRight size={12} /></Link>
                </div>
              </Card.Header>
              <Card.Body>
                {upcomingSchedule.length === 0 ? (
                  <div className="text-center py-4">
                    <FaCalendarAlt size={48} className="text-muted mb-3 opacity-50" />
                    <p className="text-muted mb-0">No appointments scheduled for today.</p>
                    <Link to="/provider/schedule" className="btn btn-link btn-sm mt-2">Set your availability</Link>
                  </div>
                ) : (
                  upcomingSchedule.map((item, idx) => (
                    <div key={idx} className="schedule-item">
                      <Row className="align-items-center">
                        <Col xs={12} sm={2} className="mb-2 mb-sm-0">
                          <div className="schedule-time">
                            <strong>{item.time}</strong>
                            {getScheduleTimeBadge(item.bookingDate)}
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div className="d-flex align-items-center">
                            <div className="schedule-dot bg-primary me-3"></div>
                            <div>
                              <h6 className="mb-1">{item.service}</h6>
                              <p className="text-muted small mb-0">
                                <FaUsers className="me-1" size={10} /> {item.customer}
                                {item.address && <><br /><FaMapMarkerAlt className="me-1" size={10} /> {item.address}</>}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col xs={12} sm={4} className="text-sm-end mt-2 mt-sm-0">
                          <div className="d-flex gap-2 justify-content-sm-end">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="rounded-pill"
                              onClick={() => handleStart(item)}
                              disabled={item.status === 'started' || item.status === 'completed'}
                            >
                              <FaCheckCircle className="me-1" size={12} />
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="rounded-pill"
                              onClick={() => handleRescheduleClick(item)}
                            >
                              <FaClock className="me-1" size={12} />
                              Reschedule
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaCalendarCheck className="text-primary me-2" />Recent Bookings</h5>
                  <Link to="/provider/bookings" className="text-primary text-decoration-none small">View All <FaArrowRight size={12} /></Link>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th style={{ padding: '16px' }}>Customer</th>
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px' }}>Date & Time</th>
                        <th style={{ padding: '16px' }}>Amount</th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <p className="text-muted mb-0">No recent bookings</p>
                          </td>
                        </tr>
                      ) : (
                        recentBookings.map(booking => (
                          <tr key={booking.id}>
                            <td style={{ padding: '12px' }}>
                              <div className="d-flex align-items-center">
                                <img
                                  src={booking.customerAvatar || `https://ui-avatars.com/api/?name=${booking.customer}&background=667eea&color=fff&size=32`}
                                  alt={booking.customer}
                                  className="rounded-circle me-2"
                                  style={{ width: 32, height: 32 }}
                                />
                                <span className="fw-medium">{booking.customer}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px' }}>{booking.service}</td>
                            <td style={{ padding: '12px' }}>
                              <div>{format(new Date(booking.date), 'MMM dd, yyyy')}</div>
                              <small className="text-muted">{booking.time}</small>
                            </td>
                            <td style={{ padding: '12px' }} className="fw-bold text-primary">
                              {formatNaira(booking.amount)}
                            </td>
                            <td style={{ padding: '12px' }}>{getStatusBadge(booking.status)}</td>
                            <td style={{ padding: '12px' }}>
                              <div className="d-flex gap-1">
                                <Button size="sm" variant="link" className="text-primary" as={Link} to={`/provider/bookings/${booking.id}`}>
                                  <FaEye />
                                </Button>
                                {booking.status === 'pending' && (
                                  <>
                                    <Button size="sm" variant="link" className="text-success" onClick={() => handleStart(booking)}>
                                      <FaCheckCircle />
                                    </Button>
                                    <Button size="sm" variant="link" className="text-danger" onClick={() => handleRescheduleClick(booking)}>
                                      <FaExclamationCircle />
                                    </Button>
                                  </>
                                )}
                                {booking.status === 'in_progress' && (
                                  <Button size="sm" variant="link" className="text-success" onClick={() => handleComplete(booking.id)}>
                                    <FaCheckCircle />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Performance Metrics */}
            <Card className="border-0 shadow-sm mb-4 performance-card">
              <Card.Body>
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FaChartLine size={18} />
                  Performance Metrics
                </h5>
                <div className="performance-metrics">
                  <div className="metric-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Response Rate</span>
                      <span className="fw-bold">{stats.responseRate}%</span>
                    </div>
                    <ProgressBar now={stats.responseRate} variant="success" style={{ height: '6px', borderRadius: '3px' }} />
                  </div>
                  <div className="metric-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Average Response Time</span>
                      <span className="fw-bold">{stats.responseTime}</span>
                    </div>
                  </div>
                  <div className="metric-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Completion Rate</span>
                      <span className="fw-bold">{stats.completionRate}%</span>
                    </div>
                    <ProgressBar now={stats.completionRate} variant="info" style={{ height: '6px', borderRadius: '3px' }} />
                  </div>
                  <div className="metric-item">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Customer Satisfaction</span>
                      <span className="fw-bold">{((stats.averageRating / 5) * 100).toFixed(0)}%</span>
                    </div>
                    <ProgressBar now={(stats.averageRating / 5) * 100} variant="warning" style={{ height: '6px', borderRadius: '3px' }} />
                  </div>
                </div>
                <hr className="my-4" />
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FaCog size={18} />
                  Quick Actions
                </h5>
                <div className="quick-actions-grid">
                  <Button as={Link} to="/provider/create-service" variant="outline-light" className="w-100 mb-2 py-2">
                    <FaPlus className="me-2" /> Add New Service
                  </Button>
                  <Button as={Link} to="/provider/schedule" variant="outline-light" className="w-100 mb-2 py-2">
                    <FaRegClock className="me-2" /> Update Availability
                  </Button>
                  <Button as={Link} to="/provider/wallet" variant="outline-light" className="w-100 py-2">
                    <FaWallet className="me-2" /> Withdraw Earnings
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Recent Notifications */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaBell className="text-primary me-2" />Recent Notifications</h5>
                  <Link to="/provider/notifications" className="text-primary text-decoration-none small">View All</Link>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-4">
                    <FaBell size={32} className="text-muted mb-2 opacity-50" />
                    <p className="text-muted small mb-0">No new notifications</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="notification-item">
                      <div className="d-flex gap-3">
                        <div className={`notification-icon ${notif.type}`}>
                          {notif.type === 'booking' && <FaCalendarCheck size={16} />}
                          {notif.type === 'payment' && <FaDollarSign size={16} />}
                          {notif.type === 'review' && <FaStar size={16} />}
                          {notif.type === 'alert' && <FaExclamationCircle size={16} />}
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-1 small">{notif.message}</p>
                          <small className="text-muted">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Top Services */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaServicestack className="text-primary me-2" />Top Services</h5>
                  <Link to="/provider/my-services" className="text-primary text-decoration-none small">Manage</Link>
                </div>
              </Card.Header>
              <Card.Body>
                {services.length === 0 ? (
                  <div className="text-center py-4">
                    <FaServicestack size={32} className="text-muted mb-2 opacity-50" />
                    <p className="text-muted small mb-0">No services added yet</p>
                    <Button as={Link} to="/provider/create-service" variant="link" size="sm" className="mt-2">
                      Add your first service
                    </Button>
                  </div>
                ) : (
                  services.slice(0, 3).map(service => (
                    <div key={service.id} className="service-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{service.title}</h6>
                          <small className="text-muted">{service.category}</small>
                        </div>
                        <Badge bg={service.status === 'active' ? 'success' : 'warning'} className="rounded-pill">
                          {service.status}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold text-primary">{formatNaira(service.price)}</span>
                          <span className="text-muted mx-2">•</span>
                          <span><FaStar className="text-warning me-1" size={12} /> {service.rating || 'New'}</span>
                          <span className="text-muted ms-2">({service.bookings || 0} bookings)</span>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="link"
                            className="text-primary me-1"
                            as={Link}
                            to={`/provider/edit-service/${service.id}`}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            size="sm"
                            variant="link"
                            className="text-danger"
                            onClick={() => {
                              setServiceToDelete(service);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Reschedule Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <small>Select a new date and time for this booking.</small>
          </Alert>
          <Form.Group>
            <Form.Label className="fw-semibold">New Date & Time</Form.Label>
            <Form.Control
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="py-2"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowRescheduleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRescheduleConfirm}>
            Confirm Reschedule
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Service Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">Delete Service</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationCircle className="me-2" />
            Are you sure you want to delete "{serviceToDelete?.title}"? This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteService} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Service'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .provider-dashboard { padding-bottom: 40px; }
        .welcome-card {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          padding: 30px;
          border-radius: 20px;
          color: white;
        }
        .welcome-title { font-size: 2rem; font-weight: 700; margin-bottom: 10px; }
        .welcome-subtitle { font-size: 1rem; opacity: 0.9; margin-bottom: 0; }
        .welcome-stat {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
        }
        .stat-card {
          border-radius: 15px;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        .stat-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-value { font-size: 1.8rem; font-weight: 700; margin: 0; line-height: 1.2; }
        .stat-label { color: #718096; font-size: 0.9rem; }
        .stat-trend {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        .stat-trend.up { background: rgba(72,187,120,0.1); color: #48bb78; }
        .stat-trend.down { background: rgba(229,62,62,0.1); color: #e53e3e; }
        .schedule-item {
          padding: 15px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .schedule-item:last-child { border-bottom: none; }
        .schedule-time {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .schedule-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .performance-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .performance-card .progress { background-color: rgba(255,255,255,0.2); }
        .service-item {
          padding: 12px;
          border-radius: 10px;
          transition: all 0.3s ease;
          margin-bottom: 12px;
          background: #f8fafc;
        }
        .service-item:hover { background: #f1f5f9; }
        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .notification-item:hover { background: #f8fafc; }
        .notification-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-icon.booking { background: #3b82f620; color: #3b82f6; }
        .notification-icon.payment { background: #10b98120; color: #10b981; }
        .notification-icon.review { background: #f59e0b20; color: #f59e0b; }
        .notification-icon.alert { background: #ef444420; color: #ef4444; }
        .quick-actions-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (max-width: 768px) {
          .welcome-title { font-size: 1.5rem; }
          .stat-value { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default ProviderDashboard;