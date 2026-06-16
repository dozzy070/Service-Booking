// src/pages/admin/AdminCategories.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Toast,
  ToastContainer,
  Spinner,
  Alert,
  ProgressBar
} from 'react-bootstrap';
import {
  FaTag,
  FaTags,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEllipsisV,
  FaDownload,
  FaRedo,
  FaSlidersH,
  FaStar,
  FaFire,
  FaServicestack,
  FaMoneyBillWave,
  FaSpinner,
  FaSync,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaImage,
  FaPalette,
  FaHashtag,
  FaLink,
  FaFileAlt,
  FaCog,
  FaChartLine,
  FaUsers,
  FaShoppingCart,
  FaEye as FaEyeIcon,
  FaEdit as FaEditIcon,
  FaPlus as FaPlusIcon,
  FaTrash as FaTrashIcon
} from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [processing, setProcessing] = useState(false);

  // Data State
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    popular: 0,
    totalServices: 0,
    totalRevenue: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '#6366f1',
    image: '',
    parentId: null,
    order: 1,
    status: 'active',
    featured: false,
    popular: false,
    seoTitle: '',
    seoDescription: '',
    metaKeywords: []
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

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminAPI.getCategories();
      setCategories(res.data);
      
      // Calculate stats
      const total = res.data.length;
      const active = res.data.filter(c => c.status === 'active').length;
      const inactive = res.data.filter(c => c.status === 'inactive').length;
      const featured = res.data.filter(c => c.featured).length;
      const popular = res.data.filter(c => c.popular).length;
      const totalServices = res.data.reduce((sum, c) => sum + (c.serviceCount || 0), 0);
      const totalRevenue = res.data.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
      
      setStats({ total, active, inactive, featured, popular, totalServices, totalRevenue });
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Categories refreshed');
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // CRUD operations
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setModalMode('view');
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#6366f1',
      image: category.image || '',
      parentId: category.parentId || null,
      order: category.order || 1,
      status: category.status || 'active',
      featured: category.featured || false,
      popular: category.popular || false,
      seoTitle: category.seoTitle || '',
      seoDescription: category.seoDescription || '',
      metaKeywords: category.metaKeywords || []
    });
    setModalMode('edit');
    setShowCategoryModal(true);
  };

  const handleAddCategory = (parentId = null) => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '#6366f1',
      image: '',
      parentId: parentId,
      order: categories.length + 1,
      status: 'active',
      featured: false,
      popular: false,
      seoTitle: '',
      seoDescription: '',
      metaKeywords: []
    });
    setModalMode('add');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }
    
    setProcessing(true);
    try {
      const payload = { ...formData, slug: formData.slug || generateSlug(formData.name) };
      if (modalMode === 'add') {
        const res = await adminAPI.createCategory(payload);
        setCategories(prev => [...prev, res.data]);
        toast.success('Category added successfully');
      } else if (modalMode === 'edit' && selectedCategory) {
        const res = await adminAPI.updateCategory(selectedCategory.id, payload);
        setCategories(prev => prev.map(c => c.id === res.data.id ? res.data : c));
        toast.success('Category updated successfully');
      }
      setShowCategoryModal(false);
      setSelectedCategory(null);
      await fetchAllData();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    setProcessing(true);
    try {
      await adminAPI.deleteCategory(selectedCategory.id);
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      await fetchAllData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setProcessing(false);
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (status) => {
    if (selectedCategories.length === 0) return;
    
    setProcessing(true);
    try {
      await adminAPI.bulkCategoryAction({ ids: selectedCategories, action: status });
      await fetchAllData();
      setSelectedCategories([]);
      setShowBulkActions(false);
      toast.success(`${selectedCategories.length} categories updated to ${status}`);
    } catch (err) {
      toast.error('Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    setProcessing(true);
    try {
      await adminAPI.bulkDeleteCategories({ ids: selectedCategories });
      await fetchAllData();
      setSelectedCategories([]);
      setShowBulkActions(false);
      toast.success(`${selectedCategories.length} categories deleted`);
    } catch (err) {
      toast.error('Bulk delete failed');
    } finally {
      setProcessing(false);
    }
  };

  // Export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await adminAPI.exportCategories({ format: exportFormat });
      const blob = new Blob([response.data], { 
        type: exportFormat === 'csv' ? 'text/csv' : 
              exportFormat === 'excel' ? 'application/vnd.ms-excel' : 
              'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `categories_export_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'csv' ? 'csv' : exportFormat === 'excel' ? 'xls' : 'json'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Categories exported successfully');
      setShowExportModal(false);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  const handleSelectAll = () => {
    const allIds = categories.map(c => c.id);
    if (selectedCategories.length === allIds.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(allIds);
    }
  };

  const handleSelectCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-muted" />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Filter categories
  const filteredCategories = useMemo(() => {
    let filtered = [...categories];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(term) ||
        (cat.description || '').toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter(cat => cat.status === filterStatus);
    
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'serviceCount' || sortConfig.key === 'totalBookings' || sortConfig.key === 'totalRevenue') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [categories, searchTerm, filterStatus, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'success', icon: <FaCheckCircle />, label: 'Active' },
      inactive: { bg: 'secondary', icon: <FaClock />, label: 'Inactive' }
    };
    const b = badges[status] || badges.inactive;
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
          <p className="mt-3 text-muted">Loading categories...</p>
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
            <h2 className="mb-1 fw-bold">Category Management</h2>
            <p className="text-muted mb-0">Manage service categories and subcategories</p>
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
                <FaDownload /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}>
                  <FaDownload className="me-2 text-success" /> CSV
                </Dropdown.Item>
                <Dropdown.Item onClick={() => { setExportFormat('excel'); setShowExportModal(true); }}>
                  <FaDownload className="me-2 text-success" /> Excel
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button
              variant="primary"
              onClick={() => handleAddCategory()}
              className="d-flex align-items-center gap-2"
            >
              <FaPlus /> Add Category
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
                    <FaTags size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Categories</p>
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
                    <FaCheckCircle size={24} color="#10b981" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Active</p>
                    <h3 className="fw-bold mb-0">{stats.active}</h3>
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
                    <FaStar size={24} color="#f59e0b" />
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
                  <div className="rounded-circle p-3" style={{ background: '#ef444420' }}>
                    <FaFire size={24} color="#ef4444" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Popular</p>
                    <h3 className="fw-bold mb-0">{stats.popular}</h3>
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
                    <FaServicestack size={24} color="#8b5cf6" />
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Services</p>
                    <h3 className="fw-bold mb-0">{stats.totalServices}</h3>
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
                    <p className="text-muted mb-0 small">Revenue</p>
                    <h3 className="fw-bold mb-0">{formatCompactNaira(stats.totalRevenue)}</h3>
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
                <InputGroup.Text className="bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
              <Form.Select
                style={{ width: '150px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
              <Form.Select
                style={{ width: '120px' }}
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
              <Button variant="outline-secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>

            {selectedCategories.length > 0 && (
              <div className="d-flex gap-2 mt-3 pt-3 border-top">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleBulkStatusChange('active')}
                >
                  <FaCheckCircle className="me-2" /> Activate ({selectedCategories.length})
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBulkStatusChange('inactive')}
                >
                  <FaClock className="me-2" /> Deactivate ({selectedCategories.length})
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowBulkActions(true)}
                >
                  <FaTrash className="me-2" /> Delete ({selectedCategories.length})
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Categories Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            {currentCategories.length === 0 ? (
              <div className="text-center py-5">
                <FaTags size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No categories found</h6>
                <Button variant="primary" onClick={() => handleAddCategory()} className="mt-2">
                  <FaPlus className="me-2" /> Add Category
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0" style={{ minWidth: '1000px' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '16px', width: '40px' }}>
                          <Form.Check
                            type="checkbox"
                            checked={selectedCategories.length === categories.length && categories.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                          Category {getSortIcon('name')}
                        </th>
                        <th style={{ padding: '16px' }}>Icon</th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('serviceCount')}>
                          Services {getSortIcon('serviceCount')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('totalBookings')}>
                          Bookings {getSortIcon('totalBookings')}
                        </th>
                        <th style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleSort('totalRevenue')}>
                          Revenue {getSortIcon('totalRevenue')}
                        </th>
                        <th style={{ padding: '16px' }}>Status</th>
                        <th style={{ padding: '16px' }}>Featured</th>
                        <th style={{ padding: '16px' }}>Popular</th>
                        <th style={{ padding: '16px', width: '160px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCategories.map(category => (
                        <tr key={category.id} className={selectedCategories.includes(category.id) ? 'table-active' : ''}>
                          <td style={{ padding: '16px' }}>
                            <Form.Check
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleSelectCategory(category.id)}
                            />
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle"
                                style={{ width: '12px', height: '12px', backgroundColor: category.color || '#6366f1' }}
                              />
                              {category.image && (
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="rounded"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div className="fw-semibold">{category.name}</div>
                                <small className="text-muted">{category.slug}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className="fs-4">{category.icon || '📁'}</span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="fw-semibold">{category.serviceCount || 0}</div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {(category.totalBookings || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span className="fw-semibold text-primary">
                              {formatNaira(category.totalRevenue || 0)}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>{getStatusBadge(category.status)}</td>
                          <td style={{ padding: '16px' }}>
                            {category.featured ? (
                              <FaStar className="text-warning" size={18} />
                            ) : (
                              <FaStar className="text-muted opacity-25" size={18} />
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {category.popular ? (
                              <FaFire className="text-danger" size={18} />
                            ) : (
                              <FaFire className="text-muted opacity-25" size={18} />
                            )}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div className="d-flex gap-1">
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="rounded-circle p-1"
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => handleViewCategory(category)}
                              >
                                <FaEye size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-info"
                                className="rounded-circle p-1"
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => handleEditCategory(category)}
                              >
                                <FaEdit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-success"
                                className="rounded-circle p-1"
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => handleAddCategory(category.id)}
                              >
                                <FaPlus size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                className="rounded-circle p-1"
                                style={{ width: '32px', height: '32px' }}
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <FaTrash size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredCategories.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-4 border-top">
                    <div className="text-muted small">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCategories.length)} of {filteredCategories.length} categories
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

      {/* Category Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {modalMode === 'view' ? <FaEye className="me-2" /> :
             modalMode === 'edit' ? <FaEdit className="me-2" /> :
             <FaPlus className="me-2" />}
            {modalMode === 'view' ? 'Category Details' :
             modalMode === 'edit' ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {modalMode === 'view' && selectedCategory && (
            <div>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: selectedCategory.color || '#6366f1' }}>
                  <span className="fs-2">{selectedCategory.icon || '📁'}</span>
                </div>
                <div>
                  <h5 className="mb-1">{selectedCategory.name}</h5>
                  <div className="text-muted small">{selectedCategory.slug}</div>
                </div>
              </div>
              {selectedCategory.description && (
                <p className="mb-3">{selectedCategory.description}</p>
              )}
              <Row className="g-3">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Statistics</h6>
                    <div className="info-item"><FaServicestack className="text-muted" /> Services: {selectedCategory.serviceCount || 0}</div>
                    <div className="info-item"><FaShoppingCart className="text-muted" /> Bookings: {selectedCategory.totalBookings || 0}</div>
                    <div className="info-item"><FaMoneyBillWave className="text-muted" /> Revenue: {formatNaira(selectedCategory.totalRevenue || 0)}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="fw-bold mb-3">Details</h6>
                    <div className="info-item"><FaTag className="text-muted" /> Status: {getStatusBadge(selectedCategory.status)}</div>
                    <div className="info-item"><FaStar className="text-muted" /> Featured: {selectedCategory.featured ? 'Yes' : 'No'}</div>
                    <div className="info-item"><FaFire className="text-muted" /> Popular: {selectedCategory.popular ? 'Yes' : 'No'}</div>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {(modalMode === 'edit' || modalMode === 'add') && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Name *</Form.Label>
                    <Form.Control
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name,
                          slug: generateSlug(name)
                        });
                      }}
                      placeholder="Enter category name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Slug</Form.Label>
                    <Form.Control
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="URL-friendly name"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the category"
                />
              </Form.Group>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Icon (Emoji)</Form.Label>
                    <Form.Control
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="📁"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Color</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={{ width: '60px', padding: '4px' }}
                      />
                      <Form.Control
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#6366f1"
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Featured Category"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Popular Category"
                      checked={formData.popular}
                      onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowCategoryModal(false)}>
            Close
          </Button>
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Button variant="primary" onClick={handleSaveCategory} disabled={processing}>
              {processing ? 'Saving...' : (modalMode === 'edit' ? 'Update' : 'Create')}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaExclamationTriangle className="me-2" /> Delete Category
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?
            <p className="mb-0 mt-2 small text-danger">This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCategory} disabled={processing}>
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Selected categories: <strong className="text-primary">{selectedCategories.length}</strong></p>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={() => handleBulkStatusChange('active')}>
              <FaCheckCircle className="me-2" /> Activate All
            </Button>
            <Button variant="secondary" onClick={() => handleBulkStatusChange('inactive')}>
              <FaClock className="me-2" /> Deactivate All
            </Button>
            <Button variant="danger" onClick={handleBulkDelete}>
              <FaTrash className="me-2" /> Delete All
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowBulkActions(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaDownload className="me-2" /> Export Categories
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <p className="mb-4">Exporting <strong>{categories.length}</strong> categories as <strong>{exportFormat.toUpperCase()}</strong></p>
          {isExporting && (
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
          <Button variant="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export Now'}
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
        .table tbody tr:hover {
          background-color: #f8fafc;
        }
        .table-active {
          background-color: #e7f1ff !important;
        }
      `}</style>
    </div>
  );
};

export default AdminCategories;