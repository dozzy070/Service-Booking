// src/pages/admin/Analytics.jsx
import React, { useState, useEffect, useRef } from 'react';
// import api from '../../api';  // Uncomment when backend is ready
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
  Nav,
  ProgressBar,
  Pagination,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import {
  FaChartLine,
  FaUsers,
  FaServicestack,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaStar,
  FaDownload,
  FaPrint,
  FaShare,
  FaFilter,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaFlag,
  FaReply,
  FaTrash,
  FaEye,
  FaArrowUp,
  FaArrowDown,
  FaRedo,
  FaInfoCircle,
  FaTag,
  FaThumbsUp,
  FaThumbsDown,
  FaCalendarAlt,
  FaFilePdf,
  FaFileExcel,
  FaFileAlt
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Analytics = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });

  // Analytics Data – all empty (no mock)
  const [overview, setOverview] = useState({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    totalServices: 0,
    newServices: 0,
    pendingServices: 0,
    totalBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    conversionRate: 0,
    customerSatisfaction: 0,
    totalCustomers: 0,
    totalProviders: 0
  });
  const [trends, setTrends] = useState({
    users: Array(12).fill(0),
    bookings: Array(12).fill(0),
    revenue: Array(12).fill(0)
  });
  const [distribution, setDistribution] = useState({
    usersByRole: [],
    servicesByCategory: [],
    revenueBySource: [],
    bookingsByStatus: []
  });
  const [performance, setPerformance] = useState({
    topProviders: [],
    topServices: [],
    peakHours: [],
    conversionRate: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0
  });

  // Reviews Data
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const refreshIntervalRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // ========== API CALLS – COMMENTED OUT (no 404 errors) ==========
  // Uncomment when backend endpoints are ready.

  /*
  const fetchOverview = async () => {
    try {
      const response = await api.get('/admin/analytics/overview', {
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchTrends = async () => {
    try {
      const [usersRes, bookingsRes, revenueRes] = await Promise.all([
        api.get('/admin/analytics/trends/users', { params: { startDate: dateRange.start, endDate: dateRange.end } }),
        api.get('/admin/analytics/trends/bookings', { params: { startDate: dateRange.start, endDate: dateRange.end } }),
        api.get('/admin/analytics/trends/revenue', { params: { startDate: dateRange.start, endDate: dateRange.end } })
      ]);
      setTrends({
        users: usersRes.data,
        bookings: bookingsRes.data,
        revenue: revenueRes.data
      });
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const fetchDistribution = async () => {
    try {
      const [usersByRole, servicesByCategory, revenueBySource, bookingsByStatus] = await Promise.all([
        api.get('/admin/analytics/distribution/users-by-role'),
        api.get('/admin/analytics/distribution/services-by-category'),
        api.get('/admin/analytics/distribution/revenue-by-source'),
        api.get('/admin/analytics/distribution/bookings-by-status')
      ]);
      setDistribution({
        usersByRole: usersByRole.data,
        servicesByCategory: servicesByCategory.data,
        revenueBySource: revenueBySource.data,
        bookingsByStatus: bookingsByStatus.data
      });
    } catch (error) {
      console.error('Error fetching distribution:', error);
    }
  };

  const fetchPerformance = async () => {
    try {
      const [topProviders, topServices, peakHours, conversion, satisfaction] = await Promise.all([
        api.get('/admin/analytics/performance/top-providers'),
        api.get('/admin/analytics/performance/top-services'),
        api.get('/admin/analytics/performance/peak-hours'),
        api.get('/admin/analytics/performance/conversion-rate'),
        api.get('/admin/analytics/performance/customer-satisfaction')
      ]);
      setPerformance({
        topProviders: topProviders.data,
        topServices: topServices.data,
        peakHours: peakHours.data,
        conversionRate: conversion.data.rate,
        customerSatisfaction: satisfaction.data.rating,
        averageResponseTime: 2.5
      });
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        search: searchTerm,
        rating: filterRating !== 'all' ? filterRating : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        serviceId: filterService !== 'all' ? filterService : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        page: currentPage,
        limit: itemsPerPage
      };
      const response = await api.get('/admin/analytics/reviews', { params });
      setReviews(response.data.reviews);
      setFilteredReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchOverview(),
      fetchTrends(),
      fetchDistribution(),
      fetchPerformance(),
      fetchReviews()
    ]);
  };
  */

  // Temporary placeholder – remove when API calls are uncommented
  const fetchAllData = () => {
    console.log('API calls are disabled – backend analytics endpoints not yet implemented.');
    // For demo, you can optionally set some initial data here if needed
  };

  const handleRefresh = () => {
    fetchAllData();
    showToast('Data refreshed (demo)', 'info');
  };

  const handleDateRangeChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let start = new Date();
    switch (period) {
      case '7days': start.setDate(today.getDate() - 7); break;
      case '30days': start.setDate(today.getDate() - 30); break;
      case '90days': start.setDate(today.getDate() - 90); break;
      case '12months': start.setMonth(today.getMonth() - 12); break;
      case 'ytd': start = new Date(today.getFullYear(), 0, 1); break;
      default: start.setDate(today.getDate() - 30);
    }
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRating('all');
    setFilterStatus('all');
    setFilterService('all');
    setCurrentPage(1);
    setSortConfig({ key: 'createdAt', direction: 'desc' });
    showToast('Filters reset', 'info');
  };

  // Review actions (placeholders – will call real APIs when uncommented)
  const handleApproveReview = async (reviewId) => {
    console.log('Approve review', reviewId);
    showToast('Review approved (demo)', 'success');
  };

  const handleFlagReview = async () => {
    if (!selectedReview) return;
    console.log('Flag review', selectedReview.id);
    setShowFlagModal(false);
    setSelectedReview(null);
    showToast('Review flagged (demo)', 'warning');
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    console.log('Delete review', selectedReview.id);
    setShowDeleteModal(false);
    setSelectedReview(null);
    showToast('Review deleted (demo)', 'success');
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText) return;
    console.log('Respond to review', selectedReview.id, responseText);
    setShowResponseModal(false);
    setResponseText('');
    setSelectedReview(null);
    showToast('Response added (demo)', 'success');
  };

  const handleBulkAction = async (action) => {
    console.log('Bulk action', action, selectedReviews);
    setSelectedReviews([]);
    setShowBulkActions(false);
    showToast(`${selectedReviews.length} reviews ${action}ed (demo)`, 'success');
  };

  // Local filtering (fallback – reviews will be empty until API is active)
  useEffect(() => {
    let filtered = [...reviews];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.customerName?.toLowerCase().includes(term) ||
        r.providerName?.toLowerCase().includes(term) ||
        r.serviceTitle?.toLowerCase().includes(term) ||
        r.comment?.toLowerCase().includes(term)
      );
    }
    if (filterRating !== 'all') filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    if (filterStatus !== 'all') filtered = filtered.filter(r => r.status === filterStatus);
    if (filterService !== 'all') filtered = filtered.filter(r => r.serviceId === parseInt(filterService));
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'rating' || sortConfig.key === 'helpful') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (sortConfig.key === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [reviews, searchTerm, filterRating, filterStatus, filterService, sortConfig]);

  // Initial load – no auto-refresh until APIs are active
  useEffect(() => {
    fetchAllData();
    // Uncomment when APIs are ready:
    // refreshIntervalRef.current = setInterval(fetchAllData, 30000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  // Export functions (still work on empty data)
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Analytics Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 38);
    doc.setFontSize(14);
    doc.text('Key Metrics', 14, 48);
    const metricsData = [
      ['Metric', 'Value'],
      ['Total Users', overview.totalUsers],
      ['New Users', overview.newUsers],
      ['Active Users', overview.activeUsers],
      ['Total Services', overview.totalServices],
      ['Total Bookings', overview.totalBookings],
      ['Total Revenue', `$${overview.totalRevenue.toLocaleString()}`],
      ['Average Rating', overview.averageRating]
    ];
    doc.autoTable({
      startY: 52,
      head: [metricsData[0]],
      body: metricsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text('Top Providers', 14, finalY);
    const providersData = [
      ['Provider', 'Services', 'Bookings', 'Rating', 'Revenue'],
      ...performance.topProviders.map(p => [
        p.name,
        p.services,
        p.bookings,
        p.rating,
        `$${p.revenue?.toLocaleString()}`
      ])
    ];
    if (providersData.length > 1) {
      doc.autoTable({
        startY: finalY + 5,
        head: [providersData[0]],
        body: providersData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });
    }
    doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('PDF exported', 'success');
  };

  const exportToExcel = () => {
    // XLSX removed for security reasons; export as CSV instead
    const wsData = [
      ['Analytics Report', '', ''],
      [`Generated: ${new Date().toLocaleString()}`, '', ''],
      [`Period: ${dateRange.start} to ${dateRange.end}`, '', ''],
      [],
      ['Key Metrics', '', ''],
      ['Metric', 'Value', ''],
      ['Total Users', overview.totalUsers, ''],
      ['New Users', overview.newUsers, ''],
      ['Active Users', overview.activeUsers, ''],
      ['Total Services', overview.totalServices, ''],
      ['Total Bookings', overview.totalBookings, ''],
      ['Total Revenue', overview.totalRevenue, ''],
      ['Average Rating', overview.averageRating, ''],
      [],
      ['Top Providers', '', ''],
      ['Provider', 'Services', 'Bookings', 'Rating', 'Revenue'],
      ...performance.topProviders.map(p => [p.name, p.services, p.bookings, p.rating, p.revenue]),
      [],
      ['Top Services', '', ''],
      ['Service', 'Category', 'Bookings', 'Rating', 'Revenue'],
      ...performance.topServices.map(s => [s.title, s.category, s.bookings, s.rating, s.revenue])
    ];
    // fallback to CSV export for security
    exportToCSV();
    showToast('Excel export replaced by CSV for security', 'warning');
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const metrics = [
      ['Total Users', overview.totalUsers],
      ['New Users', overview.newUsers],
      ['Active Users', overview.activeUsers],
      ['Total Services', overview.totalServices],
      ['Total Bookings', overview.totalBookings],
      ['Total Revenue', overview.totalRevenue],
      ['Average Rating', overview.averageRating]
    ];
    const csvRows = [
      headers.join(','),
      ...metrics.map(row => row.join(',')),
      '',
      'Top Providers',
      ['Provider', 'Services', 'Bookings', 'Rating', 'Revenue'].join(','),
      ...performance.topProviders.map(p =>
        [p.name, p.services, p.bookings, p.rating, p.revenue].join(',')
      ),
      '',
      'Top Services',
      ['Service', 'Category', 'Bookings', 'Rating', 'Revenue'].join(','),
      ...performance.topServices.map(s =>
        [s.title, s.category, s.bookings, s.rating, s.revenue].join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Analytics Report</title>
      <style>body{font-family:Arial;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f2f2f2}</style>
      </head><body>
      <h1>Analytics Report</h1>
      <p>Period: ${dateRange.start} to ${dateRange.end}</p>
      <h2>Key Metrics</h2>
      <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
      <tr><td>Total Users</td><td>${overview.totalUsers}</td></tr>
      <tr><td>New Users</td><td>${overview.newUsers}</td></tr>
      <tr><td>Total Bookings</td><td>${overview.totalBookings}</td></tr>
      <tr><td>Total Revenue</td><td>$${overview.totalRevenue.toLocaleString()}</td></tr>
      </tbody></table>
      <h2>Top Providers</h2>
      <table><thead><tr><th>Provider</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>
      ${performance.topProviders.map(p => `<tr><td>${p.name}</td><td>${p.bookings}</td><td>$${p.revenue}</td></tr>`).join('')}
      </tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    showToast('Print started', 'info');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Analytics Report',
      text: `Platform Analytics Report - ${dateRange.start} to ${dateRange.end}`,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared', 'success');
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      showToast('Link copied', 'success');
    }
  };

  const formatCurrency = (amount) => `$${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const formatNumber = (num) => (num || 0).toLocaleString();

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<FaStar key={i} className={i <= rating ? 'text-warning' : 'text-secondary'} />);
    }
    return stars;
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'success', icon: <FaCheckCircle />, label: 'Approved' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      flagged: { bg: 'danger', icon: <FaFlag />, label: 'Flagged' }
    };
    const b = badges[status] || badges.pending;
    return <Badge bg={b.bg} className="d-flex align-items-center gap-1 py-2 px-3 rounded-pill">{b.icon}<span>{b.label}</span></Badge>;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
    }
  };

  const handleSelectReview = (id) => {
    setSelectedReviews(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Container fluid className="analytics-container py-4">
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
        <Col>
          <h2 className="mb-2">Analytics & Reviews</h2>
          <p className="text-muted mb-0">Monitor platform performance and manage user reviews</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-primary" onClick={handleRefresh}>
            <FaRedo className="me-2" /> Refresh
          </Button>
          <Button variant="outline-primary" onClick={() => setShowFilters(!showFilters)}>
            <FaFilter className="me-2" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary"><FaDownload className="me-2" /> Export</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={exportToPDF}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
              <Dropdown.Item onClick={exportToExcel}><FaFileExcel className="me-2 text-success" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={exportToCSV}><FaFileAlt className="me-2 text-info" /> CSV</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="primary" onClick={handlePrint}><FaPrint className="me-2" /> Print</Button>
          <Button variant="info" onClick={handleShare}><FaShare className="me-2" /> Share</Button>
        </Col>
      </Row>

      {/* Date Range */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Period</Form.Label>
                <Form.Select value={selectedPeriod} onChange={(e) => handleDateRangeChange(e.target.value)}>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="12months">Last 12 Months</option>
                  <option value="ytd">Year to Date</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {selectedPeriod === 'custom' && (
              <>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-0">
          <Nav variant="tabs" className="px-3 pt-3">
            <Nav.Item><Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><FaChartLine className="me-2" /> Overview</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'users'} onClick={() => setActiveTab('users')}><FaUsers className="me-2" /> Users</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'services'} onClick={() => setActiveTab('services')}><FaServicestack className="me-2" /> Services</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')}><FaCalendarCheck className="me-2" /> Bookings</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')}><FaMoneyBillWave className="me-2" /> Revenue</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}><FaStar className="me-2" /> Reviews</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'performance'} onClick={() => setActiveTab('performance')}><FaChartLine className="me-2" /> Performance</Nav.Link></Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <Row className="g-3 mb-4">
            <Col xl={3} lg={6}><Card className="border-0 shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3"><FaUsers size={24} className="text-primary" /></div><div><h3 className="mb-0">{formatNumber(overview.totalUsers)}</h3><small className="text-muted">Total Users</small></div></div><div className="text-success mt-2"><FaArrowUp /> {overview.newUsers} new this month</div></Card.Body></Card></Col>
            <Col xl={3} lg={6}><Card className="border-0 shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-success bg-opacity-10 rounded-circle p-3 me-3"><FaServicestack size={24} className="text-success" /></div><div><h3 className="mb-0">{formatNumber(overview.totalServices)}</h3><small className="text-muted">Active Services</small></div></div><div className="text-success mt-2"><FaArrowUp /> {overview.newServices} new</div></Card.Body></Card></Col>
            <Col xl={3} lg={6}><Card className="border-0 shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3"><FaCalendarCheck size={24} className="text-warning" /></div><div><h3 className="mb-0">{formatNumber(overview.totalBookings)}</h3><small className="text-muted">Total Bookings</small></div></div><div className="text-success mt-2"><FaArrowUp /> {overview.completedBookings} completed</div></Card.Body></Card></Col>
            <Col xl={3} lg={6}><Card className="border-0 shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-info bg-opacity-10 rounded-circle p-3 me-3"><FaMoneyBillWave size={24} className="text-info" /></div><div><h3 className="mb-0">{formatCurrency(overview.totalRevenue)}</h3><small className="text-muted">Total Revenue</small></div></div><div className="text-success mt-2"><FaArrowUp /> {formatCurrency(overview.monthlyRevenue)} this month</div></Card.Body></Card></Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Platform Growth</h5></Card.Header>
                <Card.Body><div style={{ height: '300px' }}><Row className="h-100 align-items-end">{trends.users.map((val, idx) => (<Col key={idx} className="text-center"><div style={{ height: `${(val / Math.max(...trends.users, 1)) * 100}%`, backgroundColor: '#6366f1' }} className="chart-bar"><span className="chart-tooltip">{val}</span></div><small className="text-muted mt-2 d-block">{idx === 0 ? 'Jan' : idx === 11 ? 'Dec' : ''}</small></Col>))}</Row></div></Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">User Distribution</h5></Card.Header>
                <Card.Body>{distribution.usersByRole.length === 0 ? <div className="text-muted text-center py-4">No data available</div> : distribution.usersByRole.map((item, idx) => (<div key={idx} className="mb-3"><div className="d-flex justify-content-between"><span>{item.role}</span><span className="fw-bold">{item.count}</span></div><ProgressBar now={item.percentage} variant={item.role === 'Customer' ? 'primary' : 'success'} style={{ height: '8px' }} /><small className="text-muted">{item.percentage}%</small></div>))}</Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Services by Category</h5></Card.Header>
                <Card.Body>{distribution.servicesByCategory.length === 0 ? <div className="text-muted text-center py-4">No data available</div> : distribution.servicesByCategory.map((item, idx) => (<div key={idx} className="mb-3"><div className="d-flex justify-content-between"><span>{item.category}</span><span className="fw-bold">{item.count}</span></div><ProgressBar now={item.percentage} variant="info" style={{ height: '8px' }} /><small className="text-muted">{item.percentage}%</small></div>))}</Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Revenue by Source</h5></Card.Header>
                <Card.Body>{distribution.revenueBySource.length === 0 ? <div className="text-muted text-center py-4">No data available</div> : distribution.revenueBySource.map((item, idx) => (<div key={idx} className="mb-3"><div className="d-flex justify-content-between"><span>{item.source}</span><span className="fw-bold">{formatCurrency(item.amount)}</span></div><ProgressBar now={item.percentage} variant="success" style={{ height: '8px' }} /><small className="text-muted">{item.percentage}%</small></div>))}</Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <Row className="g-4">
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">User Growth</h5></Card.Header>
              <Card.Body><div style={{ height: '300px' }}><Row className="h-100 align-items-end">{trends.users.map((val, idx) => (<Col key={idx} className="text-center"><div style={{ height: `${(val / Math.max(...trends.users, 1)) * 100}%`, backgroundColor: '#10b981' }} className="chart-bar"><span className="chart-tooltip">{val}</span></div><small className="text-muted mt-2 d-block">{idx === 0 ? 'Jan' : idx === 11 ? 'Dec' : ''}</small></Col>))}</Row></div></Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">User Demographics</h5></Card.Header>
              <Card.Body className="text-center py-4"><div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '200px', height: '200px' }}><FaUsers size={80} className="text-primary opacity-50" /></div><Row><Col xs={6}><h6>Customers</h6><h4 className="text-primary">{formatNumber(overview.totalCustomers)}</h4></Col><Col xs={6}><h6>Providers</h6><h4 className="text-success">{formatNumber(overview.totalProviders)}</h4></Col></Row></Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Total Services</h5><h2 className="text-primary">{formatNumber(overview.totalServices)}</h2></Card.Body></Card></Col>
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Pending Approval</h5><h2 className="text-warning">{overview.pendingServices}</h2></Card.Body></Card></Col>
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Categories</h5><h2 className="text-info">{distribution.servicesByCategory.length}</h2></Card.Body></Card></Col>
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Avg. Price</h5><h2 className="text-success">$185</h2></Card.Body></Card></Col>
          </Row>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Top Performing Services</h5></Card.Header>
            <Card.Body>{performance.topServices.length === 0 ? <div className="text-muted text-center py-4">No data available</div> : <Table responsive><thead><tr><th>Service</th><th>Category</th><th className="text-center">Bookings</th><th className="text-end">Revenue</th><th className="text-center">Rating</th></tr></thead><tbody>{performance.topServices.map(s => (<tr key={s.id}><td>{s.title}</td><td><Badge bg="secondary"><FaTag className="me-1" /> {s.category}</Badge></td><td className="text-center">{s.bookings}</td><td className="text-end fw-bold text-primary">{formatCurrency(s.revenue)}</td><td className="text-center"><span className="text-warning"><FaStar className="me-1" /> {s.rating}</span></td></tr>))}</tbody></Table>}</Card.Body>
          </Card>
        </>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <Row className="g-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Booking Trends</h5></Card.Header>
              <Card.Body><div style={{ height: '300px' }}><Row className="h-100 align-items-end">{trends.bookings.map((val, idx) => (<Col key={idx} className="text-center"><div style={{ height: `${(val / Math.max(...trends.bookings, 1)) * 100}%`, backgroundColor: '#f59e0b' }} className="chart-bar"><span className="chart-tooltip">{val}</span></div><small className="text-muted mt-2 d-block">{idx === 0 ? 'Jan' : idx === 11 ? 'Dec' : ''}</small></Col>))}</Row></div></Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Booking Status</h5></Card.Header>
              <Card.Body>{distribution.bookingsByStatus.length === 0 ? <div className="text-muted text-center py-4">No data available</div> : distribution.bookingsByStatus.map((item, idx) => (<div key={idx} className="mb-4"><div className="d-flex justify-content-between"><span className="fw-semibold">{item.status}</span><span className="text-muted">{item.count}</span></div><ProgressBar now={item.percentage} variant={item.status === 'Completed' ? 'success' : item.status === 'Pending' ? 'warning' : 'danger'} style={{ height: '10px' }} /><small className="text-muted">{item.percentage}%</small></div>))}</Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* REVENUE TAB */}
      {activeTab === 'revenue' && (
        <Row className="g-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Revenue Growth</h5></Card.Header>
              <Card.Body><div style={{ height: '300px' }}><Row className="h-100 align-items-end">{trends.revenue.map((val, idx) => (<Col key={idx} className="text-center"><div style={{ height: `${(val / Math.max(...trends.revenue, 1)) * 100}%`, backgroundColor: '#10b981' }} className="chart-bar"><span className="chart-tooltip">${(val / 1000).toFixed(0)}k</span></div><small className="text-muted mt-2 d-block">{idx === 0 ? 'Jan' : idx === 11 ? 'Dec' : ''}</small></Col>))}</Row></div></Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4"><Card.Body><h6 className="mb-3">Revenue Summary</h6><div className="mb-3"><small className="text-muted">Total Revenue</small><h3 className="text-primary">{formatCurrency(overview.totalRevenue)}</h3></div><div><small className="text-muted">Monthly Revenue</small><h5>{formatCurrency(overview.monthlyRevenue)}</h5></div><div><small className="text-muted">Average Booking Value</small><h5 className="text-success">$125</h5></div></Card.Body></Card>
          </Col>
        </Row>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Total Reviews</h5><h2 className="text-primary">{formatNumber(overview.totalReviews)}</h2></Card.Body></Card></Col>
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Average Rating</h5><h2 className="text-warning">{overview.averageRating} <FaStar size={20} /></h2></Card.Body></Card></Col>
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Pending Moderation</h5><h2 className="text-warning">{reviews.filter(r => r.status === 'pending').length}</h2></Card.Body></Card></Col>
            <Col md={3}><Card className="border-0 shadow-sm text-center"><Card.Body><h5>Flagged Reviews</h5><h2 className="text-danger">{reviews.filter(r => r.flagged).length}</h2></Card.Body></Card></Col>
          </Row>

          {/* Filters */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={4}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search reviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></InputGroup></Col>
                <Col md={2}><Form.Select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}><option value="all">All Ratings</option><option value="5">5 Stars</option><option value="4">4 Stars</option><option value="3">3 Stars</option><option value="2">2 Stars</option><option value="1">1 Star</option></Form.Select></Col>
                <Col md={2}><Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="flagged">Flagged</option></Form.Select></Col>
                <Col md={2}><Form.Select value={filterService} onChange={(e) => setFilterService(e.target.value)}><option value="all">All Services</option>{performance.topServices.map(s => (<option key={s.id} value={s.id}>{s.title}</option>))}</Form.Select></Col>
                <Col md={2}><Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}><option value="10">10 per page</option><option value="25">25</option><option value="50">50</option></Form.Select></Col>
              </Row>
              {selectedReviews.length > 0 && (<div className="d-flex gap-2 mt-3 pt-3 border-top"><Button size="sm" variant="success" onClick={() => handleBulkAction('approved')}><FaCheckCircle className="me-2" /> Approve ({selectedReviews.length})</Button><Button size="sm" variant="danger" onClick={() => handleBulkAction('flagged')}><FaFlag className="me-2" /> Flag ({selectedReviews.length})</Button><Button size="sm" variant="outline-danger" onClick={() => handleBulkAction('deleted')}><FaTrash className="me-2" /> Delete ({selectedReviews.length})</Button></div>)}
            </Card.Body>
          </Card>

          {/* Reviews Table */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="reviews-table mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '40px' }}><Form.Check type="checkbox" checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0} onChange={handleSelectAll} /></th>
                      <th onClick={() => handleSort('customerName')}>Customer {getSortIcon('customerName')}</th>
                      <th>Service</th>
                      <th onClick={() => handleSort('rating')}>Rating {getSortIcon('rating')}</th>
                      <th>Review</th>
                      <th onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                      <th onClick={() => handleSort('helpful')}>Helpful {getSortIcon('helpful')}</th>
                      <th onClick={() => handleSort('createdAt')}>Date {getSortIcon('createdAt')}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReviews.map(review => (
                      <tr key={review.id} className={selectedReviews.includes(review.id) ? 'table-active' : ''}>
                        <td><Form.Check type="checkbox" checked={selectedReviews.includes(review.id)} onChange={() => handleSelectReview(review.id)} /></td>
                        <td><div className="d-flex align-items-center gap-2"><img src={review.customerAvatar || `https://ui-avatars.com/api/?name=${review.customerName}&background=6366f1&color=fff&size=30`} alt="" className="rounded-circle" style={{ width: 30, height: 30 }} /><div><div className="fw-semibold">{review.customerName}</div><small className="text-muted">to {review.providerName}</small></div></div></td>
                        <td><div><div className="fw-semibold">{review.serviceTitle}</div><small className="text-muted">{review.providerName}</small></div></td>
                        <td><div className="text-warning">{getRatingStars(review.rating)}</div></td>
                        <td><div className="review-preview"><div className="fw-semibold">{review.title}</div><small className="text-muted">{review.comment?.substring(0, 50)}...</small>{review.response && <div className="text-success mt-1"><FaReply className="me-1" size={10} /> <small>Responded</small></div>}</div></td>
                        <td>{getStatusBadge(review.status)}</td>
                        <td className="text-center"><div className="fw-semibold">{review.helpful}</div><small className="text-muted">{review.notHelpful}</small></td>
                        <td><small><FaCalendarAlt className="me-1" /> {new Date(review.createdAt).toLocaleDateString()}</small></td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => { setSelectedReview(review); setShowReviewModal(true); }}><FaEye /></Button>
                            {review.status === 'pending' && <Button size="sm" variant="outline-success" onClick={() => handleApproveReview(review.id)}><FaCheckCircle /></Button>}
                            {review.status !== 'flagged' && <Button size="sm" variant="outline-danger" onClick={() => { setSelectedReview(review); setShowFlagModal(true); }}><FaFlag /></Button>}
                            {!review.response && <Button size="sm" variant="outline-info" onClick={() => { setSelectedReview(review); setShowResponseModal(true); }}><FaReply /></Button>}
                            <Dropdown>
                              <Dropdown.Toggle size="sm" variant="outline-secondary"><FaEllipsisV /></Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item onClick={() => { setSelectedReview(review); setShowDeleteModal(true); }}><FaTrash className="me-2 text-danger" /> Delete</Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredReviews.length === 0 && (
                      <tr><td colSpan="9" className="text-center py-5"><FaStar size={48} className="text-muted mb-3" /><h5>No reviews found</h5><Button variant="primary" onClick={resetFilters}>Reset Filters</Button></td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
              {filteredReviews.length > 0 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReviews.length)} of {filteredReviews.length}</div>
                  <Pagination>
                    <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} />
                    {[...Array(Math.min(5,totalPages)).keys()].map(num => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = num + 1;
                      else if (currentPage <= 3) pageNum = num + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + num;
                      else pageNum = currentPage - 2 + num;
                      return <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;
                    })}
                    <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* PERFORMANCE TAB */}
      {activeTab === 'performance' && (
        <Row className="g-4">
          <Col lg={6}><Card className="border-0 shadow-sm"><Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Top Providers</h5></Card.Header><Card.Body>{performance.topProviders.length === 0 ? <div className="text-muted text-center py-4">No data available</div> : <Table><thead><tr><th>Provider</th><th className="text-center">Bookings</th><th className="text-end">Revenue</th><th className="text-center">Rating</th></tr></thead><tbody>{performance.topProviders.map(p => (<tr key={p.id}><td><div className="d-flex gap-2"><img src={`https://ui-avatars.com/api/?name=${p.name}&background=10b981&color=fff&size=30`} className="rounded-circle" style={{ width: 30, height: 30 }} alt="" /><span className="fw-semibold">{p.name}</span></div></td><td className="text-center">{p.bookings}</td><td className="text-end fw-bold text-primary">{formatCurrency(p.revenue)}</td><td className="text-center"><span className="text-warning"><FaStar className="me-1" /> {p.rating}</span></td></tr>))}</tbody></Table>}</Card.Body></Card></Col>
          <Col lg={6}><Card className="border-0 shadow-sm"><Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Peak Hours</h5></Card.Header><Card.Body><div style={{ height: '300px' }}><Row className="h-100 align-items-end">{performance.peakHours.length === 0 ? <Col className="text-muted text-center">No data available</Col> : performance.peakHours.map((item, idx) => (<Col key={idx} className="text-center"><div style={{ height: `${(item.bookings / Math.max(...performance.peakHours.map(h=>h.bookings),1)) * 100}%`, backgroundColor: '#8b5cf6' }} className="chart-bar"><span className="chart-tooltip">{item.bookings}</span></div><small className="text-muted mt-2 d-block">{item.hour}</small></Col>))}</Row></div></Card.Body></Card></Col>
          <Col lg={6}><Card className="border-0 shadow-sm"><Card.Body className="text-center py-5"><h1 className="display-1 text-primary mb-0">{performance.conversionRate}%</h1><p className="text-muted">Conversion Rate</p><ProgressBar now={performance.conversionRate} variant="primary" style={{ height: '10px' }} /></Card.Body></Card></Col>
          <Col lg={6}><Card className="border-0 shadow-sm"><Card.Body className="text-center py-5"><h1 className="display-1 text-warning mb-0">{performance.customerSatisfaction}</h1><div className="text-warning mb-3">{getRatingStars(performance.customerSatisfaction)}</div><p className="text-muted">Customer Satisfaction</p></Card.Body></Card></Col>
        </Row>
      )}

      {/* Modals */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg" centered><Modal.Header closeButton><Modal.Title>Review Details</Modal.Title></Modal.Header><Modal.Body>{selectedReview && (<><div className="d-flex gap-3 mb-4"><img src={selectedReview.customerAvatar || `https://ui-avatars.com/api/?name=${selectedReview.customerName}&background=6366f1&color=fff&size=60`} className="rounded-circle" style={{ width: 60, height: 60 }} alt="" /><div><h5>{selectedReview.customerName}</h5><div className="text-warning">{getRatingStars(selectedReview.rating)}</div></div></div><h6>{selectedReview.title}</h6><p>{selectedReview.comment}</p></>)}</Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowReviewModal(false)}>Close</Button></Modal.Footer></Modal>
      <Modal show={showFlagModal} onHide={() => setShowFlagModal(false)} centered><Modal.Header closeButton className="bg-danger text-white"><Modal.Title><FaFlag /> Flag Review</Modal.Title></Modal.Header><Modal.Body><p>Flag this review?</p><Form.Select><option>Inappropriate content</option><option>Spam</option></Form.Select></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowFlagModal(false)}>Cancel</Button><Button variant="danger" onClick={handleFlagReview}>Flag</Button></Modal.Footer></Modal>
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered><Modal.Header closeButton><Modal.Title><FaReply /> Respond to Review</Modal.Title></Modal.Header><Modal.Body><Form.Group><Form.Label>Response</Form.Label><Form.Control as="textarea" rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type response..." /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowResponseModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSubmitResponse}>Submit</Button></Modal.Footer></Modal>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered><Modal.Header closeButton className="bg-danger text-white"><Modal.Title>Confirm Delete</Modal.Title></Modal.Header><Modal.Body><p>Delete this review? This action cannot be undone.</p></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDeleteReview}>Delete</Button></Modal.Footer></Modal>
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered><Modal.Header closeButton><Modal.Title>Bulk Actions</Modal.Title></Modal.Header><Modal.Body><div className="d-grid gap-2"><Button variant="success" onClick={() => handleBulkAction('approved')}>Approve All</Button><Button variant="danger" onClick={() => handleBulkAction('flagged')}>Flag All</Button><Button variant="outline-danger" onClick={() => handleBulkAction('deleted')}>Delete All</Button></div></Modal.Body></Modal>

      <style>{`
        .analytics-container { max-width: 1600px; margin: 0 auto; }
        .chart-bar { width: 100%; border-radius: 8px 8px 0 0; position: relative; transition: all 0.3s; min-height: 20px; cursor: pointer; }
        .chart-bar:hover { opacity: 0.8; transform: scale(1.02); }
        .chart-tooltip { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; opacity: 0; transition: opacity 0.2s; white-space: nowrap; }
        .chart-bar:hover .chart-tooltip { opacity: 1; }
        .reviews-table th { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; padding: 1rem 0.75rem; }
        .reviews-table td { padding: 1rem 0.75rem; vertical-align: middle; }
        .nav-tabs .nav-link { color: #4b5563; border: none; padding: 0.75rem 1.5rem; }
        .nav-tabs .nav-link.active { color: #6366f1; font-weight: 600; border-bottom: 2px solid #6366f1; background: none; }
        @media (max-width: 768px) { .reviews-table td { min-width: 120px; } }
      `}</style>
    </Container>
  );
};

export default Analytics;