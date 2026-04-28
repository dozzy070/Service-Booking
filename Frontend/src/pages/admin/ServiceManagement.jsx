// src/pages/admin/ServiceManagement.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Alert,
  Pagination,
  ProgressBar,
  Nav,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaStar,
  FaUserTie,
  FaTag,
  FaDollarSign,
  FaCalendarAlt,
  FaImage,
  FaUpload,
  FaDownload,
  FaPrint,
  FaShare,
  FaEllipsisV,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaServicestack,
  FaUsers,
  FaChartLine,
  FaSlidersH,
  FaThumbsUp,
  FaBan,
  FaUndo,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaLink,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp,
  FaTelegram,
  FaDiscord,
  FaSlack,
  FaGithub,
  FaMedium,
  FaSpotify,
  FaSoundcloud,
  FaPinterest,
  FaReddit,
  FaGoogle,
  FaApple,
  FaMicrosoft,
  FaAmazon,
  FaPaypal,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcDiscover,
  FaApplePay,
  FaGooglePay,
  FaBitcoin,
  FaWallet,
  FaCreditCard,
  FaMoneyBillWave,
  FaPercentage,
  FaAward,
  FaTrophy,
  FaMedal,
  FaCrown,
  FaGem,
  FaGift,
  FaShoppingCart,
  FaShoppingBag,
  FaBarcode,
  FaQrcode,
  FaTicketAlt,
  FaBalanceScale,
  FaRuler,
  FaRulerCombined,
  FaCompass,
  FaBinoculars,
  FaCrosshairs,
  FaBullseye,
  FaMicrophone,
  FaHeadphones,
  FaMusic,
  FaPlay,
  FaPause,
  FaStop,
  FaStepForward,
  FaStepBackward,
  FaFastForward,
  FaFastBackward,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeOff,
  FaVideo,
  FaFilm,
  FaCamera,
  FaCameraRetro,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileCode,
  FaFileAlt,
  FaFolder,
  FaFolderOpen,
  FaFolderPlus,
  FaFolderMinus,
  FaCloud,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaSnowflake,
  FaWind,
  FaSun,
  FaMoon,
  FaHeart,
  FaHeartBroken,
  FaHeartbeat,
  FaUser,
  FaUserCircle,
  FaUserGraduate,
  FaUserAstronaut,
  FaUserNinja,
  FaUserSecret,
  FaUserShield,
  FaUserLock,
  FaUserTag,
  FaUserCog,
  FaUserEdit,
  FaUserMinus,
  FaUserPlus,
  FaUserClock,
  FaUserCheck,
  FaUserTimes,
  FaRedo,
  FaSpinner,
  FaInfoCircle
} from 'react-icons/fa';

