// src/pages/ServiceDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, Button, Badge,
  Image, Modal, Alert, Form,
  ProgressBar, Tab, Nav, InputGroup
} from 'react-bootstrap';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaPrint,
  FaFlag,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaShieldAlt,
  FaAward,
  FaMedal,
  FaArrowLeft,
  FaArrowRight,
  FaQuoteRight,
  FaCamera,
  FaVideo,
  FaImage as FaImageIcon,
  FaThumbsUp,
  FaThumbsDown,
  FaReply,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
  FaLink,
  FaCopy,
  FaDollarSign,
  FaCreditCard,
  FaPaypal,
  FaGooglePay,
  FaApplePay,
  FaCheck
} from 'react-icons/fa';

import { getServiceImage, handleImageError, getAvatarUrl } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State – all start empty (no mock)
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: []
  });
  const [bookingStep, setBookingStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Fetch all data (non‑blocking)
  useEffect(() => {
    fetchServiceDetails();
    fetchRelatedServices();
    fetchReviews();
    if (user) checkFavoriteStatus();
  }, [id, user]);

  const fetchServiceDetails = async () => {
    try {
      const res = await api.get(`/services/${id}`);
      setService(res.data);
    } catch (err) {
      console.error('Error fetching service:', err);
      toast.error('Failed to load service details');
    }
  };

  const fetchRelatedServices = async () => {
    try {
      const res = await api.get(`/services/${id}/related`);
      setRelatedServices(res.data);
    } catch (err) {
      console.error('Error fetching related services:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/services/${id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const res = await api.get(`/favorites/check/${id}`);
      setIsFavorite(res.data.isFavorite);
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please login to book this service');
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
    setBookingStep(1);
  };

  const handleBookingSubmit = async () => {
    if (bookingStep === 1) {
      if (!bookingDate || !bookingTime) {
        toast.error('Please select date and time');
        return;
      }
      setBookingStep(2);
    } else if (bookingStep === 2) {
      try {
        await api.post('/bookings', {
          serviceId: service.id,
          date: bookingDate,
          time: bookingTime,
          notes: bookingNotes
        });
        setBookingStep(3);
        toast.success('Booking confirmed!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Booking failed');
      }
    }
  };

  const handleFavorite = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${service.id}`);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/favorites/${service.id}`);
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update favorites');
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this service: ${service?.title}`;
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link copied to clipboard!');
        return;
      default:
        return;
    }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleReviewSubmit = async () => {
    if (!newReview.title || !newReview.comment) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await api.post(`/services/${id}/reviews`, {
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: newReview.images
      });
      toast.success('Review submitted successfully!');
      setShowReviewModal(false);
      setNewReview({ rating: 5, title: '', comment: '', images: [] });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
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

  // If service is not loaded yet, show minimal placeholder
  if (!service) {
    return (
      <Container className="py-5 text-center">
        <p>Loading service details...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="service-detail-container py-4">
      {/* Back Button */}
      <Button
        variant="link"
        className="text-decoration-none mb-3 d-inline-flex align-items-center"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" /> Back to Services
      </Button>

      <Row>
        <Col lg={8}>
          {/* Image Gallery */}
          <Card className="border-0 shadow-sm mb-4">
            <div className="service-gallery">
              <Image
                src={(service.images && service.images[activeImage]) || getServiceImage(service.title, service.id, 800, 500)}
                fluid
                style={{ height: '400px', width: '100%', objectFit: 'cover' }}
                onError={(e) => handleImageError(e, getServiceImage(service.title, service.id, 800, 500))}
              />
              <div className="gallery-thumbnails d-flex gap-2 mt-2">
                {service.images?.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumb ${idx}`}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer', border: idx === activeImage ? '2px solid #667eea' : 'none' }}
                    onClick={() => setActiveImage(idx)}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Service Details */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h3 className="mb-3">{service.title}</h3>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="text-warning d-flex align-items-center">
                  {renderStars(service.avg_rating)} <span className="ms-2 text-dark">{service.avg_rating?.toFixed(1)}</span>
                </span>
                <span className="text-muted">({service.review_count || 0} reviews)</span>
                <Badge bg="success">Verified</Badge>
              </div>
              <p className="mb-4">{service.description}</p>
              
              {/* Service Features */}
              <Row className="g-3 mb-4">
                <Col md={4}>
                  <div className="d-flex align-items-center gap-2">
                    <FaClock className="text-primary" />
                    <span>Duration: {service.duration || '2 hours'}</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center gap-2">
                    <FaMapMarkerAlt className="text-primary" />
                    <span>{service.location || 'Available Nationwide'}</span>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center gap-2">
                    <FaUser className="text-primary" />
                    <span>Provider: {service.provider_name}</span>
                  </div>
                </Col>
              </Row>

              {/* Provider Info */}
              <div className="p-3 bg-light rounded-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={service.provider_avatar || getAvatarUrl(service.provider_name, 60)}
                    alt={service.provider_name}
                    className="rounded-circle"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className="mb-1">{service.provider_name}</h6>
                    <div className="d-flex align-items-center gap-2">
                      <FaStar className="text-warning" />
                      <span>{service.provider_rating || 'New'}</span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{service.provider_reviews || 0} reviews</span>
                    </div>
                    <Button variant="outline-primary" size="sm" className="mt-1">
                      <FaEnvelope className="me-1" /> Contact Provider
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Reviews Section */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Customer Reviews</h5>
                <Button variant="outline-primary" size="sm" onClick={() => setShowReviewModal(true)}>
                  Write a Review
                </Button>
              </div>
              {reviews.length === 0 ? (
                <p className="text-muted text-center py-4">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((review, idx) => (
                  <div key={idx} className="border-bottom pb-3 mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <img
                        src={review.user_avatar || getAvatarUrl(review.user_name, 40)}
                        alt={review.user_name}
                        className="rounded-circle"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-0">{review.user_name}</h6>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-warning">{renderStars(review.rating)}</span>
                          <small className="text-muted">{new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                      </div>
                    </div>
                    <p className="mb-0">{review.comment}</p>
                    <div className="d-flex gap-3 mt-2">
                      <Button variant="link" size="sm" className="text-muted p-0">
                        <FaThumbsUp className="me-1" /> Helpful
                      </Button>
                      <Button variant="link" size="sm" className="text-muted p-0">
                        <FaFlag className="me-1" /> Report
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="mb-2">{service.title}</h3>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <span className="text-warning d-flex align-items-center">
                      {renderStars(service.avg_rating)} <span className="ms-2 text-dark">{service.avg_rating?.toFixed(1)}</span>
                    </span>
                    <span className="text-muted">({service.review_count || 0} reviews)</span>
                  </div>
                </div>
                <Button variant="outline-danger" onClick={handleFavorite} className="rounded-circle p-2">
                  {isFavorite ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                </Button>
              </div>
              <h4 className="text-primary mb-3">${service.price}</h4>
              <Button variant="primary" className="w-100 mb-3" size="lg" onClick={handleBookNow}>
                Book Now
              </Button>
              <div className="d-grid gap-2">
                <Button variant="outline-secondary" onClick={() => setShowShareModal(true)}>
                  <FaShare className="me-2" /> Share
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold mb-3">Related Services</h6>
                {relatedServices.slice(0, 3).map((related, idx) => (
                  <Link key={idx} to={`/services/${related.id}`} className="text-decoration-none">
                    <div className="d-flex align-items-center gap-2 mb-2 p-2 rounded-3 hover-bg">
                      <img
                        src={related.image || getServiceImage(related.title, related.id, 60, 60)}
                        alt={related.title}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div>
                        <h6 className="mb-0 small">{related.title}</h6>
                        <span className="text-primary fw-bold small">${related.price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Share this service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-around">
            <Button variant="success" onClick={() => handleShare('whatsapp')} className="rounded-circle p-3">
              <FaWhatsapp size={28} />
            </Button>
            <Button variant="primary" onClick={() => handleShare('facebook')} className="rounded-circle p-3">
              <FaFacebook size={28} />  // ✅ Fixed
            </Button>
            <Button variant="info" onClick={() => handleShare('twitter')} className="rounded-circle p-3">
              <FaTwitter size={28} />   // ✅ Fixed
            </Button>
            <Button variant="secondary" onClick={() => handleShare('copy')} className="rounded-circle p-3">
              <FaLink size={28} />
            </Button>
          </div>
          {copied && <Alert variant="success" className="mt-3">Link copied to clipboard!</Alert>}
        </Modal.Body>
      </Modal>

      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Book Service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingStep === 1 && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Date</Form.Label>
                <Form.Control type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Select Time</Form.Label>
                <Form.Control type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Additional Notes (optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} />
              </Form.Group>
            </Form>
          )}
          {bookingStep === 2 && (
            <div className="text-center">
              <p>Please review your booking details and confirm.</p>
              <p><strong>Service:</strong> {service.title}</p>
              <p><strong>Date:</strong> {bookingDate} at {bookingTime}</p>
              <p><strong>Total:</strong> ${service.price}</p>
            </div>
          )}
          {bookingStep === 3 && (
            <div className="text-center">
              <FaCheckCircle size={64} className="text-success mb-3" />
              <h4>Booking Confirmed!</h4>
              <p>Your booking has been submitted. You will receive a confirmation email shortly.</p>
              <Button variant="primary" onClick={() => navigate('/bookings')}>View My Bookings</Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {bookingStep < 3 && (
            <>
              <Button variant="secondary" onClick={() => setShowBookingModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleBookingSubmit}>
                {bookingStep === 1 ? 'Continue' : 'Confirm Booking'}
              </Button>
            </>
          )}
          {bookingStep === 3 && <Button variant="primary" onClick={() => setShowBookingModal(false)}>Close</Button>}
        </Modal.Footer>
      </Modal>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Write a Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <div className="d-flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <FaStar
                    key={star}
                    size={24}
                    className={star <= newReview.rating ? 'text-warning' : 'text-secondary'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setNewReview({...newReview, rating: star})}
                  />
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" value={newReview.title} onChange={(e) => setNewReview({...newReview, title: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Comment</Form.Label>
              <Form.Control as="textarea" rows={4} value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleReviewSubmit}>Submit Review</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .hover-bg:hover {
          background: #f8f9fa;
        }
        .sticky-top {
          top: 20px;
        }
        .service-gallery {
          position: relative;
        }
        .gallery-thumbnails {
          overflow-x: auto;
          padding-bottom: 10px;
        }
        .gallery-thumbnails::-webkit-scrollbar {
          height: 4px;
        }
        .gallery-thumbnails::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        @media (max-width: 768px) {
          .sticky-top {
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </Container>
  );
};

export default ServiceDetail;