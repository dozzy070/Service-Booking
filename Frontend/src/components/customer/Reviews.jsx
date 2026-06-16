// src/pages/customer/Reviews.jsx
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

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        sort: sortBy,
        search: searchTerm || undefined
      };
      const response = await customerAPI.getReviews(params);
      setReviews(response.data.reviews || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    }
  }, [currentPage, filter, sortBy, searchTerm]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await customerAPI.getReviewStats();
      setStats({
        average: response.data.average_rating || 0,
        total: response.data.total_reviews || 0,
        distribution: response.data.rating_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verified: response.data.verified_purchases || 0,
        withPhotos: response.data.with_photos || 0,
        withResponse: response.data.with_provider_response || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchReviews(), fetchStats()]);
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
  }, [currentPage, filter, sortBy, searchTerm]);

  // Submit review
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
      const formData = new FormData();
      formData.append('rating', reviewRating);
      formData.append('comment', reviewComment);
      reviewImages.forEach(image => {
        formData.append('images', image);
      });

      await customerAPI.addReview(selectedService.id, formData);
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      resetReviewForm();
      await loadAllData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await customerAPI.deleteReview(reviewToDelete.id);
      toast.success('Review deleted successfully');
      setShowDeleteModal(false);
      setReviewToDelete(null);
      await loadAllData();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  // Report review
  const handleReportReview = async () => {
    if (!reviewToReport || !reportReason) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await customerAPI.reportReview(reviewToReport.id, reportReason);
      toast.success('Review reported successfully');
      setShowReportModal(false);
      setReviewToReport(null);
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
      setShowHelpful(prev => ({ ...prev, [reviewId]: true }));
      toast.success('Thanks for your feedback!');
      await fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
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
              <p className="text-muted small">Your reviews will appear here after you complete services</p>
              <Link to="/services">
                <Button variant="primary" size="sm">Browse Services</Button>
              </Link>
            </Card.Body>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-4">
                <div className="d-flex gap-3">
                  {/* Provider Avatar */}
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ 
                      width: '56px', 
                      height: '56px', 
                      background: `linear-gradient(135deg, ${getRatingColor(review.rating)} 0%, ${getRatingColor(review.rating)} 100%)`,
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {review.provider_name?.charAt(0).toUpperCase() || 'P'}
                  </div>

                  <div className="flex-grow-1">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                      <div>
                        <h6 className="fw-bold mb-1">{review.provider_name}</h6>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {renderStars(review.rating, 14)}
                          <Badge bg="success" className="d-flex align-items-center gap-1 rounded-pill">
                            <FaCheckCircle size={10} />
                            Verified Purchase
                          </Badge>
                          {review.is_edited && (
                            <Badge bg="secondary" className="rounded-pill">Edited</Badge>
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
                          {review.service_name && (
                            <span className="d-flex align-items-center gap-1">
                              <FaUser size={12} />
                              {review.service_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <p className="mb-3" style={{ lineHeight: '1.6' }}>{review.comment}</p>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="d-flex gap-2 mb-3 flex-wrap">
                        {review.images.map((img, idx) => (
                          <div key={idx} className="position-relative">
                            <img
                              src={img}
                              alt={`Review ${idx + 1}`}
                              style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }}
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
                        onClick={() => handleHelpful(review.id)}
                        disabled={showHelpful[review.id]}
                      >
                        <FaThumbsUp size={12} />
                        Helpful ({review.helpful_count || 0})
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
                      {review.can_edit && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary p-0 d-flex align-items-center gap-1"
                          onClick={() => {
                            setSelectedService(review);
                            setReviewRating(review.rating);
                            setReviewComment(review.comment);
                            setShowReviewModal(true);
                          }}
                        >
                          <FaEdit size={12} />
                          Edit
                        </Button>
                      )}
                      {review.can_delete && (
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
                    {review.provider_response && (
                      <div className="mt-3 p-3" style={{ backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <FaReply size={12} className="text-primary" />
                          <strong className="small">Provider Response:</strong>
                        </div>
                        <p className="mb-1 small">{review.provider_response}</p>
                        <small className="text-muted">
                          {formatDistanceToNow(new Date(review.response_date), { addSuffix: true })}
                        </small>
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
                {selectedService.provider_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h6 className="mb-0">{selectedService.provider_name}</h6>
                <small className="text-muted">{selectedService.service_name}</small>
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