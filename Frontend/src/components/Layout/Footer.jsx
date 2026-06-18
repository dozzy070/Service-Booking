import React from 'react';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  Fa
  Fa
  Fa
  Fa
  FaGithub,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaArrowRight,
  FaHeart,
  FaClock,
  FaHeadset,
  FaShieldAlt,
  FaCreditCard,
  FaTruck
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'About Us', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contact', path: '/contact' },
    { label: 'Blog', path: '/blog' }
  ];

  const supportLinks = [
    { label: 'Help Center', path: '/help' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Safety Tips', path: '/safety' },
    { label: 'Report Issue', path: '/report' },
    { label: 'Cancellation Policy', path: '/cancellation' }
  ];

  const services = [
    { label: 'Home Cleaning', path: '/services?category=Cleaning' },
    { label: 'Plumbing', path: '/services?category=Plumbing' },
    { label: 'Electrical', path: '/services?category=Electrical' },
    { label: 'Painting', path: '/services?category=Painting' },
    { label: 'Moving', path: '/services?category=Moving' },
    { label: 'Gardening', path: '/services?category=Gardening' }
  ];

  const socialLinks = [
    { icon: <FaFacebook />, url: 'https://facebook.com', label: 'Facebook', color: '#1877f2' },
    { icon: <FaTwitter />, url: 'https://twitter.com', label: 'Twitter', color: '#1da1f2' },
    { icon: <FaInstagram />, url: 'https://instagram.com', label: 'Instagram', color: '#e4405f' },
    { icon: <FaLinkedin />, url: 'https://linkedin.com', label: 'LinkedIn', color: '#0077b5' },
    { icon: <FaGithub />, url: 'https://github.com', label: 'GitHub', color: '#333' }
  ];

  const contactInfo = [
    { icon: <FaPhone />, label: 'Phone', value: '+1 (234) 567-890', link: 'tel:+1234567890' },
    { icon: <FaEnvelope />, label: 'Email', value: 'support@smartservices.com', link: 'mailto:support@smartservices.com' },
    { icon: <FaMapMarkerAlt />, label: 'Office', value: '123 Business Ave, Suite 100, San Francisco, CA 94105', link: null },
    { icon: <FaClock />, label: 'Hours', value: 'Mon-Fri: 9am-6pm, Sat: 10am-4pm', link: null }
  ];

  const features = [
    { icon: <FaShieldAlt />, title: 'Secure Payments', desc: '100% secure transactions' },
    { icon: <FaHeadset />, title: '24/7 Support', desc: 'We are here to help' },
    { icon: <FaCreditCard />, title: 'Easy Booking', desc: 'Book in minutes' },
    { icon: <FaTruck />, title: 'On-Time Service', desc: 'Professionals arrive on time' }
  ];

  return (
    <footer className="footer bg-dark text-white-50 pt-5">
      <Container>
        {/* Features Bar */}
        <Row className="g-4 pb-5 border-bottom border-secondary">
          {features.map((feature, index) => (
            <Col md={3} key={index}>
              <div className="d-flex align-items-center">
                <div className="feature-icon me-3">
                  {feature.icon}
                </div>
                <div>
                  <h6 className="text-white mb-1">{feature.title}</h6>
                  <small>{feature.desc}</small>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Main Footer Content */}
        <Row className="g-4 py-5">
          {/* About Section */}
          <Col lg={3} md={6}>
            <h4 className="text-white mb-4">
              <span className="text-primary">Smart</span>Services
            </h4>
            <p className="mb-4">
              Your trusted platform for connecting with professional service providers. 
              We make it easy to find, book, and manage quality services all in one place.
            </p>
            
            {/* Social Links */}
            <div className="d-flex gap-2 mb-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label={social.label}
                  style={{ '--social-color': social.color }}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* App Store Badges */}
            <div className="d-flex gap-2">
              <img 
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                alt="App Store"
                style={{ height: '40px' }}
              />
              <img 
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                alt="Google Play"
                style={{ height: '40px' }}
              />
            </div>
          </Col>

          {/* Quick Links */}
          <Col lg={2} md={6}>
            <h5 className="text-white mb-4">Quick Links</h5>
            <ul className="list-unstyled">
              {quickLinks.map((link, index) => (
                <li key={index} className="mb-2">
                  <Link to={link.path} className="footer-link">
                    <FaArrowRight className="me-2" size={12} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Services */}
          <Col lg={2} md={6}>
            <h5 className="text-white mb-4">Popular Services</h5>
            <ul className="list-unstyled">
              {services.map((service, index) => (
                <li key={index} className="mb-2">
                  <Link to={service.path} className="footer-link">
                    <FaArrowRight className="me-2" size={12} />
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Support */}
          <Col lg={2} md={6}>
            <h5 className="text-white mb-4">Support</h5>
            <ul className="list-unstyled">
              {supportLinks.map((link, index) => (
                <li key={index} className="mb-2">
                  <Link to={link.path} className="footer-link">
                    <FaArrowRight className="me-2" size={12} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>

          {/* Contact Info */}
          <Col lg={3} md={12}>
            <h5 className="text-white mb-4">Contact Us</h5>
            
            {contactInfo.map((item, index) => (
              <div key={index} className="d-flex mb-3">
                <div className="contact-icon me-3">
                  {item.icon}
                </div>
                <div>
                  <div className="small text-white-50">{item.label}</div>
                  {item.link ? (
                    <a href={item.link} className="footer-link">
                      {item.value}
                    </a>
                  ) : (
                    <span>{item.value}</span>
                  )}
                </div>
              </div>
            ))}

            {/* Newsletter */}
            <h6 className="text-white mt-4 mb-3">Subscribe to Newsletter</h6>
            <InputGroup className="newsletter-input">
              <Form.Control
                type="email"
                placeholder="Your email address"
                className="bg-dark border-secondary text-white"
              />
              <Button variant="primary" className="px-4">
                Subscribe
              </Button>
            </InputGroup>
            <small className="text-white-50 mt-2 d-block">
              Get updates on new services and special offers
            </small>
          </Col>
        </Row>

        {/* Bottom Bar */}
        <Row className="py-4 border-top border-secondary align-items-center">
          <Col md={4} className="text-center text-md-start mb-3 mb-md-0">
            <p className="mb-0 small">
              &copy; {currentYear} SmartServices. All rights reserved.
            </p>
          </Col>
          <Col md={4} className="text-center mb-3 mb-md-0">
            <p className="mb-0 small">
              Made with <FaHeart className="text-danger mx-1" /> in San Francisco
            </p>
          </Col>
          <Col md={4} className="text-center text-md-end">
            <Link to="/terms" className="footer-link small me-3">Terms</Link>
            <Link to="/privacy" className="footer-link small me-3">Privacy</Link>
            <Link to="/cookies" className="footer-link small me-3">Cookies</Link>
            <Link to="/sitemap" className="footer-link small">Sitemap</Link>
          </Col>
        </Row>
      </Container>

      <style jsx="true">{`
        .footer {
          position: relative;
          overflow: hidden;
        }

        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
          background-size: 200% 100%;
          animation: gradientMove 3s linear infinite;
        }

        @keyframes gradientMove {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
          font-size: 0.9rem;
        }

        .footer-link:hover {
          color: #667eea;
          transform: translateX(5px);
        }

        .social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 50%;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .social-link:hover {
          background: var(--social-color, #667eea);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .contact-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .contact-icon:hover {
          background: #667eea;
          color: white;
          transform: scale(1.1);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border-radius: 12px;
          font-size: 1.5rem;
          transition: all 0.3s ease;
        }

        .feature-icon:hover {
          background: #667eea;
          color: white;
          transform: rotate(360deg);
        }

        .newsletter-input .form-control {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05) !important;
          color: white !important;
        }

        .newsletter-input .form-control:focus {
          border-color: #667eea;
          box-shadow: none;
        }

        .newsletter-input .btn {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .border-top {
          border-top-color: rgba(255, 255, 255, 0.1) !important;
        }

        @media (max-width: 768px) {
          .feature-icon {
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;