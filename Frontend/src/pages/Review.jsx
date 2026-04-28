import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaStar,
  FaThumbsUp,
  FaFlag,
  FaUserCircle
} from 'react-icons/fa';
import { getAvatarUrl, handleImageError } from '../utils/imageUtils';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const Reviews = () => {
  const [filter, setFilter] = useState('all');
  const [reviews] = useState([
    {
      id: 1,
      reviewer_name: 'John Doe',
      rating: 5,
      title: 'Excellent service!',
      comment: 'Very professional and punctual. Did an amazing job with the house cleaning.',
      created_at: new Date(),
      helpful_count: 12,
      service_id: 1,
      service_title: 'House Cleaning'
    },
    {
      id: 2,
      reviewer_name: 'Jane Smith',
      rating: 4,
      title: 'Good work',
      comment: 'Fixed the plumbing issue quickly. Reasonable prices.',
      created_at: new Date(),
      helpful_count: 8,
      service_id: 2,
      service_title: 'Plumbing Repair'
    },
    {
      id: 3,
      reviewer_name: 'Bob Wilson',
      rating: 5,
      title: 'Highly recommended',
      comment: 'Very knowledgeable and efficient. Will hire again.',
      created_at: new Date(),
      helpful_count: 15,
      service_id: 3,
      service_title: 'Electrical Work'
    }
  ]);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={i < rating ? 'text-warning' : 'text-secondary'}
        size={14}
      />
    ));
  };

  const handleHelpful = (reviewId) => {
    alert('Thank you for your feedback!');
  };

  const handleReport = (reviewId) => {
    alert('Review reported. Thank you for helping keep our community safe.');
  };

  const filteredReviews = reviews.filter(review => {
    if (filter !== 'all' && review.rating !== parseInt(filter)) return false;
    return true;
  });

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Reviews</h2>
          <p className="text-muted">See what people are saying</p>
        </Col>
        <Col xs="auto">
          <Form.Select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">All Reviews</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </Form.Select>
        </Col>
      </Row>

      {filteredReviews.length > 0 ? (
        filteredReviews.map(review => (
          <Card key={review.id} className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={2} className="text-center mb-3 mb-md-0">
                  <img
                    src={getAvatarUrl(review.reviewer_name, 80)}
                    alt={review.reviewer_name}
                    className="rounded-circle mb-2"
                    style={{ width: 80, height: 80, objectFit: 'cover' }}
                    onError={(e) => handleImageError(e, getAvatarUrl(review.reviewer_name, 80))}
                  />
                  <h6 className="mb-1">{review.reviewer_name}</h6>
                </Col>

                <Col md={10}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="mb-2">
                        {renderStars(review.rating)}
                      </div>
                      <h5>{review.title}</h5>
                    </div>
                    <Badge bg="light" text="dark">
                      {formatDate(review.created_at)}
                    </Badge>
                  </div>

                  <p className="mb-3">{review.comment}</p>

                  <div className="d-flex align-items-center">
                    <Button
                      variant="link"
                      className="p-0 me-3 text-muted"
                      onClick={() => handleHelpful(review.id)}
                    >
                      <FaThumbsUp className="me-1" />
                      Helpful ({review.helpful_count})
                    </Button>
                    <Button
                      variant="link"
                      className="p-0 text-muted"
                      onClick={() => handleReport(review.id)}
                    >
                      <FaFlag className="me-1" />
                      Report
                    </Button>
                    <Link to={`/services/${review.service_id}`} className="text-decoration-none ms-auto">
                      View Service →
                    </Link>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        ))
      ) : (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <h5>No reviews found</h5>
            <p className="text-muted">Be the first to leave a review!</p>
            <Button as={Link} to="/services" variant="primary">
              Browse Services
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Reviews;