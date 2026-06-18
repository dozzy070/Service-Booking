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
      // optional: toast.error? Not needed for non‑critical
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
      fetchReviews(); // refresh reviews after submission
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

  // If service is not loaded yet, show minimal placeholder (no spinner)
  if (!service) {
    return (
      <Container className="py-5 text-center">
        <p>Loading service details...</p>
      </Container>
    );
  }

  // Main render uses real service data
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

      {/* The rest of the JSX remains exactly as you had it – just use `service` and other dynamic data */}
      {/* I'm only including the skeleton; you can paste your original JSX but replace the static parts with real data */}
      {/* For brevity, I'll show the essential dynamic parts – keep your existing layout and just use variable interpolation */}

      {/* Example: Image gallery, provider info, etc. – all from `service` */}
      <Row>
        <Col lg={8}>
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
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4 sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h3 className="mb-2">{service.title}</h3>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <span className="text-warning d-flex align-items-center">
                      {renderStars(service.rating)} <span className="ms-2 text-dark">{service.rating}</span>
                    </span>
                    <span className="text-muted">({service.totalReviews} reviews)</span>
                  </div>
                </div>
                <Button variant="outline-danger" onClick={handleFavorite}>
                  {isFavorite ? <FaHeart /> : <FaRegHeart />}
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
        </Col>
      </Row>

      {/* Keep your existing JSX for service details, provider info, reviews, etc. – replace any remaining mock references with `service`, `reviews`, etc. */}

      {/* Share Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Share this service</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-around">
            <Button variant="success" onClick={() => handleShare('whatsapp')}><FaWhatsapp size={32} /></Button>
            <Button variant="primary" onClick={() => handleShare('facebook')}><Facebook size={32} /></Button>
            <Button variant="info" onClick={() => handleShare('twitter')}><FaTwitter size={32} /></Button>
            <Button variant="secondary" onClick={() => handleShare('copy')}><FaLink size={32} /></Button>
          </div>
          {copied && <Alert variant="success" className="mt-3">Link copied to clipboard!</Alert>}
        </Modal.Body>
      </Modal>

      {/* Booking Modal */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Book Service</Modal.Title></Modal.Header>
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
        <Modal.Header closeButton><Modal.Title>Write a Review</Modal.Title></Modal.Header>
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
    </Container>
  );
};

export default ServiceDetail;