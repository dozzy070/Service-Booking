// src/pages/Bookings.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Form,
  Nav,
  Spinner,
  Alert
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaEye,
  FaStar,
  FaComment
} from 'react-icons/fa';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getAvatarUrl, getServiceImage, handleImageError } from '../utils/imageUtils';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return `$${parseFloat(amount).toFixed(2)}`;
};

const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/bookings'); // adjust endpoint as needed
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setError(err.response?.data?.message || 'Failed to load bookings');
      toast.error('Could not load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'info',
      completed: 'success',
      cancelled: 'danger',
      rejected: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentBadge = (status) => {
    const variants = {
      paid: 'success',
      unpaid: 'warning',
      refunded: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab !== 'all' && booking.status !== activeTab) return false;
    if (searchTerm && !booking.service_title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !booking.provider_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">My Bookings</h2>
          <p className="text-muted">Manage and track all your service bookings</p>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <Form.Control
                type="text"
                placeholder="Search by service or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white">
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item><Nav.Link eventKey="all">All Bookings</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="pending">Pending</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="accepted">Accepted</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="completed">Completed</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="cancelled">Cancelled</Nav.Link></Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body>
          {filteredBookings.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={getServiceImage(booking.service_title, booking.id, 50, 50)}
                          alt={booking.service_title}
                          className="rounded me-2"
                          style={{ width: 40, height: 40, objectFit: 'cover' }}
                          onError={(e) => handleImageError(e, getServiceImage(booking.service_title, booking.id, 50, 50))}
                        />
                        <div>
                          <div className="fw-bold">{booking.service_title}</div>
                          <small className="text-muted">#{booking.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={getAvatarUrl(booking.provider_name, 30)}
                          alt={booking.provider_name}
                          className="rounded-circle me-2"
                          style={{ width: 30, height: 30 }}
                          onError={(e) => handleImageError(e, getAvatarUrl(booking.provider_name, 30))}
                        />
                        {booking.provider_name}
                      </div>
                    </td>
                    <td>
                      <FaCalendarAlt className="text-muted me-1" size={12} />
                      {formatDate(booking.booking_date)}
                    </td>
                    <td className="fw-bold text-primary">{formatCurrency(booking.total_amount)}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>{getPaymentBadge(booking.payment_status)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <FaEye />
                      </Button>
                      {booking.status === 'pending' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/review/${booking.id}`)}
                          >
                            <FaStar />
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => navigate(`/chat?booking=${booking.id}`)}
                          >
                            <FaComment />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <h5>No bookings found</h5>
              <p className="text-muted">You haven't made any bookings yet.</p>
              <Button as={Link} to="/services" variant="primary">Browse Services</Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Bookings;