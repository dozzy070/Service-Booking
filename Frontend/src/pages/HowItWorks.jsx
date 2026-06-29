// src/pages/HowItWorks.jsx
import React, { useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Accordion,
  ListGroup,
  Nav,
  Tab
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaSearch,
  FaHandshake,
  FaMoneyBillWave,
  FaShieldAlt,
  FaClock,
  FaStar,
  FaUserCheck,
  FaFileContract,
  FaCreditCard,
  FaWallet,
  FaLock,
  FaCheckCircle,
  FaArrowRight,
  FaUsers,
  FaPhoneAlt,
  FaCommentDots,
  FaExclamationTriangle,
  FaUndo,
  FaBuilding,
  FaHome,
  FaTools,
  FaUserTie,
  FaGraduationCap,
  FaHeart,
  FaGlobe,
  FaRocket,
  FaShieldVirus,
  FaMedal,
  FaTrophy,
  FaChartLine
} from 'react-icons/fa';

const HowItWorks = () => {
  const topRef = useRef(null);

  // ✅ Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Step data for the workflow
  const steps = [
    {
      icon: <FaSearch />,
      title: 'Search & Discover',
      description: 'Browse through thousands of verified service providers. Filter by category, location, price, and ratings to find the perfect match for your needs.',
      details: [
        'Search by service type, location, or keywords',
        'Filter by price range, ratings, and availability',
        'View provider profiles, portfolios, and reviews',
        'Compare multiple providers side-by-side'
      ],
      color: '#6366f1'
    },
    {
      icon: <FaHandshake />,
      title: 'Book & Confirm',
      description: 'Select your preferred provider, choose a date and time, and confirm your booking with a few clicks. Get instant confirmation and reminders.',
      details: [
        'Select service date and time slot',
        'Review service details and pricing',
        'Add special instructions or requirements',
        'Receive instant booking confirmation'
      ],
      color: '#8b5cf6'
    },
    {
      icon: <FaCreditCard />,
      title: 'Pay Securely',
      description: 'Pay with confidence using our secure payment system. Funds are held safely until the service is completed to your satisfaction.',
      details: [
        'Multiple payment methods supported',
        'Secure encryption for all transactions',
        'Funds held in escrow until completion',
        'Full payment transparency'
      ],
      color: '#10b981'
    },
    {
      icon: <FaUserCheck />,
      title: 'Service Delivery',
      description: 'The provider delivers the service as agreed. Track progress in real-time and communicate directly with the provider through our platform.',
      details: [
        'Real-time service tracking',
        'Direct messaging with provider',
        'Photo and status updates',
        'Quality assurance checks'
      ],
      color: '#f59e0b'
    },
    {
      icon: <FaCheckCircle />,
      title: 'Review & Release',
      description: 'Confirm satisfaction with the service. Rate your experience and release payment to the provider. Your feedback helps the community.',
      details: [
        'Rate and review the service',
        'Release payment securely',
        'Provider receives payment promptly',
        'Build community trust'
      ],
      color: '#ef4444'
    }
  ];

  // User types
  const userTypes = [
    {
      type: 'Customer',
      icon: <FaUsers />,
      description: 'Find and book trusted professionals for any service you need.',
      benefits: [
        'Access to verified professionals',
        'Secure payments with buyer protection',
        'Transparent pricing and reviews',
        'Easy booking and rescheduling',
        '24/7 customer support'
      ]
    },
    {
      type: 'Provider',
      icon: <FaUserTie />,
      description: 'Offer your services, grow your business, and connect with customers.',
      benefits: [
        'Reach thousands of potential customers',
        'Flexible scheduling and pricing',
        'Secure and timely payments',
        'Build your reputation with reviews',
        'Business growth tools and analytics'
      ]
    }
  ];

  // Payment and escrow process
  const escrowProcess = [
    {
      step: 1,
      title: 'Customer Pays',
      description: 'Customer makes payment which is held securely in escrow.',
      icon: <FaWallet />
    },
    {
      step: 2,
      title: 'Funds Secured',
      description: 'Payment is held in a dedicated escrow account until service completion.',
      icon: <FaLock />
    },
    {
      step: 3,
      title: 'Service Delivered',
      description: 'Provider delivers the service as agreed upon.',
      icon: <FaCheckCircle />
    },
    {
      step: 4,
      title: 'Customer Approves',
      description: 'Customer confirms satisfaction and releases payment.',
      icon: <FaHandshake />
    },
    {
      step: 5,
      title: 'Provider Paid',
      description: 'Funds are released to the provider minus platform fees.',
      icon: <FaMoneyBillWave />
    }
  ];

  // Recovery and dispute resolution
  const recoveryProcess = [
    {
      title: '1. Direct Communication',
      description: 'Contact the provider directly through our messaging system to resolve issues.',
      icon: <FaCommentDots />
    },
    {
      title: '2. Report Issue',
      description: 'If unresolved, report the issue through our support system.',
      icon: <FaExclamationTriangle />
    },
    {
      title: '3. Escrow Hold',
      description: 'Funds remain in escrow while the dispute is investigated.',
      icon: <FaLock />
    },
    {
      title: '4. Mediation',
      description: 'Our team mediates to find a fair resolution for both parties.',
      icon: <FaHandshake />
    },
    {
      title: '5. Resolution',
      description: 'Refund, partial payment, or full payment based on the investigation.',
      icon: <FaCheckCircle />
    }
  ];

  // Features
  const features = [
    {
      icon: <FaShieldAlt />,
      title: 'Secure Transactions',
      description: 'All payments are secured and held in escrow until service completion.'
    },
    {
      icon: <FaClock />,
      title: '24/7 Availability',
      description: 'Book services anytime, anywhere with our round-the-clock platform.'
    },
    {
      icon: <FaStar />,
      title: 'Verified Reviews',
      description: 'Real reviews from verified customers to help you make informed decisions.'
    },
    {
      icon: <FaMoneyBillWave />,
      title: 'Best Price Guarantee',
      description: 'Competitive pricing with no hidden fees or surprises.'
    },
    {
      icon: <FaShieldVirus />,
      title: 'Fraud Protection',
      description: 'Advanced fraud detection and prevention systems keep you safe.'
    },
    {
      icon: <FaMedal />,
      title: 'Quality Assurance',
      description: 'All providers are vetted and verified before joining the platform.'
    }
  ];

  return (
    <>
      <div ref={topRef} />
      
      <Container fluid className="py-4" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        {/* Hero Section */}
        <Container>
          <Row className="mb-5 align-items-center">
            <Col lg={7} className="mb-4 mb-lg-0">
              <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">
                <FaRocket className="me-2" /> How It Works
              </Badge>
              <h1 className="display-4 fw-bold mb-4">
                Your Trusted Service Booking <br />
                <span className="text-primary">Platform</span>
              </h1>
              <p className="lead text-muted mb-4">
                From search to completion, we've designed every step to be seamless,
                secure, and satisfactory. Here's how the entire process works.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Button as={Link} to="/services" variant="primary" size="lg" className="px-4">
                  Find a Service
                </Button>
                <Button as={Link} to="/register" variant="outline-secondary" size="lg" className="px-4">
                  Get Started
                </Button>
              </div>
            </Col>
            <Col lg={5}>
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                alt="How it works"
                className="img-fluid rounded-3 shadow"
              />
            </Col>
          </Row>

          {/* Quick Overview - The Chain */}
          <Card className="border-0 shadow-sm mb-5">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">The Service Chain</h2>
              <p className="text-center text-muted mb-4">
                Every booking follows this secure and transparent chain from start to finish
              </p>
              <Row className="g-3">
                {steps.map((step, index) => (
                  <Col md key={index} className="text-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{
                        width: '60px',
                        height: '60px',
                        background: `${step.color}20`,
                        color: step.color,
                        fontSize: '24px'
                      }}
                    >
                      {step.icon}
                    </div>
                    <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                      <Badge bg="secondary" className="rounded-pill">Step {index + 1}</Badge>
                      {index < steps.length - 1 && (
                        <FaArrowRight className="text-muted d-none d-md-block" />
                      )}
                    </div>
                    <h6 className="fw-bold">{step.title}</h6>
                    <p className="text-muted small">{step.description.substring(0, 60)}...</p>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Detailed Steps */}
          <h2 className="text-center mb-4">Step-by-Step Guide</h2>
          <p className="text-center text-muted mb-4">Detailed breakdown of each step in the booking process</p>
          
          {steps.map((step, index) => (
            <Card className="border-0 shadow-sm mb-4" key={index}>
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={3} className="text-center mb-3 mb-md-0">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                      style={{
                        width: '80px',
                        height: '80px',
                        background: `${step.color}20`,
                        color: step.color,
                        fontSize: '32px'
                      }}
                    >
                      {step.icon}
                    </div>
                    <Badge bg="primary" className="mt-3 rounded-pill">Step {index + 1}</Badge>
                    <h5 className="mt-2 fw-bold">{step.title}</h5>
                  </Col>
                  <Col md={9}>
                    <p className="text-muted">{step.description}</p>
                    <ListGroup variant="flush">
                      {step.details.map((detail, i) => (
                        <ListGroup.Item key={i} className="border-0 ps-0">
                          <FaCheckCircle className="text-success me-2" />
                          {detail}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}

          {/* User Types */}
          <h2 className="text-center mb-4">For Everyone</h2>
          <p className="text-center text-muted mb-4">Whether you're a customer or provider, we've got you covered</p>
          
          <Row className="g-4 mb-5">
            {userTypes.map((user, index) => (
              <Col md={6} key={index}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '50px',
                          height: '50px',
                          background: '#6366f120',
                          color: '#6366f1',
                          fontSize: '24px'
                        }}
                      >
                        {user.icon}
                      </div>
                      <h4 className="mb-0">{user.type}</h4>
                    </div>
                    <p className="text-muted mb-3">{user.description}</p>
                    <h6 className="fw-bold">Benefits:</h6>
                    <ListGroup variant="flush">
                      {user.benefits.map((benefit, i) => (
                        <ListGroup.Item key={i} className="border-0 ps-0">
                          <FaCheckCircle className="text-success me-2" />
                          {benefit}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Payment & Escrow */}
          <h2 className="text-center mb-4">Secure Payment & Escrow</h2>
          <p className="text-center text-muted mb-4">How your funds are protected throughout the process</p>
          
          <Card className="border-0 shadow-sm mb-5">
            <Card.Body className="p-4">
              <Row className="g-4">
                {escrowProcess.map((item, index) => (
                  <Col md key={index}>
                    <div className="text-center">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: '#10b98120',
                          color: '#10b981',
                          fontSize: '24px'
                        }}
                      >
                        {item.icon}
                      </div>
                      <Badge bg="success" className="mb-2 rounded-pill">Step {item.step}</Badge>
                      <h6 className="fw-bold">{item.title}</h6>
                      <p className="text-muted small">{item.description}</p>
                      {index < escrowProcess.length - 1 && (
                        <FaArrowRight className="text-muted d-none d-md-block mt-2" />
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Recovery & Dispute Resolution */}
          <h2 className="text-center mb-4">Recovery & Dispute Resolution</h2>
          <p className="text-center text-muted mb-4">What happens when things don't go as planned</p>
          
          <Card className="border-0 shadow-sm mb-5">
            <Card.Body className="p-4">
              <Row className="g-4">
                {recoveryProcess.map((item, index) => (
                  <Col md key={index}>
                    <div className="text-center">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{
                          width: '60px',
                          height: '60px',
                          background: '#ef444420',
                          color: '#ef4444',
                          fontSize: '24px'
                        }}
                      >
                        {item.icon}
                      </div>
                      <h6 className="fw-bold">{item.title}</h6>
                      <p className="text-muted small">{item.description}</p>
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="text-center mt-4">
                <Button as={Link} to="/faq" variant="outline-primary">
                  Learn More About Disputes
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Platform Features */}
          <h2 className="text-center mb-4">Platform Features</h2>
          <p className="text-center text-muted mb-4">Why thousands trust our platform</p>
          
          <Row className="g-4 mb-5">
            {features.map((feature, index) => (
              <Col md={4} key={index}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="p-4 text-center">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{
                        width: '60px',
                        height: '60px',
                        background: '#8b5cf620',
                        color: '#8b5cf6',
                        fontSize: '28px'
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h6 className="fw-bold">{feature.title}</h6>
                    <p className="text-muted small mb-0">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* FAQ Accordion */}
          <h2 className="text-center mb-4">Frequently Asked Questions</h2>
          
          <Accordion defaultActiveKey="0" className="mb-5">
            <Accordion.Item eventKey="0">
              <Accordion.Header>How do I get started as a customer?</Accordion.Header>
              <Accordion.Body>
                Simply create an account, browse services, and book your first service. 
                You can search by category, location, or keywords to find the perfect provider.
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>How do I become a provider?</Accordion.Header>
              <Accordion.Body>
                Sign up as a provider, complete your profile, verify your identity, and start 
                offering your services. Our team will review and approve your profile.
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2">
              <Accordion.Header>How does escrow payment work?</Accordion.Header>
              <Accordion.Body>
                When you book a service, your payment is held securely in escrow. The funds are 
                only released to the provider after you confirm the service was completed to your 
                satisfaction.
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
              <Accordion.Header>What happens if I'm not satisfied?</Accordion.Header>
              <Accordion.Body>
                You can report any issues within the resolution period. Our support team will 
                investigate and help resolve the dispute fairly. Funds remain in escrow until 
                resolution.
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="4">
              <Accordion.Header>How are recovery funds handled?</Accordion.Header>
              <Accordion.Body>
                Recovery funds are held in a separate account to cover refunds or chargebacks. 
                This ensures both customers and providers are protected in case of disputes or 
                fraudulent activities.
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {/* CTA Section */}
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="p-5 text-center">
              <h2 className="mb-4">Ready to Get Started?</h2>
              <p className="lead mb-4">
                Join thousands of satisfied customers and providers on our platform today.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Button as={Link} to="/register" variant="light" size="lg" className="px-4">
                  Sign Up Free
                </Button>
                <Button as={Link} to="/services" variant="outline-light" size="lg" className="px-4">
                  Explore Services
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </Container>
    </>
  );
};

export default HowItWorks;