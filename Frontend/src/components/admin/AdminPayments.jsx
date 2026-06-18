// src/pages/admin/Payment.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Pagination,
  ProgressBar,
  Nav,
  Toast,
  ToastContainer,
  Spinner,
  Alert,
  Tabs,
  Tab
} from 'react-bootstrap';
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaWallet,
  FaPercentage,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUndo,
  FaDownload,
  FaPrint,
  FaFilter,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaEye,
  FaRedo,
  FaArrowUp,
  FaArrowRight,
  FaCcVisa,
  FaCcMastercard,
  FaPaypal,
  FaUniversity,
  FaBitcoin,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaCalendarAlt,
  FaBalanceScale,
  FaSpinner,
  FaBan,
  FaSync,
  FaInfoCircle,
  FaExclamationTriangle,
  FaUserTie,
  FaUserCircle,
  FaUsers,
  FaShoppingCart,
  FaChartBar,
  FaMinus,
  FaPlus,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaArrowRight as FaArrowRightIcon
} from 'react-icons/fa';
import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';
import { Line, Bar, Pie, Doughnut, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Payment = () => {
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
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Data State
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    pendingPayouts: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    revenueGrowth: 0
  });
  const [revenueByMethod, setRevenueByMethod] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [commissionRates, setCommissionRates] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0
  });

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

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

  const formatNumber = (num) => (num || 0).toLocaleString();

  const showToast = (message, type = 'success') => {
    toast[type](message);
  };

  // API Calls
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { startDate: dateRange.start, endDate: dateRange.end };
      
      const [overviewRes, revenueRes, transactionsRes, payoutsRes, trendsRes] = await Promise.all([
        adminAPI.getPaymentOverview(params),
        adminAPI.getRevenueByMethod(params),
        adminAPI.getTransactions(params),
        adminAPI.getPayouts(params),
        adminAPI.getPaymentTrends(params)
      ]);

      setOverview(overviewRes.data);
      setRevenueByMethod(revenueRes.data);
      setTransactions(transactionsRes.data);
      setPayouts(payoutsRes.data);
      setMonthlyTrend(trendsRes.data);

      // Calculate transaction stats
      const stats = {
        completed: transactionsRes.data.filter(t => t.status === 'completed').length,
        pending: transactionsRes.data.filter(t => t.status === 'pending' || t.status === 'processing').length,
        failed: transactionsRes.data.filter(t => t.status === 'failed').length,
        refunded: transactionsRes.data.filter(t => t.status === 'refunded').length
      };
      setTransactionStats(stats);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      showToast('Failed to load payment data', 'danger');
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
  }, [fetchAllData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Filter transactions
  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.id?.toLowerCase().includes(term) ||
        tx.customer?.toLowerCase().includes(term) ||
        tx.provider?.toLowerCase().includes(term) ||
        tx.service?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') filtered = filtered.filter(tx => tx.status === filterStatus);
    if (filterMethod !== 'all') filtered = filtered.filter(tx => tx.method === filterMethod);
    if (filterType !== 'all') filtered = filtered.filter(tx => tx.type === filterType);

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'amount' || sortConfig.key === 'fee' || sortConfig.key === 'net') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      if (sortConfig.key === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, searchTerm, filterStatus, filterMethod, filterType, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId) ? prev.filter(id => id !== transactionId) : [...prev, transactionId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedTransactions.length === 0) return;
    setProcessingAction(true);
    try {
      await adminAPI.bulkTransactionAction({ transactionIds: selectedTransactions, action });
      showToast(`${selectedTransactions.length} transactions ${action}ed`, 'success');
      setSelectedTransactions([]);
      setShowBulkActions(false);
      await fetchAllData();
    } catch (error) {
      showToast('Bulk action failed', 'danger');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;
    setProcessingAction(true);
    try {
      await adminAPI.refundTransaction(selectedTransaction.id, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      });
      showToast('Refund processed successfully', 'success');
      setShowRefundModal(false);
      setSelectedTransaction(null);
      setRefundAmount('');
      setRefundReason('');
      await fetchAllData();
    } catch (error) {
      showToast('Refund failed', 'danger');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDateRangeChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let start = new Date();
    switch(period) {
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

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMethod('all');
    setFilterType('all');
    setDateRange({
      start: subDays(new Date(), 30).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedPeriod('30days');
    setCurrentPage(1);
    showToast('Filters reset', 'info');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await adminAPI.exportTransactions({
        format: exportFormat,
        startDate: dateRange.start,
        endDate: dateRange.end,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        method: filterMethod !== 'all' ? filterMethod : undefined
      });
      
      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 
              exportFormat === 'excel' ? 'application/vnd.ms-excel' : 
              'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'pdf' ? 'pdf' : exportFormat === 'excel' ? 'xls' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast(`Exported ${filteredTransactions.length} transactions`, 'success');
      setShowExportModal(false);
    } catch (error) {
      showToast('Export failed', 'danger');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'success', icon: <FaCheckCircle />, label: 'Completed' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      failed: { bg: 'danger', icon: <FaTimesCircle />, label: 'Failed' },
      refunded: { bg: 'info', icon: <FaUndo />, label: 'Refunded' },
      processing: { bg: 'info', icon: <FaSpinner />, label: 'Processing' }
    };
    const b = badges[status] || badges.pending;
    return <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">{b.icon}<span className="ms-1">{b.label}</span></Badge>;
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'card': return <FaCcVisa className="text-primary" />;
      case 'paypal': return <FaPaypal className="text-primary" />;
      case 'bank': return <FaUniversity className="text-success" />;
      case 'crypto': return <FaBitcoin className="text-warning" />;
      default: return <FaMoneyBillWave className="text-secondary" />;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Chart colors
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Toast Container */}
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          {/* Toast messages handled by react-hot-toast */}
        </div>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Payment Management</h2>
            <p className="text-muted mb-0">Monitor transactions, manage payouts, and track payment analytics</p>
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
              <Col lg={3} className="d-flex align-items-end gap-2">
                <Button variant="primary" onClick={fetchAllData} className="w-100">
                  <FaSearch className="me-2" /> Apply
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Overview Stats */}
        <Row className="g-4 mb-4">
          <Col xl={3} lg={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Revenue</p>
                    <h2 className="fw-bold mb-0">{formatNaira(overview.totalRevenue)}</h2>
                    <small className={`text-${overview.revenueGrowth >= 0 ? 'success' : 'danger'} d-flex align-items-center gap-1 mt-1`}>
                      {overview.revenueGrowth >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                      {Math.abs(overview.revenueGrowth)}% from last period
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaMoneyBillWave size={24} color="#3b82f6" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={3} lg={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Transactions</p>
                    <h2 className="fw-bold mb-0">{formatNumber(overview.totalTransactions)}</h2>
                    <small className="text-success d-flex align-items-center gap-1 mt-1">
                      <FaCheckCircle size={12} /> {overview.successfulTransactions} successful
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaCreditCard size={24} color="#10b981" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={3} lg={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Pending Payouts</p>
                    <h2 className="fw-bold mb-0">{formatNaira(overview.pendingPayouts)}</h2>
                    <small className="text-warning d-flex align-items-center gap-1 mt-1">
                      <FaClock size={12} /> Awaiting processing
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaWallet size={24} color="#f59e0b" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={3} lg={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Conversion Rate</p>
                    <h2 className="fw-bold mb-0">{overview.conversionRate}%</h2>
                    <small className="text-success d-flex align-items-center gap-1 mt-1">
                      <FaTrendingUp size={12} /> +5.2% vs last month
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <FaChartLine size={24} color="#8b5cf6" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transaction Stats */}
        <Row className="g-4 mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                  <FaCheckCircle size={18} color="#10b981" />
                </div>
                <div>
                  <small className="text-muted d-block">Completed</small>
                  <span className="fw-bold">{transactionStats.completed}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle p-2" style={{ background: '#f59e0b20' }}>
                  <FaClock size={18} color="#f59e0b" />
                </div>
                <div>
                  <small className="text-muted d-block">Pending</small>
                  <span className="fw-bold">{transactionStats.pending}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle p-2" style={{ background: '#ef444420' }}>
                  <FaTimesCircle size={18} color="#ef4444" />
                </div>
                <div>
                  <small className="text-muted d-block">Failed</small>
                  <span className="fw-bold">{transactionStats.failed}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3 d-flex align-items-center gap-3">
                <div className="rounded-circle p-2" style={{ background: '#8b5cf620' }}>
                  <FaUndo size={18} color="#8b5cf6" />
                </div>
                <div>
                  <small className="text-muted d-block">Refunded</small>
                  <span className="fw-bold">{transactionStats.refunded}</span>
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
                <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                  <FaChartLine className="me-2" /> Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
                  <FaMoneyBillWave className="me-2" /> Transactions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')}>
                  <FaWallet className="me-2" /> Payouts
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')}>
                  <FaCalendarAlt className="me-2" /> Subscriptions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'commissions'} onClick={() => setActiveTab('commissions')}>
                  <FaPercentage className="me-2" /> Commissions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')}>
                  <FaBalanceScale className="me-2" /> Disputes
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <Row className="g-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4">
                  <h6 className="fw-bold mb-0">Revenue Trend</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => formatCompactNaira(v)} />
                      <Tooltip formatter={(v) => formatNaira(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4">
                  <h6 className="fw-bold mb-0">Revenue by Method</h6>
                </Card.Header>
                <Card.Body>
                  {revenueByMethod.map((item, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>{item.method}</span>
                        <span className="fw-bold">{formatNaira(item.amount)}</span>
                      </div>
                      <ProgressBar 
                        now={item.percentage} 
                        variant={['primary', 'success', 'warning', 'info', 'danger'][idx % 5]} 
                        style={{ height: '6px', borderRadius: '3px' }} 
                      />
                      <small className="text-muted">{item.percentage}% • {item.count} transactions</small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <>
            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <InputGroup style={{ maxWidth: '300px' }}>
                    <InputGroup.Text><FaSearch size={14} /></InputGroup.Text>
                    <Form.Control 
                      placeholder="Search transactions..." 
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
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </Form.Select>
                  <Form.Select 
                    style={{ width: '150px' }} 
                    value={filterMethod} 
                    onChange={(e) => setFilterMethod(e.target.value)}
                  >
                    <option value="all">All Methods</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
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
                {selectedTransactions.length > 0 && (
                  <div className="d-flex gap-2 mt-3 pt-3 border-top">
                    <Button size="sm" variant="success" onClick={() => handleBulkAction('export')}>
                      <FaDownload className="me-2" /> Export ({selectedTransactions.length})
                    </Button>
                    <Button size="sm" variant="warning" onClick={() => setShowBulkActions(true)}>
                      <FaUndo className="me-2" /> Bulk Actions
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Transactions Table */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ minWidth: '1200px' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0} 
                            onChange={handleSelectAll} 
                          />
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                          ID {getSortIcon('id')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('date')}>
                          Date {getSortIcon('date')}
                        </th>
                        <th style={{ padding: '16px' }}>Customer</th>
                        <th style={{ padding: '16px' }}>Provider</th>
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                          Amount {getSortIcon('amount')}
                        </th>
                        <th style={{ padding: '16px' }}>Method</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                          Status {getSortIcon('status')}
                        </th>
                        <th style={{ padding: '16px', width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTransactions.map(tx => (
                        <tr key={tx.id} className={selectedTransactions.includes(tx.id) ? 'table-active' : ''}>
                          <td style={{ padding: '16px' }}>
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedTransactions.includes(tx.id)} 
                              onChange={() => handleSelectTransaction(tx.id)} 
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className="text-primary fw-medium">#{tx.id.slice(-8)}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>{format(new Date(tx.date), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{format(new Date(tx.date), 'hh:mm a')}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <FaUserCircle className="text-muted" />
                              <span>{tx.customer}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <FaUserTie className="text-muted" />
                              <span>{tx.provider}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>{tx.service}</td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-bold text-primary">{formatNaira(tx.amount)}</div>
                            <small className="text-muted">Fee: {formatNaira(tx.fee)}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-1">
                              {getPaymentIcon(tx.method)}
                              <span className="small">{tx.method}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(tx.status)}</td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="rounded-circle p-1" 
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => { 
                                  setSelectedTransaction(tx); 
                                  setShowTransactionModal(true); 
                                }}
                              >
                                <FaEye size={14} />
                              </Button>
                              {tx.status === 'completed' && (
                                <Button 
                                  size="sm" 
                                  variant="outline-warning" 
                                  className="rounded-circle p-1" 
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => { 
                                    setSelectedTransaction(tx); 
                                    setShowRefundModal(true); 
                                    setRefundAmount(tx.amount); 
                                  }}
                                >
                                  <FaUndo size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-5">
                    <FaMoneyBillWave size={48} className="text-muted mb-3 opacity-50" />
                    <h6 className="text-muted">No transactions found</h6>
                    <Button variant="link" onClick={resetFilters} className="mt-2">Reset Filters</Button>
                  </div>
                )}
                {filteredTransactions.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </div>
                    <Pagination>
                      <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1} />
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = idx + 1;
                        else if (currentPage <= 3) pageNum = idx + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                        else pageNum = currentPage - 2 + idx;
                        return (
                          <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Pending Payouts</h6>
                <Button variant="outline-primary" size="sm">
                  <FaPlus className="me-2" /> Process All
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px' }}>Provider</th>
                      <th style={{ padding: '12px' }}>Amount</th>
                      <th style={{ padding: '12px' }}>Method</th>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout, idx) => (
                      <tr key={idx}>
                        <td>{payout.provider}</td>
                        <td className="fw-bold text-primary">{formatNaira(payout.amount)}</td>
                        <td>{payout.method}</td>
                        <td>{format(new Date(payout.date), 'MMM dd, yyyy')}</td>
                        <td>{getStatusBadge(payout.status)}</td>
                        <td>
                          <Button size="sm" variant="success" className="me-1">
                            <FaCheck size={12} /> Process
                          </Button>
                          <Button size="sm" variant="danger">
                            <FaTimes size={12} /> Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="text-center py-5">
              <FaCalendarAlt size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">Subscription Plans</h6>
              <p className="text-muted small">Manage subscription plans and recurring payments</p>
            </Card.Body>
          </Card>
        )}

        {/* COMMISSIONS TAB */}
        {activeTab === 'commissions' && (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="text-center py-5">
              <FaPercentage size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">Commission Rates</h6>
              <p className="text-muted small">Configure commission rates for different service categories</p>
            </Card.Body>
          </Card>
        )}

        {/* DISPUTES TAB */}
        {activeTab === 'disputes' && (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="text-center py-5">
              <FaBalanceScale size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">Disputes & Chargebacks</h6>
              <p className="text-muted small">Manage payment disputes and chargebacks</p>
            </Card.Body>
          </Card>
        )}
      </Container>

      {/* Transaction Details Modal */}
      <Modal show={showTransactionModal} onHide={() => setShowTransactionModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedTransaction && (
            <div>
              <div className="text-center mb-4">
                <div className={`rounded-circle d-inline-flex p-3 mb-3 ${selectedTransaction.status === 'completed' ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                  {selectedTransaction.status === 'completed' ? (
                    <FaCheckCircle size={32} className="text-success" />
                  ) : (
                    <FaClock size={32} className="text-warning" />
                  )}
                </div>
                <h5 className="mb-1">Transaction #{selectedTransaction.id}</h5>
                <p className="text-muted">{format(new Date(selectedTransaction.date), 'MMMM dd, yyyy hh:mm a')}</p>
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Customer Details</h6>
                    <div className="info-item"><FaUserCircle className="text-muted" /> <span>{selectedTransaction.customer}</span></div>
                    <div className="info-item"><FaInfoCircle className="text-muted" /> <span>{selectedTransaction.customer_email}</span></div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Payment Details</h6>
                    <div className="info-item"><FaMoneyBillWave className="text-muted" /> <span className="fw-bold text-primary">{formatNaira(selectedTransaction.amount)}</span></div>
                    <div className="info-item"><FaCreditCard className="text-muted" /> <span>{selectedTransaction.method}</span></div>
                    <div className="info-item"><FaCheckCircle className="text-muted" /> <span>{getStatusBadge(selectedTransaction.status)}</span></div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>Close</Button>
          {selectedTransaction?.status === 'completed' && (
            <Button variant="warning" onClick={() => {
              setShowTransactionModal(false);
              setShowRefundModal(true);
            }}>
              <FaUndo className="me-2" /> Process Refund
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-warning">
            <FaUndo className="me-2" /> Process Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <FaInfoCircle className="me-2" />
            Refund amount cannot exceed the original transaction amount.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Refund Amount (₦)</Form.Label>
              <Form.Control
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                min="0"
                step="100"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Refund Reason</Form.Label>
              <Form.Select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              >
                <option value="">Select reason...</option>
                <option value="customer_request">Customer Request</option>
                <option value="service_issue">Service Issue</option>
                <option value="duplicate_payment">Duplicate Payment</option>
                <option value="fraud">Suspected Fraud</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowRefundModal(false)}>Cancel</Button>
          <Button variant="warning" onClick={handleRefund} disabled={processingAction}>
            {processingAction ? 'Processing...' : 'Process Refund'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaDownload className="me-2" /> Export Transactions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Exporting <strong>{filteredTransactions.length}</strong> transactions as <strong>{exportFormat.toUpperCase()}</strong></p>
          {isExporting && (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small">Generating export...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowExportModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Selected transactions: <strong className="text-primary">{selectedTransactions.length}</strong></p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkAction('export')}>
              <FaDownload className="me-2" /> Export Selected
            </Button>
            <Button variant="warning" onClick={() => handleBulkAction('refund')}>
              <FaUndo className="me-2" /> Refund Selected
            </Button>
            <Button variant="danger" onClick={() => handleBulkAction('flag')}>
              <FaBan className="me-2" /> Flag for Review
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowBulkActions(false)}>Cancel</Button>
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

export default Payment;