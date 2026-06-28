// src/components/admin/AdminReports.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ProgressBar,
  Nav
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
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { Line, Bar, Pie, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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
  const [error, setError] = useState(null);
  
  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

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
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatCompactNaira = (amount) => {
    const num = Number(amount) || 0;
    if (num >= 1000000) return `₦${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₦${(num / 1000).toFixed(0)}k`;
    return formatNaira(num);
  };

  const formatNumber = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  const formatPercent = (value) => {
    const num = Number(value) || 0;
    return `${num.toFixed(1)}%`;
  };

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch report data from real API
  const fetchReportData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const params = {
        type: reportType,
        range: dateRange
      };

      let response = null;
      
      if (typeof adminAPI.getReport === 'function') {
        response = await adminAPI.getReport(params);
      } else if (typeof adminAPI.getReports === 'function') {
        response = await adminAPI.getReports(params);
      } else {
        throw new Error('Report API methods not available');
      }

      const data = response?.data || {};
      
      setReportData({
        revenue: data.revenue || { total: 0, growth: 0, data: [] },
        bookings: data.bookings || { total: 0, growth: 0, data: [] },
        users: data.users || { total: 0, growth: 0, data: [] }
      });
      
      setSummary(data.summary || {
        totalRevenue: 0,
        totalBookings: 0,
        totalUsers: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        customerSatisfaction: 0
      });
      
      setTopPerformers(data.topPerformers || []);
      setRecentActivity(data.recentActivity || []);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error.message || 'Failed to load report data');
      
      setReportData({
        revenue: { total: 0, growth: 0, data: [] },
        bookings: { total: 0, growth: 0, data: [] },
        users: { total: 0, growth: 0, data: [] }
      });
      setSummary({
        totalRevenue: 0,
        totalBookings: 0,
        totalUsers: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        customerSatisfaction: 0
      });
      setTopPerformers([]);
      setRecentActivity([]);
      
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load report data');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [reportType, dateRange]);

  // Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await fetchReportData(false);
    toast.success('Report data refreshed');
  };

  // Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchReportData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 60000);
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
    fetchReportData(true);
    startPolling();
    return () => stopPolling();
  }, []);

  // Refetch when report type or date range changes
  useEffect(() => {
    if (!loading) {
      fetchReportData(false);
    }
  }, [reportType, dateRange]);

  // Export report with real API
  const exportReport = async () => {
    setExporting(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const params = {
        type: reportType,
        range: dateRange,
        format: exportFormat
      };

      let response = null;
      
      if (typeof adminAPI.exportReport === 'function') {
        response = await adminAPI.exportReport(params);
      } else if (typeof adminAPI.generateReport === 'function') {
        response = await adminAPI.generateReport(params);
      } else if (typeof adminAPI.downloadReport === 'function') {
        response = await adminAPI.downloadReport(params);
      } else {
        // Generate PDF using jsPDF as fallback
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
        doc.text(`Period: ${dateRange}`, 14, 38);
        
        doc.setFontSize(12);
        doc.text('Summary', 14, 50);
        doc.setFontSize(10);
        doc.text(`Total Revenue: ${formatNaira(summary.totalRevenue)}`, 14, 58);
        doc.text(`Total Bookings: ${formatNumber(summary.totalBookings)}`, 14, 64);
        doc.text(`Total Users: ${formatNumber(summary.totalUsers)}`, 14, 70);
        
        doc.save(`report_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('Report exported successfully');
        setShowExportModal(false);
        setExporting(false);
        return;
      }

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
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Get report current data with safe fallbacks
  const currentReport = reportData[reportType] || { total: 0, growth: 0, data: [] };

  // Get color based on growth
  const getGrowthColor = (growth) => {
    const num = Number(growth) || 0;
    if (num > 0) return 'success';
    if (num < 0) return 'danger';
    return 'secondary';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) {
      return <Badge bg="secondary" className="rounded-pill">Unknown</Badge>;
    }
    
    const lowerStatus = status.toLowerCase();
    const config = {
      completed: { variant: 'success', label: 'Completed' },
      pending: { variant: 'warning', label: 'Pending' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
      active: { variant: 'info', label: 'Active' },
      inactive: { variant: 'secondary', label: 'Inactive' },
      success: { variant: 'success', label: 'Success' },
      failed: { variant: 'danger', label: 'Failed' },
      approved: { variant: 'success', label: 'Approved' }
    };
    const item = config[lowerStatus] || config.pending;
    return <Badge bg={item.variant} className="rounded-pill">{item.label}</Badge>;
  };

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Loading state removed - component renders immediately with empty data

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Reports & Analytics</h2>
            <p style={styles.headerSubtitle}>Generate and analyze platform performance reports</p>
          </div>
          <div style={styles.headerActions}>
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
              style={styles.refreshBtn}
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowExportModal(true)}
              className="d-flex align-items-center gap-2"
              style={styles.exportBtn}
            >
              <Download size={18} />
              Export Report
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" style={styles.alert} dismissible onClose={() => setError(null)}>
            <AlertCircle size={18} className="me-2" />
            {error}
          </Alert>
        )}

        {/* Report Controls */}
        <Card style={styles.controlsCard}>
          <Card.Body style={styles.controlsCardBody}>
            <Row className="align-items-end g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={styles.formLabel}>Report Type</Form.Label>
                  <Form.Select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    style={styles.formControl}
                  >
                    <option value="revenue">Revenue Report</option>
                    <option value="bookings">Bookings Report</option>
                    <option value="users">Users Report</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label style={styles.formLabel}>Date Range</Form.Label>
                  <Form.Select 
                    value={dateRange} 
                    onChange={(e) => setDateRange(e.target.value)}
                    style={styles.formControl}
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last 12 Months</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" style={styles.filterBtn}>
                  <Filter size={16} className="me-2" />
                  More Filters
                </Button>
              </Col>
              <Col md={3}>
                <Button 
                  variant="primary" 
                  onClick={() => setShowExportModal(true)} 
                  style={styles.exportNowBtn}
                >
                  <Download size={16} className="me-2" />
                  Export Now
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Stats Overview */}
        <Row style={styles.statsRow}>
          {[
            { key: 'total', label: `Total ${reportType === 'revenue' ? 'Revenue' : reportType === 'bookings' ? 'Bookings' : 'Users'}`, value: reportType === 'revenue' ? formatNaira(currentReport.total) : formatNumber(currentReport.total), color: '#3b82f6', bg: '#3b82f620', icon: reportType === 'revenue' ? <DollarSign size={24} color="#3b82f6" /> : reportType === 'bookings' ? <ShoppingCart size={24} color="#3b82f6" /> : <Users size={24} color="#3b82f6" />, growth: currentReport.growth },
            { key: 'average', label: 'Average / Month', value: reportType === 'revenue' ? formatNaira((currentReport.data || []).reduce((sum, d) => sum + (d.value || 0), 0) / Math.max((currentReport.data || []).length, 1)) : formatNumber((currentReport.data || []).reduce((sum, d) => sum + (d.value || 0), 0) / Math.max((currentReport.data || []).length, 1)), color: '#10b981', bg: '#10b98120', icon: <BarChart3 size={24} color="#10b981" /> },
            { key: 'highest', label: 'Highest Month', value: reportType === 'revenue' ? formatNaira(Math.max(...((currentReport.data || []).map(d => d.value || 0)), 0)) : formatNumber(Math.max(...((currentReport.data || []).map(d => d.value || 0)), 0)), color: '#f59e0b', bg: '#f59e0b20', icon: <Trophy size={24} color="#f59e0b" />, detail: (currentReport.data || []).find(d => d.value === Math.max(...((currentReport.data || []).map(d => d.value || 0)), 0))?.month || 'N/A' },
            { key: 'growth', label: 'Growth Rate', value: `${Number(currentReport.growth) > 0 ? '+' : ''}${Number(currentReport.growth) || 0}%`, color: '#8b5cf6', bg: '#8b5cf620', icon: <TrendingUp size={24} color="#8b5cf6" />, growth: currentReport.growth }
          ].map((item, idx) => {
            const isUp = Number(item.growth) >= 0;
            return (
              <Col xl={3} lg={6} key={idx}>
                <Card style={styles.statCard}>
                  <Card.Body style={styles.statCardBody}>
                    <div>
                      <p style={styles.statLabel}>{item.label}</p>
                      <h2 style={styles.statValue}>{item.value}</h2>
                      {item.growth !== undefined && (
                        <small className={`text-${getGrowthColor(item.growth)} d-flex align-items-center gap-1 mt-1`}>
                          {Number(item.growth) > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {Math.abs(Number(item.growth) || 0)}% from last period
                        </small>
                      )}
                      {item.detail && <small style={styles.statDetail}>{item.detail}</small>}
                    </div>
                    <div style={{ ...styles.statIconWrapper, background: item.bg, color: item.color }}>
                      {item.icon}
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
              <Nav.Item><Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} style={styles.tabLink}><Eye size={16} className="me-2" /> Overview</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'chart'} onClick={() => setActiveTab('chart')} style={styles.tabLink}><PieChart size={16} className="me-2" /> Chart View</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'table'} onClick={() => setActiveTab('table')} style={styles.tabLink}><Table size={16} className="me-2" /> Table View</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link active={activeTab === 'top'} onClick={() => setActiveTab('top')} style={styles.tabLink}><Award size={16} className="me-2" /> Top Performers</Nav.Link></Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <Row style={styles.summaryRow}>
              <Col md={3}>
                <Card style={styles.summaryCard}>
                  <Card.Body style={styles.summaryCardBody}>
                    <div style={styles.summaryIconWrapper}>
                      <div style={{ ...styles.summaryIcon, background: '#3b82f620' }}><DollarSign size={18} color="#3b82f6" /></div>
                      <div>
                        <small style={styles.summaryLabel}>Total Revenue</small>
                        <span style={styles.summaryValue}>{formatNaira(summary.totalRevenue)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={styles.summaryCard}>
                  <Card.Body style={styles.summaryCardBody}>
                    <div style={styles.summaryIconWrapper}>
                      <div style={{ ...styles.summaryIcon, background: '#f59e0b20' }}><ShoppingCart size={18} color="#f59e0b" /></div>
                      <div>
                        <small style={styles.summaryLabel}>Total Bookings</small>
                        <span style={styles.summaryValue}>{formatNumber(summary.totalBookings)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={styles.summaryCard}>
                  <Card.Body style={styles.summaryCardBody}>
                    <div style={styles.summaryIconWrapper}>
                      <div style={{ ...styles.summaryIcon, background: '#10b98120' }}><Users size={18} color="#10b981" /></div>
                      <div>
                        <small style={styles.summaryLabel}>Total Users</small>
                        <span style={styles.summaryValue}>{formatNumber(summary.totalUsers)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card style={styles.summaryCard}>
                  <Card.Body style={styles.summaryCardBody}>
                    <div style={styles.summaryIconWrapper}>
                      <div style={{ ...styles.summaryIcon, background: '#8b5cf620' }}><Target size={18} color="#8b5cf6" /></div>
                      <div>
                        <small style={styles.summaryLabel}>Conversion Rate</small>
                        <span style={styles.summaryValue}>{formatPercent(summary.conversionRate)}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Card style={styles.activityCard}>
              <Card.Header style={styles.activityCardHeader}>
                <div style={styles.activityHeader}>
                  <h6 style={styles.activityTitle}>Recent Activity</h6>
                  <Button variant="link" size="sm" style={styles.activityViewAll}>View All</Button>
                </div>
              </Card.Header>
              <Card.Body>
                {(recentActivity || []).length === 0 ? (
                  <div style={styles.emptyState}>
                    <Activity size={32} style={styles.emptyIcon} />
                    <p style={styles.emptyText}>No recent activity</p>
                  </div>
                ) : (
                  (recentActivity || []).slice(0, 5).map((activity, idx) => (
                    <div key={activity.id || idx} style={styles.activityItem}>
                      <div style={styles.activityIconWrapper}>
                        <Activity size={16} style={styles.activityIcon} />
                      </div>
                      <div style={styles.activityContent}>
                        <p style={styles.activityMessage}>{getField(activity, ['message', 'action', 'description'], 'Activity')}</p>
                        <small style={styles.activityTime}>{activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Recent'}</small>
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
          <Card style={styles.chartCard}>
            <Card.Header style={styles.chartCardHeader}>
              <h6 style={styles.chartCardTitle}>Monthly {reportType === 'revenue' ? 'Revenue' : reportType === 'bookings' ? 'Bookings' : 'User Registrations'}</h6>
            </Card.Header>
            <Card.Body>
              {(currentReport.data || []).length === 0 ? (
                <div style={styles.noDataState}>
                  <BarChart3 size={48} style={styles.noDataIcon} />
                  <p style={styles.noDataText}>No data available for the selected period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={(currentReport.data || [])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => reportType === 'revenue' ? formatCompactNaira(v) : formatNumber(v)} />
                    <Tooltip formatter={(v) => reportType === 'revenue' ? formatNaira(v) : formatNumber(v)} />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        )}

        {/* TABLE TAB */}
        {activeTab === 'table' && (
          <Card style={styles.tableCard}>
            <Card.Header style={styles.tableCardHeader}>
              <div style={styles.tableHeaderContent}>
                <h6 style={styles.tableCardTitle}>Monthly Data</h6>
                <div style={styles.tableActions}>
                  <Form.Control type="text" placeholder="Search..." size="sm" style={styles.tableSearch} />
                  <Button variant="outline-secondary" size="sm" style={styles.tableFilterBtn}><Filter size={14} /></Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body style={styles.tableCardBody}>
              <div className="table-responsive">
                <Table hover style={styles.table}>
                  <thead style={styles.tableHead}>
                    <tr>
                      <th style={styles.tableHeader}>Month</th>
                      <th style={styles.tableHeader}>{reportType === 'revenue' ? 'Revenue' : reportType === 'bookings' ? 'Bookings' : 'Users'}</th>
                      <th style={styles.tableHeader}>Growth</th>
                      <th style={styles.tableHeader}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReport.data || []).length === 0 ? (
                      <tr>
                        <td colSpan="4" style={styles.noDataRow}>
                          <p style={styles.noDataText}>No data available</p>
                        </td>
                      </tr>
                    ) : (
                      (currentReport.data || []).map((item, idx) => {
                        const prevValue = idx > 0 ? (currentReport.data || [])[idx-1]?.value || item.value : item.value;
                        const growth = prevValue > 0 ? ((item.value - prevValue) / prevValue * 100) : 0;
                        return (
                          <tr key={idx} style={styles.tableRow}>
                            <td style={styles.tableCell} className="fw-semibold">{item.month || 'N/A'}</td>
                            <td style={styles.tableCell}>
                              {reportType === 'revenue' ? formatNaira(item.value) : formatNumber(item.value)}
                            </td>
                            <td style={styles.tableCell}>
                              <span className={growth >= 0 ? 'text-success' : 'text-danger'}>
                                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                              </span>
                            </td>
                            <td style={styles.tableCell}>
                              {growth >= 0 ? (
                                <Badge bg="success" className="rounded-pill"><ArrowUp size={12} className="me-1" /> Upward</Badge>
                              ) : (
                                <Badge bg="danger" className="rounded-pill"><ArrowDown size={12} className="me-1" /> Downward</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* TOP PERFORMERS TAB */}
        {activeTab === 'top' && (
          <Row style={styles.topRow}>
            <Col lg={6}>
              <Card style={styles.topCard}>
                <Card.Header style={styles.topCardHeader}>
                  <h6 style={styles.topCardTitle}>Top Providers</h6>
                </Card.Header>
                <Card.Body>
                  {(topPerformers || []).length === 0 ? (
                    <div style={styles.emptyState}>
                      <Award size={32} style={styles.emptyIcon} />
                      <p style={styles.emptyText}>No top performers found</p>
                    </div>
                  ) : (
                    (topPerformers || []).slice(0, 5).map((performer, idx) => {
                      const performerName = getField(performer, ['name', 'provider', 'full_name'], 'Unknown');
                      const category = getField(performer, ['category', 'service_category'], 'General');
                      const revenue = performer.revenue || 0;
                      const bookings = performer.bookings || 0;
                      
                      return (
                        <div key={performer.id || idx} style={styles.performerItem}>
                          <div style={styles.performerAvatar}>
                            {idx === 0 ? <Crown size={20} className="text-warning" /> :
                             idx === 1 ? <Medal size={20} className="text-secondary" /> :
                             idx === 2 ? <Medal size={20} className="text-orange" /> :
                             <StarIcon size={20} className="text-muted" />}
                          </div>
                          <div style={styles.performerInfo}>
                            <p style={styles.performerName}>{performerName}</p>
                            <small style={styles.performerCategory}>{category}</small>
                          </div>
                          <div style={styles.performerStats}>
                            <div style={styles.performerRevenue}>{formatNaira(revenue)}</div>
                            <small style={styles.performerBookings}>{formatNumber(bookings)} bookings</small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card style={styles.topCard}>
                <Card.Header style={styles.topCardHeader}>
                  <h6 style={styles.topCardTitle}>Top Services</h6>
                </Card.Header>
                <Card.Body>
                  {(topPerformers || []).length === 0 ? (
                    <div style={styles.emptyState}>
                      <ShoppingCart size={32} style={styles.emptyIcon} />
                      <p style={styles.emptyText}>No top services found</p>
                    </div>
                  ) : (
                    (topPerformers || []).slice(0, 5).map((performer, idx) => {
                      const serviceName = getField(performer, ['service', 'name', 'title'], 'Unknown');
                      const category = getField(performer, ['category', 'service_category'], 'General');
                      const revenue = performer.revenue || 0;
                      const bookings = performer.bookings || 0;
                      
                      return (
                        <div key={performer.id || idx} style={styles.performerItem}>
                          <div style={styles.performerAvatar}>
                            <ShoppingCart size={20} className="text-primary" />
                          </div>
                          <div style={styles.performerInfo}>
                            <p style={styles.performerName}>{serviceName}</p>
                            <small style={styles.performerCategory}>{category}</small>
                          </div>
                          <div style={styles.performerStats}>
                            <div style={styles.performerRevenue}>{formatNaira(revenue)}</div>
                            <small style={styles.performerBookings}>{formatNumber(bookings)} bookings</small>
                          </div>
                        </div>
                      );
                    })
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Quick Actions */}
        <Row style={styles.quickActionsRow}>
          <Col md={4}>
            <Card style={styles.quickActionCard}>
              <Card.Body style={styles.quickActionCardBody}>
                <div style={styles.quickActionContent}>
                  <div style={{ ...styles.quickActionIcon, background: '#3b82f620' }}>
                    <Clock size={24} color="#3b82f6" />
                  </div>
                  <div style={styles.quickActionInfo}>
                    <h6 style={styles.quickActionTitle}>Scheduled Reports</h6>
                    <p style={styles.quickActionText}>Set up automated report delivery</p>
                  </div>
                  <Button variant="outline-primary" size="sm" style={styles.quickActionBtn}>Configure</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card style={styles.quickActionCard}>
              <Card.Body style={styles.quickActionCardBody}>
                <div style={styles.quickActionContent}>
                  <div style={{ ...styles.quickActionIcon, background: '#10b98120' }}>
                    <Calendar size={24} color="#10b981" />
                  </div>
                  <div style={styles.quickActionInfo}>
                    <h6 style={styles.quickActionTitle}>Custom Date Range</h6>
                    <p style={styles.quickActionText}>Generate reports for custom periods</p>
                  </div>
                  <Button variant="outline-success" size="sm" style={styles.quickActionBtn}>Create</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card style={styles.quickActionCard}>
              <Card.Body style={styles.quickActionCardBody}>
                <div style={styles.quickActionContent}>
                  <div style={{ ...styles.quickActionIcon, background: '#8b5cf620' }}>
                    <Mail size={24} color="#8b5cf6" />
                  </div>
                  <div style={styles.quickActionInfo}>
                    <h6 style={styles.quickActionTitle}>Email Report</h6>
                    <p style={styles.quickActionText}>Send report to email recipients</p>
                  </div>
                  <Button variant="outline-primary" size="sm" style={styles.quickActionBtn}>Send</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            <Download className="me-2" size={18} />
            Export Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Report Type</Form.Label>
              <Form.Control type="text" value={reportType.charAt(0).toUpperCase() + reportType.slice(1)} disabled style={{ ...styles.formControl, background: '#f8f9fa' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Date Range</Form.Label>
              <Form.Control type="text" value={dateRange.replace('_', ' ').toUpperCase()} disabled style={{ ...styles.formControl, background: '#f8f9fa' }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={styles.formLabel}>Export Format</Form.Label>
              <Form.Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} style={styles.formControl}>
                <option value="pdf">PDF Document</option>
                <option value="csv">CSV Spreadsheet</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowExportModal(false)} style={styles.modalCancelBtn}>
            Cancel
          </Button>
          <Button variant="primary" onClick={exportReport} disabled={exporting} style={styles.modalSubmitBtn}>
            {exporting ? 'Exporting...' : <><Download size={16} className="me-2" /> Export</>}
          </Button>
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
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none'
  },
  alert: {
    borderRadius: '12px'
  },
  controlsCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden'
  },
  controlsCardBody: {
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
  filterBtn: {
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  exportNowBtn: {
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  statDetail: {
    color: '#718096',
    display: 'block',
    marginTop: '4px',
    fontSize: '14px'
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
  summaryRow: {
    marginBottom: '24px',
    gap: '16px'
  },
  summaryCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%'
  },
  summaryCardBody: {
    padding: '16px 20px'
  },
  summaryIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  summaryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  summaryLabel: {
    color: '#718096',
    display: 'block',
    fontSize: '12px'
  },
  summaryValue: {
    fontWeight: '700',
    fontSize: '18px',
    color: '#1a202c'
  },
  activityCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  activityCardHeader: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 20px'
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activityTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  activityViewAll: {
    color: '#6366f1',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  activityIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  activityIcon: {
    color: '#718096'
  },
  activityContent: {
    flex: 1
  },
  activityMessage: {
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  activityTime: {
    color: '#a0aec0',
    fontSize: '12px'
  },
  chartCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
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
  tableCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  tableCardHeader: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 20px'
  },
  tableHeaderContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  tableCardTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  tableActions: {
    display: 'flex',
    gap: '8px'
  },
  tableSearch: {
    width: '200px',
    borderRadius: '8px'
  },
  tableFilterBtn: {
    borderRadius: '8px',
    padding: '4px 12px'
  },
  tableCardBody: {
    padding: 0
  },
  table: {
    marginBottom: 0
  },
  tableHead: {
    background: '#f8fafc'
  },
  tableHeader: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '2px solid #e2e8f0'
  },
  tableRow: {
    transition: 'background 0.2s'
  },
  tableCell: {
    padding: '12px 16px',
    verticalAlign: 'middle',
    fontSize: '14px'
  },
  noDataRow: {
    padding: '30px',
    textAlign: 'center'
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
  topRow: {
    gap: '24px'
  },
  topCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    height: '100%'
  },
  topCardHeader: {
    background: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 20px'
  },
  topCardTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  performerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0'
  },
  performerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  performerInfo: {
    flex: 1
  },
  performerName: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  performerCategory: {
    color: '#718096',
    fontSize: '12px'
  },
  performerStats: {
    textAlign: 'right'
  },
  performerRevenue: {
    fontWeight: '700',
    color: '#6366f1',
    fontSize: '14px'
  },
  performerBookings: {
    color: '#718096',
    fontSize: '12px'
  },
  quickActionsRow: {
    marginTop: '24px',
    gap: '16px'
  },
  quickActionCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%'
  },
  quickActionCardBody: {
    padding: '16px 20px'
  },
  quickActionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  quickActionIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  quickActionInfo: {
    flex: 1
  },
  quickActionTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  quickActionText: {
    color: '#718096',
    marginBottom: 0,
    fontSize: '13px'
  },
  quickActionBtn: {
    borderRadius: '8px',
    padding: '4px 16px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyIcon: {
    color: '#cbd5e0',
    marginBottom: '8px',
    opacity: 0.5
  },
  emptyText: {
    color: '#a0aec0',
    marginBottom: 0
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
  modalBody: {
    padding: '20px 24px'
  },
  modalFooter: {
    borderTop: 'none',
    padding: '0 24px 20px'
  },
  modalCancelBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
  },
  modalSubmitBtn: {
    borderRadius: '10px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  globalStyles: `
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
      transition: all 0.2s;
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
    @media (max-width: 768px) {
      .table-responsive {
        font-size: 0.85rem;
      }
      .nav-tabs .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }
      .modal-dialog {
        margin: 16px;
      }
    }
  `
};

export default AdminReports;