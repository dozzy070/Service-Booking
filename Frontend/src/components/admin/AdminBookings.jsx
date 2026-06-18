// src/pages/admin/AdminBookings.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form, InputGroup,
  Badge, Dropdown, Modal, Nav, Pagination, Toast, ToastContainer,
  Spinner, Alert, ProgressBar
} from 'react-bootstrap';

import {
  FaCalendarCheck, FaClock, FaUser, FaServicestack, FaMoneyBillWave,
  FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaInfoCircle, FaSearch, FaSlidersH, FaSort, FaSortUp,
  FaSortDown, FaEllipsisV, FaEye, FaEdit, FaBan, FaCheck, FaCalendarAlt,
  FaDownload, FaPrint, FaRedo, FaFileCsv, FaFileExcel, FaFilePdf,
  FaRocket, FaUndo, FaSync, FaPlus, FaMinus, FaArrowUp, FaArrowDown,
  FaUserTie, FaShoppingCart, FaChartLine, FaWallet, FaCreditCard,
  FaPhoneAlt, FaEnvelope as FaEnvelopeIcon, FaMapMarkerAlt as FaMapMarkerIcon,
  FaGlobe, FaLink, FaShare, FaCopy, FaTrash, FaSave, FaTimes
} from 'react-icons/fa';

