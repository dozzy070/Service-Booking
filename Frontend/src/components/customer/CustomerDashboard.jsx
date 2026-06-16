// src/pages/dashboard/CustomerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ProgressBar,
  Badge,
  Spinner,
  Alert,
  Image,
  Carousel
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
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
  FaChartLine,
  FaWallet,
  FaGift,
  FaTrophy,
  FaMedal,
  FaAward,
  FaRocket,
  FaShieldAlt,
  FaHeadset,
  FaRegClock,
  FaThumbsUp,
  FaPercentage,
  FaFire,
  FaCrown
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import toast from 'react-hot-toast';

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
    nextReward: 0,
    savings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [trendingServices, setTrendingServices] = useState([]);

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

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, bookingsRes, recommendationsRes, remindersRes, featuredRes, trendingRes] = await Promise.all([
        customerAPI.getDashboardStats(),
        customerAPI.getRecentBookings(),
        customerAPI.getRecommendedServices(),
        customerAPI.getReminders(),
        customerAPI.getFeaturedServices(),
        customerAPI.getTrendingServices()
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setRecommendedServices(recommendationsRes.data);
      setUpcomingReminders(remindersRes.data);
      setFeaturedServices(featuredRes.data);
      setTrendingServices(trendingRes.data);
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
    const badges = {
      pending: { bg: 'warning', text: 'warning', label: 'Pending', icon: FaClock },
      confirmed: { bg: 'info', text: 'info', label: 'Confirmed', icon: FaCheckCircle },
      in_progress: { bg: 'primary', text: 'primary', label: 'In Progress', icon: FaRegClock },
      completed: { bg: 'success', text: 'success', label: 'Completed', icon: FaCheckCircle },
      cancelled: { bg: 'danger', text: 'danger', label: 'Cancelled', icon: FaExclamationCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <Badge bg={badge.bg} className={`d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill`}>
        <Icon size={10} />
        <span className="ms-1">{badge.label}</span>
      </Badge>
    );
  };

  // Get date badge
  const getDateBadge = (date) => {
    const bookingDate = new Date(date);
    if (isToday(bookingDate)) {
      return <Badge bg="success" className="rounded-pill">Today</Badge>;
    } else if (isTomorrow(bookingDate)) {
      return <Badge bg="info" className="rounded-pill">Tomorrow</Badge>;
    }
    return null;
  };

  // Get membership tier
  const getMembershipTier = () => {
    if (stats.totalSpent >= 500000) return { name: 'Platinum', icon: FaCrown, color: 'purple' };
    if (stats.totalSpent >= 200000) return { name: 'Gold', icon: FaTrophy, color: 'gold' };
    if (stats.totalSpent >= 50000) return { name: 'Silver', icon: FaMedal, color: 'silver' };
    return { name: 'Bronze', icon: FaAward, color: 'bronze' };
  };

  const tier = getMembershipTier();
  const TierIcon = tier.icon;

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
                  <h1 className="welcome-title">
                    {greeting}, {user?.name?.split(' ')[0] || 'Customer'}! 👋
                  </h1>
                  <p className="welcome-subtitle">
                    Welcome back to your dashboard. Here's what's happening with your services today.
                  </p>
                  <div className="d-flex gap-3 mt-3">
                    <div className="welcome-stat">
                      <FaStar />
                      <span>{stats.completedBookings} Services Completed</span>
                    </div>
                    <div className="welcome-stat">
                      <FaFire />
                      <span>{stats.loyaltyPoints} Points</span>
                    </div>
                  </div>
                </Col>
                <Col lg={5} className="text-lg-end mt-3 mt-lg-0">
                  <Button
                    as={Link}
                    to="/services"
                    variant="light"
                    className="explore-btn px-4 py-2 rounded-pill"
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
                  <div className="stat-icon-wrapper bg-danger bg-opacity-10">
                    <FaHeart className="text-danger" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="stat-value">{stats.favorites}</h3>
                    <p className="stat-label mb-0">Favorites</p>
                  </div>
                </div>
                <div className="stat-details mt-3">
                  <Link to="/customer/favorites" className="text-decoration-none small">
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
                  <Link to="/customer/reviews" className="text-decoration-none small">
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
                  <div className="stat-icon-wrapper bg-success bg-opacity-10">
                    <FaWallet className="text-success" size={24} />
                  </div>
                  <div className="ms-3 flex-grow-1">
                    <h3 className="stat-value">{formatCompactNaira(stats.totalSpent)}</h3>
                    <p className="stat-label mb-0">Total Spent</p>
                  </div>
                </div>
                <div className="stat-details mt-3">
                  <small className="text-muted d-flex align-items-center gap-1">
                    <FaPercentage className="text-success" size={10} />
                    Saved {formatCompactNaira(stats.savings)} with promotions
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Membership Card */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm membership-card">
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={6}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="tier-icon">
                        <TierIcon size={40} />
                      </div>
                      <div>
                        <h5 className="mb-1">{tier.name} Member</h5>
                        <p className="text-muted mb-0">
                          {stats.loyaltyPoints} points • {formatCompactNaira(stats.totalSpent)} spent
                        </p>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="text-md-end">
                      <div className="d-flex align-items-center justify-content-md-end gap-3">
                        <div>
                          <small className="text-muted d-block">Next Reward</small>
                          <span className="fw-bold">{stats.nextReward} points needed</span>
                        </div>
                        <Button variant="outline-primary" size="sm" className="rounded-pill">
                          <FaGift className="me-1" size={12} />
                          View Rewards
                        </Button>
                      </div>
                      <ProgressBar
                        now={(stats.loyaltyPoints / (stats.loyaltyPoints + stats.nextReward)) * 100}
                        variant="warning"
                        className="mt-2"
                        style={{ height: '6px', borderRadius: '3px' }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content Grid */}
        <Row className="g-4">
          {/* Upcoming Bookings */}
          <Col lg={7}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaClock className="text-primary me-2" />
                    Upcoming Bookings
                  </h5>
                  <Link to="/customer/bookings" className="text-primary text-decoration-none small">
                    View All <FaArrowRight size={12} />
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
                {recentBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length > 0 ? (
                  recentBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').map(booking => (
                    <div key={booking.id} className="booking-item">
                      <Row className="align-items-center">
                        <Col xs={12} md={5}>
                          <div className="d-flex align-items-center gap-3">
                            <div className="provider-avatar">
                              {booking.provider_name?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <div>
                              <h6 className="mb-1">{booking.service_name}</h6>
                              <p className="text-muted small mb-0">
                                <FaUserTie className="me-1" size={10} />
                                {booking.provider_name}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col xs={6} md={3}>
                          <div className="booking-datetime">
                            <div className="fw-semibold">{format(new Date(booking.date), 'MMM dd')}</div>
                            <small className="text-muted">{booking.time}</small>
                            {getDateBadge(booking.date)}
                          </div>
                        </Col>
                        <Col xs={6} md={2}>
                          <div className="text-primary fw-bold">
                            {formatCompactNaira(booking.amount)}
                          </div>
                        </Col>
                        <Col xs={12} md={2}>
                          <div className="d-flex gap-2 justify-content-md-end mt-2 mt-md-0">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="rounded-pill"
                              as={Link}
                              to={`/customer/bookings/${booking.id}`}
                            >
                              View
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <FaCalendarCheck size={48} className="text-muted mb-3 opacity-50" />
                    <h6 className="text-muted">No upcoming bookings</h6>
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
                {recentBookings.slice(0, 4).map((booking, index) => (
                  <div key={booking.id} className={`activity-item ${index < recentBookings.length - 1 ? 'border-bottom' : ''}`}>
                    <Row className="align-items-center py-3">
                      <Col xs={8}>
                        <div className="d-flex align-items-center gap-3">
                          <div className={`activity-icon ${booking.status === 'completed' ? 'completed' : booking.status === 'cancelled' ? 'cancelled' : 'pending'}`}>
                            {booking.status === 'completed' ? <FaCheckCircle /> :
                              booking.status === 'cancelled' ? <FaExclamationCircle /> :
                                <FaClock />}
                          </div>
                          <div>
                            <p className="mb-1 fw-semibold">{booking.service_name}</p>
                            <small className="text-muted">
                              {formatDistanceToNow(new Date(booking.date), { addSuffix: true })} • {formatCompactNaira(booking.amount)}
                            </small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={4} className="text-end">
                        {getStatusBadge(booking.status)}
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Sidebar */}
          <Col lg={5}>
            {/* Quick Actions */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button as={Link} to="/services" variant="primary" className="d-flex align-items-center justify-content-between py-2">
                    <span><FaRocket className="me-2" /> Book a Service</span>
                    <FaArrowRight size={14} />
                  </Button>
                  <Button as={Link} to="/customer/wallet" variant="outline-success" className="d-flex align-items-center justify-content-between py-2">
                    <span><FaWallet className="me-2" /> Add Funds to Wallet</span>
                    <FaArrowRight size={14} />
                  </Button>
                  <Button as={Link} to="/customer/support" variant="outline-info" className="d-flex align-items-center justify-content-between py-2">
                    <span><FaHeadset className="me-2" /> Contact Support</span>
                    <FaArrowRight size={14} />
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Featured Services Carousel */}
            {featuredServices.length > 0 && (
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-0 pt-4">
                  <h5 className="mb-0">Featured Services</h5>
                </Card.Header>
                <Card.Body>
                  <Carousel indicators={false} interval={5000}>
                    {featuredServices.map(service => (
                      <Carousel.Item key={service.id}>
                        <div className="text-center">
                          <img
                            src={service.image || 'https://via.placeholder.com/400x200'}
                            alt={service.title}
                            style={{ height: '150px', objectFit: 'cover', borderRadius: '12px', width: '100%' }}
                          />
                          <h6 className="mt-2 mb-1">{service.title}</h6>
                          <p className="text-muted small">{service.provider_name}</p>
                          <div className="d-flex justify-content-center gap-2">
                            <Badge bg="warning" text="dark">
                              <FaStar className="me-1" size={10} />
                              {service.rating}
                            </Badge>
                            <span className="fw-bold text-primary">{formatCompactNaira(service.price)}</span>
                          </div>
                          <Button
                            as={Link}
                            to={`/services/${service.id}`}
                            size="sm"
                            variant="outline-primary"
                            className="mt-2 rounded-pill"
                          >
                            View Details
                          </Button>
                        </div>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </Card.Body>
              </Card>
            )}

            {/* Recommended Services */}
            {recommendedServices.length > 0 && (
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
                  {recommendedServices.slice(0, 2).map(service => (
                    <div key={service.id} className="recommended-item mb-3">
                      <Row className="align-items-center">
                        <Col xs={4}>
                          <img
                            src={service.image || 'https://via.placeholder.com/400'}
                            alt={service.title}
                            className="img-fluid rounded-3"
                            style={{ height: '70px', width: '100%', objectFit: 'cover' }}
                          />
                        </Col>
                        <Col xs={8}>
                          <h6 className="mb-1">{service.title}</h6>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <FaStar className="text-warning" size={12} />
                            <small className="text-muted">{service.rating} ({service.reviews} reviews)</small>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-primary">{formatCompactNaira(service.price)}</span>
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
            )}

            {/* Reminders */}
            {upcomingReminders.length > 0 && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4">
                  <div className="d-flex align-items-center gap-2">
                    <FaBell className="text-warning" />
                    <h5 className="mb-0">Reminders</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  {upcomingReminders.slice(0, 3).map(reminder => (
                    <div key={reminder.id} className="reminder-item d-flex align-items-start gap-3 mb-3">
                      <div className="reminder-dot"></div>
                      <div>
                        <p className="mb-1">{reminder.message}</p>
                        <small className="text-muted">
                          {formatDistanceToNow(new Date(reminder.date), { addSuffix: true })}
                        </small>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      <style jsx="true">{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }

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

        .welcome-stat {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
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

        .booking-item {
          padding: 15px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .booking-item:last-child {
          border-bottom: none;
        }

        .provider-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-icon.completed {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .activity-icon.cancelled {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .activity-icon.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .membership-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 20px;
        }

        .tier-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f59e0b;
        }

        .recommended-item {
          transition: all 0.3s ease;
          padding: 10px;
          border-radius: 12px;
        }

        .recommended-item:hover {
          background: #f8fafc;
          transform: translateX(5px);
        }

        .reminder-item {
          padding: 12px;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .reminder-item:hover {
          background: #f8fafc;
        }

        .reminder-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          margin-top: 6px;
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
    </div>
  );
};

export default CustomerDashboard;