import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane
} from 'react-icons/fa';
import api from '../api';
import toast from 'react-hot-toast';

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await api.post('/contact', formData);
      toast.success('Message sent successfully! We\'ll respond within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col className="text-center">
          <h1 className="display-6 mb-3">Contact Us</h1>
          <p className="text-muted">
            Have questions? We're here to help 24/7
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4">
          {/* Contact Info */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-4">Get in Touch</h5>
              
              <div className="d-flex mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <FaEnvelope className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-1">Email</h6>
                  <p className="text-muted mb-0">support@smartservices.com</p>
                  <small>24/7 support</small>
                </div>
              </div>

              <div className="d-flex mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <FaPhone className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-1">Phone</h6>
                  <p className="text-muted mb-0">+1 (888) 123-4567</p>
                  <small>Mon-Fri, 9am-6pm EST</small>
                </div>
              </div>

              <div className="d-flex mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <FaMapMarkerAlt className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-1">Office</h6>
                  <p className="text-muted mb-0">
                    123 Business Avenue<br />
                    Suite 100<br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </div>

              <div className="d-flex">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <FaClock className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-1">Business Hours</h6>
                  <p className="text-muted mb-0">
                    Monday - Friday: 9am - 6pm<br />
                    Saturday: 10am - 4pm<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Links */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Quick Help</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <a href="/faq" className="text-decoration-none">
                    Frequently Asked Questions
                  </a>
                </li>
                <li className="mb-2">
                  <a href="/terms" className="text-decoration-none">
                    Terms of Service
                  </a>
                </li>
                <li className="mb-2">
                  <a href="/privacy" className="text-decoration-none">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {/* Contact Form */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-4">
              <h5 className="mb-0">Send us a Message</h5>
              <p className="text-muted mb-0 mt-2">
                We'll get back to you within 24 hours
              </p>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="px-5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" /> Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" /> Send Message
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact;