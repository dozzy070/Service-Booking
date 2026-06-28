import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
  OverlayTrigger,
  Tooltip,
  Form
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTrash,
  FaShoppingCart,
  FaEye,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaCalendarAlt,
  FaTags
} from 'react-icons/fa';
import { getServiceImage, handleImageError } from '../../utils/imageUtils';
import { customerAPI } from '../../api/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterCategory, setFilterCategory] = useState('all');

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format compact currency
  const formatCompactNaira = (amount) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`;
    return formatNaira(amount);
  };

  // ✅ Fetch favorites from real API
  const fetchFavorites = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof customerAPI.getFavorites === 'function') {
        response = await customerAPI.getFavorites();
      } else if (typeof customerAPI.getFavoriteServices === 'function') {
        response = await customerAPI.getFavoriteServices();
      } else {
        throw new Error('Favorites API methods not available');
      }

      const data = response?.data || [];
      setFavorites(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError(error.message || 'Failed to load favorites');
      setFavorites([]);
      if (error.response?.status !== 401) {
        toast.error('Failed to load favorites');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ✅ Remove from favorites with real API
  const removeFromFavorites = async () => {
    if (!selectedService) return;
    const serviceId = selectedService.id || selectedService._id;
    if (!serviceId) return;

    setRemovingId(serviceId);
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      if (typeof customerAPI.toggleFavorite === 'function') {
        await customerAPI.toggleFavorite(serviceId);
      } else if (typeof customerAPI.removeFavorite === 'function') {
        await customerAPI.removeFavorite(serviceId);
      } else {
        throw new Error('Remove favorite API methods not available');
      }
      
      setFavorites(prev => prev.filter(s => (s.id || s._id) !== serviceId));
      toast.success('Removed from favorites');
      setShowRemoveModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error(error.message || 'Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  // ✅ Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchFavorites(false);
    toast.success('Favorites updated');
  };

  // ✅ Polling functions for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchFavorites(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000); // Poll every 30 seconds for real-time updates
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    isPolling.current = false;
  };

  // Initial data load
  useEffect(() => {
    fetchFavorites(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // ✅ Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Sort and filter favorites
  const getSortedAndFilteredFavorites = () => {
    let filtered = [...favorites];

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => {
        const category = getField(s, ['category', 'categoryName', 'category_name'], '');
        return category.toLowerCase() === filterCategory.toLowerCase();
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aPrice = parseFloat(a.price) || 0;
      const bPrice = parseFloat(b.price) || 0;
      const aRating = parseFloat(a.rating) || 0;
      const bRating = parseFloat(b.rating) || 0;
      
      switch (sortBy) {
        case 'price_asc':
          return aPrice - bPrice;
        case 'price_desc':
          return bPrice - aPrice;
        case 'rating_desc':
          return bRating - aRating;
        case 'date_desc':
        default:
          const aDate = a.created_at || a.createdAt || a.favorited_at || a.favoritedAt || 0;
          const bDate = b.created_at || b.createdAt || b.favorited_at || b.favoritedAt || 0;
          return new Date(bDate) - new Date(aDate);
      }
    });

    return filtered;
  };

  // Render stars
  const renderStars = (rating, size = 14) => {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="d-flex align-items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={i} size={size} color="#fbbf24" />
        ))}
        {hasHalfStar && <FaStarHalfAlt size={size} color="#fbbf24" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={i} size={size} color="#e2e8f0" />
        ))}
        <span className="ms-1 small fw-semibold">{numRating.toFixed(1)}</span>
      </div>
    );
  };

  // Get unique categories
  const categories = ['all', ...new Set(favorites.map(s => getField(s, ['category', 'categoryName', 'category_name'], '')).filter(Boolean))];

  const sortedFavorites = getSortedAndFilteredFavorites();

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <FaHeart className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchFavorites(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold d-flex align-items-center gap-2">
              <FaHeart className="text-danger" />
              My Favorite Services
            </h2>
            <p className="text-muted mb-0">
              {favorites.length} {favorites.length === 1 ? 'service' : 'services'} saved
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaHeart className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button as={Link} to="/services" variant="primary" className="d-flex align-items-center gap-2">
              Browse More Services
              <FaShoppingCart />
            </Button>
          </div>
        </div>

        {/* Sort and Filter Bar */}
        {favorites.length > 0 && (
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="small text-muted">Sort By</Form.Label>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant={sortBy === 'date_desc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setSortBy('date_desc')}
                      className="rounded-pill d-flex align-items-center gap-1"
                    >
                      <FaCalendarAlt size={12} />
                      Latest Added
                    </Button>
                    <Button
                      variant={sortBy === 'price_asc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setSortBy('price_asc')}
                      className="rounded-pill d-flex align-items-center gap-1"
                    >
                      Price: Low to High
                    </Button>
                    <Button
                      variant={sortBy === 'price_desc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setSortBy('price_desc')}
                      className="rounded-pill d-flex align-items-center gap-1"
                    >
                      Price: High to Low
                    </Button>
                    <Button
                      variant={sortBy === 'rating_desc' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setSortBy('rating_desc')}
                      className="rounded-pill d-flex align-items-center gap-1"
                    >
                      <FaStar size={12} />
                      Top Rated
                    </Button>
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted">Filter by Category</Form.Label>
                  <div className="d-flex gap-2 flex-wrap">
                    {categories.map(cat => (
                      <Button
                        key={cat}
                        variant={filterCategory === cat ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setFilterCategory(cat)}
                        className="rounded-pill"
                      >
                        {cat === 'all' ? 'All' : cat}
                      </Button>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '20px' }}>
            <Card.Body>
              <FaHeart size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No favorite services yet</h6>
              <p className="text-muted small mb-3">
                Start exploring services and save your favorites for quick access.
              </p>
              <Button as={Link} to="/services" variant="primary" size="sm">
                Browse Services
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
            <Row xs={1} md={2} lg={3} xl={4} className="g-4">
              {sortedFavorites.map((service) => {
                const serviceId = service.id || service._id;
                const title = getField(service, ['title', 'name', 'serviceName', 'service_name'], 'Untitled Service');
                const providerName = getField(service, ['provider_name', 'provider.name', 'providerName', 'provider'], 'Professional Service');
                const category = getField(service, ['category', 'categoryName', 'category_name'], 'Service');
                const location = getField(service, ['location', 'serviceLocation', 'service_location', 'address'], '');
                const price = parseFloat(service.price) || 0;
                const oldPrice = parseFloat(service.old_price) || 0;
                const rating = parseFloat(service.rating) || 0;
                const totalReviews = parseInt(service.total_reviews) || parseInt(service.reviews) || 0;
                const duration = service.duration || service.estimated_duration || '';
                const isFeatured = service.is_featured || service.featured || false;
                const image = getField(service, ['image', 'serviceImage', 'service_image', 'featured_image'], '');

                return (
                  <Col key={serviceId}>
                    <Card className="favorite-card h-100 border-0 shadow-sm">
                      {/* Image */}
                      <div className="card-image-wrapper">
                        <Card.Img
                          variant="top"
                          src={image || getServiceImage(title, serviceId, 400, 250)}
                          style={{ height: '200px', objectFit: 'cover' }}
                          onError={(e) => handleImageError(e, getServiceImage(title, serviceId, 400, 250))}
                        />
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Remove from favorites</Tooltip>}
                        >
                          <Button
                            variant="danger"
                            size="sm"
                            className="remove-favorite-btn"
                            onClick={() => {
                              setSelectedService(service);
                              setShowRemoveModal(true);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </OverlayTrigger>
                        {isFeatured && (
                          <Badge bg="warning" className="featured-badge">
                            <FaStar className="me-1" size={10} />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <Card.Body>
                        {/* Category */}
                        <div className="mb-2">
                          <Badge bg="light" text="dark" className="rounded-pill">
                            <FaTags size={10} className="me-1" />
                            {category}
                          </Badge>
                        </div>

                        {/* Title */}
                        <Card.Title className="fw-bold fs-6 mb-2">
                          <Link to={`/services/${serviceId}`} className="text-decoration-none text-dark">
                            {title}
                          </Link>
                        </Card.Title>

                        {/* Provider Info */}
                        <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
                          <FaUser size={12} />
                          <span>{providerName}</span>
                        </div>

                        {/* Location */}
                        {location && (
                          <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
                            <FaMapMarkerAlt size={12} />
                            <span>{location}</span>
                          </div>
                        )}

                        {/* Rating */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          {rating > 0 ? (
                            renderStars(rating)
                          ) : (
                            <span className="small text-muted">No reviews yet</span>
                          )}
                          {totalReviews > 0 && (
                            <small className="text-muted">({totalReviews})</small>
                          )}
                        </div>

                        {/* Price */}
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-bold text-primary fs-5">
                              {formatCompactNaira(price)}
                            </span>
                            {oldPrice > 0 && (
                              <span className="text-muted text-decoration-line-through ms-2 small">
                                {formatCompactNaira(oldPrice)}
                              </span>
                            )}
                          </div>
                          {duration && (
                            <small className="text-muted d-flex align-items-center gap-1">
                              <FaClock size={10} />
                              {duration}
                            </small>
                          )}
                        </div>
                      </Card.Body>

                      <Card.Footer className="bg-white border-0 pb-3">
                        <div className="d-flex gap-2">
                          <Button
                            as={Link}
                            to={`/services/${serviceId}`}
                            variant="outline-primary"
                            size="sm"
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                          >
                            <FaEye size={12} />
                            View Details
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            onClick={() => navigate(`/checkout?service=${serviceId}`)}
                          >
                            <FaShoppingCart size={12} />
                            Book Now
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* Empty state after filter */}
            {sortedFavorites.length === 0 && (
              <div className="text-center py-5">
                <FaFilter size={48} className="text-muted mb-3 opacity-50" />
                <h6 className="text-muted">No matching services</h6>
                <p className="text-muted small">Try changing your filter or sort options</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setFilterCategory('all');
                    setSortBy('date_desc');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Remove Confirmation Modal */}
      <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaHeart className="me-2" />
            Remove from Favorites
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="warning" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaTrash className="me-2" />
            Are you sure you want to remove "{selectedService ? getField(selectedService, ['title', 'name', 'serviceName', 'service_name'], 'this service') : ''}" from your favorites?
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowRemoveModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={removeFromFavorites}
            disabled={removingId === (selectedService?.id || selectedService?._id)}
          >
            {removingId === (selectedService?.id || selectedService?._id) ? 'Removing...' : 'Remove'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx="true">{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }

        .favorite-card {
          border-radius: 20px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .favorite-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
        }

        .card-image-wrapper {
          position: relative;
          overflow: hidden;
        }

        .remove-favorite-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 1;
        }

        .favorite-card:hover .remove-favorite-btn {
          opacity: 1;
        }

        .featured-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11px;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .remove-favorite-btn {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Favorites;