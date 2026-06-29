// src/pages/Services.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Pagination,
  Toast,
  ToastContainer,
  Badge
} from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaStar,
  FaMapMarkerAlt,
  FaRedo
} from 'react-icons/fa';
import api from '../api';
import { getServiceImage, handleImageError } from '../utils/imageUtils';

const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return `$${parseFloat(amount).toFixed(2)}`;
};

// ✅ Helper to safely get category name
const getCategoryName = (category) => {
  if (!category) return 'Uncategorized';
  if (typeof category === 'string') return category;
  if (typeof category === 'object') {
    return category.name || 'Uncategorized';
  }
  return 'Uncategorized';
};

// ✅ Helper to safely get provider name
const getProviderName = (provider) => {
  if (!provider) return 'Unknown Provider';
  if (typeof provider === 'string') return provider;
  if (typeof provider === 'object') {
    return provider.name || provider.provider_name || 'Unknown Provider';
  }
  return 'Unknown Provider';
};

// ✅ Helper to safely get location
const getLocation = (service) => {
  if (!service) return '';
  return service.location || service.address || service.city || '';
};

const ServiceCard = ({ service }) => {
  const categoryName = getCategoryName(service.category);
  const providerName = getProviderName(service.provider);
  const location = getLocation(service);
  const rating = service.avgRating || service.rating || 0;
  const reviewCount = service.reviewCount || service.review_count || 0;
  const price = service.price || 0;
  const title = service.title || 'Untitled Service';
  const description = service.description || '';
  const images = service.images || [];
  const serviceId = service.id;

  return (
    <Card className="h-100 border-0 shadow-sm service-card">
      <Card.Img
        variant="top"
        src={images[0] || getServiceImage(title, serviceId, 300, 200)}
        style={{ height: '200px', objectFit: 'cover' }}
        onError={(e) => handleImageError(e, getServiceImage(title, serviceId, 300, 200))}
      />
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title className="h6 mb-0">{title}</Card.Title>
          <Badge bg="primary" pill>{categoryName}</Badge>
        </div>
        
        <p className="text-muted small mb-2">by {providerName}</p>
        
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

        {location && (
          <div className="d-flex align-items-center text-muted small mb-2">
            <FaMapMarkerAlt className="me-1" size={10} />
            {location}
          </div>
        )}

        <p className="text-muted small mb-3">
          {description?.substring(0, 80)}...
        </p>

        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold text-primary">
            {formatCurrency(price)}
          </span>
          <Button
            as={Link}
            to={`/services/${serviceId}`}
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

const Services = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest'
  });

  const refreshIntervalRef = useRef(null);
  // ✅ Ref for the services section to scroll to
  const servicesSectionRef = useRef(null);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // ✅ Function to scroll to services section
  const scrollToServices = useCallback(() => {
    // Small delay to ensure content is rendered
    setTimeout(() => {
      if (servicesSectionRef.current) {
        const offset = 80; // Adjust for navbar height
        const elementPosition = servicesSectionRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback: scroll to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  // ✅ FIXED: Fetch services with proper error handling
  const fetchServices = async () => {
    try {
      setError(null);
      const params = {
        search: filters.search || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sort: filters.sort || undefined,
        page: currentPage,
        limit: itemsPerPage
      };
      
      const response = await api.get('/services', { params });
      const data = response.data || {};
      const servicesList = data.services || [];
      
      setServices(servicesList);
      setTotalCount(data.pagination?.totalItems || data.total || 0);
    } catch (err) {
      console.error('Failed to fetch services:', err);
      setError('Could not load services. Please try again later.');
      setServices([]);
      setTotalCount(0);
      showToast('Failed to load services', 'danger');
    }
  };

  // Fetch all data in parallel
  const fetchAllData = async () => {
    await Promise.all([fetchCategories(), fetchServices()]);
    // ✅ Scroll to services after data loads
    scrollToServices();
  };

  // Manual refresh (no spinner)
  const handleRefresh = () => {
    fetchAllData();
    showToast('Refreshing services...', 'info');
  };

  // Auto-refresh every 30 seconds (no spinner)
  useEffect(() => {
    fetchAllData();
    refreshIntervalRef.current = setInterval(fetchAllData, 30000);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  // ✅ Refetch when filters or pagination change and scroll to services
  useEffect(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.sort) params.sort = filters.sort;
    setSearchParams(params);
    
    fetchServices().then(() => {
      scrollToServices();
    });
  }, [filters, currentPage]);

  // ✅ Scroll to services when page loads
  useEffect(() => {
    // Initial scroll to services section after a small delay
    const initialScroll = setTimeout(() => {
      scrollToServices();
    }, 300);
    return () => clearTimeout(initialScroll);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get('search');
    setFilters(prev => ({ ...prev, search }));
    // ✅ Scroll to services after search
    setTimeout(scrollToServices, 200);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest'
    });
    setCurrentPage(1);
    // ✅ Scroll to services after clearing filters
    setTimeout(scrollToServices, 200);
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= Math.min(5, totalPages); i++) {
    let pageNum;
    if (totalPages <= 5) pageNum = i;
    else if (currentPage <= 3) pageNum = i;
    else if (currentPage >= totalPages - 2) pageNum = totalPages - 5 + i;
    else pageNum = currentPage - 3 + i;
    if (pageNum >= 1 && pageNum <= totalPages) pageNumbers.push(pageNum);
  }

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toastMessage.show} onClose={() => setToastMessage({ show: false, message: '', type: '' })} delay={3000} autohide bg={toastMessage.type}>
          <Toast.Header closeButton={false}>
            <strong className="me-auto">{toastMessage.type === 'success' ? 'Success' : toastMessage.type === 'danger' ? 'Error' : 'Info'}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      <Row>
        {/* Sidebar Filters */}
        <Col lg={3} className={`mb-4 ${!showFilters && 'd-none d-lg-block'}`}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <FaFilter className="me-2 text-primary" /> Filters
              </h5>
              <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
                <FaRedo />
              </Button>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id || cat.slug || cat.name} value={cat.slug || cat.id || cat.name}>
                      {cat.name || cat}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Price Range</Form.Label>
                <Row>
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      name="minPrice"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      name="maxPrice"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                    />
                  </Col>
                </Row>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Sort By</Form.Label>
                <Form.Select
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </Form.Select>
              </Form.Group>

              <Button variant="primary" className="w-100 mb-2" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* ✅ Added ref and id for scrolling */}
          <div ref={servicesSectionRef} id="services-section">
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Row>
                    <Col>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="text"
                          name="search"
                          placeholder="Search services..."
                          defaultValue={filters.search}
                        />
                        <Button type="submit" variant="primary">
                          <FaSearch />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          className="d-lg-none"
                          onClick={() => setShowFilters(!showFilters)}
                        >
                          <FaFilter />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
              <p className="text-muted mb-0">
                Found <strong>{totalCount}</strong> services
              </p>
              {filters.category && (
                <Badge bg="info" pill className="d-flex align-items-center gap-2">
                  Category: {categories.find(c => (c.slug || c.id) === filters.category)?.name || filters.category}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-white p-0 ms-1" 
                    onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
                    style={{ textDecoration: 'none' }}
                  >
                    ✕
                  </Button>
                </Badge>
              )}
            </div>

            {services.length > 0 ? (
              <>
                <Row xs={2} md={2} lg={3} className="g-4">
                  {services.map(service => (
                    <Col key={service.id}>
                      <ServiceCard service={service} />
                    </Col>
                  ))}
                </Row>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.Prev
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                      />
                      {pageNumbers.map(pageNum => (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-sm text-center py-5">
                <Card.Body>
                  <h5>No services found</h5>
                  <p className="text-muted">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button variant="primary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </Card.Body>
              </Card>
            )}
          </div>
        </Col>
      </Row>

      <style jsx="true">{`
        .service-card {
          transition: all 0.3s ease;
          border-radius: 10px;
          overflow: hidden;
        }
        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </Container>
  );
};

export default Services;