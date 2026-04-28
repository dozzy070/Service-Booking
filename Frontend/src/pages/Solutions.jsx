// src/pages/Solutions.jsx
import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaBuilding,
  FaHandshake,
  FaChartLine,
  FaShieldAlt,
  FaClock,
  FaUsers,
  FaCheckCircle,
  FaArrowRight,
  FaHardHat,
  FaCity,
  FaUniversity,
  FaBriefcase,
  FaLeaf,
  FaTools,
  FaCogs
} from 'react-icons/fa';

const Solutions = () => {
  const solutions = [
    {
      icon: <FaHardHat size={40} />,
      title: 'For Contractors & Builders',
      description: 'Expand your service offerings with our white‑label maintenance and repair network. Get volume pricing, dedicated support, and subcontractor management.',
      benefits: [
        'Access to vetted tradespeople nationwide',
        'Project management software integration',
        'Co‑branded customer portal',
        'Performance‑based incentives'
      ]
    },
    {
      icon: <FaCity size={40} />,
      title: 'Real Estate Developers & Property Managers',
      description: 'Keep your properties in top condition with our proactive maintenance platform. Increase tenant satisfaction and asset value.',
      benefits: [
        '24/7 maintenance request handling',
        'Preventive inspection scheduling',
        'Bulk pricing on all services',
        'Real‑time reporting and analytics'
      ]
    },
    {
      icon: <FaUniversity size={40} />,
      title: 'Financial Institutions',
      description: 'Offer maintenance and improvement services as a value‑added benefit to mortgage or property loan customers. Strengthen client relationships.',
      benefits: [
        'White‑labeled service for your customers',
        'Seamless API integration',
        'Compliance and insurance coverage',
        'Dedicated account management'
      ]
    },
    {
      icon: <FaBriefcase size={40} />,
      title: 'Large Enterprises & Facilities',
      description: 'One SLA for all your building maintenance – cleaning, electrical, HVAC, plumbing, and more. Simplify vendor management.',
      benefits: [
        'Single point of contact for all locations',
        'Priority dispatch and 24/7 support',
        'Cost control with fixed or usage‑based pricing',
        'Centralized invoicing and reporting'
      ]
    }
  ];

  return (
    <>
      {/* Hero section for Solutions - changed to Building Growth */}
      <section className="solutions-hero py-5" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: 'white' }}>
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <Badge bg="warning" text="dark" className="mb-3 px-3 py-2">Building Solutions</Badge>
              <h1 className="display-4 fw-bold mb-4">Smart Solutions for <span className="text-warning">Building Growth</span></h1>
              <p className="lead mb-4">
                Tailored maintenance and building service packages for organisations that demand reliability, scale, and efficiency.
              </p>
              {/* Removed "Become a Partner" button */}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats / trust indicators */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="text-center g-4">
            <Col md={3}>
              <FaUsers className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">500+</h3>
              <p>Enterprise Clients</p>
            </Col>
            <Col md={3}>
              <FaBuilding className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">10K+</h3>
              <p>Properties Maintained</p>
            </Col>
            <Col md={3}>
              <FaClock className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">24/7</h3>
              <p>Priority Support</p>
            </Col>
            <Col md={3}>
              <FaShieldAlt className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">100%</h3>
              <p>Insured & Bonded</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* NEW: Building Growth Article Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="success" className="mb-3 px-3 py-2">Sustainable Growth</Badge>
              <h2 className="display-6 fw-bold mb-3">Accelerate Your Building Growth Strategy</h2>
              <p className="lead text-muted">How smart maintenance drives long‑term asset value and operational excellence</p>
            </Col>
          </Row>
          <Row className="g-5 align-items-center">
            <Col lg={6}>
              <img 
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600" 
                alt="Building construction" 
                className="img-fluid rounded-4 shadow"
                onError={(e) => { e.target.src = 'https://picsum.photos/id/104/600/400'; }}
              />
            </Col>
            <Col lg={6}>
              <h4 className="mb-3">From Reactive to Proactive: The Growth Multiplier</h4>
              <p>
                Traditional building management reacts to problems after they occur. Our data‑driven approach flips the model – we predict, prevent, and prioritize. This shift reduces emergency costs by up to 40% and extends asset life by years.
              </p>
              <ul className="mt-3">
                <li className="mb-2"><FaCogs className="text-primary me-2" /> <strong>Predictive maintenance</strong> – IoT sensors monitor HVAC, plumbing, electrical in real time.</li>
                <li className="mb-2"><FaLeaf className="text-primary me-2" /> <strong>Energy efficiency</strong> – Optimize consumption, lower utility bills, achieve green certifications.</li>
                <li className="mb-2"><FaChartLine className="text-primary me-2" /> <strong>Lifecycle cost reduction</strong> – Schedule replacements at optimal intervals, not after failure.</li>
                <li className="mb-2"><FaTools className="text-primary me-2" /> <strong>Unified vendor management</strong> – One platform for all trades, eliminating silos.</li>
              </ul>
            </Col>
          </Row>
          <Row className="mt-5 g-4">
            <Col md={4}>
              <div className="border rounded-3 p-4 h-100 bg-white shadow-sm">
                <FaBuilding size={36} className="text-primary mb-3" />
                <h5>Scalable for Portfolios</h5>
                <p>Whether you own 5 properties or 5000, our platform scales seamlessly. Centralized dashboard, standardized SLAs, and bulk procurement discounts.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="border rounded-3 p-4 h-100 bg-white shadow-sm">
                <FaHandshake size={36} className="text-primary mb-3" />
                <h5>Partner Ecosystem</h5>
                <p>Gain access to our vetted network of 10,000+ licensed professionals. No more hunting for contractors – we handle vetting, insurance, and quality control.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="border rounded-3 p-4 h-100 bg-white shadow-sm">
                <FaChartLine size={36} className="text-primary mb-3" />
                <h5>Data‑Driven Decisions</h5>
                <p>Real‑time analytics on maintenance costs, asset health, and vendor performance. Use insights to forecast budgets and justify capital improvements.</p>
              </div>
            </Col>
          </Row>
          <Row className="mt-5">
            <Col>
              <div className="bg-primary bg-opacity-10 p-4 rounded-4 text-center">
                <h4 className="mb-3">Case Study: 30% Reduction in Maintenance Costs</h4>
                <p>A regional real estate trust with 1,200 units switched to our proactive model. Within 12 months, emergency repairs dropped by 58%, tenant satisfaction scores rose 22 points, and overall maintenance spend decreased by 30%.</p>
                <Button as={Link} to="/contact" variant="outline-primary" className="rounded-pill mt-2">
                  Request a Free Consultation →
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Solutions cards (unchanged) */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <h2 className="display-6 fw-bold mb-3">Solutions Tailored to Your Industry</h2>
              <p className="lead text-muted">Choose a plan that fits your organisation’s needs</p>
            </Col>
          </Row>
          <Row className="g-4">
            {solutions.map((sol, idx) => (
              <Col md={6} key={idx}>
                <Card className="h-100 border-0 shadow-sm solution-card">
                  <Card.Body className="p-4">
                    <div className="solution-icon mb-3 text-primary">{sol.icon}</div>
                    <h4 className="mb-3">{sol.title}</h4>
                    <p className="text-muted">{sol.description}</p>
                    <ul className="list-unstyled mt-3">
                      {sol.benefits.map((benefit, i) => (
                        <li key={i} className="mb-2">
                          <FaCheckCircle className="text-success me-2" /> {benefit}
                        </li>
                      ))}
                    </ul>
                    <Button as={Link} to="/contact" variant="outline-primary" className="rounded-pill mt-3">
                      Request a Quote <FaArrowRight className="ms-2" size={12} />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA for partnership (still present? User didn't ask to remove this one, but I'll keep it as it's different from hero button) */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container>
          <Row className="align-items-center text-white">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="display-6 fw-bold mb-3">Ready to elevate your building maintenance?</h2>
              <p className="lead mb-0 opacity-90">Join hundreds of organisations already using Smart Services.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/provider/register" variant="light" size="lg" className="rounded-pill px-5 fw-bold">
                Become a Partner →
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      <style jsx="true">{`
        .solution-card {
          transition: all 0.3s ease;
          border-radius: 20px;
        }
        .solution-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
        }
        .solution-icon {
          transition: transform 0.2s;
        }
        .solution-card:hover .solution-icon {
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
};

export default Solutions;