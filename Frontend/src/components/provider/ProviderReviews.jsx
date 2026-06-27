// src/components/provider/ProviderReviews.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  TrendingUp,        // ✅ ADD THIS - from lucide-react it's TrendingUp
  TrendingDown        // ✅ Also add for potential downward trends
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

  const itemsPerPage = 10;

  // ✅ Calculate stats from reviews (no API call)
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
    const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      const rating = Math.round(review.rating || 0);
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

  // ✅ Fetch reviews (stats calculated from reviews data)
  const fetchReviews = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined
      };

      const response = await providerAPI.getReviews(params);
      const reviewsData = response.data.reviews || [];
      setReviews(reviewsData);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
      setTotalReviews(response.data.total || 0);
      
      // ✅ Calculate stats from reviews
      calculateStatsFromReviews(reviewsData);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
      setReviews([]);
      setTotalPages(1);
      setTotalReviews(0);
      return null;
    }
  }, [currentPage, filter, sortBy, dateRange, calculateStatsFromReviews]);

  // ✅ REMOVED: fetchStats - no longer needed, stats come from reviews

  // Load all data - only fetch reviews
  const loadAllData = async () => {
    setLoading(true);
    await fetchReviews();
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
  }, [currentPage, filter, sortBy, dateRange]);

  // Handle response submission
  const handleSubmitResponse = async (reviewId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setSubmittingResponse(true);
    try {
      await providerAPI.respondToReview(reviewId, responseText);
      toast.success('Response posted successfully');
      setRespondingTo(null);
      setResponseText('');
      await fetchReviews();
    } catch (error) {
      console.error('Error posting response:', error);
      toast.error('Failed to post response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Handle report
  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await providerAPI.reportReview(selectedReview.id, reportReason);
      toast.success('Review reported successfully');
      setShowReportModal(false);
      setReportReason('');
      setSelectedReview(null);
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
    }
  };

  // Handle helpful vote
  const handleHelpful = async (reviewId) => {
    try {
      await providerAPI.markReviewHelpful(reviewId);
      toast.success('Thanks for your feedback!');
      await fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Failed to mark as helpful');
    }
  };

  // Export reviews
  const exportReviews = async () => {
    setExporting(true);
    try {
      const response = await providerAPI.exportReviews({
        rating: filter !== 'all' ? parseInt(filter) : undefined,
        date_range: dateRange !== 'all' ? dateRange : undefined,
        format: 'csv'
      });
      
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
      toast.error('Failed to export reviews');
    } finally {
      setExporting(false);
    }
  };

  // Render stars
  const renderStars = (rating, size = 16) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
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
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  // Calculate response rate
  const responseRate = totalReviews > 0 
    ? (reviews.filter(r => r.response).length / totalReviews) * 100 
    : 0;

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

        {/* Additional Stats Cards - ✅ Fixed TrendingUp import */}
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
                    <h6 className="mb-0 fw-bold">{reviews.filter(r => r.response).length}</h6>
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
                      {reviews.filter(r => r.response_date).length > 0
                        ? formatDistanceToNow(new Date(reviews[0]?.response_date || new Date()), { addSuffix: true })
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
                      background: `linear-gradient(135deg, ${review.rating >= 4 ? '#10b981' : review.rating >= 3 ? '#f59e0b' : '#ef4444'} 0%, ${review.rating >= 4 ? '#059669' : review.rating >= 3 ? '#d97706' : '#dc2626'} 100%)`,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {review.customer_name?.charAt(0).toUpperCase() || 'C'}
                  </div>

                  <div className="flex-grow-1">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                      <div>
                        <h6 className="fw-bold mb-1">{review.customer_name}</h6>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div className="d-flex">
                            {renderStars(review.rating, 16)}
                          </div>
                          <Badge bg="success" pill className="d-flex align-items-center gap-1">
                            <CheckCircle size={10} />
                            Verified
                          </Badge>
                          {review.is_edited && (
                            <Badge bg="secondary" pill>Edited</Badge>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3 text-muted small mb-3">
                          <span className="d-flex align-items-center gap-1">
                            <Calendar size={12} />
                            {format(new Date(review.created_at), 'MMM dd, yyyy')}
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <Clock size={12} />
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                          {review.service_name && (
                            <span className="d-flex align-items-center gap-1">
                              <User size={12} />
                              {review.service_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <p className="mb-3" style={{ lineHeight: '1.6' }}>{review.comment}</p>

                    {/* Actions */}
                    <div className="d-flex gap-3 mb-3">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleHelpful(review.id)}
                        className="text-muted p-0 d-flex align-items-center gap-1"
                      >
                        <ThumbsUp size={14} />
                        Helpful ({review.helpful_count || 0})
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
                        onClick={() => setRespondingTo(respondingTo === review.id ? null : review.id)}
                        className="text-primary p-0 d-flex align-items-center gap-1"
                      >
                        <MessageCircle size={14} />
                        {review.response ? 'Edit Response' : 'Respond'}
                      </Button>
                    </div>

                    {/* Response Section */}
                    {review.response && respondingTo !== review.id && (
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
                              setRespondingTo(review.id);
                              setResponseText(review.response);
                            }}
                            className="text-primary p-0"
                          >
                            <Edit2 size={12} />
                          </Button>
                        </div>
                        <p className="mb-0 small">{review.response}</p>
                        <small className="text-muted">
                          {format(new Date(review.response_date), 'MMM dd, yyyy hh:mm a')}
                        </small>
                      </div>
                    )}

                    {/* Response Form */}
                    {respondingTo === review.id && (
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
                            onClick={() => handleSubmitResponse(review.id)}
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