// src/pages/customer/Reviews.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Image,
  ProgressBar,
  InputGroup,
  Nav,
  Spinner,
  Pagination,
  Rating
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaUser,
  FaCalendarAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaFlag,
  FaReply,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaChartBar,
  FaAward,
  FaMedal,
  FaCrown,
  FaEdit,
  FaTrash,
  FaCamera,
  FaImage,
  FaTimes
} from 'react-icons/fa';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import { customerAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Reviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImagesPreview, setReviewImagesPreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reviewToReport, setReviewToReport] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showHelpful, setShowHelpful] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const itemsPerPage = 10;

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate stats from reviews data
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
    const sum = reviewsData.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      const rating = Math.round(parseFloat(review.rating) || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    const verified = reviewsData.filter(r => r.booking_id || r.bookingId || r.is_verified).length;
    const withPhotos = reviewsData.filter(r => r.images && r.images.length > 0).length;
    const withResponse = reviewsData.filter(r => r.provider_response || r.admin_response || r.response_text).length;

    setStats({
      average: parseFloat(average.toFixed(1)),
      total: total,
      distribution: distribution,
      verified: verified,
      withPhotos: withPhotos,
      withResponse: withResponse
    });
  }, []);

  // Fetch reviews from real API
  const fetchReviews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        sort: sortBy,
        search: searchTerm || undefined
      };

      let response = null;
      
      if (typeof customerAPI.getReviews === 'function') {
        response = await customerAPI.getReviews(params);
      } else if (typeof customerAPI.getUserReviews === 'function') {
        response = await customerAPI.getUserReviews(params);
      } else {
        throw new Error('Reviews API methods not available');
      }

      const data = response?.data || response || {};
      const reviewsData = data.reviews || data.data || [];
      
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setTotalCount(data.total || reviewsData.length || 0);
      setTotalPages(Math.ceil((data.total || reviewsData.length || 0) / itemsPerPage));
      
      // Calculate stats from the reviews we just fetched
      calculateStatsFromReviews(reviewsData);
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(error.message || 'Failed to load reviews');
      setReviews([]);
      setTotalCount(0);
      setTotalPages(1);
      if (error.response?.status !== 401) {
        toast.error('Failed to load reviews');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, filter, sortBy, searchTerm, calculateStatsFromReviews]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchReviews(false);
    toast.success('Reviews updated');
  };

  // Polling functions for real-time updates
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        fetchReviews(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 30000); // Poll every 30 seconds
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
    fetchReviews(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchReviews(false);
    }
  }, [currentPage, filter, sortBy, searchTerm]);

  // Submit review with real API
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmitting(true);
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      const formData = new FormData();
      formData.append('rating', reviewRating);
      formData.append('comment', reviewComment);
      reviewImages.forEach(image => {
        formData.append('images', image);
      });

      const serviceId = selectedService?.id || selectedService?._id;
      
      if (typeof customerAPI.addReview === 'function') {
        await customerAPI.addReview(serviceId, formData);
      } else if (typeof customerAPI.createReview === 'function') {
        await customerAPI.createReview(serviceId, formData);
      } else {
        throw new Error('Add review API methods not available');
      }
      
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      resetReviewForm();
      await fetchReviews(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review with real API
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    const reviewId = reviewToDelete.id || reviewToDelete._id;
    if (!reviewId) return;

    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      if (typeof customerAPI.deleteReview === 'function') {
        await customerAPI.deleteReview(reviewId);
      } else if (typeof customerAPI.removeReview === 'function') {
        await customerAPI.removeReview(reviewId);
      } else {
        throw new Error('Delete review API methods not available');
      }
      
      toast.success('Review deleted successfully');
      setShowDeleteModal(false);
      setReviewToDelete(null);
      await fetchReviews(false);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.message || 'Failed to delete review');
    }
  };

  // Report review with real API
  const handleReportReview = async () => {
    if (!reviewToReport || !reportReason) {
      toast.error('Please provide a reason');
      return;
    }

    const reviewId = reviewToReport.id || reviewToReport._id;
    if (!reviewId) return;

    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      const payload = { reason: reportReason };
      
      if (typeof customerAPI.reportReview === 'function') {
        await customerAPI.reportReview(reviewId, payload);
      } else if (typeof customerAPI.reportReviewContent === 'function') {
        await customerAPI.reportReviewContent(reviewId, payload);
      } else {
        throw new Error('Report review API methods not available');
      }
      
      toast.success('Review reported successfully');
      setShowReportModal(false);
      setReviewToReport(null);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error(error.message || 'Failed to report review');
    }
  };

  // Mark helpful with real API
  const handleHelpful = async (reviewId) => {
    if (!reviewId) return;
    
    try {
      if (!customerAPI) {
        throw new Error('API service not available');
      }

      if (typeof customerAPI.markReviewHelpful === 'function') {
        await customerAPI.markReviewHelpful(reviewId);
      } else if (typeof customerAPI.helpfulReview === 'function') {
        await customerAPI.helpfulReview(reviewId);
      } else {
        throw new Error('Mark helpful API methods not available');
      }
      
      setShowHelpful(prev => ({ ...prev, [reviewId]: true }));
      toast.success('Thanks for your feedback!');
      await fetchReviews(false);
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error(error.message || 'Failed to mark review as helpful');
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    if (reviewImages.length + validImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setReviewImages([...reviewImages, ...validImages]);
    const newPreviews = validImages.map(file => URL.createObjectURL(file));
    setReviewImagesPreview([...reviewImagesPreview, ...newPreviews]);
  };

  const removeImage = (index) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(reviewImagesPreview[index]);
    setReviewImagesPreview(prev => prev.filter((_, i) => i !== index));
  };

  const resetReviewForm = () => {
    setReviewRating(0);
    setReviewComment('');
    setReviewImages([]);
    reviewImagesPreview.forEach(url => URL.revokeObjectURL(url));
    setReviewImagesPreview([]);
    setSelectedService(null);
  };

  // Render stars
  const renderStars = (rating, size = 16, showNumber = false) => {
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
        {showNumber && <span className="ms-2 fw-bold">{numRating.toFixed(1)}</span>}
      </div>
    );
  };

  // Get rating color
  const getRatingColor = (rating) => {
    const numRating = parseFloat(rating) || 0;
    if (numRating >= 4) return 'success';
    if (numRating >= 3) return 'warning';
    return 'danger';
  };

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <FaExclamationCircle className="me-2" />
            {error}
            <Button variant="outline-danger" size="sm" onClick={() => fetchReviews(false)} className="ms-3">
              Retry
            </Button>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">My Reviews</h2>
            <p className="text-muted mb-0">Manage and track your reviews across all services</p>
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
                  <div className="d-flex justify-content-center gap-3">
                    <div className="text-center">
                      <FaCheckCircle className="text-success mb-1" />
                      <div className="fw-bold">{stats.verified}</div>
                      <small className="text-muted">Verified</small>
                    </div>
                    <div className="text-center">
                      <FaCamera className="text-primary mb-1" />
                      <div className="fw-bold">{stats.withPhotos}</div>
                      <small className="text-muted">With Photos</small>
                    </div>
                    <div className="text-center">
                      <FaReply className="text-info mb-1" />
                      <div className="fw-bold">{stats.withResponse}</div>
                      <small className="text-muted">Replied</small>
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
                    <div key={star} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">{star}</span>
                          <FaStar size={12} color="#fbbf24" />
                        </div>
                        <div className="flex-grow-1 mx-2">
                          <ProgressBar
                            now={percentage}
                            variant={getRatingColor(star)}
                            style={{ height: '6px', borderRadius: '3px' }}
                          />
                        </div>
                        <small className="text-muted">{count}</small>
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
                className="text-muted"
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
                      placeholder="Search by service..."
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
                Showing {reviews.length} of {totalCount || stats.total} reviews
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
              <p className="text-muted small">Your reviews will appear here after you complete services</p>
              <Link to="/services">
                <Button variant="primary" size="sm">Browse Services</Button>
              </Link>
            </Card.Body>
          </Card>
        ) : (
          reviews.map((review) => {
            const reviewId = review.id || review._id;
            const rating = parseFloat(review.rating) || 0;
            const comment = getField(review, ['comment', 'content', 'review_text', 'text'], '');
            const providerName = getField(review, ['provider_name', 'provider.name', 'providerName', 'provider'], 'Provider');
            const serviceName = getField(review, ['service_name', 'service.name', 'serviceTitle', 'service.title'], '');
            const images = review.images || [];
            const createdAt = review.created_at || review.createdAt || review.date || new Date().toISOString();
            const helpfulCount = parseInt(review.helpful_count) || parseInt(review.helpful) || 0;
            const isVerified = review.booking_id || review.bookingId || review.is_verified;
            const isEdited = review.is_edited || review.updated_at !== review.created_at;
            const canEdit = review.can_edit || false;
            const canDelete = review.can_delete || false;
            const providerResponse = getField(review, ['provider_response', 'admin_response', 'response_text'], '');
            const responseDate = getField(review, ['response_date', 'responded_at', 'updated_at'], '');

            return (
              <Card key={reviewId} className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <Card.Body className="p-4">
                  <div className="d-flex gap-3">
                    {/* Provider Avatar */}
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ 
                        width: '56px', 
                        height: '56px', 
                        background: `linear-gradient(135deg, ${getRatingColor(rating)} 0%, ${getRatingColor(rating)} 100%)`,
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}
                    >
                      {providerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-grow-1">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                        <div>
                          <h6 className="fw-bold mb-1">{providerName}</h6>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            {renderStars(rating, 14)}
                            {isVerified && (
                              <Badge bg="success" className="d-flex align-items-center gap-1 rounded-pill">
                                <FaCheckCircle size={10} />
                                Verified Purchase
                              </Badge>
                            )}
                            {isEdited && (
                              <Badge bg="secondary" className="rounded-pill">Edited</Badge>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-3 text-muted small mb-3">
                            <span className="d-flex align-items-center gap-1">
                              <FaCalendarAlt size={12} />
                              {format(new Date(createdAt), 'MMM dd, yyyy')}
                            </span>
                            <span className="d-flex align-items-center gap-1">
                              <FaClock size={12} />
                              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                            </span>
                            {serviceName && (
                              <span className="d-flex align-items-center gap-1">
                                <FaUser size={12} />
                                {serviceName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="mb-3" style={{ lineHeight: '1.6' }}>{comment}</p>

                      {/* Review Images */}
                      {images && images.length > 0 && (
                        <div className="d-flex gap-2 mb-3 flex-wrap">
                          {images.map((img, idx) => (
                            <div key={idx} className="position-relative">
                              <img
                                src={img}
                                alt={`Review ${idx + 1}`}
                                style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => window.open(img, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="d-flex gap-3 mb-3">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted p-0 d-flex align-items-center gap-1"
                          onClick={() => handleHelpful(reviewId)}
                          disabled={showHelpful[reviewId]}
                        >
                          <FaThumbsUp size={12} />
                          Helpful ({helpfulCount})
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted p-0 d-flex align-items-center gap-1"
                          onClick={() => {
                            setReviewToReport(review);
                            setShowReportModal(true);
                          }}
                        >
                          <FaFlag size={12} />
                          Report
                        </Button>
                        {canEdit && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary p-0 d-flex align-items-center gap-1"
                            onClick={() => {
                              setSelectedService(review);
                              setReviewRating(rating);
                              setReviewComment(comment);
                              setShowReviewModal(true);
                            }}
                          >
                            <FaEdit size={12} />
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0 d-flex align-items-center gap-1"
                            onClick={() => {
                              setReviewToDelete(review);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash size={12} />
                            Delete
                          </Button>
                        )}
                      </div>

                      {/* Provider Response */}
                      {providerResponse && (
                        <div className="mt-3 p-3" style={{ backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <FaReply size={12} className="text-primary" />
                            <strong className="small">Provider Response:</strong>
                          </div>
                          <p className="mb-1 small">{providerResponse}</p>
                          {responseDate && (
                            <small className="text-muted">
                              {formatDistanceToNow(new Date(responseDate), { addSuffix: true })}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })
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

      {/* Write Review Modal */}
      <Modal show={showReviewModal} onHide={() => {
        setShowReviewModal(false);
        resetReviewForm();
      }} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaStar className="text-warning me-2" />
            {selectedService ? 'Edit Review' : 'Write a Review'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedService && (
            <div className="mb-4 d-flex align-items-center gap-3">
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                {getField(selectedService, ['provider_name', 'provider.name', 'providerName', 'provider'], 'P').charAt(0).toUpperCase()}
              </div>
              <div>
                <h6 className="mb-0">{getField(selectedService, ['provider_name', 'provider.name', 'providerName', 'provider'], 'Provider')}</h6>
                <small className="text-muted">{getField(selectedService, ['service_name', 'service.name', 'serviceTitle', 'service.title'], 'Service')}</small>
              </div>
            </div>
          )}

          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Your Rating *</Form.Label>
              <div className="d-flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar
                    key={star}
                    size={32}
                    color={star <= reviewRating ? '#fbbf24' : '#e2e8f0'}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => setReviewRating(star)}
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Your Review *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this provider..."
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Add Photos (Optional)</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {reviewImagesPreview.map((preview, idx) => (
                  <div key={idx} className="position-relative">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      style={{ width: '100px', height: '100px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 rounded-circle p-0"
                      style={{ width: '24px', height: '24px', transform: 'translate(50%, -50%)' }}
                      onClick={() => removeImage(idx)}
                    >
                      <FaTimes size={12} />
                    </Button>
                  </div>
                ))}
                {reviewImagesPreview.length < 5 && (
                  <label
                    className="d-flex flex-column align-items-center justify-content-center border rounded-3"
                    style={{ width: '100px', height: '100px', cursor: 'pointer', background: '#f8fafc' }}
                  >
                    <FaCamera size={24} className="text-muted" />
                    <small className="text-muted mt-2">Upload</small>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              <Form.Text className="text-muted">
                Upload up to 5 images. JPG, PNG up to 5MB each.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => {
            setShowReviewModal(false);
            resetReviewForm();
          }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitReview}
            disabled={submitting || reviewRating === 0 || !reviewComment.trim()}
          >
            {submitting ? 'Submitting...' : (selectedService ? 'Update Review' : 'Submit Review')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaTrash className="me-2" />
            Delete Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationCircle className="me-2" />
            Are you sure you want to delete this review? This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteReview}>
            Delete Review
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Report Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaFlag className="me-2" />
            Report Review
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Reason for reporting</Form.Label>
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
                <Form.Label className="fw-semibold">Additional details</Form.Label>
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

export default Reviews;