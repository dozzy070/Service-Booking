// src/pages/PaymentMethods.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal } from 'react-bootstrap';
import { 
  FaCreditCard, FaPaypal, FaPlus, FaTrash, FaEdit, 
  FaCheckCircle, FaCcVisa, FaCcMastercard, FaCcAmex 
} from 'react-icons/fa';
import api from '../api';
import toast from 'react-hot-toast';

const PaymentMethods = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({
    totalSpent: 0,
    pendingPayments: 0,
    refunds: 0,
    walletBalance: 0
  });

  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: '',
    setAsDefault: false
  });

  useEffect(() => {
    fetchPaymentMethods();
    fetchPaymentSummary();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/customer/payment-methods');
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      const response = await api.get('/customer/payment-summary');
      setPaymentSummary(response.data);
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      // Non-critical, just log
    }
  };

  const getCardIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'visa': return <FaCcVisa size={32} className="text-primary" />;
      case 'mastercard': return <FaCcMastercard size={32} className="text-danger" />;
      case 'amex': return <FaCcAmex size={32} className="text-info" />;
      case 'paypal': return <FaPaypal size={32} className="text-primary" />;
      default: return <FaCreditCard size={32} className="text-secondary" />;
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/customer/payment-methods/${id}/default`);
      // Optimistic update
      setPaymentMethods(methods =>
        methods.map(method => ({
          ...method,
          isDefault: method.id === id
        }))
      );
      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to update default payment method');
      fetchPaymentMethods(); // revert on error
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;
    try {
      await api.delete(`/customer/payment-methods/${id}`);
      setPaymentMethods(methods => methods.filter(method => method.id !== id));
      toast.success('Payment method removed');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleAddCard = async () => {
    // Basic validation
    if (!newCard.cardNumber || !newCard.cardholderName || !newCard.expiry || !newCard.cvv) {
      toast.error('Please fill in all card details');
      return;
    }

    try {
      const response = await api.post('/customer/payment-methods', {
        cardNumber: newCard.cardNumber,
        cardholderName: newCard.cardholderName,
        expiry: newCard.expiry,
        cvv: newCard.cvv,
        setAsDefault: newCard.setAsDefault
      });

      const addedMethod = response.data;
      setPaymentMethods(prev => {
        let updated = [...prev, addedMethod];
        if (newCard.setAsDefault) {
          updated = updated.map(m => ({ ...m, isDefault: m.id === addedMethod.id }));
        }
        return updated;
      });

      setShowAddModal(false);
      setNewCard({
        cardNumber: '',
        cardholderName: '',
        expiry: '',
        cvv: '',
        setAsDefault: false
      });
      toast.success('Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(error.response?.data?.message || 'Failed to add payment method');
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Payment Methods</h2>
          <p className="text-muted">Manage your payment methods and preferences</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2" /> Add Payment Method
          </Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-4">Your Payment Methods</h5>
              {paymentMethods.length > 0 ? (
                paymentMethods.map(method => (
                  <div key={method.id} className="payment-method-card p-3 border rounded-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          {getCardIcon(method.type || method.brand)}
                        </div>
                        <div>
                          <h6 className="mb-1">
                            {method.type === 'paypal' ? 'PayPal' : `${method.brand || 'Card'} ending in ${method.last4}`}
                            {method.isDefault && (
                              <span className="badge bg-success ms-2">Default</span>
                            )}
                          </h6>
                          <p className="text-muted small mb-0">
                            {method.type === 'paypal' 
                              ? method.email 
                              : `Expires ${method.expiry} · ${method.cardholderName}`}
                          </p>
                        </div>
                      </div>
                      <div>
                        {!method.isDefault && (
                          <>
                            <Button 
                              variant="link" 
                              className="text-primary me-2"
                              onClick={() => handleSetDefault(method.id)}
                            >
                              Set as Default
                            </Button>
                            <Button 
                              variant="link" 
                              className="text-danger"
                              onClick={() => handleDelete(method.id)}
                            >
                              <FaTrash />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-5">
                  <FaCreditCard size={48} className="text-muted mb-3" />
                  <h6>No payment methods added</h6>
                  <p className="text-muted small">Add a payment method to get started</p>
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <FaPlus className="me-2" /> Add Payment Method
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">Payment Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total Spent</span>
                <span className="fw-bold">${paymentSummary.totalSpent.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Pending Payments</span>
                <span className="fw-bold text-warning">${paymentSummary.pendingPayments.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Refunds</span>
                <span className="fw-bold text-success">${paymentSummary.refunds.toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">Wallet Balance</span>
                <span className="fw-bold text-primary">${paymentSummary.walletBalance.toFixed(2)}</span>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Security Tips</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <FaCheckCircle className="text-success me-2" />
                  <small>Use strong passwords</small>
                </li>
                <li className="mb-2">
                  <FaCheckCircle className="text-success me-2" />
                  <small>Enable two-factor authentication</small>
                </li>
                <li className="mb-2">
                  <FaCheckCircle className="text-success me-2" />
                  <small>Monitor your transactions regularly</small>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Payment Method Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Payment Method</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Card Number</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="1234 5678 9012 3456" 
                value={newCard.cardNumber}
                onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                maxLength="19"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cardholder Name</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="John Doe" 
                value={newCard.cardholderName}
                onChange={(e) => setNewCard({...newCard, cardholderName: e.target.value})}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="MM/YY" 
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                    maxLength="5"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CVV</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="123" 
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    maxLength="4"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Set as default payment method" 
                checked={newCard.setAsDefault}
                onChange={(e) => setNewCard({...newCard, setAsDefault: e.target.checked})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCard}>
            Add Payment Method
          </Button>
        </Modal.Footer>
      </Modal>

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

export default PaymentMethods;