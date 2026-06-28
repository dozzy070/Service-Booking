// src/components/admin/AdminHelpCenter.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Modal,
  Badge,
  Alert,
  Spinner,
  Tabs,
  Tab,
  InputGroup,
  Pagination
} from 'react-bootstrap';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BookOpen,
  FileText,
  Megaphone,
  HelpCircle,
  Send,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const AdminHelpCenter = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    status: 'published',
    title: '',
    content: '',
    priority: 'normal',
    articleTitle: '',
    articleContent: '',
    tags: '',
    readTime: 5
  });

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // =========================================================================
  // FETCH FUNCTIONS - REAL API
  // =========================================================================

  // Fetch FAQs from API
  const fetchFAQs = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getFAQs === 'function') {
        response = await adminAPI.getFAQs({ 
          limit: itemsPerPage, 
          page: currentPage,
          search: searchTerm || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined
        });
      } else if (typeof adminAPI.getHelpFAQs === 'function') {
        response = await adminAPI.getHelpFAQs({ 
          limit: itemsPerPage, 
          page: currentPage,
          search: searchTerm || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined
        });
      } else {
        throw new Error('FAQs API methods not available');
      }

      const data = response?.data || [];
      const faqsData = Array.isArray(data) ? data : 
                       Array.isArray(data?.faqs) ? data.faqs : 
                       Array.isArray(data?.items) ? data.items : 
                       Array.isArray(data?.data) ? data.data : [];
      
      setFaqs(faqsData);
      setTotalCount(data?.total || faqsData.length || 0);
      setTotalPages(data?.totalPages || data?.total_pages || Math.ceil((data?.total || faqsData.length || 0) / itemsPerPage) || 1);
      
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
      setTotalCount(0);
      setTotalPages(1);
      throw error;
    }
  }, [currentPage, searchTerm, filterCategory]);

  // Fetch Announcements from API
  const fetchAnnouncements = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getAnnouncements === 'function') {
        response = await adminAPI.getAnnouncements({ 
          limit: itemsPerPage, 
          page: currentPage 
        });
      } else if (typeof adminAPI.getAnnouncementsList === 'function') {
        response = await adminAPI.getAnnouncementsList({ 
          limit: itemsPerPage, 
          page: currentPage 
        });
      } else {
        throw new Error('Announcements API methods not available');
      }

      const data = response?.data || [];
      const announcementsData = Array.isArray(data) ? data : 
                                Array.isArray(data?.announcements) ? data.announcements : 
                                Array.isArray(data?.items) ? data.items : [];
      
      setAnnouncements(announcementsData);
      setTotalCount(data?.total || announcementsData.length || 0);
      
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
      throw error;
    }
  }, [currentPage]);

  // Fetch Knowledge Base from API
  const fetchKnowledgeBase = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getKnowledgeBase === 'function') {
        response = await adminAPI.getKnowledgeBase({ 
          limit: itemsPerPage, 
          page: currentPage,
          search: searchTerm || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined
        });
      } else if (typeof adminAPI.getHelpArticles === 'function') {
        response = await adminAPI.getHelpArticles({ 
          limit: itemsPerPage, 
          page: currentPage,
          search: searchTerm || undefined,
          category: filterCategory !== 'all' ? filterCategory : undefined
        });
      } else {
        throw new Error('Knowledge base API methods not available');
      }

      const data = response?.data || [];
      const knowledgeData = Array.isArray(data) ? data : 
                            Array.isArray(data?.articles) ? data.articles : 
                            Array.isArray(data?.items) ? data.items : [];
      
      setKnowledgeBase(knowledgeData);
      setTotalCount(data?.total || knowledgeData.length || 0);
      
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setKnowledgeBase([]);
      throw error;
    }
  }, [currentPage, searchTerm, filterCategory]);

  // =========================================================================
  // CRUD OPERATIONS - REAL API
  // =========================================================================

  // Create FAQ
  const createFAQ = async (data) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.createFAQ === 'function') {
        await adminAPI.createFAQ(data);
      } else if (typeof adminAPI.addFAQ === 'function') {
        await adminAPI.addFAQ(data);
      } else {
        throw new Error('Create FAQ API methods not available');
      }
      
      toast.success('FAQ created successfully');
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  };

  // Update FAQ
  const updateFAQ = async (id, data) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.updateFAQ === 'function') {
        await adminAPI.updateFAQ(id, data);
      } else if (typeof adminAPI.editFAQ === 'function') {
        await adminAPI.editFAQ(id, data);
      } else {
        throw new Error('Update FAQ API methods not available');
      }
      
      toast.success('FAQ updated successfully');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  };

  // Delete FAQ
  const deleteFAQ = async (id) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.deleteFAQ === 'function') {
        await adminAPI.deleteFAQ(id);
      } else if (typeof adminAPI.removeFAQ === 'function') {
        await adminAPI.removeFAQ(id);
      } else {
        throw new Error('Delete FAQ API methods not available');
      }
      
      toast.success('FAQ deleted successfully');
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  };

  // Create Announcement
  const createAnnouncement = async (data) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.createAnnouncement === 'function') {
        await adminAPI.createAnnouncement(data);
      } else if (typeof adminAPI.addAnnouncement === 'function') {
        await adminAPI.addAnnouncement(data);
      } else {
        throw new Error('Create announcement API methods not available');
      }
      
      toast.success('Announcement created successfully');
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  };

  // Update Announcement
  const updateAnnouncement = async (id, data) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.updateAnnouncement === 'function') {
        await adminAPI.updateAnnouncement(id, data);
      } else if (typeof adminAPI.editAnnouncement === 'function') {
        await adminAPI.editAnnouncement(id, data);
      } else {
        throw new Error('Update announcement API methods not available');
      }
      
      toast.success('Announcement updated successfully');
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  };

  // Delete Announcement
  const deleteAnnouncement = async (id) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.deleteAnnouncement === 'function') {
        await adminAPI.deleteAnnouncement(id);
      } else if (typeof adminAPI.removeAnnouncement === 'function') {
        await adminAPI.removeAnnouncement(id);
      } else {
        throw new Error('Delete announcement API methods not available');
      }
      
      toast.success('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  };

  // Create Knowledge Article
  const createKnowledgeArticle = async (data) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.createKnowledgeArticle === 'function') {
        await adminAPI.createKnowledgeArticle(data);
      } else if (typeof adminAPI.addKnowledgeArticle === 'function') {
        await adminAPI.addKnowledgeArticle(data);
      } else {
        throw new Error('Create knowledge article API methods not available');
      }
      
      toast.success('Knowledge article created successfully');
    } catch (error) {
      console.error('Error creating knowledge article:', error);
      throw error;
    }
  };

  // Update Knowledge Article
  const updateKnowledgeArticle = async (id, data) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.updateKnowledgeArticle === 'function') {
        await adminAPI.updateKnowledgeArticle(id, data);
      } else if (typeof adminAPI.editKnowledgeArticle === 'function') {
        await adminAPI.editKnowledgeArticle(id, data);
      } else {
        throw new Error('Update knowledge article API methods not available');
      }
      
      toast.success('Knowledge article updated successfully');
    } catch (error) {
      console.error('Error updating knowledge article:', error);
      throw error;
    }
  };

  // Delete Knowledge Article
  const deleteKnowledgeArticle = async (id) => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.deleteKnowledgeArticle === 'function') {
        await adminAPI.deleteKnowledgeArticle(id);
      } else if (typeof adminAPI.removeKnowledgeArticle === 'function') {
        await adminAPI.removeKnowledgeArticle(id);
      } else {
        throw new Error('Delete knowledge article API methods not available');
      }
      
      toast.success('Knowledge article deleted successfully');
    } catch (error) {
      console.error('Error deleting knowledge article:', error);
      throw error;
    }
  };

  // =========================================================================
  // LOAD DATA
  // =========================================================================

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'faqs') {
        await fetchFAQs();
      } else if (activeTab === 'announcements') {
        await fetchAnnouncements();
      } else if (activeTab === 'knowledge') {
        await fetchKnowledgeBase();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeTab, fetchFAQs, fetchAnnouncements, fetchKnowledgeBase]);

  // =========================================================================
  // POLLING
  // =========================================================================

  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        loadData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 60000);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    isPolling.current = false;
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================

  useEffect(() => {
    loadData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [activeTab, currentPage, searchTerm, filterCategory]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setFormData({
      question: '',
      answer: '',
      category: '',
      status: 'published',
      title: '',
      content: '',
      priority: 'normal',
      articleTitle: '',
      articleContent: '',
      tags: '',
      readTime: 5
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormData({
      question: getField(item, ['question', 'question_text'], ''),
      answer: getField(item, ['answer', 'answer_text', 'content'], ''),
      category: getField(item, ['category', 'category_name', 'topic'], ''),
      status: getField(item, ['status', 'visibility', 'publish_status'], 'published'),
      title: getField(item, ['title', 'subject', 'heading'], ''),
      content: getField(item, ['content', 'body', 'text', 'message'], ''),
      priority: getField(item, ['priority', 'level', 'importance'], 'normal'),
      articleTitle: getField(item, ['title', 'name', 'article_title'], ''),
      articleContent: getField(item, ['content', 'body', 'article_content'], ''),
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags) : '',
      readTime: parseInt(item.read_time || item.readTime || 5)
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      question: '',
      answer: '',
      category: '',
      status: 'published',
      title: '',
      content: '',
      priority: 'normal',
      articleTitle: '',
      articleContent: '',
      tags: '',
      readTime: 5
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      let data = {};
      
      if (activeTab === 'faqs') {
        data = {
          question: formData.question,
          answer: formData.answer,
          category: formData.category,
          status: formData.status
        };
        
        if (modalMode === 'add') {
          await createFAQ(data);
        } else {
          await updateFAQ(editingItem.id || editingItem._id, data);
        }
      } else if (activeTab === 'announcements') {
        data = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          status: formData.status
        };
        
        if (modalMode === 'add') {
          await createAnnouncement(data);
        } else {
          await updateAnnouncement(editingItem.id || editingItem._id, data);
        }
      } else if (activeTab === 'knowledge') {
        data = {
          title: formData.articleTitle,
          content: formData.articleContent,
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          read_time: parseInt(formData.readTime) || 5,
          status: formData.status
        };
        
        if (modalMode === 'add') {
          await createKnowledgeArticle(data);
        } else {
          await updateKnowledgeArticle(editingItem.id || editingItem._id, data);
        }
      }
      
      handleCloseModal();
      await loadData(false);
      toast.success('Saved successfully');
      
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (activeTab === 'faqs') {
        await deleteFAQ(itemToDelete);
      } else if (activeTab === 'announcements') {
        await deleteAnnouncement(itemToDelete);
      } else if (activeTab === 'knowledge') {
        await deleteKnowledgeArticle(itemToDelete);
      }
      
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      await loadData(false);
      toast.success('Deleted successfully');
      
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleRefresh = () => {
    loadData(false);
    toast.success('Refreshed');
  };

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary" className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
          <Clock size={14} />
          <span>Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const configs = {
      published: { variant: 'success', icon: CheckCircle, text: 'Published' },
      draft: { variant: 'warning', icon: Clock, text: 'Draft' },
      archived: { variant: 'secondary', icon: XCircle, text: 'Archived' },
      high: { variant: 'danger', icon: AlertCircle, text: 'High' },
      normal: { variant: 'info', icon: Clock, text: 'Normal' },
      low: { variant: 'secondary', icon: Clock, text: 'Low' },
      urgent: { variant: 'danger', icon: AlertCircle, text: 'Urgent' }
    };
    const config = configs[lowerStatus] || configs.draft;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={14} />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const renderFAQs = () => (
    <div style={styles.tabContent}>
      {/* Filters */}
      <Row style={styles.filtersRow}>
        <Col md={6}>
          <InputGroup style={styles.searchInput}>
            <InputGroup.Text style={styles.searchInputText}><Search size={16} /></InputGroup.Text>
            <Form.Control
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInputControl}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            <option value="Booking">Booking</option>
            <option value="Provider">Provider</option>
            <option value="Payments">Payments</option>
            <option value="Support">Support</option>
            <option value="Policies">Policies</option>
            <option value="Security">Security</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button variant="outline-secondary" onClick={handleRefresh} style={styles.refreshBtn}>
            <RefreshCw size={16} />
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table hover style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableHeader}>Question</th>
              <th style={styles.tableHeader}>Category</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Helpful</th>
              <th style={styles.tableHeader}>Created</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyTableRow}>
                  <HelpCircle size={32} style={styles.emptyIcon} />
                  <p style={styles.emptyText}>No FAQs found. Create your first FAQ.</p>
                </td>
              </tr>
            ) : (
              faqs.map(faq => {
                const faqId = faq.id || faq._id;
                const question = getField(faq, ['question', 'question_text', 'title'], 'Untitled');
                const category = getField(faq, ['category', 'category_name', 'topic'], 'General');
                const status = getField(faq, ['status', 'visibility', 'publish_status'], 'draft');
                const helpfulCount = parseInt(faq.helpful_count) || parseInt(faq.helpful) || 0;
                const createdAt = faq.created_at || faq.createdAt || faq.date || new Date().toISOString();

                return (
                  <tr key={faqId} style={styles.tableRow}>
                    <td style={styles.tableCell}><strong>{question}</strong></td>
                    <td style={styles.tableCell}><Badge bg="light" className="text-dark">{category}</Badge></td>
                    <td style={styles.tableCell}>{getStatusBadge(status)}</td>
                    <td style={styles.tableCell}>{helpfulCount}</td>
                    <td style={styles.tableCell}><small>{new Date(createdAt).toLocaleDateString()}</small></td>
                    <td style={styles.tableCell}>
                      <Button size="sm" variant="outline-primary" style={styles.actionBtn} onClick={() => handleOpenEditModal(faq)}>
                        <Edit size={14} />
                      </Button>
                      <Button size="sm" variant="outline-danger" style={styles.actionBtn} onClick={() => handleDelete(faqId)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.paginationWrapper}>
          <Pagination style={styles.pagination}>
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
    </div>
  );

  const renderAnnouncements = () => (
    <div style={styles.tabContent}>
      <div style={styles.headerActions}>
        <Button variant="primary" onClick={handleOpenAddModal} style={styles.primaryBtn}>
          <Plus size={18} className="me-2" />
          New Announcement
        </Button>
        <Button variant="outline-secondary" onClick={handleRefresh} style={styles.secondaryBtn}>
          <RefreshCw size={16} className="me-2" />
          Refresh
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div style={styles.emptyState}>
          <Megaphone size={48} style={styles.emptyIcon} />
          <h6 style={styles.emptyTitle}>No announcements</h6>
          <p style={styles.emptyText}>Create announcements to notify users about important updates</p>
        </div>
      ) : (
        announcements.map(item => {
          const itemId = item.id || item._id;
          const title = getField(item, ['title', 'subject', 'heading'], 'Untitled');
          const content = getField(item, ['content', 'body', 'message'], '');
          const status = getField(item, ['status', 'visibility'], 'draft');
          const priority = getField(item, ['priority', 'level'], 'normal');
          const createdAt = item.created_at || item.createdAt || item.date || new Date().toISOString();

          return (
            <Card key={itemId} style={styles.announcementCard}>
              <Card.Body>
                <div style={styles.announcementContent}>
                  <div>
                    <h6 style={styles.announcementTitle}>{title}</h6>
                    <p style={styles.announcementText}>{content}</p>
                    <div style={styles.announcementMeta}>
                      {getStatusBadge(status)}
                      {priority && getStatusBadge(priority)}
                      <small style={styles.announcementDate}>{new Date(createdAt).toLocaleDateString()}</small>
                    </div>
                  </div>
                  <div>
                    <Button size="sm" variant="outline-primary" style={styles.actionBtn} onClick={() => handleOpenEditModal(item)}>
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="outline-danger" style={styles.actionBtn} onClick={() => handleDelete(itemId)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })
      )}
    </div>
  );

  const renderKnowledgeBase = () => (
    <div style={styles.tabContent}>
      <div style={styles.headerActions}>
        <Button variant="primary" onClick={handleOpenAddModal} style={styles.primaryBtn}>
          <Plus size={18} className="me-2" />
          New Article
        </Button>
        <Button variant="outline-secondary" onClick={handleRefresh} style={styles.secondaryBtn}>
          <RefreshCw size={16} className="me-2" />
          Refresh
        </Button>
      </div>

      {knowledgeBase.length === 0 ? (
        <div style={styles.emptyState}>
          <BookOpen size={48} style={styles.emptyIcon} />
          <h6 style={styles.emptyTitle}>No articles</h6>
          <p style={styles.emptyText}>Create knowledge base articles to help users</p>
        </div>
      ) : (
        <Row style={styles.knowledgeGrid}>
          {knowledgeBase.map(article => {
            const articleId = article.id || article._id;
            const title = getField(article, ['title', 'name', 'article_title'], 'Untitled');
            const content = getField(article, ['content', 'body', 'article_content'], '');
            const category = getField(article, ['category', 'topic', 'section'], 'General');
            const tags = article.tags || [];
            const readTime = parseInt(article.read_time || article.readTime || 5);
            const status = getField(article, ['status', 'visibility'], 'draft');

            return (
              <Col md={6} key={articleId} style={styles.knowledgeCol}>
                <Card style={styles.knowledgeCard}>
                  <Card.Body>
                    <div style={styles.knowledgeContent}>
                      <div>
                        <div style={styles.knowledgeHeader}>
                          <h6 style={styles.knowledgeTitle}>{title}</h6>
                          {getStatusBadge(status)}
                        </div>
                        <p style={styles.knowledgeText}>{content?.substring(0, 100)}...</p>
                        <div style={styles.knowledgeMeta}>
                          <Badge bg="light" className="text-dark">{category}</Badge>
                          {Array.isArray(tags) && tags.slice(0, 3).map(tag => (
                            <Badge key={tag} bg="secondary" className="text-white">{tag}</Badge>
                          ))}
                          <small style={styles.knowledgeReadTime}>Read time: {readTime} mins</small>
                        </div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline-primary" style={styles.actionBtn} onClick={() => handleOpenEditModal(article)}>
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="outline-danger" style={styles.actionBtn} onClick={() => handleDelete(articleId)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  // Loading state removed - component renders immediately with empty data

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" style={styles.alert} dismissible onClose={() => setError(null)}>
            <AlertCircle size={18} className="me-2" />
            {error}
          </Alert>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Help Center Management</h2>
            <p style={styles.headerSubtitle}>Manage FAQs, announcements, and knowledge base</p>
          </div>
          <Button variant="primary" onClick={handleOpenAddModal} style={styles.primaryBtn}>
            <Plus size={18} />
            Add New {activeTab === 'faqs' ? 'FAQ' : activeTab === 'announcements' ? 'Announcement' : 'Article'}
          </Button>
        </div>

        {/* Main Card */}
        <Card style={styles.mainCard}>
          <Card.Body style={styles.mainCardBody}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => { setActiveTab(k); setCurrentPage(1); setSearchTerm(''); setFilterCategory('all'); }}
              className="custom-tabs"
              style={styles.tabs}
            >
              <Tab eventKey="faqs" title={
                <span style={styles.tabTitle}>
                  <HelpCircle size={16} style={styles.tabIcon} /> FAQs
                </span>
              }>
                {renderFAQs()}
              </Tab>

              <Tab eventKey="announcements" title={
                <span style={styles.tabTitle}>
                  <Megaphone size={16} style={styles.tabIcon} /> Announcements
                </span>
              }>
                {renderAnnouncements()}
              </Tab>

              <Tab eventKey="knowledge" title={
                <span style={styles.tabTitle}>
                  <BookOpen size={16} style={styles.tabIcon} /> Knowledge Base
                </span>
              }>
                {renderKnowledgeBase()}
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            {modalMode === 'add' ? 'Add New' : 'Edit'} 
            {' '}
            {activeTab === 'faqs' ? 'FAQ' : activeTab === 'announcements' ? 'Announcement' : 'Article'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Form>
            {activeTab === 'faqs' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Question <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question"
                    style={styles.formControl}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Answer <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Enter the answer"
                    style={styles.formTextarea}
                  />
                </Form.Group>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={styles.formLabel}>Category</Form.Label>
                      <Form.Select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={styles.formControl}
                      >
                        <option value="">Select category</option>
                        <option value="Booking">Booking</option>
                        <option value="Provider">Provider</option>
                        <option value="Payments">Payments</option>
                        <option value="Support">Support</option>
                        <option value="Policies">Policies</option>
                        <option value="Security">Security</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={styles.formLabel}>Status</Form.Label>
                      <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={styles.formControl}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {activeTab === 'announcements' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    style={styles.formControl}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Content <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter announcement content"
                    style={styles.formTextarea}
                  />
                </Form.Group>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={styles.formLabel}>Priority</Form.Label>
                      <Form.Select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        style={styles.formControl}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={styles.formLabel}>Status</Form.Label>
                      <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={styles.formControl}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {activeTab === 'knowledge' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.articleTitle}
                    onChange={(e) => setFormData({ ...formData, articleTitle: e.target.value })}
                    placeholder="Enter article title"
                    style={styles.formControl}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Content <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.articleContent}
                    onChange={(e) => setFormData({ ...formData, articleContent: e.target.value })}
                    placeholder="Enter article content"
                    style={styles.formTextarea}
                  />
                </Form.Group>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={styles.formLabel}>Category</Form.Label>
                      <Form.Select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={styles.formControl}
                      >
                        <option value="">Select category</option>
                        <option value="Guide">Guide</option>
                        <option value="Tutorial">Tutorial</option>
                        <option value="Payments">Payments</option>
                        <option value="Booking">Booking</option>
                        <option value="Security">Security</option>
                        <option value="Policies">Policies</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={styles.formLabel}>Read Time (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.readTime}
                        onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) || 5 })}
                        min="1"
                        max="60"
                        style={styles.formControl}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Tags (comma separated)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. tutorial, beginner, guide"
                    style={styles.formControl}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.formLabel}>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={styles.formControl}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={handleCloseModal} style={styles.modalCancelBtn}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={submitting} style={styles.modalSubmitBtn}>
            {submitting ? <Spinner animation="border" size="sm" /> : <Save size={16} />}
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton style={styles.modalHeaderDanger}>
          <Modal.Title style={styles.modalTitleDanger}>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <p style={styles.deleteText}>Are you sure you want to delete this item? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowDeleteConfirm(false)} style={styles.modalCancelBtn}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} style={styles.modalDeleteBtn}>
            <Trash2 size={16} className="me-2" />
            Delete
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
  primaryBtn: {
    borderRadius: '12px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  secondaryBtn: {
    borderRadius: '12px',
    padding: '10px 20px'
  },
  mainCard: {
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  mainCardBody: {
    padding: 0
  },
  tabs: {
    borderBottom: 'none',
    padding: '0 24px',
    paddingTop: '16px'
  },
  tabTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500'
  },
  tabIcon: {
    opacity: 0.7
  },
  tabContent: {
    padding: '24px'
  },
  filtersRow: {
    marginBottom: '20px',
    gap: '12px'
  },
  searchInput: {
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
    borderRadius: '12px',
    padding: '10px 16px'
  },
  refreshBtn: {
    borderRadius: '12px',
    padding: '10px 16px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  table: {
    minWidth: '700px',
    marginBottom: 0
  },
  tableHead: {
    background: '#f8fafc'
  },
  tableHeader: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    borderBottom: '2px solid #e2e8f0'
  },
  tableRow: {
    transition: 'background 0.2s'
  },
  tableCell: {
    padding: '12px 16px',
    verticalAlign: 'middle',
    fontSize: '14px'
  },
  emptyTableRow: {
    padding: '40px 16px',
    textAlign: 'center'
  },
  emptyIcon: {
    color: '#cbd5e0',
    marginBottom: '12px',
    opacity: 0.5
  },
  emptyText: {
    color: '#a0aec0',
    marginBottom: 0
  },
  actionBtn: {
    borderRadius: '8px',
    padding: '4px 8px',
    margin: '0 2px',
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  pagination: {
    marginBottom: 0
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyTitle: {
    color: '#4a5568',
    marginBottom: '8px',
    fontWeight: '500'
  },
  emptyText: {
    color: '#a0aec0',
    marginBottom: 0
  },
  announcementCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '16px'
  },
  announcementContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  announcementTitle: {
    fontWeight: '600',
    marginBottom: '4px',
    fontSize: '16px'
  },
  announcementText: {
    color: '#4a5568',
    marginBottom: '8px'
  },
  announcementMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  announcementDate: {
    color: '#a0aec0'
  },
  knowledgeGrid: {
    gap: '16px'
  },
  knowledgeCol: {
    marginBottom: '16px'
  },
  knowledgeCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%',
    transition: 'all 0.3s ease'
  },
  knowledgeContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  knowledgeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px'
  },
  knowledgeTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '15px'
  },
  knowledgeText: {
    color: '#4a5568',
    fontSize: '14px',
    marginBottom: '12px'
  },
  knowledgeMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  knowledgeReadTime: {
    color: '#a0aec0',
    fontSize: '12px'
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
    padding: '0 24px 20px',
    display: 'flex',
    gap: '8px'
  },
  modalCancelBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
  },
  modalSubmitBtn: {
    borderRadius: '10px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  modalDeleteBtn: {
    borderRadius: '10px',
    padding: '8px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
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
  deleteText: {
    color: '#4a5568',
    marginBottom: 0
  },
  globalStyles: `
    .custom-tabs .nav-link {
      color: #4b5563;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px 12px 0 0;
      transition: all 0.2s;
    }
    .custom-tabs .nav-link.active {
      color: #6366f1;
      font-weight: 600;
      border-bottom: 3px solid #6366f1;
      background: none;
    }
    .custom-tabs .nav-link:hover {
      background: #f8fafc;
    }
    .custom-tabs .nav-link .d-flex {
      gap: 8px;
    }
    .modal-content {
      border-radius: 20px;
      overflow: hidden;
    }
    .modal-header .btn-close {
      padding: 8px;
    }
    .table > :not(caption) > * > * {
      padding: 12px 16px;
      vertical-align: middle;
    }
    .table tbody tr:hover {
      background-color: #f8fafc;
    }
    .form-control:focus, .form-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    @media (max-width: 768px) {
      .custom-tabs .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }
      .modal-dialog {
        margin: 16px;
      }
      .table-responsive {
        font-size: 0.85rem;
      }
    }
  `
};

export default AdminHelpCenter;