// src/pages/Terms.jsx
import React, { useEffect, useRef } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Terms = () => {
  const topRef = useRef(null);

  // ✅ Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return (
    <>
      {/* ✅ Hidden anchor for scrolling */}
      <div ref={topRef} />
      
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5">
                <h1 className="mb-4">Terms of Service</h1>
                <p className="text-muted mb-4">Last updated: January 1, 2024</p>

                <h5 className="mb-3">1. Acceptance of Terms</h5>
                <p className="mb-4">
                  By accessing or using SmartServices, you agree to be bound by these Terms of Service. 
                  If you do not agree to all the terms and conditions, you may not access or use our services.
                </p>

                <h5 className="mb-3">2. Description of Service</h5>
                <p className="mb-4">
                  SmartServices is an online platform that connects service providers with customers seeking 
                  various services. We provide the platform but are not directly involved in the actual service 
                  delivery between providers and customers.
                </p>

                <h5 className="mb-3">3. User Accounts</h5>
                <p className="mb-4">
                  To use certain features, you must create an account. You are responsible for maintaining 
                  the confidentiality of your account credentials and for all activities that occur under 
                  your account. You must be at least 18 years old to use our services.
                </p>

                <h5 className="mb-3">4. Provider Terms</h5>
                <p className="mb-4">
                  Service providers agree to:
                </p>
                <ul className="mb-4">
                  <li>Provide accurate information about their services and qualifications</li>
                  <li>Deliver services professionally and as described</li>
                  <li>Respond to booking requests in a timely manner</li>
                  <li>Maintain valid insurance and licenses where required</li>
                  <li>Not discriminate against any customer</li>
                </ul>

                <h5 className="mb-3">5. Customer Terms</h5>
                <p className="mb-4">
                  Customers agree to:
                </p>
                <ul className="mb-4">
                  <li>Provide accurate information when booking services</li>
                  <li>Pay for services as agreed</li>
                  <li>Treat providers with respect</li>
                  <li>Provide honest feedback through reviews</li>
                  <li>Not misuse the platform or engage in fraudulent activities</li>
                </ul>

                <h5 className="mb-3">6. Payments and Fees</h5>
                <p className="mb-4">
                  Payments are processed securely through our platform. We charge a service fee for each 
                  booking, which is clearly displayed before confirmation. Refunds are handled according to 
                  each provider's cancellation policy.
                </p>

                <h5 className="mb-3">7. Cancellations and Refunds</h5>
                <p className="mb-4">
                  Cancellation policies vary by provider and are displayed on each service page. Customers 
                  may cancel bookings according to these policies. Refunds are processed within 5-7 business 
                  days after approval.
                </p>

                <h5 className="mb-3">8. Dispute Resolution</h5>
                <p className="mb-4">
                  In case of disputes between customers and providers, we offer a mediation process. 
                  We encourage users to communicate directly first. If issues cannot be resolved, our 
                  support team will assist in finding a fair solution.
                </p>

                <h5 className="mb-3">9. Limitation of Liability</h5>
                <p className="mb-4">
                  SmartServices is not liable for any damages arising from the use of our platform or 
                  services provided by third-party providers. Our total liability is limited to the amount 
                  paid for the specific booking in question.
                </p>

                <h5 className="mb-3">10. Intellectual Property</h5>
                <p className="mb-4">
                  All content on the platform, including logos, designs, and software, is owned by 
                  SmartServices and protected by intellectual property laws.
                </p>

                <h5 className="mb-3">11. Termination</h5>
                <p className="mb-4">
                  We reserve the right to suspend or terminate accounts that violate these terms, engage 
                  in fraudulent activity, or harm other users or the platform.
                </p>

                <h5 className="mb-3">12. Changes to Terms</h5>
                <p className="mb-4">
                  We may modify these terms at any time. Continued use of the platform after changes 
                  constitutes acceptance of the new terms.
                </p>

                <h5 className="mb-3">13. Contact Information</h5>
                <p className="mb-0">
                  For questions about these Terms, please contact us at:<br />
                  Email: legal@smartservices.com<br />
                  Address: 123 Business Avenue, Suite 100, San Francisco, CA 94105
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Terms;