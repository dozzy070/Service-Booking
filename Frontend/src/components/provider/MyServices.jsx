// src/components/provider/MyServices.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Modal,
  Form,
  Alert,
  Spinner,
  Tabs,
  Tab,
  ProgressBar,
  Pagination
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  Clock,
  Tag,
  Power,
  PowerOff,
  Star,
  Users,
  Calendar,
  Image,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  BarChart2,
  Shield,
  Gift,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const MyServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    duration: '',
    features: [],
    image_url: '',
    is_featured: false
  });

  const [featureInput, setFeatureInput] = useState('');

  const itemsPerPage = 10;

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

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch services from real API
  const fetchServices = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchTerm || undefined
      };

      let response = null;
      
      if (typeof providerAPI.getServices === 'function') {
        response = await providerAPI.getServices(params);
      } else if (typeof providerAPI.getProviderServices === 'function') {
        response = await providerAPI.getProviderServices(params);
      } else {
        throw new Error('Services API methods not available');
      }

      const data = response?.data || response || {};
      const servicesData = data.services || data.data || [];
      
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setTotalCount(data.total || servicesData.length || 0);
      setTotalPages(Math.ceil((data.total || servicesData.length || 0) / itemsPerPage));
      
    } catch (error) {
      console.error('Error fetching services:', error);
      setError(error.message || 'Failed to load services');
      setServices([]);
      setTotalCount(0);
      setTotalPages(1);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load services');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, activeTab, searchTerm]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchServices(false);
    toast.success('Services updated');
  };

  // Polling functions for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchServices(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000); // Poll every 30 seconds
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
    fetchServices(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchServices(false);
    }
  }, [currentPage, activeTab, searchTerm]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()]
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (feature) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f !== feature)
    });
  };

  // Handle image upload with real API
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataImg = new FormData();
    formDataImg.append('image', file);

    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof providerAPI.uploadServiceImage === 'function') {
        response = await providerAPI.uploadServiceImage(formDataImg);
      } else if (typeof providerAPI.uploadImage === 'function') {
        response = await providerAPI.uploadImage(formDataImg);
      } else {
        throw new Error('Image upload API methods not available');
      }

      const data = response?.data || {};
      const imageUrl = data.url || data.image_url || data.imageUrl;
      setFormData({ ...formData, image_url: imageUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle save service with real API
  const handleSaveService = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const serviceData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: formData.duration,
        features: formData.features,
        image_url: formData.image_url,
        is_featured: formData.is_featured
      };

      let response = null;
      
      if (editingService) {
        const serviceId = editingService.id || editingService._id;
        if (!serviceId) {
          throw new Error('Service ID not found');
        }
        if (typeof providerAPI.updateService === 'function') {
          response = await providerAPI.updateService(serviceId, serviceData);
        } else if (typeof providerAPI.editService === 'function') {
          response = await providerAPI.editService(serviceId, serviceData);
        } else {
          throw new Error('Update service API methods not available');
        }
        toast.success('Service updated successfully');
      } else {
        if (typeof providerAPI.createService === 'function') {
          response = await providerAPI.createService(serviceData);
        } else if (typeof providerAPI.addService === 'function') {
          response = await providerAPI.addService(serviceData);
        } else {
          throw new Error('Create service API methods not available');
        }
        toast.success('Service created successfully');
      }
      
      setShowModal(false);
      setEditingService(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        price: '',
        duration: '',
        features: [],
        image_url: '',
        is_featured: false
      });
      setFeatureInput('');
      await fetchServices(false);
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete service with real API
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    const serviceId = serviceToDelete.id || serviceToDelete._id;
    if (!serviceId) return;

    setDeleting(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      if (typeof providerAPI.deleteService === 'function') {
        await providerAPI.deleteService(serviceId);
      } else if (typeof providerAPI.removeService === 'function') {
        await providerAPI.removeService(serviceId);
      } else {
        throw new Error('Delete service API methods not available');
      }
      
      toast.success('Service deleted successfully');
      setShowDeleteModal(false);
      setServiceToDelete(null);
      await fetchServices(false);
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(error.message || 'Failed to delete service');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle service status with real API
  const toggleStatus = async (service) => {
    const serviceId = service.id || service._id;
    if (!serviceId) return;
    
    const newStatus = service.status === 'active' ? 'inactive' : 'active';
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = { status: newStatus };
      
      if (typeof providerAPI.updateService === 'function') {
        await providerAPI.updateService(serviceId, payload);
      } else if (typeof providerAPI.updateServiceStatus === 'function') {
        await providerAPI.updateServiceStatus(serviceId, newStatus);
      } else {
        throw new Error('Update service status API methods not available');
      }
      
      toast.success(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      await fetchServices(false);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.message || 'Failed to update service status');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      category: service.category || '',
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || '',
      features: service.features || [],
      image_url: service.image_url || service.image || '',
      is_featured: service.is_featured || false
    });
    setShowModal(true);
  };

  // Calculate stats from services data
  const stats = {
    total: services.length,
    active: services.filter(s => s.status?.toLowerCase() === 'active').length,
    inactive: services.filter(s => s.status?.toLowerCase() === 'inactive').length,
    totalBookings: services.reduce((sum, s) => sum + (parseInt(s.total_bookings) || parseInt(s.bookings) || 0), 0),
    averageRating: services.reduce((sum, s) => sum + (parseFloat(s.rating) || 0), 0) / (services.length || 1),
    totalRevenue: services.reduce((sum, s) => sum + ((parseInt(s.total_bookings) || parseInt(s.bookings) || 0) * (parseFloat(s.price) || 0)), 0)
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return <Badge bg="secondary" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill"><PowerOff size={12} /> Unknown</Badge>;
    }
    if (status.toLowerCase() === 'active') {
      return <Badge bg="success" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill"><Power size={12} /> Active</Badge>;
    }
    return <Badge bg="secondary" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill"><PowerOff size={12} /> Inactive</Badge>;
  };

  const getRatingStars = (rating) => {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    return (
      <div className="d-flex align-items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < fullStars || (i === fullStars && hasHalfStar) ? '#fbbf24' : 'none'}
            color={i < fullStars || (i === fullStars && hasHalfStar) ? '#fbbf24' : '#e2e8f0'}
          />
        ))}
        <span className="ms-1 small fw-medium">{numRating.toFixed(1)}</span>
      </div>
    );
  };

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <AlertCircle size={18} className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchServices(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">My Services</h2>
            <p className="text-muted mb-0">Manage your service offerings and pricing</p>
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
              variant="success"
              onClick={() => {
                setEditingService(null);
                setFormData({
                  name: '',
                  category: '',
                  description: '',
                  price: '',
                  duration: '',
                  features: [],
                  image_url: '',
                  is_featured: false
                });
                setFeatureInput('');
                setShowModal(true);
              }}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={18} />
              Add Service
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4 g-4">
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Services</p>
                    <h2 className="fw-bold mb-0">{stats.total}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#3b82f620' }}>
                    <Tag size={24} color="#3b82f6" />
                  </div>
                </div>
                <div className="mt-3 d-flex gap-2">
                  <Badge bg="success" className="rounded-pill">{stats.active} Active</Badge>
                  <Badge bg="secondary" className="rounded-pill">{stats.inactive} Inactive</Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Bookings</p>
                    <h2 className="fw-bold mb-0">{stats.totalBookings}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#f59e0b20' }}>
                    <Calendar size={24} color="#f59e0b" />
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">All-time service bookings</small>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Average Rating</p>
                    <h2 className="fw-bold mb-0">{stats.averageRating.toFixed(1)}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <Star size={24} color="#10b981" />
                  </div>
                </div>
                <div className="mt-2">{getRatingStars(stats.averageRating)}</div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-1">Total Revenue</p>
                    <h2 className="fw-bold mb-0">{formatCompactNaira(stats.totalRevenue)}</h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ background: '#10b98120' }}>
                    <DollarSign size={24} color="#10b981" />
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-success d-flex align-items-center gap-1">
                    <TrendingUp size={12} /> +12% from last month
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search and Filter Bar */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <div className="position-relative">
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <Form.Control
                    type="text"
                    placeholder="Search services by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '38px', borderRadius: '10px' }}
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex gap-2">
                  <Button
                    variant={activeTab === 'all' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('all')}
                    className="rounded-pill px-3"
                  >
                    All
                  </Button>
                  <Button
                    variant={activeTab === 'active' ? 'success' : 'light'}
                    onClick={() => setActiveTab('active')}
                    className="rounded-pill px-3"
                  >
                    Active
                  </Button>
                  <Button
                    variant={activeTab === 'inactive' ? 'secondary' : 'light'}
                    onClick={() => setActiveTab('inactive')}
                    className="rounded-pill px-3"
                  >
                    Inactive
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Services Grid/Table */}
        {services.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '20px' }}>
            <Card.Body>
              <Tag size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No services found</h6>
              <p className="text-muted small">Get started by adding your first service</p>
              <Button
                variant="success"
                onClick={() => {
                  setEditingService(null);
                  setFormData({
                    name: '',
                    category: '',
                    description: '',
                    price: '',
                    duration: '',
                    features: [],
                    image_url: '',
                    is_featured: false
                  });
                  setShowModal(true);
                }}
              >
                <Plus size={16} className="me-2" />
                Add Service
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '16px' }}>Service</th>
                    <th style={{ padding: '16px' }}>Category</th>
                    <th style={{ padding: '16px' }}>Price</th>
                    <th style={{ padding: '16px' }}>Duration</th>
                    <th style={{ padding: '16px' }}>Bookings</th>
                    <th style={{ padding: '16px' }}>Rating</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => {
                    const serviceId = service.id || service._id;
                    const name = getField(service, ['name', 'title', 'service_name'], 'Unnamed Service');
                    const category = getField(service, ['category', 'categoryName', 'category_name'], 'Uncategorized');
                    const description = getField(service, ['description', 'short_description', 'desc'], '');
                    const price = parseFloat(service.price) || 0;
                    const duration = getField(service, ['duration', 'estimated_duration', 'time_required'], 'N/A');
                    const bookings = parseInt(service.total_bookings) || parseInt(service.bookings) || 0;
                    const rating = parseFloat(service.rating) || 0;
                    const reviews = parseInt(service.total_reviews) || parseInt(service.reviews) || 0;
                    const status = getField(service, ['status', 'service_status'], 'inactive');
                    const imageUrl = getField(service, ['image_url', 'image', 'featured_image'], '');

                    return (
                      <tr key={serviceId}>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-3">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={name} 
                                style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: '#e2e8f0' }}>
                                <Tag size={20} className="text-muted" />
                              </div>
                            )}
                            <div>
                              <div className="fw-bold">{name}</div>
                              {description && <small className="text-muted">{description.substring(0, 50)}...</small>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Badge bg="light" text="dark" className="rounded-pill px-3 py-2">
                            {category}
                          </Badge>
                        </td>
                        <td style={{ padding: '16px' }} className="fw-bold text-primary">
                          {formatNaira(price)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <Clock size={14} className="text-muted" />
                            <span>{duration}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-1">
                            <Users size={14} className="text-muted" />
                            <span>{bookings}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-2">
                            {getRatingStars(rating)}
                            <small className="text-muted">({reviews})</small>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>{getStatusBadge(status)}</td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleEdit(service)}
                              style={{ borderRadius: '8px' }}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => toggleStatus(service)}
                              style={{ borderRadius: '8px' }}
                            >
                              {status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                setServiceToDelete(service);
                                setShowDeleteModal(true);
                              }}
                              style={{ borderRadius: '8px' }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center p-4 border-top">
                <Pagination>
                  <Pagination.Prev
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Add/Edit Service Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Label className="fw-semibold">Service Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter service name"
                />
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">Category *</Form.Label>
                <Form.Select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="">Select category</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Painting">Painting</option>
                  <option value="Gardening">Gardening</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Moving">Moving</option>
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">Price (₦) *</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  min="0"
                  step="100"
                />
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">Duration</Form.Label>
                <Form.Select name="duration" value={formData.duration} onChange={handleInputChange}>
                  <option value="">Select duration</option>
                  <option value="30 mins">30 mins</option>
                  <option value="1 hour">1 hour</option>
                  <option value="2 hours">2 hours</option>
                  <option value="3 hours">3 hours</option>
                  <option value="4 hours">4 hours</option>
                  <option value="Full day">Full day</option>
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="fw-semibold">Service Image</Form.Label>
                <div className="d-flex gap-2 align-items-start">
                  {formData.image_url && (
                    <div className="position-relative">
                      <img 
                        src={formData.image_url} 
                        alt="Service" 
                        style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                      <Button
                        size="sm"
                        variant="link"
                        className="position-absolute top-0 end-0 p-0"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                      >
                        <X size={14} className="text-danger" />
                      </Button>
                    </div>
                  )}
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </div>
                {uploadingImage && <Spinner as="span" animation="border" size="sm" className="mt-2" />}
              </Col>
            </Row>

            <div className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your service..."
              />
            </div>

            <div className="mb-3">
              <Form.Label className="fw-semibold">Key Features</Form.Label>
              <div className="d-flex gap-2 mb-2">
                <Form.Control
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature (e.g., Free estimate)"
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button variant="outline-primary" onClick={addFeature}>
                  <Plus size={16} />
                </Button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {formData.features.map((feature, idx) => (
                  <Badge key={idx} bg="light" text="dark" className="d-flex align-items-center gap-1 px-3 py-2">
                    {feature}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeFeature(feature)} />
                  </Badge>
                ))}
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Feature this service (appears on homepage)"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSaveService}
            disabled={saving}
          >
            {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <Trash2 size={18} className="me-2" />
            Delete Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <AlertCircle size={18} className="me-2" />
            Are you sure you want to delete "{serviceToDelete ? getField(serviceToDelete, ['name', 'title', 'service_name'], 'this service') : ''}"? This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteService} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Service'}
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
      `}</style>
    </div>
  );
};

export default MyServices;