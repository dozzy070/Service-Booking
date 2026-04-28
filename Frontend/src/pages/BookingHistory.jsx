// src/pages/BookingHistory.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaDownload, FaFilePdf, FaFileExcel, FaCalendar, FaFilter } from 'react-icons/fa';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([
    { id: 1234, service: 'House Cleaning', provider: 'Sarah Johnson', date: '2024-03-15', time: '10:00 AM', amount: 150, status: 'completed', payment: 'paid' },
    { id: 1235, service: 'Plumbing Repair', provider: 'Mike Smith', date: '2024-03-10', time: '2:30 PM', amount: 120, status: 'completed', payment: 'paid' },
    { id: 1236, service: 'Electrical Work', provider: 'John Davis', date: '2024-03-05', time: '11:00 AM', amount: 180, status: 'completed', payment: 'paid' },
    { id: 1237, service: 'Gardening', provider: 'Emma Wilson', date: '2024-02-28', time: '9:00 AM', amount: 90, status: 'cancelled', payment: 'refunded' },
    { id: 1238, service: 'Painting', provider: 'David Brown', date: '2024-02-20', time: '1:00 PM', amount: 250, status: 'completed', payment: 'paid' },
    { id: 1239, service: 'Moving Services', provider: 'Robert Johnson', date: '2024-02-15', time: '8:00 AM', amount: 300, status: 'completed', payment: 'paid' },
    { id: 1240, service: 'AC Repair', provider: 'Michael Chen', date: '2024-02-10', time: '3:00 PM', amount: 160, status: 'completed', payment: 'paid' },
    { id: 1241, service: 'Carpentry', provider: 'James Wilson', date: '2024-02-05', time: '10:30 AM', amount: 200, status: 'cancelled', payment: 'refunded' }
  ]);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'success', text: 'Completed' },
      cancelled: { bg: 'danger', text: 'Cancelled' },
      pending: { bg: 'warning', text: 'Pending' }
    };
    return badges[status] || badges.pending;
  };

  const getPaymentBadge = (payment) => {
    const badges = {
      paid: { bg: 'success', text: 'Paid' },
      refunded: { bg: 'info', text: 'Refunded' },
      pending: { bg: 'warning', text: 'Pending' }
    };
    return badges[payment] || badges.pending;
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter !== 'all' && booking.status !== filter) return false;
    if (search && !booking.service.toLowerCase().includes(search.toLowerCase()) && 
        !booking.provider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSpent = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Booking History</h2>
          <p className="text-muted">View and manage all your past bookings</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="fw-bold text-primary mb-2">{totalBookings}</h3>
              <p className="text-muted mb-0">Total Bookings</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="fw-bold text-success mb-2">{completedBookings}</h3>
              <p className="text-muted mb-0">Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="fw-bold text-danger mb-2">{cancelledBookings}</h3>
              <p className="text-muted mb-0">Cancelled</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h3 className="fw-bold text-info mb-2">${totalSpent}</h3>
              <p className="text-muted mb-0">Total Spent</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by service or provider..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Bookings</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaCalendar />
                </InputGroup.Text>
                <Form.Control type="month" />
              </InputGroup>
            </Col>
            <Col md={2}>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm">
                  <FaFilePdf className="me-1" /> PDF
                </Button>
                <Button variant="outline-success" size="sm">
                  <FaFileExcel className="me-1" /> Excel
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bookings Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Service</th>
                <th>Provider</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>#{booking.id}</td>
                  <td>{booking.service}</td>
                  <td>{booking.provider}</td>
                  <td>{booking.date} {booking.time}</td>
                  <td>${booking.amount}</td>
                  <td>
                    <Badge bg={getStatusBadge(booking.status).bg}>
                      {getStatusBadge(booking.status).text}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={getPaymentBadge(booking.payment).bg}>
                      {getPaymentBadge(booking.payment).text}
                    </Badge>
                  </td>
                  <td>
                    <Button size="sm" variant="link" className="text-primary">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredBookings.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No bookings found</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BookingHistory;