// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaCreditCard, FaPaypal, FaLock, FaShieldAlt, 
  FaCheckCircle, FaArrowLeft, FaGooglePay, FaApplePay,
  FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover
} from 'react-icons/fa';
import { PaymentService } from '../services/PaymentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Form state for new card
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: '',
    saveCard: true
  });

  const [errors, setErrors] = useState({});

  // Mock booking details - In production, fetch from API
  useEffect(() => {
    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          setBookingDetails({
            id: bookingId,
            service: 'Professional House Cleaning',
            provider: 'Sarah Johnson',
            date: '2024-03-20',
            time: '10:00 AM',
            amount: 150.00,
            status: 'pending'
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast.error('Failed to load booking details');
        setLoading(false);
      }
    };

    const fetchPaymentMethods = async () => {
      try {
        const methods = await PaymentService.getPaymentMethods(user?.id);
        setPaymentMethods(methods);
        const defaultMethod = methods.find(m => m.isDefault);
        if (defaultMethod) {
          setSelectedMethod(defaultMethod.id);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    fetchBookingDetails();
    fetchPaymentMethods();
  }, [bookingId, user?.id]);

  const validateCardForm = () => {
    const newErrors = {};

    if (!cardForm.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardForm.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!cardForm.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!cardForm.expiry.trim()) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) {
      newErrors.expiry = 'Invalid expiry format (MM/YY)';
    }

    if (!cardForm.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }

    // Format expiry with slash
    if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substr(0, 5);
    }

    setCardForm({ ...cardForm, [name]: formattedValue });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handlePayment = async () => {
    if (showNewCardForm) {
      if (!validateCardForm()) {
        toast.error('Please fill in all card details correctly');
        return;
      }
    } else if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const paymentDetails = {
        bookingId,
        amount: bookingDetails?.amount,
        methodId: selectedMethod,
        ...(showNewCardForm && {
          newCard: {
            cardNumber: cardForm.cardNumber.replace(/\s/g, ''),
            cardholderName: cardForm.cardholderName,
            expiry: cardForm.expiry,
            saveCard: cardForm.saveCard
          }
        })
      };

      const result = await PaymentService.processPayment(paymentDetails);
      
      if (result.success) {
        toast.success('Payment successful!');
        navigate('/payment-success', { 
          state: { 
            transactionId: result.transactionId,
            amount: bookingDetails?.amount,
            bookingId 
          } 
        });
      }
    } catch (error) {
      toast.error(error.message || 'Payment failed');
      navigate('/payment-cancel', { 
        state: { 
          bookingId,
          error: error.message 
        } 
      });
    } finally {
      setProcessing(false);
    }
  };

  const getCardIcon = (type) => {
    switch(type) {
      case 'visa': return <FaCcVisa size={32} className="text-primary" />;
      case 'mastercard': return <FaCcMastercard size={32} className="text-danger" />;
      case 'amex': return <FaCcAmex size={32} className="text-info" />;
      case 'discover': return <FaCcDiscover size={32} className="text-warning" />;
      case 'paypal': return <FaPaypal size={32} className="text-primary" />;
      default: return <FaCreditCard size={32} className="text-secondary" />;
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading payment details...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Link to="/bookings" className="text-decoration-none mb-4 d-inline-block">
        <FaArrowLeft className="me-2" /> Back to Bookings
      </Link>

      <Row className="g-4">
        {/* Payment Form */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 p-lg-5">
              <h3 className="mb-4">Complete Payment</h3>
              
              {/* Booking Summary */}
              {bookingDetails && (
                <div className="bg-light p-4 rounded-3 mb-4">
                  <h6 className="mb-3">Booking Summary</h6>
                  <Row>
                    <Col md={8}>
                      <p className="mb-1"><strong>Service:</strong> {bookingDetails.service}</p>
                      <p className="mb-1"><strong>Provider:</strong> {bookingDetails.provider}</p>
                      <p className="mb-1"><strong>Date & Time:</strong> {bookingDetails.date} at {bookingDetails.time}</p>
                    </Col>
                    <Col md={4} className="text-md-end">
                      <h4 className="text-primary mb-0">${bookingDetails.amount}</h4>
                      <Badge bg="warning" text="dark" className="mt-2">Pending Payment</Badge>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Saved Payment Methods */}
              {paymentMethods.length > 0 && !showNewCardForm && (
                <div className="mb-4">
                  <h6 className="mb-3">Saved Payment Methods</h6>
                  {paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className={`payment-method-card p-3 border rounded-3 mb-2 ${selectedMethod === method.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMethod(method.id)}
                      style={{
                        cursor: 'pointer',
                        border: selectedMethod === method.id ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        backgroundColor: selectedMethod === method.id ? '#f0f4ff' : 'white'
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          {getCardIcon(method.type)}
                        </div>
                        <div className="flex-grow-1">
                          {method.type === 'paypal' ? (
                            <div>
                              <strong>PayPal</strong>
                              <p className="text-muted small mb-0">{method.email}</p>
                            </div>
                          ) : (
                            <div>
                              <strong>{method.brand} ending in {method.last4}</strong>
                              <p className="text-muted small mb-0">Expires {method.expiry}</p>
                            </div>
                          )}
                        </div>
                        {method.isDefault && (
                          <Badge bg="success" className="ms-2">Default</Badge>
                        )}
                        {selectedMethod === method.id && (
                          <FaCheckCircle className="text-primary ms-2" size={20} />
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="link"
                    className="mt-2 p-0"
                    onClick={() => setShowNewCardForm(true)}
                  >
                    + Add new payment method
                  </Button>
                </div>
              )}

              {/* New Card Form */}
              {(showNewCardForm || paymentMethods.length === 0) && (
                <div className="new-card-form">
                  <h6 className="mb-3">Enter Card Details</h6>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Card Number</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardForm.cardNumber}
                          onChange={handleCardInputChange}
                          maxLength="19"
                          isInvalid={!!errors.cardNumber}
                        />
                        <FaCreditCard className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
                      </div>
                      <Form.Control.Feedback type="invalid">
                        {errors.cardNumber}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Cardholder Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="cardholderName"
                        placeholder="John Doe"
                        value={cardForm.cardholderName}
                        onChange={handleCardInputChange}
                        isInvalid={!!errors.cardholderName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.cardholderName}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Expiry Date</Form.Label>
                          <Form.Control
                            type="text"
                            name="expiry"
                            placeholder="MM/YY"
                            value={cardForm.expiry}
                            onChange={handleCardInputChange}
                            maxLength="5"
                            isInvalid={!!errors.expiry}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.expiry}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>CVV</Form.Label>
                          <Form.Control
                            type="password"
                            name="cvv"
                            placeholder="123"
                            value={cardForm.cvv}
                            onChange={handleCardInputChange}
                            maxLength="4"
                            isInvalid={!!errors.cvv}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.cvv}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Save this card for future payments"
                        checked={cardForm.saveCard}
                        onChange={(e) => setCardForm({ ...cardForm, saveCard: e.target.checked })}
                      />
                    </Form.Group>

                    {paymentMethods.length > 0 && (
                      <Button
                        variant="link"
                        className="mt-2 p-0"
                        onClick={() => setShowNewCardForm(false)}
                      >
                        ← Back to saved methods
                      </Button>
                    )}
                  </Form>
                </div>
              )}

              {/* Quick Payment Options */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="mb-3">Quick Pay with</h6>
                <div className="d-flex gap-2">
                  <Button variant="outline-dark" className="flex-fill">
                    <FaGooglePay size={24} /> Google Pay
                  </Button>
                  <Button variant="outline-dark" className="flex-fill">
                    <FaApplePay size={24} /> Apple Pay
                  </Button>
                  <Button variant="outline-dark" className="flex-fill">
                    <FaPaypal size={24} /> PayPal
                  </Button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="d-flex align-items-center gap-2 mt-4 text-muted small">
                <FaShieldAlt className="text-success" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary Sidebar */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
            <Card.Body className="p-4">
              <h5 className="mb-4">Order Summary</h5>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span>${bookingDetails?.amount || '0.00'}</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Service Fee</span>
                <span>$5.00</span>
              </div>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Tax</span>
                <span>$0.00</span>
              </div>
              
              <hr />
              
              <div className="d-flex justify-content-between mb-4">
                <strong>Total</strong>
                <h5 className="text-primary mb-0">
                  ${(bookingDetails?.amount + 5 || 0).toFixed(2)}
                </h5>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-100 mb-3"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaLock className="me-2" /> Pay ${(bookingDetails?.amount + 5 || 0).toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-center text-muted small mb-0">
                By completing this payment, you agree to our 
                <Link to="/terms" className="text-decoration-none"> Terms of Service</Link> and 
                <Link to="/privacy" className="text-decoration-none"> Privacy Policy</Link>
              </p>

              {/* Accepted Cards */}
              <div className="mt-4 text-center">
                <small className="text-muted d-block mb-2">We accept</small>
                <div className="d-flex justify-content-center gap-2">
                  <FaCcVisa size={30} className="text-secondary" />
                  <FaCcMastercard size={30} className="text-secondary" />
                  <FaCcAmex size={30} className="text-secondary" />
                  <FaCcDiscover size={30} className="text-secondary" />
                  <FaPaypal size={30} className="text-secondary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx="true">{`
        .payment-method-card {
          transition: all 0.2s ease;
        }
        .payment-method-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </Container>
  );
};

export default PaymentPage;