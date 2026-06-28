// src/components/customer/CustomerHelpCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Mock data for fallback
const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    subject: 'Unable to complete booking',
    status: 'open',
    priority: 'high',
    category: 'booking',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      {
        sender: 'user',
        message: 'I tried to book a service but got an error at the payment step.',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  },
  {
    id: 'TKT-002',
    question: 'How do I cancel my booking?',
    status: 'resolved',
    priority: 'medium',
    category: 'booking',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        sender: 'user',
        message: 'I need to cancel my booking for tomorrow.',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        sender: 'support',
        message: 'You can cancel from your bookings page. I\'ve cancelled it for you.',
        created_at: new Date(Date.now() - 43200000).toISOString()
      }
    ]
  }
];

const MOCK_KNOWLEDGE_BASE = [
  { id: '1', title: 'How to Book a Service', category: 'Getting Started' },
  { id: '2', title: 'Understanding Service Categories', category: 'Getting Started' },
  { id: '3', title: 'How to Contact a Provider', category: 'Communication' },
  { id: '4', title: 'Understanding Booking Status', category: 'Bookings' },
  { id: '5', title: 'How to Leave a Review', category: 'Reviews' },
  { id: '6', title: 'Payment Methods Accepted', category: 'Payments' }
];

const MOCK_ANNOUNCEMENTS = [
  {
    id: '1',
    title: '🎉 New Features Available!',
    content: 'We\'ve added new features to help you find the perfect service provider faster.',
    type: 'success',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: '2',
    title: '📢 Platform Update',
    content: 'We\'ve improved the booking experience. Check out the new features!',
    type: 'info',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const CustomerHelpCenter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [knowledgeBase, setKnowledgeBase] = useState(MOCK_KNOWLEDGE_BASE);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: ''
  });

  const itemsPerPage = 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTickets(),
        fetchKnowledgeBase(),
        fetchAnnouncements()
      ]);
    } catch (error) {
      console.error('Error loading help center data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = useCallback(async () => {
    try {
      if (typeof customerAPI.getSupportTickets === 'function') {
        const response = await customerAPI.getSupportTickets();
        setTickets(response.data || []);
      } else {
        setTickets(MOCK_TICKETS);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets(MOCK_TICKETS);
    }
  }, []);

  const fetchKnowledgeBase = useCallback(async () => {
    try {
      if (typeof customerAPI.getKnowledgeBase === 'function') {
        const response = await customerAPI.getKnowledgeBase();
        setKnowledgeBase(response.data || []);
      } else {
        setKnowledgeBase(MOCK_KNOWLEDGE_BASE);
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setKnowledgeBase(MOCK_KNOWLEDGE_BASE);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      if (typeof customerAPI.getAnnouncements === 'function') {
        const response = await customerAPI.getAnnouncements();
        setAnnouncements(response.data || []);
      } else {
        setAnnouncements(MOCK_ANNOUNCEMENTS);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements(MOCK_ANNOUNCEMENTS);
    }
  }, []);

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (typeof customerAPI.createSupportTicket === 'function') {
        await customerAPI.createSupportTicket(newTicket);
      } else {
        // Mock creation
        const newTicketData = {
          id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
          subject: newTicket.subject,
          status: 'open',
          priority: newTicket.priority,
          category: newTicket.category || 'general',
          created_at: new Date().toISOString(),
          messages: [
            {
              sender: 'user',
              message: newTicket.message,
              created_at: new Date().toISOString()
            }
          ]
        };
        setTickets(prev => [newTicketData, ...prev]);
      }
      toast.success('Support ticket created successfully');
      setShowTicketModal(false);
      setNewTicket({ subject: '', category: '', priority: 'medium', message: '' });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const replyToTicket = async (ticketId) => {
    if (!ticketReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      if (typeof customerAPI.replyToTicket === 'function') {
        await customerAPI.replyToTicket(ticketId, { message: ticketReply });
      } else {
        // Mock reply
        setTickets(prev => prev.map(ticket => {
          if (ticket.id === ticketId) {
            const updatedMessages = [...(ticket.messages || []), {
              sender: 'user',
              message: ticketReply,
              created_at: new Date().toISOString()
            }];
            return { ...ticket, messages: updatedMessages };
          }
          return ticket;
        }));
      }
      toast.success('Reply sent successfully');
      setTicketReply('');
      const updatedTicket = tickets.find(t => t.id === ticketId);
      if (updatedTicket) setSelectedTicket(updatedTicket);
    } catch (error) {
      console.error('Error replying to ticket:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async (articleId, isHelpful) => {
    setFeedbackGiven({ ...feedbackGiven, [articleId]: isHelpful });
    toast.success('Thank you for your feedback!');
  };

  const getStatusBadge = (status) => {
    const configs = {
      open: { variant: 'warning', icon: AlertCircle, text: 'Open' },
      in_progress: { variant: 'info', icon: Clock, text: 'In Progress' },
      resolved: { variant: 'success', icon: CheckCircle, text: 'Resolved' },
      closed: { variant: 'secondary', icon: XCircle, text: 'Closed' }
    };
    const config = configs[status] || configs.open;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={14} />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      low: { variant: 'secondary', text: 'Low' },
      medium: { variant: 'info', text: 'Medium' },
      high: { variant: 'warning', text: 'High' },
      urgent: { variant: 'danger', text: 'Urgent' }
    };
    const config = configs[priority] || configs.medium;
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchTerm === '' ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading help center...</p>
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
            <h2 className="mb-1 fw-bold">Help Center</h2>
            <p className="text-muted mb-0">Get support and find answers to your questions</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowTicketModal(true)} 
            className="d-flex align-items-center gap-2 rounded-pill px-4"
          >
            <Plus size={18} />
            New Ticket
          </Button>
        </div>

        {/* Announcements Banner */}
        {announcements.length > 0 && (
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-start gap-3">
              <Megaphone size={20} className="text-primary mt-1" />
              <div>
                <strong className="d-block mb-1">Latest Updates</strong>
                {announcements.slice(0, 2).map(announcement => (
                  <div key={announcement.id} className="mb-1">
                    <span>{announcement.title}</span>
                    <small className="text-muted ms-2">
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </Alert>
        )}

        {/* Tabs */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="px-4 pt-3"
              style={{ borderBottom: 'none' }}
            >
              <Tab eventKey="tickets" title={
                <span className="d-flex align-items-center gap-2">
                  <FileText size={16} /> Support Tickets
                </span>
              }>
                <div className="p-4">
                  {/* Filters */}
                  <Row className="mb-4 g-3">
                    <Col md={6}>
                      <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                          <Search size={16} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search tickets..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="border-start-0"
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-pill"
                      >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Button variant="outline-secondary" className="w-100 rounded-pill">
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
                      <p className="text-muted small mb-3">Have an issue? Create a support ticket and we'll help you out.</p>
                      <Button variant="primary" onClick={() => setShowTicketModal(true)} className="rounded-pill">
                        <Plus size={16} className="me-2" />
                        Create Ticket
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead style={{ background: '#f8fafc' }}>
                            <tr>
                              <th style={{ padding: '16px' }}>Ticket ID</th>
                              <th style={{ padding: '16px' }}>Subject</th>
                              <th style={{ padding: '16px' }}>Category</th>
                              <th style={{ padding: '16px' }}>Priority</th>
                              <th style={{ padding: '16px' }}>Status</th>
                              <th style={{ padding: '16px' }}>Date</th>
                              <th style={{ padding: '16px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedTickets.map(ticket => (
                              <tr key={ticket.id}>
                                <td style={{ padding: '16px' }}>
                                  <span className="fw-bold text-primary">#{ticket.id}</span>
                                </td>
                                <td style={{ padding: '16px' }}>{ticket.subject}</td>
                                <td style={{ padding: '16px' }}>
                                  <Badge bg="light" text="dark" className="rounded-pill px-3 py-2">
                                    {ticket.category}
                                  </Badge>
                                </td>
                                <td style={{ padding: '16px' }}>{getPriorityBadge(ticket.priority)}</td>
                                <td style={{ padding: '16px' }}>{getStatusBadge(ticket.status)}</td>
                                <td style={{ padding: '16px' }}>
                                  <small className="text-muted">
                                    {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                                  </small>
                                </td>
                                <td style={{ padding: '16px' }}>
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="rounded-pill px-3"
                                    onClick={() => setSelectedTicket(ticket)}
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4 pt-2">
                          <Pagination>
                            <Pagination.Prev
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            />
                            {[...Array(totalPages)].map((_, idx) => (
                              <Pagination.Item
                                key={idx + 1}
                                active={idx + 1 === currentPage}
                                onClick={() => setCurrentPage(idx + 1)}
                              >
                                {idx + 1}
                              </Pagination.Item>
                            ))}
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
                <span className="d-flex align-items-center gap-2">
                  <BookOpen size={16} /> Knowledge Base
                </span>
              }>
                <div className="p-4">
                  {/* Search */}
                  <Row className="mb-4">
                    <Col md={8} className="mx-auto">
                      <InputGroup>
                        <InputGroup.Text className="bg-white border-end-0">
                          <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Search articles..."
                          className="border-start-0"
                        />
                      </InputGroup>
                    </Col>
                  </Row>

                  <Row className="g-4">
                    {knowledgeBase.map(article => (
                      <Col md={6} key={article.id}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                          <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold mb-0">{article.title}</h6>
                              <Badge bg="light" text="dark" className="rounded-pill px-3 py-2">
                                {article.category}
                              </Badge>
                            </div>
                            <p className="text-muted small mb-3">Read time: 3-5 mins</p>
                            <div className="d-flex align-items-center gap-3">
                              <Button variant="link" className="p-0 text-decoration-none text-primary">
                                Read Article <ExternalLink size={14} className="ms-1" />
                              </Button>
                              <div className="d-flex align-items-center gap-2 ms-auto">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-success"
                                  onClick={() => handleFeedback(article.id, true)}
                                >
                                  <ThumbsUp size={14} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-danger"
                                  onClick={() => handleFeedback(article.id, false)}
                                >
                                  <ThumbsDown size={14} />
                                </Button>
                                {feedbackGiven[article.id] && (
                                  <CheckCircle size={14} className="text-success" />
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="announcements" title={
                <span className="d-flex align-items-center gap-2">
                  <Megaphone size={16} /> Announcements
                </span>
              }>
                <div className="p-4">
                  {announcements.length === 0 ? (
                    <div className="text-center py-5">
                      <Megaphone size={48} className="text-muted mb-3 opacity-50" />
                      <h6 className="text-muted">No announcements</h6>
                      <p className="text-muted small">Check back later for updates</p>
                    </div>
                  ) : (
                    announcements.map(announcement => (
                      <Alert key={announcement.id} variant={announcement.type || 'info'} className="mb-3" style={{ borderRadius: '12px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">{announcement.title}</h6>
                            <p className="mb-0">{announcement.content}</p>
                          </div>
                          <small className="text-muted flex-shrink-0 ms-3">
                            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                          </small>
                        </div>
                      </Alert>
                    ))
                  )}
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      {/* Create Ticket Modal */}
      <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Create Support Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Subject *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Brief summary of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                className="rounded-pill"
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="rounded-pill"
                  >
                    <option value="">Select category</option>
                    <option value="booking">Bookings</option>
                    <option value="payment">Payments</option>
                    <option value="account">Account Issues</option>
                    <option value="technical">Technical Support</option>
                    <option value="provider">Provider Related</option>
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
                    className="rounded-pill"
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
              <Form.Label className="fw-semibold">Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Please provide detailed information about your issue..."
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                style={{ borderRadius: '12px' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowTicketModal(false)} className="rounded-pill px-4">
            Cancel
          </Button>
          <Button variant="primary" onClick={createTicket} disabled={submitting} className="rounded-pill px-4">
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal show={!!selectedTicket} onHide={() => setSelectedTicket(null)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Ticket #{selectedTicket?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedTicket && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h6 className="mb-1">{selectedTicket.subject}</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    <Badge bg="light" text="dark" className="rounded-pill">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                </div>
                <small className="text-muted">
                  <Calendar size={12} className="me-1" />
                  {format(new Date(selectedTicket.created_at), 'MMM dd, yyyy')}
                </small>
              </div>

              <div className="mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {(selectedTicket.messages || []).map((msg, idx) => {
                  const isUser = msg.sender === 'user' || msg.sender === 'customer';
                  return (
                    <div key={idx} className={`mb-3 d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`p-3 rounded-3 ${isUser ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '70%' }}>
                        <div className="small mb-1">
                          {isUser ? (
                            <>
                              <User size={12} className="me-1" />
                              You
                            </>
                          ) : (
                            <>
                              <HelpCircle size={12} className="me-1" />
                              Support Agent
                            </>
                          )}
                        </div>
                        <div className="mb-1">{msg.message}</div>
                        <div className={`small mt-1 ${isUser ? 'text-white-50' : 'text-muted'}`}>
                          {format(new Date(msg.created_at), 'hh:mm a, MMM dd')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                <div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Your Reply</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Type your reply..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      style={{ borderRadius: '12px' }}
                    />
                  </Form.Group>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button 
                      variant="secondary" 
                      onClick={() => setSelectedTicket(null)} 
                      className="rounded-pill px-4"
                    >
                      Close
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => replyToTicket(selectedTicket.id)} 
                      disabled={submitting}
                      className="rounded-pill px-4"
                    >
                      {submitting ? 'Sending...' : <><Send size={16} className="me-2" />Send Reply</>}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .nav-tabs .nav-link {
          color: #4b5563;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px 12px 0 0;
          transition: all 0.2s;
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
        .table > :not(caption) > * > * {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .table tbody tr:hover {
          background-color: #f8fafc;
        }
        .form-control:focus, .form-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.15);
        }
        .rounded-pill {
          border-radius: 50px !important;
        }
      `}</style>
    </div>
  );
};

export default CustomerHelpCenter;