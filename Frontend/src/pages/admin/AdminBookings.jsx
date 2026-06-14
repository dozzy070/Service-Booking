// src/pages/admin/AdminBookings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form, InputGroup,
  Badge, Dropdown, Modal, Nav, Pagination, Toast, ToastContainer
} from 'react-bootstrap';
import {
  FaCalendarCheck, FaClock, FaUser, FaServicestack, FaMoneyBillWave,
  FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaInfoCircle, FaSearch, FaSlidersH, FaSort, FaSortUp,
  FaSortDown, FaEllipsisV, FaEye, FaEdit, FaBan, FaCheck, FaCalendarAlt,
  FaDownload, FaPrint, FaRedo, FaFileCsv, FaFileExcel, FaFilePdf,
  FaRocket, FaUndo
} from 'react-icons/fa';
import api from '../../api';

const AdminBookings = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
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
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });

  // Real data state – no mock data
  const [bookings, setBookings] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [providersList, setProvidersList] = useState([]);
  // Customer filter removed because endpoint does not exist – can be added later

  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // API calls – no customer endpoint
  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      showToast('Failed to load bookings', 'danger');
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      setServicesList(res.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await api.get('/admin/providers');
      setProvidersList(res.data);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchBookings(), fetchServices(), fetchProviders()]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // CRUD operations (real API)
  const updateBookingStatus = async (bookingId, newStatus, additionalData = {}) => {
    try {
      await api.put(`/admin/bookings/${bookingId}`, { status: newStatus, ...additionalData });
      await fetchBookings();
      showToast(`Booking ${bookingId} updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Status update error:', err);
      showToast(err.response?.data?.message || 'Update failed', 'danger');
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
    try {
      await api.post('/admin/bookings/bulk-status', { ids: selectedBookings, status: newStatus });
      await fetchBookings();
      setSelectedBookings([]);
      setShowBulkActions(false);
      showToast(`${selectedBookings.length} bookings updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast('Bulk update failed', 'danger');
    }
  };

  // Export and print (placeholder)
  const handleExport = () => {
    showToast('Export started', 'info');
    // Full export implementation can be added later using filteredBookings
  };

  const handlePrint = () => {
    showToast('Print started', 'info');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterService('all');
    setFilterProvider('all');
    setDateRange({
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedPeriod('30days');
    setActiveTab('all');
    setCurrentPage(1);
    showToast('Filters reset', 'info');
  };

  // Selection helpers
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

  // Filtering and sorting (no customer filter)
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

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (startDate || endDate) {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.serviceDate);
        return (!startDate || bookingDate >= startDate) && (!endDate || bookingDate <= endDate);
      });
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'serviceDate') {
        aVal = new Date(`${a.serviceDate} ${a.serviceTime || ''}`).getTime();
        bVal = new Date(`${b.serviceDate} ${b.serviceTime || ''}`).getTime();
      } else if (sortConfig.key === 'amount') {
        aVal = a.service?.price || 0;
        bVal = b.service?.price || 0;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [bookings, activeTab, searchTerm, filterStatus, filterService, filterProvider, dateRange, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterStatus, filterService, filterProvider, dateRange]);

  // Statistics (real data)
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    disputed: bookings.filter(b => b.status === 'disputed').length,
    totalRevenue: bookings.reduce((acc, b) => acc + (b.payment?.status === 'paid' ? (b.service?.price || 0) : 0), 0),
  };

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
    return <Badge bg={badge.bg} className="d-flex align-items-center gap-1 py-2 px-3 rounded-pill">{badge.icon}<span>{badge.label}</span></Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { bg: 'success', icon: <FaCheckCircle />, label: 'Paid' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      refunded: { bg: 'info', icon: <FaUndo />, label: 'Refunded' },
      cancelled: { bg: 'danger', icon: <FaTimesCircle />, label: 'Cancelled' },
      held: { bg: 'danger', icon: <FaExclamationTriangle />, label: 'Held' }
    };
    const badge = badges[status] || badges.pending;
    return <Badge bg={badge.bg} className="d-flex align-items-center gap-1 py-1 px-2 rounded-pill">{badge.icon}<small>{badge.label}</small></Badge>;
  };

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || 0}`;

  return (
    <Container fluid className="bookings-container py-4" style={{ maxWidth: 1600, margin: '0 auto' }}>
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toastMessage.show} onClose={() => setToastMessage({ show: false, message: '', type: '' })} delay={3000} autohide bg={toastMessage.type}>
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{toastMessage.type === 'success' ? 'Success' : toastMessage.type === 'danger' ? 'Error' : 'Info'}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <Row className="mb-4">
        <Col><h2 className="mb-2">Booking Management</h2><p className="text-muted mb-0">Manage and monitor all bookings on the platform</p></Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowFilters(!showFilters)}><FaSlidersH className="me-2" /> {showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary"><FaDownload className="me-2" /> Export</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}><FaFileCsv className="me-2 text-success" /> CSV</Dropdown.Item>
              <Dropdown.Item onClick={() => { setExportFormat('excel'); setShowExportModal(true); }}><FaFileExcel className="me-2 text-success" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={() => { setExportFormat('pdf'); setShowExportModal(true); }}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="primary" onClick={handlePrint}><FaPrint className="me-2" /> Print</Button>
          <Button variant="outline-secondary" onClick={resetFilters}><FaRedo className="me-2" /> Reset</Button>
        </Col>
      </Row>

      {/* Date Range Selector */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <Form.Group><Form.Label>Period</Form.Label>
                <Form.Select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                  <option value="7days">Last 7 Days</option><option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option><option value="12months">Last 12 Months</option>
                  <option value="ytd">Year to Date</option><option value="custom">Custom Range</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {selectedPeriod === 'custom' && (
              <Col md={4}>
                <Form.Group><Form.Label>Custom Range</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                    <Form.Control type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                  </div>
                </Form.Group>
              </Col>
            )}
            <Col md={2} className="d-flex align-items-end"><Button variant="primary" className="w-100" onClick={() => showToast('Date range applied', 'info')}><FaSearch className="me-2" /> Apply</Button></Col>
            <Col md={3} className="d-flex align-items-end justify-content-end"><small className="text-muted">Showing {filteredBookings.length} of {bookings.length} bookings</small></Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm stats-card" onClick={() => setActiveTab('all')}><Card.Body className="d-flex align-items-center"><div className="stats-icon bg-primary bg-opacity-10 rounded-circle p-3 me-3"><FaCalendarCheck className="text-primary" size={20} /></div><div><h5 className="mb-1">{stats.total}</h5><small className="text-muted">Total Bookings</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm stats-card" onClick={() => setActiveTab('pending')}><Card.Body className="d-flex align-items-center"><div className="stats-icon bg-warning bg-opacity-10 rounded-circle p-3 me-3"><FaClock className="text-warning" size={20} /></div><div><h5 className="mb-1">{stats.pending}</h5><small className="text-muted">Pending</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm stats-card" onClick={() => setActiveTab('confirmed')}><Card.Body className="d-flex align-items-center"><div className="stats-icon bg-info bg-opacity-10 rounded-circle p-3 me-3"><FaCheckCircle className="text-info" size={20} /></div><div><h5 className="mb-1">{stats.confirmed}</h5><small className="text-muted">Confirmed</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm stats-card" onClick={() => setActiveTab('in_progress')}><Card.Body className="d-flex align-items-center"><div className="stats-icon bg-primary bg-opacity-10 rounded-circle p-3 me-3"><FaRocket className="text-primary" size={20} /></div><div><h5 className="mb-1">{stats.inProgress}</h5><small className="text-muted">In Progress</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm stats-card" onClick={() => setActiveTab('completed')}><Card.Body className="d-flex align-items-center"><div className="stats-icon bg-success bg-opacity-10 rounded-circle p-3 me-3"><FaCheckCircle className="text-success" size={20} /></div><div><h5 className="mb-1">{stats.completed}</h5><small className="text-muted">Completed</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm stats-card" onClick={() => setActiveTab('disputed')}><Card.Body className="d-flex align-items-center"><div className="stats-icon bg-danger bg-opacity-10 rounded-circle p-3 me-3"><FaExclamationTriangle className="text-danger" size={20} /></div><div><h5 className="mb-1">{stats.disputed}</h5><small className="text-muted">Disputed</small></div></Card.Body></Card></Col>
      </Row>

      {/* Tabs */}
      <Card className="border-0 shadow-sm mb-4"><Card.Body className="p-0"><Nav variant="tabs" className="px-3 pt-3">
        <Nav.Item><Nav.Link active={activeTab === 'all'} onClick={() => setActiveTab('all')} className="d-flex align-items-center gap-2">All Bookings <Badge bg="secondary" pill>{stats.total}</Badge></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>Pending {stats.pending > 0 && <Badge bg="warning" pill>{stats.pending}</Badge>}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={activeTab === 'confirmed'} onClick={() => setActiveTab('confirmed')}>Confirmed <Badge bg="info" pill>{stats.confirmed}</Badge></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={activeTab === 'in_progress'} onClick={() => setActiveTab('in_progress')}>In Progress <Badge bg="primary" pill>{stats.inProgress}</Badge></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>Completed <Badge bg="success" pill>{stats.completed}</Badge></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={activeTab === 'cancelled'} onClick={() => setActiveTab('cancelled')}>Cancelled <Badge bg="danger" pill>{stats.cancelled}</Badge></Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link active={activeTab === 'disputed'} onClick={() => setActiveTab('disputed')}>Disputed <Badge bg="danger" pill>{stats.disputed}</Badge></Nav.Link></Nav.Item>
      </Nav></Card.Body></Card>

      {/* Filters (collapsible) – customer filter removed */}
      {showFilters && (
        <Card className="border-0 shadow-sm mb-4"><Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                <option value="all">All Services</option>
                {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}>
                <option value="all">All Providers</option>
                {providersList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={1}>
              <Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                <option>10</option><option>25</option><option>50</option><option>100</option>
              </Form.Select>
            </Col>
          </Row>
          {selectedBookings.length > 0 && (
            <div className="d-flex gap-2 mt-3 pt-3 border-top">
              <Button variant="success" size="sm" onClick={() => setShowBulkActions(true)}>Bulk Actions ({selectedBookings.length})</Button>
              <Button variant="danger" size="sm" onClick={() => handleBulkStatusChange('cancelled')}>Cancel Selected</Button>
            </div>
          )}
        </Card.Body></Card>
      )}

      {/* Main Table */}
      <Card className="border-0 shadow-sm"><Card.Body className="p-0">
        <div className="table-responsive"><Table hover className="bookings-table mb-0">
          <thead className="bg-light"><tr>
            <th style={{ width: 40 }}><Form.Check checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0} onChange={handleSelectAll} /></th>
            <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>Booking ID {getSortIcon('id')}</th>
            <th onClick={() => handleSort('serviceDate')} style={{ cursor: 'pointer' }}>Date & Time {getSortIcon('serviceDate')}</th>
            <th>Customer</th><th>Provider</th><th>Service</th>
            <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>Amount {getSortIcon('amount')}</th>
            <th>Status</th><th>Payment</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {currentBookings.map(booking => (
              <tr key={booking.id} className={selectedBookings.includes(booking.id) ? 'table-active' : ''}>
                <td><Form.Check checked={selectedBookings.includes(booking.id)} onChange={() => handleSelectBooking(booking.id)} /></td>
                <td><span className="fw-semibold">{booking.id}</span><small className="d-block text-muted"><FaClock /> {new Date(booking.bookingDate).toLocaleDateString()}</small></td>
                <td><div>{booking.serviceDate}</div><small className="text-muted">{booking.serviceTime}</small></td>
                <td><div className="d-flex align-items-center gap-2"><img src={booking.customer?.avatar || `https://ui-avatars.com/api/?name=${booking.customer?.name}&background=3b82f6`} alt="" className="rounded-circle" style={{ width: 30, height: 30 }} /><div><div className="fw-semibold">{booking.customer?.name}</div><small>ID: {booking.customer?.id}</small></div></div></td>
                <td><div className="d-flex align-items-center gap-2"><img src={booking.provider?.avatar || `https://ui-avatars.com/api/?name=${booking.provider?.name}&background=10b981`} alt="" className="rounded-circle" style={{ width: 30, height: 30 }} /><div><div className="fw-semibold">{booking.provider?.name}</div><small><FaStar className="text-warning" /> {booking.provider?.rating}</small></div></div></td>
                <td><div><div className="fw-semibold">{booking.service?.title}</div><small className="text-muted">{booking.service?.category}</small></div></td>
                <td><div className="fw-bold text-primary">{formatCurrency(booking.service?.price)}</div><small>{booking.service?.duration} hrs</small></td>
                <td>{getStatusBadge(booking.status)}</td>
                <td>{getPaymentStatusBadge(booking.payment?.status)}<small className="d-block text-muted">{booking.payment?.method}</small></td>
                <td><div className="d-flex gap-2">
                  <Button size="sm" variant="outline-primary" onClick={() => { setSelectedBooking(booking); setModalMode('view'); setShowBookingModal(true); }}><FaEye /></Button>
                  {booking.status === 'pending' && (<><Button size="sm" variant="outline-success" onClick={() => updateBookingStatus(booking.id, 'confirmed')}><FaCheck /></Button><Button size="sm" variant="outline-danger" onClick={() => { setSelectedBooking(booking); setCancellationData({ reason: '', refund: true, refundAmount: booking.service?.price }); setShowCancelModal(true); }}><FaBan /></Button></>)}
                  {booking.status === 'confirmed' && (<><Button size="sm" variant="outline-warning" onClick={() => { setSelectedBooking(booking); setShowRescheduleModal(true); }}><FaCalendarAlt /></Button><Button size="sm" variant="outline-success" onClick={() => { setSelectedBooking(booking); setShowCompleteModal(true); }}><FaCheckCircle /></Button></>)}
                  {booking.status === 'in_progress' && (<Button size="sm" variant="outline-success" onClick={() => { setSelectedBooking(booking); setShowCompleteModal(true); }}><FaCheckCircle /></Button>)}
                  {booking.status === 'disputed' && (<Button size="sm" variant="outline-danger" onClick={() => { setSelectedBooking(booking); setShowDisputeModal(true); }}><FaExclamationTriangle /></Button>)}
                  <Dropdown align="end"><Dropdown.Toggle size="sm" variant="outline-secondary"><FaEllipsisV /></Dropdown.Toggle><Dropdown.Menu><Dropdown.Item onClick={() => { setSelectedBooking(booking); setModalMode('edit'); setShowBookingModal(true); }}><FaEdit className="me-2" /> Edit</Dropdown.Item><Dropdown.Item onClick={() => { setSelectedBooking(booking); setCancellationData({ reason: '', refund: true, refundAmount: booking.service?.price }); setShowCancelModal(true); }}><FaBan className="me-2 text-danger" /> Cancel</Dropdown.Item></Dropdown.Menu></Dropdown>
                </div></td>
              </tr>
            ))}
          </tbody>
        </Table></div>
        {filteredBookings.length === 0 && (<div className="text-center py-5"><FaCalendarCheck size={48} className="text-muted mb-3" /><h5>No bookings found</h5><Button variant="primary" onClick={resetFilters}>Reset Filters</Button></div>)}
        {filteredBookings.length > 0 && (<div className="d-flex justify-content-between align-items-center p-3 border-top"><div>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length}</div><Pagination className="mb-0">
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
          {[...Array(Math.min(5, totalPages)).keys()].map(num => {
            let pageNum = num + 1;
            if (totalPages > 5) {
              if (currentPage <= 3) pageNum = num + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + num;
              else pageNum = currentPage - 2 + num;
            }
            return <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;
          })}
          <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
        </Pagination></div>)}
      </Card.Body></Card>

      {/* Modals (simplified) */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton><Modal.Title><FaDownload className="me-2" /> Export Bookings</Modal.Title></Modal.Header>
        <Modal.Body>Exporting {filteredBookings.length} bookings as {exportFormat.toUpperCase()}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button><Button variant="primary" onClick={handleExport}>Export</Button></Modal.Footer>
      </Modal>

      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light"><Modal.Title>{modalMode === 'view' ? 'Booking Details' : 'Edit Booking'}</Modal.Title></Modal.Header>
        <Modal.Body>{selectedBooking && (modalMode === 'view' ? <div><h5>{selectedBooking.id}</h5><p>{selectedBooking.notes}</p></div> : <Form>{/* edit form */}</Form>)}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowBookingModal(false)}>Close</Button></Modal.Footer>
      </Modal>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white"><Modal.Title>Cancel Booking</Modal.Title></Modal.Header>
        <Modal.Body><Form><Form.Group><Form.Label>Reason</Form.Label><Form.Select value={cancellationData.reason} onChange={(e) => setCancellationData({ ...cancellationData, reason: e.target.value })}><option>Select reason</option><option value="customer_request">Customer requested</option><option value="provider_unavailable">Provider unavailable</option><option value="payment_issue">Payment issue</option></Form.Select></Form.Group></Form></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Booking</Button><Button variant="danger" onClick={handleCancelBooking}>Cancel Booking</Button></Modal.Footer>
      </Modal>

      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white"><Modal.Title>Complete Booking</Modal.Title></Modal.Header>
        <Modal.Body>Mark as completed?</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowCompleteModal(false)}>Cancel</Button><Button variant="success" onClick={handleCompleteBooking}>Complete</Button></Modal.Footer>
      </Modal>

      <Modal show={showRescheduleModal} onHide={() => setShowRescheduleModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Reschedule</Modal.Title></Modal.Header>
        <Modal.Body><Row><Col><Form.Control type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} /></Col><Col><Form.Control type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })} /></Col></Row></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</Button><Button variant="primary" onClick={handleReschedule}>Confirm</Button></Modal.Footer>
      </Modal>

      <Modal show={showDisputeModal} onHide={() => setShowDisputeModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-danger text-white"><Modal.Title>Resolve Dispute</Modal.Title></Modal.Header>
        <Modal.Body>{selectedBooking?.dispute && <div>{selectedBooking.dispute.customerMessage}</div>}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowDisputeModal(false)}>Close</Button><Button variant="success" onClick={() => { updateBookingStatus(selectedBooking.id, 'completed'); setShowDisputeModal(false); }}>Resolve</Button></Modal.Footer>
      </Modal>

      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton><Modal.Title>Bulk Actions</Modal.Title></Modal.Header>
        <Modal.Body><div className="d-grid gap-2"><Button variant="success" onClick={() => handleBulkStatusChange('confirmed')}>Confirm All</Button><Button variant="danger" onClick={() => handleBulkStatusChange('cancelled')}>Cancel All</Button></div></Modal.Body>
      </Modal>

      <style>{`
        .stats-card { transition: all 0.2s; border-radius: 12px; cursor: pointer; }
        .stats-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
        .stats-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
        .bookings-table th { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 1rem 0.75rem; }
        .bookings-table td { padding: 1rem 0.75rem; vertical-align: middle; }
        .nav-tabs .nav-link.active { color: #6366f1; border-bottom: 2px solid #6366f1; background: none; }
      `}</style>
    </Container>
  );
};

export default AdminBookings;