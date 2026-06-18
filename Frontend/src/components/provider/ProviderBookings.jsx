// src/components/provider/ProviderBookings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Form,
  Pagination,
  Modal,
  Alert,
  Spinner,
  Nav
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  MessageCircle,
  Star,
  Calendar as CalendarIcon,
  Home,
  Briefcase,
  FileText,
  Send,
  Printer,
  
  
  ArrowUp,
  ArrowDown
} from 'lucide-react';
// No duplicate imports from react-icons/fa
import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderBookings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilters, setShowFilters] = useState(false);

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

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchTerm || undefined,
        sort: sortBy,
        date: filterDate || undefined
      };
      
      const response = await providerAPI.getBookings(params);
      setBookings(response.data.bookings || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchTerm, sortBy, filterDate]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
    toast.success('Bookings updated');
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Accept booking
  const handleAcceptBooking = async () => {
    if (!selectedBooking) return;
    
    setProcessingAction(true);
    try {
      await providerAPI.updateBookingStatus(selectedBooking.id, 'confirmed');
      toast.success('Booking confirmed successfully');
      setShowAcceptModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error(error.response?.data?.message || 'Failed to accept booking');
    } finally {
      setProcessingAction(false);
    }
  };

  // Decline booking
  const handleDeclineBooking = async () => {
    if (!selectedBooking) return;
    
    setProcessingAction(true);
    try {
      await providerAPI.updateBookingStatus(selectedBooking.id, 'cancelled', declineReason);
      toast.success('Booking declined');
      setShowDeclineModal(false);
      setSelectedBooking(null);
      setDeclineReason('');
      fetchBookings();
    } catch (error) {
      console.error('Error declining booking:', error);
      toast.error(error.response?.data?.message || 'Failed to decline booking');
    } finally {
      setProcessingAction(false);
    }
  };

  // Complete booking
  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed?')) return;
    
    try {
      await providerAPI.completeBooking(bookingId);
      toast.success('Booking marked as completed');
      fetchBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    }
  };

  // Start booking
  const handleStartBooking = async (bookingId) => {
    try {
      await providerAPI.startBooking(bookingId);
      toast.success('Service started');
      fetchBookings();
    } catch (error) {
      console.error('Error starting booking:', error);
      toast.error('Failed to start service');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variants = {
      pending: { bg: 'warning', text: 'Pending', icon: <Clock size={12} />, className: 'bg-warning bg-opacity-10 text-warning' },
      confirmed: { bg: 'success', text: 'Confirmed', icon: <CheckCircle size={12} />, className: 'bg-success bg-opacity-10 text-success' },
      in_progress: { bg: 'info', text: 'In Progress', icon: <AlertCircle size={12} />, className: 'bg-info bg-opacity-10 text-info' },
      completed: { bg: 'success', text: 'Completed', icon: <CheckCircle size={12} />, className: 'bg-success bg-opacity-10 text-success' },
      cancelled: { bg: 'danger', text: 'Cancelled', icon: <XCircle size={12} />, className: 'bg-danger bg-opacity-10 text-danger' }
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={`d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill ${variant.className}`}>
        {variant.icon}
        <span className="ms-1">{variant.text}</span>
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

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalEarnings: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Service Bookings</h2>
            <p className="text-muted mb-0">Manage and track all your service appointments</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => {/* Export logic */}}
              className="d-flex align-items-center gap-2"
            >
              <Download size={18} />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4 g-4">
          <Col xl={2} lg={4} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#3b82f620' }}>
                    <Calendar size={20} color="#3b82f6" />
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
                    <Clock size={20} color="#f59e0b" />
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
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <CheckCircle size={20} color="#10b981" />
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
                  <div className="rounded-circle p-2" style={{ background: '#8b5cf620' }}>
                    <CheckCircle size={20} color="#8b5cf6" />
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
                    <XCircle size={20} color="#ef4444" />
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
                    <DollarSign size={20} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Earnings</p>
                    <h4 className="fw-bold mb-0">{formatCompactNaira(stats.totalEarnings)}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters Bar */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex gap-2 flex-wrap">
                {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className="rounded-pill px-3"
                  >
                    {tab === 'in_progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab !== 'all' && (
                      <Badge bg={activeTab === tab ? 'light' : 'secondary'} className="ms-2 rounded-pill">
                        {tab === 'pending' ? stats.pending : 
                         tab === 'confirmed' ? stats.confirmed :
                         tab === 'completed' ? stats.completed :
                         tab === 'cancelled' ? stats.cancelled : 0}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              <Button
                variant="light"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="d-flex align-items-center gap-2"
              >
                <Filter size={14} />
                Filters
                <ChevronDown size={14} className={showFilters ? 'rotate-180' : ''} />
              </Button>
            </div>

            {showFilters && (
              <Row className="mt-3 pt-3 border-top">
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Search</Form.Label>
                    <div className="position-relative">
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <Form.Control
                        type="text"
                        placeholder="Search by ID, customer, service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '38px', borderRadius: '10px' }}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Date Range</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-muted">Sort By</Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="amount_desc">Highest Amount</option>
                      <option value="amount_asc">Lowest Amount</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Bookings Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {bookings.length === 0 ? (
              <div className="text-center py-5">
                <Calendar size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No bookings found</h6>
                <p className="text-muted small">Bookings will appear here when customers make appointments</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '16px' }}>Booking ID</th>
                      <th style={{ padding: '16px' }}>Customer</th>
                      <th style={{ padding: '16px' }}>Service</th>
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
                          <span className="fw-bold text-primary">#{booking.id.slice(-8)}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                              <User size={14} className="text-primary" />
                            </div>
                            <div>
                              <div className="fw-medium">{booking.customer_name}</div>
                              <small className="text-muted">{booking.customer_phone}</small>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div>{booking.service_name}</div>
                          <small className="text-muted">{booking.duration}</small>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="fw-medium">{format(new Date(booking.date), 'MMM dd, yyyy')}</div>
                          <small className="text-muted">{booking.time}</small>
                          {getDateBadge(booking.date)}
                        </td>
                        <td style={{ padding: '16px' }} className="fw-bold text-primary">
                          {formatNaira(booking.amount)}
                        </td>
                        <td style={{ padding: '16px' }}>{getStatusBadge(booking.status)}</td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="link"
                              className="text-primary p-1"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye size={16} />
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="text-success p-1"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowAcceptModal(true);
                                  }}
                                >
                                  <CheckCircle size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="text-danger p-1"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowDeclineModal(true);
                                  }}
                                >
                                  <XCircle size={16} />
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="link"
                                className="text-info p-1"
                                onClick={() => handleStartBooking(booking.id)}
                              >
                                <Clock size={16} />
                              </Button>
                            )}
                            {booking.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="link"
                                className="text-success p-1"
                                onClick={() => handleCompleteBooking(booking.id)}
                              >
                                <CheckCircle size={16} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="link"
                              className="text-primary p-1"
                              as="a"
                              href={`/provider/chat?booking=${booking.id}`}
                            >
                              <MessageCircle size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

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
                  <h6 className="text-muted mb-1">Booking ID</h6>
                  <h5 className="fw-bold">#{selectedBooking.id}</h5>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Customer Information</h6>
                    <div className="info-item">
                      <User size={16} className="text-muted" />
                      <span>{selectedBooking.customer_name}</span>
                    </div>
                    <div className="info-item">
                      <Phone size={16} className="text-muted" />
                      <span>{selectedBooking.customer_phone}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} className="text-muted" />
                      <span>{selectedBooking.customer_address || 'Not specified'}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Service Details</h6>
                    <div className="info-item">
                      <Briefcase size={16} className="text-muted" />
                      <span>{selectedBooking.service_name}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} className="text-muted" />
                      <span>{selectedBooking.duration}</span>
                    </div>
                    <div className="info-item">
                      <DollarSign size={16} className="text-muted" />
                      <span className="fw-bold text-primary">{formatNaira(selectedBooking.amount)}</span>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Schedule</h6>
                    <div className="info-item">
                      <CalendarIcon size={16} className="text-muted" />
                      <span>{format(new Date(selectedBooking.date), 'EEEE, MMMM dd, yyyy')}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} className="text-muted" />
                      <span>{selectedBooking.time}</span>
                    </div>
                  </div>
                </Col>

                {selectedBooking.notes && (
                  <Col md={12}>
                    <div className="info-section">
                      <h6 className="fw-bold mb-3">Special Instructions</h6>
                      <Alert variant="light" className="mb-0" style={{ borderRadius: '12px' }}>
                        {selectedBooking.notes}
                      </Alert>
                    </div>
                  </Col>
                )}
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedBooking?.status === 'pending' && (
            <>
              <Button
                variant="success"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowAcceptModal(true);
                }}
              >
                Accept Booking
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowDeclineModal(true);
                }}
              >
                Decline Booking
              </Button>
            </>
          )}
          <Button
            variant="primary"
            as="a"
            href={`/provider/chat?booking=${selectedBooking?.id}`}
          >
            <MessageCircle size={16} className="me-2" />
            Message Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Accept Modal */}
      <Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success">
            <CheckCircle size={18} className="me-2" />
            Accept Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="success" className="mb-0" style={{ borderRadius: '12px' }}>
            Are you sure you want to accept this booking?
            <div className="mt-2 small">
              <strong>Customer:</strong> {selectedBooking?.customer_name}<br />
              <strong>Service:</strong> {selectedBooking?.service_name}<br />
              <strong>Date:</strong> {selectedBooking && format(new Date(selectedBooking.date), 'MMM dd, yyyy')}
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowAcceptModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleAcceptBooking}
            disabled={processingAction}
          >
            {processingAction ? 'Accepting...' : 'Yes, Accept Booking'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Decline Modal */}
      <Modal show={showDeclineModal} onHide={() => setShowDeclineModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <XCircle size={18} className="me-2" />
            Decline Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Reason for declining (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Let the customer know why you're declining..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeclineModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeclineBooking}
            disabled={processingAction}
          >
            {processingAction ? 'Declining...' : 'Yes, Decline Booking'}
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
        .rotate-180 {
          transform: rotate(180deg);
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
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default ProviderBookings;