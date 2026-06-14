// src/pages/Wallet.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Table, 
  Badge, Form, Modal, Alert, ProgressBar, InputGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaWallet, FaGift, FaHistory, FaArrowRight,
  FaStar, FaCrown, FaMedal, FaGem,
  FaCheckCircle, FaTimesCircle, FaClock,
  FaDollarSign, FaCoins, FaPiggyBank,
  FaPercentage, FaPlus, FaMinus, FaExclamationCircle,
  FaArrowUp, FaArrowDown, FaFileInvoice,
  FaMoneyBillWave
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Wallet state
  const [walletData, setWalletData] = useState({
    balance: 0,
    points: 0,
    tier: 'Bronze',
    nextTier: 'Silver',
    pointsToNextTier: 0,
    lifetimeEarnings: 0,
    pendingPayout: 0,
    totalWithdrawn: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    currency: 'USD',
    withdrawalLimit: 10000,
    minWithdrawal: 50,
    maxWithdrawal: 5000,
    dailyWithdrawalLimit: 2000
  });

  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState([]);
  
  // Modal states
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemStep, setRedeemStep] = useState(1);
  const [redeemCode, setRedeemCode] = useState('');
  
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [addFundsStep, setAddFundsStep] = useState(1);
  const [addFundsTransactionId, setAddFundsTransactionId] = useState('');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState(null);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawTransactionId, setWithdrawTransactionId] = useState('');

  // ========== FETCH DATA (non-blocking) ==========
  const fetchWalletData = async () => {
    try {
      const res = await api.get('/wallet');
      setWalletData(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      toast.error('Could not load wallet data');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/wallet/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const fetchRewards = async () => {
    try {
      const res = await api.get('/wallet/rewards');
      setRewards(res.data);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  };

  const fetchRedeemHistory = async () => {
    try {
      const res = await api.get('/wallet/redeem-history');
      setRedeemHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch redeem history:', err);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/wallet/payment-methods');
      setPaymentMethods(res.data);
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    }
  };

  const fetchWithdrawalMethods = async () => {
    try {
      const res = await api.get('/wallet/withdrawal-methods');
      setWithdrawalMethods(res.data);
    } catch (err) {
      console.error('Failed to fetch withdrawal methods:', err);
    }
  };

  useEffect(() => {
    // 🔥 Non-blocking: start all requests, but render immediately
    fetchWalletData();
    fetchTransactions();
    fetchRewards();
    fetchRedeemHistory();
    fetchPaymentMethods();
    fetchWithdrawalMethods();
    
    // Hide loading after a short delay (or immediately)
    setLoading(false);
  }, []);

  // ========== ADD FUNDS ==========
  const handleAddFunds = () => {
    setAddFundsStep(1);
    setAddFundsAmount('');
    setSelectedPaymentMethod(null);
    setShowAddFundsModal(true);
  };

  const handleAddFundsAmountSubmit = () => {
    const amount = parseFloat(addFundsAmount);
    if (!addFundsAmount || isNaN(amount) || amount < 10) {
      toast.error('Please enter a valid amount (minimum $10)');
      return;
    }
    if (amount > 10000) {
      toast.error('Maximum add funds amount is $10,000');
      return;
    }
    setAddFundsStep(2);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/wallet/add-funds', {
        amount: parseFloat(addFundsAmount),
        paymentMethodId: selectedPaymentMethod.id
      });
      setAddFundsTransactionId(res.data.transactionId);
      await fetchWalletData();
      await fetchTransactions();
      toast.success(`$${addFundsAmount} added to your wallet!`);
      setAddFundsStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFundsClose = () => {
    setShowAddFundsModal(false);
    setAddFundsStep(1);
    setAddFundsAmount('');
    setSelectedPaymentMethod(null);
  };

  // ========== WITHDRAW ==========
  const handleWithdraw = () => {
    setWithdrawStep(1);
    setWithdrawAmount('');
    setSelectedWithdrawMethod(null);
    setShowWithdrawModal(true);
  };

  const handleWithdrawAmountSubmit = () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount < walletData.minWithdrawal) {
      toast.error(`Minimum withdrawal amount is ₦${walletData.minWithdrawal}`);
      return;
    }
    if (amount > walletData.balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (amount > walletData.maxWithdrawal) {
      toast.error(`Maximum withdrawal amount is ₦${walletData.maxWithdrawal}`);
      return;
    }
    if (amount > walletData.dailyWithdrawalLimit) {
      toast.error(`Daily withdrawal limit is ₦${walletData.dailyWithdrawalLimit}`);
      return;
    }
    setWithdrawStep(2);
  };

  const handleWithdrawMethodSelect = (method) => {
    setSelectedWithdrawMethod(method);
    setWithdrawStep(3);
  };

  const handleConfirmWithdraw = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        amount: parseFloat(withdrawAmount),
        withdrawalMethodId: selectedWithdrawMethod.id
      });
      setWithdrawTransactionId(res.data.transactionId);
      await fetchWalletData();
      await fetchTransactions();
      toast.success(`Withdrawal request for ₦${withdrawAmount} submitted!`);
      setWithdrawStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawClose = () => {
    setShowWithdrawModal(false);
    setWithdrawStep(1);
    setWithdrawAmount('');
    setSelectedWithdrawMethod(null);
  };

  // ========== REDEEM REWARD ==========
  const handleRedeemClick = (reward) => {
    setSelectedReward(reward);
    setRedeemStep(1);
    setShowRedeemModal(true);
    setRedeemCode('');
  };

  const handleConfirmRedeem = () => {
    setRedeemStep(2);
  };

  const handleProcessRedeem = async () => {
    if (!selectedReward) return;
    setActionLoading(true);
    try {
      const res = await api.post('/wallet/redeem', {
        rewardId: selectedReward.id
      });
      setRedeemCode(res.data.code);
      await fetchWalletData();
      await fetchRewards();
      await fetchRedeemHistory();
      if (selectedReward.type === 'cash') {
        await fetchTransactions();
        toast.success(`₦${selectedReward.value} added to your wallet!`);
      } else {
        toast.success(`${selectedReward.name} redeemed successfully!`);
      }
      setRedeemStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(redeemCode);
    toast.success('Code copied to clipboard!');
  };

  const handleCloseRedeemModal = () => {
    setShowRedeemModal(false);
    setSelectedReward(null);
    setRedeemStep(1);
    setRedeemCode('');
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'success', text: 'Active', icon: <FaCheckCircle /> },
      redeemed: { bg: 'info', text: 'Redeemed', icon: <FaCheckCircle /> },
      used: { bg: 'secondary', text: 'Used', icon: <FaTimesCircle /> },
      expired: { bg: 'danger', text: 'Expired', icon: <FaTimesCircle /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock /> },
      completed: { bg: 'success', text: 'Completed', icon: <FaCheckCircle /> }
    };
    return badges[status] || badges.pending;
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'Bronze': return <FaMedal className="text-secondary" />;
      case 'Silver': return <FaMedal className="text-secondary" />;
      case 'Gold': return <FaCrown className="text-warning" />;
      case 'Platinum': return <FaGem className="text-info" />;
      default: return <FaStar className="text-warning" />;
    }
  };

  // No loading spinner – render immediately with default values
  if (loading) {
    return null; // or a minimal placeholder
  }

  return (
    <Container fluid className="wallet-container py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Wallet</h2>
          <p className="text-muted">Manage your balance, earnings, and rewards</p>
        </Col>
      </Row>

      {/* Earnings Overview Cards */}
      <Row className="g-4 mb-4">
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm summary-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="summary-icon bg-primary bg-opacity-10">
                  <FaMoneyBillWave className="text-primary" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="summary-value">{formatCurrency(walletData.lifetimeEarnings)}</h3>
                  <p className="summary-label mb-0">Total Earnings</p>
                </div>
                <div className="trend up">
                  <FaArrowUp /> +{((walletData.thisMonthEarnings - walletData.lastMonthEarnings) / (walletData.lastMonthEarnings || 1) * 100).toFixed(1)}%
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm summary-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="summary-icon bg-success bg-opacity-10">
                  <FaWallet className="text-success" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="summary-value">{formatCurrency(walletData.balance)}</h3>
                  <p className="summary-label mb-0">Available Balance</p>
                </div>
                <Badge bg="success" pill>Ready</Badge>
              </div>
              <div className="mt-3 d-flex gap-2">
                <Button size="sm" variant="outline-primary" className="flex-fill" onClick={handleAddFunds}>
                  <FaPlus className="me-1" /> Add Funds
                </Button>
                <Button size="sm" variant="outline-success" className="flex-fill" onClick={handleWithdraw} disabled={walletData.balance < walletData.minWithdrawal}>
                  <FaMinus className="me-1" /> Withdraw
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm summary-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="summary-icon bg-warning bg-opacity-10">
                  <FaClock className="text-warning" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="summary-value">{formatCurrency(walletData.pendingPayout)}</h3>
                  <p className="summary-label mb-0">Pending Payout</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm summary-card">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="summary-icon bg-info bg-opacity-10">
                  <FaCoins className="text-info" size={24} />
                </div>
                <div className="ms-3 flex-grow-1">
                  <h3 className="summary-value">{walletData.points.toLocaleString()}</h3>
                  <p className="summary-label mb-0">Loyalty Points</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-muted">Points to next tier</small>
                  <small className="fw-semibold">{walletData.pointsToNextTier}</small>
                </div>
                <ProgressBar now={walletData.points / (walletData.points + walletData.pointsToNextTier) * 100} variant="warning" style={{ height: '6px' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats & Transaction History */}
      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <h5 className="mb-0"><FaPercentage className="text-info me-2" /> Quick Stats</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">This month</span>
                <span className="fw-semibold text-success">{formatCurrency(walletData.thisMonthEarnings)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Last month</span>
                <span className="fw-semibold">{formatCurrency(walletData.lastMonthEarnings)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Growth</span>
                <span className="fw-semibold text-success">
                  +{((walletData.thisMonthEarnings - walletData.lastMonthEarnings) / (walletData.lastMonthEarnings || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span className="text-muted">Tier</span>
                <span className="fw-semibold">{walletData.tier}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <h5 className="mb-0"><FaHistory className="text-primary me-2" /> Recent Transactions</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                      <th>Status</th>
                      <th className="text-end">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.date}</td>
                        <td>{tx.description}</td>
                        <td className={`text-end fw-semibold ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </td>
                        <td><Badge bg={tx.status === 'completed' ? 'success' : 'warning'}>{tx.status}</Badge></td>
                        <td className="text-end fw-semibold">{formatCurrency(tx.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Rewards Section */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><FaGift className="text-warning me-2" /> Available Rewards</h5>
                <Badge bg="warning" text="dark">{walletData.points} points available</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {rewards.map(reward => (
                  <Col key={reward.id} lg={3} md={4} sm={6}>
                    <Card className={`reward-card h-100 ${walletData.points >= reward.points ? 'available' : 'unavailable'} ${reward.popular ? 'popular' : ''}`}>
                      {reward.popular && <Badge bg="warning" text="dark" className="popular-badge"><FaStar className="me-1" size={10} /> Popular</Badge>}
                      <Card.Body className="text-center">
                        <div className="reward-icon mx-auto mb-3" style={{ backgroundColor: `${reward.color}20`, color: reward.color, width: '60px', height: '60px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>{reward.icon}</div>
                        <h6 className="mb-2">{reward.name}</h6>
                        <p className="small text-muted mb-2">{reward.description}</p>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <Badge bg={walletData.points >= reward.points ? 'success' : 'secondary'} className="px-2 py-1">{reward.points} pts</Badge>
                          <small className="text-muted">{reward.limit}</small>
                        </div>
                        {walletData.points >= reward.points ? (
                          <Button variant="link" className="mt-2 p-0 text-primary" onClick={() => handleRedeemClick(reward)}>Redeem Now <FaArrowRight size={12} /></Button>
                        ) : (
                          <div className="mt-2"><small className="text-danger">Need {reward.points - walletData.points} more pts</small></div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Redeem History */}
      <Row className="g-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <h5 className="mb-0"><FaHistory className="text-primary me-2" /> Redeem History</h5>
            </Card.Header>
            <Card.Body>
              {redeemHistory.length > 0 ? (
                <Row className="g-3">
                  {redeemHistory.map(item => {
                    const status = getStatusBadge(item.status);
                    return (
                      <Col key={item.id} md={6} lg={4}>
                        <div className="redeem-item p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">{item.reward}</h6>
                            <Badge bg={status.bg} className="d-flex align-items-center gap-1">{status.icon}<span>{status.text}</span></Badge>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <small className="text-muted">Redeemed: {item.date}</small>
                            <small className="fw-semibold text-warning">{item.points} pts</small>
                          </div>
                          {item.status === 'active' && (
                            <>
                              <div className="bg-light p-2 rounded d-flex justify-content-between align-items-center mb-2">
                                <code className="text-primary">{item.code}</code>
                                <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => { navigator.clipboard.writeText(item.code); toast.success('Code copied!'); }}>Copy</Button>
                              </div>
                              <small className="text-muted">Expires: {item.expiresAt}</small>
                            </>
                          )}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <div className="text-center py-5"><FaGift size={48} className="text-muted mb-3" /><h6>No redemption history</h6><p className="text-muted small">Redeem your first reward to get started</p></div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ========== ADD FUNDS MODAL ========== */}
      <Modal show={showAddFundsModal} onHide={handleAddFundsClose} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{addFundsStep === 1 && 'Add Funds to Wallet'}{addFundsStep === 2 && 'Select Payment Method'}{addFundsStep === 3 && 'Funds Added Successfully!'}</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          {addFundsStep === 1 && (
            <div>
              <h5 className="text-center mb-4">How much would you like to add?</h5>
              <Row className="justify-content-center mb-4">
                <Col md={8}>
                  <InputGroup size="lg">
                    <InputGroup.Text>₦</InputGroup.Text>
                    <Form.Control type="number" placeholder="Enter amount" value={addFundsAmount} onChange={(e) => setAddFundsAmount(e.target.value)} min="10" max="10000" step="10" autoFocus />
                  </InputGroup>
                  <div className="d-flex justify-content-between mt-2"><small className="text-muted">Minimum: ₦10</small><small className="text-muted">Maximum: ₦10,000</small></div>
                </Col>
              </Row>
              <Row className="g-2 mb-4">
                {[20, 50, 100, 200, 500].map(amount => (<Col key={amount}><Button variant="outline-primary" className="w-100" onClick={() => setAddFundsAmount(amount.toString())}>₦{amount}</Button></Col>))}
              </Row>
              <div className="bg-light p-3 rounded">
                <div className="d-flex justify-content-between mb-2"><span>Amount to add:</span><span className="fw-bold">{formatCurrency(parseFloat(addFundsAmount) || 0)}</span></div>
                <div className="d-flex justify-content-between text-success"><span>New balance:</span><span className="fw-bold">{formatCurrency(walletData.balance + (parseFloat(addFundsAmount) || 0))}</span></div>
              </div>
            </div>
          )}
          {addFundsStep === 2 && (
            <div>
              <h5 className="text-center mb-4">Select Payment Method</h5>
              <div className="mb-4"><h6 className="mb-3">Saved Payment Methods</h6>{paymentMethods.map(method => (<div key={method.id} className={`payment-method-item p-3 border rounded mb-2 ${selectedPaymentMethod?.id === method.id ? 'selected' : ''}`} onClick={() => setSelectedPaymentMethod(method)} style={{ cursor: 'pointer' }}><div className="d-flex align-items-center"><div className="payment-icon me-3">{method.icon}</div><div className="flex-grow-1"><h6 className="mb-0">{method.name}</h6>{method.type === 'card' && <small className="text-muted">Expires {method.details.expiry}</small>}{method.type === 'paypal' && <small className="text-muted">{method.details.email}</small>}{method.type === 'bank' && <small className="text-muted">{method.details.bankName} • {method.details.accountNumber}</small>}</div>{method.isDefault && <Badge bg="success" className="ms-2">Default</Badge>}</div></div>))}</div>
              <Button variant="link" className="p-0 mb-3">+ Add New Payment Method</Button>
            </div>
          )}
          {addFundsStep === 3 && (
            <div className="text-center">
              <div className="success-animation mb-4"><FaCheckCircle size={80} className="text-success" /></div>
              <h4 className="mb-3">Payment Successful!</h4>
              <p className="text-muted mb-4">{formatCurrency(parseFloat(addFundsAmount))} has been added to your wallet.</p>
              <div className="bg-light p-4 rounded mb-3"><p className="mb-2">Transaction ID:</p><code className="bg-white p-2 rounded">{addFundsTransactionId}</code></div>
              <div className="d-flex justify-content-between bg-success bg-opacity-10 p-3 rounded"><span>New Balance:</span><span className="fw-bold text-success fs-5">{formatCurrency(walletData.balance)}</span></div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {addFundsStep < 3 && (<><Button variant="secondary" onClick={handleAddFundsClose}>Cancel</Button>{addFundsStep === 1 && <Button variant="primary" onClick={handleAddFundsAmountSubmit} disabled={!addFundsAmount || parseFloat(addFundsAmount) < 10}>Continue <FaArrowRight className="ms-2" /></Button>}{addFundsStep === 2 && <Button variant="success" onClick={handleProcessPayment} disabled={!selectedPaymentMethod || actionLoading}>{actionLoading ? 'Processing...' : `Pay ${formatCurrency(parseFloat(addFundsAmount))}`}</Button>}</>)}
          {addFundsStep === 3 && <Button variant="primary" onClick={handleAddFundsClose}>Done</Button>}
        </Modal.Footer>
      </Modal>

      {/* ========== WITHDRAW MODAL ========== */}
      <Modal show={showWithdrawModal} onHide={handleWithdrawClose} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{withdrawStep === 1 && 'Withdraw Funds'}{withdrawStep === 2 && 'Select Withdrawal Method'}{withdrawStep === 3 && 'Confirm Withdrawal'}{withdrawStep === 4 && 'Withdrawal Request Submitted'}</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          {withdrawStep === 1 && (
            <div>
              <h5 className="text-center mb-4">How much would you like to withdraw?</h5>
              <Row className="justify-content-center mb-4"><Col md={8}><InputGroup size="lg"><InputGroup.Text>₦</InputGroup.Text><Form.Control type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} min={walletData.minWithdrawal} max={Math.min(walletData.balance, walletData.maxWithdrawal)} step="10" autoFocus /></InputGroup><div className="d-flex justify-content-between mt-2"><small className="text-muted">Min: ₦{walletData.minWithdrawal}</small><small className="text-muted">Max: ₦{Math.min(walletData.balance, walletData.maxWithdrawal)}</small></div></Col></Row>
              <Row className="g-2 mb-4">{/* amount buttons */}</Row>
              <div className="bg-light p-3 rounded"><div className="d-flex justify-content-between mb-2"><span>Available balance:</span><span className="fw-bold">{formatCurrency(walletData.balance)}</span></div><div className="d-flex justify-content-between mb-2"><span>Amount to withdraw:</span><span className="fw-bold">{formatCurrency(parseFloat(withdrawAmount) || 0)}</span></div><div className="d-flex justify-content-between text-warning"><span>Remaining balance:</span><span className="fw-bold">{formatCurrency(walletData.balance - (parseFloat(withdrawAmount) || 0))}</span></div></div>
            </div>
          )}
          {withdrawStep === 2 && (
            <div>
              <h5 className="text-center mb-4">Select Withdrawal Method</h5>
              {withdrawalMethods.map(method => {
                const amount = parseFloat(withdrawAmount);
                let fee = 0, total = amount;
                if (method.type === 'paypal') { fee = amount * 0.029 + 0.30; total = amount - fee; }
                else if (method.type === 'card') { fee = 1.00; total = amount - fee; }
                return (
                  <div key={method.id} className="withdraw-method-item p-3 border rounded mb-3" onClick={() => handleWithdrawMethodSelect(method)} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center"><div className="method-icon me-3">{method.icon}</div><div className="flex-grow-1"><h6 className="mb-1">{method.name}</h6><small className="text-muted d-block">{method.type === 'bank' && `${method.details.accountNumber} • ${method.details.estimatedTime}`}{method.type === 'paypal' && method.details.email}{method.type === 'card' && `Card ending in ${method.details.last4}`}</small></div>{method.isDefault && <Badge bg="success" className="ms-2">Default</Badge>}</div>
                    <div className="mt-2 pt-2 border-top"><div className="d-flex justify-content-between small"><span>Fee:</span><span className={fee > 0 ? 'text-danger' : 'text-success'}>{fee > 0 ? `$${fee.toFixed(2)}` : 'Free'}</span></div><div className="d-flex justify-content-between small"><span>You'll receive:</span><span className="fw-semibold text-success">${total.toFixed(2)}</span></div><div className="d-flex justify-content-between small"><span>Estimated time:</span><span>{method.details.estimatedTime}</span></div></div>
                  </div>
                );
              })}
              <Button variant="link" className="p-0 mt-2">+ Add New Withdrawal Method</Button>
            </div>
          )}
          {withdrawStep === 3 && selectedWithdrawMethod && (
            <div>
              <h5 className="text-center mb-4">Confirm Withdrawal</h5>
              <Alert variant="warning" className="mb-4"><FaExclamationCircle className="me-2" /> Please review the details below before confirming.</Alert>
              <div className="bg-light p-4 rounded mb-4">
                <h6 className="mb-3">Withdrawal Summary</h6>
                <div className="d-flex justify-content-between mb-2"><span className="text-muted">Amount:</span><span className="fw-bold">{formatCurrency(parseFloat(withdrawAmount))}</span></div>
                {selectedWithdrawMethod.type === 'paypal' && (<div className="d-flex justify-content-between mb-2"><span className="text-muted">Fee (2.9% + ₦0.30):</span><span className="text-danger">-₦{(parseFloat(withdrawAmount) * 0.029 + 0.30).toFixed(2)}</span></div>)}
                {selectedWithdrawMethod.type === 'card' && (<div className="d-flex justify-content-between mb-2"><span className="text-muted">Fee (fixed):</span><span className="text-danger">-₦1.00</span></div>)}
                <div className="d-flex justify-content-between mb-3 pt-2 border-top"><span className="fw-semibold">You'll receive:</span><span className="fw-bold text-success">{formatCurrency(parseFloat(withdrawAmount) - (selectedWithdrawMethod.type === 'paypal' ? parseFloat(withdrawAmount) * 0.029 + 0.30 : selectedWithdrawMethod.type === 'card' ? 1.00 : 0))}</span></div>
                <hr />
                <h6 className="mb-3">Withdrawal Method</h6>
                <div className="d-flex align-items-center mb-2"><div className="me-3">{selectedWithdrawMethod.icon}</div><div><p className="mb-0 fw-semibold">{selectedWithdrawMethod.name}</p><small className="text-muted">{selectedWithdrawMethod.type === 'bank' ? selectedWithdrawMethod.details.accountNumber : selectedWithdrawMethod.type === 'paypal' ? selectedWithdrawMethod.details.email : `Card ending in ${selectedWithdrawMethod.details.last4}`}</small></div></div>
                <div className="mt-3"><small className="text-muted">Estimated arrival: {selectedWithdrawMethod.details.estimatedTime}</small></div>
              </div>
            </div>
          )}
          {withdrawStep === 4 && (
            <div className="text-center">
              <div className="success-animation mb-4"><FaCheckCircle size={80} className="text-success" /></div>
              <h4 className="mb-3">Withdrawal Request Submitted!</h4>
              <p className="text-muted mb-4">Your withdrawal request has been received and is being processed.</p>
              <div className="bg-light p-4 rounded mb-3"><p className="mb-2">Transaction ID:</p><code className="bg-white p-2 rounded">{withdrawTransactionId}</code></div>
              <div className="d-flex justify-content-between bg-warning bg-opacity-10 p-3 rounded"><span>New Balance:</span><span className="fw-bold text-warning fs-5">{formatCurrency(walletData.balance)}</span></div>
              <p className="text-muted small mt-3">Funds will be transferred to your account within {selectedWithdrawMethod?.details.estimatedTime || '2-3 business days'}.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {withdrawStep < 4 && (<><Button variant="secondary" onClick={handleWithdrawClose}>Cancel</Button>{withdrawStep === 1 && <Button variant="primary" onClick={handleWithdrawAmountSubmit} disabled={!withdrawAmount || parseFloat(withdrawAmount) < walletData.minWithdrawal || parseFloat(withdrawAmount) > walletData.balance}>Continue <FaArrowRight className="ms-2" /></Button>}{withdrawStep === 2 && <Button variant="primary" disabled={!selectedWithdrawMethod} onClick={() => setWithdrawStep(3)}>Continue <FaArrowRight className="ms-2" /></Button>}{withdrawStep === 3 && <Button variant="success" onClick={handleConfirmWithdraw} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Confirm Withdrawal'}</Button>}</>)}
          {withdrawStep === 4 && <Button variant="primary" onClick={handleWithdrawClose}>Done</Button>}
        </Modal.Footer>
      </Modal>

      {/* ========== REDEEM MODAL ========== */}
      <Modal show={showRedeemModal} onHide={handleCloseRedeemModal} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{redeemStep === 1 && 'Redeem Reward'}{redeemStep === 2 && 'Confirm Redemption'}{redeemStep === 3 && 'Redemption Successful!'}</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          {redeemStep === 1 && selectedReward && (
            <div className="text-center">
              <div className="reward-icon-large mx-auto mb-4" style={{ backgroundColor: `${selectedReward.color}20`, color: selectedReward.color, width: '100px', height: '100px', borderRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>{selectedReward.icon}</div>
              <h4 className="mb-3">{selectedReward.name}</h4>
              <p className="text-muted mb-4">{selectedReward.description}</p>
              <Row className="mb-4">
                <Col md={4}><div className="border rounded p-3"><small className="text-muted d-block">Points Required</small><h5 className="text-warning mb-0">{selectedReward.points}</h5></div></Col>
                <Col md={4}><div className="border rounded p-3"><small className="text-muted d-block">Your Points</small><h5 className="text-primary mb-0">{walletData.points}</h5></div></Col>
                <Col md={4}><div className="border rounded p-3"><small className="text-muted d-block">Balance After</small><h5 className="mb-0">{walletData.points - selectedReward.points}</h5></div></Col>
              </Row>
              <Alert variant="info" className="text-start"><Alert.Heading className="h6">Terms & Conditions</Alert.Heading><ul className="mb-0 small"><li>This reward is non-transferable</li><li>{selectedReward.limit}</li><li>Reward code expires in 30 days</li><li>Cannot be combined with other offers</li></ul></Alert>
            </div>
          )}
          {redeemStep === 2 && selectedReward && (
            <div className="text-center"><FaCheckCircle size={60} className="text-success mb-3" /><h5 className="mb-3">Confirm Redemption</h5><p className="mb-4">You are about to redeem <strong>{selectedReward.name}</strong> for <strong className="text-warning">{selectedReward.points} points</strong>.</p><Alert variant="warning"><FaExclamationCircle className="me-2" /> This action cannot be undone. Please confirm your choice.</Alert></div>
          )}
          {redeemStep === 3 && selectedReward && (
            <div className="text-center"><div className="success-animation mb-4"><FaCheckCircle size={80} className="text-success" /></div><h4 className="mb-3">Redemption Successful!</h4><p className="text-muted mb-4">Your reward has been added to your account.</p>
            {selectedReward.type === 'cash' ? (<Alert variant="success"><h6 className="mb-0">₦{selectedReward.value} has been added to your wallet balance!</h6></Alert>) : (<div className="bg-light p-4 rounded mb-3"><p className="mb-2">Your reward code:</p><div className="d-flex gap-2"><code className="bg-white p-3 rounded flex-grow-1 text-center fs-5">{redeemCode}</code><Button variant="primary" onClick={handleCopyCode}>Copy</Button></div><p className="text-muted small mt-2">Use this code when booking or contact support to apply your reward.</p></div>)}
            <div className="mt-3"><Button variant="primary" onClick={handleCloseRedeemModal} className="me-2">Done</Button><Button variant="outline-primary" onClick={() => { setRedeemStep(1); setSelectedReward(null); }}>Redeem Another</Button></div></div>
          )}
        </Modal.Body>
        {redeemStep < 3 && (<Modal.Footer><Button variant="secondary" onClick={handleCloseRedeemModal}>Cancel</Button>{redeemStep === 1 && <Button variant="primary" onClick={handleConfirmRedeem} disabled={walletData.points < selectedReward?.points}>Continue <FaArrowRight className="ms-2" /></Button>}{redeemStep === 2 && <Button variant="success" onClick={handleProcessRedeem} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Confirm & Redeem'}</Button>}</Modal.Footer>)}
      </Modal>

      <style>{`
        .wallet-container { max-width: 1400px; }
        .summary-card { border-radius: 12px; transition: all 0.3s ease; }
        .summary-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
        .summary-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .summary-value { font-size: 1.5rem; font-weight: 700; margin: 0; line-height: 1.2; }
        .summary-label { color: #718096; font-size: 0.85rem; }
        .trend { padding: 3px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
        .trend.up { background: rgba(72, 187, 120, 0.1); color: #48bb78; }
        .reward-card { position: relative; border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.3s ease; overflow: hidden; }
        .reward-card.available:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-color: #3b82f6; }
        .reward-card.unavailable { opacity: 0.7; background: #f8fafc; }
        .reward-card.popular { border: 2px solid #f59e0b; }
        .popular-badge { position: absolute; top: 10px; right: 10px; z-index: 1; }
        .payment-method-item { transition: all 0.2s ease; }
        .payment-method-item:hover { background: #f8fafc; }
        .payment-method-item.selected { border-color: #3b82f6 !important; background: #eff6ff !important; }
        .payment-icon { font-size: 1.8rem; color: #64748b; }
        .redeem-item { transition: all 0.2s ease; }
        .redeem-item:hover { background: #f7fafc; }
        .success-animation { animation: bounceIn 0.5s ease; }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 768px) {
          .wallet-container { padding: 10px; }
          .summary-value { font-size: 1.2rem; }
        }
      `}</style>
    </Container>
  );
};

export default Wallet;