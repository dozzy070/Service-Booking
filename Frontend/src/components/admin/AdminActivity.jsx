// src/components/admin/AdminActivity.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  Pagination,
  InputGroup,
  Dropdown,
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';
import {
  Activity,
  UserPlus,
  ShoppingCart,
  Settings as SettingsIcon,
  LogIn,
  AlertCircle,
  Filter,
  Download,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart2,
  Briefcase,
  Star,
  MessageSquare,
  Bell,
  Edit,
  Trash2,
  Copy,
  Link,
  ExternalLink,
  Flag,
  Award,
  Medal,
  Crown,
  Gem,
  Gift,
  Heart,
  Zap,
  Flame
} from 'lucide-react';
// All social icons from react-icons/fa only
import {
  Facebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp
} from 'react-icons/fa';


import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays, subMonths, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const AdminActivity = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    users: 0,
    bookings: 0,
    security: 0,
    system: 0
  });

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };
      const response = await adminAPI.getActivities(params);
      setActivities(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const today = response.data.filter(a => isToday(new Date(a.timestamp))).length;
      const users = response.data.filter(a => a.type === 'user').length;
      const bookings = response.data.filter(a => a.type === 'booking').length;
      const security = response.data.filter(a => a.type === 'security').length;
      const system = response.data.filter(a => a.type === 'system').length;
      
      setStats({ total, today, users, bookings, security, system });
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterType, filterStatus, searchTerm, sortConfig]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
    toast.success('Activities refreshed');
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Export activities
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await adminAPI.exportActivities({
        format: exportFormat,
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: filterType !== 'all' ? filterType : undefined
      });
      const blob = new Blob([response.data], {
        type: exportFormat === 'csv' ? 'text/csv' :
              exportFormat === 'excel' ? 'application/vnd.ms-excel' :
              'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activities_export_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'csv' ? 'csv' : exportFormat === 'excel' ? 'xls' : 'json'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Activities exported successfully');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getActionIcon = (type) => {
    switch(type) {
      case 'user': return <UserPlus size={16} className="text-primary" />;
      case 'service': return <ShoppingCart size={16} className="text-success" />;
      case 'system': return <SettingsIcon size={16} className="text-secondary" />;
      case 'booking': return <Activity size={16} className="text-warning" />;
      case 'security': return <AlertCircle size={16} className="text-danger" />;
      default: return <LogIn size={16} className="text-info" />;
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      success: { bg: 'success', icon: <CheckCircle size={12} />, label: 'Success' },
      warning: { bg: 'warning', icon: <AlertCircle size={12} />, label: 'Warning' },
      error: { bg: 'danger', icon: <XCircle size={12} />, label: 'Error' },
      info: { bg: 'info', icon: <Info size={12} />, label: 'Info' }
    };
    const config = configs[status] || configs.info;
    return (
      <Badge bg={config.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {config.icon}
        <span className="ms-1">{config.label}</span>
      </Badge>
    );
  };

  const getUserTypeBadge = (type) => {
    const configs = {
      customer: { bg: 'primary', label: 'Customer' },
      provider: { bg: 'success', label: 'Provider' },
      admin: { bg: 'danger', label: 'Admin' }
    };
    const config = configs[type] || configs.customer;
    return <Badge bg={config.bg} className="rounded-pill">{config.label}</Badge>;
  };

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <Minus size={14} className="text-muted" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
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
      default: start = subDays(today, 7);
    }
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setDateRange({
      start: subDays(new Date(), 7).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
    setSelectedPeriod('7days');
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.user?.toLowerCase().includes(term) ||
        a.action?.toLowerCase().includes(term) ||
        a.details?.toLowerCase().includes(term) ||
        a.ip?.toLowerCase().includes(term)
      );
    }
    
    if (filterType !== 'all') filtered = filtered.filter(a => a.type === filterType);
    if (filterStatus !== 'all') filtered = filtered.filter(a => a.status === filterStatus);
    
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [activities, searchTerm, filterType, filterStatus, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus, dateRange]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading activities...</p>
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
            <h2 className="mb-1 fw-bold">Activity Log</h2>
            <p className="text-muted mb-0">Monitor all platform activities and user actions</p>
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
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                <Download size={18} /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}>
                  CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('excel'); setShowExportModal(true); }}>
                  Excel
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('json'); setShowExportModal(true); }}>
                  JSON
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <Activity size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Activities</p>
                    <h3 className="fw-bold mb-0">{stats.total}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <Calendar size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Today's Activities</p>
                    <h3 className="fw-bold mb-0">{stats.today}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <UserPlus size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">User Activities</p>
                    <h3 className="fw-bold mb-0">{stats.users}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <ShoppingCart size={24} color="#f59e0b" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Bookings</p>
                    <h3 className="fw-bold mb-0">{stats.bookings}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#ef444420' }}>
                    <Shield size={24} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Security Alerts</p>
                    <h3 className="fw-bold mb-0">{stats.security}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#6b728020' }}>
                    <SettingsIcon size={24} color="#6b7280" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">System Events</p>
                    <h3 className="fw-bold mb-0">{stats.system}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text><Search size={16} /></InputGroup.Text>
                <Form.Control
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Form.Select
                style={{ width: '150px' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="user">Users</option>
                <option value="booking">Bookings</option>
                <option value="service">Services</option>
                <option value="system">System</option>
                <option value="security">Security</option>
              </Form.Select>

              <Form.Select
                style={{ width: '150px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="info">Info</option>
              </Form.Select>

              <Form.Select
                style={{ width: '120px' }}
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </Form.Select>

              <Button variant="outline-secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>

            {/* Date Range */}
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <Form.Label className="fw-semibold mb-0">Date Range:</Form.Label>
                <Form.Select
                  style={{ width: '150px' }}
                  value={selectedPeriod}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="12months">Last 12 Months</option>
                  <option value="ytd">Year to Date</option>
                  <option value="custom">Custom</option>
                </Form.Select>
                {selectedPeriod === 'custom' && (
                  <>
                    <Form.Control
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      style={{ width: '150px' }}
                    />
                    <span className="text-muted">to</span>
                    <Form.Control
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      style={{ width: '150px' }}
                    />
                  </>
                )}
                <Button variant="primary" size="sm" onClick={fetchActivities}>
                  Apply
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Activities Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {currentActivities.length === 0 ? (
              <div className="text-center py-5">
                <Activity size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No activities found</h6>
                <Button variant="link" onClick={resetFilters} className="mt-2">Reset Filters</Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ minWidth: '1000px' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('timestamp')}>
                          Timestamp {getSortIcon('timestamp')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('user')}>
                          User {getSortIcon('user')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('action')}>
                          Action {getSortIcon('action')}
                        </th>
                        <th style={{ padding: '16px' }}>Details</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('ip')}>
                          IP Address {getSortIcon('ip')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                          Status {getSortIcon('status')}
                        </th>
                        <th style={{ padding: '16px', width: '60px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentActivities.map((activity) => (
                        <tr key={activity.id}>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">{format(new Date(activity.timestamp), 'MMM dd, yyyy')}</div>
                            <small className="text-muted">{format(new Date(activity.timestamp), 'hh:mm a')}</small>
                            <div className="small text-muted">
                              {isToday(new Date(activity.timestamp)) ? 'Today' :
                               isYesterday(new Date(activity.timestamp)) ? 'Yesterday' :
                               formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#f1f5f9' }}>
                                <User size={16} className="text-muted" />
                              </div>
                              <div>
                                <div className="fw-semibold">{activity.user}</div>
                                {getUserTypeBadge(activity.userType)}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              {getActionIcon(activity.type)}
                              <span>{activity.action}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <small>{activity.details}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <code className="small">{activity.ip}</code>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {getStatusBadge(activity.status)}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="rounded-circle p-1"
                              style={{ width: '32px', height: '32px' }}
                              onClick={() => {
                                setSelectedActivity(activity);
                                setShowDetailsModal(true);
                              }}
                            >
                              <Eye size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredActivities.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredActivities.length)} of {filteredActivities.length} activities
                    </div>
                    <Pagination>
                      <Pagination.Prev
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />
                      {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = idx + 1;
                        else if (currentPage <= 3) pageNum = idx + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                        else pageNum = currentPage - 2 + idx;
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Activity Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <Activity size={18} className="me-2" />
            Activity Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedActivity && (
            <div>
              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Event Information</h6>
                    <div className="info-item">
                      <Clock size={14} className="text-muted" />
                      <span><strong>Timestamp:</strong> {format(new Date(selectedActivity.timestamp), 'MMMM dd, yyyy hh:mm a')}</span>
                    </div>
                    <div className="info-item">
                      <User size={14} className="text-muted" />
                      <span><strong>User:</strong> {selectedActivity.user}</span>
                    </div>
                    <div className="info-item">
                      <Activity size={14} className="text-muted" />
                      <span><strong>Action:</strong> {selectedActivity.action}</span>
                    </div>
                    <div className="info-item">
                      <FileText size={14} className="text-muted" />
                      <span><strong>Details:</strong> {selectedActivity.details}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Technical Details</h6>
                    <div className="info-item">
                      <Shield size={14} className="text-muted" />
                      <span><strong>Status:</strong> {getStatusBadge(selectedActivity.status)}</span>
                    </div>
                    <div className="info-item">
                      <Link size={14} className="text-muted" />
                      <span><strong>IP Address:</strong> {selectedActivity.ip}</span>
                    </div>
                    <div className="info-item">
                      <Info size={14} className="text-muted" />
                      <span><strong>Type:</strong> {selectedActivity.type}</span>
                    </div>
                    <div className="info-item">
                      <Badge size={14} className="text-muted" />
                      <span><strong>User Type:</strong> {getUserTypeBadge(selectedActivity.userType)}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <Download size={18} className="me-2" />
            Export Activities
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Exporting <strong>{filteredActivities.length}</strong> activities as <strong>{exportFormat.toUpperCase()}</strong></p>
          {exporting && (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small">Generating export...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
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
        .table > :not(caption) > * > * {
          padding: 16px 12px;
          vertical-align: middle;
        }
        .table tbody tr:hover { background-color: #f8fafc; }
      `}</style>
    </div>
  );
};

export default AdminActivity;