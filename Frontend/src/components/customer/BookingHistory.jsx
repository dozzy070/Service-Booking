// src/pages/customer/BookingHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
  Pagination,
  Modal,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  ProgressBar
} from 'react-bootstrap';
import {
  FaSearch,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaCalendar,
  FaFilter,
  FaEye,
  FaStar,
  FaComment,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaPrint,
  FaShare,
  FaEllipsisV,
  FaWallet,
  FaUserTie,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaInfoCircle,
  FaChartLine,
  FaHistory,
  FaRegClock,
  FaSortAmountDown,
  FaSortAmountUp,
  FaArrowRight,
  FaUndo
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays, subWeeks, subMonths } from 'date-fns';
import toast from 'react-hot-toast';
import { getAvatarUrl, getServiceImage, handleImageError } from '../../utils/imageUtils';
import BookingStatus from '../../components/common/BookingStatus';

const BookingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
    averageRating: 0,
    mostBookedService: '',
    favoriteProvider: ''
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  // Fetch booking history
  const fetchBookingHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        status: filter !== 'all' ? filter : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined,
        sort: sortBy
      };
      
      const response = await customerAPI.getBookingHistory(params);
      setBookings(response.data.bookings || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
      
      // Update stats
      const statsData = response.data.stats || {};
      setStats({
        total: statsData.total || 0,
        completed: statsData.completed || 0,
        cancelled: statsData.cancelled || 0,
        totalSpent: statsData.total_spent || 0,
        averageRating: statsData.average_rating || 0,
        mostBookedService: statsData.most_booked_service || '',
        favoriteProvider: statsData.favorite_provider || ''
      });
    } catch (error) {
      console.error('Error fetching booking history:', error);
      toast.error('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filter, dateRange, sortBy]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchBookingHistory();
    setRefreshing(false);
    toast.success('History updated');
  };

  useEffect(() => {
    fetchBookingHistory();
  }, [fetchBookingHistory]);

  // Export as CSV
  const exportCSV = async () => {
    setExporting(true);
    try {
      const response = await customerAPI.exportBookingHistory({ format: 'csv' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Booking history exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export booking history');
    } finally {
      setExporting(false);
    }
  };

  // Export as PDF
  const exportPDF = async () => {
    setExporting(true);
    try {
      const response = await customerAPI.exportBookingHistory({ format: 'pdf' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking_history_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Booking history exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export booking history');
    } finally {
      setExporting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    return <BookingStatus status={status} size="sm" />;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading booking history...</p>
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
            <h2 className="mb-1 fw-bold d-flex align-items-center gap-2">
              <FaHistory className="text-primary" />
              Booking History
            </h2>
            <p className="text-muted mb-0">View and manage all your past bookings</p>
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
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" className="d-flex align-items-center gap-2">
                <FaDownload />
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportCSV} disabled={exporting}>
                  <FaFileExcel className="me-2 text-success" />
                  Export as CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={exportPDF} disabled={exporting}>
                  <FaFilePdf className="me-2 text-danger" />
                  Export as PDF
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4 g-4">
          <Col lg={2} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#3b82f620' }}>
                    <FaHistory size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total</p>
                    <h4 className="fw-bold mb-0">{stats.total}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6}>
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
          <Col lg={2} md={4} sm={6}>
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
          <Col lg={2} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <FaWallet size={20} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Spent</p>
                    <h4 className="fw-bold mb-0">{formatCompactNaira(stats.totalSpent)}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#f59e0b20' }}>
                    <FaStar size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Avg Rating</p>
                    <h4 className="fw-bold mb-0">{stats.averageRating.toFixed(1)}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={2} md={4} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#8b5cf620' }}>
                    <FaUserTie size={20} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Top Provider</p>
                    <h6 className="fw-bold mb-0 text-truncate">{stats.favoriteProvider || 'N/A'}</h6>
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaFilter size={14} />
                  </InputGroup.Text>
                  <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col lg={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaCalendar size={14} />
                  </InputGroup.Text>
                  <Form.Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                    <option value="year">Last 12 Months</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col lg={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSortAmountDown size={14} />
                  </InputGroup.Text>
                  <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="amount_desc">Highest Amount</option>
                    <option value="amount_asc">Lowest Amount</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col lg={2}>
                <Button 
                  variant="outline-primary" 
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowFilterModal(true)}
                >
                  <FaFilter size={14} />
                  Advanced Filter
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Bookings Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {bookings.length === 0 ? (
              <div className="text-center py-5">
                <FaHistory size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No booking history found</h6>
                <p className="text-muted small mb-3">
                  {search ? 'Try adjusting your search or filters' : 'Your completed bookings will appear here'}
                </p>
                {!search && (
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
                        <th style={{ padding: '16px' }}>Booking ID</th>
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
                            <span className="text-primary fw-medium">#{booking.id.slice(-8)}</span>
                          </td>
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
                                <small className="text-muted">{booking.category}</small>
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
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">{format(new Date(booking.date), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{booking.time}</small>
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
                                    as={Link}
                                    to={`/customer/write-review/${booking.id}`}
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
                    {selectedBooking.status === 'completed' && selectedBooking.rating && (
                      <div className="info-item">
                        <FaStar className="text-warning" />
                        <span>Rating: {selectedBooking.rating} ★</span>
                      </div>
                    )}
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

              <div className="mt-4 d-flex gap-2">
                <Button
                  variant="primary"
                  as={Link}
                  to={`/customer/chat?booking=${selectedBooking.id}`}
                >
                  <FaComment className="me-2" />
                  Message Provider
                </Button>
                {selectedBooking.status === 'completed' && !selectedBooking.has_review && (
                  <Button
                    variant="success"
                    as={Link}
                    to={`/customer/write-review/${selectedBooking.id}`}
                  >
                    <FaStar className="me-2" />
                    Write Review
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  onClick={() => window.print()}
                >
                  <FaPrint className="me-2" />
                  Print
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Advanced Filter Modal */}
      <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaFilter className="me-2" />
            Advanced Filters
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date Range</Form.Label>
              <Row>
                <Col md={6}>
                  <Form.Control type="date" />
                </Col>
                <Col md={6}>
                  <Form.Control type="date" />
                </Col>
              </Row>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Amount Range</Form.Label>
              <Row>
                <Col md={6}>
                  <Form.Control type="number" placeholder="Min" />
                </Col>
                <Col md={6}>
                  <Form.Control type="number" placeholder="Max" />
                </Col>
              </Row>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Category</Form.Label>
              <Form.Select>
                <option value="">All Categories</option>
                <option value="cleaning">Cleaning</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Payment Method</Form.Label>
              <Form.Select>
                <option value="">All Methods</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="wallet">Wallet</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowFilterModal(false)}>
            Reset
          </Button>
          <Button variant="primary" onClick={() => setShowFilterModal(false)}>
            Apply Filters
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
        .text-truncate {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default BookingHistory;