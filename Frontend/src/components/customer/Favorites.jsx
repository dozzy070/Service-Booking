import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip
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
  const [removingId, setRemovingId] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterCategory, setFilterCategory] = useState('all');

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

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const response = await customerAPI.getFavorites();
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove from favorites
  const removeFromFavorites = async () => {
    if (!selectedService) return;

    setRemovingId(selectedService.id);
    try {
      await customerAPI.toggleFavorite(selectedService.id);
      setFavorites(prev => prev.filter(s => s.id !== selectedService.id));
      toast.success('Removed from favorites');
      setShowRemoveModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
    toast.success('Favorites updated');
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Sort and filter favorites
  const getSortedAndFilteredFavorites = () => {
    let filtered = [...favorites];

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.category === filterCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'date_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  // Render stars
  const renderStars = (rating, size = 14) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
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
        <span className="ms-1 small fw-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Get unique categories
  const categories = ['all', ...new Set(favorites.map(s => s.category).filter(Boolean))];

  const sortedFavorites = getSortedAndFilteredFavorites();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
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
              {sortedFavorites.map((service) => (
                <Col key={service.id}>
                  <Card className="favorite-card h-100 border-0 shadow-sm">
                    {/* Image */}
                    <div className="card-image-wrapper">
                      <Card.Img
                        variant="top"
                        src={getServiceImage(service.title, service.id, 400, 250)}
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => handleImageError(e, getServiceImage(service.title, service.id, 400, 250))}
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
                      {service.is_featured && (
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
                          {service.category || 'Service'}
                        </Badge>
                      </div>

                      {/* Title */}
                      <Card.Title className="fw-bold fs-6 mb-2">
                        <Link to={`/services/${service.id}`} className="text-decoration-none text-dark">
                          {service.title}
                        </Link>
                      </Card.Title>

                      {/* Provider Info */}
                      <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
                        <FaUser size={12} />
                        <span>{service.provider_name || 'Professional Service'}</span>
                      </div>

                      {/* Location */}
                      {service.location && (
                        <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
                          <FaMapMarkerAlt size={12} />
                          <span>{service.location}</span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        {service.rating ? (
                          renderStars(service.rating)
                        ) : (
                          <span className="small text-muted">No reviews yet</span>
                        )}
                        {service.total_reviews > 0 && (
                          <small className="text-muted">({service.total_reviews})</small>
                        )}
                      </div>

                      {/* Price */}
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold text-primary fs-5">
                            {formatCompactNaira(service.price)}
                          </span>
                          {service.old_price && (
                            <span className="text-muted text-decoration-line-through ms-2 small">
                              {formatCompactNaira(service.old_price)}
                            </span>
                          )}
                        </div>
                        {service.duration && (
                          <small className="text-muted d-flex align-items-center gap-1">
                            <FaClock size={10} />
                            {service.duration}
                          </small>
                        )}
                      </div>
                    </Card.Body>

                    <Card.Footer className="bg-white border-0 pb-3">
                      <div className="d-flex gap-2">
                        <Button
                          as={Link}
                          to={`/services/${service.id}`}
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
                          onClick={() => navigate(`/checkout?service=${service.id}`)}
                        >
                          <FaShoppingCart size={12} />
                          Book Now
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
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
            Are you sure you want to remove "{selectedService?.title}" from your favorites?
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowRemoveModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={removeFromFavorites}
            disabled={removingId === selectedService?.id}
          >
            {removingId === selectedService?.id ? 'Removing...' : 'Remove'}
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