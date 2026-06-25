// src/pages/Booking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  ListGroup,
  Modal
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaTag,
  FaShieldAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { getServiceImage, handleServiceImageError } from '../utils/imageUtils';

import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingDetails, setBookingDetails] = useState({
    notes: '',
    phone: user?.phone || ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/services/${id}/book` } });
      return;
    }
    fetchServiceDetails();
  }, [id, user, navigate]);

  useEffect(() => {
    if (service && selectedDate) {
      fetchAvailableSlots();
    }
  }, [service, selectedDate]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/services/${id}`);
      setService(response.data);
    } catch (error) {
      console.error('Fetch service error:', error);
      toast.error('Failed to load service details');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get('/bookings/available-slots', {
        params: { service_id: id, date: dateStr }
      });
      setAvailableSlots(response.data.available || []);
    } catch (error) {
      console.error('Fetch slots error:', error);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }
    if (!bookingDetails.phone) {
      toast.error('Please provide your contact number');
      return;
    }

    try {
      setSubmitting(true);
      const bookingDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes));

      const response = await api.post('/bookings', {
        service_id: parseInt(id),
        booking_date: bookingDateTime.toISOString(),
        notes: bookingDetails.notes
      });

      setBookingId(response.data.id);
      setBookingComplete(true);
      setShowConfirmModal(false);
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Create booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (!service) {
    return (
      <Container className="py-5">
        <Alert variant="danger">Service not found</Alert>
      </Container>
    );
  }

  if (bookingComplete) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-5">
                <div className="text-success mb-4">
                  <FaCheckCircle size={80} />
                </div>
                <h3 className="mb-3">Booking Confirmed!</h3>
                <p className="text-muted mb-4">
                  Your booking has been successfully created. Booking ID: #{bookingId}
                </p>
                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => navigate(`/bookings/${bookingId}`)}>
                    View Booking Details
                  </Button>
                  <Button variant="link" onClick={() => navigate('/services')}>
                    Continue Browsing
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <h2 className="mb-4">Book Service</h2>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <img
                    src={service.images?.[0] || 'getServiceImage(null, service.title, 300, 200)'}
                    alt={service.title}
                    className="img-fluid rounded"
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'getServiceImage(null, service.title, 300, 200)'; }}
                  />
                </Col>
                <Col md={8}>
                  <h4>{service.title}</h4>
                  <p className="text-muted">{service.description}</p>
                  <Row>
                    <Col sm={6}>
                      <div className="d-flex align-items-center mb-2">
                        <FaUser className="text-muted me-2" />
                        <span>Provider: {service.provider_name || 'Service Provider'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaMapMarkerAlt className="text-muted me-2" />
                        <span>{service.location || 'Remote'}</span>
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="d-flex align-items-center mb-2">
                        <FaTag className="text-muted me-2" />
                        <span>Category: {service.category || 'General'}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaShieldAlt className="text-muted me-2" />
                        <span>Price: {formatCurrency(service.price)}</span>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Select Date & Time</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><FaCalendarAlt className="me-2" /> Select Date</Form.Label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={date => setSelectedDate(date)}
                      minDate={new Date()}
                      className="form-control"
                      dateFormat="MMMM d, yyyy"
                      placeholderText="Choose a date"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><FaClock className="me-2" /> Available Time Slots</Form.Label>
                    {availableSlots.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {availableSlots.map(slot => (
                          <Button
                            key={slot}
                            variant={selectedTime === slot ? 'primary' : 'outline-primary'}
                            onClick={() => setSelectedTime(slot)}
                            size="sm"
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="info" className="mb-0">
                        No available slots for this date. Please select another date.
                      </Alert>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Contact Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Name</Form.Label>
                    <Form.Control type="text" value={user?.name || ''} disabled readOnly />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={user?.email || ''} disabled readOnly />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={bookingDetails.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Additional Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={bookingDetails.notes}
                  onChange={handleInputChange}
                  placeholder="Any special requests or information for the provider..."
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0">Booking Summary</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span>Service Price:</span>
                  <span className="fw-bold">{formatCurrency(service.price)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0 border-top">
                  <span>Total:</span>
                  <span className="fw-bold text-primary">{formatCurrency(service.price)}</span>
                </ListGroup.Item>
              </ListGroup>

              {selectedDate && selectedTime && (
                <div className="bg-light p-3 rounded mb-3">
                  <h6 className="mb-2">Selected Slot:</h6>
                  <p className="mb-1">
                    <FaCalendarAlt className="me-2 text-muted" />
                    {formatDate(selectedDate)}
                  </p>
                  <p className="mb-0">
                    <FaClock className="me-2 text-muted" />
                    at {selectedTime}
                  </p>
                </div>
              )}

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!selectedTime || !bookingDetails.phone}
                >
                  Confirm Booking
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>

              <div className="text-center mt-3">
                <small className="text-muted">
                  <FaShieldAlt className="me-1" />
                  Your information is secure
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please review your booking details:</p>
          <ListGroup variant="flush">
            <ListGroup.Item><strong>Service:</strong> {service.title}</ListGroup.Item>
            <ListGroup.Item><strong>Date:</strong> {formatDate(selectedDate)} at {selectedTime}</ListGroup.Item>
            <ListGroup.Item><strong>Provider:</strong> {service.provider_name || 'Service Provider'}</ListGroup.Item>
            <ListGroup.Item><strong>Total Amount:</strong> {formatCurrency(service.price)}</ListGroup.Item>
          </ListGroup>
          <p className="mt-3 mb-0 text-muted small">
            By confirming, you agree to our terms of service and cancellation policy.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Review</Button>
          <Button variant="primary" onClick={handleBooking} disabled={submitting}>
            {submitting ? <><Spinner as="span" animation="border" size="sm" /> Processing...</> : 'Confirm & Book'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Booking;