// src/pages/admin/AdminBookings.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminAPI } from '../../api/api';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Dropdown,
  Modal,
  Alert,
  Pagination,
  Nav,
  Spinner,
  Image,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaServicestack,
  FaDollarSign,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaDownload,
  FaPrint,
  FaEllipsisV,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSync,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPlus,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaSlidersH,
  FaBan,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'bookingDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageValue: 0
  });

  // Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: '',
    totalAmount: ''
  });
  const [newStatus, setNewStatus] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);

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

  // ✅ Fetch bookings with proper data extraction
  const fetchBookings = useCallback(async () => {
    try {
      const params = {
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        providerId: filterProvider !== 'all' ? filterProvider : undefined,
        customerId: filterCustomer !== 'all' ? filterCustomer : undefined,
        search: searchTerm || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };
      const response = await adminAPI.getBookings(params);
      // ✅ Extract bookings array safely
      const bookingList = Array.isArray(response.data) ? response.data :
                          Array.isArray(response.data?.bookings) ? response.data.bookings :
                          Array.isArray(response.data?.data) ? response.data.data : [];
      setBookings(bookingList);
      calculateStats(bookingList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterStatus, filterProvider, filterCustomer, searchTerm, sortConfig]);

  // ✅ Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      const response = await adminAPI.getProviders();
      const providerList = Array.isArray(response.data) ? response.data :
                           Array.isArray(response.data?.providers) ? response.data.providers : [];
      setProviders(providerList);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    }
  }, []);

  // ✅ Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await adminAPI.getUsers({ role: 'customer' });
      const customerList = Array.isArray(response.data) ? response.data :
                           Array.isArray(response.data?.users) ? response.data.users : [];
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  }, []);

  // ✅ Calculate stats with safety checks
  const calculateStats = (bookingList) => {
    const list = Array.isArray(bookingList) ? bookingList : [];
    const newStats = {
      total: list.length,
      pending: list.filter(b => b?.status === 'pending').length,
      confirmed: list.filter(b => b?.status === 'confirmed' || b?.status === 'accepted').length,
      inProgress: list.filter(b => b?.status === 'in_progress').length,
      completed: list.filter(b => b?.status === 'completed').length,
      cancelled: list.filter(b => b?.status === 'cancelled').length,
      totalRevenue: list.reduce((sum, b) => sum + (b?.totalAmount || b?.total_amount || b?.amount || 0), 0),
      averageValue: list.length > 0 ? list.reduce((sum, b) => sum + (b?.totalAmount || b?.total_amount || b?.amount || 0), 0) / list.length : 0
    };
    setStats(newStats);
  };

  // ✅ Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBookings(), fetchProviders(), fetchCustomers()]);
    setLoading(false);
  }, [fetchBookings, fetchProviders, fetchCustomers]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch when filters change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterProvider, filterCustomer, dateRange, activeTab]);

  // ✅ Booking actions with adminAPI
  const handleStatusChange = async (bookingId, status) => {
    setProcessing(true);
    try {
      await adminAPI.updateBookingStatus(bookingId, { status });
      await fetchBookings();
      toast.success(`Booking status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update booking status');
    } finally {
      setProcessing(false);
      setShowStatusModal(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    setProcessing(true);
    try {
      await adminAPI.deleteBooking(selectedBooking.id);
      await fetchBookings();
      setShowDeleteModal(false);
      setSelectedBooking(null);
      toast.success('Booking deleted');
    } catch (error) {
      toast.error('Failed to delete booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    setProcessing(true);
    try {
      await adminAPI.updateBooking(selectedBooking.id, editFormData);
      await fetchBookings();
      setShowEditModal(false);
      setSelectedBooking(null);
      toast.success('Booking updated');
    } catch (error) {
      toast.error('Failed to update booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedBookings.length === 0) return;
    setProcessing(true);
    try {
      await adminAPI.bulkBookingAction({ bookingIds: selectedBookings, action: status });
      await fetchBookings();
      setSelectedBookings([]);
      toast.success(`${selectedBookings.length} bookings updated to ${status}`);
    } catch (error) {
      toast.error('Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id).filter(Boolean));
    }
  };

  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId) ? prev.filter(id => id !== bookingId) : [...prev, bookingId]
    );
  };

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // ✅ Filtering with safety
  const filteredBookings = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    let filtered = [...list];
    if (activeTab === 'pending') filtered = filtered.filter(b => b?.status === 'pending');
    if (activeTab === 'confirmed') filtered = filtered.filter(b => b?.status === 'confirmed' || b?.status === 'accepted');
    if (activeTab === 'inProgress') filtered = filtered.filter(b => b?.status === 'in_progress');
    if (activeTab === 'completed') filtered = filtered.filter(b => b?.status === 'completed');
    if (activeTab === 'cancelled') filtered = filtered.filter(b => b?.status === 'cancelled');
    return filtered;
  }, [bookings, activeTab]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      confirmed: { bg: 'info', icon: <FaCheckCircle />, label: 'Confirmed' },
      accepted: { bg: 'info', icon: <FaCheckCircle />, label: 'Accepted' },
      in_progress: { bg: 'primary', icon: <FaClock />, label: 'In Progress' },
      completed: { bg: 'success', icon: <FaCheckCircle />, label: 'Completed' },
      cancelled: { bg: 'danger', icon: <FaTimesCircle />, label: 'Cancelled' }
    };
    const b = badges[status] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
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
            <h2 className="mb-1 fw-bold">Booking Management</h2>
            <p className="text-muted mb-0">Monitor and manage all bookings across the platform</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaSync className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline-primary" className="d-flex align-items-center gap-2">
              <FaDownload /> Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaCalendarAlt size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Bookings</p>
                    <h3 className="fw-bold mb-0">{stats.total}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaClock size={24} color="#f59e0b" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Pending</p>
                    <h3 className="fw-bold mb-0">{stats.pending}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaCheckCircle size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Completed</p>
                    <h3 className="fw-bold mb-0">{stats.completed}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#ef444420' }}>
                    <FaTimesCircle size={24} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Cancelled</p>
                    <h3 className="fw-bold mb-0">{stats.cancelled}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <FaDollarSign size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Revenue</p>
                    <h3 className="fw-bold mb-0">{formatCompactNaira(stats.totalRevenue)}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaChartLine size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Avg Value</p>
                    <h3 className="fw-bold mb-0">{formatCompactNaira(stats.averageValue)}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Nav variant="tabs" className="px-3 pt-3" style={{ borderBottom: 'none' }}>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'all'} 
                  onClick={() => setActiveTab('all')}
                  className="fw-semibold"
                >
                  All Bookings
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'pending'} 
                  onClick={() => setActiveTab('pending')}
                  className="fw-semibold"
                >
                  <FaClock className="me-2 text-warning" /> Pending
                  {stats.pending > 0 && (
                    <Badge bg="warning" pill className="ms-2">{stats.pending}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'confirmed'} 
                  onClick={() => setActiveTab('confirmed')}
                  className="fw-semibold"
                >
                  <FaCheckCircle className="me-2 text-info" /> Confirmed
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'inProgress'} 
                  onClick={() => setActiveTab('inProgress')}
                  className="fw-semibold"
                >
                  <FaClock className="me-2 text-primary" /> In Progress
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'completed'} 
                  onClick={() => setActiveTab('completed')}
                  className="fw-semibold"
                >
                  <FaCheckCircle className="me-2 text-success" /> Completed
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'cancelled'} 
                  onClick={() => setActiveTab('cancelled')}
                  className="fw-semibold"
                >
                  <FaTimesCircle className="me-2 text-danger" /> Cancelled
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
              <div className="d-flex flex-wrap gap-3 flex-grow-1">
                <InputGroup style={{ maxWidth: '300px' }}>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control 
                    placeholder="Search bookings..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="border-start-0"
                  />
                </InputGroup>
                <Form.Select 
                  style={{ width: '150px' }} 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
                <Form.Select 
                  style={{ width: '180px' }} 
                  value={filterProvider} 
                  onChange={(e) => setFilterProvider(e.target.value)}
                >
                  <option value="all">All Providers</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={{ width: '180px' }} 
                  value={filterCustomer} 
                  onChange={(e) => setFilterCustomer(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={{ width: '100px' }} 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Form.Select>
              </div>
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowFilters(!showFilters)}
                className="d-flex align-items-center gap-2"
              >
                <FaSlidersH /> {showFilters ? 'Hide Filters' : 'More Filters'}
              </Button>
            </div>

            {showFilters && (
              <Row className="mt-3 pt-3 border-top">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date Range</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control 
                        type="date" 
                        placeholder="Start" 
                        value={dateRange.start} 
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      />
                      <Form.Control 
                        type="date" 
                        placeholder="End" 
                        value={dateRange.end} 
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Bookings Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-5">
                <FaCalendarAlt size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No bookings found</h6>
                <p className="text-muted small">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ minWidth: '1200px' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0} 
                            onChange={handleSelectAll} 
                          />
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('bookingNumber')}>
                          Booking ID {getSortIcon('bookingNumber')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('customerName')}>
                          Customer {getSortIcon('customerName')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('providerName')}>
                          Provider {getSortIcon('providerName')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('serviceTitle')}>
                          Service {getSortIcon('serviceTitle')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('bookingDate')}>
                          Date {getSortIcon('bookingDate')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('totalAmount')}>
                          Amount {getSortIcon('totalAmount')}
                        </th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px', width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(booking => booking && (
                        <tr key={booking.id} className={selectedBookings.includes(booking.id) ? 'table-active' : ''}>
                          <td style={{ padding: '16px' }}>
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedBookings.includes(booking.id)} 
                              onChange={() => handleSelectBooking(booking.id)} 
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className="fw-semibold">#{booking.bookingNumber || booking.id?.slice(-8) || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <Image 
                                src={booking.customerAvatar || `https://ui-avatars.com/api/?name=${booking.customerName || 'U'}&background=6366f1&color=fff&size=32`} 
                                roundedCircle 
                                width={32} 
                                height={32} 
                                style={{ objectFit: 'cover' }}
                              />
                              <div>
                                <div className="fw-semibold">{booking.customerName || 'Unknown'}</div>
                                <small className="text-muted">{booking.customerEmail || ''}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <Image 
                                src={booking.providerAvatar || `https://ui-avatars.com/api/?name=${booking.providerName || 'U'}&background=10b981&color=fff&size=32`} 
                                roundedCircle 
                                width={32} 
                                height={32} 
                                style={{ objectFit: 'cover' }}
                              />
                              <div>
                                <div className="fw-semibold">{booking.providerName || 'Unknown'}</div>
                                <small className="text-muted">{booking.providerEmail || ''}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>
                              <div className="fw-semibold">{booking.serviceTitle || 'Unknown Service'}</div>
                              <small className="text-muted">{booking.serviceCategory || ''}</small>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">
                              {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                            <small className="text-muted">
                              {booking.bookingDate ? formatDistanceToNow(new Date(booking.bookingDate), { addSuffix: true }) : ''}
                            </small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-bold text-primary">
                              {formatNaira(booking.totalAmount || booking.total_amount || booking.amount || 0)}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(booking.status)}</td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-1">
                              <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
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
                                  <FaEye size={14} />
                                </Button>
                              </OverlayTrigger>
                              
                              <OverlayTrigger placement="top" overlay={<Tooltip>Edit Booking</Tooltip>}>
                                <Button 
                                  size="sm" 
                                  variant="outline-info" 
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => { 
                                    setSelectedBooking(booking); 
                                    setEditFormData({
                                      status: booking.status || '',
                                      notes: booking.notes || '',
                                      totalAmount: booking.totalAmount || booking.total_amount || booking.amount || ''
                                    });
                                    setShowEditModal(true); 
                                  }}
                                >
                                  <FaEdit size={14} />
                                </Button>
                              </OverlayTrigger>

                              <OverlayTrigger placement="top" overlay={<Tooltip>Change Status</Tooltip>}>
                                <Button 
                                  size="sm" 
                                  variant="outline-secondary" 
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => { 
                                    setSelectedBooking(booking); 
                                    setNewStatus(booking.status || '');
                                    setShowStatusModal(true); 
                                  }}
                                >
                                  <FaCheckCircle size={14} />
                                </Button>
                              </OverlayTrigger>

                              <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}>
                                <Button 
                                  size="sm" 
                                  variant="outline-danger" 
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => { 
                                    setSelectedBooking(booking); 
                                    setShowDeleteModal(true); 
                                  }}
                                >
                                  <FaTrash size={14} />
                                </Button>
                              </OverlayTrigger>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredBookings.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} bookings
                    </div>
                    <Pagination>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                        disabled={currentPage === 1} 
                      />
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = idx + 1;
                        else if (currentPage <= 3) pageNum = idx + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                        else pageNum = currentPage - 2 + idx;
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
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
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

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedBooking && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h5 className="mb-1">#{selectedBooking.bookingNumber || selectedBooking.id?.slice(-8) || 'N/A'}</h5>
                  <div>{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div className="text-end">
                  <div className="fw-bold text-primary h4">{formatNaira(selectedBooking.totalAmount || selectedBooking.total_amount || selectedBooking.amount || 0)}</div>
                  <small className="text-muted">
                    {selectedBooking.bookingDate ? format(new Date(selectedBooking.bookingDate), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                  </small>
                </div>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="fw-bold mb-3"><FaUser className="me-2" /> Customer</h6>
                      <p className="mb-1"><strong>Name:</strong> {selectedBooking.customerName || 'N/A'}</p>
                      <p className="mb-1"><strong>Email:</strong> {selectedBooking.customerEmail || 'N/A'}</p>
                      <p className="mb-0"><strong>Phone:</strong> {selectedBooking.customerPhone || 'N/A'}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="fw-bold mb-3"><FaServicestack className="me-2" /> Service</h6>
                      <p className="mb-1"><strong>Name:</strong> {selectedBooking.serviceTitle || 'N/A'}</p>
                      <p className="mb-1"><strong>Category:</strong> {selectedBooking.serviceCategory || 'N/A'}</p>
                      <p className="mb-1"><strong>Provider:</strong> {selectedBooking.providerName || 'N/A'}</p>
                      <p className="mb-0"><strong>Location:</strong> {selectedBooking.location || 'N/A'}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 className="fw-bold mb-3"><FaInfoCircle className="me-2" /> Notes</h6>
                      <p className="mb-0">{selectedBooking.notes || 'No notes provided'}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => { setShowDetailsModal(false); setShowEditModal(true); }}>
            <FaEdit className="me-2" /> Edit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold"><FaEdit className="me-2" /> Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select 
                value={editFormData.status} 
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Total Amount</Form.Label>
              <Form.Control 
                type="number" 
                value={editFormData.totalAmount} 
                onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value })}
                min="0"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={editFormData.notes} 
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Add notes about this booking..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateBooking} disabled={processing}>
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Change Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold"><FaCheckCircle className="me-2" /> Change Status</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form.Group>
            <Form.Label className="fw-semibold">Select new status</Form.Label>
            <Form.Select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedBooking) {
                handleStatusChange(selectedBooking.id, newStatus);
              }
            }} 
            disabled={processing}
          >
            {processing ? 'Updating...' : 'Update Status'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger"><FaTrash className="me-2" /> Delete Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to delete booking #{selectedBooking?.bookingNumber || selectedBooking?.id?.slice(-8) || 'N/A'}?
            <p className="mb-0 mt-2 small text-danger">This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteBooking} disabled={processing}>
            {processing ? 'Deleting...' : 'Delete'}
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
        .nav-tabs .nav-link {
          color: #4b5563;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px 12px 0 0;
        }
        .nav-tabs .nav-link.active {
          color: #6366f1;
          font-weight: 600;
          border-bottom: 3px solid #6366f1;
          background: none;
        }
        .nav-tabs .nav-link:hover {
          background: #f8fafc;
        }
        .table > :not(caption) > * > * {
          padding: 16px 12px;
          vertical-align: middle;
        }
        .table tbody tr:hover {
          background-color: #f8fafc;
        }
        .table-active {
          background-color: #e7f1ff !important;
        }
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminBookings;