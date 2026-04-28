// src/pages/HelpCenter.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container, Row, Col, Card, Accordion, Form, Button, Badge,
  InputGroup, CloseButton, Modal
} from 'react-bootstrap';
import {
  FaSearch, FaQuestionCircle, FaEnvelope, FaComment, FaPhone,
  FaFileAlt, FaDownload, FaSpinner, FaTimes, FaPaperPlane,
  FaUserCircle, FaRobot, FaCircle
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';


const HelpCenter = () => {
  // -------------------- Search & Guides State --------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const searchInputRef = useRef(null);

  // -------------------- Chat State (Modal) --------------------
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [someoneTyping, setSomeoneTyping] = useState(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // -------------------- FAQ Data (unchanged) --------------------
  const faqs = [
    {
      category: 'Bookings',
      questions: [
        { q: 'How do I book a service?', a: 'To book a service, browse through our service categories, select your desired service, choose a provider, select a date and time, and complete the payment.' },
        { q: 'Can I cancel a booking?', a: 'Yes, you can cancel a booking up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a fee.' },
        { q: 'How do I reschedule a booking?', a: 'Go to My Bookings, select the booking you want to reschedule, and click on "Reschedule". Choose a new date and time.' }
      ]
    },
    {
      category: 'Payments',
      questions: [
        { q: 'What payment methods are accepted?', a: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and wallet balance.' },
        { q: 'How do I get a refund?', a: 'Refunds are processed automatically for cancelled bookings within the cancellation window. Refunds typically take 5-7 business days.' },
        { q: 'Is my payment information secure?', a: 'Yes, we use industry-standard encryption and never store your full payment details on our servers.' }
      ]
    },
    {
      category: 'Account',
      questions: [
        { q: 'How do I reset my password?', a: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.' },
        { q: 'How do I update my profile?', a: 'Go to Profile Settings from your dashboard to update your personal information and preferences.' },
        { q: 'What are loyalty points?', a: 'Loyalty points are rewards you earn for every booking. You can redeem them for discounts on future services.' }
      ]
    }
  ];

  // -------------------- Guides Data (unchanged) --------------------
  const guides = [
    {
      id: 'getting-started',
      title: 'Getting Started Guide',
      downloads: 1234,
      size: '2.5 MB',
      content: `# Getting Started with SmartServices

Welcome to SmartServices! This guide will help you navigate the platform and make your first booking.

## Creating an Account
1. Click "Sign Up" on the top right.
2. Enter your email, name, and password.
3. Verify your email address.
4. Complete your profile (add phone, address, etc.).

## Browsing Services
- Use the search bar to find specific services.
- Filter by category, price, or rating.
- View provider profiles and reviews.

## Making a Booking
1. Select a service.
2. Choose a provider based on availability and rating.
3. Pick a date and time.
4. Review the total cost and complete payment.

## After Booking
- Track your booking status in "My Bookings".
- Communicate with the provider via chat.
- Rate and review after service completion.

Need more help? Visit our FAQ section or contact support.`
    },
    {
      id: 'payment-billing',
      title: 'Payment & Billing Guide',
      downloads: 856,
      size: '1.8 MB',
      content: `# Payment & Billing Guide

## Accepted Payment Methods
- Credit/Debit Cards (Visa, Mastercard, Amex)
- PayPal
- Wallet balance (recharge with any of the above)

## How to Add a Payment Method
1. Go to Settings → Payment Methods.
2. Click "Add New Card" or "Link PayPal".
3. Enter your details securely.

## Understanding Invoices
After each completed booking, an invoice is sent to your email and available in "My Bookings" → "View Invoice".

## Refund Policy
- Cancel at least 24 hours before start time → full refund.
- Cancel within 24 hours → 50% refund.
- Provider cancellation → full refund + $10 credit.

## Billing Issues?
Contact support with your booking ID and a description of the issue.`
    },
    {
      id: 'safety-tips',
      title: 'Safety Tips for Customers',
      downloads: 2341,
      size: '1.2 MB',
      content: `# Safety Tips for Customers

Your safety is our priority. Follow these guidelines for a secure experience.

## Before Booking
- Check provider ratings and read recent reviews.
- Verify that the provider has a verified badge.
- Communicate only through our platform's chat.

## During the Service
- Be present during the service if possible.
- Do not share personal financial information.
- Report any suspicious behavior immediately.

## After the Service
- Rate honestly to help other customers.
- Report any issues via the "Report a Problem" button.

## Emergency Situations
If you feel unsafe, contact local authorities first, then notify us. We have a 24/7 support line: +1 (555) 123-4567.`
    },
    {
      id: 'writing-reviews',
      title: 'How to Write Reviews',
      downloads: 567,
      size: '0.9 MB',
      content: `# How to Write Helpful Reviews

Your reviews help other customers and reward good providers.

## Where to Leave a Review
After a booking is marked as "Completed", you will receive a notification to rate and review.

## What to Include
- **Quality**: Was the service done correctly?
- **Professionalism**: Was the provider polite and punctual?
- **Value**: Did you feel the price was fair?
- **Specifics**: Mention what you liked or what could improve.

## Rating System
- 5 stars: Excellent, exceeded expectations.
- 4 stars: Good, minor issues.
- 3 stars: Average, acceptable.
- 2 stars: Poor, many issues.
- 1 star: Very bad, not recommended.

## Review Guidelines
- Be respectful and constructive.
- Do not include personal contact information.
- Avoid offensive language.

Your feedback makes our community better!`
    }
  ];

  // -------------------- PDF Generation (unchanged) --------------------
  const generatePDF = async (guide) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(guide.title, 14, 22);
    doc.setFontSize(11);
    doc.text(`SmartServices Help Center – ${new Date().toLocaleDateString()}`, 14, 32);
    const lines = guide.content.split('\n');
    let y = 45;
    doc.setFontSize(12);
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 20; }
      if (line.startsWith('# ')) {
        doc.setFontSize(16); doc.text(line.substring(2), 14, y); doc.setFontSize(12); y += 10;
      } else if (line.startsWith('## ')) {
        doc.setFontSize(14); doc.text(line.substring(3), 14, y); doc.setFontSize(12); y += 8;
      } else if (line.trim() === '') { y += 5;
      } else if (line.match(/^\d+\./)) { doc.text(line, 20, y); y += 7;
      } else if (line.startsWith('- ')) { doc.text('• ' + line.substring(2), 18, y); y += 7;
      } else { doc.text(line, 14, y); y += 7; }
    }
    doc.save(`${guide.title.replace(/\s/g, '_')}.pdf`);
  };

  const handleDownload = async (guide) => {
    setDownloading(guide.id);
    try {
      await generatePDF(guide);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllGuides = async () => {
    setDownloading('all');
    for (const guide of guides) {
      await generatePDF(guide);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setDownloading(null);
    alert('All guides downloaded successfully!');
  };

  // -------------------- Real‑time Search (unchanged) --------------------
  const performSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = [];
    faqs.forEach(category => {
      category.questions.forEach(faq => {
        if (faq.q.toLowerCase().includes(lowerQuery) || faq.a.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'faq',
            category: category.category,
            question: faq.q,
            answer: faq.a
          });
        }
      });
    });
    guides.forEach(guide => {
      if (guide.title.toLowerCase().includes(lowerQuery) || guide.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'guide',
          title: guide.title,
          id: guide.id,
          description: guide.content.substring(0, 100) + '...'
        });
      }
    });
    setSearchResults(results);
    setShowSearchResults(true);
  }, [faqs, guides]);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, performSearch]);

  // -------------------- Real‑time Chat (Socket.io) inside Modal --------------------
  useEffect(() => {
    if (!showChatModal || !socket || !isConnected) return;

    // Join the public support room
    socket.emit('join-support');

    // Listen for incoming support messages
    const handleSupportMessage = (msg) => {
      setChatMessages(prev => [...prev, msg]);
    };
    socket.on('support-message', handleSupportMessage);

    // Listen for typing indicators
    const handleTyping = ({ userId, username, isTyping }) => {
      if (userId !== user?.id) {
        setSomeoneTyping(isTyping ? `${username} is typing...` : null);
      }
    };
    socket.on('support-typing', handleTyping);

    return () => {
      socket.off('support-message', handleSupportMessage);
      socket.off('support-typing', handleTyping);
    };
  }, [showChatModal, socket, isConnected, user?.id]);

  // Reset chat when modal closes
  const handleCloseModal = () => {
    setShowChatModal(false);
    setChatMessages([]);
    setNewMessage('');
    setSomeoneTyping(null);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    socket.emit('support-message', { message: newMessage });
    setNewMessage('');
  };

  const handleTypingIndicator = (e) => {
    setNewMessage(e.target.value);
    if (!socket) return;
    socket.emit('support-typing', { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('support-typing', { isTyping: false });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  // -------------------- Filter FAQs for main display (unchanged) --------------------
  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          faq => faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  // -------------------- Render --------------------
  return (
    <Container fluid className="py-4 position-relative" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>Help Center</h2>
          <p className="text-muted">Find answers to common questions and get support</p>
        </Col>
      </Row>

      {/* Search Bar (unchanged) */}
      <Row className="justify-content-center mb-5">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h4 className="text-center mb-4">How can we help you today?</h4>
              <div className="position-relative">
                <InputGroup size="lg">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    ref={searchInputRef}
                    placeholder="Search for answers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                  />
                  {searchQuery && (
                    <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                      <FaTimes />
                    </Button>
                  )}
                  <Button variant="primary">Search</Button>
                </InputGroup>

                {/* Live search results dropdown (unchanged) */}
                {showSearchResults && searchResults.length > 0 && (
                  <Card className="position-absolute w-100 mt-2 shadow-lg" style={{ zIndex: 1000 }}>
                    <Card.Body className="p-0">
                      <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-light">
                        <small className="text-muted">{searchResults.length} results found</small>
                        <CloseButton onClick={() => setShowSearchResults(false)} />
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {searchResults.map((result, idx) => (
                          <div key={idx} className="p-3 border-bottom hover-bg">
                            {result.type === 'faq' ? (
                              <>
                                <Badge bg="info" className="me-2">FAQ</Badge>
                                <strong>{result.question}</strong>
                                <p className="mb-0 small text-muted mt-1">{result.answer.substring(0, 100)}...</p>
                              </>
                            ) : (
                              <>
                                <Badge bg="success" className="me-2">Guide</Badge>
                                <strong>{result.title}</strong>
                                <p className="mb-0 small text-muted mt-1">{result.description}</p>
                                <Button size="sm" variant="link" onClick={() => handleDownload(guides.find(g => g.id === result.id))}>
                                  <FaDownload /> Download
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content (unchanged) */}
      <Row className="g-4 mb-5">
        {/* FAQs Column */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4">
              <h5 className="mb-0">
                <FaQuestionCircle className="text-primary me-2" />
                Frequently Asked Questions
              </h5>
            </Card.Header>
            <Card.Body>
              {filteredFaqs.length > 0 ? (
                <Accordion defaultActiveKey="0">
                  {filteredFaqs.map((category, idx) => (
                    <div key={idx}>
                      <h6 className="mt-3 mb-2 text-primary">{category.category}</h6>
                      {category.questions.map((faq, index) => (
                        <Accordion.Item eventKey={`${idx}-${index}`} key={index} className="mb-2">
                          <Accordion.Header>
                            <span className="fw-semibold">{faq.q}</span>
                          </Accordion.Header>
                          <Accordion.Body>
                            {faq.a}
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </div>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted text-center">No matching FAQs found.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Contact & Guides Column */}
        <Col lg={4}>
          {/* Contact Options - the Live Chat button now opens the modal */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 pt-4">
              <h5 className="mb-0">Contact Support</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                <FaEnvelope className="text-primary me-3" size={24} />
                <div>
                  <h6 className="mb-1">Email Support</h6>
                  <small className="text-muted">support@smartservices.com</small>
                </div>
              </div>
              <div className="d-flex align-items-center p-3 bg-light rounded mb-3">
                <FaComment className="text-success me-3" size={24} />
                <div>
                  <h6 className="mb-1">Live Chat</h6>
                  <small className="text-muted">Available 24/7</small>
                  <Button
                    variant="link"
                    className="p-0 ms-2 text-primary"
                    onClick={() => setShowChatModal(true)}
                  >
                    Click to chat
                  </Button>
                </div>
              </div>
              <div className="d-flex align-items-center p-3 bg-light rounded">
                <FaPhone className="text-warning me-3" size={24} />
                <div>
                  <h6 className="mb-1">Phone Support</h6>
                  <small className="text-muted">+1 (555) 123-4567</small>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Guides (unchanged) */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaFileAlt className="text-info me-2" />
                Help Guides
              </h5>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={downloadAllGuides}
                disabled={downloading !== null}
              >
                {downloading === 'all' ? <FaSpinner className="spin me-2" /> : <FaDownload className="me-2" />}
                Download All
              </Button>
            </Card.Header>
            <Card.Body>
              {guides.map((guide, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <div>
                    <h6 className="mb-1">{guide.title}</h6>
                    <small className="text-muted">{guide.downloads} downloads • {guide.size}</small>
                  </div>
                  <Button
                    variant="link"
                    className="text-primary"
                    onClick={() => handleDownload(guide)}
                    disabled={downloading === guide.id}
                  >
                    {downloading === guide.id ? <FaSpinner className="spin" /> : <FaDownload />}
                  </Button>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Live Chat Modal */}
      <Modal show={showChatModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaComment className="me-2" /> Live Support Chat
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <div style={{ height: '450px', display: 'flex', flexDirection: 'column' }}>
            {/* Chat messages area */}
            <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`d-flex mb-3 ${msg.userId === user?.id ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`d-flex ${msg.userId === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="me-2">
                      {msg.userId === user?.id ? <FaUserCircle size={32} /> : <FaRobot size={32} />}
                    </div>
                    <div className={`p-2 rounded ${msg.userId === user?.id ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '250px' }}>
                      <small className="fw-bold d-block">{msg.username}</small>
                      <small className="d-block">{msg.text}</small>
                      <small className="d-block text-muted" style={{ fontSize: '10px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
              {someoneTyping && (
                <div className="text-muted small ps-3">{someoneTyping}</div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-3 border-top">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={handleTypingIndicator}
                  onKeyPress={handleKeyPress}
                />
                <Button variant="primary" onClick={sendMessage}>
                  <FaPaperPlane />
                </Button>
              </InputGroup>
              <small className="text-muted mt-2 d-block">
                {isConnected ? '✅ Connected to support' : '⏳ Connecting...'}
              </small>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <style jsx="true">{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hover-bg:hover {
          background-color: #f8f9fa;
          cursor: pointer;
        }
      `}</style>
    </Container>
  );
};

export default HelpCenter;