import React, { useState } from 'react';
import { Card, Button, Badge, Row, Col, OverlayTrigger, Tooltip, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaMapMarkerAlt,
  FaDollarSign,
  FaStar,
  FaComment,
  FaEye,
  FaEllipsisV,
  FaCheckCircle,
  FaTimesCircle,
  FaUndo,
  FaShare,
  FaPrint,
  FaRegClock,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaWhatsapp
} from 'react-icons/fa';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import BookingStatus from './BookingStatus';
import { getAvatarUrl, getServiceImage, handleImageError } from '../../utils/imageUtils';

const BookingCard = ({ 
  booking, 
  type = 'customer', 
  onAction,
  onViewDetails,
  compact = false,
  showActions = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const {
    id,
    service_title,
    service_image,
    booking_date,
    date,
    time,
    status,
    payment_status,
    price,
    amount,
    customer_name,
    customer_avatar,
    provider_name,
    provider_avatar,
    location,
    address,
    rating,
    notes,
    duration,
    category,
    has_review,
    provider_phone,
    provider_email
  } = booking;

  const isCustomer = type === 'customer';
  const otherParty = isCustomer ? provider_name : customer_name;
  const otherPartyAvatar = isCustomer ? provider_avatar : customer_avatar;
  const bookingAmount = amount || price || 0;

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // Format booking date
  const formatBookingDate = (bookingDate) => {
    const dateObj = new Date(bookingDate);
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    return format(dateObj, 'MMM dd, yyyy');
  };

  const getDateDisplay = () => {
    if (date) {
      const dateObj = new Date(date);
      return {
        date: formatBookingDate(date),
        time: time || format(dateObj, 'hh:mm a')
      };
    }
    return {
      date: formatBookingDate(booking_date),
      time: time || 'TBD'
    };
  };

  const dateDisplay = getDateDisplay();

  // Get payment status badge
  const getPaymentBadge = (paymentStatus) => {
    const configs = {
      paid: { variant: 'success', text: 'Paid', icon: FaCheckCircle },
      unpaid: { variant: 'warning', text: 'Unpaid', icon: FaRegClock },
      refunded: { variant: 'info', text: 'Refunded', icon: FaUndo },
      pending: { variant: 'secondary', text: 'Pending', icon: FaClock }
    };
    const config = configs[paymentStatus] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-inline-flex align-items-center gap-1 px-2 py-1">
        <Icon size={10} />
        <span>{config.text}</span>
      </Badge>
    );
  };

  // Handle actions
  const handleAction = (action) => {
    if (onAction) {
      onAction(id, action);
    }
  };

  // Handle view details
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(booking);
    }
  };

  // Render rating stars
  const renderRating = (ratingValue) => {
    if (!ratingValue) return null;
    return (
      <div className="d-flex align-items-center gap-1">
        <FaStar className="text-warning" size={14} />
        <span className="fw-semibold">{ratingValue.toFixed(1)}</span>
        <span className="text-muted small">({booking.review_count || 0})</span>
      </div>
    );
  };

  // Get available actions based on status and user type
  const getAvailableActions = () => {
    const actions = [];
    
    if (status === 'pending') {
      if (isCustomer) {
        actions.push({ key: 'cancel', label: 'Cancel', variant: 'danger', icon: FaTimesCircle });
        actions.push({ key: 'reschedule', label: 'Reschedule', variant: 'warning', icon: FaUndo });
      } else {
        actions.push({ key: 'accept', label: 'Accept', variant: 'success', icon: FaCheckCircle });
        actions.push({ key: 'reject', label: 'Reject', variant: 'danger', icon: FaTimesCircle });
      }
    }
    
    if (status === 'confirmed' || status === 'accepted') {
      if (!isCustomer) {
        actions.push({ key: 'start', label: 'Start Service', variant: 'info', icon: FaClock });
      }
    }
    
    if (status === 'in_progress') {
      if (!isCustomer) {
        actions.push({ key: 'complete', label: 'Complete', variant: 'success', icon: FaCheckCircle });
      }
    }
    
    if (status === 'completed' && isCustomer && !has_review) {
      actions.push({ key: 'review', label: 'Write Review', variant: 'warning', icon: FaStar });
    }
    
    return actions;
  };

  const actions = getAvailableActions();

  // Compact mode rendering
  if (compact) {
    return (
      <Card className={`border-0 shadow-sm mb-2 ${className}`} style={{ borderRadius: '12px' }}>
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col xs={3} md={2}>
              <img
                src={service_image || getServiceImage(service_title, id, 60, 60)}
                alt={service_title}
                className="rounded"
                style={{ width: '100%', height: '60px', objectFit: 'cover' }}
                onError={(e) => handleImageError(e, getServiceImage(service_title, id, 60, 60))}
              />
            </Col>
            <Col xs={5} md={5}>
              <div className="fw-semibold text-truncate">{service_title}</div>
              <div className="d-flex align-items-center gap-2">
                <small className="text-muted">{dateDisplay.date}</small>
                <BookingStatus status={status} size="sm" showLabel={false} />
              </div>
            </Col>
            <Col xs={4} md={3} className="text-end">
              <div className="fw-bold text-primary">{formatCompactNaira(bookingAmount)}</div>
              <small className="text-muted d-block">{otherParty}</small>
            </Col>
            <Col xs={12} md={2} className="text-end">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleViewDetails}
                className="w-100"
              >
                <FaEye size={12} className="me-1" />
                View
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-sm hover-shadow ${className}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
      <Card.Body className="p-4">
        <Row>
          {/* Service Image */}
          <Col md={2} className="mb-3 mb-md-0">
            <img
              src={service_image || getServiceImage(service_title, id, 150, 150)}
              alt={service_title}
              className="img-fluid rounded"
              style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px' }}
              onError={(e) => handleImageError(e, getServiceImage(service_title, id, 150, 150))}
            />
          </Col>

          {/* Booking Details */}
          <Col md={7}>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
              <div>
                <h5 className="mb-1">
                  <Link to={`/services/${booking.service_id}`} className="text-decoration-none text-dark">
                    {service_title}
                  </Link>
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="light" text="dark" className="rounded-pill">
                    {category || 'Service'}
                  </Badge>
                  {duration && (
                    <small className="text-muted d-flex align-items-center gap-1">
                      <FaClock size={10} />
                      {duration}
                    </small>
                  )}
                </div>
              </div>
              <div className="d-flex gap-2">
                <BookingStatus status={status} size="sm" />
                {getPaymentBadge(payment_status)}
              </div>
            </div>

            {/* Provider/Customer Info */}
            <div className="d-flex align-items-center gap-2 mb-2">
              <img
                src={otherPartyAvatar || getAvatarUrl(otherParty, 40)}
                alt={otherParty}
                className="rounded-circle"
                style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                onError={(e) => handleImageError(e, getAvatarUrl(otherParty, 40))}
              />
              <span className="fw-medium">{otherParty}</span>
              <span className="text-muted">•</span>
              <span className="text-muted small">
                {isCustomer ? 'Provider' : 'Customer'}
              </span>
            </div>

            {/* Date, Time, Location */}
            <Row className="mb-2">
              <Col sm={6}>
                <div className="d-flex align-items-center text-muted mb-1">
                  <FaCalendarAlt className="me-2" size={12} />
                  <small>{dateDisplay.date}</small>
                  {isToday(new Date(date || booking_date)) && (
                    <Badge bg="success" className="ms-2 rounded-pill" style={{ fontSize: '9px' }}>
                      Today
                    </Badge>
                  )}
                </div>
                <div className="d-flex align-items-center text-muted">
                  <FaClock className="me-2" size={12} />
                  <small>{dateDisplay.time}</small>
                </div>
              </Col>
              <Col sm={6}>
                {location && (
                  <div className="d-flex align-items-center text-muted mb-1">
                    <FaMapMarkerAlt className="me-2" size={12} />
                    <small className="text-truncate">{location}</small>
                  </div>
                )}
                <div className="d-flex align-items-center text-muted">
                  <FaDollarSign className="me-2" size={12} />
                  <small className="fw-bold text-primary">{formatNaira(bookingAmount)}</small>
                </div>
              </Col>
            </Row>

            {/* Rating */}
            {rating && renderRating(rating)}

            {/* Notes (expanded) */}
            {expanded && notes && (
              <div className="mt-2 p-2 bg-light rounded-3" style={{ fontSize: '13px' }}>
                <FaInfoCircle className="text-muted me-1" size={12} />
                <span className="text-muted">Notes: {notes}</span>
              </div>
            )}
          </Col>

          {/* Actions */}
          <Col md={3} className="d-flex flex-column align-items-end justify-content-between">
            <div className="d-flex gap-2 mb-2 w-100 justify-content-end flex-wrap">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>View Details</Tooltip>}
              >
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleViewDetails}
                  className="rounded-circle p-1"
                  style={{ width: '32px', height: '32px' }}
                >
                  <FaEye size={12} />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Message {otherParty}</Tooltip>}
              >
                <Button
                  as={Link}
                  to={`/customer/chat?booking=${id}`}
                  variant="outline-info"
                  size="sm"
                  className="rounded-circle p-1"
                  style={{ width: '32px', height: '32px' }}
                >
                  <FaComment size={12} />
                </Button>
              </OverlayTrigger>

              {provider_phone && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Call Provider</Tooltip>}
                >
                  <Button
                    as="a"
                    href={`tel:${provider_phone}`}
                    variant="outline-success"
                    size="sm"
                    className="rounded-circle p-1"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <FaPhone size={12} />
                  </Button>
                </OverlayTrigger>
              )}

              {provider_phone && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>WhatsApp</Tooltip>}
                >
                  <Button
                    as="a"
                    href={`https://wa.me/${provider_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    variant="outline-success"
                    size="sm"
                    className="rounded-circle p-1"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <FaWhatsapp size={12} />
                  </Button>
                </OverlayTrigger>
              )}

              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="rounded-circle p-1"
                  style={{ width: '32px', height: '32px' }}
                >
                  <FaEllipsisV size={12} />
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Hide Details' : 'View Details'}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => window.print()}>
                    <FaPrint className="me-2" size={12} />
                    Print
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <FaShare className="me-2" size={12} />
                    Share
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            {/* Action Buttons */}
            {showActions && actions.length > 0 && (
              <div className="d-flex flex-wrap gap-2 justify-content-end mt-2">
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    size="sm"
                    onClick={() => handleAction(action.key)}
                    className="rounded-pill d-flex align-items-center gap-1"
                  >
                    <action.icon size={12} />
                    {action.label}
                  </Button>
                ))}
              </div>
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