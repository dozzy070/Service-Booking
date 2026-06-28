// src/components/provider/ProviderBookings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [error, setError] = useState(null);
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
  const [totalCount, setTotalCount] = useState(0);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const itemsPerPage = 10;

  // ============================================================
  // ✅ HELPER FUNCTIONS
  // ============================================================

  const formatNaira = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '₦0';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCompactNaira = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '₦0';
    if (num >= 1000000) return `₦${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₦${(num / 1000).toFixed(0)}k`;
    return formatNaira(num);
  };

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // ============================================================
  // FETCH BOOKINGS - REAL API
  // ============================================================

  const fetchBookings = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchTerm || undefined,
        sort: sortBy,
        date: filterDate || undefined
      };

      let response = null;
      
      if (typeof providerAPI.getBookings === 'function') {
        response = await providerAPI.getBookings(params);
      } else if (typeof providerAPI.getProviderBookings === 'function') {
        response = await providerAPI.getProviderBookings(params);
      } else {
        throw new Error('Bookings API methods not available');
      }

      const data = response?.data || response || {};
      const bookingsData = data.bookings || data.data || [];
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTotalCount(data.total || bookingsData.length || 0);
      setTotalPages(Math.ceil((data.total || bookingsData.length || 0) / itemsPerPage));
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Failed to load bookings');
      setBookings([]);
      setTotalCount(0);
      setTotalPages(1);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load bookings');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, activeTab, searchTerm, sortBy, filterDate]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchBookings(false);
    toast.success('Bookings updated');
  };

  // Polling functions for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchBookings(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000); // Poll every 30 seconds
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
    fetchBookings(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchBookings(false);
    }
  }, [currentPage, activeTab, searchTerm, sortBy, filterDate]);

  // ============================================================
  // BOOKING ACTIONS - REAL API
  // ============================================================

  const handleAcceptBooking = async () => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking.id || selectedBooking._id;
    if (!bookingId) return;
    
    setProcessingAction(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      if (typeof providerAPI.updateBookingStatus === 'function') {
        await providerAPI.updateBookingStatus(bookingId, 'confirmed');
      } else if (typeof providerAPI.acceptBooking === 'function') {
        await providerAPI.acceptBooking(bookingId);
      } else {
        throw new Error('Accept booking API methods not available');
      }
      
      toast.success('Booking confirmed successfully');
      setShowAcceptModal(false);
      setSelectedBooking(null);
      await fetchBookings(false);
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to accept booking');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking.id || selectedBooking._id;
    if (!bookingId) return;
    
    setProcessingAction(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = { 
        status: 'cancelled', 
        reason: declineReason || 'Provider declined the booking'
      };

      if (typeof providerAPI.updateBookingStatus === 'function') {
        await providerAPI.updateBookingStatus(bookingId, payload);
      } else if (typeof providerAPI.declineBooking === 'function') {
        await providerAPI.declineBooking(bookingId, declineReason);
      } else {
        throw new Error('Decline booking API methods not available');
      }
      
      toast.success('Booking declined');
      setShowDeclineModal(false);
      setSelectedBooking(null);
      setDeclineReason('');
      await fetchBookings(false);
    } catch (error) {
      console.error('Error declining booking:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to decline booking');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!bookingId) return;
    if (!window.confirm('Mark this booking as completed?')) return;
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      if (typeof providerAPI.completeBooking === 'function') {
        await providerAPI.completeBooking(bookingId);
      } else if (typeof providerAPI.updateBookingStatus === 'function') {
        await providerAPI.updateBookingStatus(bookingId, 'completed');
      } else {
        throw new Error('Complete booking API methods not available');
      }
      
      toast.success('Booking marked as completed');
      await fetchBookings(false);
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error(error.message || 'Failed to complete booking');
    }
  };

  const handleStartBooking = async (bookingId) => {
    if (!bookingId) return;
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      if (typeof providerAPI.startBooking === 'function') {
        await providerAPI.startBooking(bookingId);
      } else if (typeof providerAPI.updateBookingStatus === 'function') {
        await providerAPI.updateBookingStatus(bookingId, 'in_progress');
      } else {
        throw new Error('Start booking API methods not available');
      }
      
      toast.success('Service started');
      await fetchBookings(false);
    } catch (error) {
      console.error('Error starting booking:', error);
      toast.error(error.message || 'Failed to start service');
    }
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill bg-secondary bg-opacity-10 text-secondary">
          <AlertCircle size={12} />
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const variants = {
      pending: { bg: 'warning', text: 'Pending', icon: <Clock size={12} />, className: 'bg-warning bg-opacity-10 text-warning' },
      confirmed: { bg: 'success', text: 'Confirmed', icon: <CheckCircle size={12} />, className: 'bg-success bg-opacity-10 text-success' },
      in_progress: { bg: 'info', text: 'In Progress', icon: <AlertCircle size={12} />, className: 'bg-info bg-opacity-10 text-info' },
      completed: { bg: 'success', text: 'Completed', icon: <CheckCircle size={12} />, className: 'bg-success bg-opacity-10 text-success' },
      cancelled: { bg: 'danger', text: 'Cancelled', icon: <XCircle size={12} />, className: 'bg-danger bg-opacity-10 text-danger' },
      accepted: { bg: 'success', text: 'Accepted', icon: <CheckCircle size={12} />, className: 'bg-success bg-opacity-10 text-success' },
      rejected: { bg: 'danger', text: 'Rejected', icon: <XCircle size={12} />, className: 'bg-danger bg-opacity-10 text-danger' }
    };
    const variant = variants[lowerStatus] || variants.pending;
    return (
      <Badge className={`d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill ${variant.className}`}>
        {variant.icon}
        <span className="ms-1">{variant.text}</span>
      </Badge>
    );
  };

  const getDateBadge = (date) => {
    if (!date) return null;
    const bookingDate = new Date(date);
    if (isToday(bookingDate)) {
      return <Badge bg="success" className="rounded-pill ms-2">Today</Badge>;
    } else if (isTomorrow(bookingDate)) {
      return <Badge bg="info" className="rounded-pill ms-2">Tomorrow</Badge>;
    }
    return null;
  };

  // Calculate stats - safely handle empty bookings
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b?.status?.toLowerCase() === 'pending').length,
    confirmed: bookings.filter(b => ['confirmed', 'accepted', 'in_progress'].includes(b?.status?.toLowerCase())).length,
    completed: bookings.filter(b => b?.status?.toLowerCase() === 'completed').length,
    cancelled: bookings.filter(b => b?.status?.toLowerCase() === 'cancelled' || b?.status?.toLowerCase() === 'rejected').length,
    totalEarnings: bookings
      .filter(b => b?.status?.toLowerCase() === 'completed')
      .reduce((sum, b) => sum + (parseFloat(b.amount) || parseFloat(b.price) || 0), 0)
  };

  // ============================================================
  // LOADING STATE REMOVED
  // ============================================================

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <AlertCircle size={18} className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchBookings(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

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
              onClick={() => toast.info('Export feature coming soon!')}
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
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
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
                    {bookings.map((booking) => {
                      const bookingId = booking.id || booking._id;
                      const customerName = getField(booking, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown');
                      const customerPhone = getField(booking, ['customer_phone', 'customer.phone', 'customerPhone', 'phone'], '');
                      const serviceName = getField(booking, ['service_name', 'service.title', 'serviceName', 'title'], 'Unknown Service');
                      const duration = getField(booking, ['duration', 'estimated_duration', 'time_required'], '');
                      const amount = parseFloat(booking.amount) || parseFloat(booking.price) || 0;
                      const status = getField(booking, ['status', 'booking_status'], 'pending');
                      const bookingDate = booking.date || booking.booking_date || booking.createdAt;
                      const bookingTime = booking.time || booking.booking_time || booking.start_time || '';

                      return (
                        <tr key={bookingId}>
                          <td style={{ padding: '16px' }}>
                            <span className="fw-bold text-primary">#{bookingId.slice(-8) || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                <User size={14} className="text-primary" />
                              </div>
                              <div>
                                <div className="fw-medium">{customerName}</div>
                                {customerPhone && <small className="text-muted">{customerPhone}</small>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>{serviceName}</div>
                            {duration && <small className="text-muted">{duration}</small>}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-medium">{bookingDate ? format(new Date(bookingDate), 'MMM dd, yyyy') : 'N/A'}</div>
                            <small className="text-muted">{bookingTime}</small>
                            {getDateBadge(bookingDate)}
                          </td>
                          <td style={{ padding: '16px' }} className="fw-bold text-primary">
                            {formatNaira(amount)}
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(status)}</td>
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
                              {status === 'pending' && (
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
                              {status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="text-info p-1"
                                  onClick={() => handleStartBooking(bookingId)}
                                >
                                  <Clock size={16} />
                                </Button>
                              )}
                              {status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="text-success p-1"
                                  onClick={() => handleCompleteBooking(bookingId)}
                                >
                                  <CheckCircle size={16} />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="link"
                                className="text-primary p-1"
                                as="a"
                                href={`/provider/chat?booking=${bookingId}`}
                              >
                                <MessageCircle size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                  <h5 className="fw-bold">#{selectedBooking.id || selectedBooking._id}</h5>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Customer Information</h6>
                    <div className="info-item">
                      <User size={16} className="text-muted" />
                      <span>{getField(selectedBooking, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown')}</span>
                    </div>
                    <div className="info-item">
                      <Phone size={16} className="text-muted" />
                      <span>{getField(selectedBooking, ['customer_phone', 'customer.phone', 'customerPhone', 'phone'], 'Not provided')}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} className="text-muted" />
                      <span>{getField(selectedBooking, ['customer_address', 'customer.address', 'address', 'location'], 'Not specified')}</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Service Details</h6>
                    <div className="info-item">
                      <Briefcase size={16} className="text-muted" />
                      <span>{getField(selectedBooking, ['service_name', 'service.title', 'serviceName', 'title'], 'Unknown')}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} className="text-muted" />
                      <span>{getField(selectedBooking, ['duration', 'estimated_duration', 'time_required'], 'N/A')}</span>
                    </div>
                    <div className="info-item">
                      <DollarSign size={16} className="text-muted" />
                      <span className="fw-bold text-primary">{formatNaira(selectedBooking.amount || selectedBooking.price || 0)}</span>
                    </div>
                  </div>
                </Col>

                <Col md={12}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Schedule</h6>
                    <div className="info-item">
                      <CalendarIcon size={16} className="text-muted" />
                      <span>{selectedBooking.date ? format(new Date(selectedBooking.date), 'EEEE, MMMM dd, yyyy') : 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} className="text-muted" />
                      <span>{selectedBooking.time || selectedBooking.start_time || 'N/A'}</span>
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
            href={`/provider/chat?booking=${selectedBooking?.id || selectedBooking?._id}`}
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
              <strong>Customer:</strong> {getField(selectedBooking, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown')}<br />
              <strong>Service:</strong> {getField(selectedBooking, ['service_name', 'service.title', 'serviceName', 'title'], 'Unknown')}<br />
              <strong>Date:</strong> {selectedBooking?.date ? format(new Date(selectedBooking.date), 'MMM dd, yyyy') : 'N/A'}
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