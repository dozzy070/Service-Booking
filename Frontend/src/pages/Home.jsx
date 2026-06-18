// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Badge,
  Navbar,
  Nav,
  Accordion,
  Modal
} from 'react-bootstrap';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaStar,
  FaUsers,
  FaCalendarCheck,
  FaShieldAlt,
  FaArrowRight,
  FaCheckCircle,
  FaCode,
  FaNetworkWired,
  FaChalkboardTeacher,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaEnvelope as FaEmail,
  FaApple,
  FaAndroid,
  FaDownload,
  FaGift,
  FaHandshake,
  FaTools,
  FaBuilding,
  FaCheckDouble,
  FaQrcode
} from 'react-icons/fa';
import { getServiceImage, getInitialsImage } from '../utils/imageUtils';
import logo from '../assets/smart service logo.png';
import heroImage from '../assets/smart 2.png';

const formatCurrency = (amount) => {
  return `₦${amount}`;
};

// ----- Mock Adverts (4 ads) -----
const mockAdverts = [
  {
    id: 'ad1',
    isAd: true,
    title: '🔥 Hot Offer',
    description: 'Get 20% off your first booking! Use code: FIRST20',
    buttonText: 'Claim Now',
    buttonLink: '/login',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: 'white'
  },
  {
    id: 'ad2',
    isAd: true,
    title: '📱 Download our App',
    description: 'Manage bookings, track services, and get exclusive mobile offers!',
    buttonText: 'Get the App',
    buttonLink: '#',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    textColor: 'white',
    isDownload: true
  },
  {
    id: 'ad3',
    isAd: true,
    title: '🎁 Refer a Friend',
    description: 'Earn ₦50 credit for every friend who books a service!',
    buttonText: 'Invite Now',
    buttonLink: '#',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    textColor: 'white',
    isReferral: true
  },
  {
    id: 'ad4',
    isAd: true,
    title: '🏆 Premium Membership',
    description: 'Unlock exclusive benefits & priority support. Join today!',
    buttonText: 'Learn More',
    buttonLink: '#',
    bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    textColor: 'white',
    isPartnership: true
  }
];

// Helper: merge ads into services list (ensure ads always appear, even if no services)
const getMergedList = (services) => {
  const result = [];
  const ads = [...mockAdverts];
  const insertEvery = 2;
  if (services.length === 0) {
    return ads.map(ad => ({ ...ad, isAd: true }));
  }
  for (let i = 0; i < services.length; i++) {
    result.push(services[i]);
    if ((i + 1) % insertEvery === 0 && ads.length) {
      result.push({ ...ads.shift(), isAd: true });
    }
  }
  if (ads.length) result.push(...ads.map(ad => ({ ...ad, isAd: true })));
  return result;
};

