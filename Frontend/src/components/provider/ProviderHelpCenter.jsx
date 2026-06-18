// src/components/provider/ProviderHelpCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Accordion,
  Form,
  Badge,
  Alert,
  Spinner,
  Modal,
  Pagination
} from 'react-bootstrap';
import {
  Search,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  BookOpen,
  Video,
  ChevronRight,
  Send,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Paperclip,
  User,
  Calendar,
  Star,
  Users,
  Globe,
  Shield,
  Award,
  Zap,
  Headphones,
  ExternalLink
} from 'lucide-react';
// All social icons from react-icons/fa
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderHelpCenter = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: '',
    attachments: []
  });
  const [ticketReply, setTicketReply] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [liveChatStatus, setLiveChatStatus] = useState({
    available: true,
    agents: 3,
    waitTime: '< 2 minutes'
  });

  const itemsPerPage = 10;

  // Fetch FAQs
  const fetchFAQs = useCallback(async () => {
    try {
      const response = await providerAPI.getFAQs({
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage
      });
      setFaqs(response.data.faqs || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([
        {
          id: 1,
          category: 'Getting Started',
          question: 'How do I create my service profile?',
          answer: 'To create your service profile, go to Settings > Profile. Fill in your business information, upload photos, set your service areas, and define your pricing.',
          helpful_count: 45,
          views: 234
        },
        {
          id: 2,
          category: 'Payments',
          question: 'When do I get paid?',
          answer: 'Payments are processed within 2-3 business days after job completion. Funds are transferred to your connected bank account.',
          helpful_count: 128,
          views: 567
        }
      ]);
    }
  }, [searchTerm, currentPage]);

  // Fetch support tickets
  const fetchTickets = useCallback(async () => {
    try {
      const response = await providerAPI.getSupportTickets();
      setTickets(response.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([
        {
          id: 'TKT-001',
          subject: 'Payment delay issue',
          status: 'resolved',
          priority: 'high',
          date: '2024-12-10',
          lastUpdate: '2024-12-12',
          messages: [
            { sender: 'user', message: 'My payment is delayed by 5 days', date: '2024-12-10' },
            { sender: 'support', message: 'We are looking into this issue', date: '2024-12-11' }
          ]
        }
      ]);
    }
  }, []);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await providerAPI.getAnnouncements();
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([
        {
          id: 1,
          title: 'New Payout System',
          content: 'We are upgrading our payout system for faster transfers',
          date: '2024-12-01',
          type: 'info'
        }
      ]);
    }
  }, []);

  // Fetch knowledge base
  const fetchKnowledgeBase = useCallback(async () => {
    try {
      const response = await providerAPI.getKnowledgeBase();
      setKnowledgeBase(response.data || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFAQs(),
      fetchTickets(),
      fetchAnnouncements(),
      fetchKnowledgeBase()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [searchTerm, currentPage]);

  // Create support ticket
  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await providerAPI.createSupportTicket(newTicket);
      toast.success('Support ticket created successfully');
      setShowTicketModal(false);
      setNewTicket({
        subject: '',
        category: '',
        priority: 'medium',
        message: '',
        attachments: []
      });
      await fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Reply to ticket
  const replyToTicket = async (ticketId) => {
    if (!ticketReply.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      await providerAPI.replyToTicket(ticketId, ticketReply);
      toast.success('Reply sent successfully');
      setTicketReply('');
      await fetchTickets();
    } catch (error) {
      console.error('Error replying to ticket:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit contact form
  const submitContactForm = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await providerAPI.submitContactForm(contactForm);
      toast.success('Message sent successfully. We will get back to you soon.');
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle FAQ feedback
  const handleFeedback = async (faqId, isHelpful) => {
    setFeedbackGiven({ ...feedbackGiven, [faqId]: isHelpful });
    try {
      await providerAPI.submitFAQFeedback(faqId, isHelpful);
      toast.success('Thank you for your feedback!');
      await fetchFAQs();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Get ticket status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: 'warning', icon: AlertCircle, text: 'Open' },
      in_progress: { variant: 'info', icon: Clock, text: 'In Progress' },
      resolved: { variant: 'success', icon: CheckCircle, text: 'Resolved' },
      closed: { variant: 'secondary', icon: XCircle, text: 'Closed' }
    };
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1">
        <Icon size={12} />
        <span className="ms-1">{config.text}</span>
      </Badge>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { variant: 'secondary', text: 'Low' },
      medium: { variant: 'info', text: 'Medium' },
      high: { variant: 'warning', text: 'High' },
      urgent: { variant: 'danger', text: 'Urgent' }
    };
    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

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
        {/* Hero Section */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '60px 40px',
              textAlign: 'center',
              color: 'white'
            }}
          >
            <HelpCircle size={56} className="mb-3" style={{ opacity: 0.9 }} />
            <h2 className="mb-3 fw-bold">How can we help you?</h2>
            <p className="mb-4" style={{ fontSize: '18px', opacity: 0.95 }}>
              Find answers to common questions or connect with our support team
            </p>
            <div className="position-relative" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <Form.Control
                type="text"
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  paddingLeft: '48px', 
                  borderRadius: '50px', 
                  height: '56px',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          </div>
        </Card>

        {/* Live Chat Status */}
        {liveChatStatus.available && (
          <Alert variant="success" className="mb-4 d-flex justify-content-between align-items-center" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-success p-2">
                <MessageCircle size={20} color="white" />
              </div>
              <div>
                <strong>Live Chat Available</strong>
                <div className="small">
                  {liveChatStatus.agents} agents online • Wait time: {liveChatStatus.waitTime}
                </div>
              </div>
            </div>
            <Button variant="success" size="sm">
              Start Chat
            </Button>
          </Alert>
        )}

        {/* Quick Actions */}
        <Row className="mb-5 g-4">
          <Col md={3} sm={6}>
            <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '16px', cursor: 'pointer' }}>
              <Card.Body className="p-4">
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', background: '#3b82f620' }}>
                  <Mail size={28} color="#3b82f6" />
                </div>
                <h6 className="fw-bold mb-1">Email Support</h6>
                <small className="text-muted">support@servicehub.com</small>
                <p className="small text-muted mt-2 mb-0">Response within 24h</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '16px', cursor: 'pointer' }}>
              <Card.Body className="p-4">
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', background: '#10b98120' }}>
                  <Phone size={28} color="#10b981" />
                </div>
                <h6 className="fw-bold mb-1">Phone Support</h6>
                <small className="text-muted">+234 (0) 123 456 7890</small>
                <p className="small text-muted mt-2 mb-0">Mon-Fri, 9AM-6PM</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '16px', cursor: 'pointer' }}>
              <Card.Body className="p-4">
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', background: '#f59e0b20' }}>
                  <MessageCircle size={28} color="#f59e0b" />
                </div>
                <h6 className="fw-bold mb-1">Live Chat</h6>
                <small className="text-muted">Available 24/7</small>
                <p className="small text-muted mt-2 mb-0">Instant response</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card 
              className="border-0 shadow-sm text-center h-100" 
              style={{ borderRadius: '16px', cursor: 'pointer' }}
              onClick={() => setShowTicketModal(true)}
            >
              <Card.Body className="p-4">
                <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px', background: '#ef444420' }}>
                  <FileText size={28} color="#ef4444" />
                </div>
                <h6 className="fw-bold mb-1">Create Ticket</h6>
                <small className="text-muted">Submit a request</small>
                <p className="small text-muted mt-2 mb-0">Get dedicated support</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* Main Content */}
          <Col lg={8}>
            {/* Announcements */}
            {announcements.length > 0 && (
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <Zap size={18} className="text-warning" />
                    Latest Announcements
                  </h6>
                </Card.Header>
                <Card.Body>
                  {announcements.map(announcement => (
                    <Alert key={announcement.id} variant={announcement.type || 'info'} className="mb-2" style={{ borderRadius: '12px' }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{announcement.title}</strong>
                          <p className="mb-0 small">{announcement.content}</p>
                        </div>
                        <small className="text-muted">
                          {formatDistanceToNow(new Date(announcement.date), { addSuffix: true })}
                        </small>
                      </div>
                    </Alert>
                  ))}
                </Card.Body>
              </Card>
            )}

            {/* FAQs */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Frequently Asked Questions</h5>
              <small className="text-muted">{faqs.length} articles found</small>
            </div>

            {faqs.length === 0 ? (
              <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '16px' }}>
                <Card.Body>
                  <HelpCircle size={48} className="text-muted mb-3 opacity-50" />
                  <h6 className="text-muted">No results found</h6>
                  <p className="text-muted small">Try different keywords or browse our categories</p>
                </Card.Body>
              </Card>
            ) : (
              faqs.map((faq) => (
                <Card key={faq.id} className="border-0 shadow-sm mb-3" style={{ borderRadius: '16px' }}>
                  <Accordion>
                    <Accordion.Item eventKey={faq.id.toString()} style={{ border: 'none' }}>
                      <Accordion.Header className="bg-white">
                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                          <div>
                            <span className="fw-semibold">{faq.question}</span>
                            <div className="small text-muted mt-1">
                              <Badge bg="light" text="dark" className="me-2">{faq.category}</Badge>
                              <span>{faq.views} views</span>
                            </div>
                          </div>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <p>{faq.answer}</p>
                        <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <small className="text-muted">Was this helpful?</small>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-success d-flex align-items-center gap-1"
                              onClick={() => handleFeedback(faq.id, true)}
                            >
                              <ThumbsUp size={14} />
                              Yes ({faq.helpful_count || 0})
                            </Button>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 text-danger d-flex align-items-center gap-1"
                              onClick={() => handleFeedback(faq.id, false)}
                            >
                              <ThumbsDown size={14} />
                              No
                            </Button>
                          </div>
                          {feedbackGiven[faq.id] && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                              <CheckCircle size={12} />
                              Thanks for your feedback!
                            </Badge>
                          )}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Card>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
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
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Support Tickets */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Support Tickets</h6>
                <Button 
                  size="sm" 
                  variant="primary" 
                  onClick={() => setShowTicketModal(true)}
                  style={{ borderRadius: '10px' }}
                >
                  New Ticket
                </Button>
              </Card.Header>
              <Card.Body className="p-0">
                {tickets.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText size={32} className="text-muted mb-2 opacity-50" />
                    <p className="text-muted small mb-0">No support tickets</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="p-3 border-bottom"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <strong className="small">{ticket.subject}</strong>
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <div className="d-flex gap-3 align-items-center">
                            <small className="text-muted">ID: {ticket.id}</small>
                            <small className="text-muted">
                              <Calendar size={10} className="me-1" />
                              {format(new Date(ticket.date), 'MMM dd')}
                            </small>
                          </div>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Knowledge Base */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <BookOpen size={18} />
                  Knowledge Base
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">Getting Started Guide</span>
                    <ExternalLink size={14} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">Video Tutorials</span>
                    <ExternalLink size={14} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">API Documentation</span>
                    <ExternalLink size={14} className="text-muted" />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-semibold">Community Forum</span>
                    <ExternalLink size={14} className="text-muted" />
                  </div>
                </div>
                <hr />
                <div className="mt-3">
                  <h6 className="small fw-bold mb-2">Popular Guides</h6>
                  {knowledgeBase.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small">{item.title}</span>
                      <ChevronRight size={14} className="text-muted" />
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Contact Form */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h6 className="fw-bold mb-0">Still need help?</h6>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Your Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Your Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Subject</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="What is your issue about?"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe your issue in detail..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    onClick={submitContactForm}
                    disabled={submitting}
                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '10px' }}
                  >
                    {submitting ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      <Send size={16} />
                    )}
                    {submitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Create Ticket Modal */}
      <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FileText size={18} className="me-2" />
            Create Support Ticket
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Subject</Form.Label>
              <Form.Control
                type="text"
                placeholder="Brief summary of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Category</Form.Label>
                  <Form.Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
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
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Please provide detailed information about your issue..."
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-semibold">Attachments (Optional)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => setNewTicket({ ...newTicket, attachments: Array.from(e.target.files) })}
              />
              <Form.Text className="text-muted">Upload screenshots or documents (Max 5MB)</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowTicketModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={createTicket}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal show={!!selectedTicket} onHide={() => setSelectedTicket(null)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Ticket #{selectedTicket?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedTicket && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h6 className="mb-1">{selectedTicket.subject}</h6>
                  <div className="d-flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <small className="text-muted">
                  Created {format(new Date(selectedTicket.date), 'MMM dd, yyyy')}
                </small>
              </div>

              <div className="mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedTicket.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-3 d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`p-3 rounded-3 ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light'}`}
                      style={{ maxWidth: '70%' }}
                    >
                      <div className="small mb-1">
                        {msg.sender === 'user' ? 'You' : 'Support Agent'}
                      </div>
                      <div className="small">{msg.message}</div>
                      <div className={`small mt-1 ${msg.sender === 'user' ? 'text-white-50' : 'text-muted'}`}>
                        {format(new Date(msg.date), 'hh:mm a, MMM dd')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== 'closed' && (
                <div>
                  <Form.Group className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Type your reply..."
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => replyToTicket(selectedTicket.id)}
                      disabled={submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .accordion-button:not(.collapsed) {
          background-color: white;
          box-shadow: none;
        }
        .accordion-button:focus {
          box-shadow: none;
          border-color: rgba(0,0,0,0.125);
        }
      `}</style>
    </div>
  );
};

export default ProviderHelpCenter;