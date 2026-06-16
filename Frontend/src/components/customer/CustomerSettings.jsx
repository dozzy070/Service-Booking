// src/components/customer/CustomerSettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Tab,
  Nav,
  Alert,
  Spinner,
  Badge,
  Modal,
  Image,
  ProgressBar,
  InputGroup,
  ToggleButton,
  ToggleButtonGroup
} from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { customerAPI, authAPI } from '../../api/api';
import { getAvatarUrl, handleImageError } from '../../utils/imageUtils';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaBell,
  FaPalette,
  FaGlobe,
  FaLanguage,
  FaCreditCard,
  FaShieldAlt,
  FaTrash,
  FaSave,
  FaCamera,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoon,
  FaSun,
  FaWallet,
  FaHistory,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaMobileAlt,
  FaBuilding,
  FaCity,
  FaFlag,
  FaInfoCircle
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CustomerSettings = () => {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria'
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    booking_reminders: true,
    payment_alerts: true,
    promotional_emails: false,
    review_requests: true
  });

  // Appearance preferences
  const [appearance, setAppearance] = useState({
    theme: 'light',
    compact_view: false,
    language: 'en'
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: true,
    show_address: false
  });

  // Security settings
  const [security, setSecurity] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    device_management: []
  });

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    last4: '',
    expiry: '',
    is_default: false
  });

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      setProfileForm({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zip_code || '',
        country: userData.country || 'Nigeria'
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  }, []);

  // Fetch notification preferences
  const fetchNotificationPrefs = useCallback(async () => {
    try {
      const response = await customerAPI.getNotificationPreferences();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await customerAPI.getPaymentMethods();
      setPaymentMethods(response.data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchNotificationPrefs(),
      fetchPaymentMethods()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update profile
  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profileForm);
      await updateUser({ name: profileForm.name, email: profileForm.email });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Update notification preferences
  const handleUpdateNotifications = async () => {
    setSaving(true);
    try {
      await customerAPI.updateNotificationPreferences(notifications);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  // Update appearance
  const handleUpdateAppearance = async () => {
    setSaving(true);
    try {
      localStorage.setItem('theme', appearance.theme);
      document.body.setAttribute('data-theme', appearance.theme);
      toast.success('Appearance settings updated');
    } catch (error) {
      console.error('Error updating appearance:', error);
      toast.error('Failed to update appearance');
    } finally {
      setSaving(false);
    }
  };

  // Update privacy
  const handleUpdatePrivacy = async () => {
    setSaving(true);
    try {
      await customerAPI.updatePrivacySettings(privacy);
      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', selectedImage);

    try {
      const response = await authAPI.uploadAvatar(formData);
      await updateUser({ avatar: response.data.url });
      toast.success('Profile picture updated');
      setShowAvatarModal(false);
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Add payment method
  const handleAddPaymentMethod = async () => {
    try {
      await customerAPI.addPaymentMethod(newPaymentMethod);
      toast.success('Payment method added successfully');
      setShowAddPaymentModal(false);
      setNewPaymentMethod({
        type: 'card',
        last4: '',
        expiry: '',
        is_default: false
      });
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    }
  };

  // Set default payment method
  const handleSetDefaultPayment = async (methodId) => {
    try {
      await customerAPI.setDefaultPaymentMethod(methodId);
      toast.success('Default payment method updated');
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment:', error);
      toast.error('Failed to update default payment method');
    }
  };

  // Delete payment method
  const handleDeletePaymentMethod = async (methodId) => {
    try {
      await customerAPI.deletePaymentMethod(methodId);
      toast.success('Payment method deleted');
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1 fw-bold">Settings</h2>
          <p className="text-muted mb-0">Manage your account preferences and configurations</p>
        </div>

        <Row>
          {/* Sidebar */}
          <Col lg={3} className="mb-4">
            <Card className="border-0 shadow-sm sticky-top" style={{ borderRadius: '16px', top: '20px' }}>
              <Card.Body className="p-3">
                {/* Profile Avatar */}
                <div className="text-center mb-3 pb-2 border-bottom">
                  <div className="position-relative d-inline-block">
                    <Image
                      src={user?.avatar || getAvatarUrl(user?.name || 'Customer', 80)}
                      alt={user?.name}
                      className="rounded-circle"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      onError={(e) => handleImageError(e, getAvatarUrl(user?.name || 'Customer', 80))}
                    />
                    <Button
                      variant="light"
                      size="sm"
                      className="position-absolute bottom-0 end-0 rounded-circle p-1"
                      onClick={() => setShowAvatarModal(true)}
                      style={{ width: '28px', height: '28px' }}
                    >
                      <FaCamera size={12} />
                    </Button>
                  </div>
                  <h6 className="mt-2 mb-0">{user?.name}</h6>
                  <small className="text-muted">{user?.email}</small>
                </div>

                <div className="d-flex flex-column gap-1">
                  <Button
                    variant={activeTab === 'profile' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('profile')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '10px 16px' }}
                  >
                    <FaUser size={16} />
                    <span>Profile</span>
                  </Button>

                  <Button
                    variant={activeTab === 'security' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('security')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '10px 16px' }}
                  >
                    <FaLock size={16} />
                    <span>Security</span>
                  </Button>

                  <Button
                    variant={activeTab === 'notifications' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('notifications')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '10px 16px' }}
                  >
                    <FaBell size={16} />
                    <span>Notifications</span>
                  </Button>

                  <Button
                    variant={activeTab === 'payments' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('payments')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '10px 16px' }}
                  >
                    <FaCreditCard size={16} />
                    <span>Payment Methods</span>
                  </Button>

                  <Button
                    variant={activeTab === 'privacy' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('privacy')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '10px 16px' }}
                  >
                    <FaShieldAlt size={16} />
                    <span>Privacy</span>
                  </Button>

                  <Button
                    variant={activeTab === 'appearance' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('appearance')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '10px 16px' }}
                  >
                    <FaPalette size={16} />
                    <span>Appearance</span>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={9}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <Card.Body className="p-4">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div>
                    <h5 className="fw-bold mb-4">Profile Information</h5>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            placeholder="your@email.com"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="+234 XXX XXX XXXX"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Country</Form.Label>
                          <Form.Select
                            value={profileForm.country}
                            onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                          >
                            <option value="Nigeria">Nigeria</option>
                            <option value="Ghana">Ghana</option>
                            <option value="Kenya">Kenya</option>
                            <option value="South Africa">South Africa</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Address</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            placeholder="Street address"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">City</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            placeholder="City"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">State</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            placeholder="State"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileForm.zipCode}
                            onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                            placeholder="ZIP code"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? <Spinner animation="border" size="sm" /> : <FaSave size={16} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div>
                    <h5 className="fw-bold mb-4">Security</h5>

                    <div className="mb-4">
                      <h6 className="mb-3">Change Password</h6>
                      <Button
                        variant="outline-primary"
                        onClick={() => setShowPasswordModal(true)}
                        className="d-flex align-items-center gap-2"
                      >
                        <FaLock size={16} />
                        Change Password
                      </Button>
                    </div>

                    <hr className="my-4" />

                    <div className="mb-4">
                      <h6 className="mb-3">Two-Factor Authentication</h6>
                      <p className="text-muted small mb-3">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button
                        variant="outline-primary"
                        className="d-flex align-items-center gap-2"
                      >
                        <FaShieldAlt size={16} />
                        Enable 2FA
                      </Button>
                    </div>

                    <hr className="my-4" />

                    <div className="mb-4">
                      <h6 className="mb-3">Login Alerts</h6>
                      <Form.Check
                        type="switch"
                        label="Send me email alerts for new login attempts"
                        checked={security.login_alerts}
                        onChange={(e) => setSecurity({ ...security, login_alerts: e.target.checked })}
                      />
                    </div>

                    <hr className="my-4" />

                    <div>
                      <h6 className="mb-3 text-danger">Danger Zone</h6>
                      <Alert variant="danger" style={{ borderRadius: '12px' }}>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                          <div>
                            <strong>Delete Account</strong>
                            <p className="mb-0 small">Permanently delete your account and all associated data.</p>
                          </div>
                          <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                            <FaTrash className="me-1" size={12} />
                            Delete Account
                          </Button>
                        </div>
                      </Alert>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div>
                    <h5 className="fw-bold mb-4">Notification Preferences</h5>

                    <div className="mb-4">
                      <h6 className="mb-3">Channels</h6>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          label="Email Notifications"
                          checked={notifications.email_notifications}
                          onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          label="Push Notifications"
                          checked={notifications.push_notifications}
                          onChange={(e) => setNotifications({ ...notifications, push_notifications: e.target.checked })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="switch"
                          label="SMS Notifications"
                          checked={notifications.sms_notifications}
                          onChange={(e) => setNotifications({ ...notifications, sms_notifications: e.target.checked })}
                        />
                      </Form.Group>
                    </div>

                    <div className="mb-4">
                      <h6 className="mb-3">Alert Types</h6>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="checkbox"
                          label="Booking Reminders"
                          checked={notifications.booking_reminders}
                          onChange={(e) => setNotifications({ ...notifications, booking_reminders: e.target.checked })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="checkbox"
                          label="Payment Alerts"
                          checked={notifications.payment_alerts}
                          onChange={(e) => setNotifications({ ...notifications, payment_alerts: e.target.checked })}
                        />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="checkbox"
                          label="Review Requests"
                          checked={notifications.review_requests}
                          onChange={(e) => setNotifications({ ...notifications, review_requests: e.target.checked })}
                        />
                      </Form.Group>
                      <Form.Group>
                        <Form.Check
                          type="checkbox"
                          label="Promotional Emails"
                          checked={notifications.promotional_emails}
                          onChange={(e) => setNotifications({ ...notifications, promotional_emails: e.target.checked })}
                        />
                      </Form.Group>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleUpdateNotifications}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? <Spinner animation="border" size="sm" /> : <FaSave size={16} />}
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                {activeTab === 'payments' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0">Payment Methods</h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setShowAddPaymentModal(true)}
                        className="d-flex align-items-center gap-2"
                      >
                        <FaCreditCard size={14} />
                        Add Payment Method
                      </Button>
                    </div>

                    {paymentMethods.length === 0 ? (
                      <div className="text-center py-5">
                        <FaCreditCard size={48} className="text-muted mb-3 opacity-50" />
                        <p className="text-muted mb-0">No payment methods added yet</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setShowAddPaymentModal(true)}
                          className="mt-2"
                        >
                          Add your first payment method
                        </Button>
                      </div>
                    ) : (
                      paymentMethods.map(method => (
                        <div key={method.id} className="payment-method-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                              <div className="payment-icon">
                                {method.type === 'card' ? (
                                  <FaCreditCard size={24} />
                                ) : (
                                  <FaMobileAlt size={24} />
                                )}
                              </div>
                              <div>
                                <div className="fw-semibold">
                                  {method.type === 'card' ? `•••• ${method.last4}` : method.provider}
                                </div>
                                {method.expiry && (
                                  <small className="text-muted">Expires {method.expiry}</small>
                                )}
                              </div>
                              {method.is_default && (
                                <Badge bg="success" className="ms-2">Default</Badge>
                              )}
                            </div>
                            <div className="d-flex gap-2">
                              {!method.is_default && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleSetDefaultPayment(method.id)}
                                >
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeletePaymentMethod(method.id)}
                              >
                                <FaTrash size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div>
                    <h5 className="fw-bold mb-4">Privacy Settings</h5>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Profile Visibility</Form.Label>
                      <Form.Select
                        value={privacy.profile_visibility}
                        onChange={(e) => setPrivacy({ ...privacy, profile_visibility: e.target.value })}
                      >
                        <option value="public">Public - Everyone can see</option>
                        <option value="private">Private - Only service providers</option>
                        <option value="hidden">Hidden - Not visible to anyone</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show email on profile"
                        checked={privacy.show_email}
                        onChange={(e) => setPrivacy({ ...privacy, show_email: e.target.checked })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show phone number on profile"
                        checked={privacy.show_phone}
                        onChange={(e) => setPrivacy({ ...privacy, show_phone: e.target.checked })}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show address on profile"
                        checked={privacy.show_address}
                        onChange={(e) => setPrivacy({ ...privacy, show_address: e.target.checked })}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleUpdatePrivacy}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? <Spinner animation="border" size="sm" /> : <FaSave size={16} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {activeTab === 'appearance' && (
                  <div>
                    <h5 className="fw-bold mb-4">Appearance</h5>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Theme</Form.Label>
                      <div className="d-flex gap-3">
                        <Button
                          variant={appearance.theme === 'light' ? 'primary' : 'outline-secondary'}
                          onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                          className="d-flex align-items-center gap-2"
                        >
                          <FaSun size={16} />
                          Light
                        </Button>
                        <Button
                          variant={appearance.theme === 'dark' ? 'primary' : 'outline-secondary'}
                          onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                          className="d-flex align-items-center gap-2"
                        >
                          <FaMoon size={16} />
                          Dark
                        </Button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Language</Form.Label>
                      <Form.Select
                        value={appearance.language}
                        onChange={(e) => setAppearance({ ...appearance, language: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                        <option value="de">German</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Compact View (Show more items per page)"
                        checked={appearance.compact_view}
                        onChange={(e) => setAppearance({ ...appearance, compact_view: e.target.checked })}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleUpdateAppearance}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? <Spinner animation="border" size="sm" /> : <FaSave size={16} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Current Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">Minimum 6 characters</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Confirm New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </Button>
              </InputGroup>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleChangePassword} disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Avatar Upload Modal */}
      <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Update Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {previewUrl ? (
            <div className="text-center">
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <Button
                variant="outline-danger"
                size="sm"
                className="mt-3 d-block mx-auto"
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
              >
                <FaTimes className="me-1" size={12} />
                Remove
              </Button>
            </div>
          ) : (
            <div
              className="text-center border-2 border-dashed rounded-3 p-5"
              style={{ borderColor: '#e2e8f0', cursor: 'pointer' }}
              onClick={() => document.getElementById('avatarUpload').click()}
            >
              <FaCamera size={48} className="text-muted mb-3" />
              <p className="mb-1">Click to upload an image</p>
              <small className="text-muted">PNG, JPG up to 5MB</small>
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowAvatarModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAvatarUpload} disabled={!selectedImage || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationTriangle className="me-2" />
            Are you sure you want to delete your account? This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={logout}>
            Delete Account
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .payment-method-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 12px;
          transition: all 0.2s;
        }
        .payment-method-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .payment-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sticky-top {
          top: 20px;
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

export default CustomerSettings;