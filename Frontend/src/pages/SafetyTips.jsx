// src/pages/SafetyTips.jsx
import React, { useEffect, useRef } from 'react';
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
  FaCogs,
  FaFirstAid,
  FaFireExtinguisher,
  FaExclamationTriangle,
  FaLock,
  FaVideo,
  FaAmbulance,
  FaPhoneAlt,
  FaUserShield,
  FaHome,
  FaCar,
  FaWifi,
  FaPlug,
  FaBug,
  FaWind,
  FaSun,
  FaMask,
  FaSoap,
  FaSyringe,
  FaHeartbeat,
  FaBrain,
  FaDumbbell,
  FaAppleAlt,
  FaWater,
  FaBed,
  FaSmile,
  FaChild,
  FaDog,
  FaCat,
  FaTree,
  FaMountain,
  FaSnowflake,
  FaFlask,
  FaMicroscope,
  FaVirus,
  FaBiohazard,
  FaPills,
  FaHospital,
  FaStethoscope,
  FaUserMd,
  FaTooth,
  FaEye,
  FaHeart,
  FaLungs,
  FaBone,
  FaAtom,
  FaDna,
  FaMicrochip,
  FaRobot,
  FaSatellite,
  FaRocket,
  FaPeopleArrows,
  FaHands,
  FaHandSpock,
  FaHandPeace,
  FaHandHolding
} from 'react-icons/fa';

