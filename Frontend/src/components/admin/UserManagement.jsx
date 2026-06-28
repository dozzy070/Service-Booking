// src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminAPI } from '../../api/api';
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
  FaAward,
  FaMedal
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

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
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
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

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

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

  // ✅ Fetch users from API with proper error handling
  const fetchUsers = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getUsers === 'function') {
        response = await adminAPI.getUsers();
      } else if (typeof adminAPI.getUserList === 'function') {
        response = await adminAPI.getUserList();
      } else {
        throw new Error('Users API methods not available');
      }

      const data = response?.data || [];
      const usersData = Array.isArray(data) ? data : 
                        Array.isArray(data?.users) ? data.users : 
                        Array.isArray(data?.data) ? data.data : [];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users');
      setUsers([]);
      setFilteredUsers([]);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load users');
      }
    }
  }, []);

  // ✅ Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    await fetchUsers();
    setRefreshing(false);
    toast.success('Users refreshed');
  };

  // ✅ Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchUsers().finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000); // Poll every 30 seconds for real-time updates
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
    fetchUsers();
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // ✅ Filter and search users - with safety checks
  useEffect(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user?.name?.toLowerCase().includes(term) ||
        user?.email?.toLowerCase().includes(term) ||
        user?.phone?.toLowerCase().includes(term) ||
        user?.location?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user?.role?.toLowerCase() === roleFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user?.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(user => 
        verificationFilter === 'verified' ? user?.verified === true : user?.verified !== true
      );
    }

    // Sort
    if (sortField && filtered.length > 0) {
      filtered.sort((a, b) => {
        let aVal = a?.[sortField];
        let bVal = b?.[sortField];
        if (sortField === 'joined' || sortField === 'lastActive' || sortField === 'last_active' || sortField === 'created_at' || sortField === 'createdAt') {
          aVal = aVal ? new Date(aVal) : 0;
          bVal = bVal ? new Date(bVal) : 0;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, statusFilter, verificationFilter, sortField, sortDirection]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = Array.isArray(filteredUsers) ? filteredUsers.slice(indexOfFirstUser, indexOfLastUser) : [];
  const totalPages = Math.ceil((Array.isArray(filteredUsers) ? filteredUsers.length : 0) / usersPerPage);

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
    if (e.target.checked) {
      setSelectedUsers(currentUsers.map(user => user.id || user._id).filter(Boolean));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    if (!userId) return;
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // ✅ CRUD operations with real API
  const handleAddUser = () => {
    setIsEditing(false);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      role: 'customer', 
      status: 'active', 
      location: '', 
      password: '' 
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    if (!user) return;
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'customer',
      status: user.status || 'active',
      location: user.location || '',
      password: ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const payload = { ...formData };
      
      if (isEditing && selectedUser) {
        const userId = selectedUser.id || selectedUser._id;
        if (!userId) {
          throw new Error('User ID not found');
        }
        if (typeof adminAPI.updateUser === 'function') {
          await adminAPI.updateUser(userId, payload);
        } else if (typeof adminAPI.editUser === 'function') {
          await adminAPI.editUser(userId, payload);
        } else {
          throw new Error('User update API methods not available');
        }
        toast.success(`${formData.name} updated successfully`);
      } else {
        if (typeof adminAPI.createUser === 'function') {
          await adminAPI.createUser(payload);
        } else if (typeof adminAPI.addUser === 'function') {
          await adminAPI.addUser(payload);
        } else {
          throw new Error('User create API methods not available');
        }
        toast.success(`${formData.name} created successfully`);
      }
      setShowUserModal(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save user');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyUser = (user) => {
    setSelectedUser(user);
    setShowVerifyModal(true);
  };

  const confirmVerify = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id || selectedUser._id;
    if (!userId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.verifyUser === 'function') {
        await adminAPI.verifyUser(userId);
      } else if (typeof adminAPI.verifyUserEmail === 'function') {
        await adminAPI.verifyUserEmail(userId);
      } else {
        throw new Error('User verify API methods not available');
      }
      
      setShowVerifyModal(false);
      toast.success(`${selectedUser.name} verified successfully`);
      await fetchUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error(error.message || 'Failed to verify user');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspendUser = (user) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id || selectedUser._id;
    if (!userId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.suspendUser === 'function') {
        await adminAPI.suspendUser(userId);
      } else if (typeof adminAPI.updateUserStatus === 'function') {
        await adminAPI.updateUserStatus(userId, { status: 'suspended' });
      } else {
        throw new Error('User suspend API methods not available');
      }
      
      setShowSuspendModal(false);
      toast.warning(`${selectedUser.name} suspended`);
      await fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error(error.message || 'Failed to suspend user');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateUser = async (user) => {
    if (!user) return;
    const userId = user.id || user._id;
    if (!userId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.unsuspendUser === 'function') {
        await adminAPI.unsuspendUser(userId);
      } else if (typeof adminAPI.updateUserStatus === 'function') {
        await adminAPI.updateUserStatus(userId, { status: 'active' });
      } else {
        throw new Error('User activate API methods not available');
      }
      
      toast.success(`${user.name} activated`);
      await fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error(error.message || 'Failed to activate user');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id || selectedUser._id;
    if (!userId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.deleteUser === 'function') {
        await adminAPI.deleteUser(userId);
      } else if (typeof adminAPI.removeUser === 'function') {
        await adminAPI.removeUser(userId);
      } else {
        throw new Error('User delete API methods not available');
      }
      
      setShowDeleteModal(false);
      toast.success(`${selectedUser.name} deleted`);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setProcessing(false);
    }
  };

  // ✅ Bulk actions with real API
  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users first');
      return;
    }
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      for (const userId of selectedUsers) {
        switch (action) {
          case 'verify':
            if (typeof adminAPI.verifyUser === 'function') await adminAPI.verifyUser(userId);
            break;
          case 'suspend':
            if (typeof adminAPI.suspendUser === 'function') await adminAPI.suspendUser(userId);
            break;
          case 'activate':
            if (typeof adminAPI.unsuspendUser === 'function') await adminAPI.unsuspendUser(userId);
            break;
          case 'delete':
            if (typeof adminAPI.deleteUser === 'function') await adminAPI.deleteUser(userId);
            break;
          default: break;
        }
      }
      setSelectedUsers([]);
      setShowBulkModal(false);
      toast.success(`${selectedUsers.length} users ${action === 'verify' ? 'verified' : action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'deleted'}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(error.message || 'Failed to perform bulk action');
    } finally {
      setProcessing(false);
    }
  };

  // ✅ Export functions
  const exportToCSV = () => {
    if (!Array.isArray(filteredUsers) || filteredUsers.length === 0) {
      toast.warning('No users to export');
      return;
    }
    
    try {
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Verified', 'Phone', 'Location', 'Joined', 'Last Active'];
      const data = filteredUsers.map(user => [
        user.id || user._id || '',
        user.name || '',
        user.email || '',
        user.role || '',
        user.status || '',
        user.verified ? 'Yes' : 'No',
        user.phone || '',
        user.location || '',
        user.joined || user.created_at || user.createdAt || '',
        user.lastActive || user.last_active || user.updatedAt || ''
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
      toast.success('Users exported to CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    }
  };

  const exportToPDF = () => {
    toast.info('PDF export feature coming soon');
  };

  // ✅ Send email with real API
  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast.warning('Please fill in subject and message');
      return;
    }
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const recipients = selectedUsers.length > 0 
        ? users.filter(u => selectedUsers.includes(u.id || u._id)).map(u => u.email).filter(Boolean)
        : selectedUser?.email ? [selectedUser.email] : [];
      
      if (recipients.length === 0) {
        toast.warning('No recipients selected');
        return;
      }
      
      if (typeof adminAPI.sendBulkEmail === 'function') {
        await adminAPI.sendBulkEmail({
          recipients,
          subject: emailData.subject,
          message: emailData.message
        });
      } else if (typeof adminAPI.sendEmail === 'function') {
        await adminAPI.sendEmail({
          to: recipients,
          subject: emailData.subject,
          body: emailData.message
        });
      } else {
        throw new Error('Email API methods not available');
      }
      
      toast.success(`Email sent to ${recipients.length} recipient(s)`);
      setShowEmailModal(false);
      setEmailData({ subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getRoleBadge = (role) => {
    if (!role) {
      return { bg: 'secondary', icon: <FaUserCircle />, label: 'Unknown' };
    }
    const lowerRole = role.toLowerCase();
    const badges = {
      admin: { bg: 'danger', icon: <FaUserShield />, label: 'Admin' },
      provider: { bg: 'success', icon: <FaUserTie />, label: 'Provider' },
      customer: { bg: 'primary', icon: <FaUserCircle />, label: 'Customer' },
      user: { bg: 'primary', icon: <FaUserCircle />, label: 'User' }
    };
    return badges[lowerRole] || badges.customer;
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return { bg: 'secondary', icon: <FaTimesCircle />, label: 'Unknown' };
    }
    const lowerStatus = status.toLowerCase();
    const badges = {
      active: { bg: 'success', icon: <FaCheckCircle />, label: 'Active' },
      inactive: { bg: 'secondary', icon: <FaTimesCircle />, label: 'Inactive' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      suspended: { bg: 'danger', icon: <FaBan />, label: 'Suspended' },
      verified: { bg: 'success', icon: <FaCheckCircle />, label: 'Verified' }
    };
    return badges[lowerStatus] || badges.inactive;
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

  // ✅ Stats with safety checks
  const stats = useMemo(() => {
    const userArray = Array.isArray(users) ? users : [];
    return {
      total: userArray.length,
      active: userArray.filter(u => u?.status?.toLowerCase() === 'active').length,
      pending: userArray.filter(u => u?.status?.toLowerCase() === 'pending').length,
      suspended: userArray.filter(u => u?.status?.toLowerCase() === 'suspended').length,
      providers: userArray.filter(u => u?.role?.toLowerCase() === 'provider').length,
      customers: userArray.filter(u => u?.role?.toLowerCase() === 'customer' || u?.role?.toLowerCase() === 'user').length,
      admins: userArray.filter(u => u?.role?.toLowerCase() === 'admin').length,
      verified: userArray.filter(u => u?.verified === true).length,
      unverified: userArray.filter(u => u?.verified !== true).length
    };
  }, [users]);

  // Get user ID safely
  const getUserId = (user) => {
    return user?.id || user?._id || null;
  };

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            {error}
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
                  <div className="d-flex gap-2 flex-wrap">
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
                    <h2 className="fw-bold mb-0">{stats.total > 0 ? ((stats.verified / stats.total) * 100).toFixed(1) : 0}%</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaUserCheck size={24} color="#f59e0b" />
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">{stats.verified} verified • {stats.unverified} unverified</small>
                  <ProgressBar 
                    now={stats.total > 0 ? (stats.verified / stats.total) * 100 : 0} 
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
            {!Array.isArray(currentUsers) || currentUsers.length === 0 ? (
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
                        <th style={{ padding: '16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map(user => {
                        if (!user) return null;
                        const userId = getUserId(user);
                        const roleBadge = getRoleBadge(user.role);
                        const statusBadge = getStatusBadge(user.status);
                        const userJoined = user.joined || user.created_at || user.createdAt;
                        const userName = user.name || user.fullName || user.username || 'Unknown';
                        const userEmail = user.email || '';
                        const userPhone = user.phone || user.phoneNumber || '';
                        const userLocation = user.location || user.address || '';
                        
                        return (
                          <tr key={userId} className={selectedUsers.includes(userId) ? 'table-active' : ''}>
                            <td style={{ padding: '16px' }}>
                              <Form.Check 
                                type="checkbox" 
                                checked={selectedUsers.includes(userId)} 
                                onChange={() => handleSelectUser(userId)} 
                              />
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex align-items-center gap-3">
                                <Image 
                                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=667eea&color=fff&size=60`} 
                                  alt={userName} 
                                  roundedCircle 
                                  width={45} 
                                  height={45} 
                                  style={{ objectFit: 'cover' }}
                                />
                                <div>
                                  <div className="fw-semibold">{userName}</div>
                                  <div className="small text-muted">{userEmail}</div>
                                  {!user.verified && user.role?.toLowerCase() !== 'admin' && (
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
                              <div className="small">{userJoined ? format(new Date(userJoined), 'MMM dd, yyyy') : 'N/A'}</div>
                              <div className="small text-muted">{userJoined ? formatDistanceToNow(new Date(userJoined), { addSuffix: true }) : 'N/A'}</div>
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
                                {userPhone && (
                                  <Button variant="link" className="p-0 text-success">
                                    <FaPhone />
                                  </Button>
                                )}
                                {userLocation && (
                                  <Button variant="link" className="p-0 text-info">
                                    <FaMapMarkerAlt />
                                  </Button>
                                )}
                              </div>
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
                                {!user.verified && user.role?.toLowerCase() !== 'admin' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-success" 
                                    onClick={() => handleVerifyUser(user)}
                                  >
                                    <FaUserCheck size={14} />
                                  </Button>
                                )}
                                {user.status?.toLowerCase() !== 'suspended' && user.role?.toLowerCase() !== 'admin' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-warning" 
                                    onClick={() => handleSuspendUser(user)}
                                  >
                                    <FaBan size={14} />
                                  </Button>
                                )}
                                {user.status?.toLowerCase() === 'suspended' && (
                                  <Button 
                                    variant="link" 
                                    className="p-1 text-success" 
                                    onClick={() => handleActivateUser(user)}
                                  >
                                    <FaUnlockAlt size={14} />
                                  </Button>
                                )}
                                {user.role?.toLowerCase() !== 'admin' && (
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
                {Array.isArray(filteredUsers) && filteredUsers.length > 0 && (
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

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered size="lg">
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
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    <option value="provider">Provider</option>
                    <option value="admin">Admin</option>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Location</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </Form.Group>
              </Col>
              {!isEditing && (
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password (leave blank for auto-generated)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <Form.Text className="text-muted">
                      If left blank, a default password will be generated
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveUser} disabled={processing}>
            {processing ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
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
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>?
            <p className="mb-0 mt-2 small text-danger">This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={processing}>
            {processing ? 'Deleting...' : 'Delete'}
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
            <p className="mb-0 mt-2 small text-warning">The user will not be able to access the platform.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowSuspendModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={confirmSuspend} disabled={processing}>
            {processing ? 'Suspending...' : 'Suspend'}
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
            <p className="mb-0 mt-2 small text-success">The user will be marked as verified.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmVerify} disabled={processing}>
            {processing ? 'Verifying...' : 'Verify'}
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
            <Button variant="success" onClick={() => handleBulkAction('verify')} disabled={processing}>
              <FaUserCheck className="me-2" /> Verify Selected
            </Button>
            <Button variant="warning" onClick={() => handleBulkAction('suspend')} disabled={processing}>
              <FaBan className="me-2" /> Suspend Selected
            </Button>
            <Button variant="info" onClick={() => handleBulkAction('activate')} disabled={processing}>
              <FaUnlockAlt className="me-2" /> Activate Selected
            </Button>
            <Button variant="danger" onClick={() => handleBulkAction('delete')} disabled={processing}>
              <FaTrash className="me-2" /> Delete Selected
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaUserCircle className="me-2" /> User Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedUser && (
            <Row className="g-4">
              <Col md={4} className="text-center">
                <Image 
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=667eea&color=fff&size=150`} 
                  roundedCircle 
                  width={120} 
                  height={120} 
                  style={{ objectFit: 'cover' }}
                />
                <h5 className="mt-3 mb-1">{selectedUser.name}</h5>
                <div>{getRoleBadge(selectedUser.role)}</div>
                <div className="mt-2">{getStatusBadge(selectedUser.status)}</div>
              </Col>
              <Col md={8}>
                <h6 className="fw-bold mb-3">Profile Information</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Email</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Phone</span>
                    <span>{selectedUser.phone || 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Location</span>
                    <span>{selectedUser.location || 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Joined</span>
                    <span>{selectedUser.joined || selectedUser.created_at ? format(new Date(selectedUser.joined || selectedUser.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Last Active</span>
                    <span>{selectedUser.lastActive || selectedUser.last_active ? formatDistanceToNow(new Date(selectedUser.lastActive || selectedUser.last_active), { addSuffix: true }) : 'N/A'}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Verified</span>
                    <span>{selectedUser.verified ? <Badge bg="success">Yes</Badge> : <Badge bg="warning">No</Badge>}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted">Bio</span>
                    <span>{selectedUser.bio || 'N/A'}</span>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedUser && (
            <Button variant="primary" onClick={() => { setShowDetailsModal(false); handleEditUser(selectedUser); }}>
              <FaEdit className="me-2" /> Edit User
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Email Modal */}
      <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaEnvelope className="me-2" /> Send Email
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Subject</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                placeholder="Enter your message here..."
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              />
            </Form.Group>
            <Alert variant="info" className="mb-0" style={{ borderRadius: '12px' }}>
              <FaInfoCircle className="me-2" />
              {selectedUsers.length > 0 
                ? `Email will be sent to ${selectedUsers.length} selected users.` 
                : selectedUser 
                  ? `Email will be sent to ${selectedUser.email}` 
                  : 'No recipient selected.'}
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowEmailModal(false)}>
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
        .nav-tabs .nav-link {
          color: #4b5563;
          border: none;
          padding: 0.5rem 1rem;
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
      `}</style>
    </div>
  );
};

export default UserManagement;