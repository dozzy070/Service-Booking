// src/pages/admin/ServiceManagement.jsx
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
  Alert,
  Pagination,
  Nav,
  Toast,
  ToastContainer,
  Spinner,
  Image,
  OverlayTrigger,
  Tooltip,
  Tabs,
  Tab,
  Offcanvas
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
  FaSave,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaBars,
  FaTimes
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showMobileTable, setShowMobileTable] = useState(false);

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

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', providerId: '',
    price: '', duration: '', location: '', images: [], features: [],
    requirements: [], tags: [], status: 'pending', featured: false,
    discount: 0, available: true, maxBookings: 10, cancellationPolicy: 'flexible'
  });

  // Window size tracking for responsiveness
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

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
      if (!adminAPI) {
        throw new Error('API service not available');
      }

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
        sortOrder: sortConfig.direction,
        limit: itemsPerPage,
        page: currentPage
      };

      let response = null;
      
      if (typeof adminAPI.getServices === 'function') {
        response = await adminAPI.getServices(params);
      } else if (typeof adminAPI.getServicesList === 'function') {
        response = await adminAPI.getServicesList(params);
      } else {
        throw new Error('Services API methods not available');
      }

      const data = response?.data || [];
      const serviceList = Array.isArray(data) ? data : 
                          Array.isArray(data?.services) ? data.services : 
                          Array.isArray(data?.data) ? data.data : [];
      setServices(serviceList);
      calculateStats(serviceList);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message || 'Failed to load services');
      setServices([]);
      setStats({
        total: 0, pending: 0, approved: 0, rejected: 0, featured: 0,
        categories: 0, providers: 0, averagePrice: 0,
        totalBookings: 0, totalRevenue: 0
      });
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load services');
      }
    }
  }, [dateRange, priceRange, filterCategory, filterStatus, filterProvider, searchTerm, sortConfig, itemsPerPage, currentPage]);

  // ✅ Fetch categories with proper data extraction
  const fetchCategories = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getCategories === 'function') {
        response = await adminAPI.getCategories();
      } else if (typeof adminAPI.getCategoryList === 'function') {
        response = await adminAPI.getCategoryList();
      } else {
        throw new Error('Categories API methods not available');
      }

      const data = response?.data || [];
      const categoryList = Array.isArray(data) ? data : 
                           Array.isArray(data?.categories) ? data.categories : [];
      setCategories(categoryList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  // ✅ Fetch providers with proper data extraction
  const fetchProviders = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getProviders === 'function') {
        response = await adminAPI.getProviders();
      } else if (typeof adminAPI.getProviderList === 'function') {
        response = await adminAPI.getProviderList();
      } else {
        throw new Error('Providers API methods not available');
      }

      const data = response?.data || [];
      const providerList = Array.isArray(data) ? data : 
                           Array.isArray(data?.providers) ? data.providers : [];
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
      pending: list.filter(s => s?.status?.toLowerCase() === 'pending').length,
      approved: list.filter(s => s?.status?.toLowerCase() === 'approved' || s?.status?.toLowerCase() === 'active').length,
      rejected: list.filter(s => s?.status?.toLowerCase() === 'rejected').length,
      featured: list.filter(s => s?.featured === true).length,
      categories: new Set(list.map(s => s?.category).filter(Boolean)).size,
      providers: new Set(list.map(s => s?.providerId || s?.provider_id).filter(Boolean)).size,
      averagePrice: list.length ? Math.round(list.reduce((sum, s) => sum + (parseFloat(s?.price) || 0), 0) / list.length) : 0,
      totalBookings: list.reduce((sum, s) => sum + (parseInt(s?.bookings) || 0), 0),
      totalRevenue: list.reduce((sum, s) => sum + (parseFloat(s?.revenue) || 0), 0)
    };
    setStats(newStats);
  };

  // ✅ Fetch all data
  const fetchAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchServices(),
        fetchCategories(),
        fetchProviders()
      ]);
    } catch (error) {
      console.error('Error fetching all data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [fetchServices, fetchCategories, fetchProviders]);

  // ✅ Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchAllData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000);
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
    fetchAllData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchServices();
    }
  }, [fetchServices]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus, filterProvider, dateRange, priceRange, activeTab]);

  // ✅ Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData(false);
    toast.success('Data refreshed');
  };

  // ✅ Service actions with adminAPI
  const handleStatusChange = async (serviceId, newStatus, reason = '') => {
    if (!serviceId) return;
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (newStatus === 'approved') {
        await adminAPI.approveService(serviceId);
      } else if (newStatus === 'rejected') {
        await adminAPI.rejectService(serviceId, reason);
      } else if (typeof adminAPI.updateServiceStatus === 'function') {
        await adminAPI.updateServiceStatus(serviceId, { status: newStatus, rejectionReason: reason });
      } else if (typeof adminAPI.updateService === 'function') {
        await adminAPI.updateService(serviceId, { status: newStatus, rejectionReason: reason });
      } else {
        throw new Error('Service update API methods not available');
      }
      
      await fetchServices();
      setShowApproveModal(false);
      setShowRejectModal(false);
      setSelectedService(null);
      toast.success(`Service ${newStatus}`);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    const serviceId = selectedService.id || selectedService._id;
    if (!serviceId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.deleteService === 'function') {
        await adminAPI.deleteService(serviceId);
      } else if (typeof adminAPI.removeService === 'function') {
        await adminAPI.removeService(serviceId);
      } else {
        throw new Error('Service delete API methods not available');
      }
      
      await fetchServices();
      setShowDeleteModal(false);
      setSelectedService(null);
      toast.success('Service deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete service');
    } finally {
      setProcessing(false);
    }
  };

  const handleFeaturedToggle = async (serviceId) => {
    if (!serviceId) return;
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const service = services.find(s => (s.id || s._id) === serviceId);
      const newFeatured = !service?.featured;

      if (typeof adminAPI.toggleFeatured === 'function') {
        await adminAPI.toggleFeatured(serviceId, { featured: newFeatured });
      } else if (typeof adminAPI.updateService === 'function') {
        await adminAPI.updateService(serviceId, { featured: newFeatured });
      } else {
        throw new Error('Featured toggle API methods not available');
      }
      
      await fetchServices();
      toast.success(`Service ${newFeatured ? 'added to' : 'removed from'} featured`);
    } catch (error) {
      console.error('Featured toggle error:', error);
      toast.error(error.message || 'Failed to update featured status');
    }
  };

  const handleSaveService = async () => {
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const payload = { ...formData };
      
      if (modalMode === 'add') {
        if (typeof adminAPI.createService === 'function') {
          await adminAPI.createService(payload);
        } else if (typeof adminAPI.addService === 'function') {
          await adminAPI.addService(payload);
        } else {
          throw new Error('Service create API methods not available');
        }
        toast.success('Service added');
      } else if (modalMode === 'edit' && selectedService) {
        const serviceId = selectedService.id || selectedService._id;
        if (!serviceId) {
          throw new Error('Service ID not found');
        }
        if (typeof adminAPI.updateService === 'function') {
          await adminAPI.updateService(serviceId, payload);
        } else if (typeof adminAPI.editService === 'function') {
          await adminAPI.editService(serviceId, payload);
        } else {
          throw new Error('Service update API methods not available');
        }
        toast.success('Service updated');
      }
      
      await fetchServices();
      setShowServiceModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || `Failed to ${modalMode === 'add' ? 'add' : 'update'} service`);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedServices.length === 0) return;
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const payload = { serviceIds: selectedServices, action: newStatus };
      
      if (typeof adminAPI.bulkServiceAction === 'function') {
        await adminAPI.bulkServiceAction(payload);
      } else if (typeof adminAPI.bulkUpdateServices === 'function') {
        await adminAPI.bulkUpdateServices(payload);
      } else {
        throw new Error('Bulk action API methods not available');
      }
      
      await fetchServices();
      setSelectedServices([]);
      setShowBulkActions(false);
      toast.success(`${selectedServices.length} services updated to ${newStatus}`);
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error(error.message || 'Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) return;
    setProcessing(true);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      const payload = { serviceIds: selectedServices };
      
      if (typeof adminAPI.bulkServiceDelete === 'function') {
        await adminAPI.bulkServiceDelete(payload);
      } else if (typeof adminAPI.bulkDeleteServices === 'function') {
        await adminAPI.bulkDeleteServices(payload);
      } else {
        throw new Error('Bulk delete API methods not available');
      }
      
      await fetchServices();
      setSelectedServices([]);
      setShowBulkActions(false);
      toast.success(`${selectedServices.length} services deleted`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.message || 'Bulk delete failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportServices = () => {
    try {
      const dataStr = JSON.stringify(services, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `services_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Services exported');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export services');
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    const allIds = filteredServices.map(s => s.id || s._id).filter(Boolean);
    if (selectedServices.length === allIds.length && allIds.length > 0) {
      setSelectedServices([]);
    } else {
      setSelectedServices(allIds);
    }
  };

  const handleSelectService = (serviceId) => {
    if (!serviceId) return;
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
    if (activeTab === 'pending') filtered = filtered.filter(s => s?.status?.toLowerCase() === 'pending');
    if (activeTab === 'approved') filtered = filtered.filter(s => s?.status?.toLowerCase() === 'approved' || s?.status?.toLowerCase() === 'active');
    if (activeTab === 'rejected') filtered = filtered.filter(s => s?.status?.toLowerCase() === 'rejected');
    if (activeTab === 'featured') filtered = filtered.filter(s => s?.featured === true);
    return filtered;
  }, [services, activeTab]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary" className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
          <FaClock size={10} />
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const badges = {
      approved: { bg: 'success', icon: <FaCheckCircle size={12} />, label: 'Approved' },
      active: { bg: 'success', icon: <FaCheckCircle size={12} />, label: 'Active' },
      pending: { bg: 'warning', icon: <FaClock size={12} />, label: 'Pending' },
      rejected: { bg: 'danger', icon: <FaTimesCircle size={12} />, label: 'Rejected' },
      inactive: { bg: 'secondary', icon: <FaClock size={12} />, label: 'Inactive' }
    };
    const b = badges[lowerStatus] || badges.pending;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
  };

  // Get service ID safely
  const getServiceId = (service) => {
    return service?.id || service?._id || null;
  };

  // Get field with fallback
  const getField = (obj, fields, fallback = 'N/A') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Mobile service card render
  const renderMobileServiceCard = (service) => {
    const serviceId = getServiceId(service);
    const providerName = getField(service, ['providerName', 'provider.name', 'provider.fullName'], 'Unknown');
    const category = getField(service, ['category', 'categoryName'], 'Uncategorized');
    const title = getField(service, ['title', 'name', 'serviceName'], 'Untitled');
    const price = parseFloat(service?.price) || 0;
    const bookings = parseInt(service?.bookings) || 0;
    const rating = parseFloat(service?.rating) || 0;
    const reviews = parseInt(service?.reviews) || 0;
    const status = service?.status || 'pending';
    const featured = service?.featured || false;
    const images = service?.images || [];
    const createdAt = service?.createdAt || service?.created_at || new Date().toISOString();

    return (
      <Card key={serviceId} className="mb-3 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-3">
          <div className="d-flex gap-3">
            <img 
              src={images[0] || getServiceImage(title, serviceId, 60, 60)} 
              alt={title} 
              className="rounded" 
              style={{ width: '70px', height: '70px', objectFit: 'cover', flexShrink: 0 }} 
              onError={(e) => handleServiceImageError(e, title)}
            />
            <div className="flex-grow-1 min-width-0">
              <div className="d-flex justify-content-between align-items-start">
                <h6 className="fw-bold mb-1 text-truncate">{title}</h6>
                <div className="d-flex gap-1">
                  <OverlayTrigger placement="top" overlay={<Tooltip>View</Tooltip>}>
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      className="rounded-circle p-0"
                      style={{ width: '28px', height: '28px', minWidth: '28px' }}
                      onClick={() => { 
                        setSelectedService(service); 
                        setModalMode('view'); 
                        setShowServiceModal(true); 
                      }}
                    >
                      <FaEye size={12} />
                    </Button>
                  </OverlayTrigger>
                  <Dropdown>
                    <Dropdown.Toggle 
                      size="sm" 
                      variant="outline-secondary" 
                      className="rounded-circle p-0"
                      style={{ width: '28px', height: '28px', minWidth: '28px' }}
                    >
                      <FaEllipsisV size={12} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                      <Dropdown.Item onClick={() => { 
                        setSelectedService(service); 
                        setModalMode('edit'); 
                        setFormData({ ...service }); 
                        setShowServiceModal(true); 
                      }}>
                        <FaEdit className="me-2" /> Edit
                      </Dropdown.Item>
                      {(status === 'pending' || status === 'Pending') && (
                        <>
                          <Dropdown.Item onClick={() => { 
                            setSelectedService(service); 
                            setShowApproveModal(true); 
                          }} className="text-success">
                            <FaCheckCircle className="me-2" /> Approve
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => { 
                            setSelectedService(service); 
                            setShowRejectModal(true); 
                          }} className="text-danger">
                            <FaTimesCircle className="me-2" /> Reject
                          </Dropdown.Item>
                        </>
                      )}
                      <Dropdown.Item onClick={() => handleFeaturedToggle(serviceId)}>
                        {featured ? 
                          <FaStar className="me-2 text-warning" /> : 
                          <FaStar className="me-2" />
                        }
                        {featured ? 'Remove Featured' : 'Mark Featured'}
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
              </div>
              <div className="d-flex flex-wrap gap-2 mt-1">
                <Badge bg="secondary" className="rounded-pill" style={{ fontSize: '0.65rem' }}>
                  <FaTag className="me-1" size={10} /> {category}
                </Badge>
                {getStatusBadge(status)}
                {featured && (
                  <Badge bg="warning" className="rounded-pill" style={{ fontSize: '0.65rem' }}>
                    <FaStar className="me-1" size={10} /> Featured
                  </Badge>
                )}
              </div>
              <div className="d-flex flex-wrap gap-3 mt-2">
                <span className="text-primary fw-bold">{formatNaira(price)}</span>
                <span className="text-muted small"><FaCalendarAlt className="me-1" /> {format(new Date(createdAt), 'MMM dd, yyyy')}</span>
                <span className="text-muted small">
                  <FaStar className="text-warning me-1" /> 
                  {rating > 0 ? `${rating.toFixed(1)} (${reviews})` : 'No ratings'}
                </span>
              </div>
              <div className="mt-1">
                <small className="text-muted">Provider: {providerName}</small>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Desktop table columns - responsive visibility classes
  const getColumnVisibility = () => {
    if (isMobile) {
      return {
        checkbox: false,
        service: true,
        category: false,
        provider: false,
        price: true,
        status: true,
        bookings: false,
        rating: false,
        created: false,
        actions: true
      };
    } else if (isTablet) {
      return {
        checkbox: true,
        service: true,
        category: true,
        provider: false,
        price: true,
        status: true,
        bookings: false,
        rating: true,
        created: false,
        actions: true
      };
    } else {
      return {
        checkbox: true,
        service: true,
        category: true,
        provider: true,
        price: true,
        status: true,
        bookings: true,
        rating: true,
        created: true,
        actions: true
      };
    }
  };

  const colVisibility = getColumnVisibility();

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '70px' }}>
      <Container fluid className="py-3 py-md-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-3 mb-md-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
          <div>
            <h4 className="mb-0 fw-bold" style={{ fontSize: isMobile ? '1.1rem' : '1.5rem' }}>Service Management</h4>
            <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}>
              Manage and monitor all services on the platform
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {!isMobile && (
              <>
                <Button
                  variant="outline-primary"
                  onClick={refreshData}
                  disabled={refreshing}
                  className="d-flex align-items-center gap-2"
                  size={isMobile ? 'sm' : 'md'}
                >
                  <FaSync className={refreshing ? 'spin' : ''} />
                  {!isMobile && (refreshing ? 'Refreshing...' : 'Refresh')}
                </Button>
                <Button variant="outline-primary" onClick={handleExportServices} className="d-flex align-items-center gap-2" size={isMobile ? 'sm' : 'md'}>
                  <FaDownload /> {!isMobile && 'Export'}
                </Button>
              </>
            )}
            <Button 
              variant="primary" 
              onClick={() => { 
                setModalMode('add'); 
                setFormData({
                  title: '', description: '', category: '', providerId: '',
                  price: '', duration: '', location: '', images: [], features: [],
                  requirements: [], tags: [], status: 'pending', featured: false,
                  discount: 0, available: true, maxBookings: 10, cancellationPolicy: 'flexible'
                });
                setShowServiceModal(true); 
              }} 
              className="d-flex align-items-center gap-2"
              size={isMobile ? 'sm' : 'md'}
            >
              <FaPlus /> {!isMobile && 'Add Service'}
            </Button>
            {isMobile && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowMobileFilters(true)}
                size="sm"
                className="d-flex align-items-center"
              >
                <FaSlidersH />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards - Responsive grid */}
        <Row className="g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
          <Col xs={6} sm={4} md={3} lg={2} xl={2}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-2 p-sm-3">
                <div className="d-flex align-items-center gap-2 gap-sm-3">
                  <div className="rounded-circle p-2 p-sm-3" style={{ background: '#3b82f620' }}>
                    <FaServicestack size={isMobile ? 16 : 24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>Total</p>
                    <h5 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{stats.total}</h5>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4} md={3} lg={2} xl={2}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-2 p-sm-3">
                <div className="d-flex align-items-center gap-2 gap-sm-3">
                  <div className="rounded-circle p-2 p-sm-3" style={{ background: '#f59e0b20' }}>
                    <FaClock size={isMobile ? 16 : 24} color="#f59e0b" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>Pending</p>
                    <h5 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{stats.pending}</h5>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4} md={3} lg={2} xl={2}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-2 p-sm-3">
                <div className="d-flex align-items-center gap-2 gap-sm-3">
                  <div className="rounded-circle p-2 p-sm-3" style={{ background: '#10b98120' }}>
                    <FaCheckCircle size={isMobile ? 16 : 24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>Approved</p>
                    <h5 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{stats.approved}</h5>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4} md={3} lg={2} xl={2}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-2 p-sm-3">
                <div className="d-flex align-items-center gap-2 gap-sm-3">
                  <div className="rounded-circle p-2 p-sm-3" style={{ background: '#ef444420' }}>
                    <FaTimesCircle size={isMobile ? 16 : 24} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>Rejected</p>
                    <h5 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{stats.rejected}</h5>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4} md={3} lg={2} xl={2}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-2 p-sm-3">
                <div className="d-flex align-items-center gap-2 gap-sm-3">
                  <div className="rounded-circle p-2 p-sm-3" style={{ background: '#8b5cf620' }}>
                    <FaStar size={isMobile ? 16 : 24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>Featured</p>
                    <h5 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{stats.featured}</h5>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} sm={4} md={3} lg={2} xl={2}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-2 p-sm-3">
                <div className="d-flex align-items-center gap-2 gap-sm-3">
                  <div className="rounded-circle p-2 p-sm-3" style={{ background: '#10b98120' }}>
                    <FaMoneyBillWave size={isMobile ? 16 : 24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small" style={{ fontSize: isMobile ? '0.5rem' : '0.7rem' }}>Avg Price</p>
                    <h5 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.7rem' : '1.25rem' }}>{formatCompactNaira(stats.averagePrice)}</h5>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs - Scrollable on mobile */}
        <Card className="border-0 shadow-sm mb-3 mb-md-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Nav variant="tabs" className="px-2 px-md-3 pt-2 pt-md-3" style={{ borderBottom: 'none', overflowX: 'auto', flexWrap: 'nowrap' }}>
              <Nav.Item className="flex-shrink-0">
                <Nav.Link 
                  active={activeTab === 'all'} 
                  onClick={() => setActiveTab('all')}
                  className="fw-semibold"
                  style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '0.4rem 0.6rem' : '0.75rem 1.5rem' }}
                >
                  <FaServicestack className="me-1 me-md-2" size={isMobile ? 12 : 16} /> All
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="flex-shrink-0">
                <Nav.Link 
                  active={activeTab === 'pending'} 
                  onClick={() => setActiveTab('pending')}
                  className="fw-semibold"
                  style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '0.4rem 0.6rem' : '0.75rem 1.5rem' }}
                >
                  <FaClock className="me-1 me-md-2 text-warning" size={isMobile ? 12 : 16} /> Pending
                  {stats.pending > 0 && (
                    <Badge bg="warning" pill className="ms-1 ms-md-2" style={{ fontSize: isMobile ? '0.6rem' : '0.75rem' }}>{stats.pending}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="flex-shrink-0">
                <Nav.Link 
                  active={activeTab === 'approved'} 
                  onClick={() => setActiveTab('approved')}
                  className="fw-semibold"
                  style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '0.4rem 0.6rem' : '0.75rem 1.5rem' }}
                >
                  <FaCheckCircle className="me-1 me-md-2 text-success" size={isMobile ? 12 : 16} /> Approved
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="flex-shrink-0">
                <Nav.Link 
                  active={activeTab === 'rejected'} 
                  onClick={() => setActiveTab('rejected')}
                  className="fw-semibold"
                  style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '0.4rem 0.6rem' : '0.75rem 1.5rem' }}
                >
                  <FaTimesCircle className="me-1 me-md-2 text-danger" size={isMobile ? 12 : 16} /> Rejected
                </Nav.Link>
              </Nav.Item>
              <Nav.Item className="flex-shrink-0">
                <Nav.Link 
                  active={activeTab === 'featured'} 
                  onClick={() => setActiveTab('featured')}
                  className="fw-semibold"
                  style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', padding: isMobile ? '0.4rem 0.6rem' : '0.75rem 1.5rem' }}
                >
                  <FaStar className="me-1 me-md-2 text-warning" size={isMobile ? 12 : 16} /> Featured
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Filters - Desktop */}
        {!isMobile && (
          <Card className="border-0 shadow-sm mb-3 mb-md-4" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex flex-wrap gap-2 gap-md-3 align-items-center">
                <InputGroup style={{ maxWidth: isMobile ? '100%' : '280px' }}>
                  <InputGroup.Text className="bg-white border-end-0">
                    <FaSearch className="text-muted" size={isMobile ? 12 : 16} />
                  </InputGroup.Text>
                  <Form.Control 
                    placeholder="Search services..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="border-start-0"
                    size={isMobile ? 'sm' : 'md'}
                  />
                </InputGroup>
                <Form.Select 
                  style={{ width: isMobile ? '100%' : '150px' }} 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id || cat._id} value={cat.name || cat.categoryName}>
                      {cat.name || cat.categoryName}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={{ width: isMobile ? '100%' : '180px' }} 
                  value={filterProvider} 
                  onChange={(e) => setFilterProvider(e.target.value)}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <option value="all">All Providers</option>
                  {providers.map(prov => (
                    <option key={prov.id || prov._id} value={prov.id || prov._id}>
                      {prov.name || prov.providerName || prov.fullName}
                    </option>
                  ))}
                </Form.Select>
                <Form.Select 
                  style={{ width: isMobile ? '100%' : '150px' }} 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
                <Form.Select 
                  style={{ width: isMobile ? '100%' : '100px' }} 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  size={isMobile ? 'sm' : 'md'}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Form.Select>
                <div className="d-flex gap-2 ms-auto">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="d-flex align-items-center gap-2"
                    size={isMobile ? 'sm' : 'md'}
                  >
                    <FaSlidersH /> {showFilters ? 'Hide Filters' : 'More Filters'}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <Row className="mt-3 pt-3 border-top">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Date Range</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control 
                          type="date" 
                          placeholder="Start" 
                          value={dateRange.start} 
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          size="sm"
                        />
                        <Form.Control 
                          type="date" 
                          placeholder="End" 
                          value={dateRange.end} 
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          size="sm"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Price Range (₦)</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control 
                          type="number" 
                          placeholder="Min" 
                          value={priceRange.min} 
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          size="sm"
                        />
                        <Form.Control 
                          type="number" 
                          placeholder="Max" 
                          value={priceRange.max} 
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          size="sm"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {selectedServices.length > 0 && (
                <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-2">
                  <span className="text-muted small me-2">{selectedServices.length} selected</span>
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => handleBulkStatusChange('approved')}
                    className="d-flex align-items-center gap-1"
                    disabled={processing}
                  >
                    <FaCheckCircle size={12} /> Approve
                  </Button>
                  <Button 
                    variant="warning" 
                    size="sm" 
                    onClick={() => setShowBulkActions(true)}
                    className="d-flex align-items-center gap-1"
                  >
                    <FaSlidersH size={12} /> More
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="d-flex align-items-center gap-1"
                    disabled={processing}
                  >
                    <FaTrash size={12} /> Delete
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Mobile Filters Offcanvas */}
        <Offcanvas show={showMobileFilters} onHide={() => setShowMobileFilters(false)} placement="bottom" style={{ height: '80%' }}>
          <Offcanvas.Header closeButton className="border-0 pb-0">
            <Offcanvas.Title className="fw-bold"><FaSlidersH className="me-2" /> Filters</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Search</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control 
                  placeholder="Search services..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </InputGroup>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Category</Form.Label>
              <Form.Select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id || cat._id} value={cat.name || cat.categoryName}>
                    {cat.name || cat.categoryName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Provider</Form.Label>
              <Form.Select 
                value={filterProvider} 
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                <option value="all">All Providers</option>
                {providers.map(prov => (
                  <option key={prov.id || prov._id} value={prov.id || prov._id}>
                    {prov.name || prov.providerName || prov.fullName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Items Per Page</Form.Label>
              <Form.Select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date Range</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control 
                  type="date" 
                  placeholder="Start" 
                  value={dateRange.start} 
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  size="sm"
                />
                <Form.Control 
                  type="date" 
                  placeholder="End" 
                  value={dateRange.end} 
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  size="sm"
                />
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Price Range (₦)</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control 
                  type="number" 
                  placeholder="Min" 
                  value={priceRange.min} 
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  size="sm"
                />
                <Form.Control 
                  type="number" 
                  placeholder="Max" 
                  value={priceRange.max} 
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  size="sm"
                />
              </div>
            </Form.Group>
            <div className="d-grid gap-2 mt-4">
              <Button 
                variant="primary" 
                onClick={() => { 
                  setShowMobileFilters(false); 
                  setCurrentPage(1);
                }}
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => { 
                  setSearchTerm(''); 
                  setFilterCategory('all'); 
                  setFilterStatus('all'); 
                  setFilterProvider('all'); 
                  setDateRange({ start: '', end: '' }); 
                  setPriceRange({ min: '', max: '' }); 
                  setActiveTab('all'); 
                  setCurrentPage(1);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Services Table / Cards */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading services...</p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-5">
                <FaServicestack size={isMobile ? 32 : 48} className="text-muted mb-3 opacity-50" />
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
                {isMobile ? (
                  // Mobile Card View
                  <div className="p-2 p-md-3">
                    {currentItems.map(service => renderMobileServiceCard(service))}
                  </div>
                ) : (
                  // Desktop Table View
                  <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <Table hover className="mb-0" style={{ minWidth: '800px' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          {colVisibility.checkbox && (
                            <th style={{ padding: '12px 16px', width: '40px' }}>
                              <Form.Check 
                                type="checkbox" 
                                checked={selectedServices.length === filteredServices.length && filteredServices.length > 0} 
                                onChange={handleSelectAll} 
                              />
                            </th>
                          )}
                          <th style={{ padding: '12px 16px', cursor: 'pointer', minWidth: '200px' }} onClick={() => handleSort('title')}>
                            Service {getSortIcon('title')}
                          </th>
                          {colVisibility.category && (
                            <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleSort('category')}>
                              Category {getSortIcon('category')}
                            </th>
                          )}
                          {colVisibility.provider && (
                            <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleSort('providerName')}>
                              Provider {getSortIcon('providerName')}
                            </th>
                          )}
                          {colVisibility.price && (
                            <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleSort('price')}>
                              Price {getSortIcon('price')}
                            </th>
                          )}
                          {colVisibility.status && (
                            <th style={{ padding: '12px 16px' }}>Status</th>
                          )}
                          {colVisibility.bookings && (
                            <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleSort('bookings')}>
                              Bookings {getSortIcon('bookings')}
                            </th>
                          )}
                          {colVisibility.rating && (
                            <th style={{ padding: '12px 16px' }}>Rating</th>
                          )}
                          {colVisibility.created && (
                            <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                              Created {getSortIcon('createdAt')}
                            </th>
                          )}
                          <th style={{ padding: '12px 16px', width: isTablet ? '120px' : '160px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map(service => {
                          const serviceId = getServiceId(service);
                          const providerName = getField(service, ['providerName', 'provider.name', 'provider.fullName'], 'Unknown');
                          const category = getField(service, ['category', 'categoryName'], 'Uncategorized');
                          const title = getField(service, ['title', 'name', 'serviceName'], 'Untitled');
                          const description = getField(service, ['description', 'shortDescription'], '');
                          const price = parseFloat(service?.price) || 0;
                          const bookings = parseInt(service?.bookings) || 0;
                          const revenue = parseFloat(service?.revenue) || 0;
                          const rating = parseFloat(service?.rating) || 0;
                          const reviews = parseInt(service?.reviews) || 0;
                          const status = service?.status || 'pending';
                          const featured = service?.featured || false;
                          const images = service?.images || [];
                          const createdAt = service?.createdAt || service?.created_at || new Date().toISOString();
                          
                          return (
                            <tr key={serviceId} className={selectedServices.includes(serviceId) ? 'table-active' : ''}>
                              {colVisibility.checkbox && (
                                <td style={{ padding: '12px 16px' }}>
                                  <Form.Check 
                                    type="checkbox" 
                                    checked={selectedServices.includes(serviceId)} 
                                    onChange={() => handleSelectService(serviceId)} 
                                  />
                                </td>
                              )}
                              <td style={{ padding: '12px 16px' }}>
                                <div className="d-flex align-items-center gap-3">
                                  <img 
                                    src={images[0] || getServiceImage(title, serviceId, 50, 50)} 
                                    alt={title} 
                                    className="rounded" 
                                    style={{ width: '45px', height: '45px', objectFit: 'cover', flexShrink: 0 }} 
                                    onError={(e) => handleServiceImageError(e, title)}
                                  />
                                  <div className="min-width-0">
                                    <div className="fw-semibold text-truncate" style={{ maxWidth: '150px' }}>{title}</div>
                                    {description && <small className="text-muted d-block text-truncate" style={{ maxWidth: '150px' }}>{description.substring(0, 40)}...</small>}
                                  </div>
                                </div>
                              </td>
                              {colVisibility.category && (
                                <td style={{ padding: '12px 16px' }}>
                                  <Badge bg="secondary" className="px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                    <FaTag className="me-1" size={10} /> {category}
                                  </Badge>
                                </td>
                              )}
                              {colVisibility.provider && (
                                <td style={{ padding: '12px 16px' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <img 
                                      src={service.providerAvatar || `https://ui-avatars.com/api/?name=${providerName}&background=6366f1&color=fff&size=30`} 
                                      alt={providerName} 
                                      className="rounded-circle" 
                                      style={{ width: '28px', height: '28px' }} 
                                    />
                                    <div>
                                      <div className="text-truncate" style={{ maxWidth: '100px' }}>{providerName}</div>
                                    </div>
                                  </div>
                                </td>
                              )}
                              {colVisibility.price && (
                                <td style={{ padding: '12px 16px' }}>
                                  <div className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                                    {formatNaira(price)}
                                  </div>
                                </td>
                              )}
                              {colVisibility.status && (
                                <td style={{ padding: '12px 16px' }}>{getStatusBadge(status)}</td>
                              )}
                              {colVisibility.bookings && (
                                <td style={{ padding: '12px 16px' }}>
                                  <div className="fw-semibold">{bookings}</div>
                                  <small className="text-muted">{formatCompactNaira(revenue)}</small>
                                </td>
                              )}
                              {colVisibility.rating && (
                                <td style={{ padding: '12px 16px' }}>
                                  {rating > 0 ? (
                                    <span className="text-warning" style={{ fontSize: '0.85rem' }}>
                                      <FaStar className="me-1" size={12} />{rating.toFixed(1)} ({reviews})
                                    </span>
                                  ) : (
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>No ratings</span>
                                  )}
                                </td>
                              )}
                              {colVisibility.created && (
                                <td style={{ padding: '12px 16px' }}>
                                  <small style={{ fontSize: '0.7rem' }}>
                                    <FaCalendarAlt className="me-1 text-muted" size={10} /> 
                                    {format(new Date(createdAt), 'MMM dd, yyyy')}
                                  </small>
                                  <div className="small text-muted" style={{ fontSize: '0.65rem' }}>
                                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                                  </div>
                                </td>
                              )}
                              <td style={{ padding: '12px 16px' }}>
                                <div className="d-flex gap-1 flex-wrap">
                                  <OverlayTrigger placement="top" overlay={<Tooltip>View</Tooltip>}>
                                    <Button 
                                      size="sm" 
                                      variant="outline-primary" 
                                      className="rounded-circle p-0"
                                      style={{ width: '30px', height: '30px', minWidth: '30px' }}
                                      onClick={() => { 
                                        setSelectedService(service); 
                                        setModalMode('view'); 
                                        setShowServiceModal(true); 
                                      }}
                                    >
                                      <FaEye size={13} />
                                    </Button>
                                  </OverlayTrigger>
                                  
                                  <OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
                                    <Button 
                                      size="sm" 
                                      variant="outline-info" 
                                      className="rounded-circle p-0"
                                      style={{ width: '30px', height: '30px', minWidth: '30px' }}
                                      onClick={() => { 
                                        setSelectedService(service); 
                                        setModalMode('edit'); 
                                        setFormData({ ...service }); 
                                        setShowServiceModal(true); 
                                      }}
                                    >
                                      <FaEdit size={13} />
                                    </Button>
                                  </OverlayTrigger>

                                  {(status === 'pending' || status === 'Pending') && (
                                    <>
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Approve</Tooltip>}>
                                        <Button 
                                          size="sm" 
                                          variant="outline-success" 
                                          className="rounded-circle p-0"
                                          style={{ width: '30px', height: '30px', minWidth: '30px' }}
                                          onClick={() => { 
                                            setSelectedService(service); 
                                            setShowApproveModal(true); 
                                          }}
                                        >
                                          <FaCheckCircle size={13} />
                                        </Button>
                                      </OverlayTrigger>
                                      <OverlayTrigger placement="top" overlay={<Tooltip>Reject</Tooltip>}>
                                        <Button 
                                          size="sm" 
                                          variant="outline-danger" 
                                          className="rounded-circle p-0"
                                          style={{ width: '30px', height: '30px', minWidth: '30px' }}
                                          onClick={() => { 
                                            setSelectedService(service); 
                                            setShowRejectModal(true); 
                                          }}
                                        >
                                          <FaTimesCircle size={13} />
                                        </Button>
                                      </OverlayTrigger>
                                    </>
                                  )}

                                  <Dropdown>
                                    <Dropdown.Toggle 
                                      size="sm" 
                                      variant="outline-secondary" 
                                      className="rounded-circle p-0"
                                      style={{ width: '30px', height: '30px', minWidth: '30px' }}
                                    >
                                      <FaEllipsisV size={13} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                      <Dropdown.Item onClick={() => handleFeaturedToggle(serviceId)}>
                                        {featured ? 
                                          <FaStar className="me-2 text-warning" /> : 
                                          <FaStar className="me-2" />
                                        }
                                        {featured ? 'Remove Featured' : 'Mark Featured'}
                                      </Dropdown.Item>
                                      <Dropdown.Item onClick={() => { 
                                        setSelectedService(service); 
                                        setShowImageModal(true); 
                                      }}>
                                        <FaImage className="me-2" /> Images
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
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {filteredServices.length > 0 && (
                  <div className="d-flex flex-wrap justify-content-between align-items-center p-3 p-md-4 border-top gap-2">
                    <div className="text-muted small" style={{ fontSize: isMobile ? '0.65rem' : '0.8rem' }}>
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredServices.length)} of {filteredServices.length}
                    </div>
                    <Pagination className="mb-0 flex-wrap">
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                        disabled={currentPage === 1} 
                        size={isMobile ? 'sm' : 'md'}
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
                            size={isMobile ? 'sm' : 'md'}
                          >
                            {pageNum}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next 
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                        disabled={currentPage === totalPages} 
                        size={isMobile ? 'sm' : 'md'}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* ==================== MODALS ==================== */}

      {/* View/Edit/Add Modal - Responsive */}
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)} size={isMobile ? 'fullscreen' : 'xl'} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            {modalMode === 'view' ? <FaEye className="me-2" /> : 
             modalMode === 'edit' ? <FaEdit className="me-2" /> : 
             <FaPlus className="me-2" />}
            {modalMode === 'view' ? 'Service Details' : 
             modalMode === 'edit' ? 'Edit Service' : 'Add New Service'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 pt-md-4">
          {modalMode === 'view' && selectedService && (
            <div>
              <Row className="g-3 g-md-4">
                <Col lg={8}>
                  <h5 className="fw-bold">{getField(selectedService, ['title', 'name', 'serviceName'], 'Untitled')}</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {getStatusBadge(selectedService.status)}
                    {selectedService.featured && (
                      <Badge bg="warning" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
                        <FaStar size={12} /> Featured
                      </Badge>
                    )}
                  </div>
                  <p>{getField(selectedService, ['description', 'shortDescription'], 'No description provided')}</p>
                  <Row className="g-2 g-md-3">
                    <Col md={4} sm={6}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="text-center p-2 p-md-3">
                          <FaMoneyBillWave className="text-primary mb-2" size={isMobile ? 20 : 24} />
                          <h6 style={{ fontSize: isMobile ? '0.8rem' : '1rem' }}>Price</h6>
                          <h6 className="text-primary mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{formatNaira(selectedService.price)}</h6>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4} sm={6}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="text-center p-2 p-md-3">
                          <FaClock className="text-success mb-2" size={isMobile ? 20 : 24} />
                          <h6 style={{ fontSize: isMobile ? '0.8rem' : '1rem' }}>Duration</h6>
                          <h6 className="mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{getField(selectedService, ['duration', 'estimatedDuration'], 'N/A')} hrs</h6>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4} sm={6}>
                      <Card className="border-0 bg-light">
                        <Card.Body className="text-center p-2 p-md-3">
                          <FaMapMarkerAlt className="text-danger mb-2" size={isMobile ? 20 : 24} />
                          <h6 style={{ fontSize: isMobile ? '0.8rem' : '1rem' }}>Location</h6>
                          <h6 className="mb-0" style={{ fontSize: isMobile ? '0.9rem' : '1.25rem' }}>{getField(selectedService, ['location', 'serviceLocation', 'address'], 'N/A')}</h6>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
                <Col lg={4}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <h6 style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Provider</h6>
                      <div className="d-flex align-items-center gap-2">
                        <img 
                          src={selectedService.providerAvatar || `https://ui-avatars.com/api/?name=${getField(selectedService, ['providerName', 'provider.name', 'provider.fullName'], 'P')}&background=6366f1&color=fff&size=50`} 
                          className="rounded-circle" 
                          style={{ width: '40px', height: '40px' }} 
                          alt="" 
                        />
                        <div>
                          <h6 className="mb-1" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{getField(selectedService, ['providerName', 'provider.name', 'provider.fullName'], 'Unknown')}</h6>
                          <div className="text-warning" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
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
              <Row className="g-2 g-md-3">
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Title</Form.Label>
                    <Form.Control 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Price (₦)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={isMobile ? 3 : 4} 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  size={isMobile ? 'sm' : 'md'}
                />
              </Form.Group>
              <Row className="g-2 g-md-3">
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Category</Form.Label>
                    <Form.Select 
                      value={formData.category} 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      size={isMobile ? 'sm' : 'md'}
                    >
                      <option value="">Select</option>
                      {categories.map(c => (
                        <option key={c.id || c._id} value={c.name || c.categoryName}>{c.name || c.categoryName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Provider</Form.Label>
                    <Form.Select 
                      value={formData.providerId} 
                      onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                      size={isMobile ? 'sm' : 'md'}
                    >
                      <option value="">Select</option>
                      {providers.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>{p.name || p.providerName}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Duration (hours)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={formData.duration} 
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" onClick={() => setShowServiceModal(false)} size={isMobile ? 'sm' : 'md'}>
            Close
          </Button>
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Button variant="primary" onClick={handleSaveService} disabled={processing} size={isMobile ? 'sm' : 'md'}>
              {processing ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            <FaCheckCircle className="me-2" /> Approve Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="success" className="mb-0" style={{ borderRadius: '12px' }}>
            Are you sure you want to approve <strong>{getField(selectedService, ['title', 'name', 'serviceName'], 'this service')}</strong>?
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowApproveModal(false)} size={isMobile ? 'sm' : 'md'}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={async () => { 
              const serviceId = getServiceId(selectedService);
              if (!serviceId) return;
              await handleStatusChange(serviceId, 'approved');
            }} 
            disabled={processing}
            size={isMobile ? 'sm' : 'md'}
          >
            {processing ? 'Processing...' : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            <FaTimesCircle className="me-2" /> Reject Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-3" style={{ borderRadius: '12px' }}>
            Are you sure you want to reject <strong>{getField(selectedService, ['title', 'name', 'serviceName'], 'this service')}</strong>?
          </Alert>
          <Form.Group>
            <Form.Label className="fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>Reason for rejection</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={isMobile ? 2 : 3} 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              placeholder="Provide a reason for rejection..."
              size={isMobile ? 'sm' : 'md'}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowRejectModal(false)} size={isMobile ? 'sm' : 'md'}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={async () => { 
              const serviceId = getServiceId(selectedService);
              if (!serviceId) return;
              await handleStatusChange(serviceId, 'rejected', rejectionReason);
              setRejectionReason('');
            }} 
            disabled={!rejectionReason || processing}
            size={isMobile ? 'sm' : 'md'}
          >
            {processing ? 'Processing...' : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            <FaTrash className="me-2" /> Delete Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to delete <strong>{getField(selectedService, ['title', 'name', 'serviceName'], 'this service')}</strong>?
            <p className="mb-0 mt-2 small text-danger">This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} size={isMobile ? 'sm' : 'md'}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteService} disabled={processing} size={isMobile ? 'sm' : 'md'}>
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Management Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            <FaImage className="me-2" /> Manage Images
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Row className="g-2 g-md-3">
            {(selectedService?.images || []).map((img, i) => (
              <Col xs={4} md={3} key={i}>
                <div className="position-relative">
                  <img 
                    src={img} 
                    className="img-fluid rounded" 
                    style={{ height: isMobile ? '100px' : '150px', width: '100%', objectFit: 'cover' }} 
                  />
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="position-absolute top-0 end-0 rounded-circle p-0"
                    style={{ width: '24px', height: '24px', transform: 'translate(50%, -50%)' }}
                  >
                    <FaTrash size={10} />
                  </Button>
                </div>
              </Col>
            ))}
            <Col xs={4} md={3}>
              <div 
                className="border border-2 border-dashed rounded d-flex align-items-center justify-content-center" 
                style={{ height: isMobile ? '100px' : '150px', cursor: 'pointer', background: '#f8fafc' }}
              >
                <div className="text-center">
                  <FaUpload className="text-muted mb-1" size={isMobile ? 16 : 24} />
                  <small className="text-muted d-block" style={{ fontSize: isMobile ? '0.6rem' : '0.8rem' }}>Upload</small>
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowImageModal(false)} size={isMobile ? 'sm' : 'md'}>
            Close
          </Button>
          <Button variant="primary" size={isMobile ? 'sm' : 'md'}>
            <FaSave className="me-2" /> Save Images
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Selected services: <strong className="text-primary">{selectedServices.length}</strong></p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkStatusChange('approved')} className="d-flex align-items-center justify-content-center gap-2" disabled={processing} size={isMobile ? 'sm' : 'md'}>
              <FaCheckCircle /> Approve All
            </Button>
            <Button variant="warning" onClick={() => handleBulkStatusChange('pending')} className="d-flex align-items-center justify-content-center gap-2" disabled={processing} size={isMobile ? 'sm' : 'md'}>
              <FaClock /> Set to Pending
            </Button>
            <Button variant="danger" onClick={() => handleBulkStatusChange('rejected')} className="d-flex align-items-center justify-content-center gap-2" disabled={processing} size={isMobile ? 'sm' : 'md'}>
              <FaTimesCircle /> Reject All
            </Button>
            <Button variant="outline-danger" onClick={handleBulkDelete} className="d-flex align-items-center justify-content-center gap-2" disabled={processing} size={isMobile ? 'sm' : 'md'}>
              <FaTrash /> Delete All
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="secondary" onClick={() => setShowBulkActions(false)} size={isMobile ? 'sm' : 'md'}>
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
          padding: 0.5rem 1rem;
          border-radius: 12px 12px 0 0;
          font-size: 0.85rem;
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
          padding: 12px 16px;
          vertical-align: middle;
        }
        .table tbody tr:hover {
          background-color: #f8fafc;
        }
        .table-active {
          background-color: #e7f1ff !important;
        }
        .min-width-0 {
          min-width: 0;
        }
        @media (max-width: 992px) {
          .table-responsive {
            font-size: 0.8rem;
          }
        }
        @media (max-width: 768px) {
          .nav-tabs .nav-link {
            font-size: 0.7rem;
            padding: 0.3rem 0.6rem;
          }
        }
        @media (max-width: 576px) {
          .container-fluid {
            padding-left: 8px;
            padding-right: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceManagement;