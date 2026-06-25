import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { getServiceImage, handleServiceImageError } from '../../utils/imageUtils';

const ServiceCard = ({ service }) => {
  const rating = service.average_rating || service.rating || 0;
  const reviewCount = service.review_count || 0;

  return (
    <Card className="h-100 border-0 shadow-sm hover-shadow">
      <Card.Img
        variant="top"
        src={service.images?.[0] || 'getServiceImage(null, service.title, 300, 200)'}
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h6 mb-0">{service.title}</Card.Title>
          <Badge bg="primary" pill>{service.category}</Badge>
        </div>
        
        <div className="d-flex align-items-center mb-2">
          <div className="text-warning me-2">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < Math.floor(rating) ? 'text-warning' : 'text-secondary'}
                size={12}
              />
            ))}
          </div>
          <small className="text-muted">({reviewCount})</small>
        </div>

        {service.location && (
          <div className="d-flex align-items-center text-muted small mb-2">
            <FaMapMarkerAlt className="me-1" />
            {service.location}
          </div>
        )}

        <p className="text-muted small mb-3">
          {service.description?.substring(0, 100)}...
        </p>

        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold text-primary">
            {formatCurrency(service.price)}
          </span>
          <Button
            as={Link}
            to={`/services/${service.id}`}
            variant="outline-primary"
            size="sm"
          >
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ServiceCard;