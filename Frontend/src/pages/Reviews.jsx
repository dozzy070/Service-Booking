// src/pages/Reviews.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Badge,
  Form, Modal, Alert, Image,
  ProgressBar, InputGroup, Nav
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaStar, FaStarHalfAlt, FaRegStar, FaCalendarAlt,
  FaCheckCircle, FaClock, FaExclamationCircle,
  FaThumbsUp, FaThumbsDown, FaFlag,
  FaReply, FaEdit, FaTrash, FaFilter,
  FaSearch, FaSort, FaArrowRight, FaEye,
  FaPaperPlane, FaCheck
} from 'react-icons/fa';
import { getAvatarUrl, handleImageError } from '../utils/imageUtils';
import api from '../api';
import toast from 'react-hot-toast';

const Reviews = () => {
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('all');

  // Real data states – initialized empty
  const [reviews, setReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
    totalHelpful: 0,
    responseRate: 0,
    averageResponseTime: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      await fetchStatsFromServices();
      await fetchCompletedBookings();
      await fetchMyReviews();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Could not load reviews data');
    }
  };

  const fetchStatsFromServices = async () => {
    try {
      const response = await api.get('/services', { params: { limit: 100 } });
      const services = response.data.services || [];

      let totalRatingSum = 0;
      let totalReviewsCount = 0;
      let starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      services.forEach(service => {
        const avgRating = service.avg_rating || 0;
        const reviewCount = service.review_count || 0;
        if (reviewCount > 0) {
          totalRatingSum += avgRating * reviewCount;
          totalReviewsCount += reviewCount;
          const rounded = Math.round(avgRating);
          if (rounded >= 1 && rounded <= 5) starCounts[rounded] += reviewCount;
        }
      });

      const averageRating = totalReviewsCount > 0 ? totalRatingSum / totalReviewsCount : 0;

      setStats({
        totalReviews: totalReviewsCount,
        averageRating,
        fiveStar: starCounts[5],
        fourStar: starCounts[4],
        threeStar: starCounts[3],
        twoStar: starCounts[2],
        oneStar: starCounts[1],
        totalHelpful: 0,
        responseRate: 0,
        averageResponseTime: 'N/A'
      });
    } catch (err) {
      console.error('Failed to fetch service stats:', err);
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      const response = await api.get('/customer/bookings?status=completed&limit=20');
      setCompletedBookings(response.data.bookings || response.data || []);
    } catch (err) {
      console.error('Failed to fetch completed bookings:', err);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const response = await api.get('/customer/reviews');
      setMyReviews(response.data);
    } catch (err) {
      console.warn('No /customer/reviews endpoint, falling back to completed bookings');
      const bookingsWithReviews = completedBookings.filter(b => b.review);
      const reviewsFromBookings = bookingsWithReviews.map(b => ({
        id: b.review.id,
        serviceId: b.service_id,
        serviceName: b.service_name,
        providerName: b.provider_name,
        providerAvatar: b.provider_avatar,
        rating: b.review.rating,
        title: b.review.title,
        comment: b.review.comment,
        date: b.review.created_at,
        status: 'published',
        helpful: 0
      }));
      setMyReviews(reviewsFromBookings);
    }
  };

  const handleViewService = (serviceId) => {
    if (serviceId) navigate(`/services/${serviceId}`);
    else toast.error('Service ID missing');
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setModalMode('view');
    setShowReviewModal(true);
  };

  const handleEditReview = (review) => {
    setSelectedReview(review);
    setModalMode('edit');
    setShowReviewModal(true);
  };

  const handleReplyToReview = (review) => {
    setSelectedReview(review);
    setModalMode('reply');
    setReplyText('');
    setShowReviewModal(true);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    try {
      await api.post(`/reviews/${selectedReview.id}/reply`, { reply: replyText });
      toast.success('Reply posted successfully!');
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleUpdateReview = async () => {
    if (!selectedReview) return;
    try {
      await api.put(`/customer/reviews/${selectedReview.id}`, {
        rating: selectedReview.rating,
        title: selectedReview.title,
        comment: selectedReview.comment
      });
      setMyReviews(prev => prev.map(r => r.id === selectedReview.id ? selectedReview : r));
      toast.success('Review updated!');
      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/customer/reviews/${reviewId}`);
      setMyReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted');
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) stars.push(<FaStar key={i} className="text-warning" />);
      else if (i - 0.5 === rating) stars.push(<FaStarHalfAlt key={i} className="text-warning" />);
      else stars.push(<FaRegStar key={i} className="text-warning" />);
    }
    return stars;
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: { bg: 'success', text: 'Published', icon: <FaCheckCircle /> },
      pending: { bg: 'warning', text: 'Pending', icon: <FaClock /> },
    };
    return badges[status] || badges.pending;
  };

  const renderAllReviewsTab = () => (
    <Card className="border-0 shadow-sm text-center py-5">
      <Card.Body>
        <FaStar size={48} className="text-muted mb-3" />
        <h5>Individual reviews are not directly available</h5>
        <p className="text-muted">To see detailed reviews, please visit a service page.</p>
        <Button variant="primary" onClick={() => navigate('/services')}>
          Browse Services
        </Button>
      </Card.Body>
    </Card>
  );

  const renderMyReviewsTab = () => {
    if (myReviews.length === 0 && completedBookings.length === 0) {
      return (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <FaEdit size={48} className="text-muted mb-3" />
            <h5>No reviews written yet</h5>
            <p className="text-muted">Complete a booking and then you can write a review.</p>
            <Button variant="primary" onClick={() => navigate('/services')}>
              Find Services
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return (
      <>
        {myReviews.map(review => (
          <Card key={review.id} className="border-0 shadow-sm mb-4 review-card">
            <Card.Body>
              <Row className="mb-3">
                <Col xs={8}>
                  <div className="d-flex align-items-center">
                    <Image
                      src={review.providerAvatar || getAvatarUrl(review.providerName, 50)}
                      roundedCircle
                      className="reviewer-avatar me-3"
                      style={{ width: 50, height: 50 }}
                    />
                    <div>
                      <h6 className="mb-1">{review.providerName}</h6>
                      <div className="d-flex align-items-center">
                        {renderStars(review.rating)}
                        <small className="text-muted ms-2">{review.date}</small>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={4} className="text-end">
                  <Badge bg={getStatusBadge(review.status).bg}>
                    {getStatusBadge(review.status).icon} {getStatusBadge(review.status).text}
                  </Badge>
                </Col>
              </Row>
              <div className="service-info bg-light p-3 rounded mb-3">
                <Row className="align-items-center">
                  <Col xs={8}>
                    <h6 className="mb-0">{review.serviceName}</h6>
                  </Col>
                  <Col xs={4} className="text-end">
                    <Button size="sm" variant="outline-primary" onClick={() => handleViewService(review.serviceId)}>
                      <FaEye /> View Service
                    </Button>
                  </Col>
                </Row>
              </div>
              <h6>{review.title}</h6>
              <p className="text-muted">{review.comment}</p>
              <div className="d-flex gap-2">
                <Button variant="outline-success" size="sm" onClick={() => handleEditReview(review)}>
                  <FaEdit /> Edit
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteReview(review.id)}>
                  <FaTrash /> Delete
                </Button>
                <Button variant="outline-info" size="sm" onClick={() => handleViewReview(review)}>
                  Details
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))}
      </>
    );
  };

  return (
    <Container fluid className="reviews-container py-4">
      <Row className="mb-4">
        <Col>
          <h2>Reviews & Ratings</h2>
          <p className="text-muted">Based on real customer feedback from completed services</p>
        </Col>
      </Row>

      {/* Stats Cards – real data */}
      <Row className="g-4 mb-4">
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body className="text-center">
              <h1 className="display-4 text-primary mb-2">{stats.averageRating.toFixed(1)}</h1>
              <div className="mb-2">{renderStars(stats.averageRating)}</div>
              <p className="text-muted">Based on {stats.totalReviews} reviews</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body>
              <h5 className="mb-3">Rating Breakdown</h5>
              {[5,4,3,2,1].map(star => {
                const count = stats[`${star}Star`];
                const percent = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="mb-2">
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{ minWidth: 30 }}>{star}★</span>
                      <ProgressBar now={percent} variant="warning" style={{ height: 8, flex: 1 }} />
                      <span className="ms-2 small">{count}</span>
                    </div>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body>
              <h5 className="mb-3">Your Activity</h5>
              <div className="text-center mb-2">
                <h2 className="text-primary mb-0">{myReviews.length}</h2>
                <small>Reviews written</small>
              </div>
              <div className="text-center">
                <h2 className="text-info mb-0">{completedBookings.filter(b => !b.review).length}</h2>
                <small>Pending reviews</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="border-0 shadow-sm stats-card">
            <Card.Body>
              <h5 className="mb-3">Quick Actions</h5>
              <Button variant="outline-primary" className="w-100 mb-2" onClick={() => setActiveTab('my')}>
                <FaEdit className="me-2" /> My Reviews
              </Button>
              <Button variant="outline-success" className="w-100" onClick={() => navigate('/services')}>
                <FaEye className="me-2" /> Browse Services
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 pt-4">
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item><Nav.Link eventKey="all">All Reviews</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="my">My Reviews</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="pending">Write a Review</Nav.Link></Nav.Item>
          </Nav>
        </Card.Header>
      </Card>

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control placeholder="Search your reviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><FaSort /></InputGroup.Text>
                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" className="w-100" onClick={() => setSearchTerm('')}>
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tab Content */}
      <Row>
        <Col lg={8}>
          {activeTab === 'all' && renderAllReviewsTab()}
          {activeTab === 'my' && renderMyReviewsTab()}
          {activeTab === 'pending' && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5>Bookings waiting for your review</h5>
                {completedBookings.filter(b => !b.review).length === 0 ? (
                  <p className="text-muted">No pending reviews. Complete more services to share your experience!</p>
                ) : (
                  completedBookings.filter(b => !b.review).map(booking => (
                    <div key={booking.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h6>{booking.service_name}</h6>
                          <p className="text-muted small">Provider: {booking.provider_name}</p>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => navigate(`/services/${booking.service_id}/review`)}>
                          Write Review
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5>💡 Review Tips</h5>
              <ul className="list-unstyled">
                <li className="mb-2"><FaCheckCircle className="text-success me-2" /> Be honest and specific</li>
                <li className="mb-2"><FaCheckCircle className="text-success me-2" /> Include photos if possible</li>
                <li className="mb-2"><FaCheckCircle className="text-success me-2" /> Mention what went well</li>
                <li className="mb-2"><FaCheckCircle className="text-success me-2" /> Keep it constructive</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal for viewing/editing a review */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'view' ? 'Review Details' : modalMode === 'edit' ? 'Edit Review' : 'Reply to Review'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedReview && (
            <>
              {modalMode === 'view' && (
                <>
                  <div className="d-flex align-items-center mb-3">
                    <Image src={selectedReview.providerAvatar || getAvatarUrl(selectedReview.providerName, 60)} roundedCircle width={60} height={60} className="me-3" />
                    <div>
                      <h5>{selectedReview.providerName}</h5>
                      <div>{renderStars(selectedReview.rating)}</div>
                    </div>
                  </div>
                  <h6>{selectedReview.title}</h6>
                  <p>{selectedReview.comment}</p>
                  <Button variant="primary" onClick={() => handleViewService(selectedReview.serviceId)}>View Service</Button>
                </>
              )}
              {modalMode === 'edit' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Rating</Form.Label>
                    <div className="d-flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <FaStar key={s} size={24} className={s <= selectedReview.rating ? 'text-warning' : 'text-secondary'} style={{ cursor: 'pointer' }} onClick={() => setSelectedReview({...selectedReview, rating: s})} />
                      ))}
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control type="text" value={selectedReview.title} onChange={e => setSelectedReview({...selectedReview, title: e.target.value})} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Comment</Form.Label>
                    <Form.Control as="textarea" rows={4} value={selectedReview.comment} onChange={e => setSelectedReview({...selectedReview, comment: e.target.value})} />
                  </Form.Group>
                  <Button variant="success" onClick={handleUpdateReview}>Save Changes</Button>
                </>
              )}
              {modalMode === 'reply' && (
                <>
                  <Form.Group>
                    <Form.Label>Your Reply</Form.Label>
                    <Form.Control as="textarea" rows={4} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." />
                  </Form.Group>
                  <Button className="mt-3" variant="primary" onClick={handleSubmitReply}>Post Reply</Button>
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <style jsx="true">{`
        .reviews-container { max-width: 1400px; }
        .stats-card { border-radius: 15px; transition: all 0.3s ease; }
        .stats-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
        .review-card { transition: all 0.3s ease; }
        .review-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
      `}</style>
    </Container>
  );
};

export default Reviews;