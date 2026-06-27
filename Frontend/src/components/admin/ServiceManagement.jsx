// src/pages/admin/ServiceManagement.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Alert,
  Pagination,
  ProgressBar,
  Nav,
  Toast,
  ToastContainer,
  Spinner,
  Image,
  OverlayTrigger,
  Tooltip,
  Tabs,
  Tab
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
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaSave
} from 'react-icons/fa';
import { getServiceImage, handleServiceImageError } from '../../utils/imageUtils';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  const [modalMode, setModalMode] = useState('view');
  const [selectedServices, setSelectedServices] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', providerId: '',
    price: '', duration: '', location: '', images: [], features: [],
    requirements: [], tags: [], status: 'pending', featured: false,
    discount: 0, available: true, maxBookings: 10, cancellationPolicy: 'flexible'
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

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // ✅ Fetch services with proper data extraction
  const fetchServices = useCallback(async () => {
    try {
      const params = {
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
      };
      const response = await adminAPI.getServices(params);
      // ✅ Extract services array safely
      const serviceList = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response.data?.services) ? response.data.services : [];
      setServices(serviceList);
      calculateStats(serviceList);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, priceRange, filterCategory, filterStatus, filterProvider, searchTerm, sortConfig]);

  // ✅ Fetch categories with proper data extraction
  const fetchCategories = useCallback(async () => {
    try {
      const response = await adminAPI.getCategories();
      const categoryList = Array.isArray(response.data) ? response.data : 
                           Array.isArray(response.data?.categories) ? response.data.categories : [];
      setCategories(categoryList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  // ✅ Fetch providers with proper data extraction
  const fetchProviders = useCallback(async () => {
    try {
      const response = await adminAPI.getProviders();
      const providerList = Array.isArray(response.data) ? response.data : 
                           Array.isArray(response.data?.providers) ? response.data.providers : [];
      setProviders(providerList);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
    }
  }, []);

  // ✅ Calculate stats with safety checks
  const calculateStats = (serviceList) => {
    const list = Array.isArray(serviceList) ? serviceList : [];
    const newStats = {
      total: list.length,
      pending: list.filter(s => s?.status === 'pending').length,
      approved: list.filter(s => s?.status === 'approved').length,
      rejected: list.filter(s => s?.status === 'rejected').length,
      featured: list.filter(s => s?.featured).length,
      categories: new Set(list.map(s => s?.category).filter(Boolean)).size,
      providers: new Set(list.map(s => s?.providerId).filter(Boolean)).size,
      averagePrice: list.length ? Math.round(list.reduce((sum, s) => sum + (s?.price || 0), 0) / list.length) : 0,
      totalBookings: list.reduce((sum, s) => sum + (s?.bookings || 0), 0),
      totalRevenue: list.reduce((sum, s) => sum + (s?.revenue || 0), 0)
    };
    setStats(newStats);
  };

  // ✅ Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchServices(), fetchCategories(), fetchProviders()]);
    setLoading(false);
  }, [fetchServices, fetchCategories, fetchProviders]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch when filters change
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, filterProvider, dateRange, priceRange, activeTab]);

  // ✅ Service actions with adminAPI
  const handleStatusChange = async (serviceId, newStatus, reason = '') => {
    setProcessing(true);
    try {
      await adminAPI.updateServiceStatus(serviceId, { status: newStatus, rejectionReason: reason });
      await fetchServices();
      toast.success(`Service ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    setProcessing(true);
    try {
      await adminAPI.deleteService(selectedService.id);
      await fetchServices();
      setShowDeleteModal(false);
      setSelectedService(null);
      toast.success('Service deleted');
    } catch (error) {
      toast.error('Failed to delete service');
    } finally {
      setProcessing(false);
    }
  };

  const handleFeaturedToggle = async (serviceId) => {
    try {
      const service = services.find(s => s.id === serviceId);
      await adminAPI.toggleFeatured(serviceId, { featured: !service?.featured });
      await fetchServices();
      toast.success(`Service ${service?.featured ? 'removed from' : 'added to'} featured`);
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleSaveService = async () => {
    setProcessing(true);
    try {
      if (modalMode === 'add') {
        await adminAPI.createService(formData);
        toast.success('Service added');
      } else if (modalMode === 'edit' && selectedService) {
        await adminAPI.updateService(selectedService.id, formData);
        toast.success('Service updated');
      }
      await fetchServices();
      setShowServiceModal(false);
      setSelectedService(null);
    } catch (error) {
      toast.error(`Failed to ${modalMode === 'add' ? 'add' : 'update'} service`);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedServices.length === 0) return;
    setProcessing(true);
    try {
      await adminAPI.bulkServiceAction({ serviceIds: selectedServices, action: newStatus });
      await fetchServices();
      setSelectedServices([]);
      setShowBulkActions(false);
      toast.success(`${selectedServices.length} services updated to ${newStatus}`);
    } catch (error) {
      toast.error('Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) return;
    setProcessing(true);
    try {
      await adminAPI.bulkServiceDelete({ serviceIds: selectedServices });
      await fetchServices();
      setSelectedServices([]);
      setShowBulkActions(false);
      toast.success(`${selectedServices.length} services deleted`);
    } catch (error) {
      toast.error('Bulk delete failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportServices = () => {
    const dataStr = JSON.stringify(services, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Services exported');
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map(s => s.id).filter(Boolean));
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

  // ✅ Filtering with safety
  const filteredServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    let filtered = [...list];
    if (activeTab === 'pending') filtered = filtered.filter(s => s?.status === 'pending');
    if (activeTab === 'approved') filtered = filtered.filter(s => s?.status === 'approved');
    if (activeTab === 'rejected') filtered = filtered.filter(s => s?.status === 'rejected');
    if (activeTab === 'featured') filtered = filtered.filter(s => s?.featured);
    return filtered;
  }, [services, activeTab]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'success', icon: <FaCheckCircle />, label: 'Approved' },
      pending: { bg: 'warning', icon: <FaClock />, label: 'Pending' },
      rejected: { bg: 'danger', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const b = badges[status] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading services...</p>
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
            <h2 className="mb-1 fw-bold">Service Management</h2>
            <p className="text-muted mb-0">Manage and monitor all services on the platform</p>
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
            <Button variant="outline-primary" onClick={handleExportServices} className="d-flex align-items-center gap-2">
              <FaDownload /> Export
            </Button>
            <Button variant="primary" onClick={() => { setModalMode('add'); setShowServiceModal(true); }} className="d-flex align-items-center gap-2">
              <FaPlus /> Add Service
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col xl={2} lg={4} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <FaServicestack size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Services</p>
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
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <FaClock size={24} color="#f59e0b" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Pending</p>
                    <h3 className="fw-bold mb-0">{stats.pending}</h3>
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
                    <FaCheckCircle size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Approved</p>
                    <h3 className="fw-bold mb-0">{stats.approved}</h3>
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
                    <FaTimesCircle size={24} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Rejected</p>
                    <h3 className="fw-bold mb-0">{stats.rejected}</h3>
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
                    <FaStar size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Featured</p>
                    <h3 className="fw-bold mb-0">{stats.featured}</h3>
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
                    <FaMoneyBillWave size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Avg Price</p>
                    <h3 className="fw-bold mb-0">{formatCompactNaira(stats.averagePrice)}</h3>
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
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'all'} 
                  onClick={() => setActiveTab('all')}
                  className="fw-semibold"
                >
                  <FaServicestack className="me-2" /> All Services
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'pending'} 
                  onClick={() => setActiveTab('pending')}
                  className="fw-semibold"
                >
                  <FaClock className="me-2 text-warning" /> Pending
                  {stats.pending > 0 && (
                    <Badge bg="warning" pill className="ms-2">{stats.pending}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'approved'} 
                  onClick={() => setActiveTab('approved')}
                  className="fw-semibold"
                >
                  <FaCheckCircle className="me-2 text-success" /> Approved
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'rejected'} 
                  onClick={() => setActiveTab('rejected')}
                  className="fw-semibold"
                >
                  <FaTimesCircle className="me-2 text-danger" /> Rejected
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'featured'} 
                  onClick={() => setActiveTab('featured')}
                  className="fw-semibold"
                >
                  <FaStar className="me-2 text-warning" /> Featured
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
              <div className="d-flex flex-wrap gap-3 flex-grow-1">
                <InputGroup style={{ maxWidth: '300px' }}>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control 
                    placeholder="Search services..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="border-start-0"
                  />
                </InputGroup>
                <Form.Select 
                  style={{ width: '150px' }} 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={{ width: '180px' }} 
                  value={filterProvider} 
                  onChange={(e) => setFilterProvider(e.target.value)}
                >
                  <option value="all">All Providers</option>
                  {providers.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={{ width: '150px' }} 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
                <Form.Select 
                  style={{ width: '100px' }} 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Form.Select>
              </div>
              {selectedServices.length > 0 && (
                <div className="d-flex gap-2">
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => handleBulkStatusChange('approved')}
                    className="d-flex align-items-center gap-1"
                  >
                    <FaCheckCircle /> Approve ({selectedServices.length})
                  </Button>
                  <Button 
                    variant="warning" 
                    size="sm" 
                    onClick={() => setShowBulkActions(true)}
                    className="d-flex align-items-center gap-1"
                  >
                    <FaSlidersH /> More Actions
                  </Button>
                </div>
              )}
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowFilters(!showFilters)}
                className="d-flex align-items-center gap-2"
              >
                <FaSlidersH /> {showFilters ? 'Hide Filters' : 'More Filters'}
              </Button>
            </div>

            {showFilters && (
              <Row className="mt-3 pt-3 border-top">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Date Range</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control 
                        type="date" 
                        placeholder="Start" 
                        value={dateRange.start} 
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      />
                      <Form.Control 
                        type="date" 
                        placeholder="End" 
                        value={dateRange.end} 
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Price Range (₦)</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control 
                        type="number" 
                        placeholder="Min" 
                        value={priceRange.min} 
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      />
                      <Form.Control 
                        type="number" 
                        placeholder="Max" 
                        value={priceRange.max} 
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Services Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-5">
                <FaServicestack size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No services found</h6>
                <p className="text-muted small">Try adjusting your search or filter criteria</p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => { 
                    setSearchTerm(''); 
                    setFilterCategory('all'); 
                    setFilterStatus('all'); 
                    setFilterProvider('all'); 
                    setDateRange({ start: '', end: '' }); 
                    setPriceRange({ min: '', max: '' }); 
                    setActiveTab('all'); 
                  }}
                  className="rounded-pill"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ minWidth: '1200px' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}>
                          <Form.Check 
                            type="checkbox" 
                            checked={selectedServices.length === filteredServices.length && filteredServices.length > 0} 
                            onChange={handleSelectAll} 
                          />
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer', minWidth: '250px' }} onClick={() => handleSort('title')}>
                          Service {getSortIcon('title')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('category')}>
                          Category {getSortIcon('category')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('providerName')}>
                          Provider {getSortIcon('providerName')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('price')}>
                          Price {getSortIcon('price')}
                        </th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('bookings')}>
                          Bookings {getSortIcon('bookings')}
                        </th>
                        <th style={{ padding: '16px' }}>Rating</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                          Created {getSortIcon('createdAt')}
                        </th>
                        <th style={{ padding: '16px', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map(service => service && (
                        <tr key={service.id} className={selectedServices.includes(service.id) ? 'table-active' : ''}>
                          <td style={{ padding: '16px' }}>
                            <Form.Check 
                              type="checkbox" 
                              checked={selectedServices.includes(service.id)} 
                              onChange={() => handleSelectService(service.id)} 
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-3">
                              <img 
                                src={service.images?.[0] || getServiceImage(service.title, service.id, 50, 50)} 
                                alt={service.title} 
                                className="rounded" 
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                                onError={(e) => handleServiceImageError(e, service.title)}
                              />
                              <div>
                                <div className="fw-semibold">{service.title}</div>
                                <small className="text-muted">{service.description?.substring(0, 50)}...</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <Badge bg="secondary" className="px-3 py-2 rounded-pill">
                              <FaTag className="me-1" size={10} /> {service.category}
                            </Badge>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <img 
                                src={service.providerAvatar || `https://ui-avatars.com/api/?name=${service.providerName}&background=6366f1&color=fff&size=30`} 
                                alt={service.providerName} 
                                className="rounded-circle" 
                                style={{ width: '30px', height: '30px' }} 
                              />
                              <div>
                                <div>{service.providerName}</div>
                                <small className="text-warning">
                                  <FaStar className="me-1" size={10} /> {service.providerRating || 'New'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-bold text-primary">
                              {formatNaira(service.price)}
                              {service.discount > 0 && (
                                <Badge bg="danger" className="ms-2">-{service.discount}%</Badge>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(service.status)}</td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">{service.bookings || 0}</div>
                            <small className="text-muted">{formatCompactNaira(service.revenue || 0)}</small>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {service.rating > 0 ? (
                              <span className="text-warning">
                                <FaStar className="me-1" />{service.rating} ({service.reviews || 0})
                              </span>
                            ) : (
                              <span className="text-muted">No ratings</span>
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <small>
                              <FaCalendarAlt className="me-1 text-muted" size={10} /> 
                              {format(new Date(service.createdAt), 'MMM dd, yyyy')}
                            </small>
                            <div className="small text-muted">
                              {formatDistanceToNow(new Date(service.createdAt), { addSuffix: true })}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-1">
                              <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                                <Button 
                                  size="sm" 
                                  variant="outline-primary" 
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => { 
                                    setSelectedService(service); 
                                    setModalMode('view'); 
                                    setShowServiceModal(true); 
                                  }}
                                >
                                  <FaEye size={14} />
                                </Button>
                              </OverlayTrigger>
                              
                              <OverlayTrigger placement="top" overlay={<Tooltip>Edit Service</Tooltip>}>
                                <Button 
                                  size="sm" 
                                  variant="outline-info" 
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                  onClick={() => { 
                                    setSelectedService(service); 
                                    setModalMode('edit'); 
                                    setFormData({ ...service }); 
                                    setShowServiceModal(true); 
                                  }}
                                >
                                  <FaEdit size={14} />
                                </Button>
                              </OverlayTrigger>

                              {service.status === 'pending' && (
                                <>
                                  <OverlayTrigger placement="top" overlay={<Tooltip>Approve Service</Tooltip>}>
                                    <Button 
                                      size="sm" 
                                      variant="outline-success" 
                                      className="rounded-circle p-1"
                                      style={{ width: '32px', height: '32px' }}
                                      onClick={() => { 
                                        setSelectedService(service); 
                                        setShowApproveModal(true); 
                                      }}
                                    >
                                      <FaCheckCircle size={14} />
                                    </Button>
                                  </OverlayTrigger>
                                  <OverlayTrigger placement="top" overlay={<Tooltip>Reject Service</Tooltip>}>
                                    <Button 
                                      size="sm" 
                                      variant="outline-danger" 
                                      className="rounded-circle p-1"
                                      style={{ width: '32px', height: '32px' }}
                                      onClick={() => { 
                                        setSelectedService(service); 
                                        setShowRejectModal(true); 
                                      }}
                                    >
                                      <FaTimesCircle size={14} />
                                    </Button>
                                  </OverlayTrigger>
                                </>
                              )}

                              <Dropdown>
                                <Dropdown.Toggle 
                                  size="sm" 
                                  variant="outline-secondary" 
                                  className="rounded-circle p-1"
                                  style={{ width: '32px', height: '32px' }}
                                >
                                  <FaEllipsisV size={14} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end">
                                  <Dropdown.Item onClick={() => handleFeaturedToggle(service.id)}>
                                    {service.featured ? 
                                      <FaStar className="me-2 text-warning" /> : 
                                      <FaStar className="me-2 text-muted" />
                                    }
                                    {service.featured ? 'Remove Featured' : 'Mark Featured'}
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => { 
                                    setSelectedService(service); 
                                    setShowImageModal(true); 
                                  }}>
                                    <FaImage className="me-2" /> Manage Images
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Item 
                                    className="text-danger"
                                    onClick={() => { 
                                      setSelectedService(service); 
                                      setShowDeleteModal(true); 
                                    }}
                                  >
                                    <FaTrash className="me-2" /> Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredServices.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredServices.length)} of {filteredServices.length} services
                    </div>
                    <Pagination>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
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
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
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
      {/* View/Edit/Add Modal */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {modalMode === 'view' ? <FaEye className="me-2" /> : 
             modalMode === 'edit' ? <FaEdit className="me-2" /> : 
             <FaPlus className="me-2" />}
            {modalMode === 'view' ? 'Service Details' : 
             modalMode === 'edit' ? 'Edit Service' : 'Add New Service'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {modalMode === 'view' && selectedService && (
            <div>
              <Row className="g-4">
                <Col lg={8}>
                  <h4>{selectedService.title}</h4>
                  <div className="d-flex gap-2 mb-3">
                    {getStatusBadge(selectedService.status)}
                    {selectedService.featured && (
                      <Badge bg="warning" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
                        <FaStar /> Featured
                      </Badge>
                    )}
                  </div>
                  <p>{selectedService.description}</p>
                  <Row className="g-3">
                    <Col md={4}>
                      <Card className="border-0 bg-light text-center">
                        <Card.Body>
                          <FaMoneyBillWave className="text-primary mb-2" size={24} />
                          <h6>Price</h6>
                          <h5 className="text-primary">{formatNaira(selectedService.price)}</h5>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="border-0 bg-light text-center">
                        <Card.Body>
                          <FaClock className="text-success mb-2" size={24} />
                          <h6>Duration</h6>
                          <h5>{selectedService.duration} hours</h5>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="border-0 bg-light text-center">
                        <Card.Body>
                          <FaMapMarkerAlt className="text-danger mb-2" size={24} />
                          <h6>Location</h6>
                          <h5>{selectedService.location}</h5>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
                <Col lg={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6>Provider</h6>
                      <div className="d-flex align-items-center gap-2">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${selectedService.providerName}&background=6366f1&color=fff&size=50`} 
                          className="rounded-circle" 
                          style={{ width: '50px', height: '50px' }} 
                          alt="" 
                        />
                        <div>
                          <h6 className="mb-1">{selectedService.providerName}</h6>
                          <div className="text-warning">
                            <FaStar /> {selectedService.providerRating || 'New'}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Form>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Title</Form.Label>
                    <Form.Control 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Price (₦)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                />
              </Form.Group>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Category</Form.Label>
                    <Form.Select 
                      value={formData.category} 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Provider</Form.Label>
                    <Form.Select 
                      value={formData.providerId} 
                      onChange={(e) => setFormData({ ...formData, providerId: parseInt(e.target.value) })}
                    >
                      <option value="">Select</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Duration (hours)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={formData.duration} 
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowServiceModal(false)}>
            Close
          </Button>
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Button variant="primary" onClick={handleSaveService} disabled={processing}>
              {processing ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success">
            <FaCheckCircle className="me-2" /> Approve Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="success" className="mb-0" style={{ borderRadius: '12px' }}>
            Are you sure you want to approve <strong>{selectedService?.title}</strong>?
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={() => { 
              handleStatusChange(selectedService.id, 'approved'); 
              setShowApproveModal(false); 
            }} 
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaTimesCircle className="me-2" /> Reject Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-3" style={{ borderRadius: '12px' }}>
            Are you sure you want to reject <strong>{selectedService?.title}</strong>?
          </Alert>
          <Form.Group>
            <Form.Label className="fw-semibold">Reason for rejection</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              placeholder="Provide a reason for rejection..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => { 
              handleStatusChange(selectedService.id, 'rejected', rejectionReason); 
              setShowRejectModal(false); 
              setRejectionReason(''); 
            }} 
            disabled={!rejectionReason || processing}
          >
            {processing ? 'Processing...' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaTrash className="me-2" /> Delete Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to delete <strong>{selectedService?.title}</strong>?
            <p className="mb-0 mt-2 small text-danger">This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteService} disabled={processing}>
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Management Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaImage className="me-2" /> Manage Images
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Row className="g-3">
            {selectedService?.images?.map((img, i) => (
              <Col xs={4} key={i}>
                <div className="position-relative">
                  <img 
                    src={img} 
                    className="img-fluid rounded" 
                    style={{ height: '150px', width: '100%', objectFit: 'cover' }} 
                  />
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="position-absolute top-0 end-0 rounded-circle p-1"
                    style={{ width: '28px', height: '28px', transform: 'translate(50%, -50%)' }}
                  >
                    <FaTrash size={12} />
                  </Button>
                </div>
              </Col>
            ))}
            <Col xs={4}>
              <div 
                className="border border-2 border-dashed rounded d-flex align-items-center justify-content-center" 
                style={{ height: '150px', cursor: 'pointer', background: '#f8fafc' }}
              >
                <div className="text-center">
                  <FaUpload className="text-muted mb-2" size={24} />
                  <small className="text-muted">Upload</small>
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            <FaSave className="me-2" /> Save Images
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Selected services: <strong className="text-primary">{selectedServices.length}</strong></p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkStatusChange('approved')} className="d-flex align-items-center justify-content-center gap-2">
              <FaCheckCircle /> Approve All
            </Button>
            <Button variant="warning" onClick={() => handleBulkStatusChange('pending')} className="d-flex align-items-center justify-content-center gap-2">
              <FaClock /> Set to Pending
            </Button>
            <Button variant="danger" onClick={() => handleBulkStatusChange('rejected')} className="d-flex align-items-center justify-content-center gap-2">
              <FaTimesCircle /> Reject All
            </Button>
            <Button variant="outline-danger" onClick={handleBulkDelete} className="d-flex align-items-center justify-content-center gap-2">
              <FaTrash /> Delete All
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowBulkActions(false)}>
            Cancel
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
        .border-dashed {
          border-style: dashed !important;
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
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceManagement;