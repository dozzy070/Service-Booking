// src/pages/CancellationPolicy.jsx
import React, { useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Table,
  Button  // ✅ ADDED: This was missing
} from 'react-bootstrap';
import {
  FaCalendarTimes,
  FaClock,
  FaMoneyBillWave,
  FaShieldAlt,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const CancellationPolicy = () => {
  const topRef = useRef(null);

  // ✅ Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const cancellationScenarios = [
    {
      timing: 'More than 48 hours before service',
      customerRefund: '100% refund',
      providerCompensation: 'No charge',
      badge: 'success',
      details: 'Full refund to customer. Provider receives no compensation.'
    },
    {
      timing: '24-48 hours before service',
      customerRefund: '50% refund',
      providerCompensation: '50% of booking fee',
      badge: 'warning',
      details: 'Customer receives 50% refund. Provider keeps 50% for lost time.'
    },
    {
      timing: 'Less than 24 hours before service',
      customerRefund: 'No refund',
      providerCompensation: '100% of booking fee',
      badge: 'danger',
      details: 'No refund to customer. Provider receives full payment.'
    },
    {
      timing: 'Provider cancels (any time)',
      customerRefund: '100% refund + $10 credit',
      providerCompensation: 'No payment',
      badge: 'info',
      details: 'Full refund plus credit. Provider may face penalties.'
    }
  ];

  const exceptions = [
    {
      title: 'Medical Emergencies',
      description: 'If you or a family member experience a medical emergency, we will waive cancellation fees with proper documentation.'
    },
    {
      title: 'Severe Weather',
      description: 'Cancellations due to severe weather warnings or natural disasters are eligible for full refunds.'
    },
    {
      title: 'Provider No-Show',
      description: 'If the provider fails to show up, you receive a full refund plus a $20 inconvenience credit.'
    },
    {
      title: 'Dissatisfaction',
      description: 'If the service doesn\'t match the description, you may cancel and request a refund within 24 hours.'
    }
  ];

  const refundTimeline = [
    { step: 'Customer Requests Cancellation', description: 'Customer initiates cancellation through the platform.' },
    { step: 'Review Period', description: 'Our team reviews the cancellation request and applicable policy.' },
    { step: 'Approval', description: 'Approved refunds are processed within 24-48 hours.' },
    { step: 'Refund Processing', description: 'Refunds appear on your statement within 5-7 business days.' }
  ];

  return (
    <>
      <div ref={topRef} />
      
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h1 className="display-6 fw-bold mb-3 d-flex align-items-center gap-3">
              <FaCalendarTimes className="text-danger" />
              Cancellation Policy
            </h1>
            <p className="text-muted lead">
              Understand our cancellation terms, refund eligibility, and your rights as a customer or provider.
            </p>
            <Badge bg="warning" text="dark" className="px-3 py-2">
              Last Updated: January 1, 2024
            </Badge>
          </Col>
        </Row>

        {/* Quick Summary */}
        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center p-4">
                <FaClock size={36} className="text-primary mb-3" />
                <h5>Free Cancellation Window</h5>
                <p className="text-muted small">Cancel within 48 hours for full refund</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center p-4">
                <FaMoneyBillWave size={36} className="text-success mb-3" />
                <h5>Quick Refunds</h5>
                <p className="text-muted small">Refunds processed within 5-7 business days</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="text-center p-4">
                <FaShieldAlt size={36} className="text-info mb-3" />
                <h5>Protected Payments</h5>
                <p className="text-muted small">Your payment is secure with escrow protection</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Policy */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h4 className="fw-bold mb-4">Cancellation Scenarios</h4>
            <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Timing</th>
                    <th>Customer Refund</th>
                    <th>Provider Compensation</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {cancellationScenarios.map((scenario, index) => (
                    <tr key={index}>
                      <td>
                        <Badge bg={scenario.badge} className="me-2">
                          {scenario.badge === 'success' ? '✓' : 
                           scenario.badge === 'warning' ? '⚠' : 
                           scenario.badge === 'danger' ? '✕' : 'ℹ'}
                        </Badge>
                        {scenario.timing}
                      </td>
                      <td className="fw-semibold text-success">{scenario.customerRefund}</td>
                      <td className="fw-semibold">{scenario.providerCompensation}</td>
                      <td className="small">{scenario.details}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Exceptions */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <FaExclamationTriangle className="text-warning" />
              Policy Exceptions
            </h4>
            <Row className="g-3">
              {exceptions.map((exception, index) => (
                <Col md={6} key={index}>
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <h6 className="fw-bold mb-2">{exception.title}</h6>
                    <p className="text-muted small mb-0">{exception.description}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Refund Process */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h4 className="fw-bold mb-4">Refund Process</h4>
            <div className="position-relative">
              {refundTimeline.map((item, index) => (
                <div key={index} className="d-flex mb-4 position-relative">
                  <div className="me-4 text-center">
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                         style={{ width: '40px', height: '40px' }}>
                      {index + 1}
                    </div>
                    {index < refundTimeline.length - 1 && (
                      <div className="vr h-100" style={{ position: 'absolute', top: '40px', left: '20px' }} />
                    )}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{item.step}</h6>
                    <p className="text-muted small mb-0">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Customer & Provider Rights */}
        <Row className="mb-4 g-3">
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaCheckCircle className="text-success" />
                  Customer Rights
                </h5>
                <ul className="list-unstyled">
                  <li className="mb-2 d-flex gap-2">
                    <FaCheckCircle className="text-success mt-1" size={14} />
                    <span>Cancel within 48 hours for full refund</span>
                  </li>
                  <li className="mb-2 d-flex gap-2">
                    <FaCheckCircle className="text-success mt-1" size={14} />
                    <span>Partial refund based on cancellation timing</span>
                  </li>
                  <li className="mb-2 d-flex gap-2">
                    <FaCheckCircle className="text-success mt-1" size={14} />
                    <span>Full refund if provider cancels</span>
                  </li>
                  <li className="d-flex gap-2">
                    <FaCheckCircle className="text-success mt-1" size={14} />
                    <span>Dispute resolution process available</span>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaCheckCircle className="text-info" />
                  Provider Rights
                </h5>
                <ul className="list-unstyled">
                  <li className="mb-2 d-flex gap-2">
                    <FaCheckCircle className="text-info mt-1" size={14} />
                    <span>Compensation for last-minute cancellations</span>
                  </li>
                  <li className="mb-2 d-flex gap-2">
                    <FaCheckCircle className="text-info mt-1" size={14} />
                    <span>Full payment for completed services</span>
                  </li>
                  <li className="mb-2 d-flex gap-2">
                    <FaCheckCircle className="text-info mt-1" size={14} />
                    <span>Dispute resolution and mediation</span>
                  </li>
                  <li className="d-flex gap-2">
                    <FaCheckCircle className="text-info mt-1" size={14} />
                    <span>Penalties for last-minute cancellations</span>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* FAQ */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <FaQuestionCircle className="text-primary" />
              Frequently Asked Questions
            </h4>
            <Row className="g-3">
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="fw-bold">Can I cancel after the service has started?</h6>
                  <p className="text-muted small">Once a service has started, cancellations are subject to the provider's discretion and may not be eligible for a refund.</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="fw-bold">How do I request a cancellation?</h6>
                  <p className="text-muted small">You can cancel any booking from your dashboard under "My Bookings" or contact our support team for assistance.</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="fw-bold">What happens if the provider is late?</h6>
                  <p className="text-muted small">If a provider is more than 30 minutes late without notice, you may cancel and receive a full refund or reschedule at no cost.</p>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <h6 className="fw-bold">Can I cancel for any reason?</h6>
                  <p className="text-muted small">Yes, but refunds are subject to our cancellation policy based on the timing of your cancellation.</p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* CTA */}
        <Card className="border-0 shadow-sm bg-primary text-white">
          <Card.Body className="p-5 text-center">
            <h3 className="mb-3">Need Help with a Cancellation?</h3>
            <p className="lead mb-4">
              Our support team is here to assist you with any cancellation requests or questions.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Button as={Link} to="/contact" variant="light" size="lg" className="px-5">
                Contact Support
              </Button>
              <Button as={Link} to="/report" variant="outline-light" size="lg" className="px-5">
                Report an Issue
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default CancellationPolicy;