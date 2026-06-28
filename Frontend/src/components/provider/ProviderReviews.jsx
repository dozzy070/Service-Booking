// src/components/provider/ProviderReviews.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  Pagination,
  Modal,
  Alert,
  Spinner,
  Dropdown
} from 'react-bootstrap';
import {
  Star,
  ThumbsUp,
  Flag,
  User,
  Calendar,
  Filter,
  Download,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Users,
  Edit2,
  Send,
  RefreshCw,
  ChevronDown,
  Eye,
  FileText,
  Search,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const itemsPerPage = 10;

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Calculate stats from reviews
  const calculateStatsFromReviews = useCallback((reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) {
      setStats({
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
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

    setStats({
      average: parseFloat(average.toFixed(1)),
      total: total,
      distribution: distribution
    });
  }, []);

  // Fetch reviews from real API
  const fetchReviews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined
      };

      let response = null;
      
      if (typeof providerAPI.getReviews === 'function') {
        response = await providerAPI.getReviews(params);
      } else if (typeof providerAPI.getProviderReviews === 'function') {
        response = await providerAPI.getProviderReviews(params);
      } else {
        throw new Error('Reviews API methods not available');
      }

      const data = response?.data || response || {};
      const reviewsData = data.reviews || data.data || [];
      
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setTotalPages(Math.ceil((data.total || reviewsData.length || 0) / itemsPerPage));
      setTotalReviews(data.total || reviewsData.length || 0);
      
      // Calculate stats from reviews
      calculateStatsFromReviews(reviewsData);
      
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(error.message || 'Failed to load reviews');
      setReviews([]);
      setTotalPages(1);
      setTotalReviews(0);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load reviews');
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, filter, sortBy, dateRange, calculateStatsFromReviews]);

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
  }, [currentPage, filter, sortBy, dateRange]);

  // Handle response submission with real API
  const handleSubmitResponse = async (reviewId) => {
    if (!reviewId) return;
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setSubmittingResponse(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = { response: responseText };

      if (typeof providerAPI.respondToReview === 'function') {
        await providerAPI.respondToReview(reviewId, payload);
      } else if (typeof providerAPI.addReviewResponse === 'function') {
        await providerAPI.addReviewResponse(reviewId, payload);
      } else {
        throw new Error('Review response API methods not available');
      }
      
      toast.success('Response posted successfully');
      setRespondingTo(null);
      setResponseText('');
      await fetchReviews(false);
    } catch (error) {
      console.error('Error posting response:', error);
      toast.error(error.message || 'Failed to post response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Handle report with real API
  const handleReport = async () => {
    if (!selectedReview) return;
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    const reviewId = selectedReview.id || selectedReview._id;
    if (!reviewId) return;

    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const payload = { reason: reportReason };

      if (typeof providerAPI.reportReview === 'function') {
        await providerAPI.reportReview(reviewId, payload);
      } else if (typeof providerAPI.reportReviewContent === 'function') {
        await providerAPI.reportReviewContent(reviewId, payload);
      } else {
        throw new Error('Report review API methods not available');
      }
      
      toast.success('Review reported successfully');
      setShowReportModal(false);
      setReportReason('');
      setSelectedReview(null);
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error(error.message || 'Failed to report review');
    }
  };

  // Handle helpful vote with real API
  const handleHelpful = async (reviewId) => {
    if (!reviewId) return;
    
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      if (typeof providerAPI.markReviewHelpful === 'function') {
        await providerAPI.markReviewHelpful(reviewId);
      } else if (typeof providerAPI.helpfulReview === 'function') {
        await providerAPI.helpfulReview(reviewId);
      } else {
        throw new Error('Mark helpful API methods not available');
      }
      
      toast.success('Thanks for your feedback!');
      await fetchReviews(false);
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error(error.message || 'Failed to mark as helpful');
    }
  };

  // Export reviews with real API
  const exportReviews = async () => {
    setExporting(true);
    try {
      if (!providerAPI) {
        throw new Error('API service not available');
      }

      const params = {
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined,
        format: 'csv'
      };

      let response = null;
      
      if (typeof providerAPI.exportReviews === 'function') {
        response = await providerAPI.exportReviews(params);
      } else if (typeof providerAPI.downloadReviews === 'function') {
        response = await providerAPI.downloadReviews(params);
      } else {
        throw new Error('Export reviews API methods not available');
      }
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Reviews exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export reviews');
    } finally {
      setExporting(false);
    }
  };

  // Render stars
  const renderStars = (rating, size = 16) => {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="d-flex align-items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} size={size} fill="#fbbf24" color="#fbbf24" />
        ))}
        {hasHalfStar && (
          <Star size={size} fill="#fbbf24" color="#fbbf24" style={{ opacity: 0.5 }} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i + fullStars + (hasHalfStar ? 1 : 0)} size={size} fill="#e2e8f0" color="#e2e8f0" />
        ))}
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

  // Calculate response rate
  const responseRate = totalReviews > 0 
    ? (reviews.filter(r => r.response || r.provider_response).length / totalReviews) * 100 
    : 0;

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
              <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
                <Star size={18} className="me-2" />
                {error}
                <Button variant="outline-danger" size="sm" onClick={() => fetchReviews(false)} className="ms-3">
                  Retry
                </Button>
              </Alert>
            </Alert>
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Customer Reviews</h2>
            <p className="text-muted mb-0">
              Manage and respond to customer feedback
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={exportReviews}
              disabled={exporting}
              className="d-flex align-items-center gap-2"
            >
              <Download size={18} />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <Row className="mb-4 g-4">
          <Col lg={4} md={12}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-4 text-center">
                <div className="mb-3">
                  <div style={{ fontSize: '56px', fontWeight: 'bold', color: '#fbbf24' }}>
                    {stats.average.toFixed(1)}
                    <span style={{ fontSize: '24px', color: '#94a3b8' }}>/5</span>
                  </div>
                  <div className="mb-2">
                    {renderStars(stats.average, 20)}
                  </div>
                  <p className="mb-0 text-muted">Based on {stats.total} reviews</p>
                </div>
                <div className="mt-3 pt-3 border-top">
                  <Badge bg={getRatingColor(stats.average)} className="px-3 py-2">
                    {stats.average >= 4 ? 'Excellent' : stats.average >= 3 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={12}>
            <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-4">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.distribution[star] || 0;
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  
                  return (
                    <div key={star} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold">{star}</span>
                          <Star size={14} fill="#fbbf24" color="#fbbf24" />
                          <span className="text-muted">{count} reviews</span>
                        </div>
                        <span className="text-muted">{percentage.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            backgroundColor: '#fbbf24', 
                            borderRadius: '4px',
                            width: `${percentage}%`,
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Additional Stats Cards */}
        <Row className="mb-4 g-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#10b98120' }}>
                    <TrendingUp size={20} color="#10b981" />
                  </div>
                  <div>
                    <small className="text-muted">Response Rate</small>
                    <h6 className="mb-0 fw-bold">
                      {responseRate.toFixed(1)}%
                    </h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#3b82f620' }}>
                    <MessageCircle size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <small className="text-muted">Total Responses</small>
                    <h6 className="mb-0 fw-bold">{reviews.filter(r => r.response || r.provider_response).length}</h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle p-2" style={{ background: '#f59e0b20' }}>
                    <Award size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <small className="text-muted">Average Response Time</small>
                    <h6 className="mb-0 fw-bold">
                      {reviews.filter(r => r.response_date || r.responded_at).length > 0
                        ? formatDistanceToNow(new Date(reviews[0]?.response_date || reviews[0]?.responded_at || new Date()), { addSuffix: true })
                        : 'N/A'}
                    </h6>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
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
                <ChevronDown size={16} className={`transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            <Row className={`g-3 ${showFilters ? '' : 'd-none'}`}>
              <Col md={4}>
                <Form.Label className="small text-muted">Rating</Form.Label>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    style={{ borderRadius: '20px' }}
                  >
                    All
                  </Button>
                  {[5, 4, 3, 2, 1].map(star => (
                    <Button
                      key={star}
                      variant={filter === star.toString() ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setFilter(star.toString())}
                      style={{ borderRadius: '20px' }}
                      className="d-flex align-items-center gap-1"
                    >
                      {star} <Star size={12} fill="currentColor" />
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
                <Form.Label className="small text-muted">Date Range</Form.Label>
                <Form.Select
                  size="sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </Form.Select>
              </Col>
            </Row>

            <div className="mt-3">
              <small className="text-muted">
                Showing {reviews.length} of {totalReviews} reviews
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '20px' }}>
            <Card.Body>
              <MessageCircle size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No reviews found</h6>
              <p className="text-muted small">Reviews will appear here once customers leave feedback</p>
            </Card.Body>
          </Card>
        ) : (
          reviews.map((review) => {
            const reviewId = review.id || review._id;
            const customerName = getField(review, ['customer_name', 'customer.name', 'reviewer_name', 'user.name'], 'Customer');
            const rating = parseFloat(review.rating) || 0;
            const comment = getField(review, ['comment', 'content', 'review_text'], '');
            const serviceName = getField(review, ['service_name', 'service.name', 'serviceTitle'], '');
            const createdAt = review.created_at || review.createdAt || review.date || new Date().toISOString();
            const helpfulCount = parseInt(review.helpful_count) || parseInt(review.helpful) || 0;
            const isVerified = review.is_verified || review.verified || false;
            const isEdited = review.is_edited || review.edited || false;
            const response = getField(review, ['response', 'provider_response', 'admin_response'], '');
            const responseDate = review.response_date || review.responded_at || review.updated_at;

            return (
              <Card key={reviewId} className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <Card.Body className="p-4">
                  <div className="d-flex gap-3">
                    {/* Avatar */}
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ 
                        width: '56px', 
                        height: '56px', 
                        background: `linear-gradient(135deg, ${rating >= 4 ? '#10b981' : rating >= 3 ? '#f59e0b' : '#ef4444'} 0%, ${rating >= 4 ? '#059669' : rating >= 3 ? '#d97706' : '#dc2626'} 100%)`,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: 'white'
                      }}
                    >
                      {customerName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-grow-1">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                        <div>
                          <h6 className="fw-bold mb-1">{customerName}</h6>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="d-flex">
                              {renderStars(rating, 16)}
                            </div>
                            {isVerified && (
                              <Badge bg="success" pill className="d-flex align-items-center gap-1">
                                <CheckCircle size={10} />
                                Verified
                              </Badge>
                            )}
                            {isEdited && (
                              <Badge bg="secondary" pill>Edited</Badge>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-3 text-muted small mb-3">
                            <span className="d-flex align-items-center gap-1">
                              <Calendar size={12} />
                              {format(new Date(createdAt), 'MMM dd, yyyy')}
                            </span>
                            <span className="d-flex align-items-center gap-1">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                            </span>
                            {serviceName && (
                              <span className="d-flex align-items-center gap-1">
                                <User size={12} />
                                {serviceName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="mb-3" style={{ lineHeight: '1.6' }}>{comment}</p>

                      {/* Actions */}
                      <div className="d-flex gap-3 mb-3">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleHelpful(reviewId)}
                          className="text-muted p-0 d-flex align-items-center gap-1"
                        >
                          <ThumbsUp size={14} />
                          Helpful ({helpfulCount})
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setShowReportModal(true);
                          }}
                          className="text-muted p-0 d-flex align-items-center gap-1"
                        >
                          <Flag size={14} />
                          Report
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setRespondingTo(respondingTo === reviewId ? null : reviewId)}
                          className="text-primary p-0 d-flex align-items-center gap-1"
                        >
                          <MessageCircle size={14} />
                          {response ? 'Edit Response' : 'Respond'}
                        </Button>
                      </div>

                      {/* Response Section */}
                      {response && respondingTo !== reviewId && (
                        <div className="mt-3 p-3" style={{ backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <strong className="small d-flex align-items-center gap-1">
                              <MessageCircle size={12} />
                              Your Response:
                            </strong>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setRespondingTo(reviewId);
                                setResponseText(response);
                              }}
                              className="text-primary p-0"
                            >
                              <Edit2 size={12} />
                            </Button>
                          </div>
                          <p className="mb-0 small">{response}</p>
                          {responseDate && (
                            <small className="text-muted">
                              {format(new Date(responseDate), 'MMM dd, yyyy hh:mm a')}
                            </small>
                          )}
                        </div>
                      )}

                      {/* Response Form */}
                      {respondingTo === reviewId && (
                        <div className="mt-3">
                          <Form.Group className="mb-2">
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write your response here..."
                              style={{ borderRadius: '12px', fontSize: '14px' }}
                            />
                          </Form.Group>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleSubmitResponse(reviewId)}
                              disabled={submittingResponse}
                              className="d-flex align-items-center gap-2"
                            >
                              {submittingResponse ? (
                                <Spinner as="span" animation="border" size="sm" />
                              ) : (
                                <Send size={14} />
                              )}
                              {submittingResponse ? 'Posting...' : 'Post Response'}
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
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

      {/* Report Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <Flag className="me-2" size={18} />
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
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReport}>
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
        .rotate-180 {
          transform: rotate(180deg);
        }
        .transform {
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ProviderReviews;