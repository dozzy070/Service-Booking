// src/pages/ReportIssue.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge
} from 'react-bootstrap';
import {
  FaExclamationTriangle,
  FaFlag,
  FaUser,
  FaCalendarAlt,
  FaFileAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaClock,
  FaPhoneAlt,
  FaEnvelope,
  FaShieldAlt,
  FaQuestionCircle,
  FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

const ReportIssue = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    issueType: '',
    bookingId: '',
    subject: '',
    description: '',
    priority: 'medium',
    attachments: null
  });
  const topRef = useRef(null);

  // ✅ Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const issueTypes = [
    { value: 'service_quality', label: 'Service Quality Issue' },
    { value: 'provider_conduct', label: 'Provider Conduct' },
    { value: 'payment_dispute', label: 'Payment Dispute' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'fraud_suspicion', label: 'Fraud Suspicion' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'other', label: 'Other' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low - Non-urgent', color: 'secondary' },
    { value: 'medium', label: 'Medium - Needs attention', color: 'warning' },
    { value: 'high', label: 'High - Urgent', color: 'danger' },
    { value: 'critical', label: 'Critical - Emergency', color: 'danger' }
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachments') {
      setFormData(prev => ({ ...prev, [name]: files }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.issueType || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Send report to API
      const response = await api.post('/reports', formData);
      toast.success('Issue reported successfully! We\'ll respond within 24 hours.');
      setSubmitted(true);
      setFormData({
        issueType: '',
        bookingId: '',
        subject: '',
        description: '',
        priority: 'medium',
        attachments: null
      });
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <div ref={topRef} />
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="border-0 shadow-sm text-center p-5">
                <Card.Body>
                  <div className="mb-4">
                    <FaCheckCircle size={64} className="text-success" />
                  </div>
                  <h2 className="mb-3">Issue Reported Successfully!</h2>
                  <p className="text-muted lead mb-4">
                    Thank you for reporting this issue. Our support team has been notified and will 
                    investigate your concern within 24 hours.
                  </p>
                  <div className="bg-light p-4 rounded-3 mb-4 text-start">
                    <h6 className="fw-bold mb-3">What happens next?</h6>
                    <div className="d-flex mb-3">
                      <div className="me-3 text-primary"><FaClock size={20} /></div>
                      <div>
                        <strong>Review Process:</strong>
                        <p className="text-muted small mb-0">Our team will review your report within 24 hours.</p>
                      </div>
                    </div>
                    <div className="d-flex mb-3">
                      <div className="me-3 text-primary"><FaUser size={20} /></div>
                      <div>
                        <strong>Investigation:</strong>
                        <p className="text-muted small mb-0">We may contact you for additional information.</p>
                      </div>
                    </div>
                    <div className="d-flex">
                      <div className="me-3 text-primary"><FaShieldAlt size={20} /></div>
                      <div>
                        <strong>Resolution:</strong>
                        <p className="text-muted small mb-0">We'll work to resolve the issue as quickly as possible.</p>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-3 justify-content-center flex-wrap">
                    <Button as={Link} to="/" variant="primary">
                      Return Home
                    </Button>
                    <Button as={Link} to="/contact" variant="outline-primary">
                      Contact Support
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }

  return (
    <>
      <div ref={topRef} />
      
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="display-6 fw-bold mb-3 d-flex align-items-center gap-3">
              <FaFlag className="text-danger" />
              Report an Issue
            </h1>
            <p className="text-muted lead">
              We take all reports seriously. Please provide as much detail as possible.
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Issue Type <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      name="issueType"
                      value={formData.issueType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select issue type</option>
                      {issueTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Booking ID (if applicable)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="bookingId"
                      value={formData.bookingId}
                      onChange={handleChange}
                      placeholder="e.g., BK-12345"
                    />
                    <Form.Text className="text-muted">
                      If this issue is related to a specific booking, please enter the booking ID.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Subject <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief summary of the issue"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Please provide detailed information about the issue..."
                      required
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Priority</Form.Label>
                        <Form.Select
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                        >
                          {priorityLevels.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Attachments</Form.Label>
                        <Form.Control
                          type="file"
                          name="attachments"
                          onChange={handleChange}
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <Form.Text className="text-muted">
                          Upload screenshots or documents (max 5MB)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="bg-light p-3 rounded-3 mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaShieldAlt className="text-primary" />
                      <small className="fw-semibold">Privacy & Confidentiality</small>
                    </div>
                    <p className="text-muted small mb-0">
                      Your report will be treated confidentially. We may share relevant information 
                      with the provider to resolve the issue, but your personal contact information 
                      will be protected.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="danger"
                    size="lg"
                    className="px-5 d-flex align-items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Spinner animation="border" size="sm" /> Submitting...</>
                    ) : (
                      <><FaPaperPlane /> Submit Report</>
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Quick Help */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3">Need Immediate Help?</h6>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <FaPhoneAlt className="text-primary" size={20} />
                  <div>
                    <div className="small text-muted">Emergency Hotline</div>
                    <div className="fw-bold">+1 (888) 123-4567</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <FaEnvelope className="text-primary" size={20} />
                  <div>
                    <div className="small text-muted">Email Support</div>
                    <div className="fw-bold">support@smartservices.com</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Links */}
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3">Related Resources</h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <Link to="/faq" className="text-decoration-none d-flex align-items-center gap-2">
                      <FaQuestionCircle className="text-primary" />
                      FAQ
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/safety-tips" className="text-decoration-none d-flex align-items-center gap-2">
                      <FaShieldAlt className="text-primary" />
                      Safety Tips
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link to="/cancellation" className="text-decoration-none d-flex align-items-center gap-2">
                      <FaFileAlt className="text-primary" />
                      Cancellation Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-decoration-none d-flex align-items-center gap-2">
                      <FaFileAlt className="text-primary" />
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ReportIssue;