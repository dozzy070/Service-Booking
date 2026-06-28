// src/components/provider/ProviderWallet.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Form,
  Modal,
  Alert,
  Spinner,
  Pagination
} from 'react-bootstrap';
import {
  Wallet,
  Banknote,
  Download,
  Send,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Lock,
  Smartphone,
  Building2,
  Eye,
  Copy,
  QrCode,
  CreditCard,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Shield,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderWallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [earningsStats, setEarningsStats] = useState({
    week: 0,
    month: 0,
    weekChange: 0,
    monthChange: 0
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawalMethods, setWithdrawalMethods] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const itemsPerPage = 10;

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Fetch wallet data from real API
  const fetchWalletData = useCallback(async () => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof providerAPI.getWallet === 'function') {
        response = await providerAPI.getWallet();
      } else if (typeof providerAPI.getProviderWallet === 'function') {
        response = await providerAPI.getProviderWallet();
      } else {
        throw new Error('Wallet API methods not available');
      }

      const data = response?.data || {};
      setWalletData({
        total_balance: data.total_balance || data.balance || 0,
        available_balance: data.available_balance || data.available || 0,
        pending_balance: data.pending_balance || data.pending || 0,
        currency: data.currency || 'NGN'
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setError(error.message || 'Failed to load wallet data');
      toast.error('Failed to load wallet data');
      return null;
    }
  }, []);

  // Fetch transactions from real API
  const fetchTransactions = useCallback(async (page = 1, type = 'all', status = 'all', range = 'all') => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let params = {
        page,
        limit: itemsPerPage,
        type: type !== 'all' ? type : undefined,
        status: status !== 'all' ? status : undefined
      };

      // Add date range filter
      if (range !== 'all') {
        const today = new Date();
        let startDate;
        switch (range) {
          case 'week':
            startDate = subDays(today, 7);
            break;
          case 'month':
            startDate = subDays(today, 30);
            break;
          case 'quarter':
            startDate = subDays(today, 90);
            break;
          default:
            startDate = null;
        }
        if (startDate) {
          params.start_date = format(startDate, 'yyyy-MM-dd');
          params.end_date = format(today, 'yyyy-MM-dd');
        }
      }

      let response = null;
      
      if (typeof providerAPI.getTransactions === 'function') {
        response = await providerAPI.getTransactions(params);
      } else if (typeof providerAPI.getProviderTransactions === 'function') {
        response = await providerAPI.getProviderTransactions(params);
      } else {
        throw new Error('Transactions API methods not available');
      }

      const data = response?.data || response || {};
      const transactionsData = data.transactions || data.data || [];
      
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setTotalCount(data.total || transactionsData.length || 0);
      setTotalPages(Math.ceil((data.total || transactionsData.length || 0) / itemsPerPage));
      
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setTotalCount(0);
      setTotalPages(1);
      toast.error('Failed to load transactions');
      return null;
    }
  }, []);

  // Fetch earnings stats from real API
  const fetchEarningsStats = useCallback(async () => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof providerAPI.getStats === 'function') {
        response = await providerAPI.getStats();
      } else if (typeof providerAPI.getProviderStats === 'function') {
        response = await providerAPI.getProviderStats();
      } else {
        throw new Error('Stats API methods not available');
      }

      const data = response?.data || {};
      setEarningsStats({
        week: data.week_earnings || data.week || 0,
        month: data.month_earnings || data.month || 0,
        weekChange: data.week_change || data.weekGrowth || 0,
        monthChange: data.month_change || data.monthGrowth || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Keep default stats
    }
  }, []);

  // Fetch withdrawal methods from real API
  const fetchWithdrawalMethods = useCallback(async () => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof providerAPI.getWithdrawalMethods === 'function') {
        response = await providerAPI.getWithdrawalMethods();
      } else if (typeof providerAPI.getPayoutMethods === 'function') {
        response = await providerAPI.getPayoutMethods();
      } else {
        throw new Error('Withdrawal methods API methods not available');
      }

      const data = response?.data || [];
      const methods = Array.isArray(data) ? data : [];
      setWithdrawalMethods(methods);
      
      if (methods.length > 0) {
        const firstMethod = methods[0];
        setWithdrawMethod(firstMethod.id || firstMethod._id);
      }
    } catch (error) {
      console.error('Error fetching withdrawal methods:', error);
      // Set fallback methods
      setWithdrawalMethods([
        { id: 'bank', name: 'Bank Transfer' },
        { id: 'wallet', name: 'Mobile Wallet' }
      ]);
      setWithdrawMethod('bank');
    }
  }, []);

  // Load all data
  const loadAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchWalletData(),
        fetchTransactions(currentPage, filterType, filterStatus, dateRange),
        fetchEarningsStats(),
        fetchWithdrawalMethods()
      ]);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, filterType, filterStatus, dateRange, fetchWalletData, fetchTransactions, fetchEarningsStats, fetchWithdrawalMethods]);

  // Polling functions for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        loadAllData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000); // Poll every 30 seconds for real-time updates
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
    loadAllData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchTransactions(currentPage, filterType, filterStatus, dateRange);
    }
  }, [currentPage, filterType, filterStatus, dateRange]);

  // Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData(false);
    toast.success('Wallet updated');
  };

  // Handle withdrawal with real API
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const availableBalance = walletData?.available_balance || 0;
    
    if (amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 1000) {
      toast.error('Minimum withdrawal amount is ₦1,000');
      return;
    }

    setProcessingWithdrawal(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = {
        amount: amount,
        method: withdrawMethod
      };

      if (typeof providerAPI.withdrawFunds === 'function') {
        await providerAPI.withdrawFunds(payload);
      } else if (typeof providerAPI.requestWithdrawal === 'function') {
        await providerAPI.requestWithdrawal(payload);
      } else {
        throw new Error('Withdrawal API methods not available');
      }
      
      setShowWithdrawModal(false);
      setShowSuccessModal(true);
      setWithdrawAmount('');
      await fetchWalletData();
      await fetchTransactions(currentPage, filterType, filterStatus, dateRange);
      setTimeout(() => setShowSuccessModal(false), 5000);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.message || error.message || 'Withdrawal failed. Please try again.');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  // Export transactions with real API
  const exportTransactions = async () => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof providerAPI.getTransactions === 'function') {
        response = await providerAPI.getTransactions({ export: true });
      } else if (typeof providerAPI.exportTransactions === 'function') {
        response = await providerAPI.exportTransactions();
      } else {
        throw new Error('Export transactions API methods not available');
      }
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export transactions');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
          <Clock size={12} />
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const statusConfig = {
      completed: { variant: 'success', icon: CheckCircle, text: 'Completed' },
      success: { variant: 'success', icon: CheckCircle, text: 'Success' },
      pending: { variant: 'warning', icon: Clock, text: 'Pending' },
      failed: { variant: 'danger', icon: XCircle, text: 'Failed' },
      processing: { variant: 'info', icon: RefreshCw, text: 'Processing' },
      cancelled: { variant: 'secondary', icon: XCircle, text: 'Cancelled' }
    };
    const config = statusConfig[lowerStatus] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
        <Icon size={12} />
        <span className="ms-1">{config.text}</span>
      </Badge>
    );
  };

  // Get type badge
  const getTypeBadge = (type) => {
    if (!type) {
      return (
        <Badge bg="secondary" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerType = type.toLowerCase();
    if (lowerType === 'credit' || lowerType === 'deposit' || lowerType === 'refund') {
      return (
        <Badge bg="success" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
          <ArrowUpRight size={12} />
          <span className="ms-1">Credit</span>
        </Badge>
      );
    }
    if (lowerType === 'debit' || lowerType === 'withdrawal' || lowerType === 'payment') {
      return (
        <Badge bg="danger" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
          <ArrowDownRight size={12} />
          <span className="ms-1">Debit</span>
        </Badge>
      );
    }
    return (
      <Badge bg="secondary" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
        <span className="ms-1">{type}</span>
      </Badge>
    );
  };

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <AlertCircle size={18} className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => loadAllData(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Wallet & Earnings</h2>
            <p className="text-muted mb-0">Manage your earnings and withdrawal requests</p>
          </div>
          <Button
            variant="outline-primary"
            onClick={refreshData}
            disabled={refreshing}
            className="d-flex align-items-center gap-2"
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Balance Overview Cards */}
        <Row className="mb-4 g-4">
          <Col lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Total Balance</p>
                    <h1 className="display-4 fw-bold mb-0" style={{ fontSize: '2.5rem' }}>
                      {formatNaira(walletData?.total_balance || 0)}
                    </h1>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Wallet size={24} color="white" />
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '12px', padding: '12px' }}
                >
                  <Send size={18} />
                  Withdraw Funds
                </Button>
              </div>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Available Balance</p>
                    <h3 className="fw-bold mb-2">{formatNaira(walletData?.available_balance || 0)}</h3>
                  </div>
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <Banknote size={20} color="#10b981" />
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Ready for withdrawal</small>
                  <small className="text-success">+ Available</small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={12}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Pending Clearance</p>
                    <h3 className="fw-bold mb-2">{formatNaira(walletData?.pending_balance || 0)}</h3>
                  </div>
                  <div className="rounded-circle p-2" style={{ background: '#f59e0b20' }}>
                    <Clock size={20} color="#f59e0b" />
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">Awaiting confirmation</small>
                  <small className="text-warning">Processing</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Earnings Summary */}
        <Row className="mb-4 g-4">
          <Col md={6}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">This Week</p>
                    <h3 className="fw-bold mb-1">{formatNaira(earningsStats.week)}</h3>
                    <small className={earningsStats.weekChange >= 0 ? 'text-success' : 'text-danger'}>
                      {earningsStats.weekChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {' '}{Math.abs(earningsStats.weekChange)}% from last week
                    </small>
                  </div>
                  <Calendar size={24} className="text-muted" />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">This Month</p>
                    <h3 className="fw-bold mb-1">{formatNaira(earningsStats.month)}</h3>
                    <small className={earningsStats.monthChange >= 0 ? 'text-success' : 'text-danger'}>
                      {earningsStats.monthChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {' '}{Math.abs(earningsStats.monthChange)}% from last month
                    </small>
                  </div>
                  <Calendar size={24} className="text-muted" />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transaction History Section */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Header className="bg-white border-0 p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h5 className="mb-1 fw-bold">Transaction History</h5>
                <p className="text-muted mb-0">View and manage all your transactions</p>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={exportTransactions}
                  className="d-flex align-items-center gap-1"
                >
                  <Download size={14} />
                  Export
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="d-flex flex-wrap gap-3 mt-4">
              <Form.Select
                size="sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ width: '120px', borderRadius: '10px' }}
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </Form.Select>

              <Form.Select
                size="sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: '140px', borderRadius: '10px' }}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </Form.Select>

              <Form.Select
                size="sm"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ width: '140px', borderRadius: '10px' }}
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
              </Form.Select>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-5">
                <History size={48} className="text-muted mb-3" />
                <h6 className="text-muted">No transactions found</h6>
                <p className="text-muted small">Your transaction history will appear here</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px' }}>Transaction ID</th>
                        <th style={{ padding: '16px' }}>Date & Time</th>
                        <th style={{ padding: '16px' }}>Description</th>
                        <th style={{ padding: '16px' }}>Type</th>
                        <th style={{ padding: '16px' }}>Amount</th>
                        <th style={{ padding: '16px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => {
                        const transactionId = transaction.id || transaction._id;
                        const description = getField(transaction, ['description', 'details', 'note', 'reason'], 'Transaction');
                        const type = getField(transaction, ['type', 'transaction_type', 'txn_type'], 'credit');
                        const status = getField(transaction, ['status', 'transaction_status', 'txn_status'], 'pending');
                        const amount = parseFloat(transaction.amount) || 0;
                        const date = transaction.date || transaction.created_at || transaction.timestamp || new Date().toISOString();
                        const bookingId = getField(transaction, ['booking_id', 'bookingId', 'service_id'], '');

                        return (
                          <tr key={transactionId}>
                            <td style={{ padding: '16px', fontWeight: 500 }} className="text-primary">
                              {transactionId.slice(-8)}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
                              <small className="text-muted">{format(new Date(date), 'hh:mm a')}</small>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div>{description}</div>
                              {bookingId && (
                                <small className="text-muted">Booking #{bookingId}</small>
                              )}
                            </td>
                            <td style={{ padding: '16px' }}>{getTypeBadge(type)}</td>
                            <td style={{ padding: '16px' }}>
                              <span className={type === 'credit' || type === 'deposit' || type === 'refund' ? 'text-success' : 'text-danger'} style={{ fontWeight: 500 }}>
                                {type === 'credit' || type === 'deposit' || type === 'refund' ? '+' : '-'} {formatNaira(Math.abs(amount))}
                              </span>
                            </td>
                            <td style={{ padding: '16px' }}>{getStatusBadge(status)}</td>
                          </tr>
                        );
                      })}
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

      {/* Withdrawal Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Withdraw Funds</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="d-flex align-items-center" style={{ borderRadius: '12px' }}>
            <Wallet size={18} className="me-2" />
            <div>
              <strong>Available Balance: {formatNaira(walletData?.available_balance || 0)}</strong>
            </div>
          </Alert>

          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Amount to Withdraw</Form.Label>
              <div className="d-flex align-items-center">
                <span className="bg-light border rounded-start px-3 py-2">₦</span>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="1000"
                  max={walletData?.available_balance || 0}
                  step="100"
                  className="rounded-start-0"
                  autoFocus
                />
              </div>
              <Form.Text className="text-muted">
                Minimum withdrawal: ₦1,000. Maximum: {formatNaira(walletData?.available_balance || 0)}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Withdrawal Method</Form.Label>
              <Form.Select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="py-2"
              >
                {withdrawalMethods.map((method) => {
                  const methodId = method.id || method._id;
                  const methodName = getField(method, ['name', 'method', 'label'], 'Unknown');
                  return (
                    <option key={methodId} value={methodId}>
                      {methodName}
                    </option>
                  );
                })}
              </Form.Select>
            </Form.Group>

            <Alert variant="secondary" className="small" style={{ borderRadius: '12px' }}>
              <div className="d-flex gap-2">
                <AlertCircle size={16} />
                <div>
                  Withdrawals typically process within 2-3 business days.
                  You'll receive a confirmation email once processed.
                </div>
              </div>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowWithdrawModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleWithdraw}
            disabled={processingWithdrawal || !withdrawAmount || parseFloat(withdrawAmount) < 1000}
            className="px-4"
          >
            {processingWithdrawal ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Body className="text-center py-5">
          <div className="mb-3">
            <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-3">
              <CheckCircle size={48} className="text-success" />
            </div>
          </div>
          <h5 className="fw-bold mb-2">Withdrawal Request Submitted!</h5>
          <p className="text-muted mb-3">
            Your withdrawal request of {formatNaira(parseFloat(withdrawAmount) || 0)} has been submitted successfully.
          </p>
          <p className="text-muted small">
            Funds will be transferred to your selected withdrawal method within 2-3 business days.
          </p>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </Modal.Body>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProviderWallet;