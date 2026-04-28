import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaMapMarkerAlt,
  FaDollarSign,
  FaStar,
  FaComment
} from 'react-icons/fa';
import BookingStatus from './BookingStatus';

const BookingCard = ({ booking, type = 'customer', onAction }) => {
  const {
    id,
    service_title,
    service_image,
    booking_date,
    status,
    payment_status,
    price,
    customer_name,
    customer_avatar,
    provider_name,
    provider_avatar,
    location,
    rating
  } = booking;

  const isCustomer = type === 'customer';
  const otherParty = isCustomer ? provider_name : customer_name;
  const otherPartyAvatar = isCustomer ? provider_avatar : customer_avatar;

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'info',
      completed: 'success',
      cancelled: 'danger',
      rejected: 'danger'
    };
    return variants[status] || 'secondary';
  };

  const getPaymentVariant = (status) => {
    const variants = {
      paid: 'success',
      unpaid: 'warning',
      refunded: 'info'
    };
    return variants[status] || 'secondary';
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(id, action);
    }
  };

  return (
    <Card className="border-0 shadow-sm mb-3 hover-shadow">
      <Card.Body>
        <Row>
          {/* Service Image */}
          <Col md={2} className="mb-3 mb-md-0">
            <img
              src={service_image || 'https://via.placeholder.com/100x100'}
              alt={service_title}
              className="img-fluid rounded"
              style={{ width: '100%', height: '100px', objectFit: 'cover' }}
            />
          </Col>

          {/* Booking Details */}
          <Col md={7}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="mb-0">
                <Link to={`/bookings/${id}`} className="text-decoration-none text-dark">
                  {service_title}
                </Link>
              </h5>
              <div>
                <BookingStatus status={status} className="me-2" />
                <Badge bg={getPaymentVariant(payment_status)} pill>
                  {payment_status}
                </Badge>
              </div>
            </div>

            <Row className="mb-2">
              <Col sm={6}>
                <div className="d-flex align-items-center text-muted mb-2">
                  <FaCalendarAlt className="me-2" size={12} />
                  <small>{formatDate(booking_date)}</small>
                </div>
                <div className="d-flex align-items-center text-muted">
                  <FaUser className="me-2" size={12} />
                  <small>with {otherParty}</small>
                </div>
              </Col>
              <Col sm={6}>
                <div className="d-flex align-items-center text-muted mb-2">
                  <FaDollarSign className="me-2" size={12} />
                  <small>{formatCurrency(price)}</small>
                </div>
                {location && (
                  <div className="d-flex align-items-center text-muted">
                    <FaMapMarkerAlt className="me-2" size={12} />
                    <small>{location}</small>
                  </div>
                )}
              </Col>
            </Row>

            {rating && (
              <div className="d-flex align-items-center">
                <FaStar className="text-warning me-1" />
                <small>{rating.toFixed(1)}</small>
              </div>
            )}
          </Col>

          {/* Actions */}
          <Col md={3} className="d-flex flex-column align-items-end justify-content-between">
            <div className="d-flex gap-2 mb-2">
              <Button
                as={Link}
                to={`/chat?booking=${id}`}
                variant="outline-primary"
                size="sm"
              >
                <FaComment />
              </Button>
            </div>

            {status === 'pending' && isCustomer && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleAction('cancel')}
              >
                Cancel
              </Button>
            )}

            {status === 'pending' && !isCustomer && (
              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleAction('accept')}
                >
                  Accept
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleAction('reject')}
                >
                  Reject
                </Button>
              </div>
            )}

            {status === 'accepted' && !isCustomer && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleAction('complete')}
              >
                Mark Complete
              </Button>
            )}

            {status === 'completed' && isCustomer && !rating && (
              <Button
                as={Link}
                to={`/review/${id}`}
                variant="warning"
                size="sm"
              >
                Leave Review
              </Button>
            )}

            <small className="text-muted mt-2">
              Booking #{id}
            </small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default BookingCard;