// src/pages/admin/Payment.jsx
import React, { useState, useMemo, useRef } from 'react';
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
  ToastContainer
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
  FaBan
} from 'react-icons/fa';
// import api from '../../api'; // Uncomment when backend is ready

const Payment = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Data State – all defaults (no mock data, will be replaced by real API calls later)
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    pendingPayouts: 0,
    conversionRate: 0
  });
  const [revenueByMethod, setRevenueByMethod] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [commissionRates, setCommissionRates] = useState([]);
  const [disputes, setDisputes] = useState([]);

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
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

  const refreshIntervalRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // ========== API CALLS – COMMENTED OUT UNTIL BACKEND IS READY ==========
  // Uncomment these when you have implemented the endpoints.

  /*
  const fetchOverview = async () => {
    try {
      const response = await api.get('/admin/payments/overview');
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchRevenueByMethod = async () => {
    try {
      const response = await api.get('/admin/payments/revenue-by-method');
      setRevenueByMethod(response.data);
    } catch (error) {
      console.error('Error fetching revenue by method:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/payments/transactions', {
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await api.get('/admin/payments/payouts');
      setPayouts(response.data);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await api.get('/admin/payments/subscriptions');
      setSubscriptionPlans(response.data);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const fetchCommissionRates = async () => {
    try {
      const response = await api.get('/admin/payments/commissions');
      setCommissionRates(response.data);
    } catch (error) {
      console.error('Error fetching commission rates:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/admin/payments/disputes');
      setDisputes(response.data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchOverview(),
      fetchRevenueByMethod(),
      fetchTransactions(),
      fetchPayouts(),
      fetchSubscriptionPlans(),
      fetchCommissionRates(),
      fetchDisputes()
    ]);
  };
  */

  // Temporary placeholder – remove when API calls are uncommented
  const fetchAllData = () => {
    console.log('API calls are disabled – backend endpoints not yet implemented.');
    showToast('Backend APIs not ready – using placeholder data', 'info');
  };

  const handleRefresh = () => {
    fetchAllData();
    showToast('Data refreshed', 'info');
  };

  // Filter and sort transactions (client-side)
  const filteredTransactionsMemo = useMemo(() => {
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

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (startDate || endDate) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return (!startDate || txDate >= startDate) && (!endDate || txDate <= endDate);
      });
    }

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
    return filtered;
  }, [transactions, searchTerm, filterStatus, filterMethod, dateRange, sortConfig]);

  React.useEffect(() => {
    setFilteredTransactions(filteredTransactionsMemo);
  }, [filteredTransactionsMemo]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMethod, dateRange]);

  // Initial load – no auto-refresh until APIs are implemented
  React.useEffect(() => {
    fetchAllData();
    // Refresh every 30 seconds – comment out until APIs are ready
    // refreshIntervalRef.current = setInterval(fetchAllData, 30000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  // Re-fetch transactions when date range changes – will work once API is active
  /*
  React.useEffect(() => {
    fetchTransactions();
  }, [dateRange]);
  */

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

  const handleBulkAction = (action) => {
    setSelectedTransactions([]);
    setShowBulkActions(false);
    showToast(`${selectedTransactions.length} transactions ${action}`, 'success');
  };

  const handleRefund = async () => {
    if (selectedTransaction) {
      // Replace with real API call when ready
      // await api.post(`/admin/payments/transactions/${selectedTransaction.id}/refund`, {
      //   amount: refundAmount,
      //   reason: refundReason
      // });
      showToast('Refund processed (demo)', 'success');
      setShowRefundModal(false);
      setSelectedTransaction(null);
      setRefundAmount('');
      setRefundReason('');
    }
  };

  const handleDateRangeChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let start = new Date();
    switch(period) {
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
    setFilterStatus('all');
    setFilterMethod('all');
    setDateRange({
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedPeriod('30days');
    setCurrentPage(1);
    showToast('All filters reset', 'info');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setTimeout(() => {
      const exportData = filteredTransactions.map(tx => ({
        'Transaction ID': tx.id,
        Date: tx.date,
        Customer: tx.customer,
        Provider: tx.provider,
        Service: tx.service,
        Amount: tx.amount,
        Method: tx.method,
        Status: tx.status,
        Fee: tx.fee,
        Net: tx.net
      }));
      let content = '';
      let filename = `transactions_${new Date().toISOString().split('T')[0]}`;
      let mimeType = '';
      if (exportFormat === 'csv') {
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','));
        content = [headers, ...rows].join('\n');
        mimeType = 'text/csv';
        filename += '.csv';
      } else if (exportFormat === 'excel') {
        const headers = Object.keys(exportData[0]).join('\t');
        const rows = exportData.map(row => Object.values(row).join('\t'));
        content = [headers, ...rows].join('\n');
        mimeType = 'application/vnd.ms-excel';
        filename += '.xls';
      } else {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        filename += '.json';
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setShowExportModal(false);
      showToast(`Exported ${filteredTransactions.length} transactions`, 'success');
    }, 500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Transactions Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
      </style>
      </head>
      <body>
        <h1>Transactions Report</h1>
        <p>Date Range: ${dateRange.start} to ${dateRange.end}</p>
        <table>
          <thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Provider</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            ${filteredTransactions.map(tx => `<tr><td>${tx.id}</td><td>${tx.date}</td><td>${tx.customer}</td><td>${tx.provider}</td><td>₦${tx.amount}</td><td>${tx.status}</td></tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    showToast('Print job started', 'info');
  };

  const formatCurrency = (amount) => `₦${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const formatNumber = (num) => (num || 0).toLocaleString();

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'success', icon: <FaCheckCircle />, label: 'Completed' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      failed: { bg: 'danger', icon: <FaTimesCircle />, label: 'Failed' },
      refunded: { bg: 'info', icon: <FaUndo />, label: 'Refunded' },
      processing: { bg: 'info', icon: <FaSpinner />, label: 'Processing' }
    };
    const b = badges[status] || badges.pending;
    return <Badge bg={b.bg} className="d-flex align-items-center gap-1 py-2 px-3 rounded-pill">{b.icon}<span>{b.label}</span></Badge>;
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'Credit Card': return <FaCcVisa className="text-primary" />;
      case 'PayPal': return <FaPaypal className="text-primary" />;
      case 'Bank Transfer': return <FaUniversity className="text-success" />;
      case 'Cryptocurrency': return <FaBitcoin className="text-warning" />;
      default: return <FaMoneyBillWave className="text-secondary" />;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <Container fluid className="payment-container py-4">
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
          <h2 className="mb-2">Payment Management</h2>
          <p className="text-muted mb-0">Monitor transactions, manage payouts, and configure payment settings</p>
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
              <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}><FaFileCsv className="me-2 text-success" /> CSV</Dropdown.Item>
              <Dropdown.Item onClick={() => { setExportFormat('excel'); setShowExportModal(true); }}><FaFileExcel className="me-2 text-success" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={() => { setExportFormat('pdf'); setShowExportModal(true); }}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="primary" onClick={handlePrint}><FaPrint className="me-2" /> Print</Button>
          <Button variant="outline-secondary" onClick={resetFilters}><FaRedo className="me-2" /> Reset</Button>
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
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Custom Range</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                    <Form.Control type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                  </div>
                </Form.Group>
              </Col>
            )}
            <Col md={2} className="d-flex align-items-end">
              <Button variant="primary" className="w-100" onClick={() => showToast('Date range applied (demo)', 'info')}><FaSearch className="me-2" /> Apply</Button>
            </Col>
            <Col md={3} className="d-flex align-items-end justify-content-end">
              <small className="text-muted">Showing {filteredTransactions.length} of {transactions.length} transactions</small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-0">
          <Nav variant="tabs" className="px-3 pt-3">
            <Nav.Item><Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><FaChartLine className="me-2" /> Overview</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}><FaMoneyBillWave className="me-2" /> Transactions</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'payouts'} onClick={() => setActiveTab('payouts')}><FaWallet className="me-2" /> Payouts</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'subscriptions'} onClick={() => setActiveTab('subscriptions')}><FaCalendarAlt className="me-2" /> Subscriptions</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'commissions'} onClick={() => setActiveTab('commissions')}><FaPercentage className="me-2" /> Commissions</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')}><FaBalanceScale className="me-2" /> Disputes</Nav.Link></Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <Row className="g-3 mb-4">
            <Col xl={3} lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3"><FaMoneyBillWave className="text-primary" size={24} /></div>
                    <div><h3 className="mb-0">{formatCurrency(overview.totalRevenue)}</h3><small className="text-muted">Total Revenue</small></div>
                  </div>
                  <div className="text-success mt-2"><FaArrowUp className="me-1" />{formatCurrency(overview.monthlyRevenue)} this month</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3"><FaCreditCard className="text-success" size={24} /></div>
                    <div><h3 className="mb-0">{formatNumber(overview.totalTransactions)}</h3><small className="text-muted">Transactions</small></div>
                  </div>
                  <div className="text-success mt-2"><FaCheckCircle className="me-1" />{overview.successfulTransactions} successful</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3"><FaWallet className="text-warning" size={24} /></div>
                    <div><h3 className="mb-0">{formatCurrency(overview.pendingPayouts)}</h3><small className="text-muted">Pending Payouts</small></div>
                  </div>
                  <div className="mt-2"><FaClock className="me-1" /> Awaiting processing</div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3"><FaPercentage className="text-info" size={24} /></div>
                    <div><h3 className="mb-0">{overview.conversionRate}%</h3><small className="text-muted">Conversion Rate</small></div>
                  </div>
                  <div className="text-success mt-2"><FaArrowUp className="me-1" />+5.2% vs last month</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4"><h5 className="mb-0">Revenue by Payment Method</h5></Card.Header>
                <Card.Body>
                  {revenueByMethod.length === 0 ? (
                    <div className="text-muted text-center py-4">No revenue data available. Implement API to see breakdown.</div>
                  ) : (
                    revenueByMethod.map((item, idx) => (
                      <div key={idx} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <div>{item.method}</div>
                          <span className="fw-bold">{formatCurrency(item.amount)}</span>
                        </div>
                        <ProgressBar now={item.percentage} variant={item.color === '#3b82f6' ? 'primary' : item.color === '#10b981' ? 'success' : item.color === '#f59e0b' ? 'warning' : 'info'} style={{ height: '8px' }} />
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted">{item.percentage}%</small>
                          <small className="text-muted">{item.count} transactions</small>
                        </div>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4 d-flex justify-content-between">
              <h5 className="mb-0">Recent Transactions</h5>
              <Button variant="link" onClick={() => setActiveTab('transactions')}>View All <FaArrowRight size={12} /></Button>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover>
                  <thead className="bg-light">
                    <tr><th>Transaction ID</th><th>Date</th><th>Customer</th><th>Provider</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.id}</td>
                        <td>{tx.date}</td>
                        <td>{tx.customer}</td>
                        <td>{tx.provider}</td>
                        <td className="fw-bold text-primary">{formatCurrency(tx.amount)}</td>
                        <td>{getStatusBadge(tx.status)}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan="6" className="text-muted text-center py-4">No transactions found – backend API not implemented yet.</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <>
          {showFilters && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></InputGroup></Col>
                  <Col md={2}><Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></Form.Select></Col>
                  <Col md={2}><Form.Select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}><option value="all">All Methods</option><option value="Credit Card">Credit Card</option><option value="PayPal">PayPal</option><option value="Bank Transfer">Bank Transfer</option></Form.Select></Col>
                  <Col md={2}><Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}><option value="10">10 per page</option><option value="25">25</option><option value="50">50</option></Form.Select></Col>
                  <Col md={2}><Button variant="outline-secondary" className="w-100" onClick={resetFilters}>Reset</Button></Col>
                </Row>
                {selectedTransactions.length > 0 && (
                  <div className="d-flex gap-2 mt-3 pt-3 border-top">
                    <Button size="sm" variant="success" onClick={() => handleBulkAction('exported')}><FaDownload className="me-2" /> Export ({selectedTransactions.length})</Button>
                    <Button size="sm" variant="warning" onClick={() => setShowBulkActions(true)}><FaUndo className="me-2" /> Bulk Actions</Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="transactions-table mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '40px' }}><Form.Check type="checkbox" checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0} onChange={handleSelectAll} /></th>
                      <th onClick={() => handleSort('id')}>ID {getSortIcon('id')}</th>
                      <th onClick={() => handleSort('date')}>Date {getSortIcon('date')}</th>
                      <th onClick={() => handleSort('customer')}>Customer {getSortIcon('customer')}</th>
                      <th onClick={() => handleSort('provider')}>Provider {getSortIcon('provider')}</th>
                      <th>Service</th>
                      <th onClick={() => handleSort('amount')}>Amount {getSortIcon('amount')}</th>
                      <th>Method</th>
                      <th onClick={() => handleSort('status')}>Status {getSortIcon('status')}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map(tx => (
                      <tr key={tx.id} className={selectedTransactions.includes(tx.id) ? 'table-active' : ''}>
                        <td><Form.Check type="checkbox" checked={selectedTransactions.includes(tx.id)} onChange={() => handleSelectTransaction(tx.id)} /></td>
                        <td>{tx.id}</td>
                        <td><FaCalendarAlt className="me-1 text-muted" size={10} /> {tx.date}</td>
                        <td>{tx.customer}</td>
                        <td>{tx.provider}</td>
                        <td>{tx.service}</td>
                        <td>
                          <span className="fw-bold text-primary">{formatCurrency(tx.amount)}</span>
                          <small className="text-muted d-block">Fee: {formatCurrency(tx.fee)} | Net: {formatCurrency(tx.net)}</small>
                        </td>
                        <td><div className="d-flex gap-2">{getPaymentIcon(tx.method)} {tx.method}</div></td>
                        <td>{getStatusBadge(tx.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => { setSelectedTransaction(tx); setShowTransactionModal(true); }}><FaEye /></Button>
                            {tx.status === 'completed' && (
                              <Button size="sm" variant="outline-warning" onClick={() => { setSelectedTransaction(tx); setShowRefundModal(true); setRefundAmount(tx.amount); }}><FaUndo /></Button>
                            )}
                            <Dropdown>
                              <Dropdown.Toggle size="sm" variant="outline-secondary"><FaEllipsisV /></Dropdown.Toggle>
                              <Dropdown.Menu><Dropdown.Item><FaBan className="me-2" /> Flag</Dropdown.Item></Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr><td colSpan="10" className="text-center py-5"><FaMoneyBillWave size={48} className="text-muted mb-3" /><h5>No transactions found</h5><Button variant="primary" onClick={resetFilters}>Reset Filters</Button></td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
              {filteredTransactions.length > 0 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTransactions.length)} of {filteredTransactions.length}</div>
                  <Pagination className="mb-0">
                    <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} />
                    {[...Array(Math.min(5, totalPages)).keys()].map(num => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = num + 1;
                      else if (currentPage <= 3) pageNum = num + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + num;
                      else pageNum = currentPage - 2 + num;
                      return <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;
                    })}
                    <Pagination.Next onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* PAYOUTS TAB */}
      {activeTab === 'payouts' && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="text-muted text-center py-4">
              Payouts data will appear here once the backend endpoint is implemented.
            </div>
          </Card.Body>
        </Card>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="text-muted text-center py-4">
              Subscriptions data will appear here once the backend endpoint is implemented.
            </div>
          </Card.Body>
        </Card>
      )}

      {/* COMMISSIONS TAB */}
      {activeTab === 'commissions' && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="text-muted text-center py-4">
              Commission rates will appear here once the backend endpoint is implemented.
            </div>
          </Card.Body>
        </Card>
      )}

      {/* DISPUTES TAB */}
      {activeTab === 'disputes' && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="text-muted text-center py-4">
              Disputes will appear here once the backend endpoint is implemented.
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modals */}
      <Modal show={showTransactionModal} onHide={() => setShowTransactionModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Transaction Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <div>
              <p><strong>ID:</strong> {selectedTransaction.id}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedTransaction.amount)}</p>
              <p><strong>Status:</strong> {selectedTransaction.status}</p>
              <p><strong>Customer:</strong> {selectedTransaction.customer}</p>
              <p><strong>Provider:</strong> {selectedTransaction.provider}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowTransactionModal(false)}>Close</Button></Modal.Footer>
      </Modal>

      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Process Refund</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Amount</Form.Label><Form.Control type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} /></Form.Group>
          <Form.Group><Form.Label>Reason</Form.Label><Form.Select value={refundReason} onChange={(e) => setRefundReason(e.target.value)}><option value="">Select...</option><option value="customer_request">Customer Request</option><option value="service_issue">Service Issue</option></Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowRefundModal(false)}>Cancel</Button><Button variant="warning" onClick={handleRefund}>Refund</Button></Modal.Footer>
      </Modal>

      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Export Transactions</Modal.Title></Modal.Header>
        <Modal.Body><p>Exporting {filteredTransactions.length} transactions as {exportFormat.toUpperCase()}</p>{isExporting && <FaSpinner className="fa-spin" />}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button><Button variant="primary" onClick={handleExport}>Export</Button></Modal.Footer>
      </Modal>

      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton><Modal.Title>Bulk Actions</Modal.Title></Modal.Header>
        <Modal.Body><div className="d-grid gap-2"><Button variant="success" onClick={() => handleBulkAction('exported')}>Export</Button><Button variant="danger" onClick={() => handleBulkAction('flagged')}>Flag for Review</Button></div></Modal.Body>
      </Modal>

      <style>{`
        .payment-container {
          max-width: 1600px;
          margin: 0 auto;
        }
        .fa-spin {
          animation: fa-spin 2s infinite linear;
        }
        @keyframes fa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .transactions-table td {
            min-width: 120px;
          }
        }
      `}</style>
    </Container>
  );
};

export default Payment;