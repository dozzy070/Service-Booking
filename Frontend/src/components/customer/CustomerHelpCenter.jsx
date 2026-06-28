// src/components/customer/CustomerHelpCenter.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Spinner,
  Table,
  Pagination,
  Badge,
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
  LifeBuoy,
  Zap,
  Award,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../api/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CustomerHelpCenter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [faqs, setFaqs] = useState([]);
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

  const itemsPerPage = 5;
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  // Helper function to get nested properties safely
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // ✅ FIXED: Properly fetch tickets with error handling
  const fetchTickets = useCallback(async () => {
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof customerAPI.getSupportTickets === 'function') {
        response = await customerAPI.getSupportTickets();
      } else if (typeof customerAPI.getTickets === 'function') {
        response = await customerAPI.getTickets();
      } else {
        // Fallback to empty array
        setTickets([]);
        setTotalCount(0);
        return;
      }

      const data = response?.data || [];
      setTickets(Array.isArray(data) ? data : []);
      setTotalCount(Array.isArray(data) ? data.length : 0);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // ✅ Don't throw - just set empty state
      setTickets([]);
      setTotalCount(0);
    }
  }, []);

  // ✅ FIXED: Fetch knowledge base with error handling
  const fetchKnowledgeBase = useCallback(async () => {
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof customerAPI.getKnowledgeBase === 'function') {
        response = await customerAPI.getKnowledgeBase();
      } else if (typeof customerAPI.getHelpArticles === 'function') {
        response = await customerAPI.getHelpArticles();
      } else {
        setKnowledgeBase([]);
        return;
      }

      const data = response?.data || [];
      setKnowledgeBase(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setKnowledgeBase([]);
    }
  }, []);

  // ✅ FIXED: Fetch FAQs with error handling
  const fetchFAQs = useCallback(async () => {
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof customerAPI.getFAQs === 'function') {
        response = await customerAPI.getFAQs();
      } else if (typeof customerAPI.getHelpFAQs === 'function') {
        response = await customerAPI.getHelpFAQs();
      } else {
        setFaqs([]);
        return;
      }

      const data = response?.data || [];
      setFaqs(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
    }
  }, []);

  // ✅ FIXED: Load all data with proper error handling
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTickets(),
        fetchKnowledgeBase(),
        fetchFAQs()
      ]);
    } catch (error) {
      console.error('Error loading help center data:', error);
      setError('Failed to load some help center data. Please refresh.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [fetchTickets, fetchKnowledgeBase, fetchFAQs]);

  // Polling for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        loadData(false).finally(() => {
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

  useEffect(() => {
    loadData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // ✅ FIXED: Create ticket with proper error handling
  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      const payload = {
        subject: newTicket.subject,
        category: newTicket.category || 'general',
        priority: newTicket.priority,
        message: newTicket.message
      };

      if (typeof customerAPI.createSupportTicket === 'function') {
        await customerAPI.createSupportTicket(payload);
      } else if (typeof customerAPI.createTicket === 'function') {
        await customerAPI.createTicket(payload);
      } else {
        toast.error('Ticket creation not available');
        return;
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

  // ✅ FIXED: Reply to ticket with proper error handling
  const replyToTicket = async (ticketId) => {
    if (!ticketId) return;
    if (!ticketReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      const payload = { message: ticketReply };

      if (typeof customerAPI.replyToTicket === 'function') {
        await customerAPI.replyToTicket(ticketId, payload);
      } else if (typeof customerAPI.addTicketReply === 'function') {
        await customerAPI.addTicketReply(ticketId, payload);
      } else {
        toast.error('Reply functionality not available');
        return;
      }
      
      toast.success('Reply sent successfully');
      setTicketReply('');
      await fetchTickets();
      
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
      return <Badge bg="secondary">Unknown</Badge>;
    }
    
    const lowerStatus = status.toLowerCase();
    const configs = {
      open: { variant: 'warning', text: 'Open' },
      in_progress: { variant: 'info', text: 'In Progress' },
      resolved: { variant: 'success', text: 'Resolved' },
      closed: { variant: 'secondary', text: 'Closed' },
      pending: { variant: 'warning', text: 'Pending' }
    };
    const config = configs[lowerStatus] || configs.open;
    return <Badge bg={config.variant}>{config.text}</Badge>;
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

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const subject = getField(ticket, ['subject', 'title', 'issue'], '');
    const matchesSearch = searchTerm === '' ||
      subject.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getField(ticket, ['status', 'ticket_status'], 'open');
    const matchesStatus = filterStatus === 'all' || status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
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
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
            <AlertCircle size={18} className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => loadData(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <LifeBuoy size={28} className="text-primary" />
              Help Center
            </h2>
            <p className="text-muted mb-0">Get support and find answers to your questions</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowTicketModal(true)} 
            className="d-flex align-items-center gap-2"
            style={{ borderRadius: '12px', padding: '10px 24px' }}
          >
            <Plus size={18} />
            New Ticket
          </Button>
        </div>

        {/* Quick Stats */}
        <Row className="mb-4 g-3">
          <Col md={3} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#6366f1" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Total Tickets</p>
                  <h4 className="mb-0 fw-bold">{tickets.length}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} color="#f59e0b" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Open Tickets</p>
                  <h4 className="mb-0 fw-bold">
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
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} color="#10b981" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Resolved</p>
                  <h4 className="mb-0 fw-bold">
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
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
              <Card.Body className="d-flex align-items-center gap-3 p-3">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color="#8b5cf6" />
                </div>
                <div>
                  <p className="text-muted mb-0 small">Knowledge Base</p>
                  <h4 className="mb-0 fw-bold">{knowledgeBase.length + faqs.length}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tickets Section */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FileText size={20} />
              Support Tickets
            </h5>

            {/* Filters */}
            <Row className="mb-4 g-2">
              <Col md={6}>
                <InputGroup style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <InputGroup.Text style={{ background: 'white', border: '1px solid #e2e8f0', borderRight: 'none' }}>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: '1px solid #e2e8f0', borderLeft: 'none' }}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ borderRadius: '12px' }}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button variant="outline-secondary" style={{ width: '100%', borderRadius: '12px' }}>
                  <Filter size={16} className="me-2" />
                  More Filters
                </Button>
              </Col>
            </Row>

            {/* Tickets Table */}
            {paginatedTickets.length === 0 ? (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No tickets found</h6>
                <p className="text-muted small">Create a support ticket to get help</p>
                <Button variant="link" onClick={() => setShowTicketModal(true)} className="text-primary">
                  Create a ticket
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Ticket ID</th>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Subject</th>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Category</th>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Priority</th>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Status</th>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Date</th>
                        <th style={{ fontWeight: '600', fontSize: '12px', color: '#4a5568' }}>Actions</th>
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
                          <tr key={ticketId}>
                            <td style={{ fontWeight: '600', color: '#6366f1' }}>#{ticketId?.slice(-8) || 'N/A'}</td>
                            <td>{subject}</td>
                            <td><Badge bg="light" className="text-dark">{category}</Badge></td>
                            <td>{getPriorityBadge(priority)}</td>
                            <td>{getStatusBadge(status)}</td>
                            <td><small>{format(new Date(createdAt), 'MMM dd, yyyy')}</small></td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => setSelectedTicket(ticket)}
                                style={{ borderRadius: '8px' }}
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
                  <div className="d-flex justify-content-center mt-4 pt-3 border-top">
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
          </Card.Body>
        </Card>

        {/* Knowledge Base Section */}
        <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <BookOpen size={20} />
              Knowledge Base
            </h5>
            <Row className="g-3">
              {knowledgeBase.length === 0 && faqs.length === 0 ? (
                <Col>
                  <div className="text-center py-4">
                    <BookOpen size={40} className="text-muted opacity-50 mb-2" />
                    <p className="text-muted mb-0">No articles or FAQs available</p>
                  </div>
                </Col>
              ) : (
                <>
                  {knowledgeBase.map(article => {
                    const articleId = article.id || article._id;
                    const title = getField(article, ['title', 'name', 'subject'], 'Untitled Article');
                    const category = getField(article, ['category', 'topic', 'section'], 'General');
                    const content = getField(article, ['content', 'description', 'body'], '');
                    const readTime = article.read_time || Math.ceil((content || '').length / 1000) + 1;
                    
                    return (
                      <Col md={6} key={articleId}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="fw-semibold mb-1">{title}</h6>
                              <Badge bg="light" className="text-dark">{category}</Badge>
                            </div>
                            <p className="text-muted small mb-2">Read time: {readTime} mins</p>
                            <Button variant="link" className="p-0 text-primary d-flex align-items-center gap-1">
                              Read Article <ChevronRight size={14} />
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                  {faqs.map(faq => {
                    const faqId = faq.id || faq._id;
                    const question = getField(faq, ['question', 'title', 'subject'], 'Untitled FAQ');
                    const category = getField(faq, ['category', 'topic', 'section'], 'General');
                    
                    return (
                      <Col md={6} key={faqId}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="fw-semibold mb-1">❓ {question}</h6>
                              <Badge bg="light" className="text-dark">{category}</Badge>
                            </div>
                            <p className="text-muted small mb-2">Helpful: {faq.helpful_count || 0} times</p>
                            <Button variant="link" className="p-0 text-primary d-flex align-items-center gap-1">
                              View Answer <ChevronRight size={14} />
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                </>
              )}
            </Row>
          </Card.Body>
        </Card>
      </Container>

      {/* Create Ticket Modal */}
      <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Plus size={20} className="text-primary" />
            Create Support Ticket
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Subject <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Brief summary of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                style={{ borderRadius: '10px' }}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    style={{ borderRadius: '10px' }}
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
                <Form.Group>
                  <Form.Label className="fw-semibold">Priority</Form.Label>
                  <Form.Select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    style={{ borderRadius: '10px' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Please provide detailed information about your issue..."
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                style={{ borderRadius: '10px', resize: 'vertical' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowTicketModal(false)} style={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createTicket} disabled={submitting} style={{ borderRadius: '10px' }}>
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal show={!!selectedTicket} onHide={() => setSelectedTicket(null)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FileText size={20} className="text-primary" />
            Ticket #{selectedTicket?.id || selectedTicket?._id ? (selectedTicket.id || selectedTicket._id).slice(-8) : 'N/A'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedTicket && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                <div>
                  <h6 className="fw-semibold mb-2">
                    {getField(selectedTicket, ['subject', 'title', 'issue'], 'Untitled')}
                  </h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <small className="text-muted">
                  Created {format(new Date(selectedTicket.created_at || selectedTicket.createdAt || selectedTicket.date || new Date()), 'MMM dd, yyyy')}
                </small>
              </div>

              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                {(selectedTicket.messages || []).map((msg, idx) => {
                  const sender = getField(msg, ['sender', 'author', 'user_type', 'sender_type'], 'user');
                  const isUser = sender === 'user' || sender === 'customer' || sender === 'provider';
                  const message = getField(msg, ['message', 'content', 'body', 'text'], '');
                  const date = msg.created_at || msg.createdAt || msg.timestamp || new Date().toISOString();
                  
                  return (
                    <div key={idx} className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: isUser ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
                        color: isUser ? 'white' : '#1a202c',
                        borderBottomRightRadius: isUser ? '4px' : '16px',
                        borderBottomLeftRadius: isUser ? '16px' : '4px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.8 }}>
                          {isUser ? 'You' : 'Support Agent'}
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: 1.5 }}>{message}</div>
                        <div style={{ 
                          fontSize: '10px', 
                          marginTop: '6px', 
                          opacity: 0.7,
                          color: isUser ? 'rgba(255,255,255,0.7)' : '#94a3b8'
                        }}>
                          {format(new Date(date), 'hh:mm a, MMM dd')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div className="border-top pt-3">
                  <Form.Group className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Type your reply..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      style={{ borderRadius: '10px', resize: 'vertical' }}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="secondary" onClick={() => setSelectedTicket(null)} style={{ borderRadius: '10px' }}>
                      Close
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => replyToTicket(selectedTicket.id || selectedTicket._id)} 
                      disabled={submitting}
                      className="d-flex align-items-center gap-2"
                      style={{ borderRadius: '10px' }}
                    >
                      {submitting ? 'Sending...' : <><Send size={16} />Send Reply</>}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CustomerHelpCenter;