// Advert Card component (handles different button behaviours)
const AdCard = ({ advert, onDownloadClick, onReferralClick, onPartnershipClick }) => {
  const handleClick = (e) => {
    if (advert.isDownload) {
      e.preventDefault();
      onDownloadClick();
    } else if (advert.isReferral) {
      e.preventDefault();
      onReferralClick();
    } else if (advert.isPartnership) {
      e.preventDefault();
      onPartnershipClick();
    }
  };

  return (
    <Card className="h-100 border-0 shadow-sm" style={{ background: advert.bgColor, color: advert.textColor }}>
      <Card.Body className="text-center d-flex flex-column justify-content-center">
        <h4 className="mb-3">{advert.title}</h4>
        <p className="mb-4">{advert.description}</p>
        <Button
          as={advert.isDownload || advert.isReferral || advert.isPartnership ? 'button' : Link}
          to={advert.isDownload || advert.isReferral || advert.isPartnership ? undefined : advert.buttonLink}
          variant="light"
          className="rounded-pill mx-auto"
          onClick={handleClick}
        >
          {advert.buttonText} <FaArrowRight className="ms-2" size={12} />
        </Button>
      </Card.Body>
    </Card>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [featuredServices, setFeaturedServices] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const categoryMeta = {
    Cleaning: { icon: '🧹', color: '#3b82f6' },
    Plumbing: { icon: '🔧', color: '#10b981' },
    Electrical: { icon: '⚡', color: '#f59e0b' },
    Painting: { icon: '🎨', color: '#ef4444' },
    Gardening: { icon: '🌱', color: '#8b5cf6' },
    Moving: { icon: '📦', color: '#ec4899' },
    Tutoring: { icon: '📚', color: '#14b8a6' },
    Photography: { icon: '📸', color: '#f97316' },
  };

  const getCategoryMeta = (name) => categoryMeta[name] || { icon: '🛠️', color: '#6c757d' };

  // Specialized services data
  const specializedServices = [
    { name: 'Plumbing', image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400', slug: 'plumbing' },
    { name: 'Electrical', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400', slug: 'electrical' },
    { name: 'HVAC', image: 'https://images.unsplash.com/photo-1558317374-067fb0f30001?w=400', slug: 'hvac' },
    { name: 'Flooring', image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952c?w=400', slug: 'flooring' },
    { name: 'Painting', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', slug: 'painting' },
    { name: 'Moving', image: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=400', slug: 'moving' },
    { name: 'Gardening', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400', slug: 'gardening' }
  ];

  // Modal content generator
  const getModalContent = (serviceName) => {
    const slug = serviceName.toLowerCase();
    const contentMap = {
      plumbing: {
        title: '🚰 Professional Plumbing Services',
        description: `Our licensed plumbers provide comprehensive solutions for residential and commercial properties. From leaky faucets to complete pipe installations, we handle every job with precision and care. We use only high‑quality materials and modern diagnostic tools to ensure lasting results.`,
        reasons: [
          '24/7 emergency response – we never leave you with a burst pipe',
          'Transparent upfront pricing with no hidden fees',
          'Licensed, insured, and background‑checked technicians',
          'Warranty on all repairs and installations',
          'Eco‑friendly solutions to save water and reduce bills'
        ],
        maintenance: `Regular plumbing maintenance prevents costly emergencies. We offer annual inspection plans that include drain cleaning, pressure checks, and leak detection. Keeping your system in top shape extends its life and improves efficiency.`,
        building: `For new builds or major renovations, we provide full‑service plumbing design and installation. Our team works closely with architects and contractors to deliver code‑compliant, high‑performance systems that stand the test of time.`
      },
      electrical: {
        title: '⚡ Expert Electrical Services',
        description: `Safety and reliability are paramount in electrical work. Our electricians are certified and experienced in everything from rewiring old homes to installing smart home systems. We follow strict safety protocols and use premium components.`,
        reasons: [
          'Fully licensed and insured with years of experience',
          'Same‑day service for most electrical issues',
          'Up‑front pricing with detailed quotes',
          'Energy‑efficient solutions that lower your bills',
          'Emergency service available 24/7'
        ],
        maintenance: `Routine electrical inspections catch problems before they cause fires or outages. Our maintenance plans include panel checks, circuit testing, and surge protection upgrades. A well‑maintained system is a safe system.`,
        building: `From new construction to commercial build‑outs, we design and install electrical systems that are scalable, code‑compliant, and future‑ready. We work on schedule and within budget.`
      },
      hvac: {
        title: '❄️ HVAC Installation & Repair',
        description: `Keep your property comfortable year‑round with our professional heating, ventilation, and air conditioning services. We install, maintain, and repair all major brands, ensuring energy efficiency and indoor air quality.`,
        reasons: [
          '24/7 emergency AC and heating repair',
          'Certified technicians with years of experience',
          'Energy‑efficient system upgrades – save up to 30% on bills',
          'Free consultation and accurate quotes',
          'Maintenance plans to extend equipment life'
        ],
        maintenance: `Regular filter changes, coil cleaning, and system checks prevent breakdowns and maintain efficiency. Our annual maintenance plans include two tune‑ups and priority service.`,
        building: `For new construction or major renovations, we design and install complete HVAC systems tailored to the building’s size and usage. We work with architects to meet all codes and energy standards.`
      },
      flooring: {
        title: '🪵 Professional Flooring Services',
        description: `From hardwood to laminate, tile to luxury vinyl, our flooring experts provide flawless installation and restoration. We help you choose the best material for your space and budget, then handle every step with precision.`,
        reasons: [
          'Free on‑site measurement and consultation',
          'Wide range of materials – wood, tile, carpet, vinyl, laminate',
          'Professional subfloor preparation and moisture barriers',
          'Clean, efficient installation with minimal disruption',
          'Repair and refinishing services available'
        ],
        maintenance: `We offer cleaning, sealing, and refinishing services to keep your floors beautiful. Regular maintenance extends the life of your investment by years.`,
        building: `For commercial or residential developments, we provide large‑scale flooring installation with fast turnaround. Volume discounts and project management included.`
      },
      painting: {
        title: '🎨 Professional Painting Services',
        description: `Interior or exterior, residential or commercial – our painters deliver flawless finishes. We prepare surfaces meticulously, use premium paints, and protect your furniture and floors. Color consultation is included.`,
        reasons: [
          'Detailed surface preparation (sanding, patching, priming)',
          'High‑quality, low‑VOC paints for safe indoor air',
          'Clean, tidy work area with drop cloths and tape',
          'Punctual and reliable crews',
          'Satisfaction guaranteed with free touch‑ups'
        ],
        maintenance: `Periodic repainting protects walls from moisture and wear. Our maintenance plans include annual inspections and touch‑ups to keep your property looking fresh.`,
        building: `For new construction, we provide complete painting packages aligned with your design specifications. We work efficiently to stay on schedule without compromising quality.`
      },
      moving: {
        title: '🚚 Professional Moving Services',
        description: `Moving can be stressful – we make it easy. Our experienced movers handle everything from packing to unloading, including heavy furniture, fragile items, and specialty pieces. We have all the equipment and trucks.`,
        reasons: [
          'Free on‑site estimate with no obligation',
          'Fully licensed and insured for your peace of mind',
          'Packing materials provided, or we can pack for you',
          'No hidden fees – hourly or flat rates available',
          'Trained, courteous staff who treat your belongings with care'
        ],
        maintenance: `Not applicable for moving, but we offer storage solutions and unpacking services to help you settle in faster.`,
        building: `We coordinate with contractors and property managers for large‑scale moves (office buildings, apartment complexes). Our logistics team ensures minimal downtime.`
      },
      gardening: {
        title: '🌿 Professional Gardening & Landscaping',
        description: `From lawn care to full garden design, our horticulturists and landscapers bring beauty to your outdoor spaces. We offer planting, pruning, weeding, mulching, and hardscaping (patios, walkways). All work is done with sustainability in mind.`,
        reasons: [
          'Personalized garden plans based on your climate and soil',
          'Use of organic fertilizers and pest control',
          'Regular maintenance schedules to keep gardens pristine',
          'Water‑efficient irrigation systems',
          'Year‑round care, including winter protection'
        ],
        maintenance: `Weekly or bi‑weekly lawn mowing, hedge trimming, weeding, and leaf removal keep your property looking its best. We also offer seasonal clean‑ups and mulching.`,
        building: `For new developments, we provide complete landscaping design and installation, including grading, sodding, planting, and irrigation. We work with architects to enhance curb appeal.`
      }
    };
    return contentMap[slug] || {
      title: `${serviceName} Services`,
      description: `Professional ${serviceName} services tailored to your needs.`,
      reasons: ['Certified professionals', 'Competitive pricing', 'Guaranteed satisfaction'],
      maintenance: `Regular maintenance plans available.`,
      building: `Full‑service for new construction.`
    };
  };

  const handleViewService = (serviceName) => {
    setSelectedService({ name: serviceName, content: getModalContent(serviceName) });
    setShowModal(true);
  };

  // Social sharing for referral modal
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`, '_blank');
  };
  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=Check%20out%20Smart%20Services%20for%20all%20your%20building%20and%20maintenance%20needs!&url=${encodeURIComponent(window.location.origin)}`, '_blank');
  };
  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`, '_blank');
  };
  const shareOnWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=Check%20out%20Smart%20Services%20for%20all%20your%20building%20and%20maintenance%20needs!%20${encodeURIComponent(window.location.origin)}`, '_blank');
  };
  const shareByEmail = () => {
    window.location.href = `mailto:?subject=Smart%20Services%20Recommendation&body=I%20thought%20you%20might%20like%20Smart%20Services%20for%20your%20building%20and%20maintenance%20needs.%20Check%20them%20out%3A%20${encodeURIComponent(window.location.origin)}`;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.map(category => ({
          ...category,
          count: category.serviceCount ?? category.service_count ?? 0,
          icon: category.icon || getCategoryMeta(category.name).icon,
          color: category.color || getCategoryMeta(category.name).color
        })));
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([
          { name: 'Cleaning', count: 4, icon: '🧹', color: '#3b82f6' },
          { name: 'Plumbing', count: 4, icon: '🔧', color: '#10b981' },
          { name: 'Electrical', count: 4, icon: '⚡', color: '#f59e0b' },
          { name: 'Painting', count: 4, icon: '🎨', color: '#ef4444' },
          { name: 'Gardening', count: 4, icon: '🌱', color: '#8b5cf6' },
          { name: 'Moving', count: 4, icon: '📦', color: '#ec4899' }
        ]);
      }
    };

    const fetchPopularServices = async () => {
      try {
        const response = await api.get('/services/popular', { params: { limit: 8 } });
        setFeaturedServices(response.data.map(service => ({
          ...service,
          rating: parseFloat(service.average_rating ?? service.avg_rating ?? service.rating ?? 0),
          reviewCount: parseInt(service.review_count ?? service.reviewCount ?? 0, 10),
          provider: service.provider || service.provider_name || 'Service Provider',
          category: service.category || service.category_name || 'General'
        })));
      } catch (error) {
        console.error('Failed to load popular services:', error);
        setFeaturedServices([]);
      }
    };

    fetchCategories();
    fetchPopularServices();
  }, []);

  const stats = [
    { icon: <FaUsers />, value: '50K+', label: 'Happy Customers' },
    { icon: <FaCalendarCheck />, value: '100K+', label: 'Bookings Completed' },
    { icon: <FaShieldAlt />, value: '10K+', label: 'Verified Pros' },
    { icon: <FaStar />, value: '4.8', label: 'Average Rating' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const ServiceCard = ({ service }) => {
    const [imgError, setImgError] = useState(false);

    const handleError = (e) => {
      if (!imgError) {
        setImgError(true);
        const initials = service.title.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
        e.target.src = getInitialsImage(initials, service.category);
      }
    };

    return (
      <Card className="h-100 border-0 service-card">
        <div className="position-relative">
          <Card.Img
            variant="top"
            src={getServiceImage(service.title, service.id, 400, 250)}
            style={{ height: '200px', objectFit: 'cover' }}
            alt={service.title}
            onError={handleError}
          />
          <Badge bg="primary" className="position-absolute top-0 end-0 m-3" pill>
            {service.category}
          </Badge>
        </div>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="h5 mb-0">{service.title}</Card.Title>
          </div>
          <p className="text-muted small mb-2">by {service.provider}</p>
          <p className="text-muted small mb-3">{service.description}</p>
          <div className="d-flex align-items-center mb-3">
            <div className="text-warning me-2">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.floor(service.rating) ? 'text-warning' : 'text-secondary'}
                  size={14}
                />
              ))}
            </div>
            <small className="text-muted">({service.reviewCount} reviews)</small>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted small">Starting from</span>
              <h4 className="text-primary mb-0">{formatCurrency(service.price)}</h4>
            </div>
            <Button as={Link} to={`/services/${service.id}`} variant="outline-primary" className="rounded-pill">
              View Details <FaArrowRight className="ms-2" size={12} />
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const CategoryCard = ({ category }) => {
    const meta = getCategoryMeta(category.name);
    return (
      <Card
        as={Link}
        to={`/services?category=${encodeURIComponent(category.slug || category.name)}`}
        className="border-0 category-card text-center text-decoration-none h-100"
        style={{ backgroundColor: `${meta.color}15` }}
      >
        <Card.Body>
          <div className="category-icon mb-3" style={{ fontSize: '2.5rem', color: meta.color }}>
            {meta.icon}
          </div>
          <h5 className="mb-2">{category.name}</h5>
          <p className="text-muted small mb-0">
            {category.count ? `${category.count}+ services` : 'Browse services'}
          </p>
        </Card.Body>
      </Card>
    );
  };

  const mergedServiceList = getMergedList(featuredServices);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section position-relative overflow-hidden">
        <div className="hero-gradient"></div>
        <Container className="position-relative" style={{ zIndex: 2 }}>
          <Navbar expand="lg" variant="dark" className="pt-4 pb-4">
            <Navbar.Brand as={Link} to="/" className="fw-bold fs-3">
              <img src={logo} alt="Company Logo" height="40" className="d-inline-block align-top" />
              Smart<span className="text-warning">Services</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto align-items-center gap-3">
                <Nav.Link as={Link} to="/" className="text-white">Home</Nav.Link>
                <Nav.Link as={Link} to="/about" className="text-white">About</Nav.Link>
                <Nav.Link as={Link} to="/services" className="text-white">Services</Nav.Link>
                <Nav.Link as={Link} to="/faq" className="text-white">Faq</Nav.Link>
                <Nav.Link as={Link} to="/contact" className="text-white">Contact</Nav.Link>
                <Button as={Link} to="/login" variant="outline-light" size="sm" className="rounded-pill px-3">
                  Login
                </Button>
                <Button as={Link} to="/register" variant="warning" size="sm" className="rounded-pill px-4 fw-bold">
                  Sign Up
                </Button>
              </Nav>
            </Navbar.Collapse>
          </Navbar>

          <Row className="align-items-center min-vh-100 py-5">
            <Col lg={7} className="text-white mb-5 mb-lg-0">
              <Badge bg="warning" text="dark" className="mb-4 px-4 py-2 fs-6 fw-bold">
                ⚡ PROVIDING PREMIUM SOLUTIONS
              </Badge>
              <h1 className="display-3 fw-bold mb-4">
                Complete Building And Maintenance Services
                <br />
                <span className="text-warning"> Efficient, Affordable And Professional</span>
              </h1>
              <p className="lead mb-5 opacity-90 fs-4">Building Better. Maintaining Smarter...</p>

              <Row className="g-4 mb-5">
                <Col md={4}>
                  <Card className="bg-white bg-opacity-10 border-0 text-white h-100" style={{ backdropFilter: 'blur(10px)' }}>
                    <Card.Body className="text-center">
                      <FaCode className="fs-1 mb-3 text-warning" />
                      <h5 className="fw-bold">Trusted Partner in Building & Maintenance</h5>
                      <p className="small opacity-75 mb-0">We Build It. We Fix It. We Maintain It</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-white bg-opacity-10 border-0 text-white h-100" style={{ backdropFilter: 'blur(10px)' }}>
                    <Card.Body className="text-center">
                      <FaNetworkWired className="fs-1 mb-3 text-warning" />
                      <h5 className="fw-bold">Strong & Running Smoothly</h5>
                      <p className="small opacity-75 mb-0">Enterprise-Grade Infrastructure</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-white bg-opacity-10 border-0 text-white h-100" style={{ backdropFilter: 'blur(10px)' }}>
                    <Card.Body className="text-center">
                      <FaChalkboardTeacher className="fs-1 mb-3 text-warning" />
                      <h5 className="fw-bold">Training & Consultation</h5>
                      <p className="small opacity-75 mb-0">Expert guidance and personalized support</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="d-flex gap-3">
                <Button as={Link} to="/solutions" variant="warning" size="lg" className="rounded-pill px-5 py-3 fw-bold fs-5">
                  Explore Our Solutions <FaArrowRight className="ms-2" />
                </Button>
                <Button as={Link} to="/register" variant="outline-light" size="lg" className="rounded-pill px-5 py-3 fw-bold fs-5">
                  Get Started Free
                </Button>
              </div>
            </Col>
            <Col lg={5} className="mt-4 mt-lg-0">
              <div className="hero-image-container text-center">
                <img
                  src={heroImage}
                  alt="Technology solutions"
                  className="img-fluid rounded-4 shadow-lg mx-auto"
                  style={{ maxWidth: '100%', height: 'auto', transform: 'rotate(2deg)' }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="g-4">
            {stats.map((stat, index) => (
              <Col md={3} key={index}>
                <Card className="border-0 text-center bg-light border-0">
                  <Card.Body>
                    <div className="text-primary mb-3" style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
                    <h2 className="fw-bold mb-2">{stat.value}</h2>
                    <p className="text-muted mb-0">{stat.label}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="primary" className="mb-3 px-3 py-2">Categories</Badge>
              <h2 className="display-6 fw-bold mb-3">Browse by Category</h2>
              <p className="text-muted lead">Find the perfect service for your needs</p>
            </Col>
          </Row>
          <Row className="g-4">
            {categories.map((category, index) => (
              <Col md={3} key={index}>
                <CategoryCard category={category} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Services with mock adverts */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="mb-5">
            <Col md={8}>
              <Badge bg="warning" text="dark" className="mb-3 px-3 py-2">Featured</Badge>
              <h2 className="display-6 fw-bold mb-3">Popular Services</h2>
              <p className="text-muted lead">Most booked services this week</p>
            </Col>
            <Col md={4} className="text-md-end align-self-center">
              <Button as={Link} to="/services" variant="outline-primary" size="lg" className="rounded-pill">
                View All Services <FaArrowRight className="ms-2" />
              </Button>
            </Col>
          </Row>
          <Row xs={2} md={2} lg={3} className="g-4">
            {mergedServiceList.map(item => (
              <Col key={item.id}>
                {item.isAd ? (
                  <AdCard
                    advert={item}
                    onDownloadClick={() => setShowDownloadModal(true)}
                    onReferralClick={() => setShowReferralModal(true)}
                    onPartnershipClick={() => setShowPartnershipModal(true)}
                  />
                ) : (
                  <ServiceCard service={item} />
                )}
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Specialized Services Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="success" className="mb-3 px-3 py-2">Specialized Services</Badge>
              <h2 className="display-6 fw-bold mb-3">Expert Solutions for Every Need</h2>
              <p className="text-muted lead">High‑quality work by certified professionals</p>
            </Col>
          </Row>
          <Row className="g-4">
            {specializedServices.map((trade, idx) => (
              <Col md={6} lg={3} key={idx}>
                <Card className="border-0 shadow-sm trade-card h-100">
                  <Card.Img
                    variant="top"
                    src={trade.image}
                    style={{ height: '180px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://picsum.photos/id/20/400/200'; }}
                  />
                  <Card.Body className="text-center">
                    <h5 className="mb-3">{trade.name}</h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill"
                      onClick={() => handleViewService(trade.name)}
                    >
                      View Services <FaArrowRight className="ms-2" size={12} />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="info" className="mb-3 px-3 py-2">Simple Process</Badge>
              <h2 className="display-6 fw-bold mb-3">How It Works</h2>
              <p className="text-muted lead">Get your service in four simple steps</p>
            </Col>
          </Row>
          <Row className="g-4">
            {[
              { step: '01', title: 'Search', description: 'Find the service you need', icon: '🔍' },
              { step: '02', title: 'Compare', description: 'Review profiles and prices', icon: '📊' },
              { step: '03', title: 'Book', description: 'Schedule your service', icon: '📅' },
              { step: '04', title: 'Relax', description: 'Get the job done', icon: '😌' }
            ].map((item, index) => (
              <Col md={3} key={index}>
                <Card className="border-0 text-center h-100">
                  <Card.Body>
                    <div className="step-number mb-3">{item.step}</div>
                    <div className="step-icon mb-3">{item.icon}</div>
                    <h5 className="mb-2">{item.title}</h5>
                    <p className="text-muted mb-0">{item.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Contact Section */}
      <section className="py-5 bg-light" id="contact">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="danger" className="mb-3 px-3 py-2">Get In Touch</Badge>
              <h2 className="display-6 fw-bold mb-3">Contact Us</h2>
              <p className="text-muted lead">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            </Col>
          </Row>
          <Row className="g-5">
            <Col lg={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <h4 className="mb-4">Contact Information</h4>
                  <div className="mb-4 d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <FaMapMarkerAlt className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="mb-1">Address</h6>
                      <p className="text-muted mb-0">123 Tech Street, Silicon Valley, CA 94025</p>
                    </div>
                  </div>
                  <div className="mb-4 d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <FaPhone className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="mb-1">Phone</h6>
                      <p className="text-muted mb-0">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="mb-4 d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <FaEnvelope className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="mb-1">Email</h6>
                      <p className="text-muted mb-0">hello@signaturesolution.com</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={7}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                  <h4 className="mb-4">Send us a Message</h4>
                  <Form>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Label>Name</Form.Label>
                        <Form.Control type="text" placeholder="Your name" />
                      </Col>
                      <Col md={6}>
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" placeholder="Your email" />
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control type="text" placeholder="Subject" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Message</Form.Label>
                      <Form.Control as="textarea" rows={5} placeholder="Your message" />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="px-4">
                      Send Message <FaArrowRight className="ms-2" />
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-5 bg-white">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <Badge bg="info" className="mb-3 px-3 py-2">FAQ</Badge>
              <h2 className="display-6 fw-bold mb-3">Frequently Asked Questions</h2>
              <p className="text-muted lead">Find answers to common questions about our services</p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>What technology solutions do you offer?</Accordion.Header>
                  <Accordion.Body>
                    We offer comprehensive technology solutions including web design, networking, IT consulting, cloud services, cybersecurity, and custom software development.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>How long does implementation take?</Accordion.Header>
                  <Accordion.Body>
                    Web projects take 4‑8 weeks; larger enterprise solutions 3‑6 months. We provide detailed timelines during consultation.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Do you provide ongoing support?</Accordion.Header>
                  <Accordion.Body>
                    Yes, we offer 24/7 monitoring, updates, security patches, and dedicated support for all our solutions.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                  <Accordion.Header>What industries do you specialize in?</Accordion.Header>
                  <Accordion.Body>
                    Hospitality, healthcare, finance, e‑commerce, and education – with customised solutions for each.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="4">
                  <Accordion.Header>How do I get started?</Accordion.Header>
                  <Accordion.Body>
                    Click "Get Started", fill the form, and a consultant will reach out within 24h for a free consultation.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="5">
                  <Accordion.Header>What is your pricing model?</Accordion.Header>
                  <Accordion.Body>
                    Fixed project pricing, hourly consulting, or monthly retainers – we provide a transparent quote after understanding your needs.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container>
          <Row className="align-items-center text-white">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="display-6 fw-bold mb-3">Ready to transform your business?</h2>
              <p className="lead mb-0 opacity-90">Join thousands of enterprises using our premium technology solutions.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/register" variant="light" size="lg" className="px-5 fw-bold me-2">Sign Up</Button>
              <Button as={Link} to="/login" variant="outline-light" size="lg" className="px-5 fw-bold">Login</Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ========== MODALS (Enhanced UI/UX) ========== */}

      {/* 1. Specialized Service Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="professional-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {selectedService?.content.title || 'Service Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {selectedService && (
            <>
              <div className="service-modal-icon text-center mb-3">
                <FaTools size={48} className="text-primary" />
              </div>
              <p className="lead">{selectedService.content.description}</p>
              <div className="bg-light p-3 rounded-3 mb-4">
                <h5 className="fw-bold mb-3"><FaCheckDouble className="text-success me-2" />Why Book With Us?</h5>
                <ul className="mb-0">
                  {selectedService.content.reasons.map((reason, idx) => (
                    <li key={idx} className="mb-2">{reason}</li>
                  ))}
                </ul>
              </div>
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <div className="border rounded-3 p-3 h-100">
                    <h5 className="fw-bold"><FaBuilding className="text-primary me-2" />Regular Maintenance</h5>
                    <p className="mb-0">{selectedService.content.maintenance}</p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="border rounded-3 p-3 h-100">
                    <h5 className="fw-bold"><FaBuilding className="text-primary me-2" />Building & Construction</h5>
                    <p className="mb-0">{selectedService.content.building}</p>
                  </div>
                </Col>
              </Row>
              <div className="text-center text-muted fst-italic mt-3 p-3 bg-white rounded-3 shadow-sm">
                <FaShieldAlt className="me-2 text-primary" /> Trust our certified professionals – quality guaranteed.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} className="rounded-pill px-4">Close</Button>
          <Button as={Link} to="/contact" variant="primary" className="rounded-pill px-4">Request a Quote →</Button>
        </Modal.Footer>
      </Modal>

      {/* 2. Download App Modal (with real store links) */}
      <Modal show={showDownloadModal} onHide={() => setShowDownloadModal(false)} centered className="professional-modal">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="fw-bold"><FaDownload className="me-2" /> Download Our App</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <p className="lead mb-4">Get the best experience with our mobile app. Book services, track progress, receive offers, and manage everything on the go.</p>
          <div className="d-flex justify-content-center flex-wrap gap-3 mb-4">
            <Button as="a" href="https://apps.apple.com/app/idXXXXX" target="_blank" variant="dark" className="rounded-pill px-4 py-2">
              <FaApple className="me-2" size={20} /> App Store
            </Button>
            <Button as="a" href="https://play.google.com/store/apps/details?id=com.smartservices" target="_blank" variant="dark" className="rounded-pill px-4 py-2">
              <FaAndroid className="me-2" size={20} /> Google Play
            </Button>
            <Button as="a" href="https://smartservices.com/app.apk" target="_blank" variant="secondary" className="rounded-pill px-4 py-2">
              <FaDownload className="me-2" /> APK Direct
            </Button>
          </div>
          <p className="text-muted small">(Replace the above links with your actual store URLs)</p>
          <div className="bg-light p-3 rounded-3">
            <FaQrcode size={80} className="text-muted mb-2" />
            <p className="mb-0">Scan QR code to download instantly</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowDownloadModal(false)} className="rounded-pill">Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 3. Referral Modal (Social Share) */}
      <Modal show={showReferralModal} onHide={() => setShowReferralModal(false)} centered className="professional-modal">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold"><FaGift className="text-warning me-2" /> Refer a Friend, Earn ₦50</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="lead">Share Smart Services with your friends and earn <strong className="text-success">₦50 credit</strong> for every friend who books a service!</p>
          <div className="d-flex justify-content-center flex-wrap gap-3 my-4">
            <Button variant="primary" onClick={shareOnFacebook} style={{ backgroundColor: '#1877f2' }} className="rounded-pill px-4 py-2">
              <Facebook className="me-2" /> Facebook
            </Button>
            <Button variant="info" onClick={shareOnTwitter} style={{ backgroundColor: '#1da1f2' }} className="rounded-pill px-4 py-2">
              <FaTwitter className="me-2" /> Twitter
            </Button>
            <Button variant="secondary" onClick={shareOnLinkedIn} style={{ backgroundColor: '#0077b5' }} className="rounded-pill px-4 py-2">
              <FaLinkedin className="me-2" /> LinkedIn
            </Button>
            <Button variant="success" onClick={shareOnWhatsApp} className="rounded-pill px-4 py-2">
              <FaWhatsapp className="me-2" /> WhatsApp
            </Button>
            <Button variant="danger" onClick={shareByEmail} className="rounded-pill px-4 py-2">
              <FaEmail className="me-2" /> Email
            </Button>
          </div>
          <div className="bg-light p-3 rounded-3">
            <p className="mb-0">Your unique referral link: <strong>{window.location.origin}?ref=YOURCODE</strong></p>
            <Button variant="outline-primary" size="sm" className="mt-2 rounded-pill" onClick={() => navigator.clipboard.writeText(`${window.location.origin}?ref=YOURCODE`)}>Copy Link</Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowReferralModal(false)} className="rounded-pill">Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 4. Partnership Modal (Premium Membership) */}
      <Modal show={showPartnershipModal} onHide={() => setShowPartnershipModal(false)} size="lg" centered className="professional-modal">
        <Modal.Header closeButton className="bg-gradient-primary text-white border-0">
          <Modal.Title className="fw-bold"><FaHandshake className="me-2" /> Strategic Partnership Opportunities</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <Badge bg="warning" text="dark" className="px-3 py-2">Exclusive Invitation</Badge>
          </div>
          <h5 className="text-primary mb-3">Join Our Elite Partner Network</h5>
          <p>
            Smart Services invites established organizations – <strong>real estate developers, property management firms, financial institutions, general contractors, and large enterprises</strong> – to form a strategic alliance with us.
          </p>
          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="border rounded-3 p-3 h-100">
                <FaCheckCircle className="text-success me-1" /> <strong>Preferred Pricing</strong> – Exclusive rates on all services
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded-3 p-3 h-100">
                <FaCheckCircle className="text-success me-1" /> <strong>Dedicated Account Manager</strong> – Single point of contact
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded-3 p-3 h-100">
                <FaCheckCircle className="text-success me-1" /> <strong>Priority Scheduling</strong> – 24/7 support & faster dispatch
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded-3 p-3 h-100">
                <FaCheckCircle className="text-success me-1" /> <strong>Co‑branded Marketing</strong> – Joint campaigns
              </div>
            </Col>
          </Row>
          <h5 className="mt-3">Who Should Partner?</h5>
          <ul>
            <li><strong>Real Estate Firms / Developers</strong> – Keep properties well‑maintained, increase asset value</li>
            <li><strong>Financial Institutions</strong> – Offer maintenance as a value‑added benefit</li>
            <li><strong>Contractors</strong> – Expand your service catalogue</li>
            <li><strong>Large Enterprises</strong> – Single SLA for all facilities</li>
          </ul>
          <div className="bg-light p-3 rounded-3 mt-3">
            <p className="mb-0 fst-italic">“Partnering with Smart Services streamlined our maintenance across 50+ properties. Unmatched responsiveness and quality.” – <strong>Regional Manager, Major Real Estate Trust</strong></p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowPartnershipModal(false)} className="rounded-pill">Close</Button>
          <Button as={Link} to="/provider/register" variant="primary" className="rounded-pill px-4">Become a Partner →</Button>
        </Modal.Footer>
      </Modal>

      <style jsx="true">{`
        .hero-section {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          position: relative;
        }
        .hero-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .service-card, .trade-card {
          transition: all 0.3s ease;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        .service-card:hover, .trade-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
        }
        .category-card {
          transition: all 0.3s ease;
          border-radius: 15px;
          cursor: pointer;
        }
        .category-card:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
        }
        .step-number {
          font-size: 3rem;
          font-weight: bold;
          color: rgba(102, 126, 234, 0.1);
          line-height: 1;
        }
        .step-icon {
          font-size: 2.5rem;
          margin-top: -20px;
        }
        .hero-image-container {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @media (max-width: 768px) {
          .display-3 { font-size: 2.5rem; }
          .hero-section { min-height: auto; padding: 60px 0; }
          .hero-image-container { margin-top: 2rem; }
        }
        .professional-modal .modal-content {
          border-radius: 20px;
          overflow: hidden;
          border: none;
        }
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      `}</style>
    </>
  );
};

export default Home;