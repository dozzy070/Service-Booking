// src/pages/PaymentCancel.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaTimesCircle, FaRedo, FaHeadset, FaArrowLeft,
  FaExclamationTriangle, FaEnvelope, FaPhone, FaComment
} from 'react-icons/fa';

const PaymentCancel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');

  const bookingId = location.state?.bookingId || new URLSearchParams(location.search).get('bookingId');
  const errorMessage = location.state?.error || 'Your payment was cancelled. No charges have been made.';

  const handleTryAgain = () => {
    if (bookingId) {
      navigate(`/payment/${bookingId}`);
    } else {
      navigate('/bookings');
    }
  };

  const handleSubmitHelp = (e) => {
    e.preventDefault();
    // In production, send to support
    alert('Support request sent! We\'ll get back to you soon.');
    setShowHelpForm(false);
    setHelpMessage('');
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Cancel Animation */}
          <div className="text-center mb-4">
            <div className="cancel-animation">
              <FaTimesCircle size={80} className="text-danger" />
            </div>
          </div>

          {/* Main Card */}
          <Card className="border-0 shadow-lg">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="mb-2">Payment Cancelled</h2>
                <p className="text-muted">{errorMessage}</p>
              </div>

              {/* Warning Alert */}
              <Alert variant="warning" className="mb-4">
                <FaExclamationTriangle className="me-2" />
                Your booking is still pending. Complete payment to confirm your booking.
              </Alert>

              {/* Booking Info if available */}
              {bookingId && (
                <div className="bg-light p-4 rounded-3 mb-4">
                  <h6 className="mb-3">Booking Information</h6>
                  <p className="mb-2">
                    <strong>Booking ID:</strong> {bookingId}
                  </p>
                  <p className="mb-0">
                    <strong>Status:</strong>{' '}
                    <span className="badge bg-warning text-dark">Pending Payment</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-3 d-md-flex justify-content-md-center mb-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleTryAgain}
                  className="px-4"
                >
                  <FaRedo className="me-2" /> Try Again
                </Button>
                <Button 
                  as={Link} 
                  to="/bookings" 
                  variant="outline-primary" 
                  size="lg"
                  className="px-4"
                >
                  View My Bookings
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="lg"
                  className="px-4"
                  onClick={() => setShowHelpForm(!showHelpForm)}
                >
                  <FaHeadset className="me-2" /> Need Help?
                </Button>
              </div>

              {/* Help Form */}
              {showHelpForm && (
                <div className="border-top pt-4 mt-4">
                  <h6 className="mb-3">Contact Support</h6>
                  <Form onSubmit={handleSubmitHelp}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tell us what happened</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={helpMessage}
                        onChange={(e) => setHelpMessage(e.target.value)}
                        placeholder="I was having trouble with..."
                        required
                      />
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary">
                        <FaEnvelope className="me-2" /> Send Message
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        as="a" 
                        href="tel:+1234567890"
                      >
                        <FaPhone className="me-2" /> Call Support
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        as="a" 
                        href="#chat"
                      >
                        <FaComment className="me-2" /> Live Chat
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {/* Alternative Options */}
              <div className="border-top pt-4 mt-4">
                <h6 className="mb-3">Other Options</h6>
                <div className="d-flex flex-wrap gap-2">
                  <Button as={Link} to="/services" variant="link">
                    Browse Services
                  </Button>
                  <Button as={Link} to="/faq" variant="link">
                    Payment FAQ
                  </Button>
                  <Button as={Link} to="/contact" variant="link">
                    Contact Support
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Tips Card */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Body className="p-4">
              <h6 className="mb-3">💡 Payment Tips</h6>
              <Row className="g-3">
                <Col md={4}>
                  <small>• Check your card details</small>
                </Col>
                <Col md={4}>
                  <small>• Ensure sufficient funds</small>
                </Col>
                <Col md={4}>
                  <small>• Try a different payment method</small>
                </Col>
                <Col md={4}>
                  <small>• Contact your bank</small>
                </Col>
                <Col md={4}>
                  <small>• Clear browser cache</small>
                </Col>
                <Col md={4}>
                  <small>• Try incognito mode</small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx="true">{`
        .cancel-animation {
          animation: shake 0.5s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </Container>
  );
};

export default PaymentCancel;