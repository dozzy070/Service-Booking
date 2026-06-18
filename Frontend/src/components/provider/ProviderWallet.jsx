// src/components/provider/ProviderWallet.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Qrcode,
  CreditCard,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Shield
} from 'lucide-react';

// No duplicate imports from react-icons/fa
import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderWallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      const response = await providerAPI.getWallet();
      setWalletData(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet data');
      return null;
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1, type = 'all', status = 'all', range = 'all') => {
    try {
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

      const response = await providerAPI.getTransactions(params);
      setTransactions(response.data.transactions || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
      return null;
    }
  }, []);

  // Fetch earnings stats
  const fetchEarningsStats = useCallback(async () => {
    try {
      const response = await providerAPI.getStats();
      setEarningsStats({
        week: response.data.week_earnings || 0,
        month: response.data.month_earnings || 0,
        weekChange: response.data.week_change || 0,
        monthChange: response.data.month_change || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch withdrawal methods
  const fetchWithdrawalMethods = useCallback(async () => {
    try {
      const response = await providerAPI.getWithdrawalMethods();
      setWithdrawalMethods(response.data || []);
      if (response.data && response.data.length > 0) {
        setWithdrawMethod(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching withdrawal methods:', error);
      // Fallback methods
      setWithdrawalMethods([
        { id: 'bank', name: 'Bank Transfer' },
        { id: 'wallet', name: 'Mobile Wallet' }
      ]);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWalletData(),
      fetchTransactions(currentPage, filterType, filterStatus, dateRange),
      fetchEarningsStats(),
      fetchWithdrawalMethods()
    ]);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success('Wallet updated');
  };

  useEffect(() => {
    loadAllData();
  }, [currentPage, filterType, filterStatus, dateRange]);

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > (walletData?.available_balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 1000) {
      toast.error('Minimum withdrawal amount is ₦1,000');
      return;
    }

    setProcessingWithdrawal(true);
    try {
      await providerAPI.withdrawFunds(amount, withdrawMethod);
      setShowWithdrawModal(false);
      setShowSuccessModal(true);
      setWithdrawAmount('');
      await fetchWalletData();
      await fetchTransactions(currentPage, filterType, filterStatus, dateRange);
      setTimeout(() => setShowSuccessModal(false), 5000);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  // Export transactions
  const exportTransactions = async () => {
    try {
      const response = await providerAPI.getTransactions({ export: true });
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
      toast.error('Failed to export transactions');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', icon: CheckCircle, text: 'Completed' },
      pending: { variant: 'warning', icon: Clock, text: 'Pending' },
      failed: { variant: 'danger', icon: XCircle, text: 'Failed' },
      processing: { variant: 'info', icon: RefreshCw, text: 'Processing' }
    };
    const config = statusConfig[status] || statusConfig.pending;
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
    if (type === 'credit') {
      return (
        <Badge bg="success" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
          <ArrowUpRight size={12} />
          <span className="ms-1">Credit</span>
        </Badge>
      );
    }
    return (
      <Badge bg="danger" className="d-flex align-items-center gap-1" style={{ padding: '6px 12px' }}>
        <ArrowDownRight size={12} />
        <span className="ms-1">Debit</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading wallet data...</p>
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
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td style={{ padding: '16px', fontWeight: 500 }} className="text-primary">
                            {transaction.id}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{format(new Date(transaction.date), 'hh:mm a')}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>{transaction.description}</div>
                            {transaction.booking_id && (
                              <small className="text-muted">Booking #{transaction.booking_id}</small>
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>{getTypeBadge(transaction.type)}</td>
                          <td style={{ padding: '16px' }}>
                            <span className={transaction.type === 'credit' ? 'text-success' : 'text-danger'} style={{ fontWeight: 500 }}>
                              {transaction.type === 'credit' ? '+' : '-'} {formatNaira(Math.abs(transaction.amount))}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(transaction.status)}</td>
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
                      {[...Array(totalPages)].map((_, idx) => (
                        <Pagination.Item
                          key={idx + 1}
                          active={idx + 1 === currentPage}
                          onClick={() => setCurrentPage(idx + 1)}
                        >
                          {idx + 1}
                        </Pagination.Item>
                      ))}
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
                {withdrawalMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
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
            Your withdrawal request of {formatNaira(parseFloat(withdrawAmount))} has been submitted successfully.
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