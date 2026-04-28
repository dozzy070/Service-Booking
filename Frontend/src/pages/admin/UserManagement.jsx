// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
  OverlayTrigger
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
  FaRegClock
} from 'react-icons/fa';

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

  // Fetch users from API (real data)
  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlertMessage({ show: true, type: 'error', message: 'Failed to load users' });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search users
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    setTimeout(() => setAlertMessage({ show: false, type: '', message: '' }), 3000);
  };

  // CRUD operations (real API calls)
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
    try {
      if (isEditing && selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, formData);
        showAlert('success', `${formData.name} updated successfully`);
        fetchUsers();
      } else {
        showAlert('warning', 'Creating new users is not supported via admin panel');
      }
      setShowUserModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      showAlert('danger', 'Failed to save user');
    }
  };

  const handleVerifyUser = (user) => {
    setSelectedUser(user);
    setShowVerifyModal(true);
  };

  const confirmVerify = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}/verify`);
      setShowVerifyModal(false);
      showAlert('success', `${selectedUser.name} has been verified successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      showAlert('danger', 'Failed to verify user');
    }
  };

  const handleSuspendUser = (user) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}/suspend`);
      setShowSuspendModal(false);
      showAlert('warning', `${selectedUser.name} has been suspended`);
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      showAlert('danger', 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/unsuspend`);
      showAlert('success', `${user.name} has been activated`);
      fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      showAlert('danger', 'Failed to activate user');
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setShowDeleteModal(false);
      showAlert('danger', `${selectedUser.name} has been deleted`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('danger', 'Failed to delete user');
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      showAlert('warning', 'Please select users first');
      return;
    }
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
      showAlert('success', `${selectedUsers.length} users ${action === 'verify' ? 'verified' : action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'deleted'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showAlert('danger', 'Failed to perform bulk action');
    }
  };

  // Export functions (real data)
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
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert('success', 'Users exported to CSV successfully');
  };

  const exportToExcel = () => {
    try {
      import('xlsx').then(XLSX => {
        const wsData = [
          ['User Management Report', '', '', '', '', '', ''],
          [`Generated: ${new Date().toLocaleString()}`, '', '', '', '', '', ''],
          [`Total Users: ${filteredUsers.length}`, '', '', '', '', '', ''],
          ['', '', '', '', '', '', ''],
          ['User List', '', '', '', '', '', ''],
          ['ID', 'Name', 'Email', 'Role', 'Status', 'Verified', 'Joined', 'Last Active', 'Bookings', 'Revenue', 'Rating'],
          ...filteredUsers.map(user => [
            user.id, user.name, user.email, user.role, user.status, user.verified ? 'Yes' : 'No',
            user.joined, user.lastActive, user.bookings || 0,
            user.role === 'provider' ? `$${user.revenue || 0}` : `$${user.spent || 0}`,
            user.rating || 0
          ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        showAlert('success', 'Users exported to Excel successfully');
      }).catch(err => {
        console.error('Failed to load xlsx:', err);
        showAlert('danger', 'Excel export requires xlsx package. Please install it with: npm install xlsx');
      });
    } catch (error) {
      showAlert('danger', 'Excel export failed. Please install xlsx package.');
    }
  };

  const exportToPDF = () => {
    try {
      import('jspdf').then(jsPDF => {
        import('jspdf-autotable').then(() => {
          const doc = new jsPDF.default();
          doc.setFontSize(20);
          doc.text('User Management Report', 14, 22);
          doc.setFontSize(11);
          doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
          doc.text(`Total Users: ${filteredUsers.length}`, 14, 38);
          const tableData = filteredUsers.slice(0, 20).map(user => [
            user.id, user.name, user.email, user.role, user.status, user.joined, user.bookings || 0
          ]);
          doc.autoTable({
            startY: 45,
            head: [['ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Bookings']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
          });
          doc.save(`users_report_${new Date().toISOString().split('T')[0]}.pdf`);
          showAlert('success', 'Users exported to PDF successfully');
        }).catch(err => {
          showAlert('danger', 'PDF export requires jspdf-autotable package');
        });
      }).catch(err => {
        showAlert('danger', 'PDF export requires jspdf package');
      });
    } catch (error) {
      showAlert('danger', 'PDF export failed. Please install jspdf and jspdf-autotable packages.');
    }
  };

  // Send email (simulated)
  const handleSendEmail = () => {
    if (!emailData.subject || !emailData.message) {
      showAlert('warning', 'Please fill in subject and message');
      return;
    }
    const recipients = selectedUsers.length > 0 
      ? users.filter(u => selectedUsers.includes(u.id)).map(u => u.email)
      : [selectedUser.email];
    setTimeout(() => {
      showAlert('success', `Email sent to ${recipients.length} recipient(s)`);
      setShowEmailModal(false);
      setEmailData({ subject: '', message: '' });
    }, 1000);
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
      active: { bg: 'success', icon: <FaCheckCircle />, label: 'Active', className: 'bg-success' },
      inactive: { bg: 'secondary', icon: <FaTimesCircle />, label: 'Inactive', className: 'bg-secondary' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending', className: 'bg-warning' },
      suspended: { bg: 'danger', icon: <FaBan />, label: 'Suspended', className: 'bg-danger' }
    };
    return badges[status] || badges.inactive;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating);
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

  return (
    <Container fluid className="user-management py-4">
      {/* Alert Message */}
      {alertMessage.show && (
        <Alert variant={alertMessage.type} className="position-fixed top-0 end-0 m-3 shadow-lg" style={{ zIndex: 9999, minWidth: '300px' }} dismissible onClose={() => setAlertMessage({ show: false, type: '', message: '' })}>
          <div className="d-flex align-items-center">
            {alertMessage.type === 'success' && <FaCheckCircle className="me-2 fs-5" />}
            {alertMessage.type === 'warning' && <FaExclamationTriangle className="me-2 fs-5" />}
            {alertMessage.type === 'danger' && <FaTimesCircle className="me-2 fs-5" />}
            {alertMessage.type === 'info' && <FaInfoCircle className="me-2 fs-5" />}
            <span>{alertMessage.message}</span>
          </div>
        </Alert>
      )}

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-2 fw-bold">User Management</h2>
          <p className="text-muted mb-0">Manage users, roles, permissions, and monitor user activity across the platform</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary"><FaFileExport className="me-2" /> Export</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={exportToCSV}><FaFileCsv className="me-2 text-success" /> CSV</Dropdown.Item>
              <Dropdown.Item onClick={exportToExcel}><FaFileExcel className="me-2 text-success" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={exportToPDF}><FaFilePdf className="me-2 text-danger" /> PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="outline-primary" onClick={() => setShowBulkModal(true)} disabled={selectedUsers.length === 0}>
            <FaUsers className="me-2" /> Bulk Actions ({selectedUsers.length})
          </Button>
          <Button variant="primary" onClick={handleAddUser}><FaUserPlus className="me-2" /> Add User</Button>
        </Col>
      </Row>

      {/* Stats Cards (computed from real data) */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm hover-shadow transition">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div><small className="text-muted text-uppercase">Total Users</small><h3 className="mb-0 fw-bold mt-2">{stats.total}</h3></div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3"><FaUsers className="text-primary fs-3" /></div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between small">
                  <span>Active: {stats.active}</span><span>Pending: {stats.pending}</span><span>Suspended: {stats.suspended}</span>
                </div>
                <ProgressBar className="mt-2" style={{ height: '5px' }}>
                  <ProgressBar variant="success" now={(stats.active / stats.total) * 100} key={1} />
                  <ProgressBar variant="warning" now={(stats.pending / stats.total) * 100} key={2} />
                  <ProgressBar variant="danger" now={(stats.suspended / stats.total) * 100} key={3} />
                </ProgressBar>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div><small className="text-muted text-uppercase">Customers</small><h3 className="mb-0 fw-bold mt-2">{stats.customers}</h3></div>
                <div className="bg-info bg-opacity-10 rounded-circle p-3"><FaUserCircle className="text-info fs-3" /></div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Active Bookings</small>
                  <small className="text-muted">Avg. Spend</small>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">{users.filter(u => u.role === 'customer').reduce((sum, u) => sum + (u.bookings || 0), 0)}</span>
                  <span className="fw-semibold">${users.filter(u => u.role === 'customer').reduce((sum, u) => sum + (u.spent || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div><small className="text-muted text-uppercase">Providers</small><h3 className="mb-0 fw-bold mt-2">{stats.providers}</h3></div>
                <div className="bg-success bg-opacity-10 rounded-circle p-3"><FaUserTie className="text-success fs-3" /></div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Total Services</small>
                  <small className="text-muted">Total Revenue</small>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">{users.filter(u => u.role === 'provider').reduce((sum, u) => sum + (u.services || 0), 0)}</span>
                  <span className="fw-semibold">${users.filter(u => u.role === 'provider').reduce((sum, u) => sum + (u.revenue || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div><small className="text-muted text-uppercase">Verification Rate</small><h3 className="mb-0 fw-bold mt-2">{((stats.verified / stats.total) * 100).toFixed(1)}%</h3></div>
                <div className="bg-warning bg-opacity-10 rounded-circle p-3"><FaUserCheck className="text-warning fs-3" /></div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Verified: {stats.verified}</small>
                  <small className="text-muted">Unverified: {stats.unverified}</small>
                </div>
                <ProgressBar className="mt-2" variant="warning" now={(stats.verified / stats.total) * 100} style={{ height: '5px' }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => {
            setActiveTab(k);
            if (k === 'all') { setRoleFilter('all'); setStatusFilter('all'); setVerificationFilter('all'); }
            else if (k === 'customers') { setRoleFilter('customer'); setStatusFilter('all'); }
            else if (k === 'providers') { setRoleFilter('provider'); setStatusFilter('all'); }
            else if (k === 'admins') { setRoleFilter('admin'); setStatusFilter('all'); }
            else if (k === 'verified') { setVerificationFilter('verified'); }
            else if (k === 'unverified') { setVerificationFilter('unverified'); }
          }} className="mb-3">
            <Tab eventKey="all" title={`All Users (${stats.total})`} />
            <Tab eventKey="customers" title={`Customers (${stats.customers})`} />
            <Tab eventKey="providers" title={`Providers (${stats.providers})`} />
            <Tab eventKey="admins" title={`Admins (${stats.admins})`} />
            <Tab eventKey="verified" title={`Verified (${stats.verified})`} />
            <Tab eventKey="unverified" title={`Unverified (${stats.unverified})`} />
          </Tabs>

          {/* Search and Filters */}
          <Row className="g-3">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text className="bg-white"><FaSearch className="text-muted" /></InputGroup.Text>
                <Form.Control placeholder="Search users by name, email, phone, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
                {searchTerm && <Button variant="outline-secondary" onClick={() => setSearchTerm('')}><FaTimes /></Button>}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option><option value="suspended">Suspended</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); setVerificationFilter('all'); setActiveTab('all'); }} className="w-100"><FaSync className="me-2" /> Reset</Button>
            </Col>
            <Col md={2}>
              <Form.Select value={usersPerPage} onChange={(e) => setUsersPerPage(Number(e.target.value))}>
                <option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '40px' }}><Form.Check type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0} /></th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', minWidth: '200px' }}>User {getSortIcon('name')}</th>
                  <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>Role {getSortIcon('role')}</th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status {getSortIcon('status')}</th>
                  <th onClick={() => handleSort('joined')} style={{ cursor: 'pointer' }}>Joined {getSortIcon('joined')}</th>
                  <th>Contact</th>
                  <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer' }}>Rating {getSortIcon('rating')}</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => {
                  const roleBadge = getRoleBadge(user.role);
                  const statusBadge = getStatusBadge(user.status);
                  return (
                    <tr key={user.id} className={selectedUsers.includes(user.id) ? 'table-active' : ''}>
                      <td className="align-middle"><Form.Check type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => handleSelectUser(user.id)} /></td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center gap-3">
                          <Image src={user.avatar} alt={user.name} roundedCircle width={45} height={45} className="border" />
                          <div><div className="fw-semibold">{user.name}</div><div className="small text-muted">{user.email}</div>{!user.verified && user.role !== 'admin' && <Badge bg="warning" className="mt-1">Unverified</Badge>}</div>
                        </div>
                      </td>
                      <td className="align-middle"><Badge bg={roleBadge.bg} className="px-3 py-2 rounded-pill">{roleBadge.icon}<span className="ms-2">{roleBadge.label}</span></Badge></td>
                      <td className="align-middle"><Badge bg={statusBadge.bg} className="px-3 py-2 rounded-pill">{statusBadge.icon}<span className="ms-2">{statusBadge.label}</span></Badge></td>
                      <td className="align-middle"><div className="small">{new Date(user.joined).toLocaleDateString()}</div><div className="small text-muted">{new Date(user.joined).toLocaleTimeString()}</div></td>
                      <td className="align-middle">
                        <div className="d-flex gap-2">
                          <OverlayTrigger placement="top" overlay={<Tooltip>Send Email</Tooltip>}><Button variant="link" className="p-0 text-primary" onClick={() => { setSelectedUser(user); setShowEmailModal(true); }}><FaEnvelope /></Button></OverlayTrigger>
                          {user.phone && <OverlayTrigger placement="top" overlay={<Tooltip>Call {user.phone}</Tooltip>}><Button variant="link" className="p-0 text-success"><FaPhone /></Button></OverlayTrigger>}
                          {user.location && <OverlayTrigger placement="top" overlay={<Tooltip>{user.location}</Tooltip>}><Button variant="link" className="p-0 text-info"><FaMapMarkerAlt /></Button></OverlayTrigger>}
                        </div>
                      </td>
                      <td className="align-middle"><div className="text-warning">{getRatingStars(user.rating)}</div><div className="small text-muted">{user.reviews || 0} reviews</div></td>
                      <td className="align-middle">
                        <div className="d-flex gap-1">
                          <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}><Button variant="link" className="p-1 text-info" onClick={() => handleViewDetails(user)}><FaEye /></Button></OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Edit User</Tooltip>}><Button variant="link" className="p-1 text-primary" onClick={() => handleEditUser(user)}><FaEdit /></Button></OverlayTrigger>
                          {!user.verified && user.role !== 'admin' && <OverlayTrigger placement="top" overlay={<Tooltip>Verify User</Tooltip>}><Button variant="link" className="p-1 text-success" onClick={() => handleVerifyUser(user)}><FaUserCheck /></Button></OverlayTrigger>}
                          {user.status !== 'suspended' && user.role !== 'admin' && <OverlayTrigger placement="top" overlay={<Tooltip>Suspend User</Tooltip>}><Button variant="link" className="p-1 text-warning" onClick={() => handleSuspendUser(user)}><FaBan /></Button></OverlayTrigger>}
                          {user.status === 'suspended' && <OverlayTrigger placement="top" overlay={<Tooltip>Activate User</Tooltip>}><Button variant="link" className="p-1 text-success" onClick={() => handleActivateUser(user)}><FaUnlockAlt /></Button></OverlayTrigger>}
                          {user.role !== 'admin' && <OverlayTrigger placement="top" overlay={<Tooltip>Delete User</Tooltip>}><Button variant="link" className="p-1 text-danger" onClick={() => handleDeleteUser(user)}><FaTrash /></Button></OverlayTrigger>}
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="link" className="p-1 text-secondary"><FaEllipsisV /></Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => { setSelectedUser(user); setShowEmailModal(true); }}><FaEnvelope className="me-2" /> Send Email</Dropdown.Item>
                              <Dropdown.Item><FaHistory className="me-2" /> View Activity Log</Dropdown.Item>
                              <Dropdown.Item><FaDownload className="me-2" /> Export User Data</Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger"><FaBan className="me-2" /> Report User</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-5">
              <FaUsers size={48} className="text-muted mb-3" />
              <h5>No users found</h5>
              <p className="text-muted">Try adjusting your search or filter criteria</p>
              <Button variant="primary" onClick={handleAddUser}><FaUserPlus className="me-2" /> Add New User</Button>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div className="text-muted small">Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users</div>
              <Pagination className="mb-0">
                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                {[...Array(Math.min(totalPages, 5)).keys()].map(num => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = num + 1;
                  else if (currentPage <= 3) pageNum = num + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + num;
                  else pageNum = currentPage - 2 + num;
                  return <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;
                })}
                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modals – unchanged but all real data driven */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white"><Modal.Title>{isEditing ? <FaUserEdit className="me-2" /> : <FaUserPlus className="me-2" />}{isEditing ? 'Edit User' : 'Add New User'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Full Name *</Form.Label><Form.Control type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter full name" /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Email Address *</Form.Label><Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Enter email address" /></Form.Group></Col></Row>
            <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Phone Number</Form.Label><Form.Control type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number" /></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Location</Form.Label><Form.Control type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Enter location" /></Form.Group></Col></Row>
            <Row><Col md={6}><Form.Group className="mb-3"><Form.Label>Role</Form.Label><Form.Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}><option value="customer">Customer</option><option value="provider">Service Provider</option><option value="admin">Administrator</option></Form.Select></Form.Group></Col><Col md={6}><Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option><option value="suspended">Suspended</option></Form.Select></Form.Group></Col></Row>
            {!isEditing && <Form.Group className="mb-3"><Form.Label>Password *</Form.Label><Form.Control type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" /></Form.Group>}
          </Form>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveUser}><FaSave className="me-2" /> {isEditing ? 'Update User' : 'Create User'}</Button></Modal.Footer>
      </Modal>

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>User Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <div className="text-center mb-4">
                <Image src={selectedUser.avatar} alt={selectedUser.name} roundedCircle width={100} height={100} className="border mb-3" />
                <h4>{selectedUser.name}</h4>
                <Badge bg={getRoleBadge(selectedUser.role).bg} className="px-3 py-2 rounded-pill">{getRoleBadge(selectedUser.role).icon}<span className="ms-2">{getRoleBadge(selectedUser.role).label}</span></Badge>
                {selectedUser.verified && <Badge bg="info" className="ms-2 px-3 py-2 rounded-pill"><FaUserCheck className="me-1" /> Verified</Badge>}
              </div>
              <Row className="mb-4">
                <Col md={6}><Card className="border-0 bg-light"><Card.Body><h6 className="mb-3">Personal Information</h6><div className="mb-2"><FaEnvelope className="text-muted me-2" /><strong>Email:</strong> {selectedUser.email}</div><div className="mb-2"><FaPhone className="text-muted me-2" /><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</div><div className="mb-2"><FaMapMarkerAlt className="text-muted me-2" /><strong>Location:</strong> {selectedUser.location || 'Not provided'}</div><div className="mb-2"><FaCalendarAlt className="text-muted me-2" /><strong>Joined:</strong> {new Date(selectedUser.joined).toLocaleDateString()}</div><div><FaClock className="text-muted me-2" /><strong>Last Active:</strong> {new Date(selectedUser.lastActive).toLocaleDateString()}</div></Card.Body></Card></Col>
                <Col md={6}><Card className="border-0 bg-light"><Card.Body><h6 className="mb-3">Activity Statistics</h6><div className="mb-2"><FaChartLine className="text-muted me-2" /><strong>Total Bookings:</strong> {selectedUser.bookings || 0}</div><div className="mb-2"><FaMoneyBillWave className="text-muted me-2" /><strong>Total Spent/Revenue:</strong> ${selectedUser.spent || selectedUser.revenue || 0}</div><div className="mb-2"><FaStar className="text-muted me-2" /><strong>Rating:</strong> {getRatingStars(selectedUser.rating)}</div><div className="mb-2"><FaRegComment className="text-muted me-2" /><strong>Reviews:</strong> {selectedUser.reviews || 0}</div>{selectedUser.role === 'provider' && <div><FaServicestack className="text-muted me-2" /><strong>Services Offered:</strong> {selectedUser.services || 0}</div>}</Card.Body></Card></Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button><Button variant="primary" onClick={() => { setShowDetailsModal(false); handleEditUser(selectedUser); }}><FaEdit className="me-2" /> Edit User</Button></Modal.Footer>
      </Modal>

      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered><Modal.Header closeButton className="bg-success text-white"><Modal.Title><FaUserCheck className="me-2" /> Verify User</Modal.Title></Modal.Header><Modal.Body><p>Are you sure you want to verify <strong>{selectedUser?.name}</strong>?</p><p className="text-muted small">Verified users will have full access to all platform features and will be trusted by other users.</p></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowVerifyModal(false)}>Cancel</Button><Button variant="success" onClick={confirmVerify}><FaCheckCircle className="me-2" /> Verify User</Button></Modal.Footer></Modal>

      <Modal show={showSuspendModal} onHide={() => setShowSuspendModal(false)} centered><Modal.Header closeButton className="bg-warning text-dark"><Modal.Title><FaBan className="me-2" /> Suspend User</Modal.Title></Modal.Header><Modal.Body><p>Are you sure you want to suspend <strong>{selectedUser?.name}</strong>?</p><Form.Group className="mt-3"><Form.Label>Reason for suspension</Form.Label><Form.Select><option>Violation of terms of service</option><option>Suspicious activity detected</option><option>Non-payment of fees</option><option>Multiple customer complaints</option><option>Fraudulent behavior</option><option>Other</option></Form.Select></Form.Group><Form.Group className="mt-3"><Form.Label>Additional notes (optional)</Form.Label><Form.Control as="textarea" rows={3} placeholder="Provide more details..." /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowSuspendModal(false)}>Cancel</Button><Button variant="warning" onClick={confirmSuspend}><FaBan className="me-2" /> Suspend User</Button></Modal.Footer></Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered><Modal.Header closeButton className="bg-danger text-white"><Modal.Title><FaExclamationTriangle className="me-2" /> Delete User</Modal.Title></Modal.Header><Modal.Body><div className="text-center mb-4"><FaTrash size={48} className="text-danger mb-3" /><p>Are you sure you want to permanently delete <strong>{selectedUser?.name}</strong>?</p><p className="text-danger small"><strong>Warning:</strong> This action cannot be undone. All user data will be permanently removed from the system.</p></div></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={confirmDelete}><FaTrash className="me-2" /> Delete Permanently</Button></Modal.Footer></Modal>

      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered><Modal.Header closeButton><Modal.Title>Bulk Actions</Modal.Title></Modal.Header><Modal.Body><p>Selected users: <strong className="text-primary">{selectedUsers.length}</strong></p><div className="d-grid gap-2"><Button variant="success" onClick={() => handleBulkAction('verify')}><FaUserCheck className="me-2" /> Verify Selected Users</Button><Button variant="warning" onClick={() => handleBulkAction('suspend')}><FaBan className="me-2" /> Suspend Selected Users</Button><Button variant="info" onClick={() => handleBulkAction('activate')}><FaUnlockAlt className="me-2" /> Activate Selected Users</Button><Button variant="danger" onClick={() => handleBulkAction('delete')}><FaTrash className="me-2" /> Delete Selected Users</Button><Button variant="primary" onClick={() => { setShowBulkModal(false); setShowEmailModal(true); }}><FaEnvelope className="me-2" /> Send Email to Selected</Button></div></Modal.Body></Modal>

      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} size="lg" centered><Modal.Header closeButton><Modal.Title><FaEnvelope className="me-2" /> Send Email</Modal.Title></Modal.Header><Modal.Body><Form><Form.Group className="mb-3"><Form.Label>To</Form.Label><Form.Control type="text" value={selectedUsers.length > 0 ? `${selectedUsers.length} selected users` : selectedUser?.email || ''} disabled className="bg-light" /></Form.Group><Form.Group className="mb-3"><Form.Label>Subject</Form.Label><Form.Control type="text" value={emailData.subject} onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Enter email subject" /></Form.Group><Form.Group className="mb-3"><Form.Label>Message</Form.Label><Form.Control as="textarea" rows={6} value={emailData.message} onChange={(e) => setEmailData({ ...emailData, message: e.target.value })} placeholder="Type your message here..." /></Form.Group></Form></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSendEmail}><FaEnvelope className="me-2" /> Send Email</Button></Modal.Footer></Modal>

      <style jsx="true">{`
        .user-management { max-width: 1600px; margin: 0 auto; }
        .transition { transition: all 0.3s ease; }
        .hover-shadow:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important; }
        .table > :not(caption) > * > * { padding: 1rem 0.75rem; vertical-align: middle; }
        .table tbody tr:hover { background-color: #f8f9fa; }
        .table-active { background-color: #e7f1ff !important; }
        .btn-link { text-decoration: none; }
        .btn-link:hover { opacity: 0.7; }
        .modal-header.bg-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        @media (max-width: 768px) {
          .table-responsive { font-size: 0.85rem; }
          .btn-link { padding: 0.25rem; }
          .badge { font-size: 0.7rem; }
        }
      `}</style>
    </Container>
  );
};

export default UserManagement;