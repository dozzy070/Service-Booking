// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api';
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
  Alert,
  Image,
  Tabs,
  Tab,
  ProgressBar,
  Tooltip,
  OverlayTrigger,
  Spinner
} from 'react-bootstrap';
import {
  FaUsers,
  FaUserPlus,
  FaUserEdit,
  FaUserTimes,
  FaUserCheck,
  FaUserClock,
  FaUserShield,
  FaUserTie,
  FaUserCircle,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaBan,
  FaCheck,
  FaTimes,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaDownload,
  FaUpload,
  FaPrint,
  FaShare,
  FaEllipsisV,
  FaCog,
  FaExclamationTriangle,
  FaInfoCircle,
  FaQuestionCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaSync,
  FaSave,
  FaFileExport,
  FaFileImport,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaFileWord,
  FaFileImage,
  FaFileArchive,
  FaStar,
  FaStarHalf,
  FaRegStar,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaHistory,
  FaLock,
  FaUnlockAlt,
  FaMailBulk,
  FaSms,
  FaIdCard,
  FaRegComment,
  FaMoneyBillWave,
  FaServicestack,
  FaRegClock,
  FaWallet,
  FaTrendingUp,
  FaAward,
  FaMedal
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    status: 'active',
    location: '',
    password: ''
  });
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  const [activeTab, setActiveTab] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');

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

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('danger', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
    showAlert('success', 'Users refreshed');
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter and search users
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') filtered = filtered.filter(user => user.role === roleFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(user => user.status === statusFilter);
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(user => 
        verificationFilter === 'verified' ? user.verified : !user.verified
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'joined' || sortField === 'lastActive') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter, verificationFilter, sortField, sortDirection]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedUsers(currentUsers.map(user => user.id));
    else setSelectedUsers([]);
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const showAlert = (type, message) => {
    setAlertMessage({ show: true, type, message });
    setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 5000);
  };

  // CRUD operations
  const handleAddUser = () => {
    setIsEditing(false);
    setFormData({ name: '', email: '', phone: '', role: 'customer', status: 'active', location: '', password: '' });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      location: user.location || '',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      showAlert('warning', 'Please fill in all required fields');
      return;
    }
    
    setProcessing(true);
    try {
      if (isEditing && selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, formData);
        showAlert('success', `${formData.name} updated successfully`);
        await fetchUsers();
      } else {
        await api.post('/admin/users', { ...formData, password: formData.password || 'default123' });
        showAlert('success', `${formData.name} created successfully`);
        await fetchUsers();
      }
      setShowUserModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      showAlert('danger', error.response?.data?.message || 'Failed to save user');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyUser = (user) => {
    setSelectedUser(user);
    setShowVerifyModal(true);
  };

  const confirmVerify = async () => {
    setProcessing(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/verify`);
      setShowVerifyModal(false);
      showAlert('success', `${selectedUser.name} verified successfully`);
      await fetchUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      showAlert('danger', 'Failed to verify user');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspendUser = (user) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    setProcessing(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/suspend`);
      setShowSuspendModal(false);
      showAlert('warning', `${selectedUser.name} suspended`);
      await fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      showAlert('danger', 'Failed to suspend user');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateUser = async (user) => {
    setProcessing(true);
    try {
      await api.put(`/admin/users/${user.id}/unsuspend`);
      showAlert('success', `${user.name} activated`);
      await fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      showAlert('danger', 'Failed to activate user');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setProcessing(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setShowDeleteModal(false);
      showAlert('danger', `${selectedUser.name} deleted`);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('danger', 'Failed to delete user');
    } finally {
      setProcessing(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      showAlert('warning', 'Please select users first');
      return;
    }
    
    setProcessing(true);
    try {
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case 'verify': return api.put(`/admin/users/${userId}/verify`);
          case 'suspend': return api.put(`/admin/users/${userId}/suspend`);
          case 'activate': return api.put(`/admin/users/${userId}/unsuspend`);
          case 'delete': return api.delete(`/admin/users/${userId}`);
          default: return Promise.resolve();
        }
      });
      await Promise.all(promises);
      setSelectedUsers([]);
      setShowBulkModal(false);
      showAlert('success', `${selectedUsers.length} users ${action === 'verify' ? 'verified' : action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'deleted'}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showAlert('danger', 'Failed to perform bulk action');
    } finally {
      setProcessing(false);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Verified', 'Phone', 'Location', 'Joined', 'Last Active', 'Bookings', 'Spent', 'Rating'];
    const data = filteredUsers.map(user => [
      user.id, user.name, user.email, user.role, user.status, user.verified ? 'Yes' : 'No',
      user.phone || '', user.location || '', user.joined, user.lastActive,
      user.bookings || 0, user.spent || 0, user.rating || 0
    ]);
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert('success', 'Users exported to CSV');
  };

  const exportToPDF = () => {
    showAlert('info', 'PDF export feature coming soon');
  };

  // Send email
  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      showAlert('warning', 'Please fill in subject and message');
      return;
    }
    
    setProcessing(true);
    try {
      const recipients = selectedUsers.length > 0 
        ? users.filter(u => selectedUsers.includes(u.id)).map(u => u.email)
        : [selectedUser?.email];
      
      await api.post('/admin/users/send-email', {
        recipients,
        subject: emailData.subject,
        message: emailData.message
      });
      
      showAlert('success', `Email sent to ${recipients.length} recipient(s)`);
      setShowEmailModal(false);
      setEmailData({ subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      showAlert('danger', 'Failed to send email');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'danger', icon: <FaUserShield />, label: 'Admin', className: 'bg-danger' },
      provider: { bg: 'success', icon: <FaUserTie />, label: 'Provider', className: 'bg-success' },
      customer: { bg: 'primary', icon: <FaUserCircle />, label: 'Customer', className: 'bg-primary' }
    };
    return badges[role] || badges.customer;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'success', icon: <FaCheckCircle />, label: 'Active' },
      inactive: { bg: 'secondary', icon: <FaTimesCircle />, label: 'Inactive' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      suspended: { bg: 'danger', icon: <FaBan />, label: 'Suspended' }
    };
    return badges[status] || badges.inactive;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= numRating) stars.push(<FaStar key={i} className="text-warning" />);
      else if (i - 0.5 <= numRating) stars.push(<FaStarHalf key={i} className="text-warning" />);
      else stars.push(<FaRegStar key={i} className="text-secondary" />);
    }
    return stars;
  };

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    providers: users.filter(u => u.role === 'provider').length,
    customers: users.filter(u => u.role === 'customer').length,
    admins: users.filter(u => u.role === 'admin').length,
    verified: users.filter(u => u.verified).length,
    unverified: users.filter(u => !u.verified).length
  }), [users]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Alert */}
        {alertMessage.show && (
          <Alert 
            variant={alertMessage.type} 
            className="position-fixed top-0 end-0 m-3 shadow-lg" 
            style={{ zIndex: 9999, minWidth: '300px', borderRadius: '12px' }} 
            dismissible 
            onClose={() => setAlertMessage({ show: false, type: '', message: '' })}
          >
            <div className="d-flex align-items-center">
              {alertMessage.type === 'success' && <FaCheckCircle className="me-2 fs-5 text-success" />}
              {alertMessage.type === 'warning' && <FaExclamationTriangle className="me-2 fs-5 text-warning" />}
              {alertMessage.type === 'danger' && <FaTimesCircle className="me-2 fs-5 text-danger" />}
              {alertMessage.type === 'info' && <FaInfoCircle className="me-2 fs-5 text-info" />}
              <span>{alertMessage.message}</span>
            </div>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">User Management</h2>
            <p className="text-muted mb-0">Manage users, roles, and permissions across the platform</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaSync className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                <FaFileExport />
                Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={exportToCSV}><FaFileCsv className="me-2 text-success" /> CSV</Dropdown.Item>
                <Dropdown.Item onClick={exportToPDF}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button 
              variant="primary" 
              onClick={handleAddUser}
              className="d-flex align-items-center gap-2"
            >
              <FaUserPlus />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col xl={3} lg={6} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Users</p>
                    <h2 className="fw-bold mb-0">{stats.total}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaUsers size={24} color="#3b82f6" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="d-flex gap-2">
                    <Badge bg="success" className="rounded-pill">{stats.active} Active</Badge>
                    <Badge bg="warning" className="rounded-pill">{stats.pending} Pending</Badge>
                    <Badge bg="danger" className="rounded-pill">{stats.suspended} Suspended</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={3} lg={6} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Customers</p>
                    <h2 className="fw-bold mb-0">{stats.customers}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <FaUserCircle size={24} color="#10b981" />
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">Active customers on platform</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={3} lg={6} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Providers</p>
                    <h2 className="fw-bold mb-0">{stats.providers}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#8b5cf620' }}>
                    <FaUserTie size={24} color="#8b5cf6" />
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">Service providers on platform</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xl={3} lg={6} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Verification Rate</p>
                    <h2 className="fw-bold mb-0">{((stats.verified / stats.total) * 100).toFixed(1)}%</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaUserCheck size={24} color="#f59e0b" />
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">{stats.verified} verified • {stats.unverified} unverified</small>
                  <ProgressBar 
                    now={(stats.verified / stats.total) * 100} 
                    variant="warning" 
                    className="mt-2"
                    style={{ height: '6px', borderRadius: '3px' }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Tabs 
              activeKey={activeTab} 
              onSelect={(k) => {
                setActiveTab(k);
                if (k === 'all') { setRoleFilter('all'); setStatusFilter('all'); setVerificationFilter('all'); }
                else if (k === 'customers') { setRoleFilter('customer'); setStatusFilter('all'); }
                else if (k === 'providers') { setRoleFilter('provider'); setStatusFilter('all'); }
                else if (k === 'admins') { setRoleFilter('admin'); setStatusFilter('all'); }
                else if (k === 'verified') { setVerificationFilter('verified'); }
                else if (k === 'unverified') { setVerificationFilter('unverified'); }
              }} 
              className="mb-3"
            >
              <Tab eventKey="all" title={`All (${stats.total})`} />
              <Tab eventKey="customers" title={`Customers (${stats.customers})`} />
              <Tab eventKey="providers" title={`Providers (${stats.providers})`} />
              <Tab eventKey="admins" title={`Admins (${stats.admins})`} />
              <Tab eventKey="verified" title={`Verified (${stats.verified})`} />
              <Tab eventKey="unverified" title={`Unverified (${stats.unverified})`} />
            </Tabs>

            <Row className="g-3">
              <Col lg={4}>
                <InputGroup>
                  <InputGroup.Text><FaSearch size={14} /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col lg={3}>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </Form.Select>
              </Col>
              <Col lg={3}>
                <Form.Select value={usersPerPage} onChange={(e) => setUsersPerPage(Number(e.target.value))}>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </Form.Select>
              </Col>
              <Col lg={2}>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setVerificationFilter('all'); setActiveTab('all'); }}
                  className="w-100"
                >
                  <FaSync className="me-2" />
                  Reset
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {currentUsers.length === 0 ? (
              <div className="text-center py-5">
                <FaUsers size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No users found</h6>
                <p className="text-muted small">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}>
                          <Form.Check 
                            type="checkbox" 
                            onChange={handleSelectAll} 
                            checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0} 
                          />
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                          User {getSortIcon('name')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('role')}>
                          Role {getSortIcon('role')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                          Status {getSortIcon('status')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('joined')}>
                          Joined {getSortIcon('joined')}
                        </th>
                        <th style={{ padding: '16px' }}>Contact</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('rating')}>
                          Rating {getSortIcon('rating')}
                        </th>
                        <th style={{ padding: '16px', width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map(user => {
                        const roleBadge = getRoleBadge(user.role);
                        const statusBadge = getStatusBadge(user.status);
                        return (
                          <tr key={user.id} className={selectedUsers.includes(user.id) ? 'table-active' : ''}>
                            <td style={{ padding: '16px' }}>
                              <Form.Check 
                                type="checkbox" 
                                checked={selectedUsers.includes(user.id)} 
                                onChange={() => handleSelectUser(user.id)} 
                              />
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex align-items-center gap-3">
                                <Image 
                                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=60`} 
                                  alt={user.name} 
                                  roundedCircle 
                                  width={45} 
                                  height={45} 
                                  style={{ objectFit: 'cover' }}
                                />
                                <div>
                                  <div className="fw-semibold">{user.name}</div>
                                  <div className="small text-muted">{user.email}</div>
                                  {!user.verified && user.role !== 'admin' && (
                                    <Badge bg="warning" className="mt-1 rounded-pill">Unverified</Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <Badge bg={roleBadge.bg} className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill" style={{ width: 'fit-content' }}>
                                {roleBadge.icon}
                                <span>{roleBadge.label}</span>
                              </Badge>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <Badge bg={statusBadge.bg} className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill" style={{ width: 'fit-content' }}>
                                {statusBadge.icon}
                                <span>{statusBadge.label}</span>
                              </Badge>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div className="small">{format(new Date(user.joined), 'MMM dd, yyyy')}</div>
                              <div className="small text-muted">{formatDistanceToNow(new Date(user.joined), { addSuffix: true })}</div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="link" 
                                  className="p-0 text-primary" 
                                  onClick={() => { setSelectedUser(user); setShowEmailModal(true); }}
                                >
                                  <FaEnvelope />
                                </Button>
                                {user.phone && (
                                  <Button variant="link" className="p-0 text-success">
                                    <FaPhone />
                                  </Button>
                                )}
                                {user.location && (
                                  <Button variant="link" className="p-0 text-info">
                                    <FaMapMarkerAlt />
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div className="text-warning">{getRatingStars(user.rating)}</div>
                              <div className="small text-muted">{user.reviews || 0} reviews</div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="link" 
                                  className="p-1 text-info" 
                                  onClick={() => handleViewDetails(user)}
                                >
                                  <FaEye size={14} />
                                </Button>
                                <Button 
                                  variant="link" 
                                  className="p-1 text-primary" 
                                  onClick={() => handleEditUser(user)}
                                >
                                  <FaEdit size={14} />
                                </Button>
                                {!user.verified && user.role !== 'admin' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-success" 
                                    onClick={() => handleVerifyUser(user)}
                                  >
                                    <FaUserCheck size={14} />
                                  </Button>
                                )}
                                {user.status !== 'suspended' && user.role !== 'admin' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-warning" 
                                    onClick={() => handleSuspendUser(user)}
                                  >
                                    <FaBan size={14} />
                                  </Button>
                                )}
                                {user.status === 'suspended' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-success" 
                                    onClick={() => handleActivateUser(user)}
                                  >
                                    <FaUnlockAlt size={14} />
                                  </Button>
                                )}
                                {user.role !== 'admin' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-danger" 
                                    onClick={() => handleDeleteUser(user)}
                                  >
                                    <FaTrash size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
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

      {/* Modals */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {isEditing ? <FaUserEdit className="me-2" /> : <FaUserPlus className="me-2" />}
            {isEditing ? 'Edit User' : 'Add New User'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Role</Form.Label>
                  <Form.Select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="customer">Customer</option>
                    <option value="provider">Service Provider</option>
                    <option value="admin">Administrator</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Status</Form.Label>
                  <Form.Select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {!isEditing && (
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password (default: 'default123')"
                    />
                    <Form.Text className="text-muted">Minimum 6 characters. Default: 'default123'</Form.Text>
                  </Form.Group>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveUser} disabled={processing}>
            {processing ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedUser && (
            <>
              <div className="text-center mb-4">
                <Image
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=667eea&color=fff&size=100`}
                  alt={selectedUser.name}
                  roundedCircle
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover' }}
                  className="mb-3 border"
                />
                <h4 className="mb-1">{selectedUser.name}</h4>
                <div className="d-flex justify-content-center gap-2">
                  <Badge bg={getRoleBadge(selectedUser.role).bg} className="px-3 py-2 rounded-pill">
                    {getRoleBadge(selectedUser.role).icon}
                    <span className="ms-2">{getRoleBadge(selectedUser.role).label}</span>
                  </Badge>
                  {selectedUser.verified && (
                    <Badge bg="info" className="px-3 py-2 rounded-pill">
                      <FaUserCheck className="me-1" /> Verified
                    </Badge>
                  )}
                </div>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Personal Information</h6>
                    <div className="info-item">
                      <FaEnvelope className="text-muted" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="info-item">
                      <FaPhone className="text-muted" />
                      <span>{selectedUser.phone || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <FaMapMarkerAlt className="text-muted" />
                      <span>{selectedUser.location || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <FaCalendarAlt className="text-muted" />
                      <span>Joined {format(new Date(selectedUser.joined), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="info-item">
                      <FaClock className="text-muted" />
                      <span>Last active {formatDistanceToNow(new Date(selectedUser.lastActive), { addSuffix: true })}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Activity Statistics</h6>
                    <div className="info-item">
                      <FaChartLine className="text-muted" />
                      <span>Total Bookings: <strong>{selectedUser.bookings || 0}</strong></span>
                    </div>
                    <div className="info-item">
                      <FaWallet className="text-muted" />
                      <span>Total Spent: <strong>{formatNaira(selectedUser.spent || 0)}</strong></span>
                    </div>
                    <div className="info-item">
                      <FaStar className="text-muted" />
                      <span>Rating: {getRatingStars(selectedUser.rating)}</span>
                    </div>
                    <div className="info-item">
                      <FaRegComment className="text-muted" />
                      <span>Reviews: <strong>{selectedUser.reviews || 0}</strong></span>
                    </div>
                    {selectedUser.role === 'provider' && (
                      <div className="info-item">
                        <FaServicestack className="text-muted" />
                        <span>Services: <strong>{selectedUser.services || 0}</strong></span>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => { setShowDetailsModal(false); handleEditUser(selectedUser); }}>
            <FaEdit className="me-2" /> Edit User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Verify Modal */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success">
            <FaUserCheck className="me-2" /> Verify User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="success" className="mb-0" style={{ borderRadius: '12px' }}>
            Are you sure you want to verify <strong>{selectedUser?.name}</strong>?
            <p className="mb-0 mt-2 small text-muted">Verified users have full access to all platform features.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowVerifyModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmVerify} disabled={processing}>
            {processing ? 'Verifying...' : 'Verify User'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Suspend Modal */}
      <Modal show={showSuspendModal} onHide={() => setShowSuspendModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-warning">
            <FaBan className="me-2" /> Suspend User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="warning" className="mb-0" style={{ borderRadius: '12px' }}>
            Are you sure you want to suspend <strong>{selectedUser?.name}</strong>?
            <p className="mb-0 mt-2 small">Suspended users cannot access the platform until reactivated.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowSuspendModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={confirmSuspend} disabled={processing}>
            {processing ? 'Suspending...' : 'Suspend User'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaExclamationTriangle className="me-2" /> Delete User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaTrash className="me-2" />
            Are you sure you want to permanently delete <strong>{selectedUser?.name}</strong>?
            <p className="mb-0 mt-2 small text-danger">This action cannot be undone. All user data will be removed.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={processing}>
            {processing ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Selected users: <strong className="text-primary">{selectedUsers.length}</strong></p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkAction('verify')} className="d-flex align-items-center justify-content-center gap-2">
              <FaUserCheck /> Verify Selected Users
            </Button>
            <Button variant="warning" onClick={() => handleBulkAction('suspend')} className="d-flex align-items-center justify-content-center gap-2">
              <FaBan /> Suspend Selected Users
            </Button>
            <Button variant="info" onClick={() => handleBulkAction('activate')} className="d-flex align-items-center justify-content-center gap-2">
              <FaUnlockAlt /> Activate Selected Users
            </Button>
            <Button variant="danger" onClick={() => handleBulkAction('delete')} className="d-flex align-items-center justify-content-center gap-2">
              <FaTrash /> Delete Selected Users
            </Button>
            <Button variant="primary" onClick={() => { setShowBulkModal(false); setShowEmailModal(true); }} className="d-flex align-items-center justify-content-center gap-2">
              <FaEnvelope /> Send Email to Selected
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Email Modal */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaEnvelope className="me-2" /> Send Email
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">To</Form.Label>
              <Form.Control
                type="text"
                value={selectedUsers.length > 0 ? `${selectedUsers.length} selected users` : selectedUser?.email || ''}
                disabled
                className="bg-light"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Subject</Form.Label>
              <Form.Control
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Enter email subject"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Type your message here..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowEmailModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendEmail} disabled={processing}>
            {processing ? 'Sending...' : 'Send Email'}
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
        .info-item:last-child {
          border-bottom: none;
        }
        .table > :not(caption) > * > * {
          padding: 16px 12px;
          vertical-align: middle;
        }
        .table tbody tr:hover {
          background-color: #f8fafc;
        }
        .table-active {
          background-color: #e7f1ff !important;
        }
        .btn-link {
          text-decoration: none;
        }
        .btn-link:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;