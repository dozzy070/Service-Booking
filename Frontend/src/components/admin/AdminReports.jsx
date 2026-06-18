// src/components/admin/AdminReports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Dropdown,
  Modal,
  Spinner,
  Alert,
  ProgressBar
} from 'react-bootstrap';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  PieChart,
  BarChart3,
  Printer,
  Share2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Award,
  Trophy,
  Medal,
  Crown,
  Gem,
  Star as StarIcon,
  Heart,
  Activity,
  Zap,
  Flame,
  Rocket,
  Target,
  Flag,
  Globe,
  MapPin,
  Phone,
  Mail as MailIcon,
  MessageSquare,
  Link as LinkIcon,
  ExternalLink as ExternalLinkIcon,
  Copy,
  Save,
  Settings
} from 'lucide-react';
// Remove any duplicate imports from react-icons/fa if they exist

import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { Line, Bar, Pie,  Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState('month');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [reportData, setReportData] = useState({
    revenue: { total: 0, growth: 0, data: [] },
    bookings: { total: 0, growth: 0, data: [] },
    users: { total: 0, growth: 0, data: [] }
  });
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    customerSatisfaction: 0
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    try {
      const params = {
        type: reportType,
        range: dateRange
      };
      const response = await adminAPI.getReport(params);
      setReportData(response.data);
      setSummary(response.data.summary);
      setTopPerformers(response.data.topPerformers || []);
      setRecentActivity(response.data.recentActivity || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
    toast.success('Report data refreshed');
  };

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Export report
  const exportReport = async () => {
    setExporting(true);
    try {
      const params = {
        type: reportType,
        range: dateRange,
        format: exportFormat
      };
      const response = await adminAPI.exportReport(params);
      
      // Handle blob download
      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'pdf' ? 'pdf' : 'csv'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Get report current data
  const currentReport = reportData[reportType] || { total: 0, growth: 0, data: [] };

  // Get color based on growth
  const getGrowthColor = (growth) => {
    if (growth > 0) return 'success';
    if (growth < 0) return 'danger';
    return 'secondary';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      completed: { variant: 'success', label: 'Completed' },
      pending: { variant: 'warning', label: 'Pending' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
      active: { variant: 'info', label: 'Active' },
      inactive: { variant: 'secondary', label: 'Inactive' }
    };
    const item = config[status] || config.pending;
    return <Badge bg={item.variant} className="rounded-pill">{item.label}</Badge>;
  };

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading report data...</p>
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
            <h2 className="mb-1 fw-bold">Reports & Analytics</h2>
            <p className="text-muted mb-0">Generate and analyze platform performance reports</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowExportModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <Download size={18} />
              Export Report
            </Button>
          </div>
        </div>

        {/* Report Controls */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Row className="align-items-end g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Report Type</Form.Label>
                  <Form.Select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    className="py-2"
                  >
                    <option value="revenue">Revenue Report</option>
                    <option value="bookings">Bookings Report</option>
                    <option value="users">Users Report</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date Range</Form.Label>
                  <Form.Select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    className="py-2"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last 12 Months</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" className="w-100 d-flex align-items-center justify-content-center gap-2">
                  <Filter size={16} />
                  More Filters
                </Button>
              </Col>
              <Col md={3}>
                <Button 
                  variant="primary" 
                  onClick={() => setShowExportModal(true)} 
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <Download size={16} />
                  Export Now
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Stats Overview */}
        <Row className="g-4 mb-4">
          <Col xl={3} lg={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total {reportType === 'revenue' ? 'Revenue' : reportType === 'bookings' ? 'Bookings' : 'Users'}</p>
                    <h2 className="fw-bold mb-0">
                      {reportType === 'revenue' ? formatNaira(currentReport.total) : currentReport.total.toLocaleString()}
                    </h2>
                    <small className={`text-${getGrowthColor(currentReport.growth)} d-flex align-items-center gap-1 mt-1`}>
                      {currentReport.growth > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(currentReport.growth)}% from last period
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    {reportType === 'revenue' && <DollarSign size={24} color="#3b82f6" />}
                    {reportType === 'bookings' && <ShoppingCart size={24} color="#3b82f6" />}
                    {reportType === 'users' && <Users size={24} color="#3b82f6" />}
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
                    <p className="text-muted mb-1">Average / Month</p>
                    <h2 className="fw-bold mb-0">
                      {reportType === 'revenue' ? formatNaira(currentReport.data.reduce((sum, d) => sum + (d.value || 0), 0) / (currentReport.data.length || 1)) : Math.round(currentReport.data.reduce((sum, d) => sum + (d.value || 0), 0) / (currentReport.data.length || 1))}
                    </h2>
                    <small className="text-muted">Per month average</small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <BarChart3 size={24} color="#10b981" />
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
                    <p className="text-muted mb-1">Highest Month</p>
                    <h2 className="fw-bold mb-0">
                      {reportType === 'revenue' ? formatNaira(Math.max(...currentReport.data.map(d => d.value || 0), 0)) : Math.max(...currentReport.data.map(d => d.value || 0), 0)}
                    </h2>
                    <small className="text-muted">
                      {currentReport.data.find(d => d.value === Math.max(...currentReport.data.map(d => d.value || 0), 0))?.month || 'N/A'}
                    </small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <Trophy size={24} color="#f59e0b" />
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
                    <p className="text-muted mb-1">Growth Rate</p>
                    <h2 className={`fw-bold mb-0 text-${getGrowthColor(currentReport.growth)}`}>
                      {currentReport.growth > 0 ? '+' : ''}{currentReport.growth}%
                    </h2>
                    <small className="text-muted">Period over period</small>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <TrendingUp size={24} color="#8b5cf6" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Nav variant="tabs" className="px-3 pt-3" style={{ borderBottom: 'none' }}>
              <Nav.Item><Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}><Eye size={16} className="me-2" /> Overview</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'chart'} onClick={() => setActiveTab('chart')}><PieChart size={16} className="me-2" /> Chart View</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'table'} onClick={() => setActiveTab('table')}><Table size={16} className="me-2" /> Table View</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'top'} onClick={() => setActiveTab('top')}><Award size={16} className="me-2" /> Top Performers</Nav.Link></Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <Row className="g-4 mb-4">
              <Col md={3}>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-2" style={{ background: '#3b82f620' }}>
                        <DollarSign size={18} color="#3b82f6" />
                      </div>
                      <div>
                        <small className="text-muted d-block">Total Revenue</small>
                        <span className="fw-bold">{formatNaira(summary.totalRevenue)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-2" style={{ background: '#f59e0b20' }}>
                        <ShoppingCart size={18} color="#f59e0b" />
                      </div>
                      <div>
                        <small className="text-muted d-block">Total Bookings</small>
                        <span className="fw-bold">{summary.totalBookings}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                        <Users size={18} color="#10b981" />
                      </div>
                      <div>
                        <small className="text-muted d-block">Total Users</small>
                        <span className="fw-bold">{summary.totalUsers}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle p-2" style={{ background: '#8b5cf620' }}>
                        <Target size={18} color="#8b5cf6" />
                      </div>
                      <div>
                        <small className="text-muted d-block">Conversion Rate</small>
                        <span className="fw-bold">{summary.conversionRate}%</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0">Recent Activity</h6>
                  <Button variant="link" size="sm" className="text-muted">View All</Button>
                </div>
              </Card.Header>
              <Card.Body>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4">
                    <Activity size={32} className="text-muted opacity-50" />
                    <p className="text-muted mb-0">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                      <div className="rounded-circle p-2" style={{ background: '#f1f5f9' }}>
                        <Activity size={16} className="text-muted" />
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0 small">{activity.message}</p>
                        <small className="text-muted">{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</small>
                      </div>
                      {activity.status && getStatusBadge(activity.status)}
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </>
        )}

        {/* CHART TAB */}
        {activeTab === 'chart' && (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 pt-4">
              <h6 className="fw-bold mb-0">Monthly {reportType === 'revenue' ? 'Revenue' : reportType === 'bookings' ? 'Bookings' : 'User Registrations'}</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={currentReport.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => reportType === 'revenue' ? formatCompactNaira(v) : v} />
                  <Tooltip formatter={(v) => reportType === 'revenue' ? formatNaira(v) : v} />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* TABLE TAB */}
        {activeTab === 'table' && (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 pt-4">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Monthly Data</h6>
                <div className="d-flex gap-2">
                  <Form.Control type="text" placeholder="Search..." size="sm" style={{ width: '200px' }} />
                  <Button variant="outline-secondary" size="sm"><Filter size={14} /></Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '16px' }}>Month</th>
                      <th style={{ padding: '16px' }}>{reportType === 'revenue' ? 'Revenue' : reportType === 'bookings' ? 'Bookings' : 'Users'}</th>
                      <th style={{ padding: '16px' }}>Growth</th>
                      <th style={{ padding: '16px' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReport.data.map((item, idx) => {
                      const prevValue = idx > 0 ? currentReport.data[idx-1].value : item.value;
                      const growth = ((item.value - prevValue) / prevValue * 100).toFixed(1);
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '16px' }} className="fw-semibold">{item.month}</td>
                          <td style={{ padding: '16px' }}>
                            {reportType === 'revenue' ? formatNaira(item.value) : item.value.toLocaleString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className={growth >= 0 ? 'text-success' : 'text-danger'}>
                              {growth >= 0 ? '+' : ''}{growth}%
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {growth >= 0 ? (
                              <Badge bg="success" className="rounded-pill"><ArrowUp size={12} className="me-1" /> Upward</Badge>
                            ) : (
                              <Badge bg="danger" className="rounded-pill"><ArrowDown size={12} className="me-1" /> Downward</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* TOP PERFORMERS TAB */}
        {activeTab === 'top' && (
          <Row className="g-4">
            <Col lg={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4">
                  <h6 className="fw-bold mb-0">Top Providers</h6>
                </Card.Header>
                <Card.Body>
                  {topPerformers.length === 0 ? (
                    <div className="text-center py-4">
                      <Award size={32} className="text-muted opacity-50" />
                      <p className="text-muted mb-0">No top performers found</p>
                    </div>
                  ) : (
                    topPerformers.slice(0, 5).map((performer, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: '#f1f5f9' }}>
                          {idx === 0 ? <Crown size={20} className="text-warning" /> :
                           idx === 1 ? <Medal size={20} className="text-secondary" /> :
                           idx === 2 ? <Medal size={20} className="text-orange" /> :
                           <Star size={20} className="text-muted" />}
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-0 fw-semibold">{performer.name}</p>
                          <small className="text-muted">{performer.category}</small>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary">{formatNaira(performer.revenue)}</div>
                          <small className="text-muted">{performer.bookings} bookings</small>
                        </div>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4">
                  <h6 className="fw-bold mb-0">Top Services</h6>
                </Card.Header>
                <Card.Body>
                  {topPerformers.length === 0 ? (
                    <div className="text-center py-4">
                      <ShoppingCart size={32} className="text-muted opacity-50" />
                      <p className="text-muted mb-0">No top services found</p>
                    </div>
                  ) : (
                    topPerformers.slice(0, 5).map((performer, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: '#f1f5f9' }}>
                          <ShoppingCart size={20} className="text-primary" />
                        </div>
                        <div className="flex-grow-1">
                          <p className="mb-0 fw-semibold">{performer.service}</p>
                          <small className="text-muted">{performer.category}</small>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary">{formatNaira(performer.revenue)}</div>
                          <small className="text-muted">{performer.bookings} bookings</small>
                        </div>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Quick Actions */}
        <Row className="mt-4 g-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <Clock size={24} color="#3b82f6" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">Scheduled Reports</h6>
                    <p className="text-muted small mb-0">Set up automated report delivery</p>
                  </div>
                  <Button variant="outline-primary" size="sm">Configure</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <Calendar size={24} color="#10b981" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">Custom Date Range</h6>
                    <p className="text-muted small mb-0">Generate reports for custom periods</p>
                  </div>
                  <Button variant="outline-success" size="sm">Create</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <Mail size={24} color="#8b5cf6" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1">Email Report</h6>
                    <p className="text-muted small mb-0">Send report to email recipients</p>
                  </div>
                  <Button variant="outline-primary" size="sm">Send</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <Download className="me-2" size={18} />
            Export Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Report Type</Form.Label>
              <Form.Control type="text" value={reportType.charAt(0).toUpperCase() + reportType.slice(1)} disabled className="bg-light" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date Range</Form.Label>
              <Form.Control type="text" value={dateRange.replace('_', ' ').toUpperCase()} disabled className="bg-light" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Export Format</Form.Label>
              <Form.Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="pdf">PDF Document</option>
                <option value="csv">CSV Spreadsheet</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={exportReport} disabled={exporting}>
            {exporting ? 'Exporting...' : <><Download size={16} className="me-2" /> Export</>}
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
        .nav-tabs .nav-link:hover {
          background: #f8fafc;
        }
        .table > :not(caption) > * > * {
          padding: 16px 12px;
          vertical-align: middle;
        }
        .text-orange {
          color: #f97316;
        }
      `}</style>
    </div>
  );
};

export default AdminReports;