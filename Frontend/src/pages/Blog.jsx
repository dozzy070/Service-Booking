// src/pages/Blog.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  Pagination,
  Modal,
  Image,
  Spinner
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaShareAlt,
  FaHeart,
  FaEye,
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaArrowRight,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaRegBookmark,
  FaBookmark,
  FaImage,
  FaExclamationTriangle
} from 'react-icons/fa';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bookmarked, setBookmarked] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [loadingImages, setLoadingImages] = useState({});
  const topRef = useRef(null);

  const postsPerPage = 6;

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // ✅ Nigerian Realistic Images - Using Unsplash with Nigeria-related search terms
  const getNigerianImage = (category, state, type = 'main') => {
    // Specific image URLs for Nigerian contexts
    const images = {
      // Nigerian Home Images
      'nigerian_home': 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'nigerian_home_2': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'nigerian_home_3': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      
      // Nigerian People/Workers
      'nigerian_worker': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'nigerian_worker_2': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'nigerian_worker_3': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      
      // Nigerian City/Urban
      'lagos_city': 'https://images.unsplash.com/photo-1514933651106-009eefb9dfa8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'abuja_city': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      
      // Services specific
      'cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'plumbing': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'landscaping': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'moving': 'https://images.unsplash.com/photo-1600122582299-b620cd240ad6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'pest_control': 'https://images.unsplash.com/photo-1584735935682-2f2b69d89b9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'hvac': 'https://images.unsplash.com/photo-1584717822317-b5363dcb3bc4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'security': 'https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'painting': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      
      // Nigerian Team/Community
      'nigerian_team': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'nigerian_community': 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      
      // Business/Materials
      'business_meeting': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      'construction': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
      
      // Nigerian Market/Street
      'nigerian_market': 'https://images.unsplash.com/photo-1569261040174-80649ef87c9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    };

    // Default fallback image
    const defaultImage = 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80';

    // Map categories to images
    const categoryMap = {
      'Renovation': images.nigerian_home,
      'Cleaning': images.cleaning,
      'Plumbing': images.plumbing,
      'Electrical': images.electrical,
      'Landscaping': images.landscaping,
      'Moving': images.moving,
      'Pest Control': images.pest_control,
      'HVAC': images.hvac,
      'Security': images.security,
      'Painting': images.painting,
      'Company News': images.nigerian_team,
      'Community': images.nigerian_community,
      'default': defaultImage
    };

    // Map states to images
    const stateMap = {
      'Lagos': images.lagos_city,
      'FCT': images.abuja_city,
      'Rivers': images.nigerian_market,
      'Ogun': images.construction,
      'Kaduna': images.nigerian_market,
      'Anambra': images.nigerian_market,
      'Enugu': images.nigerian_market,
      'Kano': images.nigerian_market,
      'Delta': images.nigerian_market,
      'Oyo': images.nigerian_market,
      'Nationwide': images.nigerian_team,
      'default': defaultImage
    };

    if (type === 'state') {
      return stateMap[state] || stateMap.default;
    }

    return categoryMap[category] || categoryMap.default;
  };

  // ✅ Handle image errors
  const handleImageError = (postId, imageIndex = 0) => {
    setImageErrors(prev => ({
      ...prev,
      [`${postId}-${imageIndex}`]: true
    }));
  };

  // ✅ Handle image load
  const handleImageLoad = (postId, imageIndex = 0) => {
    setLoadingImages(prev => ({
      ...prev,
      [`${postId}-${imageIndex}`]: false
    }));
  };

  // ✅ Image component with fallback
  const ImageWithFallback = ({ src, alt, postId, imageIndex = 0, className = '', style = {} }) => {
    const errorKey = `${postId}-${imageIndex}`;
    const hasError = imageErrors[errorKey];
    const isLoading = loadingImages[errorKey] !== false;

    if (hasError) {
      return (
        <div 
          className={`d-flex flex-column align-items-center justify-content-center bg-light ${className}`}
          style={{ ...style, minHeight: '150px' }}
        >
          <FaImage size={40} className="text-muted mb-2" />
          <span className="text-muted small">Image not available</span>
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <div className="d-flex align-items-center justify-content-center" style={{ ...style, position: 'absolute', width: '100%', height: '100%' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ ...style, ...(isLoading ? { opacity: 0 } : { opacity: 1 }) }}
          onError={() => handleImageError(postId, imageIndex)}
          onLoad={() => handleImageLoad(postId, imageIndex)}
        />
      </>
    );
  };

  // ✅ Blog posts data with Nigerian focus
  const blogPosts = [
    // ========================================================================
    // SUCCESSFUL SERVICES - VARIOUS STATES
    // ========================================================================
    {
      id: 1,
      title: "Luxury Home Renovation in Victoria Island, Lagos",
      excerpt: "Complete transformation of a 4-bedroom luxury apartment featuring modern interior design, premium finishes, and smart home technology.",
      content: "This project involved a comprehensive renovation of a 4-bedroom luxury apartment in Victoria Island, Lagos. Our team of expert plumbers, electricians, and interior designers worked together to create a stunning modern living space. The project included installing new plumbing systems, rewiring the entire apartment, custom cabinetry, and premium Italian marble flooring. The result is a breathtaking home that the family now enjoys with state-of-the-art smart home features.",
      category: "Renovation",
      location: "Victoria Island, Lagos",
      state: "Lagos",
      date: "2024-06-15",
      author: "Team SmartServices",
      readTime: "5 min read",
      views: 1250,
      likes: 89,
      rating: 4.9,
      imageKey: 'nigerian_home',
      images: ['nigerian_home', 'nigerian_home_2', 'nigerian_home_3'],
      beforeImage: 'nigerian_home',
      afterImage: 'nigerian_home_2',
      beforeAfter: true,
      tags: ["Renovation", "Plumbing", "Electrical", "Interior Design"],
      featured: true,
      successStory: true
    },
    {
      id: 2,
      title: "Commercial Office Cleaning in Abuja Central Business District",
      excerpt: "Professional cleaning team transforms a 20-story corporate office building with eco-friendly solutions and advanced sanitation protocols.",
      content: "Our professional cleaning team was contracted to provide comprehensive cleaning services for a 20-story office building in Abuja's Central Business District. Using eco-friendly cleaning solutions and state-of-the-art equipment, we delivered spotless results that exceeded client expectations. The project was completed ahead of schedule with zero complaints from the 2,000+ employees working in the building.",
      category: "Cleaning",
      location: "Central Business District, Abuja",
      state: "FCT",
      date: "2024-06-10",
      author: "Cleaning Team",
      readTime: "4 min read",
      views: 890,
      likes: 67,
      rating: 4.8,
      imageKey: 'cleaning',
      images: ['cleaning'],
      tags: ["Cleaning", "Commercial", "Eco-Friendly"],
      featured: false,
      successStory: true
    },
    {
      id: 3,
      title: "Emergency Plumbing Rescue in Port Harcourt",
      excerpt: "Rapid response plumbing team resolves major pipe burst in Port Harcourt within 2 hours, saving a family home from extensive water damage.",
      content: "A major pipe burst threatened to flood a family home in Port Harcourt's GRA area. Our emergency plumbing team responded within 30 minutes and completed the repairs in under 2 hours. The quick action prevented extensive water damage and saved the family over ₦5 million in potential repairs. The family was able to return to their home the same day.",
      category: "Plumbing",
      location: "GRA, Port Harcourt",
      state: "Rivers",
      date: "2024-06-05",
      author: "Plumbing Team",
      readTime: "3 min read",
      views: 670,
      likes: 45,
      rating: 4.7,
      imageKey: 'plumbing',
      images: ['plumbing'],
      tags: ["Plumbing", "Emergency", "Repair"],
      featured: false,
      successStory: true
    },
    {
      id: 4,
      title: "Complete Electrical Installation in Abeokuta Housing Estate",
      excerpt: "Full electrical installation for a new 50-unit housing estate in Abeokuta, providing safe and reliable power to families.",
      content: "Our electrical team completed the full installation for a new housing estate in Abeokuta, Ogun State. The project included wiring all 50 homes, installing transformers, and ensuring compliance with all IEE safety standards. Residents now enjoy reliable power supply and modern electrical systems with surge protection and energy-efficient lighting.",
      category: "Electrical",
      location: "Abeokuta, Ogun State",
      state: "Ogun",
      date: "2024-05-28",
      author: "Electrical Team",
      readTime: "4 min read",
      views: 560,
      likes: 38,
      rating: 4.6,
      imageKey: 'electrical',
      images: ['electrical'],
      tags: ["Electrical", "Installation", "Housing"],
      featured: false,
      successStory: true
    },
    {
      id: 5,
      title: "Landscape Transformation in Kaduna Government Reserved Area",
      excerpt: "Transformative landscaping project turns a bare plot into a beautiful garden with indigenous plants and sustainable water features.",
      content: "A client in Kaduna's Government Reserved Area wanted to transform their bare plot into a beautiful garden. Our landscaping team designed and executed a stunning garden with indigenous Nigerian plants, sustainable water features, and beautiful pathways. The project has become a model for sustainable landscaping in the region.",
      category: "Landscaping",
      location: "Government Reserved Area, Kaduna",
      state: "Kaduna",
      date: "2024-05-20",
      author: "Landscaping Team",
      readTime: "3 min read",
      views: 490,
      likes: 32,
      rating: 4.5,
      imageKey: 'landscaping',
      images: ['landscaping'],
      tags: ["Landscaping", "Garden", "Outdoor"],
      featured: false,
      successStory: true
    },
    {
      id: 6,
      title: "Seamless Family Relocation in Awka",
      excerpt: "Professional moving team executes seamless relocation for a family of 6 in Awka, handling all logistics and packing with care.",
      content: "A family of 6 needed to relocate within Awka, Anambra State. Our professional moving team handled all aspects of the move including packing, loading, transportation, and unpacking. The family was able to settle into their new home stress-free with everything in perfect order. We provided specialized packing for fragile items and managed the entire logistics chain.",
      category: "Moving",
      location: "Awka, Anambra State",
      state: "Anambra",
      date: "2024-05-15",
      author: "Moving Team",
      readTime: "3 min read",
      views: 420,
      likes: 28,
      rating: 4.4,
      imageKey: 'moving',
      images: ['moving'],
      tags: ["Moving", "Relocation", "Logistics"],
      featured: false,
      successStory: true
    },
    {
      id: 7,
      title: "Termite Elimination in Enugu Independence Layout",
      excerpt: "Comprehensive pest control treatment eliminates termite infestation in a 5-bedroom house in Enugu, protecting the structure.",
      content: "A 5-bedroom house in Enugu's Independence Layout was suffering from a severe termite infestation. Our pest control team performed a comprehensive treatment that eliminated the pests and protected the structure. We used eco-friendly solutions that were safe for the family and pets. The home is now completely pest-free with a 5-year warranty.",
      category: "Pest Control",
      location: "Independence Layout, Enugu",
      state: "Enugu",
      date: "2024-05-10",
      author: "Pest Control Team",
      readTime: "3 min read",
      views: 380,
      likes: 25,
      rating: 4.3,
      imageKey: 'pest_control',
      images: ['pest_control'],
      tags: ["Pest Control", "Termites", "Protection"],
      featured: false,
      successStory: true
    },
    {
      id: 8,
      title: "HVAC Installation in Kano Shopping Mall",
      excerpt: "Modern air conditioning and ventilation system installed in a major shopping mall in Kano, improving comfort and energy efficiency.",
      content: "A major shopping mall in Kano needed a modern HVAC system. Our team designed and installed a state-of-the-art air conditioning and ventilation system that improved indoor comfort and energy efficiency. The mall now enjoys optimal temperature control year-round with 30% energy savings compared to their previous system.",
      category: "HVAC",
      location: "Kano City, Kano State",
      state: "Kano",
      date: "2024-05-05",
      author: "HVAC Team",
      readTime: "4 min read",
      views: 350,
      likes: 22,
      rating: 4.2,
      imageKey: 'hvac',
      images: ['hvac'],
      tags: ["HVAC", "Air Conditioning", "Ventilation"],
      featured: false,
      successStory: true
    },
    {
      id: 9,
      title: "Smart Security Installation in Asaba",
      excerpt: "State-of-the-art security system installed in a luxury home in Asaba, providing comprehensive protection and peace of mind.",
      content: "A luxury home in Asaba, Delta State required a comprehensive security system. Our team installed a state-of-the-art system including 16 HD cameras, motion sensors, and remote monitoring. The homeowners now enjoy peace of mind knowing their property is fully protected with 24/7 professional monitoring and instant alerts.",
      category: "Security",
      location: "Asaba, Delta State",
      state: "Delta",
      date: "2024-04-28",
      author: "Security Team",
      readTime: "3 min read",
      views: 320,
      likes: 20,
      rating: 4.1,
      imageKey: 'security',
      images: ['security'],
      tags: ["Security", "Installation", "Cameras"],
      featured: false,
      successStory: true
    },
    {
      id: 10,
      title: "Premium Painting Services in Ibadan",
      excerpt: "Professional painting transforms a 5-bedroom home in Ibadan with premium, long-lasting finishes and custom color schemes.",
      content: "A 5-bedroom home in Ibadan's Bodija Estate received a complete professional painting makeover. Our team used premium Nigerian paints and techniques to deliver flawless finishes with custom color schemes. The home now looks brand new with long-lasting durability and a 10-year warranty on the finishes.",
      category: "Painting",
      location: "Bodija Estate, Ibadan",
      state: "Oyo",
      date: "2024-04-20",
      author: "Painting Team",
      readTime: "3 min read",
      views: 290,
      likes: 18,
      rating: 4.0,
      imageKey: 'painting',
      images: ['painting'],
      tags: ["Painting", "Home", "Makeover"],
      featured: false,
      successStory: true
    },

    // ========================================================================
    // COMPANY NEWS - Nigerian Focus
    // ========================================================================
    {
      id: 11,
      title: "SmartServices Expands to 20 New Nigerian Cities",
      excerpt: "Exciting news! We're expanding our services to 20 new cities across Nigeria, bringing trusted professionals to more communities nationwide.",
      content: "We are thrilled to announce the expansion of SmartServices to 20 new cities across Nigeria. This growth brings our trusted professional services to more communities, connecting customers with skilled providers in their area. The expansion includes major cities like Benin City, Warri, Jos, and 17 others. We're committed to maintaining the same high standards of quality and reliability in every location.",
      category: "Company News",
      location: "Nationwide",
      state: "Nationwide",
      date: "2024-06-01",
      author: "CEO, SmartServices",
      readTime: "6 min read",
      views: 2500,
      likes: 156,
      rating: 5.0,
      imageKey: 'nigerian_team',
      images: ['nigerian_team'],
      tags: ["Expansion", "Growth", "News"],
      featured: true,
      successStory: false
    },
    {
      id: 12,
      title: "Partnership with Nigerian Building Materials Suppliers",
      excerpt: "Strategic partnership with leading building materials suppliers to provide quality materials and exclusive discounts to our customers.",
      content: "We are excited to announce a strategic partnership with leading Nigerian building materials suppliers. This collaboration allows our customers to access quality materials at exclusive discounts, while our providers get priority access to premium supplies. The partnership covers everything from cement and roofing to plumbing fixtures and electrical components.",
      category: "Company News",
      location: "Nationwide",
      state: "Nationwide",
      date: "2024-05-25",
      author: "Partnership Team",
      readTime: "4 min read",
      views: 890,
      likes: 72,
      rating: 4.6,
      imageKey: 'business_meeting',
      images: ['business_meeting'],
      tags: ["Partnership", "Materials", "Discounts"],
      featured: false,
      successStory: false
    },
    {
      id: 13,
      title: "Community Development Initiative Launched in 5 States",
      excerpt: "Our new initiative provides free essential services to underserved communities across 5 Nigerian states.",
      content: "We are proud to launch our Community Development Initiative, providing free essential services to underserved communities in Lagos, Abuja, Rivers, Kaduna, and Anambra States. From home repairs to hygiene education, our team is dedicated to making a positive impact. Join us in building stronger, healthier communities across Nigeria.",
      category: "Community",
      location: "Nationwide",
      state: "Nationwide",
      date: "2024-05-18",
      author: "Community Team",
      readTime: "5 min read",
      views: 720,
      likes: 58,
      rating: 4.9,
      imageKey: 'nigerian_community',
      images: ['nigerian_community'],
      tags: ["Community", "Initiative", "CSR"],
      featured: false,
      successStory: false
    },
    {
      id: 14,
      title: "10,000 Services Completed Across Nigeria",
      excerpt: "Milestone achievement: SmartServices has successfully completed 10,000 services across Nigeria. Thank you to our community!",
      content: "We are proud to announce that SmartServices has completed our 10,000th service! This milestone is a testament to the trust our customers place in us and the dedication of our providers across Nigeria. From Lagos to Kano, from Abuja to Port Harcourt, we've been helping Nigerians access quality services. Thank you to everyone who has been part of this amazing journey.",
      category: "Company News",
      location: "Nationwide",
      state: "Nationwide",
      date: "2024-05-12",
      author: "Operations Team",
      readTime: "3 min read",
      views: 1500,
      likes: 120,
      rating: 5.0,
      imageKey: 'construction',
      images: ['construction'],
      tags: ["Milestone", "Achievement", "Growth"],
      featured: false,
      successStory: false
    }
  ];

  // Categories for filtering
  const categories = ['all', ...new Set(blogPosts.map(post => post.category))];

  // Get unique states
  const states = [...new Set(blogPosts.map(post => post.state))].filter(s => s !== 'Nationwide');

  // Filter posts
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Featured post
  const featuredPost = blogPosts.find(post => post.featured === true);

  // Pagination
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const toggleBookmark = (postId) => {
    setBookmarked(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // State image mapping for geographical representation - Nigerian states
  const getStateImage = (state) => {
    const stateImages = {
      'Lagos': getNigerianImage('Renovation', 'Lagos', 'state'),
      'FCT': getNigerianImage('Cleaning', 'FCT', 'state'),
      'Rivers': getNigerianImage('Plumbing', 'Rivers', 'state'),
      'Ogun': getNigerianImage('Electrical', 'Ogun', 'state'),
      'Kaduna': getNigerianImage('Landscaping', 'Kaduna', 'state'),
      'Anambra': getNigerianImage('Moving', 'Anambra', 'state'),
      'Enugu': getNigerianImage('Pest Control', 'Enugu', 'state'),
      'Kano': getNigerianImage('HVAC', 'Kano', 'state'),
      'Delta': getNigerianImage('Security', 'Delta', 'state'),
      'Oyo': getNigerianImage('Painting', 'Oyo', 'state')
    };
    return stateImages[state] || getNigerianImage('default', 'default', 'state');
  };

  return (
    <>
      <div ref={topRef} />
      
      <Container fluid className="py-4" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <Container>
          {/* Header */}
          <Row className="mb-4">
            <Col className="text-center">
              <h1 className="display-5 fw-bold mb-3">Blog & Success Stories</h1>
              <p className="text-muted lead">
                Discover successful service executions across Nigeria and stay updated with our latest news
              </p>
            </Col>
          </Row>

          {/* Search & Filter */}
          <Row className="mb-4 g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search posts by title, location, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" className="w-100" onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}>
                Clear Filters
              </Button>
            </Col>
          </Row>

          {/* Success Stories by State Section */}
          <Card className="border-0 shadow-sm mb-5">
            <Card.Body className="p-4">
              <h4 className="mb-3">📍 Success Stories Across Nigeria</h4>
              <p className="text-muted mb-4">We've delivered successful services in over 10 states across Nigeria</p>
              <Row className="g-3">
                {states.map((state, index) => {
                  const statePosts = blogPosts.filter(p => p.state === state && p.successStory);
                  return (
                    <Col key={index} xs={6} md={3} lg={2}>
                      <Card 
                        className="border-0 text-center h-100 cursor-pointer overflow-hidden"
                        style={{ transition: 'transform 0.3s' }}
                        onClick={() => {
                          const post = statePosts[0];
                          if (post) handlePostClick(post);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ position: 'relative', height: '80px', overflow: 'hidden' }}>
                          <ImageWithFallback
                            src={getStateImage(state)}
                            alt={state}
                            postId={`state-${state}`}
                            className="w-100"
                            style={{ height: '80px', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px' }}>
                            <small className="text-white fw-bold">{state}</small>
                          </div>
                        </div>
                        <Card.Body className="p-2">
                          <Badge bg="success" className="mb-1">✓</Badge>
                          <small className="d-block text-muted">{statePosts.length} services</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* Featured Post */}
          {featuredPost && (
            <Card className="border-0 shadow-lg mb-5 overflow-hidden">
              <Row className="g-0">
                <Col md={6}>
                  <ImageWithFallback
                    src={getNigerianImage(featuredPost.category, featuredPost.state)}
                    alt={featuredPost.title}
                    postId={`featured-${featuredPost.id}`}
                    className="img-fluid w-100"
                    style={{ height: '100%', minHeight: '300px', objectFit: 'cover' }}
                  />
                </Col>
                <Col md={6}>
                  <Card.Body className="p-4">
                    <Badge bg="danger" className="mb-3">Featured Story</Badge>
                    <h3 className="fw-bold mb-2">{featuredPost.title}</h3>
                    <div className="d-flex gap-3 mb-3 flex-wrap">
                      <span className="text-muted small">
                        <FaCalendarAlt className="me-1" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </span>
                      <span className="text-muted small">
                        <FaMapMarkerAlt className="me-1" />
                        {featuredPost.location}
                      </span>
                      <span className="text-muted small">
                        <FaClock className="me-1" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <p className="text-muted">{featuredPost.excerpt}</p>
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                      {featuredPost.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} bg="light" text="dark" className="rounded-pill">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      variant="primary" 
                      onClick={() => handlePostClick(featuredPost)}
                      className="d-flex align-items-center gap-2"
                    >
                      Read Full Story <FaArrowRight />
                    </Button>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          )}

          {/* Blog Posts Grid */}
          <Row className="g-4">
            {currentPosts.map(post => (
              <Col lg={4} md={6} key={post.id}>
                <Card 
                  className="border-0 shadow-sm h-100 cursor-pointer"
                  style={{ transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onClick={() => handlePostClick(post)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                    <ImageWithFallback
                      src={getNigerianImage(post.category, post.state)}
                      alt={post.title}
                      postId={post.id}
                      className="w-100"
                      style={{ height: '220px', objectFit: 'cover' }}
                    />
                    {post.successStory && (
                      <Badge 
                        bg="success" 
                        style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          left: '12px',
                          padding: '6px 14px'
                        }}
                      >
                        ✓ Success Story
                      </Badge>
                    )}
                    {post.beforeAfter && (
                      <Badge 
                        bg="warning" 
                        style={{ 
                          position: 'absolute', 
                          top: '12px', 
                          right: '12px',
                          padding: '6px 14px',
                          color: '#000'
                        }}
                      >
                        Before & After
                      </Badge>
                    )}
                  </div>
                  <Card.Body>
                    <div className="d-flex gap-2 mb-2 flex-wrap">
                      <Badge bg="primary" className="rounded-pill">{post.category}</Badge>
                      <Badge bg="info" className="rounded-pill">{post.state}</Badge>
                    </div>
                    <Card.Title className="h6 mb-2">{post.title}</Card.Title>
                    <Card.Text className="text-muted small">
                      {post.excerpt.substring(0, 100)}...
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="d-flex align-items-center gap-2">
                        <FaStar className="text-warning" />
                        <span className="fw-bold">{post.rating}</span>
                        <span className="text-muted small">({post.likes} likes)</span>
                      </div>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="link" 
                          className="p-0 text-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(post.id);
                          }}
                        >
                          {bookmarked[post.id] ? 
                            <FaBookmark className="text-primary" /> : 
                            <FaRegBookmark />
                          }
                        </Button>
                        <Button 
                          variant="link" 
                          className="p-0 text-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.share) {
                              navigator.share({
                                title: post.title,
                                text: post.excerpt,
                                url: window.location.href
                              });
                            }
                          }}
                        >
                          <FaShareAlt />
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white border-0 d-flex justify-content-between align-items-center flex-wrap">
                    <small className="text-muted">
                      <FaUser className="me-1" />
                      {post.author}
                    </small>
                    <small className="text-muted">
                      <FaCalendarAlt className="me-1" />
                      {new Date(post.date).toLocaleDateString()}
                    </small>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === currentPage}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}

          {/* CTA Section */}
          <Card className="border-0 shadow-sm bg-primary text-white mt-5">
            <Card.Body className="p-5 text-center">
              <h3 className="mb-3">Have a Success Story to Share?</h3>
              <p className="lead mb-4">
                Join our community and share your successful service experience with us
              </p>
              <Button as={Link} to="/contact" variant="light" size="lg" className="px-5">
                Share Your Story
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </Container>

      {/* Post Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        {selectedPost && (
          <>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold">{selectedPost.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3" style={{ position: 'relative', minHeight: '200px' }}>
                <ImageWithFallback
                  src={getNigerianImage(selectedPost.category, selectedPost.state)}
                  alt={selectedPost.title}
                  postId={`modal-${selectedPost.id}`}
                  className="img-fluid rounded-3 w-100"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
              </div>
              <div className="d-flex gap-3 mb-3 flex-wrap">
                <Badge bg="primary" className="rounded-pill">{selectedPost.category}</Badge>
                <Badge bg="info" className="rounded-pill">{selectedPost.state}</Badge>
                <span className="text-muted small">
                  <FaCalendarAlt className="me-1" />
                  {new Date(selectedPost.date).toLocaleDateString()}
                </span>
                <span className="text-muted small">
                  <FaMapMarkerAlt className="me-1" />
                  {selectedPost.location}
                </span>
                <span className="text-muted small">
                  <FaClock className="me-1" />
                  {selectedPost.readTime}
                </span>
              </div>
              {selectedPost.beforeAfter && (
                <Row className="mb-3 g-2">
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body className="text-center p-2">
                        <ImageWithFallback
                          src={getNigerianImage(selectedPost.category, selectedPost.state)}
                          alt="Before"
                          postId={`before-${selectedPost.id}`}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                        <p className="small mt-1">Before</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-0 bg-light">
                      <Card.Body className="text-center p-2">
                        <ImageWithFallback
                          src={getNigerianImage(selectedPost.category, selectedPost.state, 'after')}
                          alt="After"
                          postId={`after-${selectedPost.id}`}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                        <p className="small mt-1">After</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
              <p className="text-muted">{selectedPost.content}</p>
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {selectedPost.tags.map((tag, i) => (
                  <Badge key={i} bg="light" text="dark" className="rounded-pill">
                    <FaTag className="me-1" /> {tag}
                  </Badge>
                ))}
              </div>
              <div className="d-flex justify-content-between align-items-center pt-3 border-top flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <span className="text-muted">
                    <FaHeart className="me-1 text-danger" />
                    {selectedPost.likes} likes
                  </span>
                  <span className="text-muted">
                    <FaEye className="me-1" />
                    {selectedPost.views} views
                  </span>
                  <span className="text-muted">
                    <FaStar className="text-warning me-1" />
                    {selectedPost.rating}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => window.open('https://facebook.com', '_blank')}>
                    <FaFacebook />
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => window.open('https://twitter.com', '_blank')}>
                    <FaTwitter />
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => window.open('https://linkedin.com', '_blank')}>
                    <FaLinkedin />
                  </Button>
                  <Button variant="outline-success" size="sm" onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(selectedPost.title), '_blank')}>
                    <FaWhatsapp />
                  </Button>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button as={Link} to="/services" variant="primary">
                Book a Service
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <style jsx="true">{`
        .cursor-pointer {
          cursor: pointer;
        }
        .bg-opacity-10 {
          --bs-bg-opacity: 0.1;
        }
        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        @media (max-width: 768px) {
          .display-5 {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
};

export default Blog;