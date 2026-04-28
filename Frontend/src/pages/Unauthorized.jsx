import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLock, FaArrowLeft, FaHome } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="p-5">
              <div className="text-danger mb-4">
                <FaLock size={60} />
              </div>

              <h2 className="mb-3">Access Denied</h2>

              <p className="text-muted mb-4">
                You don't have permission to access this page. 
                {!user ? ' Please sign in with an authorized account.' : ''}
              </p>

              {user ? (
                <div className="bg-light p-3 rounded mb-4">
                  <p className="mb-2">Your current role: <strong>{user.role}</strong></p>
                  <p className="text-muted small mb-0">
                    This page requires a different role or additional permissions.
                  </p>
                </div>
              ) : (
                <p className="text-muted mb-4">
                  Please sign in to access this content.
                </p>
              )}

              <div className="d-flex gap-3 justify-content-center">
                <Button as={Link} to="/" variant="primary">
                  <FaHome className="me-2" /> Go Home
                </Button>
                {!user && (
                  <Button as={Link} to="/login" variant="outline-primary">
                    Sign In
                  </Button>
                )}
                {user && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => window.history.back()}
                  >
                    <FaArrowLeft className="me-2" /> Go Back
                  </Button>
                )}
              </div>

              <hr className="my-4" />

              <h6>Need Help?</h6>
              <p className="small text-muted">
                If you believe this is a mistake, please{' '}
                <Link to="/contact" className="text-decoration-none">
                  contact support
                </Link>
                .
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Unauthorized;