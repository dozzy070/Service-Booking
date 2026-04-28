// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Card, 
  Container, 
  Row, 
  Col, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaSignInAlt,
  FaGoogle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general error when user makes changes
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        console.log('✅ Login successful, redirecting to:', result.redirectTo);
        // Navigate based on user role from the login result
        navigate(result.redirectTo, { replace: true });
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('❌ Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoAccounts = {
      customer: { 
        email: 'customer@demo.com', 
        password: 'demo123',
        label: 'Customer Dashboard',
        description: 'Browse and book services'
      },
      provider: { 
        email: 'provider@demo.com', 
        password: 'demo123',
        label: 'Provider Dashboard',
        description: 'Manage your services and bookings'
      },
      admin: { 
        email: 'admin@demo.com', 
        password: 'admin123',
        label: 'Admin Dashboard',
        description: 'Manage platform and users'
      }
    };

    const account = demoAccounts[role];
    if (account) {
      setFormData({
        email: account.email,
        password: account.password
      });
      
      // Clear any existing errors
      setError('');
      setErrors({});
      
      // Auto-submit after a brief delay
      setTimeout(() => {
        document.getElementById('login-form').requestSubmit();
      }, 500);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center py-5" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2" style={{ color: '#2d3748' }}>
                  Welcome Back
                </h2>
                <p className="text-muted">
                  Sign in to continue to <span className="text-primary fw-bold">SmartServices</span>
                </p>
              </div>

              {/* Demo Login Section */}
              <div className="mb-4">
                <p className="text-muted small text-center mb-3">
                  <span className="bg-light px-3 py-1 rounded-pill">
                    ⚡ Quick Demo Access
                  </span>
                </p>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="px-3 rounded-pill"
                    onClick={() => handleDemoLogin('customer')}
                    title="Browse and book services"
                  >
                    👤 Customer Demo
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="px-3 rounded-pill"
                    onClick={() => handleDemoLogin('provider')}
                    title="Manage your services"
                  >
                    🔧 Provider Demo
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="px-3 rounded-pill"
                    onClick={() => handleDemoLogin('admin')}
                    title="Manage platform"
                  >
                    ⚙️ Admin Demo
                  </Button>
                </div>
              </div>

              {/* Google Login */}
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
                  <span className="text-muted small">or sign in with email</span>
                </div>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
                  <Alert.Heading className="h6 mb-0">❌ {error}</Alert.Heading>
                </Alert>
              )}

              <Form id="login-form" onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label className="fw-semibold">Email Address</Form.Label>
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

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <div className="position-relative">
                    <span className="position-absolute top-50 translate-middle-y ps-3 z-1">
                      <FaLock className="text-muted" />
                    </span>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your password"
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
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check
                    type="checkbox"
                    id="rememberMe"
                    label="Remember me"
                    className="text-muted"
                  />
                  <Link 
                    to="/forgot-password" 
                    className="text-decoration-none small text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  variant="primary"
                  type="submit"
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="me-2" />
                      Sign In
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <span className="text-muted">Don't have an account? </span>
                  <Link 
                    to="/register" 
                    className="text-primary fw-bold text-decoration-none"
                  >
                    Sign up here
                  </Link>
                </div>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <small className="text-muted">
                  By signing in, you agree to our{' '}
                  <Link to="/terms" className="text-decoration-none">Terms</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;