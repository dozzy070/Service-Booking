// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaPrint, FaEnvelope, FaDownload,
  FaShare, FaArrowLeft, FaHome, FaCalendarCheck
} from 'react-icons/fa';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transactionDetails, setTransactionDetails] = useState({
    transactionId: location.state?.transactionId || 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    amount: location.state?.amount || 150.00,
    bookingId: location.state?.bookingId || 'BK-1234',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    paymentMethod: 'Visa ending in 4242'
  });

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Save transaction to local storage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push({
      ...transactionDetails,
      id: Date.now()
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    // In production, send email via API
    navigator.clipboard.writeText(JSON.stringify(transactionDetails, null, 2));
    toast.success('Receipt copied to clipboard!');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(transactionDetails, null, 2)], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${transactionDetails.transactionId}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Success Animation */}
          <div className="text-center mb-4">
            <div className="success-animation">
              <FaCheckCircle size={80} className="text-success" />
            </div>
          </div>

          {/* Success Card */}
          <Card className="border-0 shadow-lg">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="mb-2">Payment Successful! 🎉</h2>
                <p className="text-muted">
                  Thank you for your payment. Your booking has been confirmed.
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-light p-4 rounded-3 mb-4">
                <h6 className="mb-3">Transaction Details</h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Transaction ID:</strong><br />
                      <span className="text-primary">{transactionDetails.transactionId}</span>
                    </p>
                    <p className="mb-2">
                      <strong>Booking ID:</strong><br />
                      {transactionDetails.bookingId}
                    </p>
                    <p className="mb-2">
                      <strong>Date & Time:</strong><br />
                      {transactionDetails.date} at {transactionDetails.time}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Amount Paid:</strong><br />
                      <span className="h4 text-success">${transactionDetails.amount.toFixed(2)}</span>
                    </p>
                    <p className="mb-2">
                      <strong>Payment Method:</strong><br />
                      {transactionDetails.paymentMethod}
                    </p>
                    <p className="mb-2">
                      <strong>Status:</strong><br />
                      <span className="badge bg-success">Completed</span>
                    </p>
                  </Col>
                </Row>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
                <Button variant="outline-primary" onClick={handlePrint}>
                  <FaPrint className="me-2" /> Print Receipt
                </Button>
                <Button variant="outline-primary" onClick={handleEmail}>
                  <FaEnvelope className="me-2" /> Copy Receipt
                </Button>
                <Button variant="outline-primary" onClick={handleDownload}>
                  <FaDownload className="me-2" /> Download
                </Button>
                <Button variant="outline-primary">
                  <FaShare className="me-2" /> Share
                </Button>
              </div>

              {/* Navigation Buttons */}
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Button 
                  as={Link} 
                  to="/bookings" 
                  variant="primary" 
                  size="lg"
                  className="px-4"
                >
                  <FaCalendarCheck className="me-2" /> View My Bookings
                </Button>
                <Button 
                  as={Link} 
                  to="/services" 
                  variant="outline-primary" 
                  size="lg"
                  className="px-4"
                >
                  Browse More Services
                </Button>
                <Button 
                  as={Link} 
                  to="/" 
                  variant="outline-secondary" 
                  size="lg"
                  className="px-4"
                >
                  <FaHome className="me-2" /> Go Home
                </Button>
              </div>

              {/* Email Confirmation */}
              <div className="text-center mt-4">
                <small className="text-muted">
                  A confirmation email has been sent to your email address.
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* What's Next */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Body className="p-4">
              <h5 className="mb-3">What's Next?</h5>
              <Row className="g-4">
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-light rounded-circle p-3 d-inline-block mb-3">
                      <FaCheckCircle size={24} className="text-primary" />
                    </div>
                    <h6>Booking Confirmed</h6>
                    <small className="text-muted">Your booking is now confirmed</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-light rounded-circle p-3 d-inline-block mb-3">
                      <FaEnvelope size={24} className="text-primary" />
                    </div>
                    <h6>Check Your Email</h6>
                    <small className="text-muted">Receipt and details sent to your email</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-light rounded-circle p-3 d-inline-block mb-3">
                      <FaCalendarCheck size={24} className="text-primary" />
                    </div>
                    <h6>Manage Booking</h6>
                    <small className="text-muted">View or manage your booking anytime</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx="true">{`
        .success-animation {
          animation: bounceIn 0.8s ease;
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Container>
  );
};

export default PaymentSuccess;