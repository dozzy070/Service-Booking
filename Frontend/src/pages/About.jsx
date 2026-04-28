import React from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaUsers,
  FaHandshake,
  FaShieldAlt,
  FaRocket,
  FaHeart,
  FaGlobe
} from 'react-icons/fa';

const About = () => {
  const stats = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '10K+', label: 'Service Providers' },
    { value: '100K+', label: 'Bookings Completed' },
    { value: '4.8', label: 'Average Rating' }
  ];

  const values = [
    {
      icon: <FaHandshake />,
      title: 'Trust & Reliability',
      description: 'We verify all our providers and ensure quality service delivery.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Safety First',
      description: 'Your safety is our priority with secure payments and background checks.'
    },
    {
      icon: <FaRocket />,
      title: 'Innovation',
      description: 'We continuously improve our platform to serve you better.'
    },
    {
      icon: <FaHeart />,
      title: 'Customer Focus',
      description: 'Your satisfaction drives everything we do.'
    },
    {
      icon: <FaGlobe />,
      title: 'Community',
      description: 'Building a global community of trusted service providers.'
    },
    {
      icon: <FaUsers />,
      title: 'Inclusivity',
      description: 'Everyone is welcome, regardless of background or location.'
    }
  ];

  return (
    <Container className="py-4">
      {/* Hero Section */}
      <Row className="mb-5 align-items-center">
        <Col lg={6} className="mb-4 mb-lg-0">
          <h1 className="display-4 fw-bold mb-4">About SmartServices</h1>
          <p className="lead text-muted mb-4">
            We're on a mission to connect people with trusted professionals for all their service needs. 
            From home repairs to professional consulting, we make finding and booking services simple and secure.
          </p>
          <Button as={Link} to="/services" variant="primary" size="lg">
            Explore Services
          </Button>
        </Col>
        <Col lg={6}>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            alt="Team working together"
            className="img-fluid rounded-3 shadow"
          />
        </Col>
      </Row>

      {/* Stats Section */}
      <Row className="mb-5">
        {stats.map((stat, index) => (
          <Col md={3} key={index} className="mb-3 mb-md-0">
            <Card className="border-0 shadow-sm text-center h-100">
              <Card.Body>
                <h2 className="display-5 fw-bold text-primary mb-2">
                  {stat.value}
                </h2>
                <p className="text-muted mb-0">{stat.label}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Our Story */}
      <Row className="mb-5 align-items-center">
        <Col lg={6} className="order-lg-2 mb-4 mb-lg-0">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            alt="Our story"
            className="img-fluid rounded-3 shadow"
          />
        </Col>
        <Col lg={6} className="order-lg-1">
          <h2 className="mb-4">Our Story</h2>
          <p className="text-muted mb-4">
            Founded in 2020, SmartServices started with a simple idea: make it easy for people to find 
            trusted professionals for any service. What began as a small platform in San Francisco has 
            grown into a global community connecting millions of customers with skilled providers.
          </p>
          <p className="text-muted mb-4">
            Today, we're proud to serve customers in over 50 cities worldwide, with thousands of 
            verified professionals offering everything from home cleaning to business consulting.
          </p>
          <p className="text-muted">
            Our commitment to quality, safety, and customer satisfaction has made us one of the fastest-growing 
            service platforms in the industry.
          </p>
        </Col>
      </Row>

      {/* Our Values */}
      <Row className="mb-5">
        <Col className="text-center mb-4">
          <h2>Our Values</h2>
          <p className="text-muted">What drives us every day</p>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        {values.map((value, index) => (
          <Col md={4} key={index}>
            <Card className="border-0 shadow-sm h-100 text-center">
              <Card.Body>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <span className="text-primary" style={{ fontSize: '2rem' }}>
                    {value.icon}
                  </span>
                </div>
                <h5 className="mb-3">{value.title}</h5>
                <p className="text-muted mb-0">{value.description}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Team Section */}
      <Row className="mb-5">
        <Col className="text-center mb-4">
          <h2>Meet Our Leadership</h2>
          <p className="text-muted">The team behind SmartServices</p>
        </Col>
      </Row>

      <Row className="g-4 mb-5">
        {[1, 2, 3].map((item) => (
          <Col md={4} key={item}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Img
                variant="top"
                src={`https://ui-avatars.com/api/?name=Team+Member+${item}&size=300`}
                className="rounded-circle mx-auto mt-4"
                style={{ width: 150, height: 150 }}
              />
              <Card.Body>
                <Card.Title>John Doe</Card.Title>
                <Card.Subtitle className="text-muted mb-3">CEO & Co-founder</Card.Subtitle>
                <Card.Text>
                  Former tech executive with 15+ years of experience in building marketplaces.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* CTA Section */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="p-5 text-center">
              <h2 className="mb-4">Join Our Community</h2>
              <p className="lead mb-4">
                Whether you're looking for services or want to offer your skills, 
                we're here to help you succeed.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <Button as={Link} to="/register" variant="light" size="lg" className="px-4">
                  Sign Up Now
                </Button>
                <Button as={Link} to="/contact" variant="outline-light" size="lg" className="px-4">
                  Contact Us
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default About;