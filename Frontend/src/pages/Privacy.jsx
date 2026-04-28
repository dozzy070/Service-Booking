import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Privacy = () => {
  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              <h1 className="mb-4">Privacy Policy</h1>
              <p className="text-muted mb-4">Last updated: January 1, 2024</p>

              <h5 className="mb-3">1. Introduction</h5>
              <p className="mb-4">
                SmartServices ("we," "our," or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our platform.
              </p>

              <h5 className="mb-3">2. Information We Collect</h5>
              <p className="mb-3">We collect the following types of information:</p>
              <ul className="mb-4">
                <li><strong>Personal Information:</strong> Name, email address, phone number, and payment information</li>
                <li><strong>Profile Information:</strong> Photos, bio, skills, and verification documents</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, bookings made, and services viewed</li>
                <li><strong>Device Information:</strong> IP address, browser type, and operating system</li>
                <li><strong>Location Information:</strong> With your permission, we may collect precise location data</li>
              </ul>

              <h5 className="mb-3">3. How We Use Your Information</h5>
              <p className="mb-3">We use your information to:</p>
              <ul className="mb-4">
                <li>Provide and maintain our services</li>
                <li>Process bookings and payments</li>
                <li>Verify user identities and credentials</li>
                <li>Communicate with you about bookings and platform updates</li>
                <li>Improve and personalize your experience</li>
                <li>Detect and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h5 className="mb-3">4. Sharing Your Information</h5>
              <p className="mb-3">We may share your information with:</p>
              <ul className="mb-4">
                <li><strong>Service Providers:</strong> When you book a service, relevant information is shared with the provider</li>
                <li><strong>Payment Processors:</strong> To process transactions securely</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Partners:</strong> With your consent, for marketing purposes</li>
              </ul>

              <h5 className="mb-3">5. Data Security</h5>
              <p className="mb-4">
                We implement industry-standard security measures to protect your information. This includes 
                encryption, secure socket layer technology (SSL), and regular security audits. However, no 
                method of transmission over the internet is 100% secure.
              </p>

              <h5 className="mb-3">6. Your Rights</h5>
              <p className="mb-3">You have the right to:</p>
              <ul className="mb-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>

              <h5 className="mb-3">7. Cookies and Tracking</h5>
              <p className="mb-4">
                We use cookies and similar tracking technologies to improve your experience, analyze usage, 
                and personalize content. You can control cookie settings through your browser.
              </p>

              <h5 className="mb-3">8. Third-Party Links</h5>
              <p className="mb-4">
                Our platform may contain links to third-party websites. We are not responsible for the 
                privacy practices or content of these sites.
              </p>

              <h5 className="mb-3">9. Children's Privacy</h5>
              <p className="mb-4">
                Our services are not intended for individuals under 18. We do not knowingly collect 
                information from children.
              </p>

              <h5 className="mb-3">10. International Data Transfers</h5>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place for such transfers.
              </p>

              <h5 className="mb-3">11. Changes to This Policy</h5>
              <p className="mb-4">
                We may update this Privacy Policy periodically. We will notify you of significant changes 
                through the platform or via email.
              </p>

              <h5 className="mb-3">12. Contact Us</h5>
              <p className="mb-0">
                If you have questions about this Privacy Policy, please contact us at:<br />
                Email: privacy@smartservices.com<br />
                Address: 123 Business Avenue, Suite 100, San Francisco, CA 94105
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Privacy;