import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth, isToday, isTomorrow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'serviceDate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });
  const [cancellationData, setCancellationData] = useState({ reason: '', refund: true, refundAmount: 0 });
  const [exportFormat, setExportFormat] = useState('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Data state
  const [bookings, setBookings] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [providersList, setProvidersList] = useState([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, confirmed: 0, inProgress: 0,
    completed: 0, cancelled: 0, disputed: 0, totalRevenue: 0
  });

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

  const showToast = (message, type = 'success') => {
    toast[type](message);
  };

  // API Calls
  const fetchBookings = useCallback(async () => {
    try {
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchTerm || undefined,
        serviceId: filterService !== 'all' ? filterService : undefined,
        providerId: filterProvider !== 'all' ? filterProvider : undefined
      };
      const res = await adminAPI.getBookings(params);
      setBookings(res.data);
      
      // Calculate stats
      const total = res.data.length;
      const pending = res.data.filter(b => b.status === 'pending').length;
      const confirmed = res.data.filter(b => b.status === 'confirmed').length;
      const inProgress = res.data.filter(b => b.status === 'in_progress').length;
      const completed = res.data.filter(b => b.status === 'completed').length;
      const cancelled = res.data.filter(b => b.status === 'cancelled').length;
      const disputed = res.data.filter(b => b.status === 'disputed').length;
      const totalRevenue = res.data.reduce((acc, b) => acc + (b.payment?.status === 'paid' ? (b.amount || 0) : 0), 0);
      
      setStats({ total, pending, confirmed, inProgress, completed, cancelled, disputed, totalRevenue });
    } catch (err) {
      console.error('Error fetching bookings:', err);
      showToast('Failed to load bookings', 'danger');
    } finally {
      setLoading(false);
    }
  }, [dateRange, activeTab, searchTerm, filterService, filterProvider]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await adminAPI.getServices();
      setServicesList(res.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await adminAPI.getProviders();
      setProvidersList(res.data);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBookings(), fetchServices(), fetchProviders()]);
    setLoading(false);
  }, [fetchBookings, fetchServices, fetchProviders]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    showToast('Data refreshed', 'info');
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // CRUD operations
  const updateBookingStatus = async (bookingId, newStatus, additionalData = {}) => {
    setProcessing(true);
    try {
      await adminAPI.updateBooking(bookingId, { status: newStatus, ...additionalData });
      await fetchAllData();
      showToast(`Booking updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Status update error:', err);
      showToast(err.response?.data?.message || 'Update failed', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    await updateBookingStatus(selectedBooking.id, 'cancelled', {
      cancellationReason: cancellationData.reason,
      refund: cancellationData.refund,
      refundAmount: cancellationData.refundAmount
    });
    setShowCancelModal(false);
    setCancellationData({ reason: '', refund: true, refundAmount: 0 });
  };

  const handleCompleteBooking = async () => {
    if (!selectedBooking) return;
    await updateBookingStatus(selectedBooking.id, 'completed');
    setShowCompleteModal(false);
  };

  const handleReschedule = async () => {
    if (!selectedBooking || !rescheduleData.date || !rescheduleData.time) return;
    await updateBookingStatus(selectedBooking.id, 'confirmed', {
      serviceDate: rescheduleData.date,
      serviceTime: rescheduleData.time,
      rescheduleReason: rescheduleData.reason
    });
    setShowRescheduleModal(false);
    setRescheduleData({ date: '', time: '', reason: '' });
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedBookings.length === 0) return;
    setProcessing(true);
    try {
      await adminAPI.bulkBookingAction({ ids: selectedBookings, action: newStatus });
      await fetchAllData();
      setSelectedBookings([]);
      setShowBulkActions(false);
      showToast(`${selectedBookings.length} bookings updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Bulk update failed', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  // Export
  const handleExport = async () => {
    setProcessing(true);
    try {
      const response = await adminAPI.exportBookings({
        format: exportFormat,
        startDate: dateRange.start,
        endDate: dateRange.end,
        status: activeTab !== 'all' ? activeTab : undefined
      });
      const blob = new Blob([response.data], {
        type: exportFormat === 'csv' ? 'text/csv' :
              exportFormat === 'excel' ? 'application/vnd.ms-excel' :
              'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings_export_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'csv' ? 'csv' : exportFormat === 'excel' ? 'xls' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Bookings exported successfully', 'success');
      setShowExportModal(false);
    } catch (err) {
      showToast('Export failed', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterService('all');
    setFilterProvider('all');
    setDateRange({
      start: subDays(new Date(), 30).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedPeriod('30days');
    setActiveTab('all');
    setCurrentPage(1);
    showToast('Filters reset', 'info');
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const handleSelectBooking = (id) => {
    setSelectedBookings(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Sorting
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Filtering
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];
    if (activeTab !== 'all') filtered = filtered.filter(b => b.status === activeTab);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.id?.toLowerCase().includes(term) ||
        b.customer?.name?.toLowerCase().includes(term) ||
        b.provider?.name?.toLowerCase().includes(term) ||
        b.service?.title?.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter(b => b.status === filterStatus);
    if (filterService !== 'all') filtered = filtered.filter(b => b.service?.id === parseInt(filterService));
    if (filterProvider !== 'all') filtered = filtered.filter(b => b.provider?.id === parseInt(filterProvider));

    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'serviceDate') {
        aVal = new Date(`${a.serviceDate} ${a.serviceTime || ''}`).getTime();
        bVal = new Date(`${b.serviceDate} ${b.serviceTime || ''}`).getTime();
      } else if (sortConfig.key === 'amount') {
        aVal = a.amount || 0;
        bVal = b.amount || 0;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [bookings, activeTab, searchTerm, filterStatus, filterService, filterProvider, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterStatus, filterService, filterProvider, dateRange]);

  // Badge helpers
  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      confirmed: { bg: 'info', icon: <FaCheckCircle />, label: 'Confirmed' },
      in_progress: { bg: 'primary', icon: <FaRocket />, label: 'In Progress' },
      completed: { bg: 'success', icon: <FaCheckCircle />, label: 'Completed' },
      cancelled: { bg: 'danger', icon: <FaTimesCircle />, label: 'Cancelled' },
      disputed: { bg: 'danger', icon: <FaExclamationTriangle />, label: 'Disputed' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <Badge bg={badge.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {badge.icon}
        <span className="ms-1">{badge.label}</span>
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'success', icon: <FaCheckCircle />, label: 'Paid' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      refunded: { bg: 'info', icon: <FaUndo />, label: 'Refunded' },
      failed: { bg: 'danger', icon: <FaTimesCircle />, label: 'Failed' },
      held: { bg: 'danger', icon: <FaExclamationTriangle />, label: 'Held' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <Badge bg={badge.bg} className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>
        {badge.icon}
        <span>{badge.label}</span>
      </Badge>
    );
  };

  const getDateBadge = (date) => {
    const bookingDate = new Date(date);
    if (isToday(bookingDate)) {
      return <Badge bg="success" className="rounded-pill">Today</Badge>;
    } else if (isTomorrow(bookingDate)) {
      return <Badge bg="info" className="rounded-pill">Tomorrow</Badge>;
    }
    return null;
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
            <p className="text-muted mb-0">Manage and monitor all bookings on the platform</p>
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
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                <FaDownload /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}>
                  <FaFileCsv className="me-2 text-success" /> CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('excel'); setShowExportModal(true); }}>
                  <FaFileExcel className="me-2 text-success" /> Excel
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('pdf'); setShowExportModal(true); }}>
                  <FaFilePdf className="me-2 text-danger" /> PDF
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Date Range */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Row className="align-items-center g-3">
              <Col lg={3}>
                <Form.Label className="fw-semibold">Period</Form.Label>
                <Form.Select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    const today = new Date();
                    let start = new Date();
                    switch(e.target.value) {
                      case '7days': start = subDays(today, 7); break;
                      case '30days': start = subDays(today, 30); break;
                      case '90days': start = subDays(today, 90); break;
                      case '12months': start = subMonths(today, 12); break;
                      case 'ytd': start = new Date(today.getFullYear(), 0, 1); break;
                      default: start = subDays(today, 30);
                    }
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    });
                  }}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="12months">Last 12 Months</option>
                  <option value="ytd">Year to Date</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Col>
              {selectedPeriod === 'custom' && (
                <>
                  <Col lg={3}>
                    <Form.Label className="fw-semibold">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </Col>
                  <Col lg={3}>
                    <Form.Label className="fw-semibold">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </Col>
                </>
              )}
              <Col lg={3} className="d-flex align-items-end">
                <Button variant="primary" onClick={fetchAllData} className="w-100">
                  <FaSearch className="me-2" /> Apply
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col xl={2} lg={4} md={6}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('all')}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaCalendarCheck size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total</p>
                    <h3 className="fw-bold mb-0">{stats.total}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('pending')}
            >
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
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('confirmed')}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaCheckCircle size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Confirmed</p>
                    <h3 className="fw-bold mb-0">{stats.confirmed}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('in_progress')}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <FaRocket size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">In Progress</p>
                    <h3 className="fw-bold mb-0">{stats.inProgress}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('completed')}
            >
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
            <Card
              className="border-0 shadow-sm h-100"
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setActiveTab('disputed')}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#ef444420' }}>
                    <FaExclamationTriangle size={24} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Disputed</p>
                    <h3 className="fw-bold mb-0">{stats.disputed}</h3>
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
                  <Badge bg="secondary" pill className="ms-2">{stats.total}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'pending'}
                  onClick={() => setActiveTab('pending')}
                  className="fw-semibold"
                >
                  Pending
                  {stats.pending > 0 && <Badge bg="warning" pill className="ms-2">{stats.pending}</Badge>}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'confirmed'}
                  onClick={() => setActiveTab('confirmed')}
                  className="fw-semibold"
                >
                  Confirmed
                  <Badge bg="info" pill className="ms-2">{stats.confirmed}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'in_progress'}
                  onClick={() => setActiveTab('in_progress')}
                  className="fw-semibold"
                >
                  In Progress
                  <Badge bg="primary" pill className="ms-2">{stats.inProgress}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'completed'}
                  onClick={() => setActiveTab('completed')}
                  className="fw-semibold"
                >
                  Completed
                  <Badge bg="success" pill className="ms-2">{stats.completed}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'cancelled'}
                  onClick={() => setActiveTab('cancelled')}
                  className="fw-semibold"
                >
                  Cancelled
                  <Badge bg="danger" pill className="ms-2">{stats.cancelled}</Badge>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'disputed'}
                  onClick={() => setActiveTab('disputed')}
                  className="fw-semibold"
                >
                  Disputed
                  <Badge bg="danger" pill className="ms-2">{stats.disputed}</Badge>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text><FaSearch size={14} /></InputGroup.Text>
                <Form.Control
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <option value="disputed">Disputed</option>
              </Form.Select>
              <Form.Select
                style={{ width: '150px' }}
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
              >
                <option value="all">All Services</option>
                {servicesList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
              <Form.Select
                style={{ width: '150px' }}
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                <option value="all">All Providers</option>
                {providersList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
              </Form.Select>
              <Button variant="outline-secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>

            {selectedBookings.length > 0 && (
              <div className="d-flex gap-2 mt-3 pt-3 border-top">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => setShowBulkActions(true)}
                >
                  Bulk Actions ({selectedBookings.length})
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleBulkStatusChange('cancelled')}
                >
                  Cancel Selected
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Bookings Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {currentBookings.length === 0 ? (
              <div className="text-center py-5">
                <FaCalendarCheck size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No bookings found</h6>
                <Button variant="link" onClick={resetFilters} className="mt-2">Reset Filters</Button>
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
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                          Booking ID {getSortIcon('id')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('serviceDate')}>
                          Date & Time {getSortIcon('serviceDate')}
                        </th>
                        <th style={{ padding: '16px' }}>Customer</th>
                        <th style={{ padding: '16px' }}>Provider</th>
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                          Amount {getSortIcon('amount')}
                        </th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Payment</th>
                        <th style={{ padding: '16px', width: '160px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBookings.map(booking => (
                        <tr key={booking.id} className={selectedBookings.includes(booking.id) ? 'table-active' : ''}>
                          <td style={{ padding: '16px' }}>
                            <Form.Check
                              type="checkbox"
                              checked={selectedBookings.includes(booking.id)}
                              onChange={() => handleSelectBooking(booking.id)}
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className="text-primary fw-medium">#{booking.id.slice(-8)}</span>
                            <small className="d-block text-muted">
                              <FaClock size={10} className="me-1" />
                              {format(new Date(booking.bookingDate), 'MMM dd')}
                            </small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">{format(new Date(booking.serviceDate), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{booking.serviceTime}</small>
                            {getDateBadge(booking.serviceDate)}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={booking.customer?.avatar || `https://ui-avatars.com/api/?name=${booking.customer?.name}&background=3b82f6&color=fff&size=30`}
                                alt=""
                                className="rounded-circle"
                                style={{ width: '30px', height: '30px' }}
                              />
                              <div>
                                <div className="fw-semibold small">{booking.customer?.name}</div>
                                <small className="text-muted">ID: {booking.customer?.id}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={booking.provider?.avatar || `https://ui-avatars.com/api/?name=${booking.provider?.name}&background=10b981&color=fff&size=30`}
                                alt=""
                                className="rounded-circle"
                                style={{ width: '30px', height: '30px' }}
                              />
                              <div>
                                <div className="fw-semibold small">{booking.provider?.name}</div>
                                <small className="text-warning">
                                  <FaStar size={10} className="me-1" />
                                  {booking.provider?.rating || 'New'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold small">{booking.service?.title}</div>
                            <small className="text-muted">{booking.service?.category}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-bold text-primary">{formatNaira(booking.amount)}</div>
                            <small>{booking.service?.duration} hrs</small>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(booking.status)}</td>
                          <td style={{ padding: '16px' }}>
                            {getPaymentStatusBadge(booking.payment?.status)}
                            <small className="d-block text-muted">{booking.payment?.method}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="rounded-circle p-1"
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setModalMode('view');
                                  setShowBookingModal(true);
                                }}
                              >
                                <FaEye size={14} />
                              </Button>
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  >
                                    <FaCheck size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setCancellationData({
                                        reason: '',
                                        refund: true,
                                        refundAmount: booking.amount
                                      });
                                      setShowCancelModal(true);
                                    }}
                                  >
                                    <FaBan size={14} />
                                  </Button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline-warning"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowRescheduleModal(true);
                                    }}
                                  >
                                    <FaCalendarAlt size={14} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    className="rounded-circle p-1"
                                    style={{ width: '32px', height: '32px' }}
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowCompleteModal(true);
                                    }}
                                  >
                                    <FaCheckCircle size={14} />
                                  </Button>
                                </>
                              )}
                              {booking.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowCompleteModal(true);
                                  }}
                                >
                                  <FaCheckCircle size={14} />
                                </Button>
                              )}
                              {booking.status === 'disputed' && (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowDisputeModal(true);
                                  }}
                                >
                                  <FaExclamationTriangle size={14} />
                                </Button>
                              )}
                              <Dropdown align="end">
                                <Dropdown.Toggle
                                  size="sm"
                                  variant="outline-secondary"
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                >
                                  <FaEllipsisV size={14} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setModalMode('edit');
                                      setShowBookingModal(true);
                                    }}
                                  >
                                    <FaEdit className="me-2" /> Edit
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    className="text-danger"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setCancellationData({
                                        reason: '',
                                        refund: true,
                                        refundAmount: booking.amount
                                      });
                                      setShowCancelModal(true);
                                    }}
                                  >
                                    <FaBan className="me-2" /> Cancel
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
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
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Modals */}
      {/* Booking Details Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {modalMode === 'view' ? <FaEye className="me-2" /> : <FaEdit className="me-2" />}
            {modalMode === 'view' ? 'Booking Details' : 'Edit Booking'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedBooking && (
            <div>
              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Booking Information</h6>
                    <div className="info-item">
                      <FaInfoCircle className="text-muted" />
                      <span><strong>ID:</strong> {selectedBooking.id}</span>
                    </div>
                    <div className="info-item">
                      <FaCalendarAlt className="text-muted" />
                      <span><strong>Date:</strong> {format(new Date(selectedBooking.serviceDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="info-item">
                      <FaClock className="text-muted" />
                      <span><strong>Time:</strong> {selectedBooking.serviceTime}</span>
                    </div>
                    <div className="info-item">
                      <FaMoneyBillWave className="text-muted" />
                      <span><strong>Amount:</strong> {formatNaira(selectedBooking.amount)}</span>
                    </div>
                    <div className="info-item">
                      <FaCheckCircle className="text-muted" />
                      <span><strong>Status:</strong> {getStatusBadge(selectedBooking.status)}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Customer & Provider</h6>
                    <div className="info-item">
                      <FaUser className="text-muted" />
                      <span><strong>Customer:</strong> {selectedBooking.customer?.name}</span>
                    </div>
                    <div className="info-item">
                      <FaPhoneAlt className="text-muted" />
                      <span>{selectedBooking.customer?.phone}</span>
                    </div>
                    <div className="info-item">
                      <FaUserTie className="text-muted" />
                      <span><strong>Provider:</strong> {selectedBooking.provider?.name}</span>
                    </div>
                    <div className="info-item">
                      <FaPhoneAlt className="text-muted" />
                      <span>{selectedBooking.provider?.phone}</span>
                    </div>
                    <div className="info-item">
                      <FaServicestack className="text-muted" />
                      <span><strong>Service:</strong> {selectedBooking.service?.title}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaBan className="me-2" /> Cancel Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-3" style={{ borderRadius: '12px' }}>
            Are you sure you want to cancel this booking?
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Reason</Form.Label>
              <Form.Select
                value={cancellationData.reason}
                onChange={(e) => setCancellationData({ ...cancellationData, reason: e.target.value })}
              >
                <option value="">Select reason...</option>
                <option value="customer_request">Customer requested</option>
                <option value="provider_unavailable">Provider unavailable</option>
                <option value="payment_issue">Payment issue</option>
                <option value="duplicate">Duplicate booking</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Process refund"
                checked={cancellationData.refund}
                onChange={(e) => setCancellationData({ ...cancellationData, refund: e.target.checked })}
              />
            </Form.Group>
            {cancellationData.refund && (
              <Form.Group>
                <Form.Label className="fw-semibold">Refund Amount</Form.Label>
                <Form.Control
                  type="number"
                  value={cancellationData.refundAmount}
                  onChange={(e) => setCancellationData({ ...cancellationData, refundAmount: parseFloat(e.target.value) })}
                  min="0"
                  step="100"
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowCancelModal(false)}>
            Keep Booking
          </Button>
          <Button variant="danger" onClick={handleCancelBooking} disabled={processing}>
            {processing ? 'Processing...' : 'Cancel Booking'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Complete Modal */}
      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success">
            <FaCheckCircle className="me-2" /> Complete Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="success" className="mb-0" style={{ borderRadius: '12px' }}>
            Mark this booking as completed?
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowCompleteModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCompleteBooking} disabled={processing}>
            {processing ? 'Processing...' : 'Complete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaCalendarAlt className="me-2" /> Reschedule Booking
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">New Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">New Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mt-3">
              <Form.Label className="fw-semibold">Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                placeholder="Reason for rescheduling..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowRescheduleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleReschedule} disabled={processing || !rescheduleData.date || !rescheduleData.time}>
            {processing ? 'Processing...' : 'Confirm Reschedule'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Dispute Modal */}
      <Modal show={showDisputeModal} onHide={() => setShowDisputeModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaExclamationTriangle className="me-2" /> Resolve Dispute
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedBooking?.dispute && (
            <div>
              <Alert variant="danger" className="mb-3" style={{ borderRadius: '12px' }}>
                <strong>Customer Message:</strong> {selectedBooking.dispute.customerMessage}
              </Alert>
              <div className="info-section">
                <h6 className="fw-bold mb-3">Dispute Details</h6>
                <div className="info-item">
                  <FaUser className="text-muted" />
                  <span><strong>Reported by:</strong> {selectedBooking.dispute.reportedBy}</span>
                </div>
                <div className="info-item">
                  <FaClock className="text-muted" />
                  <span><strong>Reported:</strong> {formatDistanceToNow(new Date(selectedBooking.dispute.createdAt), { addSuffix: true })}</span>
                </div>
                <div className="info-item">
                  <FaInfoCircle className="text-muted" />
                  <span><strong>Status:</strong> {selectedBooking.dispute.status}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDisputeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={() => {
              updateBookingStatus(selectedBooking.id, 'completed');
              setShowDisputeModal(false);
            }}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Resolve Dispute'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Selected bookings: <strong className="text-primary">{selectedBookings.length}</strong></p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkStatusChange('confirmed')}>
              <FaCheckCircle className="me-2" /> Confirm All
            </Button>
            <Button variant="danger" onClick={() => handleBulkStatusChange('cancelled')}>
              <FaBan className="me-2" /> Cancel All
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowBulkActions(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaDownload className="me-2" /> Export Bookings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Exporting <strong>{filteredBookings.length}</strong> bookings as <strong>{exportFormat.toUpperCase()}</strong></p>
          {processing && (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small">Generating export...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={processing}>
            {processing ? 'Exporting...' : 'Export'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
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
        .info-item:last-child { border-bottom: none; }
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
        .nav-tabs .nav-link:hover { background: #f8fafc; }
        .table > :not(caption) > * > * {
          padding: 16px 12px;
          vertical-align: middle;
        }
        .table tbody tr:hover { background-color: #f8fafc; }
        .table-active { background-color: #e7f1ff !important; }
      `}</style>
    </div>
  );
};

export default AdminBookings;