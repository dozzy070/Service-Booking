// src/pages/FAQ.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Accordion,
  Form,
  InputGroup,
  Button
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaQuestionCircle, FaUser, FaCreditCard, FaShieldAlt, FaCalendarAlt } from 'react-icons/fa';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const topRef = useRef(null);

  // ✅ Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const faqCategories = [
    {
      icon: <FaUser />,
      title: 'Account & Profile',
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the "Sign Up" button in the top right corner. Fill in your details including name, email, and password. You can sign up as either a customer or a service provider.'
        },
        {
          question: 'How do I reset my password?',
          answer: 'Click on "Forgot Password" on the login page. Enter your email address and we\'ll send you a link to reset your password.'
        },
        {
          question: 'Can I change my account type?',
          answer: 'Yes, you can upgrade from a customer to a provider account through your profile settings. Additional verification may be required.'
        }
      ]
    },
    {
      icon: <FaCalendarAlt />,
      title: 'Bookings',
      faqs: [
        {
          question: 'How do I book a service?',
          answer: 'Browse services, select your preferred date and time, and click "Book Now". You\'ll receive a confirmation once the provider accepts your booking.'
        },
        {
          question: 'Can I cancel a booking?',
          answer: 'Yes, you can cancel bookings from your dashboard. Cancellation policies vary by provider and may include fees for last-minute cancellations.'
        },
        {
          question: 'How do I reschedule a booking?',
          answer: 'Go to your bookings, select the booking you want to reschedule, and click "Reschedule". Choose a new time based on provider availability.'
        }
      ]
    },
    {
      icon: <FaCreditCard />,
      title: 'Payments',
      faqs: [
        {
          question: 'What payment methods are accepted?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Google Pay, and Apple Pay.'
        },
        {
          question: 'When will I be charged?',
          answer: 'Payment is processed when your booking is confirmed by the provider. For some services, you may be charged a deposit upfront.'
        },
        {
          question: 'How do refunds work?',
          answer: 'Refunds are processed based on the provider\'s cancellation policy. Once approved, refunds typically take 5-7 business days to appear on your statement.'
        }
      ]
    },
    {
      icon: <FaShieldAlt />,
      title: 'Safety & Security',
      faqs: [
        {
          question: 'Are providers verified?',
          answer: 'Yes, all providers undergo identity verification. Some providers may have additional certifications verified by our team.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely. We use industry-standard encryption and never store full payment details on our servers.'
        },
        {
          question: 'What if I have a dispute with a provider?',
          answer: 'Contact our support team immediately. We have a dispute resolution process to help resolve issues between customers and providers.'
        }
      ]
    }
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <>
      {/* ✅ Hidden anchor for scrolling */}
      <div ref={topRef} />
      
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col className="text-center">
            <h1 className="display-6 mb-3">Frequently Asked Questions</h1>
            <p className="text-muted">
              Find answers to common questions about using our platform
            </p>
          </Col>
        </Row>

        {/* Search */}
        <Row className="mb-5 justify-content-center">
          <Col md={6}>
            <InputGroup size="lg">
              <Form.Control
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="primary">
                <FaSearch />
              </Button>
            </InputGroup>
          </Col>
        </Row>

        {/* FAQ Categories */}
        <Row>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category, idx) => (
              <Col lg={6} key={idx} className="mb-4">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white border-0 py-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                        <span className="text-primary">{category.icon}</span>
                      </div>
                      <h5 className="mb-0">{category.title}</h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Accordion>
                      {category.faqs.map((faq, index) => (
                        <Accordion.Item eventKey={`${idx}-${index}`} key={index}>
                          <Accordion.Header>
                            <FaQuestionCircle className="text-primary me-2" size={14} />
                            {faq.question}
                          </Accordion.Header>
                          <Accordion.Body>
                            <p className="text-muted mb-0">{faq.answer}</p>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Card className="border-0 shadow-sm text-center py-5">
                <Card.Body>
                  <h5>No FAQs found</h5>
                  <p className="text-muted">
                    Try searching with different keywords
                  </p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Still Need Help */}
        <Row className="mt-5">
          <Col>
            <Card className="border-0 shadow-sm bg-primary text-white">
              <Card.Body className="p-5 text-center">
                <h3 className="mb-3">Still Need Help?</h3>
                <p className="mb-4">
                  Can't find the answer you're looking for? Our support team is here to help.
                </p>
                <Button
                  as={Link}
                  to="/contact"
                  variant="light"
                  size="lg"
                  className="px-5"
                >
                  Contact Support
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default FAQ;