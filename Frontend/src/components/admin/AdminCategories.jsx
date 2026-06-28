// src/pages/admin/AdminCategories.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

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

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

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

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch categories from real API
  const fetchCategories = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!adminAPI || typeof adminAPI.getCategories !== 'function') {
        throw new Error('API service not available');
      }

      const params = {
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        limit: itemsPerPage,
        page: currentPage
      };

      const response = await adminAPI.getCategories(params);
      
      let data = response?.data || [];
      let total = 0;
      
      if (Array.isArray(data)) {
        setCategories(data);
        total = data.length;
      } else if (data.categories) {
        setCategories(data.categories);
        total = data.total || data.categories.length;
      } else if (data.data) {
        setCategories(data.data);
        total = data.total || data.data.length;
      } else {
        setCategories([]);
        total = 0;
      }
      
      setTotalCount(total);
      calculateStats(data.categories || data.data || data || []);
      
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load categories');
      setCategories([]);
      setTotalCount(0);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        featured: 0,
        popular: 0,
        totalServices: 0,
        totalRevenue: 0
      });
      
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load categories');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filterStatus, sortConfig, itemsPerPage, currentPage]);

  // Calculate stats with safety
  const calculateStats = (categoryList) => {
    const list = Array.isArray(categoryList) ? categoryList : [];
    
    if (list.length === 0) {
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        featured: 0,
        popular: 0,
        totalServices: 0,
        totalRevenue: 0
      });
      return;
    }
    
    const newStats = {
      total: list.length,
      active: list.filter(c => c?.status?.toLowerCase() === 'active').length,
      inactive: list.filter(c => c?.status?.toLowerCase() === 'inactive').length,
      featured: list.filter(c => c?.featured === true).length,
      popular: list.filter(c => c?.popular === true).length,
      totalServices: list.reduce((sum, c) => sum + (parseInt(c?.serviceCount) || 0), 0),
      totalRevenue: list.reduce((sum, c) => sum + (parseFloat(c?.totalRevenue) || 0), 0)
    };
    setStats(newStats);
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await fetchCategories(true);
  }, [fetchCategories]);

  // Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    toast.success('Categories refreshed');
  };

  // Initial data load
  useEffect(() => {
    fetchAllData();
    startPolling();
    return () => stopPolling();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchCategories(false);
    }
  }, [searchTerm, filterStatus, sortConfig, itemsPerPage, currentPage]);

  // Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchCategories(false).finally(() => {
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // CRUD operations with real API
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setModalMode('view');
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
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
      if (!adminAPI) {
        throw new Error('API service not available');
      }
      
      const payload = { 
        ...formData, 
        slug: formData.slug || generateSlug(formData.name) 
      };
      
      let response;
      if (modalMode === 'add') {
        if (typeof adminAPI.createCategory !== 'function') {
          throw new Error('Create category API not available');
        }
        response = await adminAPI.createCategory(payload);
        toast.success('Category added successfully');
      } else if (modalMode === 'edit' && selectedCategory) {
        const categoryId = selectedCategory.id || selectedCategory._id;
        if (!categoryId) {
          throw new Error('Category ID not found');
        }
        if (typeof adminAPI.updateCategory !== 'function') {
          throw new Error('Update category API not available');
        }
        response = await adminAPI.updateCategory(categoryId, payload);
        toast.success('Category updated successfully');
      }
      
      setShowCategoryModal(false);
      setSelectedCategory(null);
      await fetchAllData();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    const categoryId = selectedCategory.id || selectedCategory._id;
    if (!categoryId) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.deleteCategory !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      await fetchAllData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setProcessing(false);
    }
  };

  // Bulk actions with real API
  const handleBulkStatusChange = async (status) => {
    if (selectedCategories.length === 0) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.bulkCategoryAction !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.bulkCategoryAction({ 
        ids: selectedCategories, 
        action: status 
      });
      
      await fetchAllData();
      setSelectedCategories([]);
      setShowBulkActions(false);
      toast.success(`${selectedCategories.length} categories updated to ${status}`);
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error(error.message || 'Bulk update failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;
    
    setProcessing(true);
    try {
      if (!adminAPI || typeof adminAPI.bulkDeleteCategories !== 'function') {
        throw new Error('API service not available');
      }
      
      await adminAPI.bulkDeleteCategories({ ids: selectedCategories });
      await fetchAllData();
      setSelectedCategories([]);
      setShowBulkActions(false);
      toast.success(`${selectedCategories.length} categories deleted`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.message || 'Bulk delete failed');
    } finally {
      setProcessing(false);
    }
  };

  // Export with real API
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!adminAPI || typeof adminAPI.exportCategories !== 'function') {
        throw new Error('Export API not available');
      }
      
      const response = await adminAPI.exportCategories({ 
        format: exportFormat,
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      
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
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Export failed');
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
    const allIds = categories.map(c => c.id || c._id).filter(Boolean);
    if (selectedCategories.length === allIds.length && allIds.length > 0) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(allIds);
    }
  };

  const handleSelectCategory = (id) => {
    if (!id) return;
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

  // Filter categories (already filtered by API, but we keep client-side filtering for safety)
  const filteredCategories = useMemo(() => {
    let filtered = [...categories];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name?.toLowerCase().includes(term) ||
        cat.description?.toLowerCase().includes(term) ||
        cat.slug?.toLowerCase().includes(term)
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cat => cat.status?.toLowerCase() === filterStatus);
    }
    
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';
      
      if (sortConfig.key === 'serviceCount' || sortConfig.key === 'totalBookings' || sortConfig.key === 'totalRevenue') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
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
    if (!status) {
      return (
        <Badge bg="secondary" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
          <FaInfoCircle />
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const badges = {
      active: { bg: 'success', icon: <FaCheckCircle />, label: 'Active' },
      inactive: { bg: 'secondary', icon: <FaClock />, label: 'Inactive' }
    };
    const b = badges[lowerStatus] || badges.inactive;
    return (
      <Badge bg={b.bg} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        {b.icon}
        <span className="ms-1">{b.label}</span>
      </Badge>
    );
  };

  // Get category ID safely
  const getCategoryId = (category) => {
    return category?.id || category?._id || null;
  };

  // Loading state removed - component renders immediately with empty data

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={styles.alert}>
            <FaExclamationTriangle className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchCategories(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Category Management</h2>
            <p style={styles.headerSubtitle}>Manage service categories and subcategories</p>
          </div>
          <div style={styles.headerActions}>
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
              style={styles.refreshBtn}
            >
              <FaSync className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2" style={styles.exportBtn}>
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
              style={styles.addBtn}
            >
              <FaPlus /> Add Category
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row style={styles.statsRow}>
          {[
            { key: 'total', icon: FaTags, label: 'Total Categories', value: stats.total, color: '#3b82f6', bg: '#3b82f620' },
            { key: 'active', icon: FaCheckCircle, label: 'Active', value: stats.active, color: '#10b981', bg: '#10b98120' },
            { key: 'featured', icon: FaStar, label: 'Featured', value: stats.featured, color: '#f59e0b', bg: '#f59e0b20' },
            { key: 'popular', icon: FaFire, label: 'Popular', value: stats.popular, color: '#ef4444', bg: '#ef444420' },
            { key: 'services', icon: FaServicestack, label: 'Services', value: stats.totalServices, color: '#8b5cf6', bg: '#8b5cf620' },
            { key: 'revenue', icon: FaMoneyBillWave, label: 'Revenue', value: formatCompactNaira(stats.totalRevenue), color: '#10b981', bg: '#10b98120' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Col xl={2} lg={4} md={6} key={idx}>
                <Card style={styles.statCard}>
                  <Card.Body style={styles.statCardBody}>
                    <div style={{ ...styles.statIconWrapper, background: item.bg, color: item.color }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p style={styles.statLabel}>{item.label}</p>
                      <h3 style={styles.statValue}>{item.value}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Filters */}
        <Card style={styles.filtersCard}>
          <Card.Body style={styles.filtersCardBody}>
            <div style={styles.filtersWrapper}>
              <div style={styles.filtersGroup}>
                <InputGroup style={styles.searchInput}>
                  <InputGroup.Text style={styles.searchInputText}>
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInputControl}
                  />
                </InputGroup>
                <Form.Select
                  style={styles.filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
                <Form.Select
                  style={styles.filterSelect}
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Form.Select>
                <Button variant="outline-secondary" onClick={resetFilters} style={styles.resetBtn}>
                  Reset
                </Button>
              </div>
            </div>

            {selectedCategories.length > 0 && (
              <div style={styles.bulkActions}>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleBulkStatusChange('active')}
                  disabled={processing}
                >
                  <FaCheckCircle className="me-2" /> Activate ({selectedCategories.length})
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBulkStatusChange('inactive')}
                  disabled={processing}
                >
                  <FaClock className="me-2" /> Deactivate ({selectedCategories.length})
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowBulkActions(true)}
                  disabled={processing}
                >
                  <FaTrash className="me-2" /> Delete ({selectedCategories.length})
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Categories Table */}
        <Card style={styles.tableCard}>
          <Card.Body style={styles.tableCardBody}>
            {currentCategories.length === 0 ? (
              <div style={styles.emptyState}>
                <FaTags size={48} style={styles.emptyIcon} />
                <h6 style={styles.emptyTitle}>No categories found</h6>
                {!error && (
                  <Button variant="primary" onClick={() => handleAddCategory()} style={styles.emptyBtn}>
                    <FaPlus className="me-2" /> Add Category
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={styles.tableCheckbox}>
                          <Form.Check
                            type="checkbox"
                            checked={selectedCategories.length === categories.length && categories.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('name')}>
                          Category {getSortIcon('name')}
                        </th>
                        <th style={styles.tableHeader}>Icon</th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('serviceCount')}>
                          Services {getSortIcon('serviceCount')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('totalBookings')}>
                          Bookings {getSortIcon('totalBookings')}
                        </th>
                        <th style={{ ...styles.tableHeader, cursor: 'pointer' }} onClick={() => handleSort('totalRevenue')}>
                          Revenue {getSortIcon('totalRevenue')}
                        </th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Featured</th>
                        <th style={styles.tableHeader}>Popular</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCategories.map(category => {
                        const categoryId = getCategoryId(category);
                        return (
                          <tr key={categoryId} className={selectedCategories.includes(categoryId) ? 'table-active' : ''} style={styles.tableRow}>
                            <td style={styles.tableCell}>
                              <Form.Check
                                type="checkbox"
                                checked={selectedCategories.includes(categoryId)}
                                onChange={() => handleSelectCategory(categoryId)}
                              />
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.categoryCell}>
                                <div
                                  className="rounded-circle"
                                  style={{ width: '12px', height: '12px', backgroundColor: category.color || '#6366f1' }}
                                />
                                {category.image && (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="rounded"
                                    style={styles.categoryImage}
                                  />
                                )}
                                <div>
                                  <div style={styles.categoryName}>{category.name || 'Unnamed'}</div>
                                  <small style={styles.categorySlug}>{category.slug || ''}</small>
                                </div>
                              </div>
                            </td>
                            <td style={styles.tableCell}>
                              <span style={styles.categoryIcon}>{category.icon || '📁'}</span>
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.categoryCount}>{category.serviceCount || 0}</div>
                            </td>
                            <td style={styles.tableCell}>
                              {(category.totalBookings || 0).toLocaleString()}
                            </td>
                            <td style={styles.tableCell}>
                              <span style={styles.categoryRevenue}>
                                {formatNaira(category.totalRevenue || 0)}
                              </span>
                            </td>
                            <td style={styles.tableCell}>{getStatusBadge(category.status)}</td>
                            <td style={styles.tableCell}>
                              {category.featured ? (
                                <FaStar className="text-warning" size={18} />
                              ) : (
                                <FaStar className="text-muted opacity-25" size={18} />
                              )}
                            </td>
                            <td style={styles.tableCell}>
                              {category.popular ? (
                                <FaFire className="text-danger" size={18} />
                              ) : (
                                <FaFire className="text-muted opacity-25" size={18} />
                              )}
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.actionButtons}>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  className="rounded-circle p-1"
                                  style={styles.actionBtn}
                                  onClick={() => handleViewCategory(category)}
                                >
                                  <FaEye size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  className="rounded-circle p-1"
                                  style={styles.actionBtn}
                                  onClick={() => handleEditCategory(category)}
                                >
                                  <FaEdit size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  className="rounded-circle p-1"
                                  style={styles.actionBtn}
                                  onClick={() => handleAddCategory(categoryId)}
                                >
                                  <FaPlus size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  className="rounded-circle p-1"
                                  style={styles.actionBtn}
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
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {filteredCategories.length > 0 && (
                  <div style={styles.paginationWrapper}>
                    <div style={styles.paginationInfo}>
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCategories.length)} of {filteredCategories.length} categories
                    </div>
                    <Pagination style={styles.pagination}>
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
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            {modalMode === 'view' ? <FaEye className="me-2" /> :
             modalMode === 'edit' ? <FaEdit className="me-2" /> :
             <FaPlus className="me-2" />}
            {modalMode === 'view' ? 'Category Details' :
             modalMode === 'edit' ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          {modalMode === 'view' && selectedCategory && (
            <div>
              <div style={styles.viewCategoryHeader}>
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ ...styles.viewCategoryAvatar, backgroundColor: selectedCategory.color || '#6366f1' }}>
                  <span className="fs-2">{selectedCategory.icon || '📁'}</span>
                </div>
                <div>
                  <h5 style={styles.viewCategoryName}>{selectedCategory.name}</h5>
                  <div style={styles.viewCategorySlug}>{selectedCategory.slug}</div>
                </div>
              </div>
              {selectedCategory.description && (
                <p style={styles.viewCategoryDesc}>{selectedCategory.description}</p>
              )}
              <Row style={styles.viewCategoryRow}>
                <Col md={6}>
                  <div style={styles.infoSection}>
                    <h6 style={styles.infoTitle}>Statistics</h6>
                    <div style={styles.infoItem}><FaServicestack className="text-muted" /> Services: {selectedCategory.serviceCount || 0}</div>
                    <div style={styles.infoItem}><FaShoppingCart className="text-muted" /> Bookings: {selectedCategory.totalBookings || 0}</div>
                    <div style={styles.infoItem}><FaMoneyBillWave className="text-muted" /> Revenue: {formatNaira(selectedCategory.totalRevenue || 0)}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div style={styles.infoSection}>
                    <h6 style={styles.infoTitle}>Details</h6>
                    <div style={styles.infoItem}><FaTag className="text-muted" /> Status: {getStatusBadge(selectedCategory.status)}</div>
                    <div style={styles.infoItem}><FaStar className="text-muted" /> Featured: {selectedCategory.featured ? 'Yes' : 'No'}</div>
                    <div style={styles.infoItem}><FaFire className="text-muted" /> Popular: {selectedCategory.popular ? 'Yes' : 'No'}</div>
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
                    <Form.Label style={styles.formLabel}>Name *</Form.Label>
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
                      style={styles.formControl}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={styles.formLabel}>Slug</Form.Label>
                    <Form.Control
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="URL-friendly name"
                      style={styles.formControl}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label style={styles.formLabel}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the category"
                  style={styles.formTextarea}
                />
              </Form.Group>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label style={styles.formLabel}>Icon (Emoji)</Form.Label>
                    <Form.Control
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="📁"
                      style={styles.formControl}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label style={styles.formLabel}>Color</Form.Label>
                    <div style={styles.colorPickerWrapper}>
                      <Form.Control
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={styles.colorPicker}
                      />
                      <Form.Control
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#6366f1"
                        style={styles.colorInput}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label style={styles.formLabel}>Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={styles.formControl}
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
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowCategoryModal(false)} style={styles.modalCancelBtn}>
            Close
          </Button>
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Button variant="primary" onClick={handleSaveCategory} disabled={processing} style={styles.modalSubmitBtn}>
              {processing ? 'Saving...' : (modalMode === 'edit' ? 'Update' : 'Create')}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeaderDanger}>
          <Modal.Title style={styles.modalTitleDanger}>
            <FaExclamationTriangle className="me-2" /> Delete Category
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Alert variant="danger" style={styles.deleteAlert}>
            Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?
            <p style={styles.deleteWarning}>This action cannot be undone.</p>
          </Alert>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowDeleteModal(false)} style={styles.modalCancelBtn}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCategory} disabled={processing} style={styles.modalDeleteBtn}>
            {processing ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>Bulk Actions</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.bulkText}>Selected categories: <strong className="text-primary">{selectedCategories.length}</strong></p>
          <div style={styles.bulkActionsGrid}>
            <Button variant="success" onClick={() => handleBulkStatusChange('active')} disabled={processing}>
              <FaCheckCircle className="me-2" /> Activate All
            </Button>
            <Button variant="secondary" onClick={() => handleBulkStatusChange('inactive')} disabled={processing}>
              <FaClock className="me-2" /> Deactivate All
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={processing}>
              <FaTrash className="me-2" /> Delete All
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowBulkActions(false)} style={styles.modalCancelBtn}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            <FaDownload className="me-2" /> Export Categories
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.exportText}>Exporting <strong>{categories.length}</strong> categories as <strong>{exportFormat.toUpperCase()}</strong></p>
          {isExporting && (
            <div style={styles.exportLoading}>
              <Spinner animation="border" variant="primary" />
              <p style={styles.exportLoadingText}>Generating export...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowExportModal(false)} style={styles.modalCancelBtn}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting} style={styles.modalSubmitBtn}>
            {isExporting ? 'Exporting...' : 'Export Now'}
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
  alert: {
    borderRadius: '12px'
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
    gap: '12px',
    flexWrap: 'wrap'
  },
  refreshBtn: {
    borderRadius: '12px',
    padding: '10px 20px'
  },
  exportBtn: {
    borderRadius: '12px',
    padding: '10px 20px'
  },
  addBtn: {
    borderRadius: '12px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none'
  },
  statsRow: {
    marginBottom: '28px',
    gap: '16px'
  },
  statCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%',
    transition: 'all 0.3s ease'
  },
  statCardBody: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
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
    fontSize: '24px'
  },
  filtersCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden'
  },
  filtersCardBody: {
    padding: '20px 24px'
  },
  filtersWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center'
  },
  filtersGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    flex: 1
  },
  searchInput: {
    maxWidth: '300px',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  searchInputText: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRight: 'none'
  },
  searchInputControl: {
    border: '1px solid #e2e8f0',
    borderLeft: 'none',
    borderRadius: '0 12px 12px 0',
    padding: '10px 16px'
  },
  filterSelect: {
    width: '150px',
    borderRadius: '12px',
    padding: '10px 16px'
  },
  resetBtn: {
    borderRadius: '12px',
    padding: '10px 16px'
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  tableCard: {
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  tableCardBody: {
    padding: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyIcon: {
    color: '#cbd5e0',
    marginBottom: '16px',
    opacity: 0.5
  },
  emptyTitle: {
    color: '#4a5568',
    marginBottom: '16px',
    fontWeight: '500'
  },
  emptyBtn: {
    borderRadius: '12px',
    padding: '8px 20px'
  },
  table: {
    minWidth: '1000px',
    marginBottom: 0
  },
  tableHead: {
    background: '#f8fafc'
  },
  tableHeader: {
    padding: '16px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  tableCheckbox: {
    padding: '16px 12px',
    width: '40px'
  },
  tableRow: {
    transition: 'background 0.2s'
  },
  tableCell: {
    padding: '16px 12px',
    verticalAlign: 'middle'
  },
  categoryCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  categoryImage: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '10px'
  },
  categoryName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c'
  },
  categorySlug: {
    color: '#718096',
    fontSize: '12px'
  },
  categoryIcon: {
    fontSize: '24px'
  },
  categoryCount: {
    fontWeight: '600',
    fontSize: '14px'
  },
  categoryRevenue: {
    fontWeight: '600',
    color: '#6366f1'
  },
  actionButtons: {
    display: 'flex',
    gap: '4px'
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '12px'
  },
  paginationInfo: {
    color: '#718096',
    fontSize: '14px'
  },
  pagination: {
    marginBottom: 0
  },
  modalHeader: {
    borderBottom: 'none',
    padding: '20px 24px 0'
  },
  modalHeaderDanger: {
    borderBottom: 'none',
    padding: '20px 24px 0'
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#1a202c'
  },
  modalTitleDanger: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#ef4444'
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
    border: 'none'
  },
  modalDeleteBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
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
  formTextarea: {
    borderRadius: '10px',
    padding: '10px 14px',
    resize: 'vertical'
  },
  colorPickerWrapper: {
    display: 'flex',
    gap: '8px'
  },
  colorPicker: {
    width: '60px',
    padding: '4px',
    borderRadius: '10px'
  },
  colorInput: {
    flex: 1,
    borderRadius: '10px',
    padding: '10px 14px'
  },
  deleteAlert: {
    borderRadius: '12px'
  },
  deleteWarning: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#ef4444'
  },
  bulkActionsGrid: {
    display: 'grid',
    gap: '8px'
  },
  bulkText: {
    marginBottom: '16px'
  },
  exportText: {
    marginBottom: '16px'
  },
  exportLoading: {
    textAlign: 'center',
    padding: '20px 0'
  },
  exportLoadingText: {
    marginTop: '8px',
    color: '#718096',
    fontSize: '14px'
  },
  viewCategoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  },
  viewCategoryAvatar: {
    width: '60px',
    height: '60px'
  },
  viewCategoryName: {
    fontWeight: '600',
    marginBottom: '2px'
  },
  viewCategorySlug: {
    color: '#718096',
    fontSize: '14px'
  },
  viewCategoryDesc: {
    marginBottom: '20px'
  },
  viewCategoryRow: {
    gap: '16px'
  },
  infoSection: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '12px'
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#1a202c'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  globalStyles: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin { animation: spin 1s linear infinite; }
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
    }
  `
};

export default AdminCategories;