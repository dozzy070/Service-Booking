// src/components/customer/Review.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Modal,
  Alert,
  Spinner,
  Pagination,
  InputGroup,
  ProgressBar
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaReply,
  FaEdit,
  FaTrash,
  FaCamera,
  FaTimes,
  FaImage,
  FaChartBar,
  FaAward,
  FaUser,
  FaCheck,
  FaTimesCircle
} from 'react-icons/fa';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Review = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    verified: 0,
    withPhotos: 0,
    withResponse: 0
  });
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [helpfulVotes, setHelpfulVotes] = useState({});

  const itemsPerPage = 10;

  // Get reviewer name from review data
  const getReviewerName = (review) => {
    if (review.is_anonymous) return 'Anonymous';
    return review.reviewer_name || review.customer_name || 'Customer';
  };

  // Get reviewer avatar
  const getReviewerAvatar = (review) => {
    if (review.is_anonymous) return null;
    return review.reviewer_avatar || review.customer_avatar || null;
  };

  // Check if review has images
  const hasImages = (review) => {
    return review.images && Array.isArray(review.images) && review.images.length > 0;
  };

  // Check if review has provider response
  const hasProviderResponse = (review) => {
    return review.admin_response || review.provider_response || review.responded_by;
  };

  // Get provider response
  const getProviderResponse = (review) => {
    return review.admin_response || review.provider_response || null;
  };

  // Get response date
  const getResponseDate = (review) => {
    return review.responded_at || review.response_date || null;
  };

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // ✅ NEW: Calculate stats from reviews data (bypasses broken /stats endpoint)
  const calculateStatsFromReviews = useCallback((reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) {
      setStats({
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verified: 0,
        withPhotos: 0,
        withResponse: 0
      });
      return;
    }

    const total = reviewsData.length;
    const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      const rating = Math.round(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    const verified = reviewsData.filter(r => r.booking_id).length;
    const withPhotos = reviewsData.filter(r => r.images && r.images.length > 0).length;
    const withResponse = reviewsData.filter(r => r.admin_response || r.provider_response).length;

    setStats({
      average: parseFloat(average.toFixed(1)),
      total: total,
      distribution: distribution,
      verified: verified,
      withPhotos: withPhotos,
      withResponse: withResponse
    });
  }, []);

  // ✅ UPDATED: Fetch reviews AND calculate stats from them
  const fetchReviews = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        sort: sortBy,
        search: searchTerm || undefined,
        service_id: serviceId || undefined
      };
      const response = await customerAPI.getReviews(params);
      const data = response.data || response;
      const reviewsData = data.reviews || [];
      setReviews(reviewsData);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      
      // ✅ Calculate stats from the reviews we just fetched
      calculateStatsFromReviews(reviewsData);
      
      // ✅ Mark loading as complete if this is the main data fetch
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
      setReviews([]);
      setTotalPages(1);
      setLoading(false);
    }
  }, [currentPage, filter, sortBy, searchTerm, serviceId, calculateStatsFromReviews]);

  // ✅ REMOVED: Old fetchStats that called the broken /stats endpoint
  // The stats are now calculated from reviews data

  // Load all data - now only fetches reviews
  const loadAllData = async () => {
    setLoading(true);
    await fetchReviews();
    // Stats are calculated inside fetchReviews
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success('Reviews updated');
  };

  useEffect(() => {
    loadAllData();
  }, [currentPage, filter, sortBy, searchTerm, serviceId]);

  // Report review
  const handleReportReview = async () => {
    if (!selectedReview || !reportReason) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await customerAPI.reportReview(selectedReview.id, reportReason);
      toast.success('Review reported successfully');
      setShowReportModal(false);
      setSelectedReview(null);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
    }
  };

  // Mark helpful
  const handleHelpful = async (reviewId) => {
    try {
      await customerAPI.markReviewHelpful(reviewId);
      setHelpfulVotes(prev => ({ ...prev, [reviewId]: true }));
      toast.success('Thanks for your feedback!');
      await fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Failed to mark review as helpful');
    }
  };

  // Render stars
  const renderStars = (rating, size = 16, showNumber = false) => {
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
        {showNumber && <span className="ms-2 fw-bold">{rating.toFixed(1)}</span>}
      </div>
    );
  };

  // Get rating color
  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success" className="rounded-pill">Approved</Badge>;
      case 'pending':
        return <Badge bg="warning" className="rounded-pill">Pending</Badge>;
      case 'rejected':
        return <Badge bg="danger" className="rounded-pill">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading reviews...</p>
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
            <h2 className="mb-1 fw-bold">
              {serviceId ? 'Service Reviews' : 'Customer Reviews'}
            </h2>
            <p className="text-muted mb-0">
              {serviceId 
                ? 'What customers are saying about this service'
                : 'Read reviews from other customers'}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaStar className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <Row className="mb-4 g-4">
          <Col lg={4} md={12}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4 text-center">
                <div className="mb-3">
                  <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#fbbf24' }}>
                    {stats.average.toFixed(1)}
                    <span style={{ fontSize: '24px', color: '#94a3b8' }}>/5</span>
                  </div>
                  {renderStars(stats.average, 20)}
                  <p className="mb-0 mt-2 text-muted">Based on {stats.total} reviews</p>
                </div>
                <div className="mt-3 pt-2 border-top">
                  <div className="d-flex justify-content-center gap-4">
                    <div className="text-center">
                      <FaCheckCircle className="text-success mb-1" size={18} />
                      <div className="fw-bold">{stats.verified}</div>
                      <small className="text-muted">Verified</small>
                    </div>
                    <div className="text-center">
                      <FaCamera className="text-primary mb-1" size={18} />
                      <div className="fw-bold">{stats.withPhotos}</div>
                      <small className="text-muted">With Photos</small>
                    </div>
                    <div className="text-center">
                      <FaAward className="text-warning mb-1" size={18} />
                      <div className="fw-bold">{Math.round((stats.average / 5) * 100)}%</div>
                      <small className="text-muted">Satisfaction</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={12}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                <h6 className="fw-bold mb-3">Rating Distribution</h6>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.distribution[star] || 0;
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={star} className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="d-flex align-items-center gap-1" style={{ width: '50px' }}>
                          <span className="fw-semibold">{star}</span>
                          <FaStar size={12} color="#fbbf24" />
                        </div>
                        <div className="flex-grow-1">
                          <ProgressBar
                            now={percentage}
                            variant={getRatingColor(star)}
                            style={{ height: '8px', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ width: '45px' }}>
                          <small className="text-muted">{count}</small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters Bar */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Filter Reviews</h6>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-muted text-decoration-none"
              >
                <FaFilter className="me-1" size={12} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {showFilters && (
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className="small text-muted">Rating</Form.Label>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant={filter === 'all' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="rounded-pill"
                    >
                      All
                    </Button>
                    {[5, 4, 3, 2, 1].map(star => (
                      <Button
                        key={star}
                        variant={filter === star.toString() ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setFilter(star.toString())}
                        className="rounded-pill d-flex align-items-center gap-1"
                      >
                        {star} <FaStar size={10} />
                      </Button>
                    ))}
                  </div>
                </Col>

                <Col md={4}>
                  <Form.Label className="small text-muted">Sort By</Form.Label>
                  <Form.Select
                    size="sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                    <option value="helpful">Most Helpful</option>
                  </Form.Select>
                </Col>

                <Col md={4}>
                  <Form.Label className="small text-muted">Search</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text>
                      <FaSearch size={12} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search reviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </InputGroup>
                </Col>
              </Row>
            )}

            <div className="mt-3">
              <small className="text-muted">
                Showing {reviews.length} of {stats.total} reviews
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '20px' }}>
            <Card.Body>
              <FaStar size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No reviews yet</h6>
              <p className="text-muted small mb-0">
                {serviceId 
                  ? 'Be the first to review this service'
                  : 'No reviews available at the moment'}
              </p>
              {serviceId && (
                <Link to={`/services/${serviceId}`}>
                  <Button variant="primary" size="sm" className="mt-3">
                    Back to Service
                  </Button>
                </Link>
              )}
            </Card.Body>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-4">
                <div className="d-flex gap-3">
                  {/* Avatar */}
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      background: review.is_anonymous 
                        ? '#94a3b8' 
                        : `linear-gradient(135deg, ${getRatingColor(review.rating)} 0%, ${getRatingColor(review.rating)} 100%)`,
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {review.is_anonymous ? (
                      <FaUser size={24} />
                    ) : (
                      getReviewerName(review).charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-grow-1">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h6 className="fw-bold mb-0">
                            {getReviewerName(review)}
                          </h6>
                          {review.is_anonymous && (
                            <Badge bg="secondary" className="rounded-pill">Anonymous</Badge>
                          )}
                          {review.status && getStatusBadge(review.status)}
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {renderStars(review.rating, 14)}
                          {review.is_recommended && (
                            <Badge bg="success" className="d-flex align-items-center gap-1 rounded-pill">
                              <FaCheck size={10} />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3 text-muted small mb-3">
                          <span className="d-flex align-items-center gap-1">
                            <FaCalendarAlt size={12} />
                            {format(new Date(review.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <FaClock size={12} />
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                          {review.service_name && !serviceId && (
                            <Link to={`/services/${review.service_id}`} className="text-decoration-none">
                              <span className="d-flex align-items-center gap-1">
                                <FaUserCircle size={12} />
                                {review.service_name}
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Title */}
                    {review.title && (
                      <h6 className="mb-2 fw-semibold">{review.title}</h6>
                    )}

                    {/* Review Content */}
                    <p className="mb-3" style={{ lineHeight: '1.6' }}>{review.comment}</p>

                    {/* Pros & Cons */}
                    {(review.pros || review.cons) && (
                      <div className="mb-3">
                        {review.pros && (
                          <div className="mb-1">
                            <small className="text-success fw-semibold">✓ Pros:</small>
                            <small className="text-muted ms-1">{review.pros}</small>
                          </div>
                        )}
                        {review.cons && (
                          <div>
                            <small className="text-danger fw-semibold">✗ Cons:</small>
                            <small className="text-muted ms-1">{review.cons}</small>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Images */}
                    {hasImages(review) && (
                      <div className="d-flex gap-2 mb-3 flex-wrap">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Review ${idx + 1}`}
                            style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="d-flex gap-3">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-muted p-0 d-flex align-items-center gap-1 text-decoration-none"
                        onClick={() => handleHelpful(review.id)}
                        disabled={helpfulVotes[review.id]}
                      >
                        <FaThumbsUp size={12} />
                        Helpful ({review.helpful_count || 0})
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-muted p-0 d-flex align-items-center gap-1 text-decoration-none"
                        onClick={() => {
                          setSelectedReview(review);
                          setShowReportModal(true);
                        }}
                      >
                        <FaFlag size={12} />
                        Report
                      </Button>
                    </div>

                    {/* Provider Response */}
                    {hasProviderResponse(review) && (
                      <div className="mt-3 p-3" style={{ backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <FaReply size={12} className="text-primary" />
                          <strong className="small">Provider Response:</strong>
                        </div>
                        <p className="mb-1 small">{getProviderResponse(review)}</p>
                        {getResponseDate(review) && (
                          <small className="text-muted">
                            {formatDistanceToNow(new Date(getResponseDate(review)), { addSuffix: true })}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.Prev
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              />
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}
              <Pagination.Next
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </Container>

      {/* Report Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaFlag className="me-2" />
            Report Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="warning" className="mb-3" style={{ borderRadius: '12px' }}>
            <FaExclamationCircle className="me-2" />
            Please provide a reason for reporting this review.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Reason</Form.Label>
              <Form.Select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or misleading</option>
                <option value="offensive">Offensive language</option>
                <option value="fake">Fake review</option>
                <option value="irrelevant">Irrelevant content</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            {reportReason === 'other' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Additional Details</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Please provide more details..."
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReportReview}>
            Submit Report
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Review;