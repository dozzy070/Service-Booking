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
  ToastContainer
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
  FaSpinner
} from 'react-icons/fa';
import api from '../../api';

const AdminCategories = () => {
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
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

  // Data State – only categories (subcategories endpoint does not exist)
  const [categories, setCategories] = useState([]);
  // Subcategories are not fetched separately – we'll treat them as part of categories (if your backend returns nested structure) or ignore.
  // For simplicity, we'll keep subcategories as an empty array and not display them.
  const [subcategories, setSubcategories] = useState([]);

  // Form state for add/edit
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

  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

  // API Calls – only categories (subcategories endpoint removed)
  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      showToast('Failed to load categories', 'danger');
    }
  };

  // Subcategories fetch removed because endpoint 404 – we'll skip it.
  // If your backend later provides subcategories, uncomment this block.

  const fetchAllData = useCallback(async () => {
    await fetchCategories();
    // fetchSubcategories() removed – no 404 error
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // CRUD operations (real API)
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
      showToast('Category name is required', 'warning');
      return;
    }
    try {
      const payload = { ...formData, slug: formData.slug || generateSlug(formData.name) };
      if (modalMode === 'add') {
        const res = await api.post('/admin/categories', payload);
        const newCategory = res.data;
        setCategories(prev => [...prev, newCategory]);
        showToast('Category added successfully', 'success');
      } else if (modalMode === 'edit' && selectedCategory) {
        const res = await api.put(`/admin/categories/${selectedCategory.id}`, payload);
        const updated = res.data;
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        showToast('Category updated', 'success');
      }
      setShowCategoryModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.response?.data?.message || 'Save failed', 'danger');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await api.delete(`/admin/categories/${selectedCategory.id}`);
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
      showToast('Category deleted', 'success');
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.response?.data?.message || 'Delete failed', 'danger');
    }
  };

  // Bulk actions
  const handleBulkStatusChange = async (status) => {
    try {
      await api.post('/admin/categories/bulk-status', { ids: selectedCategories, status });
      await fetchCategories();
      setSelectedCategories([]);
      setShowBulkActions(false);
      showToast(`${selectedCategories.length} categories updated to ${status}`, 'success');
    } catch (err) {
      showToast('Bulk update failed', 'danger');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.post('/admin/categories/bulk-delete', { ids: selectedCategories });
      await fetchCategories();
      setSelectedCategories([]);
      setShowBulkActions(false);
      showToast(`${selectedCategories.length} categories deleted`, 'success');
    } catch (err) {
      showToast('Bulk delete failed', 'danger');
    }
  };

  // Export (CSV, Excel, JSON)
  const handleExport = async () => {
    setIsExporting(true);
    setTimeout(() => {
      const allItems = [...categories]; // subcategories omitted
      const exportData = allItems.map(cat => ({
        'ID': cat.id,
        'Name': cat.name,
        'Slug': cat.slug,
        'Description': cat.description || '',
        'Status': cat.status,
        'Featured': cat.featured ? 'Yes' : 'No',
        'Popular': cat.popular ? 'Yes' : 'No',
        'Service Count': cat.serviceCount || 0,
        'Total Bookings': cat.totalBookings || 0,
        'Total Revenue': cat.totalRevenue || 0,
        'Created At': cat.createdAt,
        'Updated At': cat.updatedAt
      }));
      let content = '';
      let filename = `categories_export_${new Date().toISOString().split('T')[0]}`;
      let mimeType = '';
      if (exportFormat === 'csv') {
        content = [Object.keys(exportData[0]).join(','), ...exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))].join('\n');
        mimeType = 'text/csv';
        filename += '.csv';
      } else if (exportFormat === 'excel') {
        content = [Object.keys(exportData[0]).join('\t'), ...exportData.map(row => Object.values(row).join('\t'))].join('\n');
        mimeType = 'application/vnd.ms-excel';
        filename += '.xls';
      } else {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        filename += '.json';
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setShowExportModal(false);
      showToast(`Exported ${exportData.length} categories`, 'success');
    }, 500);
  };

  const handlePrint = () => {
    const allItems = [...categories];
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Categories Report</title>
      <style>body{font-family:Arial;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f2f2f2}</style>
      </head>
      <body>
        <h1>Categories Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <h3>Summary</h3>
        <p>Categories: ${categories.length}</p>
        <table>
          <thead><tr><th>Name</th><th>Status</th><th>Services</th></tr></thead>
          <tbody>${allItems.map(c => `
            <tr><td>${c.name}</td><td>${c.status}</td><td>${c.serviceCount || 0}</td></tr>
          `).join('')}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
    showToast('Print started', 'info');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
    showToast('Filters reset', 'info');
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

  // Filter categories (client‑side)
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

  // Statistics
  const stats = {
    totalCategories: categories.length,
    totalServices: categories.reduce((sum, c) => sum + (c.serviceCount || 0), 0),
    featuredCount: categories.filter(c => c.featured).length,
    popularCount: categories.filter(c => c.popular).length,
    totalRevenue: categories.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'success', icon: <FaCheckCircle />, label: 'Active' },
      inactive: { bg: 'secondary', icon: <FaClock />, label: 'Inactive' }
    };
    const b = badges[status] || badges.inactive;
    return <Badge bg={b.bg} className="d-flex align-items-center gap-1 py-2 px-3 rounded-pill">{b.icon}<span>{b.label}</span></Badge>;
  };

  // Auto‑refresh every 30 seconds (only if categories fetch is not failing repeatedly)
  useEffect(() => {
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  return (
    <Container fluid className="categories-container py-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toastMessage.show} onClose={() => setToastMessage({ show: false, message: '', type: '' })} delay={3000} autohide bg={toastMessage.type}>
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{toastMessage.type === 'success' ? 'Success' : toastMessage.type === 'danger' ? 'Error' : 'Info'}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-2">Category Management</h2>
          <p className="text-muted mb-0">Manage service categories</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowFilters(!showFilters)}>
            <FaSlidersH className="me-2" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary"><FaDownload className="me-2" /> Export</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}><FaDownload className="me-2 text-success" /> CSV</Dropdown.Item>
              <Dropdown.Item onClick={() => { setExportFormat('excel'); setShowExportModal(true); }}><FaDownload className="me-2 text-success" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={() => { setExportFormat('pdf'); setShowExportModal(true); }}><FaDownload className="me-2 text-danger" /> PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="primary" onClick={handlePrint}><FaDownload className="me-2" /> Print</Button>
          <Button variant="outline-secondary" onClick={resetFilters}><FaRedo className="me-2" /> Reset</Button>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col xl={3} lg={6} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-primary bg-opacity-10 rounded-circle p-3 me-3"><FaTags className="text-primary" size={20} /></div>
              <div><h5 className="mb-1">{stats.totalCategories}</h5><small className="text-muted">Categories</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-warning bg-opacity-10 rounded-circle p-3 me-3"><FaServicestack className="text-warning" size={20} /></div>
              <div><h5 className="mb-1">{stats.totalServices}</h5><small className="text-muted">Total Services</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-info bg-opacity-10 rounded-circle p-3 me-3"><FaStar className="text-info" size={20} /></div>
              <div><h5 className="mb-1">{stats.featuredCount}</h5><small className="text-muted">Featured</small></div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} lg={6} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon bg-danger bg-opacity-10 rounded-circle p-3 me-3"><FaFire className="text-danger" size={20} /></div>
              <div><h5 className="mb-1">{stats.popularCount}</h5><small className="text-muted">Popular</small></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      {showFilters && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={5}>
                <InputGroup>
                  <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control placeholder="Search by name, slug, description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border-start-0" />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                  <option value="10">10 per page</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" className="w-100" onClick={resetFilters}><FaRedo className="me-2" /> Reset</Button>
              </Col>
            </Row>
            {selectedCategories.length > 0 && (
              <div className="d-flex gap-2 mt-3 pt-3 border-top">
                <Button variant="success" size="sm" onClick={() => handleBulkStatusChange('active')}><FaCheckCircle className="me-2" /> Activate ({selectedCategories.length})</Button>
                <Button variant="secondary" size="sm" onClick={() => handleBulkStatusChange('inactive')}><FaClock className="me-2" /> Deactivate ({selectedCategories.length})</Button>
                <Button variant="danger" size="sm" onClick={() => setShowBulkActions(true)}><FaTrash className="me-2" /> Delete ({selectedCategories.length})</Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Main Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="categories-table mb-0">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: '40px' }}><Form.Check type="checkbox" checked={selectedCategories.length === categories.length && categories.length > 0} onChange={handleSelectAll} /></th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Category {getSortIcon('name')}</th>
                  <th>Icon</th>
                  <th onClick={() => handleSort('serviceCount')} style={{ cursor: 'pointer' }}>Services {getSortIcon('serviceCount')}</th>
                  <th onClick={() => handleSort('totalBookings')} style={{ cursor: 'pointer' }}>Bookings {getSortIcon('totalBookings')}</th>
                  <th onClick={() => handleSort('totalRevenue')} style={{ cursor: 'pointer' }}>Revenue {getSortIcon('totalRevenue')}</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Popular</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCategories.map(category => (
                  <tr key={category.id} className={selectedCategories.includes(category.id) ? 'table-active' : ''}>
                    <td><Form.Check type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => handleSelectCategory(category.id)} /></td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="category-color-indicator rounded-circle" style={{ width: 12, height: 12, backgroundColor: category.color }} />
                        <img src={category.image || 'https://placehold.co/40x40'} alt={category.name} className="rounded" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        <div><div className="fw-semibold">{category.name}</div><small className="text-muted">{category.slug}</small></div>
                      </div>
                    </td>
                    <td><div className="category-icon fs-4">{category.icon}</div></td>
                    <td><div className="fw-semibold">{category.serviceCount || 0}</div></td>
                    <td>{(category.totalBookings || 0).toLocaleString()}</td>
                    <td><span className="text-primary fw-semibold">${(category.totalRevenue || 0).toLocaleString()}</span></td>
                    <td>{getStatusBadge(category.status)}</td>
                    <td>{category.featured ? <FaStar className="text-warning" size={18} /> : <FaStar className="text-muted opacity-25" size={18} />}</td>
                    <td>{category.popular ? <FaFire className="text-danger" size={18} /> : <FaFire className="text-muted opacity-25" size={18} />}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="outline-primary" onClick={() => handleViewCategory(category)}><FaEye /></Button>
                        <Button size="sm" variant="outline-info" onClick={() => handleEditCategory(category)}><FaEdit /></Button>
                        <Button size="sm" variant="outline-success" onClick={() => handleAddCategory(category.id)}><FaPlus /></Button>
                        <Dropdown align="end">
                          <Dropdown.Toggle size="sm" variant="outline-secondary"><FaEllipsisV /></Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleEditCategory(category)}><FaEdit className="me-2" /> Edit</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleAddCategory(category.id)}><FaPlus className="me-2" /> Add Subcategory</Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => { setSelectedCategory(category); setShowDeleteModal(true); }}><FaTrash className="me-2 text-danger" /> Delete</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr><td colSpan="10" className="text-center py-5"><FaTags size={48} className="text-muted mb-3" /><h5>No categories found</h5><Button variant="primary" onClick={() => handleAddCategory()}>Add Category</Button></td></tr>
                )}
              </tbody>
            </Table>
          </div>

          {filteredCategories.length > 0 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div className="text-muted">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCategories.length)} of {filteredCategories.length}</div>
              <Pagination className="mb-0">
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                {[...Array(Math.min(5, totalPages)).keys()].map(num => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = num + 1;
                  else if (currentPage <= 3) pageNum = num + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + num;
                  else pageNum = currentPage - 2 + num;
                  return <Pagination.Item key={pageNum} active={pageNum === currentPage} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Pagination.Item>;
                })}
                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton><Modal.Title><FaDownload className="me-2" /> Export Categories</Modal.Title></Modal.Header>
        <Modal.Body><p>Exporting {categories.length} categories as {exportFormat.toUpperCase()}</p>{isExporting && <FaSpinner className="fa-spin" />}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancel</Button><Button variant="primary" onClick={handleExport}>Export Now</Button></Modal.Footer>
      </Modal>

      {/* Category Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>{modalMode === 'view' ? 'Category Details' : modalMode === 'edit' ? 'Edit Category' : 'Add New Category'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {modalMode === 'view' && selectedCategory && (
            <div><h5>{selectedCategory.name}</h5><p>{selectedCategory.description}</p><p><strong>Slug:</strong> {selectedCategory.slug}</p><p><strong>Status:</strong> {selectedCategory.status}</p></div>
          )}
          {(modalMode === 'edit' || modalMode === 'add') && (
            <Form>
              <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) }); }} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Slug</Form.Label><Form.Control value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></Form.Select></Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Close</Button>
          {(modalMode === 'edit' || modalMode === 'add') && <Button variant="primary" onClick={handleSaveCategory}>Save</Button>}
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white"><Modal.Title><FaExclamationTriangle className="me-2" /> Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body><p>Delete <strong>{selectedCategory?.name}</strong>? This cannot be undone.</p></Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDeleteCategory}>Delete</Button></Modal.Footer>
      </Modal>

      {/* Bulk Actions Modal */}
      <Modal show={showBulkActions} onHide={() => setShowBulkActions(false)} centered>
        <Modal.Header closeButton><Modal.Title>Bulk Actions</Modal.Title></Modal.Header>
        <Modal.Body><div className="d-grid gap-2"><Button variant="success" onClick={() => handleBulkStatusChange('active')}>Activate All</Button><Button variant="secondary" onClick={() => handleBulkStatusChange('inactive')}>Deactivate All</Button><Button variant="danger" onClick={handleBulkDelete}>Delete All</Button></div></Modal.Body>
      </Modal>

      <style>{`
        .categories-container {
          max-width: 1600px;
          margin: 0 auto;
        }
        .stats-card {
          transition: all 0.2s;
          border-radius: 12px;
          cursor: pointer;
        }
        .stats-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important;
        }
        .stats-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .categories-table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #4b5563;
          padding: 1rem 0.75rem;
        }
        .categories-table td {
          padding: 1rem 0.75rem;
          vertical-align: middle;
        }
        .fa-spin {
          animation: fa-spin 2s infinite linear;
        }
        @keyframes fa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default AdminCategories;