const SafetyTips = () => {
  const topRef = useRef(null);

  // ✅ Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const safetyTips = [
    {
      icon: <FaShieldAlt size={40} />,
      title: 'Verify Service Providers',
      description: 'Always check provider credentials, reviews, and verification status before booking. Our platform verifies all providers thoroughly.',
      benefits: [
        'Check provider ratings and reviews',
        'Verify licenses and certifications',
        'Review past customer feedback',
        'Confirm insurance coverage'
      ]
    },
    {
      icon: <FaLock size={40} />,
      title: 'Secure Payments',
      description: 'Never make payments outside the platform. Our secure system protects your financial information.',
      benefits: [
        'Use only platform payment system',
        'Never share banking details directly',
        'Report suspicious payment requests',
        'Keep payment confirmations'
      ]
    },
    {
      icon: <FaVideo size={40} />,
      title: 'Virtual Consultations',
      description: 'Use video calls for initial consultations to assess work quality and professionalism before committing.',
      benefits: [
        'Request virtual site assessments',
        'Ask for portfolio samples',
        'Discuss project details clearly',
        'Get written estimates'
      ]
    },
    {
      icon: <FaFirstAid size={40} />,
      title: 'Emergency Preparedness',
      description: 'Know what to do in case of emergencies. Keep emergency contacts and safety equipment accessible.',
      benefits: [
        'Keep first aid kit accessible',
        'Know emergency contact numbers',
        'Have evacuation plan ready',
        'Ensure fire extinguisher is available'
      ]
    }
  ];

  return (
    <>
      {/* ✅ Hidden anchor for scrolling */}
      <div ref={topRef} />
      
      {/* Hero section */}
      <section className="safety-hero py-5" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: 'white' }}>
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <Badge bg="warning" text="dark" className="mb-3 px-3 py-2">Safety First</Badge>
              <h1 className="display-4 fw-bold mb-4">Your Safety <span className="text-warning">Is Our Priority</span></h1>
              <p className="lead mb-4">
                Essential safety tips and best practices for a secure service experience. Stay safe, stay protected.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats / trust indicators */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="text-center g-4">
            <Col md={3}>
              <FaShieldAlt className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">100%</h3>
              <p>Verified Providers</p>
            </Col>
            <Col md={3}>
              <FaLock className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">Secure</h3>
              <p>Payment Protection</p>
            </Col>
            <Col md={3}>
              <FaClock className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">24/7</h3>
              <p>Safety Support</p>
            </Col>
            <Col md={3}>
              <FaUsers className="text-primary mb-3" size={36} />
              <h3 className="fw-bold">500K+</h3>
              <p>Safe Bookings</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Safety Tips Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="success" className="mb-3 px-3 py-2">Essential Tips</Badge>
              <h2 className="display-6 fw-bold mb-3">Important Safety Tips</h2>
              <p className="lead text-muted">Follow these guidelines for a safe and secure service experience</p>
            </Col>
          </Row>
          <Row className="g-4">
            {safetyTips.map((tip, idx) => (
              <Col md={6} key={idx}>
                <Card className="h-100 border-0 shadow-sm safety-card">
                  <Card.Body className="p-4">
                    <div className="safety-icon mb-3 text-primary">{tip.icon}</div>
                    <h4 className="mb-3">{tip.title}</h4>
                    <p className="text-muted">{tip.description}</p>
                    <ul className="list-unstyled mt-3">
                      {tip.benefits.map((benefit, i) => (
                        <li key={i} className="mb-2">
                          <FaCheckCircle className="text-success me-2" /> {benefit}
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Safety Articles Section */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="info" className="mb-3 px-3 py-2">Safety Articles</Badge>
              <h2 className="display-6 fw-bold mb-3">In-Depth Safety Guides</h2>
              <p className="lead text-muted">Comprehensive safety resources for different situations</p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Img 
                  variant="top" 
                  src="https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600" 
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://picsum.photos/id/104/600/400'; }}
                />
                <Card.Body>
                  <h5>Home Safety Checklist</h5>
                  <p className="text-muted small">Essential safety measures for every home including fire safety, electrical safety, and emergency preparedness.</p>
                  <Button as={Link} to="/blog" variant="outline-primary" size="sm">Read More</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Img 
                  variant="top" 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600" 
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://picsum.photos/id/105/600/400'; }}
                />
                <Card.Body>
                  <h5>Workplace Safety</h5>
                  <p className="text-muted small">Best practices for maintaining a safe work environment, handling equipment, and emergency response.</p>
                  <Button as={Link} to="/blog" variant="outline-primary" size="sm">Read More</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Img 
                  variant="top" 
                  src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600" 
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://picsum.photos/id/106/600/400'; }}
                />
                <Card.Body>
                  <h5>Digital Safety Guide</h5>
                  <p className="text-muted small">Protect yourself online with tips on secure payments, privacy settings, and avoiding scams.</p>
                  <Button as={Link} to="/blog" variant="outline-primary" size="sm">Read More</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Quick Safety Tips - Grid */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <h2 className="display-6 fw-bold mb-3">Quick Safety Tips</h2>
              <p className="lead text-muted">Simple actions to stay safe</p>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={3} sm={6}>
              <div className="border rounded-3 p-4 text-center bg-white shadow-sm h-100">
                <FaUserShield size={32} className="text-primary mb-3" />
                <h6>Verify Identity</h6>
                <p className="small text-muted">Always verify provider identity before service</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="border rounded-3 p-4 text-center bg-white shadow-sm h-100">
                <FaPhoneAlt size={32} className="text-primary mb-3" />
                <h6>Emergency Contact</h6>
                <p className="small text-muted">Keep emergency contacts readily available</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="border rounded-3 p-4 text-center bg-white shadow-sm h-100">
                <FaExclamationTriangle size={32} className="text-primary mb-3" />
                <h6>Report Issues</h6>
                <p className="small text-muted">Report suspicious activity immediately</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="border rounded-3 p-4 text-center bg-white shadow-sm h-100">
                <FaHandshake size={32} className="text-primary mb-3" />
                <h6>Trust Your Instincts</h6>
                <p className="small text-muted">If something feels wrong, pause and verify</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Emergency Contacts Section */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="danger" className="mb-3 px-3 py-2">Emergency</Badge>
              <h2 className="display-6 fw-bold mb-3">Emergency Contacts</h2>
              <p className="lead text-muted">Keep these numbers handy for emergencies</p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={4}>
              <div className="border rounded-4 p-4 text-center bg-danger bg-opacity-10 h-100">
                <FaAmbulance size={48} className="text-danger mb-3" />
                <h5>Emergency Services</h5>
                <h3 className="fw-bold text-danger">911</h3>
                <p className="text-muted small">For immediate life-threatening emergencies</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="border rounded-4 p-4 text-center bg-primary bg-opacity-10 h-100">
                <FaFireExtinguisher size={48} className="text-primary mb-3" />
                <h5>Fire Department</h5>
                <h3 className="fw-bold text-primary">912</h3>
                <p className="text-muted small">For fire emergencies and rescue services</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="border rounded-4 p-4 text-center bg-success bg-opacity-10 h-100">
                <FaHospital size={48} className="text-success mb-3" />
                <h5>Medical Emergency</h5>
                <h3 className="fw-bold text-success">913</h3>
                <p className="text-muted small">For medical emergencies and ambulance services</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Safety CTA */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container>
          <Row className="align-items-center text-white">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="display-6 fw-bold mb-3">Need Help or Have Safety Concerns?</h2>
              <p className="lead mb-0 opacity-90">Our safety team is here to assist you 24/7.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/contact" variant="light" size="lg" className="rounded-pill px-5 fw-bold">
                Contact Safety Team →
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      <style jsx="true">{`
        .safety-card {
          transition: all 0.3s ease;
          border-radius: 20px;
        }
        .safety-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
        }
        .safety-icon {
          transition: transform 0.2s;
        }
        .safety-card:hover .safety-icon {
          transform: scale(1.05);
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          transition: transform 0.2s;
        }
      `}</style>
    </>
  );
};

export default SafetyTips;