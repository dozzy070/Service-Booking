// src/pages/customer/Bookings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  Nav,
  Spinner,
  Alert,
  Modal,
  Pagination,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaEye,
  FaStar,
  FaComment,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaDownload,
  FaPrint,
  FaShare,
  FaEllipsisV,
  FaWallet,
  FaCreditCard,
  FaInfoCircle,
  FaArrowRight,
  FaRegClock,
  FaUndo,
  FaUserTie,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { getAvatarUrl, getServiceImage, handleImageError } from '../../utils/imageUtils';
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from 'date-fns';
import BookingStatus from '../../components/common/BookingStatus';

const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRange, setDateRange] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  const itemsPerPage = 10;

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

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchTerm || undefined,
        sort: sortBy,
        date_range: dateRange !== 'all' ? dateRange : undefined
      };
      
      const response = await api.get('/bookings', { params });
      setBookings(response.data.bookings || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
      toast.error('Could not load your bookings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchTerm, sortBy, dateRange]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
    toast.success('Bookings updated');
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    setProcessing(true);
    try {
      await api.put(`/bookings/${selectedBooking.id}/cancel`, { reason: cancelReason });
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setProcessing(false);
    }
  };

  // Reschedule booking
  const handleReschedule = (bookingId) => {
    navigate(`/reschedule/${bookingId}`);
  };

  // Write review
  const handleWriteReview = (bookingId) => {
    navigate(`/write-review/${bookingId}`);
  };

  // Get status badge component
  const getStatusBadge = (status) => {
    return <BookingStatus status={status} size="sm" />;
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

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalAmount: bookings.reduce((sum, b) => sum + (b.amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="d-flex align-items-center gap-3" style={{ borderRadius: '16px' }}>
          <FaExclamationCircle size={24} />
          <div>
            <h6 className="mb-1">Error loading bookings</h6>
            <p className="mb-0">{error}</p>
          </div>
          <Button variant="outline-danger" onClick={refreshData} className="ms-auto">
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">My Bookings</h2>
            <p className="text-muted mb-0">Manage and track all your service bookings</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaClock className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => {/* Export logic */}}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload />
              Export
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Alert variant="warning" className="mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2">
              <FaExclamationCircle />
              <span>Real-time connection lost. Updates will appear when you reconnect.</span>
            </div>
          </Alert>
        )}

        {/* Stats Cards */}
        <Row className="mb-4 g-4">
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#3b82f620' }}>
                    <FaCalendarAlt size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total</p>
                    <h4 className="fw-bold mb-0">{stats.total}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#f59e0b20' }}>
                    <FaClock size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Pending</p>
                    <h4 className="fw-bold mb-0">{stats.pending}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#3b82f620' }}>
                    <FaCheckCircle size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Confirmed</p>
                    <h4 className="fw-bold mb-0">{stats.confirmed}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <FaCheckCircle size={20} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Completed</p>
                    <h4 className="fw-bold mb-0">{stats.completed}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#ef444420' }}>
                    <FaTimesCircle size={20} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Cancelled</p>
                    <h4 className="fw-bold mb-0">{stats.cancelled}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <FaWallet size={20} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Spent</p>
                    <h4 className="fw-bold mb-0">{formatCompactNaira(stats.totalAmount)}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Row className="g-3">
              <Col lg={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch size={14} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by service or provider..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={3}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaFilter size={14} />
                  </InputGroup.Text>
                  <Form.Select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                  >
                    <option value="all">All Bookings</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col lg={3}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSortAmountDown size={14} />
                  </InputGroup.Text>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="amount_desc">Highest Amount</option>
                    <option value="amount_asc">Lowest Amount</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col lg={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaCalendarAlt size={14} />
                  </InputGroup.Text>
                  <Form.Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Bookings Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {bookings.length === 0 ? (
              <div className="text-center py-5">
                <FaCalendarAlt size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No bookings found</h6>
                <p className="text-muted small mb-3">
                  {searchTerm ? 'Try adjusting your search or filters' : 'Book a service to get started'}
                </p>
                {!searchTerm && (
                  <Button as={Link} to="/services" variant="primary" size="sm" className="rounded-pill">
                    Browse Services
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px' }}>Provider</th>
                        <th style={{ padding: '16px' }}>Date & Time</th>
                        <th style={{ padding: '16px' }}>Amount</th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={booking.service_image || getServiceImage(booking.service_title, booking.id, 60, 60)}
                                alt={booking.service_title}
                                style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                                onError={(e) => handleImageError(e, getServiceImage(booking.service_title, booking.id, 60, 60))}
                              />
                              <div>
                                <div className="fw-semibold">{booking.service_title}</div>
                                <small className="text-muted">
                                  <FaUserTie className="me-1" size={10} />
                                  {booking.provider_name}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={booking.provider_avatar || getAvatarUrl(booking.provider_name, 40)}
                                alt={booking.provider_name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => handleImageError(e, getAvatarUrl(booking.provider_name, 40))}
                              />
                              <div>
                                <div className="fw-semibold small">{booking.provider_name}</div>
                                {booking.provider_phone && (
                                  <small className="text-muted d-block">
                                    <FaPhone size={10} className="me-1" />
                                    {booking.provider_phone}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">{format(new Date(booking.date), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{booking.time}</small>
                            <div className="mt-1">{getDateBadge(booking.date)}</div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className="fw-bold text-primary">{formatNaira(booking.amount)}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {getStatusBadge(booking.status)}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-2">
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>View Details</Tooltip>}
                              >
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowDetailsModal(true);
                                  }}
                                >
                                  <FaEye size={12} />
                                </Button>
                              </OverlayTrigger>
                              
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>Message Provider</Tooltip>}
                              >
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  as={Link}
                                  to={`/customer/chat?booking=${booking.id}`}
                                >
                                  <FaComment size={12} />
                                </Button>
                              </OverlayTrigger>

                              {booking.status === 'pending' && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Cancel Booking</Tooltip>}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowCancelModal(true);
                                    }}
                                  >
                                    <FaTimesCircle size={12} />
                                  </Button>
                                </OverlayTrigger>
                              )}

                              {booking.status === 'pending' && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Reschedule</Tooltip>}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline-warning"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => handleReschedule(booking.id)}
                                  >
                                    <FaUndo size={12} />
                                  </Button>
                                </OverlayTrigger>
                              )}

                              {booking.status === 'completed' && !booking.has_review && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Write Review</Tooltip>}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => handleWriteReview(booking.id)}
                                  >
                                    <FaStar size={12} />
                                  </Button>
                                </OverlayTrigger>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center p-4 border-top">
                    <Pagination>
                      <Pagination.Prev
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      />
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Booking Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedBooking && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h5 className="mb-1">{selectedBooking.service_title}</h5>
                  <p className="text-muted small mb-0">Booking #{selectedBooking.id}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Service Details</h6>
                    <div className="info-item">
                      <FaUserTie className="text-muted" />
                      <span>{selectedBooking.provider_name}</span>
                    </div>
                    <div className="info-item">
                      <FaCalendarAlt className="text-muted" />
                      <span>{format(new Date(selectedBooking.date), 'EEEE, MMMM dd, yyyy')}</span>
                    </div>
                    <div className="info-item">
                      <FaClock className="text-muted" />
                      <span>{selectedBooking.time}</span>
                    </div>
                    <div className="info-item">
                      <FaWallet className="text-muted" />
                      <span className="fw-bold text-primary">{formatNaira(selectedBooking.amount)}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Location</h6>
                    <div className="info-item">
                      <FaMapMarkerAlt className="text-muted" />
                      <span>{selectedBooking.location || 'Not specified'}</span>
                    </div>
                    {selectedBooking.address && (
                      <div className="info-item">
                        <FaInfoCircle className="text-muted" />
                        <span>{selectedBooking.address}</span>
                      </div>
                    )}
                  </div>

                  {selectedBooking.notes && (
                    <div className="info-section mt-3">
                      <h6 className="fw-bold mb-3">Special Instructions</h6>
                      <p className="small mb-0">{selectedBooking.notes}</p>
                    </div>
                  )}
                </Col>
              </Row>

              {selectedBooking.status === 'pending' && (
                <div className="mt-4 d-flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowCancelModal(true);
                    }}
                  >
                    <FaTimesCircle className="me-2" />
                    Cancel Booking
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReschedule(selectedBooking.id);
                    }}
                  >
                    <FaUndo className="me-2" />
                    Reschedule
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedBooking && selectedBooking.status !== 'cancelled' && (
            <Button
              variant="primary"
              as={Link}
              to={`/customer/chat?booking=${selectedBooking.id}`}
            >
              <FaComment className="me-2" />
              Message Provider
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaTimesCircle className="me-2" />
            Cancel Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="warning" className="mb-3" style={{ borderRadius: '12px' }}>
            <FaExclamationCircle className="me-2" />
            Are you sure you want to cancel this booking?
          </Alert>
          <Form.Group>
            <Form.Label className="fw-semibold">Reason (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us why you're cancelling..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowCancelModal(false)}>
            Keep Booking
          </Button>
          <Button variant="danger" onClick={handleCancelBooking} disabled={processing}>
            {processing ? 'Cancelling...' : 'Yes, Cancel Booking'}
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
        .info-section {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default Bookings;