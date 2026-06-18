// src/pages/provider/CreateService.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Image,
  Badge,
  ProgressBar,
  Modal,
  Tab,
  Tabs,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaSave,
  FaPlus,
  FaTimes,
  FaUpload,
  FaTrash,
  FaClock,
  FaDollarSign,
  FaMapMarkerAlt,
  FaTag,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaStar,
  FaUsers,
  FaCalendarAlt,
  FaWhatsapp,
  Fa
  Fa
  FaLink,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaFileAlt,
  FaListUl,
  FaCheck,
  FaBan
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { providerAPI } from '../../api/api';
import { getServiceImage, handleImageError } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const CreateService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    duration: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    features: [''],
    requirements: [''],
    cancellationPolicy: 'flexible',
    isAvailable: true,
    isFeatured: false,
    tags: [],
    maxBookingsPerDay: 5,
    advanceBooking: 2,
    preparationTime: 30,
    serviceType: 'online',
    languages: ['English'],
    certifications: []
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await providerAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories([
        { id: 1, name: 'Cleaning', icon: '🧹', subcategories: ['House Cleaning', 'Office Cleaning', 'Carpet Cleaning'] },
        { id: 2, name: 'Plumbing', icon: '🔧', subcategories: ['Pipe Repair', 'Drain Cleaning', 'Fixture Installation'] },
        { id: 3, name: 'Electrical', icon: '⚡', subcategories: ['Wiring', 'Lighting', 'Repairs'] },
        { id: 4, name: 'Gardening', icon: '🌱', subcategories: ['Lawn Mowing', 'Planting', 'Tree Trimming'] },
        { id: 5, name: 'Painting', icon: '🎨', subcategories: ['Interior', 'Exterior', 'Wallpaper'] }
      ]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchServiceData();
    }
  }, [id, fetchCategories]);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      const response = await providerAPI.getServiceById(id);
      const service = response.data;
      setFormData({
        title: service.title || '',
        category: service.category || '',
        subcategory: service.subcategory || '',
        description: service.description || '',
        shortDescription: service.short_description || '',
        price: service.price || '',
        discountPrice: service.discount_price || '',
        duration: service.duration || '',
        location: service.location || '',
        address: service.address || '',
        city: service.city || '',
        state: service.state || '',
        zipCode: service.zip_code || '',
        features: service.features || [''],
        requirements: service.requirements || [''],
        cancellationPolicy: service.cancellation_policy || 'flexible',
        isAvailable: service.is_available !== false,
        isFeatured: service.is_featured || false,
        tags: service.tags || [],
        maxBookingsPerDay: service.max_bookings_per_day || 5,
        advanceBooking: service.advance_booking || 2,
        preparationTime: service.preparation_time || 30,
        serviceType: service.service_type || 'online',
        languages: service.languages || ['English'],
        certifications: service.certifications || []
      });
      if (service.images) {
        setImagePreviews(service.images);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    setUploadProgress(0);
    
    const uploadedImages = [];
    const newPreviews = [...imagePreviews];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataImg = new FormData();
      formDataImg.append('image', file);
      
      try {
        const response = await providerAPI.uploadServiceImage(formDataImg, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        uploadedImages.push(response.data.url);
        newPreviews.push(URL.createObjectURL(file));
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setImages([...images, ...uploadedImages]);
    setImagePreviews(newPreviews);
    setUploadingImages(false);
    setUploadProgress(0);
    if (uploadedImages.length > 0) {
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Service title is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (formData.price && parseFloat(formData.price) < 1000) newErrors.price = 'Minimum price is ₦1,000';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (imagePreviews.length === 0) newErrors.images = 'Please upload at least one image';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in the form');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const serviceData = {
        title: formData.title,
        category: formData.category,
        subcategory: formData.subcategory,
        description: formData.description,
        short_description: formData.shortDescription,
        price: parseFloat(formData.price),
        discount_price: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        duration: formData.duration,
        location: formData.location,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        features: formData.features.filter(f => f.trim()),
        requirements: formData.requirements.filter(r => r.trim()),
        cancellation_policy: formData.cancellationPolicy,
        is_available: formData.isAvailable,
        is_featured: formData.isFeatured,
        tags: formData.tags,
        images: images,
        max_bookings_per_day: formData.maxBookingsPerDay,
        advance_booking: formData.advanceBooking,
        preparation_time: formData.preparationTime,
        service_type: formData.serviceType,
        languages: formData.languages,
        certifications: formData.certifications
      };

      if (id) {
        await providerAPI.updateService(id, serviceData);
        toast.success('Service updated successfully!');
      } else {
        await providerAPI.createService(serviceData);
        toast.success('Service created successfully!');
      }
      navigate('/provider/my-services');
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(error.response?.data?.message || (id ? 'Failed to update service' : 'Failed to create service'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || '📦';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading service data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">{id ? 'Edit Service' : 'Create New Service'}</h2>
            <p className="text-muted mb-0">
              {id ? 'Update your service listing details' : 'Add a new service to your portfolio'}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={handlePreview}
              className="d-flex align-items-center gap-2"
            >
              <FaEye size={16} />
              Preview
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/provider/my-services')}
            >
              Cancel
            </Button>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="g-4">
            <Col lg={8}>
              {/* Basic Information Tab */}
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <Card.Body className="p-4">
                  <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                    <FaInfoCircle size={18} className="text-primary" />
                    Basic Information
                  </h5>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Service Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Professional House Cleaning"
                      isInvalid={!!errors.title}
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                  </Form.Group>

                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Category <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          isInvalid={!!errors.category}
                          className="py-2"
                          disabled={loadingCategories}
                        >
                          <option value="">Select a category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Subcategory</Form.Label>
                        <Form.Select
                          name="subcategory"
                          value={formData.subcategory}
                          onChange={handleChange}
                          className="py-2"
                        >
                          <option value="">Select subcategory</option>
                          {formData.category && categories.find(c => c.name === formData.category)?.subcategories?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Short Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      placeholder="Brief summary of your service (shown in listings)"
                      className="py-2"
                    />
                    <Form.Text className="text-muted">
                      {formData.shortDescription.length}/160 characters
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Full Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Detailed description of your service including what customers can expect..."
                      isInvalid={!!errors.description}
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>

                  <h5 className="mb-3 fw-bold">Service Images <span className="text-danger">*</span></h5>
                  {errors.images && (
                    <Alert variant="danger" className="py-2 mb-3">
                      <FaExclamationCircle className="me-2" />
                      {errors.images}
                    </Alert>
                  )}
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="position-relative" style={{ width: '120px', height: '120px' }}>
                        <Image
                          src={preview}
                          alt={`Service ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 rounded-circle p-1"
                          style={{ transform: 'translate(50%, -50%)' }}
                          onClick={() => removeImage(idx)}
                        >
                          <FaTimes size={10} />
                        </Button>
                      </div>
                    ))}
                    <label className="upload-image-btn" style={{ width: '120px', height: '120px' }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingImages}
                      />
                      <div className="d-flex flex-column align-items-center justify-content-center h-100">
                        {uploadingImages ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            <small className="mt-2">{uploadProgress}%</small>
                          </>
                        ) : (
                          <>
                            <FaUpload size={24} className="text-muted" />
                            <small className="text-muted mt-2">Upload</small>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                  <Form.Text className="text-muted">
                    Upload up to 10 images. First image will be used as cover. JPG, PNG up to 5MB each.
                  </Form.Text>
                </Card.Body>
              </Card>

              {/* Pricing & Duration */}
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <Card.Body className="p-4">
                  <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                    <FaDollarSign size={18} className="text-success" />
                    Pricing & Duration
                  </h5>

                  <Row className="mb-4">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Regular Price (₦) <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="e.g., 25000"
                          isInvalid={!!errors.price}
                          className="py-2"
                          min="1000"
                          step="500"
                        />
                        <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Discounted Price</Form.Label>
                        <Form.Control
                          type="number"
                          name="discountPrice"
                          value={formData.discountPrice}
                          onChange={handleChange}
                          placeholder="Optional"
                          className="py-2"
                          min="1000"
                          step="500"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Duration (hours) <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleChange}
                          placeholder="e.g., 2"
                          isInvalid={!!errors.duration}
                          className="py-2"
                          min="0.5"
                          step="0.5"
                        />
                        <Form.Control.Feedback type="invalid">{errors.duration}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Max Bookings Per Day</Form.Label>
                        <Form.Control
                          type="number"
                          name="maxBookingsPerDay"
                          value={formData.maxBookingsPerDay}
                          onChange={handleChange}
                          min="1"
                          max="50"
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Advance Booking Required (days)</Form.Label>
                        <Form.Control
                          type="number"
                          name="advanceBooking"
                          value={formData.advanceBooking}
                          onChange={handleChange}
                          min="0"
                          max="30"
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Features & Requirements */}
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <Card.Body className="p-4">
                  <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                    <FaListUl size={18} className="text-primary" />
                    Features & Requirements
                  </h5>

                  <div className="mb-4">
                    <Form.Label className="fw-semibold">Service Features</Form.Label>
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="d-flex gap-2 mb-2">
                        <Form.Control
                          type="text"
                          value={feature}
                          onChange={(e) => handleArrayChange('features', idx, e.target.value)}
                          placeholder={`Feature ${idx + 1}`}
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeArrayItem('features', idx)}
                          disabled={formData.features.length === 1}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => addArrayItem('features')}
                      className="ps-0 mt-1"
                    >
                      <FaPlus className="me-1" size={12} />
                      Add Feature
                    </Button>
                  </div>

                  <div className="mb-4">
                    <Form.Label className="fw-semibold">Customer Requirements</Form.Label>
                    {formData.requirements.map((req, idx) => (
                      <div key={idx} className="d-flex gap-2 mb-2">
                        <Form.Control
                          type="text"
                          value={req}
                          onChange={(e) => handleArrayChange('requirements', idx, e.target.value)}
                          placeholder={`Requirement ${idx + 1}`}
                        />
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeArrayItem('requirements', idx)}
                          disabled={formData.requirements.length === 1}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => addArrayItem('requirements')}
                      className="ps-0 mt-1"
                    >
                      <FaPlus className="me-1" size={12} />
                      Add Requirement
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Location Card */}
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <Card.Body className="p-4">
                  <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                    <FaMapMarkerAlt size={18} className="text-danger" />
                    Location <span className="text-danger">*</span>
                  </h5>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Service Area</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Lagos, Nigeria"
                      isInvalid={!!errors.location}
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">{errors.location}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Street Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address"
                      className="py-2"
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">State</Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="State"
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">ZIP Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="ZIP code"
                      className="py-2"
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Settings Card */}
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
                <Card.Body className="p-4">
                  <h5 className="mb-4 fw-bold d-flex align-items-center gap-2">
                    <FaTag size={18} className="text-info" />
                    Settings
                  </h5>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Tags</Form.Label>
                    <div className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tag (e.g., cleaning, plumbing)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="py-2"
                      />
                      <Button variant="outline-primary" onClick={addTag}>
                        <FaPlus />
                      </Button>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <Badge key={idx} bg="secondary" className="d-flex align-items-center gap-1 px-3 py-2">
                          {tag}
                          <FaTimes
                            size={12}
                            style={{ cursor: 'pointer' }}
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Cancellation Policy</Form.Label>
                    <Form.Select
                      name="cancellationPolicy"
                      value={formData.cancellationPolicy}
                      onChange={handleChange}
                      className="py-2"
                    >
                      <option value="flexible">Flexible - Free cancellation up to 24h before</option>
                      <option value="moderate">Moderate - 50% charge for cancellation within 24h</option>
                      <option value="strict">Strict - No refunds for cancellations</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Service Type</Form.Label>
                    <Form.Select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="py-2"
                    >
                      <option value="online">Online/Remote</option>
                      <option value="onsite">Onsite at Customer Location</option>
                      <option value="both">Both Options Available</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Languages Spoken</Form.Label>
                    <Form.Select className="py-2">
                      <option>English</option>
                      <option>Yoruba</option>
                      <option>Hausa</option>
                      <option>Igbo</option>
                      <option>French</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Service Available for Booking"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Feature this Service"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-muted">
                      Featured services appear on the homepage
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Submit Card */}
              <Card className="border-0 shadow-sm sticky-top" style={{ borderRadius: '16px', top: '20px' }}>
                <Card.Body className="p-4">
                  <div className="mb-3 p-3 bg-light rounded-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Service Preview:</span>
                      <FaEye size={16} className="text-muted" />
                    </div>
                    <h6 className="mb-1">{formData.title || 'Your Service Title'}</h6>
                    <div className="fw-bold text-primary mb-2">
                      {formData.price ? formatNaira(formData.price) : '₦0'}
                      {formData.discountPrice && (
                        <span className="text-muted text-decoration-line-through ms-2">
                          {formatNaira(formData.discountPrice)}
                        </span>
                      )}
                    </div>
                    <div className="small text-muted">
                      {formData.duration} hours • {formData.location || 'Location TBD'}
                    </div>
                    <div className="mt-2">
                      <Badge bg={formData.isAvailable ? 'success' : 'secondary'}>
                        {formData.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="success"
                    disabled={submitting}
                    className="w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                    style={{ borderRadius: '12px', fontSize: '16px', fontWeight: '600' }}
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" />
                        {id ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FaSave size={18} />
                        {id ? 'Update Service' : 'Create Service'}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="light"
                    onClick={() => navigate('/provider/my-services')}
                    className="w-100 mt-2"
                  >
                    Cancel
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Service Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <div className="preview-container">
            {imagePreviews.length > 0 && (
              <Image
                src={imagePreviews[0]}
                alt="Cover"
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px' }}
              />
            )}
            <div className="mt-4">
              <h3>{formData.title || 'Your Service Title'}</h3>
              <div className="d-flex gap-3 mt-2 mb-3">
                <div className="d-flex align-items-center gap-1">
                  <FaStar className="text-warning" />
                  <span>New</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <FaUsers className="text-muted" />
                  <span>0 bookings</span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <FaClock className="text-muted" />
                  <span>{formData.duration || '0'} hours</span>
                </div>
              </div>
              <div className="mb-3">
                <span className="fw-bold text-primary fs-4">{formatNaira(formData.price)}</span>
                {formData.discountPrice && (
                  <span className="text-muted text-decoration-line-through ms-2">
                    {formatNaira(formData.discountPrice)}
                  </span>
                )}
              </div>
              <p>{formData.description || 'Service description will appear here...'}</p>
              {formData.features.length > 0 && (
                <>
                  <h6 className="mt-3">Features:</h6>
                  <ul>
                    {formData.features.map((f, i) => f && <li key={i}>{f}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .upload-image-btn {
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }
        .upload-image-btn:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }
        .sticky-top {
          top: 20px;
          z-index: 100;
        }
        @media (max-width: 992px) {
          .sticky-top {
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateService;