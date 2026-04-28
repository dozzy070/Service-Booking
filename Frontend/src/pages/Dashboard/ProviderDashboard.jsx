// src/pages/dashboard/ProviderDashboard.jsx (Real API + localStorage fallback)
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge, Table, Modal, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaDollarSign, FaCalendarCheck, FaStar, FaClock,
  FaCheckCircle, FaExclamationCircle, FaArrowRight, FaChartLine,
  FaUsers, FaServicestack, FaEye, FaEdit, FaTrash, FaPlus, FaRegClock
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';

// Helper to load/save to localStorage
const STORAGE_KEYS = {
  STATS: 'provider_dashboard_stats',
  RECENT_BOOKINGS: 'provider_recent_bookings',
  SERVICES: 'provider_services',
  SCHEDULE: 'provider_today_schedule'
};

const getDefaultStats = () => ({
  todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0, totalEarnings: 0,
  totalBookings: 0, completedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
  activeServices: 0, pendingApproval: 0, totalClients: 0, newClientsThisMonth: 0,
  averageRating: 0, totalReviews: 0, responseRate: 100, responseTime: '< 1 hour'
});

const getDefaultRecentBookings = () => [];

const getDefaultServices = () => [];

const getDefaultSchedule = () => [];

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    return saved ? JSON.parse(saved) : getDefaultStats();
  });
  const [recentBookings, setRecentBookings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECENT_BOOKINGS);
    return saved ? JSON.parse(saved) : getDefaultRecentBookings();
  });
  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : getDefaultServices();
  });
  const [upcomingSchedule, setUpcomingSchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    return saved ? JSON.parse(saved) : getDefaultSchedule();
  });

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [newDateTime, setNewDateTime] = useState('');

  const formatCurrency = (amount) => `$${parseFloat(amount || 0).toLocaleString()}`;

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }, [stats]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECENT_BOOKINGS, JSON.stringify(recentBookings));
  }, [recentBookings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(upcomingSchedule));
  }, [upcomingSchedule]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, servicesRes, scheduleRes] = await Promise.all([
        api.get('/provider/dashboard/stats'),
        api.get('/provider/dashboard/recent-bookings'),
        api.get('/provider/services'),
        api.get('/provider/dashboard/today-schedule')
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setServices(servicesRes.data);
      setUpcomingSchedule(scheduleRes.data);
    } catch (error) {
      // If 404 (endpoint missing), keep using localStorage data – no error toast
      if (error.response?.status !== 404) {
        console.error('Dashboard fetch error:', error);
      }
      // No mock data is injected here – localStorage already has data or empty
    }
  }, []);

  // Poll every 30 seconds (if API exists)
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Start a booking (real API call)
  const handleStart = async (scheduleItem) => {
    try {
      await api.post(`/provider/bookings/${scheduleItem.bookingId}/start`);
      toast.success('Service started');
      fetchDashboardData();
    } catch (err) {
      if (err.response?.status === 404) {
        // Simulate success for demo – update localStorage directly
        toast.success('(Demo) Service started');
        // Update schedule status locally
        setUpcomingSchedule(prev =>
          prev.map(item =>
            item.bookingId === scheduleItem.bookingId ? { ...item, status: 'started' } : item
          )
        );
      } else {
        toast.error(err.response?.data?.message || 'Failed to start');
      }
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
        new_date: newDateTime
      });
      toast.success('Booking rescheduled');
      setShowRescheduleModal(false);
      fetchDashboardData();
    } catch (err) {
      if (err.response?.status === 404) {
        // Demo: update localStorage
        toast.success('(Demo) Booking rescheduled');
        setUpcomingSchedule(prev =>
          prev.map(item =>
            item.bookingId === selectedSchedule.bookingId
              ? { ...item, bookingDate: newDateTime, time: new Date(newDateTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) }
              : item
          )
        );
        setShowRescheduleModal(false);
      } else {
        toast.error(err.response?.data?.message || 'Reschedule failed');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'warning', text: 'warning', label: 'Pending' },
      completed: { bg: 'success', text: 'success', label: 'Completed' },
      cancelled: { bg: 'danger', text: 'danger', label: 'Cancelled' },
      in_progress: { bg: 'info', text: 'info', label: 'In Progress' },
      active: { bg: 'success', text: 'success', label: 'Active' },
      started: { bg: 'info', text: 'info', label: 'Started' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <Badge bg={badge.bg} className={`bg-${badge.bg} bg-opacity-10 text-${badge.text} px-3 py-2 rounded-pill`}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <Container fluid className="provider-dashboard">
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <div className="welcome-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="welcome-title">{greeting}, {user?.name || 'Provider'}! 👋</h1>
                <p className="welcome-subtitle">
                  Here's your business performance overview. You have {stats.pendingBookings} pending bookings to attend to.
                </p>
              </Col>
              <Col md={4} className="text-md-end">
                <Button as={Link} to="/provider/create-service" variant="light" className="px-4 py-2 rounded-pill me-2">
                  <FaPlus className="me-2" /> Add Service
                </Button>
                <Button as={Link} to="/services" variant="outline-light" className="px-4 py-2 rounded-pill">
                  Browse Opportunities
                </Button>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* Stats Cards - same as before, using stats state */}
      <Row className="g-4 mb-4">
        <Col xl={3} lg={6} md={6}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon-wrapper bg-success bg-opacity-10">
                  <FaDollarSign className="text-success" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="stat-value">{formatCurrency(stats.todayEarnings)}</h3>
                  <p className="stat-label mb-0">Today's Earnings</p>
                </div>
                <div className="stat-trend up"><small>+12%</small></div>
              </div>
              <div className="stat-details mt-3">
                <div className="d-flex justify-content-between">
                  <span><FaClock className="text-warning me-1" size={12} /> Weekly: {formatCurrency(stats.weeklyEarnings)}</span>
                  <span><FaChartLine className="text-success me-1" size={12} /> Monthly: {formatCurrency(stats.monthlyEarnings)}</span>
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
                  <h3 className="stat-value">{stats.averageRating}</h3>
                  <p className="stat-label mb-0">Average Rating</p>
                </div>
              </div>
              <div className="stat-details mt-3">
                <div className="d-flex justify-content-between">
                  <span><FaUsers className="text-info me-1" /> {stats.totalReviews} reviews</span>
                  <Link to="/provider/reviews" className="text-decoration-none small">View All <FaArrowRight size={10} /></Link>
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
                {stats.pendingApproval > 0 && <Badge bg="warning" className="ms-2">{stats.pendingApproval} pending</Badge>}
              </div>
              <div className="stat-details mt-3">
                <Link to="/provider/my-services" className="text-decoration-none small">Manage Services <FaArrowRight size={10} /></Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Grid - same as before, using state */}
      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaClock className="text-primary me-2" />Today's Schedule</h5>
                <Link to="/provider/schedule" className="text-primary text-decoration-none small">Manage Schedule <FaArrowRight size={12} /></Link>
              </div>
            </Card.Header>
            <Card.Body>
              {upcomingSchedule.length === 0 ? (
                <p className="text-muted">No appointments scheduled for today.</p>
              ) : (
                upcomingSchedule.map((item, idx) => (
                  <div key={idx} className="schedule-item">
                    <Row className="align-items-center">
                      <Col xs={2}><div className="schedule-time"><strong>{item.time}</strong></div></Col>
                      <Col xs={6}>
                        <div className="d-flex align-items-center">
                          <div className="schedule-dot bg-primary me-3"></div>
                          <div>
                            <h6 className="mb-1">{item.service}</h6>
                            <p className="text-muted small mb-0">{item.customer} • {item.address}</p>
                          </div>
                        </div>
                      </Col>
                      <Col xs={4} className="text-end">
                        <Button size="sm" variant="outline-primary" className="me-2 rounded-pill" onClick={() => handleStart(item)}>Start</Button>
                        <Button size="sm" variant="outline-secondary" className="rounded-pill" onClick={() => handleRescheduleClick(item)}>Reschedule</Button>
                      </Col>
                    </Row>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaCalendarCheck className="text-primary me-2" />Recent Bookings</h5>
                <Link to="/provider/bookings" className="text-primary text-decoration-none small">View All <FaArrowRight size={12} /></Link>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="bg-light">
                    <tr><th>Customer</th><th>Service</th><th>Date & Time</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {recentBookings.map(booking => (
                      <tr key={booking.id}>
                        <td><div className="d-flex align-items-center"><img src={booking.customerAvatar || `https://ui-avatars.com/api/?name=${booking.customer}&background=667eea&color=fff&size=32`} alt={booking.customer} className="rounded-circle me-2" style={{ width: 32, height: 32 }} /><span>{booking.customer}</span></div></td>
                        <td>{booking.service}</td>
                        <td><div>{booking.date}</div><small className="text-muted">{booking.time}</small></td>
                        <td>{formatCurrency(booking.amount)}</td>
                        <td>{getStatusBadge(booking.status)}</td>
                        <td>
                          <Button size="sm" variant="link" className="text-primary me-2" as={Link} to={`/provider/bookings/${booking.id}`}><FaEye /></Button>
                          {booking.status === 'pending' && (
                            <>
                              <Button size="sm" variant="link" className="text-success me-2" onClick={() => handleStart(booking)}><FaCheckCircle /></Button>
                              <Button size="sm" variant="link" className="text-danger" onClick={() => handleRescheduleClick(booking)}><FaExclamationCircle /></Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4 performance-card">
            <Card.Body>
              <h5 className="mb-3">Performance Metrics</h5>
              <div className="performance-metrics">
                <div className="metric-item mb-3"><div className="d-flex justify-content-between mb-1"><span>Response Rate</span><span className="fw-bold">{stats.responseRate}%</span></div><ProgressBar now={stats.responseRate} variant="success" style={{ height: '6px' }} /></div>
                <div className="metric-item mb-3"><div className="d-flex justify-content-between mb-1"><span>Average Response Time</span><span className="fw-bold">{stats.responseTime}</span></div></div>
                <div className="metric-item"><div className="d-flex justify-content-between mb-1"><span>Completion Rate</span><span className="fw-bold">{stats.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%</span></div><ProgressBar now={stats.totalBookings ? (stats.completedBookings / stats.totalBookings) * 100 : 0} variant="info" style={{ height: '6px' }} /></div>
              </div>
              <hr className="my-4" />
              <h5 className="mb-3">Quick Actions</h5>
              <div className="quick-actions-grid">
                <Button as={Link} to="/provider/create-service" variant="outline-success" className="w-100 mb-2 py-2"><FaPlus className="me-2" /> Add New Service</Button>
                <Button as={Link} to="/provider/schedule" variant="outline-primary" className="w-100 mb-2 py-2"><FaRegClock className="me-2" /> Update Availability</Button>
                <Button as={Link} to="/provider/earnings" variant="outline-warning" className="w-100 py-2"><FaDollarSign className="me-2" /> Withdraw Earnings</Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center"><h5 className="mb-0">Top Services</h5><Link to="/provider/my-services" className="text-primary text-decoration-none small">Manage</Link></div>
            </Card.Header>
            <Card.Body>
              {services.slice(0, 3).map(service => (
                <div key={service.id} className="service-item mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2"><div><h6 className="mb-1">{service.title}</h6><small className="text-muted">{service.category}</small></div><Badge bg={service.status === 'active' ? 'success' : 'warning'}>{service.status}</Badge></div>
                  <div className="d-flex justify-content-between align-items-center"><div><span className="fw-bold text-primary">{formatCurrency(service.price)}</span><span className="text-muted mx-2">•</span><span><FaStar className="text-warning me-1" size={12} /> {service.rating}</span><span className="text-muted ms-2">({service.bookings} bookings)</span></div><div><Button size="sm" variant="link" className="text-primary me-1" as={Link} to={`/provider/edit-service/${service.id}`}><FaEdit /></Button><Button size="sm" variant="link" className="text-danger" onClick={() => {}}><FaTrash /></Button></div></div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Reschedule Booking</Modal.Title></Modal.Header>
        <Modal.Body><Form.Group><Form.Label>New Date & Time</Form.Label><Form.Control type="datetime-local" value={newDateTime} onChange={(e) => setNewDateTime(e.target.value)} /></Form.Group></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</Button><Button variant="primary" onClick={handleRescheduleConfirm}>Confirm</Button></Modal.Footer>
      </Modal>

      <style jsx="true">{`
        /* All your original styles go here (unchanged) */
        .provider-dashboard { padding-bottom: 40px; }
        .welcome-card { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; border-radius: 20px; color: white; }
        .welcome-title { font-size: 2rem; font-weight: 700; margin-bottom: 10px; }
        .welcome-subtitle { font-size: 1rem; opacity: 0.9; margin-bottom: 0; }
        .stat-card { border-radius: 15px; transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
        .stat-icon-wrapper { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-value { font-size: 1.8rem; font-weight: 700; margin: 0; line-height: 1.2; }
        .stat-label { color: #718096; font-size: 0.9rem; }
        .stat-trend { padding: 3px 8px; border-radius: 20px; font-size: 0.8rem; }
        .stat-trend.up { background: rgba(72,187,120,0.1); color: #48bb78; }
        .schedule-item { padding: 15px 0; border-bottom: 1px solid #e2e8f0; }
        .schedule-item:last-child { border-bottom: none; }
        .schedule-dot { width: 10px; height: 10px; border-radius: 50%; }
        .performance-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .performance-card .progress { background-color: rgba(255,255,255,0.2); }
        .service-item { padding: 12px; border-radius: 10px; transition: all 0.3s ease; }
        .service-item:hover { background: #f7fafc; }
        @media (max-width: 768px) {
          .welcome-title { font-size: 1.5rem; }
          .stat-value { font-size: 1.5rem; }
        }
      `}</style>
    </Container>
  );
};

export default ProviderDashboard;