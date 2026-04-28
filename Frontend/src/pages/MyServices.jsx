// src/pages/MyServices.jsx
import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Form, InputGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaStar,
  FaCalendarCheck, FaDollarSign, FaSearch,
  FaFilter, FaSort, FaCheckCircle, FaTimesCircle,
  FaClock, FaExclamationCircle
} from 'react-icons/fa';
import { getServiceImage, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';

const MyServices = () => {
  const [services, setServices] = useState([
    {
      id: 1,
      title: 'Professional House Cleaning',
      category: 'Cleaning',
      price: 150,
      duration: 3,
      status: 'approved',
      bookings: 45,
      rating: 4.8,
      reviews: 23,
      createdAt: '2024-03-15',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
      featured: true
    },
    {
      id: 2,
      title: 'Expert Plumbing Services',
      category: 'Plumbing',
      price: 120,
      duration: 2,
      status: 'pending',
      bookings: 12,
      rating: 4.5,
      reviews: 8,
      createdAt: '2024-03-14',
      image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400',
      featured: false
    },
    {
      id: 3,
      title: 'Electrical Installations',
      category: 'Electrical',
      price: 180,
      duration: 2.5,
      status: 'approved',
      bookings: 34,
      rating: 4.9,
      reviews: 19,
      createdAt: '2024-03-12',
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
      featured: false
    },
    {
      id: 4,
      title: 'Gardening & Landscaping',
      category: 'Gardening',
      price: 90,
      duration: 2,
      status: 'rejected',
      bookings: 0,
      rating: 0,
      reviews: 0,
      createdAt: '2024-03-10',
      image: 'https://images.unsplash.com/photo-1598902108854-10e3ad1284df?w=400',
      featured: false,
      rejectionReason: 'Please provide more details about your services'
    },
    {
      id: 5,
      title: 'Professional Painting',
      category: 'Painting',
      price: 250,
      duration: 4,
      status: 'draft',
      bookings: 0,
      rating: 0,
      reviews: 0,
      createdAt: '2024-03-08',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400',
      featured: false
    },
    {
      id: 6,
      title: 'AC Repair & Service',
      category: 'Electrical',
      price: 160,
      duration: 1.5,
      status: 'approved',
      bookings: 28,
      rating: 4.7,
      reviews: 15,
      createdAt: '2024-03-07',
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
      featured: false
    },
    {
      id: 7,
      title: 'Carpentry Services',
      category: 'Other',
      price: 200,
      duration: 3,
      status: 'pending',
      bookings: 5,
      rating: 4.2,
      reviews: 3,
      createdAt: '2024-03-05',
      image: 'https://images.unsplash.com/photo-1617529497471-9218633199c0?w=400',
      featured: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const getStatusBadge = (status) => {
    const badges = {
      approved: { bg: 'success', text: 'Approved', icon: <FaCheckCircle /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock /> },
      rejected: { bg: 'danger', text: 'Rejected', icon: <FaTimesCircle /> },
      draft: { bg: 'secondary', text: 'Draft', icon: <FaExclamationCircle /> }
    };
    return badges[status] || badges.draft;
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setServices(services.filter(s => s.id !== id));
        toast.success('Service deleted successfully');
      } catch (error) {
        toast.error('Failed to delete service');
      }
    }
  };

  const handleDuplicate = async (service) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newService = {
        ...service,
        id: Math.max(...services.map(s => s.id), 0) + 1,
        title: `${service.title} (Copy)`,
        status: 'draft',
        bookings: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setServices([...services, newService]);
      toast.success('Service duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate service');
    }
  };

  const filteredServices = services
    .filter(service => {
      // Search filter
      const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesFilter = filter === 'all' || service.status === filter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sorting
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'bookings':
          return b.bookings - a.bookings;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  return (
    <Container fluid className="my-services-container py-4">
      <Row className="mb-4">
        <Col>
          <h2>My Services</h2>
          <p className="text-muted">Manage your service listings</p>
        </Col>
        <Col xs="auto">
          <Button 
            as={Link} 
            to="/provider/create-service" 
            variant="primary"
            size="lg"
          >
            <FaPlus className="me-2" /> Add New Service
          </Button>
        </Col>
      </Row>

      {/* Stats Summary */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-primary mb-2">{services.length}</h3>
              <p className="text-muted mb-0">Total Services</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-success mb-2">
                {services.filter(s => s.status === 'approved').length}
              </h3>
              <p className="text-muted mb-0">Active Services</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-warning mb-2">
                {services.filter(s => s.status === 'pending').length}
              </h3>
              <p className="text-muted mb-0">Pending Approval</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <h3 className="text-info mb-2">
                {services.reduce((sum, s) => sum + s.bookings, 0)}
              </h3>
              <p className="text-muted mb-0">Total Bookings</p>
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
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaFilter />
                </InputGroup.Text>
                <Form.Select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Services</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSort />
                </InputGroup.Text>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="bookings">Most Booked</option>
                  <option value="rating">Highest Rated</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setSortBy('newest');
                }}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <Row className="g-4">
          {filteredServices.map(service => {
            const status = getStatusBadge(service.status);
            
            return (
              <Col key={service.id} lg={4} md={6}>
                <Card className="service-card border-0 shadow-sm h-100">
                  <div className="position-relative">
                    <Card.Img
                      variant="top"
                      src={service.image}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => handleImageError(e, getServiceImage(service.title, service.id))}
                    />
                    <Badge
                      bg={status.bg}
                      className="position-absolute top-0 end-0 m-3 d-flex align-items-center gap-1"
                    >
                      {status.icon}
                      <span>{status.text}</span>
                    </Badge>
                    {service.featured && (
                      <Badge
                        bg="warning"
                        className="position-absolute top-0 start-0 m-3"
                      >
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h6 mb-0">{service.title}</Card.Title>
                      <h5 className="text-primary mb-0">${service.price}</h5>
                    </div>
                    
                    <p className="text-muted small mb-2">
                      {service.category} • {service.duration} hrs
                    </p>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <FaCalendarCheck className="text-muted me-1" size={12} />
                        <small className="text-muted">{service.bookings} bookings</small>
                      </div>
                      {service.rating > 0 && (
                        <div className="d-flex align-items-center">
                          <FaStar className="text-warning me-1" size={12} />
                          <small className="text-muted">
                            {service.rating} ({service.reviews})
                          </small>
                        </div>
                      )}
                    </div>

                    {service.status === 'rejected' && (
                      <div className="bg-danger bg-opacity-10 text-danger p-2 rounded mb-3 small">
                        <FaExclamationCircle className="me-2" />
                        {service.rejectionReason}
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/services/${service.id}`}
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                      >
                        <FaEye className="me-1" /> View
                      </Button>
                      <Button
                        as={Link}
                        to={`/provider/edit-service/${service.id}`}
                        variant="outline-success"
                        size="sm"
                        className="flex-fill"
                      >
                        <FaEdit className="me-1" /> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>

                    <div className="mt-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-muted"
                        onClick={() => handleDuplicate(service)}
                      >
                        Duplicate
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <FaExclamationCircle size={48} className="text-muted mb-3" />
            <h5>No services found</h5>
            <p className="text-muted">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first service'}
            </p>
            {!searchTerm && filter === 'all' && (
              <Button 
                as={Link} 
                to="/provider/create-service" 
                variant="primary"
              >
                <FaPlus className="me-2" /> Create Your First Service
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      <style jsx="true">{`
        .my-services-container {
          max-width: 1400px;
        }

        .service-card {
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }

        @media (max-width: 768px) {
          .my-services-container {
            padding: 10px;
          }
        }
      `}</style>
    </Container>
  );
};

export default MyServices;