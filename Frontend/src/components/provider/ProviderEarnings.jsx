// src/pages/provider/ProviderEarnings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  ProgressBar,
  Tabs,
  Tab,
  Pagination
} from 'react-bootstrap';
import {
  FaDownload,
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaEye,
  FaFileInvoice,
  FaBank,
  FaMobileAlt
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ProviderEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    total: 0,
    available: 0,
    pending: 0,
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    growth: 0,
    transactions: [],
    stats: {
      weekly: [],
      monthly: [],
      category: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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

  // Fetch earnings data
  const fetchEarnings = useCallback(async () => {
    try {
      const params = {
        range: dateRange,
        page: currentPage,
        limit: itemsPerPage
      };
      const res = await api.get('/provider/earnings', { params });
      setEarnings(res.data);
      setTotalPages(Math.ceil((res.data.total || 0) / itemsPerPage));
      return res.data;
    } catch (err) {
      console.error('Error fetching earnings:', err);
      toast.error('Failed to load earnings data');
      return null;
    }
  }, [dateRange, currentPage]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
    toast.success('Earnings updated');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchEarnings();
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchEarnings, 120000);
    return () => clearInterval(interval);
  }, [fetchEarnings]);

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > earnings.available) {
      toast.error('Insufficient available balance');
      return;
    }

    if (amount < 1000) {
      toast.error('Minimum withdrawal amount is ₦1,000');
      return;
    }

    setProcessingWithdrawal(true);
    try {
      await api.post('/provider/withdraw', {
        amount: amount,
        method: withdrawMethod
      });
      toast.success('Withdrawal request submitted successfully');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await fetchEarnings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  // Export transactions
  const exportTransactions = async () => {
    try {
      const response = await api.get('/provider/earnings/export', {
        params: { range: dateRange },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Transactions exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export transactions');
    }
  };

  // Get transaction status badge
  const getStatusBadge = (status) => {
    const config = {
      completed: { variant: 'success', icon: FaCheckCircle, text: 'Completed' },
      pending: { variant: 'warning', icon: FaClock, text: 'Pending' },
      failed: { variant: 'danger', icon: FaTimesCircle, text: 'Failed' },
      processing: { variant: 'info', icon: FaInfoCircle, text: 'Processing' }
    };
    const item = config[status] || config.pending;
    const Icon = item.icon;
    return (
      <Badge bg={item.variant} className="d-inline-flex align-items-center gap-1 px-3 py-2">
        <Icon size={12} />
        <span className="ms-1">{item.text}</span>
      </Badge>
    );
  };

  // Chart colors
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading earnings data...</p>
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
            <h2 className="mb-1 fw-bold">Earnings Overview</h2>
            <p className="text-muted mb-0">
              Track your income, withdrawals, and payment history
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={exportTransactions}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4 g-4">
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Total Earnings</p>
                    <h2 className="fw-bold mb-0">{formatNaira(earnings.total)}</h2>
                    <small className={`text-${earnings.growth >= 0 ? 'success' : 'danger'} d-flex align-items-center gap-1 mt-2`}>
                      {earnings.growth >= 0 ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                      {Math.abs(earnings.growth)}% from last month
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaMoneyBillWave size={24} color="#10b981" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Available Balance</p>
                    <h2 className="fw-bold mb-0">{formatNaira(earnings.available)}</h2>
                    <small className="text-muted">Ready for withdrawal</small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaWallet size={24} color="#3b82f6" />
                  </div>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={earnings.available < 1000}
                  className="w-100 mt-2"
                >
                  Withdraw Funds
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Pending Clearance</p>
                    <h2 className="fw-bold mb-0">{formatNaira(earnings.pending)}</h2>
                    <small className="text-muted">Awaiting confirmation</small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaClock size={24} color="#f59e0b" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">This Month</p>
                    <h2 className="fw-bold mb-0">{formatNaira(earnings.thisMonth)}</h2>
                    <small className={`text-${earnings.thisMonth > earnings.lastMonth ? 'success' : 'danger'}`}>
                      vs last month: {formatNaira(Math.abs(earnings.thisMonth - earnings.lastMonth))}
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

        {/* Charts Section */}
        <Row className="mb-4 g-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <h5 className="fw-bold mb-0">Earnings Trend</h5>
                  <div className="d-flex gap-2">
                    <Button
                      variant={dateRange === 'week' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setDateRange('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={dateRange === 'month' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setDateRange('month')}
                    >
                      Month
                    </Button>
                    <Button
                      variant={dateRange === 'year' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setDateRange('year')}
                    >
                      Year
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earnings.stats?.weekly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNaira(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" stroke="#10b981" name="Earnings" strokeWidth={2} />
                    <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" name="Withdrawals" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Earnings by Category</h5>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={earnings.stats?.category || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(earnings.stats?.category || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNaira(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transaction History */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Header className="bg-white border-0 pt-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="fw-bold mb-0">Transaction History</h5>
              <div className="d-flex gap-2">
                <Form.Select
                  size="sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{ width: '120px' }}
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="year">Last 12 months</option>
                </Form.Select>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {earnings.transactions?.length === 0 ? (
              <div className="text-center py-5">
                <FaFileInvoice size={48} className="text-muted mb-3 opacity-50" />
                <p className="text-muted mb-0">No transactions found</p>
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
                        <th style={{ padding: '16px' }}>Service</th>
                        <th style={{ padding: '16px' }}>Amount</th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td style={{ padding: '16px' }}>
                            <span className="text-primary fw-medium">#{tx.id.slice(-8)}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>{format(new Date(tx.date), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{format(new Date(tx.date), 'hh:mm a')}</small>
                          </td>
                          <td style={{ padding: '16px' }}>{tx.description}</td>
                          <td style={{ padding: '16px' }}>
                            <Badge bg="light" text="dark" className="px-3 py-2">
                              {tx.service || 'N/A'}
                            </Badge>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className={tx.type === 'credit' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                              {tx.type === 'credit' ? '+' : '-'} {formatNaira(Math.abs(tx.amount))}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(tx.status)}</td>
                          <td style={{ padding: '16px' }}>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setShowDetailsModal(true);
                              }}
                              className="p-0"
                            >
                              <FaEye />
                            </Button>
                          </td>
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
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Withdraw Funds</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2">
              <FaWallet />
              <div>
                <strong>Available Balance:</strong> {formatNaira(earnings.available)}
              </div>
            </div>
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Amount to Withdraw</Form.Label>
              <div className="d-flex align-items-center">
                <span className="bg-light border rounded-start px-3 py-2">₦</span>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="1000"
                  max={earnings.available}
                  step="100"
                  className="rounded-start-0"
                  autoFocus
                />
              </div>
              <Form.Text className="text-muted">
                Minimum withdrawal: ₦1,000. Maximum: {formatNaira(earnings.available)}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Withdrawal Method</Form.Label>
              <div className="d-flex gap-3">
                <div
                  className={`border rounded-3 p-3 flex-grow-1 text-center cursor-pointer ${withdrawMethod === 'bank' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setWithdrawMethod('bank')}
                  style={{ cursor: 'pointer' }}
                >
                  <FaBank size={24} className="mb-2" />
                  <div className="fw-semibold">Bank Transfer</div>
                  <small className="text-muted">2-3 business days</small>
                </div>
                <div
                  className={`border rounded-3 p-3 flex-grow-1 text-center cursor-pointer ${withdrawMethod === 'mobile' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setWithdrawMethod('mobile')}
                  style={{ cursor: 'pointer' }}
                >
                  <FaMobileAlt size={24} className="mb-2" />
                  <div className="fw-semibold">Mobile Wallet</div>
                  <small className="text-muted">Instant</small>
                </div>
              </div>
            </Form.Group>

            <Alert variant="secondary" className="small" style={{ borderRadius: '12px' }}>
              <div className="d-flex gap-2">
                <FaInfoCircle />
                <div>
                  Withdrawals are processed within 2-3 business days.
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
            variant="success"
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

      {/* Transaction Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedTransaction && (
            <div>
              <div className="text-center mb-4">
                <div className={`rounded-circle d-inline-flex p-3 mb-3 ${selectedTransaction.type === 'credit' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                  {selectedTransaction.type === 'credit' ? (
                    <FaArrowUp size={32} className="text-success" />
                  ) : (
                    <FaArrowDown size={32} className="text-danger" />
                  )}
                </div>
                <h3 className={selectedTransaction.type === 'credit' ? 'text-success' : 'text-danger'}>
                  {selectedTransaction.type === 'credit' ? '+' : '-'} {formatNaira(Math.abs(selectedTransaction.amount))}
                </h3>
                <p className="text-muted">{selectedTransaction.description}</p>
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Transaction ID:</span>
                  <span className="fw-medium">{selectedTransaction.id}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Date & Time:</span>
                  <span>{format(new Date(selectedTransaction.date), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Status:</span>
                  <span>{getStatusBadge(selectedTransaction.status)}</span>
                </div>
                {selectedTransaction.service && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Service:</span>
                    <span>{selectedTransaction.service}</span>
                  </div>
                )}
                {selectedTransaction.booking_id && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Booking ID:</span>
                    <span>#{selectedTransaction.booking_id}</span>
                  </div>
                )}
                {selectedTransaction.customer && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Customer:</span>
                    <span>{selectedTransaction.customer}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
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
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ProviderEarnings;