const ServiceManagement = () => {
  // UI State
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });

  // Data State
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, rejected: 0, featured: 0,
    categories: 0, providers: 0, averagePrice: 0,
    totalBookings: 0, totalRevenue: 0
  });

  // Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // view, edit, add
  const [selectedServices, setSelectedServices] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', providerId: '',
    price: '', duration: '', location: '', images: [], features: [],
    requirements: [], tags: [], status: 'pending', featured: false,
    discount: 0, available: true, maxBookings: 10, cancellationPolicy: 'flexible'
  });

  // Auto-refresh interval
  const refreshIntervalRef = useRef(null);

  // Helper: Toast
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // API Calls
  const fetchServices = async () => {
    try {
      const response = await api.get('/admin/services', {
        params: {
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          minPrice: priceRange.min || undefined,
          maxPrice: priceRange.max || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          providerId: filterProvider !== 'all' ? filterProvider : undefined,
          search: searchTerm || undefined,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction
        }
      });
      setServices(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      showToast('Failed to load services', 'danger');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/admin/providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const calculateStats = (serviceList) => {
    const newStats = {
      total: serviceList.length,
      pending: serviceList.filter(s => s.status === 'pending').length,
      approved: serviceList.filter(s => s.status === 'approved').length,
      rejected: serviceList.filter(s => s.status === 'rejected').length,
      featured: serviceList.filter(s => s.featured).length,
      categories: new Set(serviceList.map(s => s.category)).size,
      providers: new Set(serviceList.map(s => s.providerId)).size,
      averagePrice: serviceList.length ? Math.round(serviceList.reduce((sum, s) => sum + (s.price || 0), 0) / serviceList.length) : 0,
      totalBookings: serviceList.reduce((sum, s) => sum + (s.bookings || 0), 0),
      totalRevenue: serviceList.reduce((sum, s) => sum + (s.revenue || 0), 0)
    };
    setStats(newStats);
  };

  const fetchAllData = async () => {
    await Promise.all([fetchServices(), fetchCategories(), fetchProviders()]);
  };

  const handleRefresh = () => {
    fetchAllData();
    showToast('Data refreshed', 'info');
  };

  // Auto-refresh every 30 seconds (silent)
  useEffect(() => {
    fetchAllData();
    refreshIntervalRef.current = setInterval(fetchAllData, 30000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchServices();
  }, [searchTerm, filterCategory, filterStatus, filterProvider, dateRange, priceRange, sortConfig, activeTab]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, filterProvider, dateRange, priceRange, activeTab]);

  // Service actions
  const handleStatusChange = async (serviceId, newStatus, reason = '') => {
    try {
      await api.put(`/admin/services/${serviceId}/status`, { status: newStatus, rejectionReason: reason });
      await fetchServices();
      showToast(`Service ${newStatus}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'danger');
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    try {
      await api.delete(`/admin/services/${selectedService.id}`);
      await fetchServices();
      setShowDeleteModal(false);
      setSelectedService(null);
      showToast('Service deleted', 'success');
    } catch (error) {
      showToast('Failed to delete service', 'danger');
    }
  };

  const handleFeaturedToggle = async (serviceId) => {
    try {
      const service = services.find(s => s.id === serviceId);
      await api.put(`/admin/services/${serviceId}/featured`, { featured: !service.featured });
      await fetchServices();
      showToast(`Service ${service.featured ? 'removed from' : 'added to'} featured`, 'success');
    } catch (error) {
      showToast('Failed to update featured status', 'danger');
    }
  };

  const handleSaveService = async () => {
    try {
      if (modalMode === 'add') {
        await api.post('/admin/services', formData);
        showToast('Service added', 'success');
      } else if (modalMode === 'edit' && selectedService) {
        await api.put(`/admin/services/${selectedService.id}`, formData);
        showToast('Service updated', 'success');
      }
      await fetchServices();
      setShowServiceModal(false);
      setSelectedService(null);
    } catch (error) {
      showToast(`Failed to ${modalMode === 'add' ? 'add' : 'update'} service`, 'danger');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      await api.post('/admin/services/bulk', { serviceIds: selectedServices, action: newStatus });
      await fetchServices();
      setSelectedServices([]);
      setShowBulkActions(false);
      showToast(`${selectedServices.length} services updated to ${newStatus}`, 'success');
    } catch (error) {
      showToast('Bulk update failed', 'danger');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.post('/admin/services/bulk-delete', { serviceIds: selectedServices });
      await fetchServices();
      setSelectedServices([]);
      setShowBulkActions(false);
      showToast(`${selectedServices.length} services deleted`, 'success');
    } catch (error) {
      showToast('Bulk delete failed', 'danger');
    }
  };

  const handleExportServices = () => {
    const dataStr = JSON.stringify(services, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Services exported', 'success');
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map(s => s.id));
    }
  };

  const handleSelectService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Filtering (client-side for tab)
  const filteredServices = useMemo(() => {
    let filtered = [...services];
    if (activeTab === 'pending') filtered = filtered.filter(s => s.status === 'pending');
    if (activeTab === 'approved') filtered = filtered.filter(s => s.status === 'approved');
    if (activeTab === 'rejected') filtered = filtered.filter(s => s.status === 'rejected');
    if (activeTab === 'featured') filtered = filtered.filter(s => s.featured);
    return filtered;
  }, [services, activeTab]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Helper: get status badge
  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'success', icon: <FaCheckCircle />, label: 'Approved' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      rejected: { bg: 'danger', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const b = badges[status] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-flex align-items-center gap-1 py-2 px-3 rounded-pill">
        {b.icon} <span>{b.label}</span>
      </Badge>
    );
  };

  return (
    <Container fluid className="service-management py-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toastMessage.show} onClose={() => setToastMessage({ show: false, message: '', type: '' })} delay={3000} autohide bg={toastMessage.type}>
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{toastMessage.type === 'success' ? 'Success' : toastMessage.type === 'danger' ? 'Error' : 'Info'}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-2">Service Management</h2>
          <p className="text-muted mb-0">Manage and monitor all services on the platform</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-primary" onClick={handleRefresh}>
            <FaRedo className="me-2" /> Refresh
          </Button>
          <Button variant="outline-primary" onClick={handleExportServices}>
            <FaDownload className="me-2" /> Export
          </Button>
          <Button variant="primary" onClick={() => { setModalMode('add'); setShowServiceModal(true); }}>
            <FaPlus className="me-2" /> Add Service
          </Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm"><Card.Body className="d-flex align-items-center"><div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3"><FaServicestack className="text-primary" size={20} /></div><div><h5 className="mb-1">{stats.total}</h5><small className="text-muted">Total Services</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm"><Card.Body className="d-flex align-items-center"><div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3"><FaClock className="text-warning" size={20} /></div><div><h5 className="mb-1">{stats.pending}</h5><small className="text-muted">Pending</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm"><Card.Body className="d-flex align-items-center"><div className="bg-success bg-opacity-10 rounded-circle p-3 me-3"><FaCheckCircle className="text-success" size={20} /></div><div><h5 className="mb-1">{stats.approved}</h5><small className="text-muted">Approved</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm"><Card.Body className="d-flex align-items-center"><div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3"><FaTimesCircle className="text-danger" size={20} /></div><div><h5 className="mb-1">{stats.rejected}</h5><small className="text-muted">Rejected</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm"><Card.Body className="d-flex align-items-center"><div className="bg-info bg-opacity-10 rounded-circle p-3 me-3"><FaStar className="text-info" size={20} /></div><div><h5 className="mb-1">{stats.featured}</h5><small className="text-muted">Featured</small></div></Card.Body></Card></Col>
        <Col xl={2} lg={4} md={6}><Card className="border-0 shadow-sm"><Card.Body className="d-flex align-items-center"><div className="bg-secondary bg-opacity-10 rounded-circle p-3 me-3"><FaDollarSign className="text-secondary" size={20} /></div><div><h5 className="mb-1">${stats.averagePrice}</h5><small className="text-muted">Avg Price</small></div></Card.Body></Card></Col>
      </Row>

      {/* Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-0">
          <Nav variant="tabs" className="px-3 pt-3">
            <Nav.Item><Nav.Link active={activeTab === 'all'} onClick={() => setActiveTab('all')}><FaServicestack className="me-2" /> All Services</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}><FaClock className="me-2 text-warning" /> Pending {stats.pending > 0 && <Badge bg="warning" pill className="ms-2">{stats.pending}</Badge>}</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}><FaCheckCircle className="me-2 text-success" /> Approved</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'rejected'} onClick={() => setActiveTab('rejected')}><FaTimesCircle className="me-2 text-danger" /> Rejected</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link active={activeTab === 'featured'} onClick={() => setActiveTab('featured')}><FaStar className="me-2 text-warning" /> Featured</Nav.Link></Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <div className="d-flex flex-wrap gap-3 flex-grow-1">
              <InputGroup style={{ maxWidth: '300px' }}><InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text><Form.Control placeholder="Search services..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" /></InputGroup>
              <Form.Select style={{ width: '150px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="all">All Categories</option>{categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</Form.Select>
              <Form.Select style={{ width: '180px' }} value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)}><option value="all">All Providers</option>{providers.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}</Form.Select>
              <Form.Select style={{ width: '150px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Form.Select>
              <Form.Select style={{ width: '100px' }} value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></Form.Select>
            </div>
            {selectedServices.length > 0 && (<div className="d-flex gap-2"><Button variant="success" size="sm" onClick={() => handleBulkStatusChange('approved')}><FaCheckCircle className="me-2" /> Approve ({selectedServices.length})</Button><Button variant="warning" size="sm" onClick={() => setShowBulkActions(true)}><FaClock className="me-2" /> More Actions</Button></div>)}
            <Button variant="outline-secondary" onClick={() => setShowFilters(!showFilters)}><FaSlidersH className="me-2" /> {showFilters ? 'Hide Filters' : 'More Filters'}</Button>
          </div>
          {showFilters && (
            <Row className="mt-3 pt-3 border-top">
              <Col md={3}><Form.Group><Form.Label>Date Range</Form.Label><div className="d-flex gap-2"><Form.Control type="date" placeholder="Start" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} /><Form.Control type="date" placeholder="End" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} /></div></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label>Price Range ($)</Form.Label><div className="d-flex gap-2"><Form.Control type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} /><Form.Control type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} /></div></Form.Group></Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Services Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="services-table mb-0">
              <thead className="bg-light">
                <tr><th style={{ width: '40px' }}><Form.Check type="checkbox" checked={selectedServices.length === filteredServices.length && filteredServices.length > 0} onChange={handleSelectAll} /></th>
                  <th onClick={() => handleSort('title')}>Service {getSortIcon('title')}</th>
                  <th onClick={() => handleSort('category')}>Category {getSortIcon('category')}</th>
                  <th onClick={() => handleSort('providerName')}>Provider {getSortIcon('providerName')}</th>
                  <th onClick={() => handleSort('price')}>Price {getSortIcon('price')}</th>
                  <th>Status</th>
                  <th onClick={() => handleSort('bookings')}>Bookings {getSortIcon('bookings')}</th>
                  <th>Rating</th>
                  <th onClick={() => handleSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(service => (
                  <tr key={service.id} className={selectedServices.includes(service.id) ? 'table-active' : ''}>
                    <td><Form.Check type="checkbox" checked={selectedServices.includes(service.id)} onChange={() => handleSelectService(service.id)} /></td>
                    <td><div className="d-flex align-items-center gap-3"><img src={service.images?.[0] || 'https://via.placeholder.com/40'} alt={service.title} className="rounded" style={{ width: 50, height: 50, objectFit: 'cover' }} /><div><div className="fw-semibold">{service.title}</div><small className="text-muted">{service.description?.substring(0, 50)}...</small></div></div></td>
                    <td><Badge bg="secondary" className="px-3 py-2 rounded-pill"><FaTag className="me-1" size={10} /> {service.category}</Badge></td>
                    <td><div className="d-flex align-items-center gap-2"><img src={service.providerAvatar || `https://ui-avatars.com/api/?name=${service.providerName}&background=6366f1&color=fff&size=30`} alt={service.providerName} className="rounded-circle" style={{ width: 30, height: 30 }} /><div><div>{service.providerName}</div><small className="text-warning"><FaStar className="me-1" size={10} /> {service.providerRating}</small></div></div></td>
                    <td><div className="fw-bold text-primary">${service.price}{service.discount > 0 && <Badge bg="danger" className="ms-2">-{service.discount}%</Badge>}</div></td>
                    <td>{getStatusBadge(service.status)}</td>
                    <td className="text-center"><div className="fw-semibold">{service.bookings || 0}</div><small className="text-muted">${service.revenue || 0}</small></td>
                    <td>{service.rating > 0 ? <span className="text-warning"><FaStar className="me-1" />{service.rating} ({service.reviews})</span> : <span className="text-muted">No ratings</span>}</td>
                    <td><small><FaCalendarAlt className="me-1 text-muted" size={10} /> {new Date(service.createdAt).toLocaleDateString()}</small></td>
                    <td><div className="d-flex gap-2"><Button size="sm" variant="outline-primary" onClick={() => { setSelectedService(service); setModalMode('view'); setShowServiceModal(true); }}><FaEye /></Button><Button size="sm" variant="outline-info" onClick={() => { setSelectedService(service); setModalMode('edit'); setFormData({ ...service }); setShowServiceModal(true); }}><FaEdit /></Button>{service.status === 'pending' && (<><Button size="sm" variant="outline-success" onClick={() => { setSelectedService(service); setShowApproveModal(true); }}><FaCheckCircle /></Button><Button size="sm" variant="outline-danger" onClick={() => { setSelectedService(service); setShowRejectModal(true); }}><FaTimesCircle /></Button></>)}<Dropdown><Dropdown.Toggle size="sm" variant="outline-secondary"><FaEllipsisV /></Dropdown.Toggle><Dropdown.Menu><Dropdown.Item onClick={() => handleFeaturedToggle(service.id)}>{service.featured ? <FaStar className="me-2 text-warning" /> : <FaStar className="me-2 text-muted" />}{service.featured ? 'Remove Featured' : 'Mark Featured'}</Dropdown.Item><Dropdown.Item onClick={() => { setSelectedService(service); setShowImageModal(true); }}><FaImage className="me-2" /> Manage Images</Dropdown.Item><Dropdown.Divider /><Dropdown.Item onClick={() => { setSelectedService(service); setShowDeleteModal(true); }}><FaTrash className="me-2 text-danger" /> Delete</Dropdown.Item></Dropdown.Menu></Dropdown></div></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {filteredServices.length === 0 && (<div className="text-center py-5"><FaServicestack size={48} className="text-muted mb-3" /><h5>No services found</h5><Button variant="primary" onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterStatus('all'); setFilterProvider('all'); setDateRange({ start: '', end: '' }); setPriceRange({ min: '', max: '' }); setActiveTab('all'); }}>Clear Filters</Button></div>)}
          {filteredServices.length > 0 && (<div className="d-flex justify-content-between align-items-center p-3 border-top"><div>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredServices.length)} of {filteredServices.length} services</div><Pagination><Pagination.Prev onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} />{[...Array(Math.min(5, totalPages)).keys()].map(num => { let pageNum; if(totalPages<=5) pageNum=num+1; else if(currentPage<=3) pageNum=num+1; else if(currentPage>=totalPages-2) pageNum=totalPages-4+num; else pageNum=currentPage-2+num; return <Pagination.Item key={pageNum} active={pageNum===currentPage} onClick={()=>setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;})}<Pagination.Next onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))} disabled={currentPage===totalPages} /></Pagination></div>)}
        </Card.Body>
      </Card>

      {/* Modals (simplified) */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} size="xl" centered>
        <Modal.Header closeButton><Modal.Title>{modalMode === 'view' ? 'Service Details' : modalMode === 'edit' ? 'Edit Service' : 'Add New Service'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {modalMode === 'view' && selectedService && (
            <div><Row><Col lg={8}><h4>{selectedService.title}</h4><div className="d-flex gap-2 mb-3">{getStatusBadge(selectedService.status)}{selectedService.featured && <Badge bg="warning"><FaStar /> Featured</Badge>}</div><p>{selectedService.description}</p><Row><Col md={4}><Card className="border-0 bg-light text-center"><Card.Body><FaDollarSign className="text-primary mb-2" size={24} /><h6>Price</h6><h5 className="text-primary">${selectedService.price}</h5></Card.Body></Card></Col><Col md={4}><Card className="border-0 bg-light text-center"><Card.Body><FaClock className="text-success mb-2" size={24} /><h6>Duration</h6><h5>{selectedService.duration} hours</h5></Card.Body></Card></Col><Col md={4}><Card className="border-0 bg-light text-center"><Card.Body><FaMapMarkerAlt className="text-danger mb-2" size={24} /><h6>Location</h6><h5>{selectedService.location}</h5></Card.Body></Card></Col></Row></Col><Col lg={4}><Card className="border-0 bg-light"><Card.Body><h6>Provider</h6><div className="d-flex gap-2"><img src={`https://ui-avatars.com/api/?name=${selectedService.providerName}&background=6366f1&color=fff&size=50`} className="rounded-circle" style={{ width: 50, height: 50 }} alt="" /><div><h6>{selectedService.providerName}</h6><div className="text-warning"><FaStar /> {selectedService.providerRating}</div></div></div></Card.Body></Card></Col></Row></div>
          )}
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Form><Row><Col md={8}><Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></Form.Group></Col><Col md={4}><Form.Group><Form.Label>Price</Form.Label><Form.Control type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></Form.Group></Col></Row><Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Form.Group><Row><Col md={4}><Form.Group><Form.Label>Category</Form.Label><Form.Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</Form.Select></Form.Group></Col><Col md={4}><Form.Group><Form.Label>Provider</Form.Label><Form.Select value={formData.providerId} onChange={(e) => setFormData({ ...formData, providerId: parseInt(e.target.value) })}><option value="">Select</option>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group></Col><Col md={4}><Form.Group><Form.Label>Duration (hours)</Form.Label><Form.Control type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} /></Form.Group></Col></Row></Form>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowServiceModal(false)}>Close</Button>{(modalMode === 'edit' || modalMode === 'add') && <Button variant="primary" onClick={handleSaveService}>Save</Button>}</Modal.Footer>
      </Modal>

      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered><Modal.Header closeButton className="bg-success text-white"><Modal.Title><FaCheckCircle /> Approve Service</Modal.Title></Modal.Header><Modal.Body><p>Approve <strong>{selectedService?.title}</strong>?</p></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button><Button variant="success" onClick={() => { handleStatusChange(selectedService.id, 'approved'); setShowApproveModal(false); }}>Approve</Button></Modal.Footer></Modal>

      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered><Modal.Header closeButton className="bg-danger text-white"><Modal.Title><FaTimesCircle /> Reject Service</Modal.Title></Modal.Header><Modal.Body><p>Reject <strong>{selectedService?.title}</strong>?</p><Form.Group><Form.Label>Reason</Form.Label><Form.Control as="textarea" rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide reason..." /></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button><Button variant="danger" onClick={() => { handleStatusChange(selectedService.id, 'rejected', rejectionReason); setShowRejectModal(false); setRejectionReason(''); }} disabled={!rejectionReason}>Reject</Button></Modal.Footer></Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered><Modal.Header closeButton className="bg-danger text-white"><Modal.Title>Confirm Delete</Modal.Title></Modal.Header><Modal.Body><p>Delete <strong>{selectedService?.title}</strong>? This cannot be undone.</p></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDeleteService}>Delete</Button></Modal.Footer></Modal>

      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered><Modal.Header closeButton><Modal.Title><FaImage /> Manage Images</Modal.Title></Modal.Header><Modal.Body><Row className="g-3">{selectedService?.images?.map((img, i) => (<Col xs={4} key={i}><img src={img} className="img-fluid rounded" style={{ height: '150px', width: '100%', objectFit: 'cover' }} /></Col>))}<Col xs={4}><div className="border border-2 border-dashed rounded d-flex align-items-center justify-content-center" style={{ height: '150px', cursor: 'pointer' }}><div className="text-center"><FaUpload className="text-muted mb-2" size={24} /><small>Upload</small></div></div></Col></Row></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowImageModal(false)}>Close</Button><Button variant="primary">Save</Button></Modal.Footer></Modal>

      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered><Modal.Header closeButton><Modal.Title>Bulk Actions</Modal.Title></Modal.Header><Modal.Body><div className="d-grid gap-2"><Button variant="success" onClick={() => handleBulkStatusChange('approved')}><FaCheckCircle /> Approve All</Button><Button variant="warning" onClick={() => handleBulkStatusChange('pending')}><FaClock /> Set to Pending</Button><Button variant="danger" onClick={() => handleBulkStatusChange('rejected')}><FaTimesCircle /> Reject All</Button><Button variant="outline-danger" onClick={handleBulkDelete}><FaTrash /> Delete All</Button></div></Modal.Body></Modal>

      <style jsx="true">{`
        .service-management { max-width: 1600px; margin: 0 auto; }
        .stats-card { transition: all 0.2s; border-radius: 12px; }
        .stats-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
        .services-table th { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; padding: 1rem 0.75rem; }
        .services-table td { padding: 1rem 0.75rem; vertical-align: middle; }
        .nav-tabs .nav-link { color: #4b5563; border: none; padding: 0.75rem 1.5rem; }
        .nav-tabs .nav-link.active { color: #6366f1; font-weight: 600; border-bottom: 2px solid #6366f1; background: none; }
        .border-dashed { border-style: dashed !important; }
        @media (max-width: 768px) { .services-table td { min-width: 120px; } }
      `}</style>
    </Container>
  );
};

export default ServiceManagement;