// src/pages/customer/Wallet.jsx
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
  InputGroup,
  Spinner,
  Pagination
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaWallet,
  FaPlus,
  FaMinus,
  FaHistory,
  FaMoneyBillWave,
  FaCreditCard,
  FaUniversity,  // ✅ Fixed: Changed from FaBank to FaUniversity
  FaMobileAlt,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaGift,
  FaPercent,
  FaShieldAlt,
  FaChartLine,
  FaCalendarAlt,
  FaReceipt,
  FaCopy,
  FaFaQrcode
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    totalSpent: 0,
    totalSaved: 0,
    pendingCredits: 0,
    currency: 'NGN'
  });
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      const response = await customerAPI.getWallet();
      setWalletData(response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet data');
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: filterType !== 'all' ? filterType : undefined,
        range: dateRange
      };
      const response = await customerAPI.getTransactions(params);
      setTransactions(response.data.transactions || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  }, [currentPage, filterType, dateRange]);

  // Fetch rewards
  const fetchRewards = useCallback(async () => {
    try {
      const response = await customerAPI.getRewards();
      setRewards(response.data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchWalletData(),
      fetchTransactions(),
      fetchRewards()
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
  }, [currentPage, filterType, dateRange]);

  // Add funds
  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue < 1000) {
      toast.error('Minimum deposit amount is ₦1,000');
      return;
    }

    setProcessing(true);
    try {
      const response = await customerAPI.addFunds(amountValue, paymentMethod);
      if (response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        toast.success('Funds added successfully!');
        setShowAddFundsModal(false);
        setAmount('');
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error(error.response?.data?.message || 'Failed to add funds');
    } finally {
      setProcessing(false);
    }
  };

  // Withdraw funds
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue > walletData.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (amountValue < 5000) {
      toast.error('Minimum withdrawal amount is ₦5,000');
      return;
    }

    setProcessing(true);
    try {
      await customerAPI.withdrawFunds(amountValue, withdrawMethod);
      toast.success('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setAmount('');
      await loadAllData();
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  // Redeem reward
  const handleRedeemReward = async (rewardId) => {
    try {
      await customerAPI.redeemReward(rewardId);
      toast.success('Reward redeemed successfully!');
      await loadAllData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error(error.response?.data?.message || 'Failed to redeem reward');
    }
  };

  // Export transactions
  const exportTransactions = async () => {
    try {
      const response = await customerAPI.getTransactions({ export: true });
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

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getTransactionStatusBadge = (status) => {
    const config = {
      completed: { variant: 'success', icon: FaCheckCircle, text: 'Completed' },
      pending: { variant: 'warning', icon: FaClock, text: 'Pending' },
      failed: { variant: 'danger', icon: FaTimesCircle, text: 'Failed' },
      processing: { variant: 'info', icon: FaClock, text: 'Processing' }
    };
    const item = config[status] || config.pending;
    const Icon = item.icon;
    return (
      <Badge bg={item.variant} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={10} />
        <span className="ms-1">{item.text}</span>
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type) => {
    if (type === 'credit') {
      return (
        <Badge bg="success" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
          <FaArrowUp size={10} />
          <span className="ms-1">Credit</span>
        </Badge>
      );
    }
    return (
      <Badge bg="danger" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <FaArrowDown size={10} />
        <span className="ms-1">Debit</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Get available rewards count
  const availableRewards = rewards.filter(r => r.is_available).length;

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">My Wallet</h2>
            <p className="text-muted mb-0">Manage your balance, transactions, and rewards</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaWallet className={refreshing ? 'spin' : ''} />
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

        {/* Balance Cards */}
        <Row className="mb-4 g-4">
          <Col lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Available Balance</p>
                    <h1 className="display-4 fw-bold mb-0" style={{ fontSize: '2.5rem' }}>
                      {formatNaira(walletData.balance)}
                    </h1>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <FaWallet size={24} color="white" />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => setShowAddFundsModal(true)}
                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '12px' }}
                  >
                    <FaPlus size={16} />
                    Add Funds
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    onClick={() => setShowWithdrawModal(true)}
                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '12px' }}
                    disabled={walletData.balance < 5000}
                  >
                    <FaMinus size={16} />
                    Withdraw
                  </Button>
                </div>
              </div>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Total Spent</p>
                    <h3 className="fw-bold mb-2">{formatNaira(walletData.totalSpent)}</h3>
                  </div>
                  <div className="rounded-circle p-2" style={{ background: '#ef444420' }}>
                    <FaMoneyBillWave size={20} color="#ef4444" />
                  </div>
                </div>
                <small className="text-muted">Lifetime spending on services</small>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={12}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-muted mb-1">Total Saved</p>
                    <h3 className="fw-bold mb-2">{formatNaira(walletData.totalSaved)}</h3>
                  </div>
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <FaPercent size={20} color="#10b981" />
                  </div>
                </div>
                <small className="text-success">From discounts and promotions</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Rewards Section */}
        {rewards.length > 0 && (
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <FaGift size={18} className="text-warning" />
                  Available Rewards
                  {availableRewards > 0 && (
                    <Badge bg="warning" className="ms-2">{availableRewards} available</Badge>
                  )}
                </h5>
                <Link to="/customer/rewards" className="text-primary small">View all rewards →</Link>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {rewards.slice(0, 3).map(reward => (
                  <Col md={4} key={reward.id}>
                    <div className="reward-card p-3 rounded-3 border" style={{ background: '#f8fafc' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg={reward.type === 'discount' ? 'success' : 'primary'} className="rounded-pill">
                          {reward.type === 'discount' ? `${reward.value}% OFF` : reward.name}
                        </Badge>
                        {reward.expiry_date && (
                          <small className="text-muted">
                            Expires: {format(new Date(reward.expiry_date), 'MMM dd')}
                          </small>
                        )}
                      </div>
                      <h6 className="mb-1">{reward.name}</h6>
                      <p className="small text-muted mb-3">{reward.description}</p>
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="w-100"
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={!reward.is_available}
                      >
                        {reward.is_available ? 'Redeem Now' : 'Expired'}
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Transaction History */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Header className="bg-white border-0 pt-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <FaHistory size={18} className="text-primary" />
                Transaction History
              </h5>
              <div className="d-flex gap-2">
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
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{ width: '130px', borderRadius: '10px' }}
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="year">Last 12 months</option>
                </Form.Select>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-5">
                <FaHistory size={48} className="text-muted mb-3 opacity-50" />
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
                        <th style={{ padding: '16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} style={{ cursor: 'pointer' }}>
                          <td style={{ padding: '16px' }}>
                            <span className="text-primary fw-medium">#{transaction.id.slice(-8)}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div>{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{format(new Date(transaction.date), 'hh:mm a')}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {transaction.description}
                            {transaction.reference && (
                              <div className="small text-muted mt-1">
                                Ref: {transaction.reference}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>{getTransactionTypeBadge(transaction.type)}</td>
                          <td style={{ padding: '16px' }}>
                            <span className={transaction.type === 'credit' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                              {transaction.type === 'credit' ? '+' : '-'} {formatNaira(Math.abs(transaction.amount))}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>{getTransactionStatusBadge(transaction.status)}</td>
                          <td style={{ padding: '16px' }}>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary p-0"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowTransactionModal(true);
                              }}
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

      {/* Add Funds Modal */}
      <Modal show={showAddFundsModal} onHide={() => setShowAddFundsModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaPlus className="me-2" />
            Add Funds
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2">
              <FaShieldAlt size={18} />
              <div>
                <strong>Secure Payment</strong>
                <p className="mb-0 small">Your payment information is encrypted and secure.</p>
              </div>
            </div>
          </Alert>

          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Amount (₦)</Form.Label>
              <InputGroup>
                <InputGroup.Text>₦</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1000"
                  step="500"
                  autoFocus
                />
              </InputGroup>
              <Form.Text className="text-muted">Minimum deposit: ₦1,000</Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Payment Method</Form.Label>
              <div className="d-flex gap-3 flex-wrap">
                <div
                  className={`border rounded-3 p-3 flex-grow-1 text-center cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                  style={{ cursor: 'pointer' }}
                >
                  <FaCreditCard size={24} className="mb-2" />
                  <div className="fw-semibold">Card</div>
                  <small className="text-muted">Debit/Credit Card</small>
                </div>
                <div
                  className={`border rounded-3 p-3 flex-grow-1 text-center cursor-pointer ${paymentMethod === 'bank' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                  style={{ cursor: 'pointer' }}
                >
                  <FaUniversity size={24} className="mb-2" />  {/* ✅ Fixed: Changed from FaBank */}
                  <div className="fw-semibold">Bank Transfer</div>
                  <small className="text-muted">Direct bank transfer</small>
                </div>
                <div
                  className={`border rounded-3 p-3 flex-grow-1 text-center cursor-pointer ${paymentMethod === 'mobile' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setPaymentMethod('mobile')}
                  style={{ cursor: 'pointer' }}
                >
                  <FaMobileAlt size={24} className="mb-2" />
                  <div className="fw-semibold">Mobile Money</div>
                  <small className="text-muted">Pay with mobile wallet</small>
                </div>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowAddFundsModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleAddFunds}
            disabled={processing || !amount || parseFloat(amount) < 1000}
            className="px-4"
          >
            {processing ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : (
              'Add Funds'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Withdraw Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaMinus className="me-2" />
            Withdraw Funds
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2">
              <FaWallet size={18} />
              <div>
                <strong>Available Balance: {formatNaira(walletData.balance)}</strong>
              </div>
            </div>
          </Alert>

          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Amount (₦)</Form.Label>
              <InputGroup>
                <InputGroup.Text>₦</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="5000"
                  max={walletData.balance}
                  step="500"
                  autoFocus
                />
              </InputGroup>
              <Form.Text className="text-muted">
                Minimum withdrawal: ₦5,000. Maximum: {formatNaira(walletData.balance)}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Withdrawal Method</Form.Label>
              <div className="d-flex gap-3 flex-wrap">
                <div
                  className={`border rounded-3 p-3 flex-grow-1 text-center cursor-pointer ${withdrawMethod === 'bank' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                  onClick={() => setWithdrawMethod('bank')}
                  style={{ cursor: 'pointer' }}
                >
                  <FaUniversity size={24} className="mb-2" />  {/* ✅ Fixed: Changed from FaBank */}
                  <div className="fw-semibold">Bank Transfer</div>
                  <small className="text-muted">1-2 business days</small>
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
                <FaClock size={16} />
                <div>
                  Withdrawals are processed within 1-2 business days.
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
            disabled={processing || !amount || parseFloat(amount) < 5000 || parseFloat(amount) > walletData.balance}
            className="px-4"
          >
            {processing ? (
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
      <Modal show={showTransactionModal} onHide={() => setShowTransactionModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaReceipt className="me-2" />
            Transaction Details
          </Modal.Title>
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
                  <span>{getTransactionStatusBadge(selectedTransaction.status)}</span>
                </div>
                {selectedTransaction.reference && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Reference:</span>
                    <span className="fw-mono small">{selectedTransaction.reference}</span>
                  </div>
                )}
                {selectedTransaction.payment_method && (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Payment Method:</span>
                    <span>{selectedTransaction.payment_method}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Balance After:</span>
                  <span className="fw-bold">{formatNaira(selectedTransaction.balance_after || walletData.balance)}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>
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
        .reward-card {
          transition: all 0.2s ease;
        }
        .reward-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default Wallet;