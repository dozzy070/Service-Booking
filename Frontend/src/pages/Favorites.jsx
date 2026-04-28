import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaStar, FaTrash } from 'react-icons/fa';
import { getServiceImage, handleImageError } from '../utils/imageUtils';
import api from '../api';

const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return `$${parseFloat(amount).toFixed(2)}`;
};

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setError(null);
    try {
      const response = await api.get('/customer/favorites');
      setFavorites(response.data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites. Please try again later.');
    }
  };

  const removeFavorite = async (serviceId) => {
    if (!window.confirm('Remove from favorites?')) return;
    try {
      await api.delete(`/customer/favorites/${serviceId}`);
      setFavorites(prev => prev.filter(s => s.id !== serviceId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove. Please try again.');
    }
  };

  if (error) {
    return (
      <Container className="py-5 text-center">
        <p className="text-danger">{error}</p>
        <Button variant="primary" onClick={fetchFavorites}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Favorite Services</h2>
        <Button as={Link} to="/services" variant="primary">
          Browse More Services
        </Button>
      </div>

      {favorites.length > 0 ? (
        <Row xs={1} md={2} lg={3} className="g-4">
          {favorites.map(service => (
            <Col key={service.id}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Img
                  variant="top"
                  src={getServiceImage(service.title, service.id, 300, 200)}
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={(e) => handleImageError(e, getServiceImage(service.title, service.id, 300, 200))}
                />
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h6">{service.title}</Card.Title>
                    <Badge bg="info" pill>{service.category}</Badge>
                  </div>
                  
                  <div className="d-flex align-items-center mb-2">
                    <div className="text-warning me-2">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < Math.floor(service.rating) ? 'text-warning' : 'text-secondary'}
                          size={12}
                        />
                      ))}
                    </div>
                    <small className="text-muted">({service.review_count})</small>
                  </div>

                  <p className="text-muted small mb-2">
                    by {service.provider_name}
                  </p>

                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-primary">
                      {formatCurrency(service.price)}
                    </span>
                    <div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="me-2"
                        onClick={() => removeFavorite(service.id)}
                      >
                        <FaTrash />
                      </Button>
                      <Button
                        as={Link}
                        to={`/services/${service.id}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <FaHeart size={48} className="text-muted mb-3" />
            <h5>No favorite services yet</h5>
            <p className="text-muted">Start adding services to your favorites</p>
            <Button as={Link} to="/services" variant="primary">
              Browse Services
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Favorites;