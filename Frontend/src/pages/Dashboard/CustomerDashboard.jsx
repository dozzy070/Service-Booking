// src/pages/dashboard/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ProgressBar, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaCalendarCheck,
  FaHeart,
  FaStar,
  FaComment,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
  FaUserTie,
  FaMapMarkerAlt,
  FaCreditCard,
  FaBell,
  FaChartLine
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const CustomerDashboard = () => {
  const { user, token } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    favorites: 0,
    reviews: 0,
    totalSpent: 0,
    loyaltyPoints: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, bookingsRes, recommendationsRes, remindersRes] = await Promise.all([
        api.get('/customer/dashboard/stats'),
        api.get('/customer/bookings/recent?limit=4'),
        api.get('/services/recommended?limit=3'),
        api.get('/customer/reminders')
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setRecommendedServices(recommendationsRes.data);
      setUpcomingReminders(remindersRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Optionally show a toast or error message
    }
  };

  const formatCurrency = (amount) => `$${amount?.toLocaleString() || 0}`;

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { bg: 'warning', text: 'warning', label: 'Upcoming' },
      completed: { bg: 'success', text: 'success', label: 'Completed' },
      cancelled: { bg: 'danger', text: 'danger', label: 'Cancelled' },
      in_progress: { bg: 'info', text: 'info', label: 'In Progress' }
    };
    const badge = badges[status] || badges.upcoming;
    return (
      <Badge bg={badge.bg} className={`bg-${badge.bg} bg-opacity-10 text-${badge.text} px-3 py-2 rounded-pill`}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <Container fluid className="customer-dashboard">
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <div className="welcome-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="welcome-title">
                  {greeting}, {user?.name || 'Customer'}! 👋
                </h1>
                <p className="welcome-subtitle">
                  Welcome back to your dashboard. Here's what's happening with your services today.
                </p>
              </Col>
              <Col md={4} className="text-md-end">
                <Button 
                  as={Link} 
                  to="/services" 
                  variant="primary" 
                  className="px-4 py-2 rounded-pill explore-btn"
                >
                  Explore Services <FaArrowRight className="ms-2" />
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
                <div className="stat-icon-wrapper bg-primary bg-opacity-10">
                  <FaCalendarCheck className="text-primary" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="stat-value">{stats.totalBookings}</h3>
                  <p className="stat-label mb-0">Total Bookings</p>
                </div>
                <div className="stat-trend up">
                  <small>+12%</small>
                </div>
              </div>
              <div className="stat-details mt-3">
                <div className="d-flex justify-content-between">
                  <span><FaClock className="text-warning me-1" size={12} /> Upcoming: {stats.upcomingBookings}</span>
                  <span><FaCheckCircle className="text-success me-1" size={12} /> Completed: {stats.completedBookings}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} md={6}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon-wrapper bg-success bg-opacity-10">
                  <FaHeart className="text-success" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="stat-value">{stats.favorites}</h3>
                  <p className="stat-label mb-0">Favorites</p>
                </div>
              </div>
              <div className="stat-details mt-3">
                <Link to="/favorites" className="text-decoration-none small">
                  View all favorites <FaArrowRight size={10} />
                </Link>
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
                  <h3 className="stat-value">{stats.reviews}</h3>
                  <p className="stat-label mb-0">Reviews Written</p>
                </div>
              </div>
              <div className="stat-details mt-3">
                <Link to="/reviews" className="text-decoration-none small">
                  Write a review <FaArrowRight size={10} />
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6} md={6}>
          <Card className="stat-card border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="stat-icon-wrapper bg-info bg-opacity-10">
                  <FaCreditCard className="text-info" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="stat-value">{formatCurrency(stats.totalSpent)}</h3>
                  <p className="stat-label mb-0">Total Spent</p>
                </div>
                <div className="stat-trend up">
                  <small>+8%</small>
                </div>
              </div>
              <div className="stat-details mt-3">
                <small className="text-muted">
                  <FaStar className="text-warning me-1" /> {stats.loyaltyPoints} loyalty points
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content Grid */}
      <Row className="g-4">
        {/* Upcoming Bookings */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaClock className="text-primary me-2" />
                  Upcoming Bookings
                </h5>
                <Link to="/bookings" className="text-primary text-decoration-none small">
                  View All <FaArrowRight size={12} />
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {recentBookings.filter(b => b.status === 'upcoming').length > 0 ? (
                recentBookings.filter(b => b.status === 'upcoming').map(booking => (
                  <div key={booking.id} className="booking-item">
                    <Row className="align-items-center">
                      <Col xs={12} md={6}>
                        <div className="d-flex align-items-center">
                          <img 
                            src={booking.providerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider)}&background=667eea&color=fff&size=50`}
                            alt={booking.provider}
                            className="rounded-circle me-3"
                            style={{ width: 50, height: 50, objectFit: 'cover' }}
                          />
                          <div>
                            <h6 className="mb-1">{booking.service}</h6>
                            <p className="text-muted small mb-0">
                              <FaUserTie className="me-1" /> {booking.provider}
                            </p>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="booking-datetime">
                          <small className="text-muted d-block">{booking.date}</small>
                          <small className="text-muted">{booking.time}</small>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="text-md-end">
                          {getStatusBadge(booking.status)}
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              className="me-2 rounded-pill"
                              as={Link}
                              to={`/bookings/${booking.id}`}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              className="rounded-pill"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FaCalendarCheck size={48} className="text-muted mb-3" />
                  <h6>No upcoming bookings</h6>
                  <p className="text-muted small">Book a service to get started</p>
                  <Button as={Link} to="/services" variant="primary" size="sm" className="rounded-pill">
                    Browse Services
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaChartLine className="text-primary me-2" />
                  Recent Activity
                </h5>
              </div>
            </Card.Header>
            <Card.Body>
              {recentBookings.slice(0, 3).map((booking, index) => (
                <div key={booking.id} className={`activity-item ${index < recentBookings.length - 1 ? 'border-bottom' : ''}`}>
                  <Row className="align-items-center py-3">
                    <Col xs={8}>
                      <div className="d-flex align-items-center">
                        <div className={`activity-icon bg-${booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'} bg-opacity-10 rounded-circle p-2 me-3`}>
                          {booking.status === 'completed' ? <FaCheckCircle className="text-success" /> :
                           booking.status === 'cancelled' ? <FaExclamationCircle className="text-danger" /> :
                           <FaClock className="text-warning" />}
                        </div>
                        <div>
                          <p className="mb-1 fw-semibold">{booking.service}</p>
                          <small className="text-muted">{booking.date} • {formatCurrency(booking.amount)}</small>
                        </div>
                      </div>
                    </Col>
                    <Col xs={4} className="text-end">
                      <span className={`badge bg-${booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'} bg-opacity-10 text-${booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'} px-3 py-2 rounded-pill`}>
                        {booking.status}
                      </span>
                    </Col>
                  </Row>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col lg={4}>
          {/* Loyalty Card */}
          <Card className="border-0 shadow-sm mb-4 loyalty-card">
            <Card.Body className="text-center text-white">
              <h5 className="mb-3">Loyalty Points</h5>
              <h2 className="display-4 fw-bold mb-2">{stats.loyaltyPoints}</h2>
              <p className="mb-4">You're {1500 - stats.loyaltyPoints} points away from your next reward!</p>
              <ProgressBar 
                now={(stats.loyaltyPoints / 1500) * 100} 
                variant="warning" 
                className="mb-3"
                style={{ height: '8px' }}
              />
              <Button variant="light" size="sm" className="rounded-pill px-4">
                View Rewards
              </Button>
            </Card.Body>
          </Card>

          {/* Recommended Services */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recommended for You</h5>
                <Link to="/services" className="text-primary text-decoration-none small">
                  View All
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {recommendedServices.map(service => (
                <div key={service.id} className="recommended-item mb-3">
                  <Row className="align-items-center">
                    <Col xs={4}>
                      <img 
                        src={service.image || 'https://via.placeholder.com/400'} 
                        alt={service.title}
                        className="img-fluid rounded-3"
                        style={{ height: '70px', objectFit: 'cover' }}
                      />
                    </Col>
                    <Col xs={8}>
                      <h6 className="mb-1">{service.title}</h6>
                      <p className="text-muted small mb-1">{service.provider}</p>
                      <div className="d-flex align-items-center">
                        <FaStar className="text-warning me-1" size={12} />
                        <small className="text-muted me-2">{service.rating}</small>
                        <small className="text-muted">({service.reviews} reviews)</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="fw-bold text-primary">{formatCurrency(service.price)}</span>
                        <Button 
                          as={Link} 
                          to={`/services/${service.id}`}
                          size="sm" 
                          variant="outline-primary" 
                          className="rounded-pill"
                        >
                          Book
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Quick Reminders */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex align-items-center">
                <FaBell className="text-warning me-2" />
                <h5 className="mb-0">Reminders</h5>
              </div>
            </Card.Header>
            <Card.Body>
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="reminder-item d-flex align-items-start mb-3">
                  <div className="reminder-dot bg-warning mt-2 me-3"></div>
                  <div>
                    <p className="mb-1">{reminder.text}</p>
                    <small className="text-muted">{reminder.time}</small>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Styles remain unchanged */}
      <style jsx="true">{`
        .customer-dashboard {
          padding-bottom: 40px;
        }

        .welcome-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          border-radius: 20px;
          color: white;
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

        .explore-btn {
          background: white;
          color: #667eea;
          border: none;
          font-weight: 600;
        }

        .explore-btn:hover {
          background: rgba(255, 255, 255, 0.9);
          color: #764ba2;
          transform: translateY(-2px);
        }

        .stat-card {
          border-radius: 15px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        }

        .stat-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          line-height: 1.2;
        }

        .stat-label {
          color: #718096;
          font-size: 0.9rem;
        }

        .stat-trend {
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.8rem;
        }

        .stat-trend.up {
          background: rgba(72, 187, 120, 0.1);
          color: #48bb78;
        }

        .stat-trend.down {
          background: rgba(245, 101, 101, 0.1);
          color: #f56565;
        }

        .booking-item {
          padding: 15px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .booking-item:last-child {
          border-bottom: none;
        }

        .activity-item:last-child {
          border-bottom: none !important;
        }

        .loyalty-card {
          background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
          border-radius: 15px;
        }

        .recommended-item {
          transition: all 0.3s ease;
        }

        .recommended-item:hover {
          transform: translateX(5px);
        }

        .reminder-item {
          position: relative;
        }

        .reminder-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .welcome-title {
            font-size: 1.5rem;
          }
          
          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </Container>
  );
};

export default CustomerDashboard;