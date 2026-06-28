// src/components/provider/ProviderHelpCenter.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Modal,
  Alert,
  Spinner,
  Table,
  Pagination,
  Tabs,
  Tab,
  InputGroup
} from 'react-bootstrap';
import {
  HelpCircle,
  FileText,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  BookOpen,
  ExternalLink,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  ChevronRight,
  ChevronDown,
  LifeBuoy,
  Sparkles,
  Zap,
  Shield,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderHelpCenter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: ''
  });

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const itemsPerPage = 5;

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      // Build query params
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus !== 'all' ? filterStatus : undefined
      };

      let response = null;
      
      if (typeof providerAPI.getSupportTickets === 'function') {
        response = await providerAPI.getSupportTickets(params);
      } else if (typeof providerAPI.getTickets === 'function') {
        response = await providerAPI.getTickets(params);
      } else {
        throw new Error('Tickets API methods not available');
      }

      // Handle different response formats
      let data = [];
      let total = 0;
      
      if (response?.data) {
        // Check if response is array
        if (Array.isArray(response.data)) {
          data = response.data;
          total = data.length;
        } 
        // Check if response has tickets property
        else if (response.data.tickets && Array.isArray(response.data.tickets)) {
          data = response.data.tickets;
          total = response.data.total || data.length;
        } 
        // Check if response has data property with array
        else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
          total = response.data.total || data.length;
        }
        // If response has items array
        else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
          total = response.data.total || data.length;
        }
        // If response has results array
        else if (response.data.results && Array.isArray(response.data.results)) {
          data = response.data.results;
          total = response.data.count || data.length;
        }
        else {
          data = [];
          total = 0;
        }
      }
      
      setTickets(Array.isArray(data) ? data : []);
      setTotalCount(total || data.length || 0);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Don't throw, just set empty state
      setTickets([]);
      setTotalCount(0);
    }
  }, [currentPage, itemsPerPage, filterStatus]);

  // Fetch knowledge base from API
  const fetchKnowledgeBase = useCallback(async () => {
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const params = {
        limit: 10,
        page: 1
      };

      let response = null;
      
      if (typeof providerAPI.getKnowledgeBase === 'function') {
        response = await providerAPI.getKnowledgeBase(params);
      } else if (typeof providerAPI.getHelpArticles === 'function') {
        response = await providerAPI.getHelpArticles(params);
      } else {
        throw new Error('Knowledge base API methods not available');
      }

      // Handle different response formats
      let data = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.articles && Array.isArray(response.data.articles)) {
          data = response.data.articles;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          data = response.data.items;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          data = response.data.results;
        } else {
          data = [];
        }
      }
      
      setKnowledgeBase(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setKnowledgeBase([]);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTickets(),
        fetchKnowledgeBase()
      ]);
    } catch (error) {
      console.error('Error loading help center data:', error);
      setError(error.message || 'Failed to load help center data');
      toast.error('Failed to load help center data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [fetchTickets, fetchKnowledgeBase]);

  // Polling functions for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        loadData(false).finally(() => {
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
    loadData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [currentPage, filterStatus]);

  // Reload tickets when pagination or filter changes
  useEffect(() => {
    if (!loading) {
      fetchTickets();
    }
  }, [currentPage, filterStatus]);

  // Create ticket with API
  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = {
        subject: newTicket.subject,
        category: newTicket.category || 'general',
        priority: newTicket.priority,
        message: newTicket.message
      };

      if (typeof providerAPI.createSupportTicket === 'function') {
        await providerAPI.createSupportTicket(payload);
      } else if (typeof providerAPI.createTicket === 'function') {
        await providerAPI.createTicket(payload);
      } else {
        throw new Error('Create ticket API methods not available');
      }
      
      toast.success('Support ticket created successfully');
      setShowTicketModal(false);
      setNewTicket({ subject: '', category: '', priority: 'medium', message: '' });
      await fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Reply to ticket with API
  const replyToTicket = async (ticketId) => {
    if (!ticketId) return;
    if (!ticketReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = { message: ticketReply };

      if (typeof providerAPI.replyToTicket === 'function') {
        await providerAPI.replyToTicket(ticketId, payload);
      } else if (typeof providerAPI.addTicketReply === 'function') {
        await providerAPI.addTicketReply(ticketId, payload);
      } else {
        throw new Error('Reply to ticket API methods not available');
      }
      
      toast.success('Reply sent successfully');
      setTicketReply('');
      await fetchTickets();
      // Refresh selected ticket
      const updatedTicket = tickets.find(t => (t.id || t._id) === ticketId);
      if (updatedTicket) setSelectedTicket(updatedTicket);
    } catch (error) {
      console.error('Error replying to ticket:', error);
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
          <AlertCircle size={14} />
          <span>Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const configs = {
      open: { variant: 'warning', icon: AlertCircle, text: 'Open' },
      in_progress: { variant: 'info', icon: Clock, text: 'In Progress' },
      resolved: { variant: 'success', icon: CheckCircle, text: 'Resolved' },
      closed: { variant: 'secondary', icon: XCircle, text: 'Closed' },
      pending: { variant: 'warning', icon: Clock, text: 'Pending' }
    };
    const config = configs[lowerStatus] || configs.open;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={14} />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    if (!priority) {
      return <Badge bg="secondary">Unknown</Badge>;
    }
    
    const lowerPriority = priority.toLowerCase();
    const configs = {
      low: { variant: 'secondary', text: 'Low' },
      medium: { variant: 'info', text: 'Medium' },
      high: { variant: 'warning', text: 'High' },
      urgent: { variant: 'danger', text: 'Urgent' }
    };
    const config = configs[lowerPriority] || configs.medium;
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  // Filter tickets locally
  const filteredTickets = tickets.filter(ticket => {
    const subject = getField(ticket, ['subject', 'title', 'issue'], '');
    const matchesSearch = searchTerm === '' ||
      subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Container fluid className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading help center...</p>
        </div>
      </Container>
    );
  }

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={styles.alert}>
            <AlertCircle size={18} className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => loadData(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>
              <LifeBuoy size={28} style={styles.headerIcon} />
              Help Center
            </h2>
            <p style={styles.headerSubtitle}>Get support and find answers to your questions</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowTicketModal(true)} 
            style={styles.newTicketBtn}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            New Ticket
          </Button>
        </div>

        {/* Quick Stats */}
        <Row style={styles.statsRow}>
          <Col md={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body style={styles.statCardBody}>
                <div style={styles.statIconWrapper('#6366f1', '#eef2ff')}>
                  <FileText size={20} color="#6366f1" />
                </div>
                <div>
                  <p style={styles.statLabel}>Total Tickets</p>
                  <h4 style={styles.statValue}>{tickets.length}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body style={styles.statCardBody}>
                <div style={styles.statIconWrapper('#f59e0b', '#fffbeb')}>
                  <Clock size={20} color="#f59e0b" />
                </div>
                <div>
                  <p style={styles.statLabel}>Open Tickets</p>
                  <h4 style={styles.statValue}>
                    {tickets.filter(t => {
                      const status = getField(t, ['status', 'ticket_status'], '');
                      return status.toLowerCase() === 'open' || status.toLowerCase() === 'pending';
                    }).length}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body style={styles.statCardBody}>
                <div style={styles.statIconWrapper('#10b981', '#ecfdf5')}>
                  <CheckCircle size={20} color="#10b981" />
                </div>
                <div>
                  <p style={styles.statLabel}>Resolved</p>
                  <h4 style={styles.statValue}>
                    {tickets.filter(t => {
                      const status = getField(t, ['status', 'ticket_status'], '');
                      return status.toLowerCase() === 'resolved' || status.toLowerCase() === 'closed';
                    }).length}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card style={styles.statCard}>
              <Card.Body style={styles.statCardBody}>
                <div style={styles.statIconWrapper('#8b5cf6', '#f3e8ff')}>
                  <Zap size={20} color="#8b5cf6" />
                </div>
                <div>
                  <p style={styles.statLabel}>Avg Response Time</p>
                  <h4 style={styles.statValue}>
                    {tickets.filter(t => t.messages && t.messages.length > 1).length > 0
                      ? '< 24h'
                      : 'N/A'}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Card style={styles.tabsCard}>
          <Card.Body style={styles.tabsCardBody}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="custom-tabs"
              style={styles.tabs}
            >
              <Tab eventKey="tickets" title={
                <span style={styles.tabTitle}>
                  <FileText size={16} style={styles.tabIcon} /> Support Tickets
                </span>
              }>
                <div style={styles.tabContent}>
                  {/* Filters */}
                  <Row style={styles.filtersRow}>
                    <Col md={6}>
                      <InputGroup style={styles.searchInput}>
                        <InputGroup.Text style={styles.searchInputText}>
                          <Search size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search tickets..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={styles.searchInputControl}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={styles.filterSelect}
                      >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Button variant="outline-secondary" style={styles.filterBtn}>
                        <Filter size={16} style={styles.filterBtnIcon} />
                        More Filters
                      </Button>
                    </Col>
                  </Row>

                  {/* Tickets Table */}
                  {paginatedTickets.length === 0 ? (
                    <div style={styles.emptyState}>
                      <FileText size={48} style={styles.emptyIcon} />
                      <h6 style={styles.emptyTitle}>No tickets found</h6>
                      <p style={styles.emptyText}>Create a support ticket to get help</p>
                      <Button variant="link" onClick={() => setShowTicketModal(true)} style={styles.emptyBtn}>
                        Create a ticket
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div style={styles.tableWrapper}>
                        <Table hover style={styles.table}>
                          <thead style={styles.tableHead}>
                            <tr>
                              <th style={styles.tableHeader}>Ticket ID</th>
                              <th style={styles.tableHeader}>Subject</th>
                              <th style={styles.tableHeader}>Category</th>
                              <th style={styles.tableHeader}>Priority</th>
                              <th style={styles.tableHeader}>Status</th>
                              <th style={styles.tableHeader}>Date</th>
                              <th style={styles.tableHeader}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedTickets.map(ticket => {
                              const ticketId = ticket.id || ticket._id;
                              const subject = getField(ticket, ['subject', 'title', 'issue'], 'Untitled');
                              const category = getField(ticket, ['category', 'type', 'category_name'], 'general');
                              const priority = getField(ticket, ['priority', 'level'], 'medium');
                              const status = getField(ticket, ['status', 'ticket_status'], 'open');
                              const createdAt = ticket.created_at || ticket.createdAt || ticket.date || new Date().toISOString();

                              return (
                                <tr key={ticketId} style={styles.tableRow}>
                                  <td style={styles.tableCellPrimary}>#{ticketId?.slice(-8) || 'N/A'}</td>
                                  <td style={styles.tableCell}>{subject}</td>
                                  <td style={styles.tableCell}>
                                    <Badge bg="light" text="dark" style={styles.categoryBadge}>
                                      {category}
                                    </Badge>
                                  </td>
                                  <td style={styles.tableCell}>{getPriorityBadge(priority)}</td>
                                  <td style={styles.tableCell}>{getStatusBadge(status)}</td>
                                  <td style={styles.tableCell}>
                                    <small>{format(new Date(createdAt), 'MMM dd, yyyy')}</small>
                                  </td>
                                  <td style={styles.tableCell}>
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => setSelectedTicket(ticket)}
                                      style={styles.viewBtn}
                                    >
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
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
                    </>
                  )}
                </div>
              </Tab>

              <Tab eventKey="knowledge" title={
                <span style={styles.tabTitle}>
                  <BookOpen size={16} style={styles.tabIcon} /> Knowledge Base
                </span>
              }>
                <div style={styles.tabContent}>
                  <Row style={styles.knowledgeGrid}>
                    {knowledgeBase.map(article => {
                      const articleId = article.id || article._id;
                      const title = getField(article, ['title', 'name', 'subject'], 'Untitled Article');
                      const category = getField(article, ['category', 'topic', 'section'], 'General');
                      const content = getField(article, ['content', 'description', 'body'], '');
                      const readTime = article.read_time || Math.ceil((content || '').length / 1000) + 1;
                      
                      return (
                        <Col md={6} key={articleId}>
                          <Card style={styles.knowledgeCard}>
                            <Card.Body style={styles.knowledgeCardBody}>
                              <div style={styles.knowledgeCardHeader}>
                                <h6 style={styles.knowledgeCardTitle}>{title}</h6>
                                <Badge bg="light" text="dark" style={styles.knowledgeCardBadge}>
                                  {category}
                                </Badge>
                              </div>
                              <p style={styles.knowledgeCardMeta}>Read time: {readTime} mins</p>
                              <Button variant="link" style={styles.knowledgeCardBtn}>
                                Read Article <ExternalLink size={14} style={styles.knowledgeCardIcon} />
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                  {knowledgeBase.length === 0 && (
                    <div style={styles.emptyState}>
                      <BookOpen size={48} style={styles.emptyIcon} />
                      <h6 style={styles.emptyTitle}>No articles found</h6>
                      <p style={styles.emptyText}>Check back later for new articles</p>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      {/* Create Ticket Modal */}
      <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="lg">
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            <Plus size={20} style={styles.modalTitleIcon} />
            Create Support Ticket
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          <Form>
            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Subject <span style={styles.required}>*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Brief summary of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                style={styles.formControl}
              />
            </Form.Group>

            <Row style={styles.formRow}>
              <Col md={6}>
                <Form.Group style={styles.formGroup}>
                  <Form.Label style={styles.formLabel}>Category</Form.Label>
                  <Form.Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="">Select category</option>
                    <option value="payment">Payments & Payouts</option>
                    <option value="booking">Bookings</option>
                    <option value="account">Account Issues</option>
                    <option value="technical">Technical Support</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group style={styles.formGroup}>
                  <Form.Label style={styles.formLabel}>Priority</Form.Label>
                  <Form.Select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    style={styles.formSelect}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group style={styles.formGroup}>
              <Form.Label style={styles.formLabel}>Description <span style={styles.required}>*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Please provide detailed information about your issue..."
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                style={styles.formTextarea}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={styles.modalFooter}>
          <Button variant="light" onClick={() => setShowTicketModal(false)} style={styles.modalCancelBtn}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createTicket} disabled={submitting} style={styles.modalSubmitBtn}>
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal show={!!selectedTicket} onHide={() => setSelectedTicket(null)} centered size="lg">
        <Modal.Header closeButton style={styles.modalHeader}>
          <Modal.Title style={styles.modalTitle}>
            <FileText size={20} style={styles.modalTitleIcon} />
            Ticket #{selectedTicket?.id || selectedTicket?._id ? (selectedTicket.id || selectedTicket._id).slice(-8) : 'N/A'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          {selectedTicket && (
            <>
              <div style={styles.ticketDetailHeader}>
                <div>
                  <h6 style={styles.ticketDetailSubject}>
                    {getField(selectedTicket, ['subject', 'title', 'issue'], 'Untitled')}
                  </h6>
                  <div style={styles.ticketDetailBadges}>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <small style={styles.ticketDetailDate}>
                  Created {format(new Date(selectedTicket.created_at || selectedTicket.createdAt || selectedTicket.date || new Date()), 'MMM dd, yyyy')}
                </small>
              </div>

              <div style={styles.ticketMessages}>
                {(selectedTicket.messages || []).map((msg, idx) => {
                  const sender = getField(msg, ['sender', 'author', 'user_type', 'sender_type'], 'user');
                  const isUser = sender === 'user' || sender === 'customer' || sender === 'provider';
                  const message = getField(msg, ['message', 'content', 'body', 'text'], '');
                  const date = msg.created_at || msg.createdAt || msg.timestamp || new Date().toISOString();
                  
                  return (
                    <div key={idx} style={{
                      ...styles.messageWrapper,
                      justifyContent: isUser ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        ...styles.messageBubble,
                        ...(isUser ? styles.messageBubbleUser : styles.messageBubbleSupport)
                      }}>
                        <div style={styles.messageSender}>
                          {isUser ? 'You' : 'Support Agent'}
                        </div>
                        <div style={styles.messageText}>{message}</div>
                        <div style={{
                          ...styles.messageTime,
                          ...(isUser ? styles.messageTimeUser : styles.messageTimeSupport)
                        }}>
                          {format(new Date(date), 'hh:mm a, MMM dd')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div style={styles.ticketReplySection}>
                  <Form.Group style={styles.formGroup}>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Type your reply..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      style={styles.replyTextarea}
                    />
                  </Form.Group>
                  <div style={styles.replyActions}>
                    <Button variant="secondary" onClick={() => setSelectedTicket(null)} style={styles.replyCancelBtn}>
                      Close
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => replyToTicket(selectedTicket.id || selectedTicket._id)} 
                      disabled={submitting}
                      style={styles.replySendBtn}
                    >
                      {submitting ? 'Sending...' : <><Send size={16} style={styles.replySendIcon} />Send Reply</>}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
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
        .stat-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        .knowledge-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        @media (max-width: 768px) {
          .custom-tabs .nav-link {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
          }
          .modal-dialog {
            margin: 16px;
          }
        }
      `}</style>
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
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
    fontWeight: '700',
    fontSize: '28px',
    color: '#1a202c'
  },
  headerIcon: {
    color: '#6366f1'
  },
  headerSubtitle: {
    color: '#718096',
    marginBottom: 0,
    fontSize: '16px'
  },
  newTicketBtn: {
    borderRadius: '12px',
    padding: '10px 24px',
    fontWeight: '600',
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
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  statCardBody: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIconWrapper: (color, bg) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }),
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
  tabsCard: {
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  tabsCardBody: {
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
    marginBottom: '24px',
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
  filterBtn: {
    borderRadius: '12px',
    padding: '10px 16px',
    width: '100%',
    border: '1px solid #e2e8f0'
  },
  filterBtnIcon: {
    marginRight: '8px'
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
    marginBottom: '8px',
    fontWeight: '500'
  },
  emptyText: {
    color: '#a0aec0',
    marginBottom: '16px'
  },
  emptyBtn: {
    color: '#6366f1',
    fontWeight: '500'
  },
  tableWrapper: {
    overflowX: 'auto'
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
  tableCellPrimary: {
    padding: '12px 16px',
    verticalAlign: 'middle',
    fontWeight: '600',
    color: '#6366f1'
  },
  categoryBadge: {
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '12px'
  },
  viewBtn: {
    borderRadius: '8px',
    padding: '4px 14px',
    fontSize: '13px'
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0'
  },
  pagination: {
    marginBottom: 0
  },
  knowledgeGrid: {
    gap: '16px'
  },
  knowledgeCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    height: '100%',
    transition: 'all 0.3s ease'
  },
  knowledgeCardBody: {
    padding: '20px'
  },
  knowledgeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  knowledgeCardTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '15px',
    color: '#1a202c',
    flex: 1
  },
  knowledgeCardBadge: {
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    marginLeft: '8px',
    flexShrink: 0
  },
  knowledgeCardMeta: {
    color: '#a0aec0',
    fontSize: '13px',
    marginBottom: '16px'
  },
  knowledgeCardBtn: {
    padding: 0,
    color: '#6366f1',
    fontWeight: '500',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  knowledgeCardIcon: {
    marginLeft: '4px'
  },
  modalHeader: {
    borderBottom: 'none',
    padding: '24px 28px 0'
  },
  modalTitle: {
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  modalTitleIcon: {
    color: '#6366f1'
  },
  modalBody: {
    padding: '20px 28px'
  },
  modalFooter: {
    borderTop: 'none',
    padding: '0 28px 24px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  formLabel: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c'
  },
  required: {
    color: '#ef4444'
  },
  formControl: {
    borderRadius: '10px',
    padding: '10px 14px'
  },
  formRow: {
    marginBottom: '0'
  },
  formSelect: {
    borderRadius: '10px',
    padding: '10px 14px'
  },
  formTextarea: {
    borderRadius: '10px',
    padding: '10px 14px',
    resize: 'vertical'
  },
  modalCancelBtn: {
    borderRadius: '10px',
    padding: '8px 24px'
  },
  modalSubmitBtn: {
    borderRadius: '10px',
    padding: '8px 24px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none'
  },
  ticketDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  ticketDetailSubject: {
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '18px'
  },
  ticketDetailBadges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  ticketDetailDate: {
    color: '#a0aec0'
  },
  ticketMessages: {
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '20px',
    padding: '4px 0'
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '16px'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px'
  },
  messageBubbleUser: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    borderBottomRightRadius: '4px'
  },
  messageBubbleSupport: {
    background: '#f1f5f9',
    color: '#1a202c',
    borderBottomLeftRadius: '4px'
  },
  messageSender: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.8
  },
  messageText: {
    fontSize: '14px',
    lineHeight: 1.5
  },
  messageTime: {
    fontSize: '10px',
    marginTop: '6px',
    opacity: 0.7
  },
  messageTimeUser: {
    color: 'rgba(255,255,255,0.7)'
  },
  messageTimeSupport: {
    color: '#94a3b8'
  },
  ticketReplySection: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '20px'
  },
  replyTextarea: {
    borderRadius: '10px',
    resize: 'vertical',
    padding: '10px 14px'
  },
  replyActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  replyCancelBtn: {
    borderRadius: '10px',
    padding: '8px 20px'
  },
  replySendBtn: {
    borderRadius: '10px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  replySendIcon: {
    marginRight: '4px'
  }
};

export default ProviderHelpCenter;