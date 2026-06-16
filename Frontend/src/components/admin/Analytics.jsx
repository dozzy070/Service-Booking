// src/pages/admin/Analytics.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Dropdown, Modal, Nav, ProgressBar, Pagination, Toast, ToastContainer, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { 
  FaChartLine, FaUsers, FaServicestack, FaCalendarCheck, FaMoneyBillWave, FaStar, 
  FaDownload, FaPrint, FaShare, FaFilter, FaSearch, FaSort, FaSortUp, FaSortDown, 
  FaEllipsisV, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaClock, FaFlag, 
  FaReply, FaTrash, FaEye, FaArrowUp, FaArrowDown, FaRedo, FaInfoCircle, FaTag, 
  FaThumbsUp, FaThumbsDown, FaCalendarAlt, FaFilePdf, FaFileExcel, FaFileAlt, 
  FaUserPlus, FaUserMinus, FaUserCheck, FaUserTimes, FaShoppingCart, FaWallet, 
  FaTrendingUp, FaTrendingDown, FaMinus, FaPlus, FaCloudUploadAlt, FaCloudDownloadAlt,
  FaExternalLinkAlt, FaLink, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, 
  FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaWhatsapp, FaTelegram
} from 'react-icons/fa';
import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Line, Bar, Pie, Doughnut, Area, ComposedChart, LineChart, BarChart, PieChart, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });

  // Analytics Data
  const [overview, setOverview] = useState({
    totalUsers: 0, newUsers: 0, activeUsers: 0, totalServices: 0, newServices: 0,
    pendingServices: 0, totalBookings: 0, completedBookings: 0, totalRevenue: 0,
    monthlyRevenue: 0, weeklyRevenue: 0, averageRating: 0, totalReviews: 0,
    conversionRate: 0, customerSatisfaction: 0, totalCustomers: 0, totalProviders: 0
  });
  const [trends, setTrends] = useState({ users: [], bookings: [], revenue: [] });
  const [distribution, setDistribution] = useState({
    usersByRole: [], servicesByCategory: [], revenueBySource: [], bookingsByStatus: []
  });
  const [performance, setPerformance] = useState({
    topProviders: [], topServices: [], peakHours: [], conversionRate: 0,
    averageResponseTime: 0, customerSatisfaction: 0
  });
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
  const [processing, setProcessing] = useState(false);

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

  // Show toast
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch all analytics data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { startDate: dateRange.start, endDate: dateRange.end };
      const [overviewRes, trendsRes, distributionRes, performanceRes, reviewsRes] = await Promise.all([
        adminAPI.getStats(params),
        adminAPI.getTrends(params),
        adminAPI.getDistribution(params),
        adminAPI.getPerformance(params),
        adminAPI.getReviews(params)
      ]);

      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setDistribution(distributionRes.data);
      setPerformance(performanceRes.data);
      setReviews(reviewsRes.data);
      setFilteredReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to load analytics data', 'danger');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    showToast('Data refreshed', 'info');
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Filter reviews
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

  // Date range handler
  const handleDateRangeChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let start = new Date();
    switch (period) {
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
  };

  // Review actions
  const handleApproveReview = async (reviewId) => {
    setProcessing(true);
    try {
      await adminAPI.approveReview(reviewId);
      showToast('Review approved', 'success');
      await fetchAllData();
    } catch (error) {
      showToast('Failed to approve review', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlagReview = async () => {
    if (!selectedReview) return;
    setProcessing(true);
    try {
      await adminAPI.flagReview(selectedReview.id);
      showToast('Review flagged', 'warning');
      setShowFlagModal(false);
      setSelectedReview(null);
      await fetchAllData();
    } catch (error) {
      showToast('Failed to flag review', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    setProcessing(true);
    try {
      await adminAPI.deleteReview(selectedReview.id);
      showToast('Review deleted', 'success');
      setShowDeleteModal(false);
      setSelectedReview(null);
      await fetchAllData();
    } catch (error) {
      showToast('Failed to delete review', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText) return;
    setProcessing(true);
    try {
      await adminAPI.respondToReview(selectedReview.id, responseText);
      showToast('Response added', 'success');
      setShowResponseModal(false);
      setResponseText('');
      setSelectedReview(null);
      await fetchAllData();
    } catch (error) {
      showToast('Failed to add response', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) return;
    setProcessing(true);
    try {
      await adminAPI.bulkReviewAction({ reviewIds: selectedReviews, action });
      showToast(`${selectedReviews.length} reviews ${action}ed`, 'success');
      setSelectedReviews([]);
      setShowBulkActions(false);
      await fetchAllData();
    } catch (error) {
      showToast('Bulk action failed', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  // Export functions
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
      ['Total Revenue', formatNaira(overview.totalRevenue)],
      ['Average Rating', overview.averageRating]
    ];
    doc.autoTable({
      startY: 52,
      head: [metricsData[0]],
      body: metricsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    showToast('PDF exported', 'success');
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const metrics = [
      ['Total Users', overview.totalUsers],
      ['New Users', overview.newUsers],
      ['Active Users', overview.activeUsers],
      ['Total Services', overview.totalServices],
      ['Total Bookings', overview.totalBookings],
      ['Total Revenue', formatNaira(overview.totalRevenue)],
      ['Average Rating', overview.averageRating]
    ];
    const csvRows = [
      headers.join(','),
      ...metrics.map(row => row.join(',')),
      '',
      'Top Providers',
      ['Provider', 'Services', 'Bookings', 'Rating', 'Revenue'].join(','),
      ...performance.topProviders.map(p =>
        [p.name, p.services, p.bookings, p.rating, formatNaira(p.revenue)].join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported', 'success');
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'success', icon: <FaCheckCircle />, label: 'Approved' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      flagged: { bg: 'danger', icon: <FaFlag />, label: 'Flagged' },
      rejected: { bg: 'danger', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const b = badges[status] || badges.pending;
    return <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">{b.icon}<span className="ms-1">{b.label}</span></Badge>;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<FaStar key={i} className={i <= rating ? 'text-warning' : 'text-secondary'} size={14} />);
    }
    return stars;
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

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredReviews.slice(start, end);
  }, [filteredReviews, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Toast */}
        <ToastContainer position="top-end" className="p-3">
          <Toast show={toastMessage.show} onClose={() => setToastMessage({ show: false, message: '', type: '' })} delay={3000} autohide bg={toastMessage.type}>
            <Toast.Header closeButton={false}>
              <strong className="me-auto">{toastMessage.type === 'success' ? 'Success' : toastMessage.type === 'danger' ? 'Error' : 'Info'}</strong>
            </Toast.Header>
            <Toast.Body>{toastMessage.message}</Toast.Body>
          </Toast>
        </ToastContainer>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Analytics & Insights</h2>
            <p className="text-muted mb-0">Monitor platform performance and manage user feedback</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={refreshData} disabled={refreshing} className="d-flex align-items-center gap-2">
              <FaRedo className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                <FaDownload /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToPDF}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
                <Dropdown.Item onClick={exportToCSV}><FaFileAlt className="me-2 text-info" /> CSV</Dropdown.Item>
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
                <Form.Select value={selectedPeriod} onChange={(e) => handleDateRangeChange(e.target.value)}>
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
                    <Form.Control type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                  </Col>
                  <Col lg={3}>
                    <Form.Label className="fw-semibold">End Date</Form.Label>
                    <Form.Control type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                  </Col>
                </>
              )}
            </Row>
          </Card.Body>
        </Card>

        {/* Tabs */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Nav variant="tabs" className="px-3 pt-3" style={{ borderBottom: 'none' }}>
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
            <Row className="g-4 mb-4">
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}><FaUsers size={24} color="#3b82f6" /></div>
                      <div><p className="text-muted mb-0 small">Total Users</p><h3 className="fw-bold mb-0">{overview.totalUsers.toLocaleString()}</h3></div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {overview.newUsers} new this month</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#10b98120' }}><FaServicestack size={24} color="#10b981" /></div>
                      <div><p className="text-muted mb-0 small">Total Services</p><h3 className="fw-bold mb-0">{overview.totalServices.toLocaleString()}</h3></div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {overview.newServices} new</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}><FaCalendarCheck size={24} color="#f59e0b" /></div>
                      <div><p className="text-muted mb-0 small">Total Bookings</p><h3 className="fw-bold mb-0">{overview.totalBookings.toLocaleString()}</h3></div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {overview.completedBookings} completed</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col xl={3} lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}><FaMoneyBillWave size={24} color="#8b5cf6" /></div>
                      <div><p className="text-muted mb-0 small">Total Revenue</p><h3 className="fw-bold mb-0">{formatCompactNaira(overview.totalRevenue)}</h3></div>
                    </div>
                    <div className="mt-2 text-success"><FaArrowUp size={12} /> {formatCompactNaira(overview.monthlyRevenue)} this month</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4">
              <Col lg={8}>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Platform Growth</h5></Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends.users.map((val, idx) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx], users: val }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                  <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">User Distribution</h5></Card.Header>
                  <Card.Body>
                    {distribution.usersByRole.map((item, idx) => (
                      <div key={idx} className="mb-3">
                        <div className="d-flex justify-content-between"><span>{item.role}</span><span className="fw-bold">{item.count}</span></div>
                        <ProgressBar now={item.percentage} variant={item.role === 'Customer' ? 'primary' : 'success'} style={{ height: '6px', borderRadius: '3px' }} />
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <Row className="g-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">User Growth</h5></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trends.users.map((val, idx) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx], users: val }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <Card.Body className="text-center py-5">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '150px', height: '150px' }}>
                    <FaUsers size={60} className="text-primary opacity-50" />
                  </div>
                  <Row>
                    <Col xs={6}><h6>Customers</h6><h4 className="text-primary">{overview.totalCustomers.toLocaleString()}</h4></Col>
                    <Col xs={6}><h6>Providers</h6><h4 className="text-success">{overview.totalProviders.toLocaleString()}</h4></Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <>
            <Row className="g-4 mb-4">
              <Col md={4}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Total Services</h5><h2 className="text-primary">{overview.totalServices.toLocaleString()}</h2></Card.Body></Card></Col>
              <Col md={4}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Pending Approval</h5><h2 className="text-warning">{overview.pendingServices}</h2></Card.Body></Card></Col>
              <Col md={4}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Categories</h5><h2 className="text-info">{distribution.servicesByCategory.length}</h2></Card.Body></Card></Col>
            </Row>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Top Performing Services</h5></Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead><tr><th>Service</th><th>Category</th><th className="text-center">Bookings</th><th className="text-end">Revenue</th><th className="text-center">Rating</th></tr></thead>
                  <tbody>
                    {performance.topServices.map(s => (
                      <tr key={s.id}>
                        <td>{s.title}</td>
                        <td><Badge bg="secondary" className="rounded-pill"><FaTag className="me-1" /> {s.category}</Badge></td>
                        <td className="text-center">{s.bookings}</td>
                        <td className="text-end fw-bold text-primary">{formatNaira(s.revenue)}</td>
                        <td className="text-center"><span className="text-warning"><FaStar className="me-1" /> {s.rating}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <Row className="g-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Booking Trends</h5></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trends.bookings.map((val, idx) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx], bookings: val }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Booking Status</h5></Card.Header>
                <Card.Body>
                  {distribution.bookingsByStatus.map((item, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="d-flex justify-content-between"><span className="fw-semibold">{item.status}</span><span className="text-muted">{item.count}</span></div>
                      <ProgressBar now={item.percentage} variant={item.status === 'Completed' ? 'success' : item.status === 'Pending' ? 'warning' : 'danger'} style={{ height: '6px', borderRadius: '3px' }} />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <Row className="g-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Revenue Growth</h5></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trends.revenue.map((val, idx) => ({ month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx], revenue: val }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => formatCompactNaira(v)} />
                      <Tooltip formatter={(v) => formatNaira(v)} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Body>
                  <h6 className="fw-bold mb-4">Revenue Summary</h6>
                  <div className="mb-3"><small className="text-muted">Total Revenue</small><h3 className="text-primary">{formatNaira(overview.totalRevenue)}</h3></div>
                  <div className="mb-3"><small className="text-muted">Monthly Revenue</small><h5>{formatNaira(overview.monthlyRevenue)}</h5></div>
                  <div><small className="text-muted">Average Booking Value</small><h5 className="text-success">{formatNaira(overview.totalBookings ? overview.totalRevenue / overview.totalBookings : 0)}</h5></div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <>
            <Row className="g-4 mb-4">
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Total Reviews</h5><h2 className="text-primary">{overview.totalReviews}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Average Rating</h5><h2 className="text-warning">{overview.averageRating.toFixed(1)} <FaStar size={20} /></h2></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Pending Moderation</h5><h2 className="text-warning">{reviews.filter(r => r.status === 'pending').length}</h2></Card.Body></Card></Col>
              <Col md={3}><Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}><Card.Body><h5>Flagged Reviews</h5><h2 className="text-danger">{reviews.filter(r => r.flagged).length}</h2></Card.Body></Card></Col>
            </Row>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col lg={4}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search reviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></InputGroup></Col>
                  <Col lg={2}><Form.Select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}><option value="all">All Ratings</option><option value="5">5 Stars</option><option value="4">4 Stars</option><option value="3">3 Stars</option><option value="2">2 Stars</option><option value="1">1 Star</option></Form.Select></Col>
                  <Col lg={2}><Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="flagged">Flagged</option></Form.Select></Col>
                  <Col lg={2}><Form.Select value={filterService} onChange={(e) => setFilterService(e.target.value)}><option value="all">All Services</option>{performance.topServices.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</Form.Select></Col>
                  <Col lg={2}><Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></Form.Select></Col>
                </Row>
                {selectedReviews.length > 0 && (
                  <div className="d-flex gap-2 mt-3 pt-3 border-top">
                    <Button size="sm" variant="success" onClick={() => handleBulkAction('approved')}><FaCheckCircle className="me-2" /> Approve ({selectedReviews.length})</Button>
                    <Button size="sm" variant="danger" onClick={() => handleBulkAction('flagged')}><FaFlag className="me-2" /> Flag ({selectedReviews.length})</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleBulkAction('deleted')}><FaTrash className="me-2" /> Delete ({selectedReviews.length})</Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Reviews Table */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}><Form.Check type="checkbox" checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0} onChange={handleSelectAll} /></th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('customerName')}>Customer {getSortIcon('customerName')}</th>
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('rating')}>Rating {getSortIcon('rating')}</th>
                        <th style={{ padding: '16px' }}>Review</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('helpful')}>Helpful {getSortIcon('helpful')}</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>Date {getSortIcon('createdAt')}</th>
                        <th style={{ padding: '16px', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReviews.map(review => (
                        <tr key={review.id} className={selectedReviews.includes(review.id) ? 'table-active' : ''}>
                          <td style={{ padding: '16px' }}><Form.Check type="checkbox" checked={selectedReviews.includes(review.id)} onChange={() => handleSelectReview(review.id)} /></td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <img src={review.customerAvatar || `https://ui-avatars.com/api/?name=${review.customerName}&background=6366f1&color=fff&size=30`} className="rounded-circle" style={{ width: '30px', height: '30px' }} alt="" />
                              <div><div className="fw-semibold">{review.customerName}</div><small className="text-muted">to {review.providerName}</small></div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}><div className="fw-semibold">{review.serviceTitle}</div></td>
                          <td style={{ padding: '16px' }}><div className="text-warning">{getRatingStars(review.rating)}</div></td>
                          <td style={{ padding: '16px' }}>
                            <div>{review.comment?.substring(0, 50)}...</div>
                            {review.response && <div className="text-success mt-1"><FaReply className="me-1" size={10} /> Responded</div>}
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(review.status)}</td>
                          <td style={{ padding: '16px' }} className="text-center"><div className="fw-semibold">{review.helpful || 0}</div></td>
                          <td style={{ padding: '16px' }}><small>{format(new Date(review.createdAt), 'MMM dd, yyyy')}</small></td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-1">
                              <Button size="sm" variant="outline-primary" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowReviewModal(true); }}><FaEye size={14} /></Button>
                              {review.status === 'pending' && <Button size="sm" variant="outline-success" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => handleApproveReview(review.id)}><FaCheckCircle size={14} /></Button>}
                              {review.status !== 'flagged' && <Button size="sm" variant="outline-danger" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowFlagModal(true); }}><FaFlag size={14} /></Button>}
                              {!review.response && <Button size="sm" variant="outline-info" className="rounded-circle p-1" style={{ width: '32px', height: '32px' }} onClick={() => { setSelectedReview(review); setShowResponseModal(true); }}><FaReply size={14} /></Button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {filteredReviews.length === 0 && (
                  <div className="text-center py-5"><FaStar size={48} className="text-muted mb-3 opacity-50" /><h6 className="text-muted">No reviews found</h6><Button variant="link" onClick={() => { setSearchTerm(''); setFilterRating('all'); setFilterStatus('all'); setFilterService('all'); }}>Reset Filters</Button></div>
                )}
                {filteredReviews.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length}</div>
                    <Pagination>
                      <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} />
                      {[...Array(Math.min(5, totalPages)).keys()].map(num => {
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
            <Col lg={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Top Providers</h5></Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead><tr><th>Provider</th><th className="text-center">Bookings</th><th className="text-end">Revenue</th><th className="text-center">Rating</th></tr></thead>
                    <tbody>
                      {performance.topProviders.map(p => (
                        <tr key={p.id}>
                          <td><div className="d-flex align-items-center gap-2"><img src={`https://ui-avatars.com/api/?name=${p.name}&background=10b981&color=fff&size=30`} className="rounded-circle" style={{ width: '30px', height: '30px' }} alt="" /><span className="fw-semibold">{p.name}</span></div></td>
                          <td className="text-center">{p.bookings}</td>
                          <td className="text-end fw-bold text-primary">{formatNaira(p.revenue)}</td>
                          <td className="text-center"><span className="text-warning"><FaStar className="me-1" /> {p.rating}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4"><h5 className="fw-bold mb-0">Peak Hours</h5></Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performance.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}>
                <Card.Body className="py-5"><h1 className="display-1 text-primary mb-0">{performance.conversionRate}%</h1><p className="text-muted">Conversion Rate</p><ProgressBar now={performance.conversionRate} variant="primary" style={{ height: '8px', borderRadius: '4px' }} /></Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '16px' }}>
                <Card.Body className="py-5"><h1 className="display-1 text-warning mb-0">{performance.customerSatisfaction.toFixed(1)}</h1><div className="text-warning mb-3">{getRatingStars(performance.customerSatisfaction)}</div><p className="text-muted">Customer Satisfaction</p></Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Modals */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Review Details</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          {selectedReview && (
            <>
              <div className="d-flex gap-3 mb-4">
                <img src={selectedReview.customerAvatar || `https://ui-avatars.com/api/?name=${selectedReview.customerName}&background=6366f1&color=fff&size=60`} className="rounded-circle" style={{ width: '60px', height: '60px' }} alt="" />
                <div><h5>{selectedReview.customerName}</h5><div className="text-warning">{getRatingStars(selectedReview.rating)}</div></div>
              </div>
              <h6>{selectedReview.title}</h6>
              <p>{selectedReview.comment}</p>
              {selectedReview.response && (
                <div className="mt-3 p-3 bg-light rounded-3"><strong>Response:</strong> {selectedReview.response}</div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showFlagModal} onHide={() => setShowFlagModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-danger"><FaFlag className="me-2" /> Flag Review</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>Flag this review for inappropriate content?</Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowFlagModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleFlagReview} disabled={processing}>{processing ? 'Processing...' : 'Flag'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold"><FaReply className="me-2" /> Respond to Review</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <Form.Group><Form.Label className="fw-semibold">Your Response</Form.Label><Form.Control as="textarea" rows={4} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your response..." /></Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmitResponse} disabled={processing || !responseText}>{processing ? 'Submitting...' : 'Submit Response'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold text-danger"><FaTrash className="me-2" /> Delete Review</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>Are you sure you want to delete this review? This action cannot be undone.</Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteReview} disabled={processing}>{processing ? 'Deleting...' : 'Delete'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Bulk Actions</Modal.Title></Modal.Header>
        <Modal.Body className="pt-4">
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkAction('approved')}><FaCheckCircle className="me-2" /> Approve All</Button>
            <Button variant="danger" onClick={() => handleBulkAction('flagged')}><FaFlag className="me-2" /> Flag All</Button>
            <Button variant="outline-danger" onClick={() => handleBulkAction('deleted')}><FaTrash className="me-2" /> Delete All</Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowBulkActions(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
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
        .table > :not(caption) > * > * { padding: 16px 12px; vertical-align: middle; }
        .table tbody tr:hover { background-color: #f8fafc; }
        .table-active { background-color: #e7f1ff !important; }
      `}</style>
    </div>
  );
};

export default Analytics;