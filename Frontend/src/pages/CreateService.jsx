// src/pages/CreateService.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, 
  Alert, Spinner, Image, Badge
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaSave, FaPlus, FaTimes, FaUpload, FaTrash,
  FaClock, FaDollarSign, FaMapMarkerAlt, FaTag,
  FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getServiceImage, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';

const CreateService = () => {
  const { id } = useParams(); // For editing existing service
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    duration: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    features: [''],
    requirements: [''],
    cancellationPolicy: '24h',
    isAvailable: true,
    isFeatured: false,
    tags: []
  });

  // Categories
  const categories = [
    'Cleaning',
    'Plumbing',
    'Electrical',
    'Painting',
    'Gardening',
    'Moving',
    'Tutoring',
    'Photography',
    'Catering',
    'Event Planning',
    'Pet Care',
    'Beauty & Spa',
    'Fitness',
    'Tech Support',
    'Consulting'
  ];

  // Cancellation policies
  const cancellationPolicies = [
    { value: '24h', label: '24 hours before service' },
    { value: '48h', label: '48 hours before service' },
    { value: '72h', label: '72 hours before service' },
    { value: '7d', label: '7 days before service' },
    { value: 'strict', label: 'Strict - No refunds' },
    { value: 'flexible', label: 'Flexible - Up to 2 hours before' }
  ];

  // Load existing service data if editing
  useEffect(() => {
    if (id) {
      fetchServiceData();
    }
  }, [id]);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API call
      setFormData({
        title: 'Professional House Cleaning',
        category: 'Cleaning',
        description: 'Complete home cleaning service including kitchen, bathrooms, bedrooms, and living areas. We use eco-friendly products and ensure thorough cleaning.',
        price: '150',
        duration: '3',
        location: 'New York, NY',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        features: ['Deep cleaning', 'Eco-friendly products', 'Insurance covered'],
        requirements: ['Access to water/electricity', 'Clear countertops'],
        cancellationPolicy: '24h',
        isAvailable: true,
        isFeatured: false,
        tags: ['cleaning', 'household', 'professional']
      });
      
      // Mock images
      setImagePreviews([
        'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
        'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=400'
      ]);
    } catch (error) {
      toast.error('Failed to load service data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Service title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(formData.duration) || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Please enter a valid duration';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(id ? 'Service updated successfully!' : 'Service created successfully!');
      navigate('/provider/my-services');
    } catch (error) {
      toast.error(id ? 'Failed to update service' : 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/provider/my-services');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading service data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="create-service-container py-4">
      <Row className="mb-4">
        <Col>
          <h2>{id ? 'Edit Service' : 'Create New Service'}</h2>
          <p className="text-muted">
            {id ? 'Update your service listing' : 'Add a new service to your portfolio'}
          </p>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            {/* Basic Information */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Basic Information</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Service Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Professional House Cleaning"
                    isInvalid={!!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.title}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        isInvalid={!!errors.category}
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.category}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price ($) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="150"
                        isInvalid={!!errors.price}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.price}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration (hrs) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="3"
                        isInvalid={!!errors.duration}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.duration}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your service in detail..."
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Minimum 50 characters. {formData.description.length}/50
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Location Information */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Location</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Service Location <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    isInvalid={!!errors.location}
                  >
                    <option value="">Select service area</option>
                    <option value="New York, NY">New York, NY</option>
                    <option value="Los Angeles, CA">Los Angeles, CA</option>
                    <option value="Chicago, IL">Chicago, IL</option>
                    <option value="Houston, TX">Houston, TX</option>
                    <option value="Phoenix, AZ">Phoenix, AZ</option>
                    <option value="Philadelphia, PA">Philadelphia, PA</option>
                    <option value="San Antonio, TX">San Antonio, TX</option>
                    <option value="San Diego, CA">San Diego, CA</option>
                    <option value="Dallas, TX">Dallas, TX</option>
                    <option value="San Jose, CA">San Jose, CA</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.location}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Street Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main St"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="New York"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="NY"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="10001"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Features & Requirements */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Features & Requirements</h5>
                
                <div className="mb-4">
                  <label className="form-label">Key Features</label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        value={feature}
                        onChange={(e) => handleArrayChange('features', index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeArrayField('features', index)}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="link"
                    className="p-0 mt-2"
                    onClick={() => addArrayField('features')}
                  >
                    <FaPlus className="me-2" /> Add Another Feature
                  </Button>
                </div>

                <div className="mb-3">
                  <label className="form-label">Customer Requirements</label>
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        value={req}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeArrayField('requirements', index)}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="link"
                    className="p-0 mt-2"
                    onClick={() => addArrayField('requirements')}
                  >
                    <FaPlus className="me-2" /> Add Another Requirement
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Service Images */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Service Images</h5>
                
                <div className="image-upload-area mb-3">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="d-none"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="upload-label">
                    <FaUpload size={24} className="mb-2" />
                    <p>Click to upload or drag and drop</p>
                    <small className="text-muted">PNG, JPG, GIF up to 10MB</small>
                  </label>
                </div>

                {imagePreviews.length > 0 && (
                  <Row className="g-3 mt-3">
                    {imagePreviews.map((preview, index) => (
                      <Col xs={6} md={4} key={index}>
                        <div className="image-preview position-relative">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            fluid
                            className="rounded"
                            onError={(e) => handleImageError(e, getServiceImage('Service', index))}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-2"
                            onClick={() => removeImage(index)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Settings & Policies */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Settings</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Cancellation Policy</Form.Label>
                  <Form.Select
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleChange}
                  >
                    {cancellationPolicies.map(policy => (
                      <option key={policy.value} value={policy.value}>
                        {policy.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="isAvailable"
                    name="isAvailable"
                    label="Service is available for booking"
                    checked={formData.isAvailable}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="isFeatured"
                    name="isFeatured"
                    label="Feature this service (additional cost)"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Tags */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-4">Tags</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Add tags (press Enter to add)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., professional, eco-friendly"
                    onKeyDown={handleTagInput}
                  />
                </Form.Group>

                <div className="tags-container">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      bg="primary"
                      className="me-2 mb-2 p-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeTag(tag)}
                    >
                      {tag} <FaTimes className="ms-1" size={10} />
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Preview Card */}
            <Card className="border-0 shadow-sm mb-4 bg-primary text-white">
              <Card.Body className="p-4">
                <h6 className="mb-3">Ready to publish?</h6>
                <p className="small opacity-75 mb-3">
                  Your service will be reviewed by our team before going live. This usually takes 24-48 hours.
                </p>
                <div className="d-grid gap-2">
                  <Button
                    type="submit"
                    variant="light"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {id ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {id ? 'Update Service' : 'Create Service'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline-light"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      <style jsx="true">{`
        .create-service-container {
          max-width: 1400px;
        }

        .image-upload-area {
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .image-upload-area:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .upload-label {
          cursor: pointer;
          display: block;
          margin-bottom: 0;
        }

        .image-preview {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-preview img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .tags-container {
          min-height: 50px;
        }

        @media (max-width: 768px) {
          .create-service-container {
            padding: 10px;
          }
        }
      `}</style>
    </Container>
  );
};

export default CreateService;