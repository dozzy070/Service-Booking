// src/pages/admin/AdminBookings.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { format, formatDistanceToNow, subDays, subMonths } from 'date-fns';
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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const [totalCount, setTotalCount] = useState(0);

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

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

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

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = 'N/A') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch bookings from real API
  const fetchBookings = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!adminAPI || typeof adminAPI.getBookings !== 'function') {
        throw new Error('API service not available');
      }

      const params = {
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        providerId: filterProvider !== 'all' ? filterProvider : undefined,
        customerId: filterCustomer !== 'all' ? filterCustomer : undefined,
        search: searchTerm || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        limit: itemsPerPage,
        page: currentPage
      };

      const response = await adminAPI.getBookings(params);
      
      let data = response?.data || [];
      let total = 0;
      
      if (Array.isArray(data)) {
        setBookings(data);
        total = data.length;
      } else if (data.bookings) {
        setBookings(data.bookings);
        total = data.total || data.bookings.length;
      } else if (data.data) {
        setBookings(data.data);
        total = data.total || data.data.length;
      } else {
        setBookings([]);
        total = 0;
      }
      
      setTotalCount(total);
      calculateStats(data.bookings || data.data || data || []);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Failed to load bookings');
      setBookings([]);
      setTotalCount(0);
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageValue: 0
      });
      
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load bookings');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, filterStatus, filterProvider, filterCustomer, searchTerm, sortConfig, itemsPerPage, currentPage]);

  // Fetch providers from real API
  const fetchProviders = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getProviders !== 'function') {
        throw new Error('API service not available');
      }
      
      const response = await adminAPI.getProviders({ limit: 100 });
      const data = response?.data || [];
      const providerList = Array.isArray(data) ? data : data.providers || data.data || [];
      setProviders(providerList);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    }
  }, []);

  // Fetch customers from real API
  const fetchCustomers = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getUsers !== 'function') {
        throw new Error('API service not available');
      }
      
      const response = await adminAPI.getUsers({ role: 'customer', limit: 100 });
      const data = response?.data || [];
      const customerList = Array.isArray(data) ? data : data.users || data.data || [];
      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  }, []);

  // Calculate stats with safety checks
  const calculateStats = (bookingList) => {
    const list = Array.isArray(bookingList) ? bookingList : [];
    
    if (list.length === 0) {
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageValue: 0
      });
      return;
    }
    
    const newStats = {
      total: list.length,
      pending: list.filter(b => b?.status?.toLowerCase() === 'pending').length,
      confirmed: list.filter(b => ['confirmed', 'accepted'].includes(b?.status?.toLowerCase())).length,
      inProgress: list.filter(b => b?.status?.toLowerCase() === 'in_progress').length,
      completed: list.filter(b => b?.status?.toLowerCase() === 'completed').length,
      cancelled: list.filter(b => b?.status?.toLowerCase() === 'cancelled').length,
      totalRevenue: list.reduce((sum, b) => sum + (parseFloat(b?.totalAmount || b?.total_amount || b?.amount) || 0), 0),
      averageValue: list.length > 0 ? list.reduce((sum, b) => sum + (parseFloat(b?.totalAmount || b?.total_amount || b?.amount) || 0), 0) / list.length : 0
    };
    setStats(newStats);
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchBookings(true), fetchProviders(), fetchCustomers()]);
  }, [fetchBookings, fetchProviders, fetchCustomers]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
    startPolling();
    return () => stopPolling();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchBookings(false);
    }
  }, [dateRange, filterStatus, filterProvider, filterCustomer, searchTerm, sortConfig, itemsPerPage, currentPage]);

  // Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchBookings(false).finally(() => isPolling.current = false);
      }
    }, 30000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    isPolling.current = false;
  };

  // Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    toast.success('Data refreshed');
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterProvider, filterCustomer, dateRange, activeTab]);

  // Booking actions with real API
  const handleStatusChange = async (bookingId, status) => {
    if (!bookingId) return;
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.updateBookingStatus !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.updateBookingStatus(bookingId, { status });
      setBookings(prev => prev.map(b => 
        (b.id || b._id) === bookingId ? { ...b, status: status } : b
      ));
      
      const updatedBookings = bookings.map(b => 
        (b.id || b._id) === bookingId ? { ...b, status: status } : b
      );
      calculateStats(updatedBookings);
      
      toast.success(`Booking status updated to ${status}`);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update booking status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking.id || selectedBooking._id;
    if (!bookingId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.deleteBooking !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.deleteBooking(bookingId);
      const updatedBookings = bookings.filter(b => (b.id || b._id) !== bookingId);
      setBookings(updatedBookings);
      calculateStats(updatedBookings);
      
      setShowDeleteModal(false);
      setSelectedBooking(null);
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error(error.message || 'Failed to delete booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking.id || selectedBooking._id;
    if (!bookingId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.updateBooking !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.updateBooking(bookingId, editFormData);
      setBookings(prev => prev.map(b => 
        (b.id || b._id) === bookingId ? { ...b, ...editFormData } : b
      ));
      
      const updatedBookings = bookings.map(b => 
        (b.id || b._id) === bookingId ? { ...b, ...editFormData } : b
      );
      calculateStats(updatedBookings);
      
      setShowEditModal(false);
      setSelectedBooking(null);
      toast.success('Booking updated successfully');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedBookings.length === 0) return;
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.bulkBookingAction !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.bulkBookingAction({ bookingIds: selectedBookings, action: status });
      setBookings(prev => prev.map(b => 
        selectedBookings.includes(b.id || b._id) ? { ...b, status: status } : b
      ));
      
      const updatedBookings = bookings.map(b => 
        selectedBookings.includes(b.id || b._id) ? { ...b, status: status } : b
      );
      calculateStats(updatedBookings);
      
      setSelectedBookings([]);
      toast.success(`${selectedBookings.length} bookings updated to ${status}`);
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error(error.message || 'Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id || b._id).filter(Boolean));
    }
  };

  const handleSelectBooking = (bookingId) => {
    if (!bookingId) return;
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

  // Filtering with safety
  const filteredBookings = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    let filtered = [...list];
    
    if (activeTab === 'pending') {
      filtered = filtered.filter(b => b?.status?.toLowerCase() === 'pending');
    } else if (activeTab === 'confirmed') {
      filtered = filtered.filter(b => ['confirmed', 'accepted'].includes(b?.status?.toLowerCase()));
    } else if (activeTab === 'inProgress') {
      filtered = filtered.filter(b => b?.status?.toLowerCase() === 'in_progress');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(b => b?.status?.toLowerCase() === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(b => b?.status?.toLowerCase() === 'cancelled');
    }
    
    return filtered;
  }, [bookings, activeTab]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
          <FaInfoCircle />
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const badges = {
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      confirmed: { bg: 'info', icon: <FaCheckCircle />, label: 'Confirmed' },
      accepted: { bg: 'info', icon: <FaCheckCircle />, label: 'Accepted' },
      in_progress: { bg: 'primary', icon: <FaClock />, label: 'In Progress' },
      completed: { bg: 'success', icon: <FaCheckCircle />, label: 'Completed' },
      cancelled: { bg: 'danger', icon: <FaTimesCircle />, label: 'Cancelled' }
    };
    const b = badges[lowerStatus] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
  };

  // Get booking ID
  const getBookingId = (booking) => {
    return booking?.bookingNumber || booking?.id?.slice(-8) || booking?._id?.slice(-8) || 'N/A';
  };

  // Loading state removed - component renders immediately with empty data

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={styles.alert}>
            <FaExclamationTriangle className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchBookings(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Booking Management</h2>
            <p style={styles.headerSubtitle}>Monitor and manage all bookings across the platform</p>
          </div>
          <div style={styles.headerActions}>
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
              style={styles.refreshBtn}
            >
              <FaSync className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline-primary" className="d-flex align-items-center gap-2" style={styles.exportBtn}>
              <FaDownload /> Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row style={styles.statsRow}>
          {[
            { key: 'total', icon: FaCalendarAlt, label: 'Total Bookings', value: stats.total, color: '#3b82f6', bg: '#3b82f620' },
            { key: 'pending', icon: FaClock, label: 'Pending', value: stats.pending, color: '#f59e0b', bg: '#f59e0b20' },
            { key: 'completed', icon: FaCheckCircle, label: 'Completed', value: stats.completed, color: '#10b981', bg: '#10b98120' },
            { key: 'cancelled', icon: FaTimesCircle, label: 'Cancelled', value: stats.cancelled, color: '#ef4444', bg: '#ef444420' },
            { key: 'revenue', icon: FaDollarSign, label: 'Total Revenue', value: formatCompactNaira(stats.totalRevenue), color: '#8b5cf6', bg: '#8b5cf620' },
            { key: 'average', icon: FaChartLine, label: 'Avg Value', value: formatCompactNaira(stats.averageValue), color: '#10b981', bg: '#10b98120' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Col xl={2} lg={4} md={6} key={idx}>
                <Card style={styles.statCard}>
                  <Card.Body style={styles.statCardBody}>
                    <div style={{ ...styles.statIconWrapper, background: item.bg, color: item.color }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p style={styles.statLabel}>{item.label}</p>
                      <h3 style={styles.statValue}>{item.value}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Tabs */}
        <Card style={styles.tabsCard}>
          <Card.Body style={styles.tabsCardBody}>
            <Nav variant="tabs" className="px-3 pt-3" style={styles.tabsNav}>
              {['all', 'pending', 'confirmed', 'inProgress', 'completed', 'cancelled'].map(tab => (
                <Nav.Item key={tab}>
                  <Nav.Link 
                    active={activeTab === tab} 
                    onClick={() => setActiveTab(tab)}
                    style={styles.tabLink}
                  >
                    {tab === 'inProgress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'pending' && stats.pending > 0 && (
                      <Badge bg="warning" pill style={styles.tabBadge}>{stats.pending}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Card.Body>
        </Card>

        {/* Filters */}
        <Card style={styles.filtersCard}>
          <Card.Body style={styles.filtersCardBody}>
            <div style={styles.filtersWrapper}>
              <div style={styles.filtersGroup}>
                <InputGroup style={styles.searchInput}>
                  <InputGroup.Text style={styles.searchInputText}>
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control 
                    placeholder="Search bookings..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    style={styles.searchInputControl}
                  />
                </InputGroup>
                <Form.Select 
                  style={styles.filterSelect}
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
                  style={styles.filterSelect}
                  value={filterProvider} 
                  onChange={(e) => setFilterProvider(e.target.value)}
                >
                  <option value="all">All Providers</option>
                  {providers.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name || p.providerName || p.fullName || 'Unknown'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={styles.filterSelect}
                  value={filterCustomer} 
                  onChange={(e) => setFilterCustomer(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name || c.fullName || c.username || 'Unknown'}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={styles.filterSelect}
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
                style={styles.filterToggle}
              >
                <FaSlidersH /> {showFilters ? 'Hide Filters' : 'More Filters'}
              </Button>
            </div>

            {showFilters && (
              <Row style={styles.filterRow}>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={styles.filterLabel}>Date Range</Form.Label>
                    <div style={styles.dateRangeWrapper}>
                      <Form.Control 
                        type="date" 
                        placeholder="Start" 
                        value={dateRange.start} 
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        style={styles.dateInput}
                      />
                      <Form.Control 
                        type="date" 
                        placeholder="End" 
                        value={dateRange.end} 
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        style={styles.dateInput}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Bookings Table */}
        <Card style={styles.tableCard}>
          <Card.Body style={styles.tableCardBody}>
            {currentItems.length === 0 ? (
              <div style={styles.emptyState}>
                <FaCalendarAlt size={48} style={styles.emptyIcon} />
                <h6 style={styles.emptyTitle}>No bookings found</h6>
                <p style={styles.emptyText}>Try adjusting your search or filter criteria</p>
                <Button variant="link" onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterProvider('all');
                  setFilterCustomer('all');
                  setDateRange({ start: '', end: '' });
                  setActiveTab('all');
                }} style={styles.emptyLink}>Reset all filters</Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={styles.tableCheckbox}>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0} 
                            onChange={handleSelectAll} 
                          />
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('bookingNumber')}>
                          Booking ID {getSortIcon('bookingNumber')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('customerName')}>
                          Customer {getSortIcon('customerName')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('providerName')}>
                          Provider {getSortIcon('providerName')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('serviceTitle')}>
                          Service {getSortIcon('serviceTitle')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('bookingDate')}>
                          Date {getSortIcon('bookingDate')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('totalAmount')}>
                          Amount {getSortIcon('totalAmount')}
                        </th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(booking => {
                        const bookingId = booking.id || booking._id;
                        const customerName = getField(booking, ['customerName', 'customer.name', 'user.name', 'customer.username'], 'Unknown');
                        const providerName = getField(booking, ['providerName', 'provider.name', 'provider.username'], 'Unknown');
                        const serviceTitle = getField(booking, ['serviceTitle', 'service.title', 'service.name', 'title'], 'Unknown Service');
                        const bookingNumber = getField(booking, ['bookingNumber', 'bookingId', 'reference', 'id'], 'N/A');
                        const customerEmail = getField(booking, ['customerEmail', 'customer.email', 'user.email'], '');
                        const providerEmail = getField(booking, ['providerEmail', 'provider.email', 'provider.contactEmail'], '');
                        const customerPhone = getField(booking, ['customerPhone', 'customer.phone', 'user.phone'], '');
                        const serviceCategory = getField(booking, ['serviceCategory', 'category', 'service.category'], '');
                        const notes = getField(booking, ['notes', 'description', 'remarks'], '');
                        const bookingDate = booking.bookingDate || booking.createdAt || booking.date;
                        
                        return (
                          <tr key={bookingId} className={selectedBookings.includes(bookingId) ? 'table-active' : ''} style={styles.tableRow}>
                            <td style={styles.tableCell}>
                              <Form.Check 
                                type="checkbox" 
                                checked={selectedBookings.includes(bookingId)} 
                                onChange={() => handleSelectBooking(bookingId)} 
                              />
                            </td>
                            <td style={styles.tableCell}>
                              <span style={styles.bookingId}>#{bookingNumber}</span>
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.userCell}>
                                <Image 
                                  src={booking.customerAvatar || `https://ui-avatars.com/api/?name=${customerName}&background=6366f1&color=fff&size=32`} 
                                  roundedCircle 
                                  width={32} 
                                  height={32} 
                                  style={styles.avatar}
                                />
                                <div>
                                  <div style={styles.userName}>{customerName}</div>
                                  {customerEmail && <small style={styles.userEmail}>{customerEmail}</small>}
                                </div>
                              </div>
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.userCell}>
                                <Image 
                                  src={booking.providerAvatar || `https://ui-avatars.com/api/?name=${providerName}&background=10b981&color=fff&size=32`} 
                                  roundedCircle 
                                  width={32} 
                                  height={32} 
                                  style={styles.avatar}
                                />
                                <div>
                                  <div style={styles.userName}>{providerName}</div>
                                  {providerEmail && <small style={styles.userEmail}>{providerEmail}</small>}
                                </div>
                              </div>
                            </td>
                            <td style={styles.tableCell}>
                              <div>
                                <div style={styles.serviceName}>{serviceTitle}</div>
                                {serviceCategory && <small style={styles.serviceCategory}>{serviceCategory}</small>}
                              </div>
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.dateCell}>
                                {bookingDate ? format(new Date(bookingDate), 'MMM dd, yyyy') : 'N/A'}
                              </div>
                              <small style={styles.dateAgo}>
                                {bookingDate ? formatDistanceToNow(new Date(bookingDate), { addSuffix: true }) : ''}
                              </small>
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.amountCell}>
                                {formatNaira(booking.totalAmount || booking.total_amount || booking.amount || 0)}
                              </div>
                            </td>
                            <td style={styles.tableCell}>{getStatusBadge(booking.status)}</td>
                            <td style={styles.tableCell}>
                              <div style={styles.actionButtons}>
                                <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                                  <Button 
                                    size="sm" 
                                    variant="outline-primary" 
                                    className="rounded-circle p-1"
                                    style={styles.actionBtn}
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
                                    style={styles.actionBtn}
                                    onClick={() => { 
                                      setSelectedBooking(booking); 
                                      setEditFormData({
                                        status: booking.status || '',
                                        notes: notes || '',
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
                                    style={styles.actionBtn}
                                    onClick={() => { 
                                      setSelectedBooking(booking); 
                                      setNewStatus(booking.status || 'pending');
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
                                    style={styles.actionBtn}
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
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredBookings.length > 0 && (
                  <div style={styles.paginationWrapper}>
                    <div style={styles.paginationInfo}>
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} bookings
                    </div>
                    <Pagination style={styles.pagination}>
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

      {/* Modals - same as before with improved styling */}
      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          {selectedBooking && (
            <>
              <div style={styles.detailHeader}>
                <div>
                  <h5 style={styles.detailId}>#{getBookingId(selectedBooking)}</h5>
                  <div>{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div style={styles.detailAmount}>
                  <div style={styles.detailAmountValue}>
                    {formatNaira(selectedBooking.totalAmount || selectedBooking.total_amount || selectedBooking.amount || 0)}
                  </div>
                  <small style={styles.detailAmountDate}>
                    {selectedBooking.bookingDate || selectedBooking.createdAt ? 
                      format(new Date(selectedBooking.bookingDate || selectedBooking.createdAt), 'MMM dd, yyyy hh:mm a') : 
                      'N/A'}
                  </small>
                </div>
              </div>

              <Row style={styles.detailRow}>
                <Col md={6}>
                  <Card style={styles.detailCard}>
                    <Card.Body>
                      <h6 style={styles.detailCardTitle}><FaUser className="me-2" /> Customer</h6>
                      <p style={styles.detailCardText}><strong>Name:</strong> {getField(selectedBooking, ['customerName', 'customer.name', 'user.name'], 'N/A')}</p>
                      <p style={styles.detailCardText}><strong>Email:</strong> {getField(selectedBooking, ['customerEmail', 'customer.email', 'user.email'], 'N/A')}</p>
                      <p style={styles.detailCardText}><strong>Phone:</strong> {getField(selectedBooking, ['customerPhone', 'customer.phone', 'user.phone'], 'N/A')}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card style={styles.detailCard}>
                    <Card.Body>
                      <h6 style={styles.detailCardTitle}><FaServicestack className="me-2" /> Service</h6>
                      <p style={styles.detailCardText}><strong>Name:</strong> {getField(selectedBooking, ['serviceTitle', 'service.title', 'title'], 'N/A')}</p>
                      <p style={styles.detailCardText}><strong>Category:</strong> {getField(selectedBooking, ['serviceCategory', 'category', 'service.category'], 'N/A')}</p>
                      <p style={styles.detailCardText}><strong>Provider:</strong> {getField(selectedBooking, ['providerName', 'provider.name'], 'N/A')}</p>
                      <p style={styles.detailCardText}><strong>Location:</strong> {getField(selectedBooking, ['location', 'serviceLocation', 'address'], 'N/A')}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={12}>
                  <Card style={styles.detailCard}>
                    <Card.Body>
                      <h6 style={styles.detailCardTitle}><FaInfoCircle className="me-2" /> Notes</h6>
                      <p style={styles.detailCardText}>{getField(selectedBooking, ['notes', 'description', 'remarks'], 'No notes provided')}</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
          <Button variant="primary" onClick={() => { setShowDetailsModal(false); setShowEditModal(true); }}>
            <FaEdit className="me-2" /> Edit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}><FaEdit className="me-2" /> Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Status</Form.Label>
              <Form.Select 
                value={editFormData.status} 
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                style={styles.formControl}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Total Amount</Form.Label>
              <Form.Control 
                type="number" 
                value={editFormData.totalAmount} 
                onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value })}
                min="0"
                style={styles.formControl}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Notes</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={editFormData.notes} 
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Add notes about this booking..."
                style={styles.formTextarea}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdateBooking} disabled={processing}>
            {processing ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Change Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}><FaCheckCircle className="me-2" /> Change Status</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Form.Group>
            <Form.Label style={styles.formLabel}>Select new status</Form.Label>
            <Form.Select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
              style={styles.formControl}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedBooking) {
                handleStatusChange(selectedBooking.id || selectedBooking._id, newStatus);
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
        <Modal.Header closeButton style={styles.modalHeaderDanger}>
          <Modal.Title style={styles.modalTitleDanger}><FaTrash className="me-2" /> Delete Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Alert variant="danger" style={styles.deleteAlert}>
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to delete booking #{selectedBooking ? getBookingId(selectedBooking) : 'N/A'}?
            <p style={styles.deleteWarning}>This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteBooking} disabled={processing}>
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{styles.globalStyles}</style>
    </div>
  );
};

const styles = {
  container: {
    background: '#f8f9fa',
    minHeight: '100vh'
  },
  alert: {
    borderRadius: '12px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '4px'
  },
  headerSubtitle: {
    color: '#718096',
    marginBottom: 0,
    fontSize: '16px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  refreshBtn: {
    borderRadius: '12px',
    padding: '10px 20px'
  },
  exportBtn: {
    borderRadius: '12px',
    padding: '10px 20px'
  },
  statsRow: {
    marginBottom: '28px',
    gap: '16px'
  },
  statCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%',
    transition: 'all 0.3s ease'
  },
  statCardBody: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statLabel: {
    color: '#718096',
    marginBottom: 0,
    fontSize: '14px',
    fontWeight: '500'
  },
  statValue: {
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 0,
    fontSize: '24px'
  },
  tabsCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden'
  },
  tabsCardBody: {
    padding: 0
  },
  tabsNav: {
    borderBottom: 'none'
  },
  tabLink: {
    color: '#4b5563',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px 12px 0 0',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  tabBadge: {
    marginLeft: '8px',
    fontSize: '10px',
    padding: '2px 8px'
  },
  filtersCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden'
  },
  filtersCardBody: {
    padding: '20px 24px'
  },
  filtersWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filtersGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    flex: 1
  },
  searchInput: {
    maxWidth: '300px',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  searchInputText: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRight: 'none'
  },
  searchInputControl: {
    border: '1px solid #e2e8f0',
    borderLeft: 'none',
    borderRadius: '0 12px 12px 0',
    padding: '10px 16px'
  },
  filterSelect: {
    width: '150px',
    borderRadius: '12px',
    padding: '10px 16px'
  },
  filterToggle: {
    borderRadius: '12px',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterRow: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  filterLabel: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c'
  },
  dateRangeWrapper: {
    display: 'flex',
    gap: '12px'
  },
  dateInput: {
    borderRadius: '10px',
    padding: '8px 12px'
  },
  tableCard: {
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  tableCardBody: {
    padding: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyIcon: {
    color: '#cbd5e0',
    marginBottom: '16px',
    opacity: 0.5
  },
  emptyTitle: {
    color: '#4a5568',
    marginBottom: '8px',
    fontWeight: '500'
  },
  emptyText: {
    color: '#a0aec0',
    marginBottom: '16px'
  },
  emptyLink: {
    color: '#6366f1',
    fontWeight: '500'
  },
  table: {
    minWidth: '1200px',
    marginBottom: 0
  },
  tableHead: {
    background: '#f8fafc'
  },
  tableHeader: {
    padding: '16px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  tableCheckbox: {
    padding: '16px 12px',
    width: '40px'
  },
  tableRow: {
    transition: 'background 0.2s'
  },
  tableCell: {
    padding: '16px 12px',
    verticalAlign: 'middle'
  },
  bookingId: {
    fontWeight: '600',
    color: '#6366f1'
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    objectFit: 'cover',
    borderRadius: '50%'
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c'
  },
  userEmail: {
    color: '#718096',
    fontSize: '12px'
  },
  serviceName: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#1a202c'
  },
  serviceCategory: {
    color: '#718096',
    fontSize: '12px'
  },
  dateCell: {
    fontWeight: '500',
    fontSize: '14px'
  },
  dateAgo: {
    color: '#718096',
    fontSize: '12px',
    display: 'block'
  },
  amountCell: {
    fontWeight: '700',
    color: '#6366f1'
  },
  actionButtons: {
    display: 'flex',
    gap: '4px'
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '12px'
  },
  paginationInfo: {
    color: '#718096',
    fontSize: '14px'
  },
  pagination: {
    marginBottom: 0
  },
  modalHeader: {
    borderBottom: 'none',
    padding: '20px 24px 0'
  },
  modalHeaderDanger: {
    borderBottom: 'none',
    padding: '20px 24px 0'
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#1a202c'
  },
  modalTitleDanger: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#ef4444'
  },
  modalBody: {
    padding: '20px 24px'
  },
  modalFooter: {
    borderTop: 'none',
    padding: '0 24px 20px'
  },
  formLabel: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c'
  },
  formControl: {
    borderRadius: '10px',
    padding: '10px 14px'
  },
  formTextarea: {
    borderRadius: '10px',
    padding: '10px 14px',
    resize: 'vertical'
  },
  deleteAlert: {
    borderRadius: '12px'
  },
  deleteWarning: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#ef4444'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  detailId: {
    fontWeight: '700',
    marginBottom: '4px'
  },
  detailAmount: {
    textAlign: 'right'
  },
  detailAmountValue: {
    fontWeight: '700',
    fontSize: '24px',
    color: '#6366f1'
  },
  detailAmountDate: {
    color: '#718096',
    fontSize: '12px'
  },
  detailRow: {
    gap: '16px'
  },
  detailCard: {
    border: 'none',
    background: '#f8fafc',
    borderRadius: '12px',
    height: '100%'
  },
  detailCardTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#1a202c'
  },
  detailCardText: {
    marginBottom: '6px',
    fontSize: '14px',
    color: '#1a202c'
  },
  globalStyles: `
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
      transition: all 0.2s;
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
    .form-control:focus, .form-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .modal-content {
      border-radius: 20px;
      overflow: hidden;
    }
    .modal-header .btn-close {
      padding: 8px;
    }
    @media (max-width: 768px) {
      .table-responsive {
        font-size: 0.85rem;
      }
      .nav-tabs .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }
    }
  `
};

export default AdminBookings;