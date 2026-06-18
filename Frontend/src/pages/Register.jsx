// src/pages/Register.jsx
import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaUserTag,
  FaCheckCircle,
  FaGoogle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general error
    if (registrationError) {
      setRegistrationError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one letter and one number';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^\+?[\d\s-()]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Terms agreement validation
    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setRegistrationError('');

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = formData;
    
    try {
      const result = await register(registerData);
      
      if (result.success) {
        console.log('✅ Registration successful, redirecting to:', result.redirectTo);
        // Navigate based on user role
        navigate(result.redirectTo, { replace: true });
      } else {
        setRegistrationError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setRegistrationError('An unexpected error occurred. Please try again.');
      console.error('❌ Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return null;
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    
    const strengthMap = {
      0: { text: 'Very Weak', color: '#dc3545', width: '0%' },
      1: { text: 'Weak', color: '#dc3545', width: '20%' },
      2: { text: 'Fair', color: '#ffc107', width: '40%' },
      3: { text: 'Good', color: '#17a2b8', width: '60%' },
      4: { text: 'Strong', color: '#28a745', width: '80%' },
      5: { text: 'Very Strong', color: '#28a745', width: '100%' }
    };
    
    return strengthMap[strength] || strengthMap[0];
  };

  const passwordStrength = getPasswordStrength();

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center py-5" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <Row className="w-100 justify-content-center">
        <Col md={10} lg={8} xl={7}>
          <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2" style={{ color: '#2d3748' }}>
                  Create Your Account
                </h2>
                <p className="text-muted">
                  Join <span className="text-primary fw-bold">SmartServices</span> today and get access to thousands of trusted service providers
                </p>
              </div>

              {/* Google Register */}
              <div className="mb-4">
                <Button
                  variant="outline-dark"
                  className="w-100 py-2 mb-3 rounded-pill"
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
                  style={{ border: '1px solid #ddd' }}
                >
                  <FaGoogle className="me-2" />
                  Continue with Google
                </Button>
                <div className="text-center">
                  <span className="text-muted small">or register with email</span>
                </div>
              </div>

              {registrationError && (
                <Alert variant="danger" className="mb-4" dismissible onClose={() => setRegistrationError('')}>
                  <Alert.Heading className="h6 mb-0">❌ {registrationError}</Alert.Heading>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    {/* Full Name */}
                    <Form.Group className="mb-3" controlId="formName">
                      <Form.Label className="fw-semibold">
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3 z-1">
                          <FaUser className="text-muted" />
                        </span>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`ps-5 py-2 ${errors.name ? 'is-invalid' : ''}`}
                          isInvalid={!!errors.name}
                        />
                        {errors.name && (
                          <Form.Control.Feedback type="invalid">
                            {errors.name}
                          </Form.Control.Feedback>
                        )}
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Email */}
                    <Form.Group className="mb-3" controlId="formEmail">
                      <Form.Label className="fw-semibold">
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3 z-1">
                          <FaEnvelope className="text-muted" />
                        </span>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`ps-5 py-2 ${errors.email ? 'is-invalid' : ''}`}
                          isInvalid={!!errors.email}
                        />
                        {errors.email && (
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    {/* Password */}
                    <Form.Group className="mb-3" controlId="formPassword">
                      <Form.Label className="fw-semibold">
                        Password <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3 z-1">
                          <FaLock className="text-muted" />
                        </span>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`ps-5 py-2 ${errors.password ? 'is-invalid' : ''}`}
                          isInvalid={!!errors.password}
                        />
                        <Button
                          variant="link"
                          className="position-absolute top-50 end-0 translate-middle-y text-muted z-1"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ textDecoration: 'none' }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                        {errors.password && (
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        )}
                      </div>
                      {formData.password && !errors.password && (
                        <div className="mt-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">Password Strength:</small>
                            <small style={{ color: passwordStrength.color }}>
                              {passwordStrength.text}
                            </small>
                          </div>
                          <div className="progress" style={{ height: '4px' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: passwordStrength.width,
                                backgroundColor: passwordStrength.color,
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Confirm Password */}
                    <Form.Group className="mb-3" controlId="formConfirmPassword">
                      <Form.Label className="fw-semibold">
                        Confirm Password <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3 z-1">
                          <FaLock className="text-muted" />
                        </span>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`ps-5 py-2 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          isInvalid={!!errors.confirmPassword}
                        />
                        <Button
                          variant="link"
                          className="position-absolute top-50 end-0 translate-middle-y text-muted z-1"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ textDecoration: 'none' }}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                        {errors.confirmPassword && (
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                          </Form.Control.Feedback>
                        )}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    {/* Phone Number */}
                    <Form.Group className="mb-3" controlId="formPhone">
                      <Form.Label className="fw-semibold">Phone Number</Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3 z-1">
                          <FaPhone className="text-muted" />
                        </span>
                        <Form.Control
                          type="tel"
                          name="phone"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`ps-5 py-2 ${errors.phone ? 'is-invalid' : ''}`}
                          isInvalid={!!errors.phone}
                        />
                        {errors.phone && (
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                        )}
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Role Selection */}
                    <Form.Group className="mb-3" controlId="formRole">
                      <Form.Label className="fw-semibold">
                        I want to join as <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex gap-4 mt-2">
                        <Form.Check
                          type="radio"
                          id="role-customer"
                          label={
                            <span>
                              <FaUser className="me-1 text-primary" /> Customer
                            </span>
                          }
                          name="role"
                          value="customer"
                          checked={formData.role === 'customer'}
                          onChange={handleChange}
                          className="cursor-pointer"
                        />
                        <Form.Check
                          type="radio"
                          id="role-provider"
                          label={
                            <span>
                              <FaUserTag className="me-1 text-success" /> Service Provider
                            </span>
                          }
                          name="role"
                          value="provider"
                          checked={formData.role === 'provider'}
                          onChange={handleChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Terms and Conditions */}
                <Form.Group className="mb-4" controlId="formTerms">
                  <Form.Check
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                    isInvalid={!!errors.terms}
                    label={
                      <span className="text-muted">
                        I agree to the{' '}
                        <Link to="/terms" className="text-primary text-decoration-none fw-semibold">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-primary text-decoration-none fw-semibold">
                          Privacy Policy
                        </Link>
                        <span className="text-danger"> *</span>
                      </span>
                    }
                  />
                  {errors.terms && (
                    <Form.Text className="text-danger d-block mt-1">
                      {errors.terms}
                    </Form.Text>
                  )}
                </Form.Group>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 py-2 mb-3 fw-bold rounded-pill"
                  disabled={loading}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="me-2" />
                      Create Account
                    </>
                  )}
                </Button>

                {/* Login Link */}
                <p className="text-center mb-0">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/login" className="text-primary fw-bold text-decoration-none">
                    Sign in here
                  </Link>
                </p>
              </Form>

              {/* Provider Benefits Alert */}
              {formData.role === 'provider' && (
                <Alert variant="info" className="mt-4 mb-0">
                  <Alert.Heading className="h6 mb-2">
                    <FaUserTag className="me-2" /> Provider Account Benefits:
                  </Alert.Heading>
                  <ul className="mb-0 small">
                    <li>List your services and reach thousands of potential customers</li>
                    <li>Manage bookings and schedule with our easy-to-use dashboard</li>
                    <li>Receive payments securely and on time</li>
                    <li>Build your reputation with customer reviews and ratings</li>
                    <li>Get priority support and business insights</li>
                  </ul>
                </Alert>
              )}

              {/* Customer Benefits Alert */}
              {formData.role === 'customer' && (
                <Alert variant="success" className="mt-4 mb-0">
                  <Alert.Heading className="h6 mb-2">
                    <FaUser className="me-2" /> Customer Benefits:
                  </Alert.Heading>
                  <ul className="mb-0 small">
                    <li>Access to thousands of verified service providers</li>
                    <li>Easy booking and secure payments</li>
                    <li>Read genuine reviews from other customers</li>
                    <li>Get quotes from multiple providers</li>
                    <li>24/7 customer support</li>
                  </ul>
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;