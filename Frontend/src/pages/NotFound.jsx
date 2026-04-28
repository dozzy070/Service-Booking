import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaSearch, FaArrowLeft } from 'react-icons/fa';

const NotFound = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="p-5">
              <div className="display-1 text-primary fw-bold mb-4">404</div>
              
              <h2 className="mb-3">Page Not Found</h2>
              
              <p className="text-muted mb-4">
                The page you're looking for doesn't exist or has been moved. 
                Let's get you back on track.
              </p>

              <div className="d-flex gap-3 justify-content-center">
                <Button as={Link} to="/" variant="primary">
                  <FaHome className="me-2" /> Go Home
                </Button>
                <Button as={Link} to="/services" variant="outline-primary">
                  <FaSearch className="me-2" /> Browse Services
                </Button>
              </div>

              <hr className="my-4" />

              <div className="text-start">
                <h6>Popular Pages:</h6>
                <ul className="list-unstyled">
                  <li className="mb-2"><Link to="/services" className="text-decoration-none">→ Browse All Services</Link></li>
                  <li className="mb-2"><Link to="/login" className="text-decoration-none">→ Sign In to Your Account</Link></li>
                  <li className="mb-2"><Link to="/register" className="text-decoration-none">→ Create New Account</Link></li>
                  <li className="mb-2"><Link to="/contact" className="text-decoration-none">→ Contact Support</Link></li>
                </ul>
              </div>

              <Button variant="link" onClick={() => window.history.back()} className="mt-3">
                <FaArrowLeft className="me-2" /> Go Back
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;