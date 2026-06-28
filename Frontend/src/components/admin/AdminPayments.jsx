// src/pages/admin/AdminPayments.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Spinner,
  Alert
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
  FaFilter,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaEye,
  FaArrowUp,
  FaArrowDown,
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
  FaPlus,
  FaCheck,
  FaTimes,
  FaChartBar
} from 'react-icons/fa';

import { format, subDays, subMonths } from 'date-fns';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const AdminPayments = () => {
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
  const [error, setError] = useState(null);

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
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0
  });

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

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

  const formatNumber = (num) => (num || 0).toLocaleString();

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // API Calls with proper error handling
  const fetchPaymentOverview = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getPaymentOverview !== 'function') {
        throw new Error('API service not available');
      }
      const params = { 
        startDate: dateRange.start, 
        endDate: dateRange.end 
      };
      const res = await adminAPI.getPaymentOverview(params);
      setOverview(res.data || overview);
    } catch (err) {
      console.error('Failed to fetch payment overview:', err);
      setError('Failed to load payment overview');
    }
  }, [dateRange]);

  const fetchRevenueByMethod = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getRevenueByMethod !== 'function') {
        throw new Error('API service not available');
      }
      const params = { 
        startDate: dateRange.start, 
        endDate: dateRange.end 
      };
      const res = await adminAPI.getRevenueByMethod(params);
      setRevenueByMethod(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch revenue by method:', err);
    }
  }, [dateRange]);

  const fetchPayments = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getPayments !== 'function') {
        throw new Error('API service not available');
      }
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        payment_method: filterMethod !== 'all' ? filterMethod : undefined,
        search: searchTerm || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        limit: itemsPerPage,
        page: currentPage
      };
      const res = await adminAPI.getPayments(params);
      
      const data = res?.data || [];
      const paymentsData = Array.isArray(data) ? data :
                          Array.isArray(data?.payments) ? data.payments :
                          Array.isArray(data?.data) ? data.data : [];
      setPayments(paymentsData);

      const stats = {
        completed: paymentsData.filter(p => p?.status && ['paid', 'completed'].includes(p.status.toLowerCase())).length,
        pending: paymentsData.filter(p => p?.status && ['pending', 'processing'].includes(p.status.toLowerCase())).length,
        failed: paymentsData.filter(p => p?.status && p.status.toLowerCase() === 'failed').length,
        refunded: paymentsData.filter(p => p?.status && p.status.toLowerCase() === 'refunded').length
      };
      setPaymentStats(stats);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load payments');
    }
  }, [dateRange, filterStatus, filterMethod, searchTerm, sortConfig, itemsPerPage, currentPage]);

  const fetchPayouts = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getPayouts !== 'function') {
        throw new Error('API service not available');
      }
      const params = { 
        startDate: dateRange.start, 
        endDate: dateRange.end 
      };
      const res = await adminAPI.getPayouts(params);
      setPayouts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch payouts:', err);
    }
  }, [dateRange]);

  const fetchPaymentTrends = useCallback(async () => {
    try {
      if (!adminAPI || typeof adminAPI.getPaymentTrends !== 'function') {
        throw new Error('API service not available');
      }
      const params = { 
        startDate: dateRange.start, 
        endDate: dateRange.end 
      };
      const res = await adminAPI.getPaymentTrends(params);
      setMonthlyTrend(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch payment trends:', err);
    }
  }, [dateRange]);

  // Fetch all data
  const fetchAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchPaymentOverview(),
        fetchRevenueByMethod(),
        fetchPayments(),
        fetchPayouts(),
        fetchPaymentTrends()
      ]);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
      setError('Failed to load payment data');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPaymentOverview, fetchRevenueByMethod, fetchPayments, fetchPayouts, fetchPaymentTrends]);

  // Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData(false);
    toast.success('Data refreshed');
  };

  // Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchAllData(false).finally(() => {
          isPolling.current = false;
        });
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

  // Initial load
  useEffect(() => {
    fetchAllData(true);
    startPolling();
    return () => stopPolling();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchAllData(false);
    }
  }, [dateRange, filterStatus, filterMethod, searchTerm, sortConfig, itemsPerPage, currentPage]);

  // Filter payments client-side for additional filtering
  useEffect(() => {
    const list = Array.isArray(payments) ? payments : [];
    let filtered = [...list];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p?.id?.toLowerCase().includes(term) ||
        p?.customer_name?.toLowerCase().includes(term) ||
        p?.provider_name?.toLowerCase().includes(term) ||
        p?.service_title?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') filtered = filtered.filter(p => p?.status?.toLowerCase() === filterStatus);
    if (filterMethod !== 'all') filtered = filtered.filter(p => p?.payment_method?.toLowerCase() === filterMethod);

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a?.[sortConfig.key];
        let bVal = b?.[sortConfig.key];
        if (sortConfig.key === 'amount' || sortConfig.key === 'total_amount') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        }
        if (sortConfig.key === 'created_at' || sortConfig.key === 'booking_date') {
          aVal = aVal ? new Date(aVal) : 0;
          bVal = bVal ? new Date(bVal) : 0;
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [payments, searchTerm, filterStatus, filterMethod, sortConfig]);

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
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(p => p?.id).filter(Boolean));
    }
  };

  const handleSelectPayment = (paymentId) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId) ? prev.filter(id => id !== paymentId) : [...prev, paymentId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedPayments.length === 0) return;
    setProcessingAction(true);
    try {
      if (!adminAPI || typeof adminAPI.bulkPaymentAction !== 'function') {
        throw new Error('API service not available');
      }
      await adminAPI.bulkPaymentAction({ paymentIds: selectedPayments, action });
      toast.success(`${selectedPayments.length} payments ${action}ed`);
      setSelectedPayments([]);
      setShowBulkActions(false);
      await fetchAllData(false);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error.message || 'Bulk action failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    setProcessingAction(true);
    try {
      if (!adminAPI || typeof adminAPI.refundPayment !== 'function') {
        throw new Error('API service not available');
      }
      await adminAPI.refundPayment(selectedPayment.id, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      });
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundAmount('');
      setRefundReason('');
      await fetchAllData(false);
    } catch (error) {
      console.error('Refund error:', error);
      toast.error(error.message || 'Refund failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDateRangeChange = (period) => {
    setSelectedPeriod(period);
    if (period === 'custom') return;
    
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
    setDateRange({
      start: subDays(new Date(), 30).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedPeriod('30days');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!adminAPI || typeof adminAPI.exportPayments !== 'function') {
        throw new Error('Export API not available');
      }
      const response = await adminAPI.exportPayments({
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
      a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'pdf' ? 'pdf' : exportFormat === 'excel' ? 'xls' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredPayments.length} payments`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

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
      paid: { bg: 'success', icon: <FaCheckCircle />, label: 'Paid' },
      completed: { bg: 'success', icon: <FaCheckCircle />, label: 'Completed' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      processing: { bg: 'info', icon: <FaSpinner />, label: 'Processing' },
      failed: { bg: 'danger', icon: <FaTimesCircle />, label: 'Failed' },
      refunded: { bg: 'info', icon: <FaUndo />, label: 'Refunded' }
    };
    const b = badges[lowerStatus] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
  };

  const getPaymentIcon = (method) => {
    if (!method) return <FaMoneyBillWave className="text-secondary" />;
    switch(method.toLowerCase()) {
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
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Loading state removed - component renders immediately with empty data

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Payment Management</h2>
            <p style={styles.headerSubtitle}>Monitor transactions, manage payouts, and track payment analytics</p>
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
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2" style={styles.exportBtn}>
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

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" style={styles.alert} dismissible onClose={() => setError(null)}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}

        {/* Date Range */}
        <Card style={styles.dateRangeCard}>
          <Card.Body style={styles.dateRangeCardBody}>
            <Row className="align-items-center g-3">
              <Col lg={3}>
                <Form.Label style={styles.formLabel}>Period</Form.Label>
                <Form.Select value={selectedPeriod} onChange={(e) => handleDateRangeChange(e.target.value)} style={styles.formControl}>
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
                    <Form.Label style={styles.formLabel}>Start Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={dateRange.start} 
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      style={styles.formControl}
                    />
                  </Col>
                  <Col lg={3}>
                    <Form.Label style={styles.formLabel}>End Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={dateRange.end} 
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      style={styles.formControl}
                    />
                  </Col>
                </>
              )}
              <Col lg={3} className="d-flex align-items-end gap-2">
                <Button variant="primary" onClick={() => fetchAllData(false)} style={styles.applyBtn}>
                  <FaSearch className="me-2" /> Apply
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Overview Stats */}
        <Row style={styles.statsRow}>
          {[
            { key: 'revenue', icon: FaMoneyBillWave, label: 'Total Revenue', value: formatNaira(overview.totalRevenue), color: '#3b82f6', bg: '#3b82f620', growth: overview.revenueGrowth },
            { key: 'transactions', icon: FaCreditCard, label: 'Total Transactions', value: formatNumber(overview.totalTransactions), color: '#10b981', bg: '#10b98120', detail: `${overview.successfulTransactions} successful` },
            { key: 'payouts', icon: FaWallet, label: 'Pending Payouts', value: formatNaira(overview.pendingPayouts), color: '#f59e0b', bg: '#f59e0b20', detail: 'Awaiting processing' },
            { key: 'conversion', icon: FaChartLine, label: 'Conversion Rate', value: `${overview.conversionRate}%`, color: '#8b5cf6', bg: '#8b5cf620', detail: '+5.2% vs last month' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Col xl={3} lg={6} key={idx}>
                <Card style={styles.statCard}>
                  <Card.Body style={styles.statCardBody}>
                    <div>
                      <p style={styles.statLabel}>{item.label}</p>
                      <h2 style={styles.statValue}>{item.value}</h2>
                      {item.growth !== undefined && (
                        <small className={`text-${item.growth >= 0 ? 'success' : 'danger'} d-flex align-items-center gap-1 mt-1`}>
                          {item.growth >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                          {Math.abs(item.growth)}% from last period
                        </small>
                      )}
                      {item.detail && (
                        <small className="text-success d-flex align-items-center gap-1 mt-1">
                          <FaCheckCircle size={12} /> {item.detail}
                        </small>
                      )}
                    </div>
                    <div style={{ ...styles.statIconWrapper, background: item.bg, color: item.color }}>
                      <Icon size={24} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Payment Stats */}
        <Row style={styles.paymentStatsRow}>
          {[
            { key: 'completed', icon: FaCheckCircle, label: 'Completed', value: paymentStats.completed, color: '#10b981', bg: '#10b98120' },
            { key: 'pending', icon: FaClock, label: 'Pending', value: paymentStats.pending, color: '#f59e0b', bg: '#f59e0b20' },
            { key: 'failed', icon: FaTimesCircle, label: 'Failed', value: paymentStats.failed, color: '#ef4444', bg: '#ef444420' },
            { key: 'refunded', icon: FaUndo, label: 'Refunded', value: paymentStats.refunded, color: '#8b5cf6', bg: '#8b5cf620' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Col md={3} key={idx}>
                <Card style={styles.paymentStatCard}>
                  <Card.Body style={styles.paymentStatCardBody}>
                    <div style={{ ...styles.paymentStatIcon, background: item.bg, color: item.color }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <small style={styles.paymentStatLabel}>{item.label}</small>
                      <span style={styles.paymentStatValue}>{item.value}</span>
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
              <Nav.Item>
                <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} style={styles.tabLink}>
                  <FaChartLine className="me-2" /> Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} style={styles.tabLink}>
                  <FaMoneyBillWave className="me-2" /> Transactions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')} style={styles.tabLink}>
                  <FaWallet className="me-2" /> Payouts
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <Row style={styles.overviewRow}>
            <Col lg={8}>
              <Card style={styles.chartCard}>
                <Card.Header style={styles.chartCardHeader}>
                  <h6 style={styles.chartCardTitle}>Revenue Trend</h6>
                </Card.Header>
                <Card.Body>
                  <div style={styles.chartContainer}>
                    {monthlyTrend.length === 0 ? (
                      <div style={styles.noDataState}>
                        <FaChartLine size={48} style={styles.noDataIcon} />
                        <p style={styles.noDataText}>No data available</p>
                      </div>
                    ) : (
                      <div style={styles.chartBars}>
                        {monthlyTrend.map((item, idx) => {
                          const maxValue = Math.max(...monthlyTrend.map(d => d?.revenue || 0), 1);
                          const height = ((item?.revenue || 0) / maxValue) * 250;
                          return (
                            <div key={idx} style={styles.chartBarWrapper}>
                              <div style={{ ...styles.chartBar, height: `${Math.max(height, 5)}px` }} />
                              <div style={styles.chartLabel}>{item?.month || ''}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card style={styles.methodCard}>
                <Card.Header style={styles.methodCardHeader}>
                  <h6 style={styles.methodCardTitle}>Revenue by Method</h6>
                </Card.Header>
                <Card.Body>
                  {revenueByMethod.length === 0 ? (
                    <div style={styles.noDataState}>
                      <FaCreditCard size={32} style={styles.noDataIcon} />
                      <p style={styles.noDataText}>No data available</p>
                    </div>
                  ) : (
                    revenueByMethod.map((item, idx) => (
                      <div key={idx} style={styles.methodItem}>
                        <div style={styles.methodHeader}>
                          <span>{item?.method || 'Unknown'}</span>
                          <span style={styles.methodAmount}>{formatNaira(item?.amount || 0)}</span>
                        </div>
                        <ProgressBar 
                          now={item?.percentage || 0} 
                          variant={['primary', 'success', 'warning', 'info', 'danger'][idx % 5]} 
                          style={styles.methodProgress}
                        />
                        <small style={styles.methodDetail}>{item?.percentage || 0}% • {item?.count || 0} transactions</small>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <>
            <Card style={styles.filtersCard}>
              <Card.Body style={styles.filtersCardBody}>
                <div style={styles.filtersWrapper}>
                  <InputGroup style={styles.searchInput}>
                    <InputGroup.Text><FaSearch size={14} /></InputGroup.Text>
                    <Form.Control 
                      placeholder="Search payments..." 
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
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </Form.Select>
                  <Form.Select 
                    style={styles.filterSelect}
                    value={filterMethod} 
                    onChange={(e) => setFilterMethod(e.target.value)}
                  >
                    <option value="all">All Methods</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                  </Form.Select>
                  <Form.Select 
                    style={styles.filterSelect}
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </Form.Select>
                  <Button variant="outline-secondary" onClick={resetFilters} style={styles.resetBtn}>
                    Reset
                  </Button>
                </div>
                {selectedPayments.length > 0 && (
                  <div style={styles.bulkActions}>
                    <Button size="sm" variant="success" onClick={() => handleBulkAction('export')}>
                      <FaDownload className="me-2" /> Export ({selectedPayments.length})
                    </Button>
                    <Button size="sm" variant="warning" onClick={() => setShowBulkActions(true)}>
                      <FaUndo className="me-2" /> Bulk Actions
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Payments Table */}
            <Card style={styles.tableCard}>
              <Card.Body style={styles.tableCardBody}>
                <div className="table-responsive">
                  <Table hover style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={styles.tableCheckbox}>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0} 
                            onChange={handleSelectAll} 
                          />
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('id')}>
                          ID {getSortIcon('id')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                          Date {getSortIcon('created_at')}
                        </th>
                        <th style={styles.tableHeader}>Customer</th>
                        <th style={styles.tableHeader}>Provider</th>
                        <th style={styles.tableHeader}>Service</th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('amount')}>
                          Amount {getSortIcon('amount')}
                        </th>
                        <th style={styles.tableHeader}>Method</th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('status')}>
                          Status {getSortIcon('status')}
                        </th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPayments.map(payment => payment && (
                        <tr key={payment.id} className={selectedPayments.includes(payment.id) ? 'table-active' : ''} style={styles.tableRow}>
                          <td style={styles.tableCell}>
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedPayments.includes(payment.id)} 
                              onChange={() => handleSelectPayment(payment.id)} 
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <span style={styles.paymentId}>#{payment.id?.slice(-8) || 'N/A'}</span>
                          </td>
                          <td style={styles.tableCell}>
                            <div>{payment.created_at ? format(new Date(payment.created_at), 'MMM dd, yyyy') : 'N/A'}</div>
                            <small style={styles.paymentTime}>{payment.created_at ? format(new Date(payment.created_at), 'hh:mm a') : ''}</small>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.userCell}>
                              <FaUserCircle className="text-muted" />
                              <span>{payment.customer_name || payment.customer?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.userCell}>
                              <FaUserTie className="text-muted" />
                              <span>{payment.provider_name || payment.provider?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td style={styles.tableCell}>{payment.service_title || payment.service?.title || 'Unknown'}</td>
                          <td style={styles.tableCell}>
                            <div style={styles.amountCell}>{formatNaira(payment.amount || 0)}</div>
                            <small style={styles.feeText}>Fee: {formatNaira(payment.fee || 0)}</small>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.methodCell}>
                              {getPaymentIcon(payment.payment_method)}
                              <span style={styles.methodText}>{payment.payment_method || 'N/A'}</span>
                            </div>
                          </td>
                          <td style={styles.tableCell}>{getStatusBadge(payment.status)}</td>
                          <td style={styles.tableCell}>
                            <div style={styles.actionButtons}>
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="rounded-circle p-1" 
                                style={styles.actionBtn}
                                onClick={() => { 
                                  setSelectedPayment(payment); 
                                  setShowPaymentModal(true); 
                                }}
                              >
                                <FaEye size={14} />
                              </Button>
                              {(payment.status === 'paid' || payment.status === 'completed') && (
                                <Button 
                                  size="sm" 
                                  variant="outline-warning" 
                                  className="rounded-circle p-1" 
                                  style={styles.actionBtn}
                                  onClick={() => { 
                                    setSelectedPayment(payment); 
                                    setShowRefundModal(true); 
                                    setRefundAmount(payment.amount); 
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
                {filteredPayments.length === 0 && (
                  <div style={styles.emptyState}>
                    <FaMoneyBillWave size={48} style={styles.emptyIcon} />
                    <h6 style={styles.emptyTitle}>No payments found</h6>
                    <Button variant="link" onClick={resetFilters} style={styles.emptyLink}>Reset Filters</Button>
                  </div>
                )}
                {filteredPayments.length > 0 && (
                  <div style={styles.paginationWrapper}>
                    <div style={styles.paginationInfo}>
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} payments
                    </div>
                    <Pagination style={styles.pagination}>
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
          <Card style={styles.payoutsCard}>
            <Card.Header style={styles.payoutsCardHeader}>
              <div style={styles.payoutsHeaderContent}>
                <h6 style={styles.payoutsTitle}>Pending Payouts</h6>
                <Button variant="outline-primary" size="sm" style={styles.processAllBtn}>
                  <FaPlus className="me-2" /> Process All
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {payouts.length === 0 ? (
                <div style={styles.emptyState}>
                  <FaWallet size={48} style={styles.emptyIcon} />
                  <h6 style={styles.emptyTitle}>No pending payouts</h6>
                  <p style={styles.emptyText}>All payouts have been processed</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={styles.tableHeader}>Provider</th>
                        <th style={styles.tableHeader}>Amount</th>
                        <th style={styles.tableHeader}>Method</th>
                        <th style={styles.tableHeader}>Date</th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout, idx) => (
                        <tr key={payout.id || idx} style={styles.tableRow}>
                          <td style={styles.tableCell}>{payout.provider || payout.provider_name || 'Unknown'}</td>
                          <td style={{ ...styles.tableCell, fontWeight: 'bold', color: '#6366f1' }}>{formatNaira(payout.amount || 0)}</td>
                          <td style={styles.tableCell}>{payout.method || 'N/A'}</td>
                          <td style={styles.tableCell}>{payout.date ? format(new Date(payout.date), 'MMM dd, yyyy') : 'N/A'}</td>
                          <td style={styles.tableCell}>{getStatusBadge(payout.status)}</td>
                          <td style={styles.tableCell}>
                            <Button size="sm" variant="success" style={styles.processBtn}>
                              <FaCheck size={12} className="me-1" /> Process
                            </Button>
                            <Button size="sm" variant="danger" style={styles.cancelBtn}>
                              <FaTimes size={12} className="me-1" /> Cancel
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Container>

      {/* Payment Details Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg" centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>Payment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          {selectedPayment && (
            <div>
              <div style={styles.paymentDetailHeader}>
                <div className={`rounded-circle d-inline-flex p-3 mb-3 ${selectedPayment.status === 'paid' || selectedPayment.status === 'completed' ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                  {selectedPayment.status === 'paid' || selectedPayment.status === 'completed' ? (
                    <FaCheckCircle size={32} className="text-success" />
                  ) : (
                    <FaClock size={32} className="text-warning" />
                  )}
                </div>
                <h5 style={styles.paymentDetailId}>Payment #{selectedPayment.id}</h5>
                <p style={styles.paymentDetailDate}>{selectedPayment.created_at ? format(new Date(selectedPayment.created_at), 'MMMM dd, yyyy hh:mm a') : 'N/A'}</p>
              </div>

              <Row style={styles.paymentDetailRow}>
                <Col md={6}>
                  <div style={styles.infoSection}>
                    <h6 style={styles.infoTitle}>Customer Details</h6>
                    <div style={styles.infoItem}>
                      <FaUserCircle className="text-muted" /> <span>{selectedPayment.customer_name || selectedPayment.customer?.name || 'Unknown'}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <FaInfoCircle className="text-muted" /> <span>{selectedPayment.customer_email || selectedPayment.customer?.email || 'N/A'}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div style={styles.infoSection}>
                    <h6 style={styles.infoTitle}>Payment Details</h6>
                    <div style={styles.infoItem}>
                      <FaMoneyBillWave className="text-muted" /> <span style={styles.paymentAmount}>{formatNaira(selectedPayment.amount || 0)}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <FaCreditCard className="text-muted" /> <span>{selectedPayment.payment_method || 'N/A'}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <FaCheckCircle className="text-muted" /> <span>{getStatusBadge(selectedPayment.status)}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)} style={styles.modalCloseBtn}>Close</Button>
          {(selectedPayment?.status === 'paid' || selectedPayment?.status === 'completed') && (
            <Button variant="warning" onClick={() => {
              setShowPaymentModal(false);
              setShowRefundModal(true);
            }} style={styles.modalRefundBtn}>
              <FaUndo className="me-2" /> Process Refund
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Refund Modal */}
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitleWarning}>
            <FaUndo className="me-2" /> Process Refund
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Alert variant="info" style={styles.refundAlert}>
            <FaInfoCircle className="me-2" />
            Refund amount cannot exceed the original payment amount.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Refund Amount (₦)</Form.Label>
              <Form.Control
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                min="0"
                step="100"
                style={styles.formControl}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Refund Reason</Form.Label>
              <Form.Select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={styles.formControl}
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
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowRefundModal(false)} style={styles.modalCancelBtn}>Cancel</Button>
          <Button variant="warning" onClick={handleRefund} disabled={processingAction} style={styles.modalRefundBtn}>
            {processingAction ? 'Processing...' : 'Process Refund'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            <FaDownload className="me-2" /> Export Payments
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.exportText}>Exporting <strong>{filteredPayments.length}</strong> payments as <strong>{exportFormat.toUpperCase()}</strong></p>
          {isExporting && (
            <div style={styles.exportLoading}>
              <Spinner animation="border" variant="primary" />
              <p style={styles.exportLoadingText}>Generating export...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowExportModal(false)} style={styles.modalCancelBtn}>Cancel</Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting} style={styles.modalSubmitBtn}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.bulkText}>Selected payments: <strong className="text-primary">{selectedPayments.length}</strong></p>
          <div style={styles.bulkActionsGrid}>
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
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowBulkActions(false)} style={styles.modalCancelBtn}>Cancel</Button>
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
  alert: {
    borderRadius: '12px'
  },
  dateRangeCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden'
  },
  dateRangeCardBody: {
    padding: '20px 24px'
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
  applyBtn: {
    borderRadius: '10px',
    padding: '10px 20px',
    width: '100%'
  },
  statsRow: {
    marginBottom: '24px',
    gap: '16px'
  },
  statCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%'
  },
  statCardBody: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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
    fontSize: '28px'
  },
  paymentStatsRow: {
    marginBottom: '24px',
    gap: '16px'
  },
  paymentStatCard: {
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  paymentStatCardBody: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  paymentStatIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  paymentStatLabel: {
    color: '#718096',
    display: 'block',
    fontSize: '12px'
  },
  paymentStatValue: {
    fontWeight: '700',
    fontSize: '18px',
    color: '#1a202c',
    display: 'block'
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
  overviewRow: {
    gap: '24px'
  },
  chartCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    height: '100%'
  },
  chartCardHeader: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 20px'
  },
  chartCardTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  chartContainer: {
    height: '300px',
    position: 'relative'
  },
  noDataState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  noDataIcon: {
    color: '#cbd5e0',
    marginBottom: '16px',
    opacity: 0.5
  },
  noDataText: {
    color: '#a0aec0',
    marginBottom: 0
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '100%',
    gap: '8px',
    paddingTop: '20px'
  },
  chartBarWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  chartBar: {
    width: '100%',
    background: '#3b82f6',
    borderRadius: '6px 6px 0 0',
    transition: 'all 0.3s ease',
    minHeight: '5px'
  },
  chartLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    marginTop: '8px',
    textAlign: 'center'
  },
  methodCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    height: '100%'
  },
  methodCardHeader: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 20px'
  },
  methodCardTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  methodItem: {
    marginBottom: '16px'
  },
  methodHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  methodAmount: {
    fontWeight: 'bold'
  },
  methodProgress: {
    height: '6px',
    borderRadius: '3px'
  },
  methodDetail: {
    color: '#718096',
    fontSize: '12px'
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
    alignItems: 'center'
  },
  searchInput: {
    maxWidth: '300px',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  searchInputControl: {
    borderRadius: '0 12px 12px 0'
  },
  filterSelect: {
    width: '150px',
    borderRadius: '12px',
    padding: '10px 16px'
  },
  resetBtn: {
    borderRadius: '12px',
    padding: '10px 16px'
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
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
  paymentId: {
    fontWeight: '500',
    color: '#6366f1'
  },
  paymentTime: {
    color: '#718096',
    fontSize: '12px'
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  amountCell: {
    fontWeight: 'bold',
    color: '#6366f1'
  },
  feeText: {
    color: '#718096',
    fontSize: '12px',
    display: 'block'
  },
  methodCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  methodText: {
    fontSize: '12px'
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
    marginBottom: 0
  },
  emptyLink: {
    color: '#6366f1',
    fontWeight: '500'
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
  payoutsCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  payoutsCardHeader: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 20px'
  },
  payoutsHeaderContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  payoutsTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  processAllBtn: {
    borderRadius: '10px'
  },
  processBtn: {
    borderRadius: '8px',
    padding: '4px 12px',
    marginRight: '4px'
  },
  cancelBtn: {
    borderRadius: '8px',
    padding: '4px 12px'
  },
  modalHeader: {
    borderBottom: 'none',
    padding: '20px 24px 0'
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#1a202c'
  },
  modalTitleWarning: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#f59e0b'
  },
  modalBody: {
    padding: '20px 24px'
  },
  modalFooter: {
    borderTop: 'none',
    padding: '0 24px 20px'
  },
  modalCloseBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
  },
  modalRefundBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
  },
  modalCancelBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
  },
  modalSubmitBtn: {
    borderRadius: '10px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none'
  },
  refundAlert: {
    borderRadius: '12px'
  },
  exportText: {
    marginBottom: '16px'
  },
  exportLoading: {
    textAlign: 'center',
    padding: '20px 0'
  },
  exportLoadingText: {
    marginTop: '8px',
    color: '#718096',
    fontSize: '14px'
  },
  bulkText: {
    marginBottom: '16px'
  },
  bulkActionsGrid: {
    display: 'grid',
    gap: '8px'
  },
  paymentDetailHeader: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  paymentDetailId: {
    fontWeight: '600',
    marginBottom: '4px'
  },
  paymentDetailDate: {
    color: '#718096',
    marginBottom: 0
  },
  paymentDetailRow: {
    gap: '16px'
  },
  infoSection: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '12px'
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#1a202c'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  paymentAmount: {
    fontWeight: 'bold',
    color: '#6366f1'
  },
  globalStyles: `
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
      transition: all 0.2s;
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
    .info-item:last-child { border-bottom: none; }
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

export default AdminPayments;