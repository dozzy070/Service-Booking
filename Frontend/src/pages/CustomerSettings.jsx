// src/pages/CustomerSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, 
  Tab, Nav, Alert, Spinner, Badge, Modal,
  Image, ProgressBar
} from 'react-bootstrap';
import { 
  FaUser, FaBell, FaLock, FaGlobe, FaPalette,
  FaMoon, FaSun, FaLanguage, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaCamera, FaSave, FaKey,
  FaShieldAlt, FaEye, FaEyeSlash, FaCheckCircle,
  FaTimesCircle, FaDownload, FaUpload, FaTrash,
  FaCreditCard, FaHistory, FaQuestionCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';

const CustomerSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // Profile Settings
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: '',
    location: '',
    dateOfBirth: '',
    gender: '',
    website: ''
  });

  // Password Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    bookingUpdates: true,
    promotionalEmails: false,
    newsletter: true,
    paymentAlerts: true,
    chatNotifications: true,
    reviewReminders: true
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: 'everyone',
    activityStatus: true,
    readReceipts: true
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    fontSize: 'medium',
    colorScheme: 'blue',
    compactView: false,
    animations: true
  });

  // Language Settings
  const [language, setLanguage] = useState({
    preferred: 'en',
    autoTranslate: false
  });

  // Two Factor Authentication
  const [twoFactor, setTwoFactor] = useState({
    enabled: false,
    method: 'app',
    verified: false
  });

  // Login History
  const [loginHistory, setLoginHistory] = useState([
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'Lagos, Nigeria',
      ip: '192.168.1.1',
      time: '2 hours ago',
      current: true
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'Lagos, Nigeria',
      ip: '192.168.1.2',
      time: '3 days ago',
      current: false
    },
    {
      id: 3,
      device: 'Firefox on Mac',
      location: 'Abuja, Nigeria',
      ip: '192.168.1.3',
      time: '1 week ago',
      current: false
    }
  ]);

  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calculate password strength
  useEffect(() => {
    if (passwordData.newPassword) {
      let strength = 0;
      if (passwordData.newPassword.length >= 8) strength++;
      if (/[A-Z]/.test(passwordData.newPassword)) strength++;
      if (/[a-z]/.test(passwordData.newPassword)) strength++;
      if (/[0-9]/.test(passwordData.newPassword)) strength++;
      if (/[^A-Za-z0-9]/.test(passwordData.newPassword)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [passwordData.newPassword]);

  const getPasswordStrengthLabel = () => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[passwordStrength];
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];
    return colors[passwordStrength];
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };

  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacy(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAppearanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppearance(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateUser(profile);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Apply theme
      document.body.setAttribute('data-theme', appearance.theme);
      toast.success('Appearance settings updated');
    } catch (error) {
      toast.error('Failed to update appearance');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Profile picture updated');
      setShowAvatarModal(false);
      setPreviewAvatar(null);
    } catch (error) {
      toast.error('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Account deleted successfully');
      // Logout and redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Logged out from all other devices');
    } catch (error) {
      toast.error('Failed to logout from other devices');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTwoFactor({ ...twoFactor, enabled: true });
      toast.success('Two-factor authentication enabled');
    } catch (error) {
      toast.error('Failed to enable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTwoFactor({ ...twoFactor, enabled: false });
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error('Failed to disable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = () => {
    const data = {
      profile,
      notifications,
      privacy,
      loginHistory
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-data.json';
    a.click();
    toast.success('Data download started');
  };

  return (
    <Container fluid className="settings-container py-4">
      <Row className="mb-4">
        <Col>
          <h2>Settings</h2>
          <p className="text-muted">Manage your account settings and preferences</p>
        </Col>
      </Row>

      <Row>
        <Col lg={3} className="mb-4">
          {/* Settings Navigation */}
          <Card className="border-0 shadow-sm settings-nav">
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Link 
                  eventKey="profile" 
                  active={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUser className="me-2" /> Profile
                </Nav.Link>
                <Nav.Link 
                  eventKey="notifications" 
                  active={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                >
                  <FaBell className="me-2" /> Notifications
                </Nav.Link>
                <Nav.Link 
                  eventKey="security" 
                  active={activeTab === 'security'}
                  onClick={() => setActiveTab('security')}
                >
                  <FaLock className="me-2" /> Security
                </Nav.Link>
                <Nav.Link 
                  eventKey="privacy" 
                  active={activeTab === 'privacy'}
                  onClick={() => setActiveTab('privacy')}
                >
                  <FaShieldAlt className="me-2" /> Privacy
                </Nav.Link>
                <Nav.Link 
                  eventKey="appearance" 
                  active={activeTab === 'appearance'}
                  onClick={() => setActiveTab('appearance')}
                >
                  <FaPalette className="me-2" /> Appearance
                </Nav.Link>
                <Nav.Link 
                  eventKey="language" 
                  active={activeTab === 'language'}
                  onClick={() => setActiveTab('language')}
                >
                  <FaLanguage className="me-2" /> Language
                </Nav.Link>
                <Nav.Link 
                  eventKey="history" 
                  active={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                >
                  <FaHistory className="me-2" /> Login History
                </Nav.Link>
                <Nav.Link 
                  eventKey="data" 
                  active={activeTab === 'data'}
                  onClick={() => setActiveTab('data')}
                >
                  <FaDownload className="me-2" /> Data & Privacy
                </Nav.Link>
                <Nav.Link 
                  eventKey="help" 
                  active={activeTab === 'help'}
                  onClick={() => setActiveTab('help')}
                >
                  <FaQuestionCircle className="me-2" /> Help & Support
                </Nav.Link>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5>Profile Information</h5>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => setShowAvatarModal(true)}
                  >
                    <FaCamera className="me-2" /> Change Photo
                  </Button>
                </div>

                <Row>
                  <Col md={3} className="text-center mb-4">
                    <div className="profile-avatar-wrapper">
                      <Image
                        src={previewAvatar || user?.avatar || getAvatarUrl(user?.name, 120)}
                        alt={user?.name}
                        roundedCircle
                        className="profile-avatar"
                        style={{ width: 120, height: 120, objectFit: 'cover' }}
                        onError={(e) => handleImageError(e, getAvatarUrl(user?.name, 120))}
                      />
                      <Button
                        variant="light"
                        size="sm"
                        className="avatar-edit-btn"
                        onClick={() => setShowAvatarModal(true)}
                      >
                        <FaCamera />
                      </Button>
                    </div>
                  </Col>

                  <Col md={9}>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={profile.name}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={profile.email}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={profile.phone}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control
                              type="date"
                              name="dateOfBirth"
                              value={profile.dateOfBirth}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                          type="text"
                          name="location"
                          value={profile.location}
                          onChange={handleProfileChange}
                          placeholder="City, Country"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Bio</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="bio"
                          value={profile.bio}
                          onChange={handleProfileChange}
                          placeholder="Tell us a little about yourself"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                          type="url"
                          name="website"
                          value={profile.website}
                          onChange={handleProfileChange}
                          placeholder="https://example.com"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Gender</Form.Label>
                        <Form.Select
                          name="gender"
                          value={profile.gender}
                          onChange={handleProfileChange}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not">Prefer not to say</option>
                        </Form.Select>
                      </Form.Group>

                      <div className="d-flex justify-content-end mt-4">
                        <Button 
                          variant="primary"
                          onClick={handleSaveProfile}
                          disabled={loading}
                        >
                          {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                          Save Changes
                        </Button>
                      </div>
                    </Form>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Notification Preferences</h5>

                <div className="mb-4">
                  <h6 className="mb-3">Communication Channels</h6>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="emailNotifications"
                      name="emailNotifications"
                      label="Email Notifications"
                      checked={notifications.emailNotifications}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="pushNotifications"
                      name="pushNotifications"
                      label="Push Notifications"
                      checked={notifications.pushNotifications}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="smsNotifications"
                      name="smsNotifications"
                      label="SMS Notifications"
                      checked={notifications.smsNotifications}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Booking Updates</h6>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="bookingUpdates"
                      name="bookingUpdates"
                      label="Booking confirmations and updates"
                      checked={notifications.bookingUpdates}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="paymentAlerts"
                      name="paymentAlerts"
                      label="Payment alerts and receipts"
                      checked={notifications.paymentAlerts}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="chatNotifications"
                      name="chatNotifications"
                      label="New message notifications"
                      checked={notifications.chatNotifications}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="reviewReminders"
                      name="reviewReminders"
                      label="Review reminders after service"
                      checked={notifications.reviewReminders}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Marketing</h6>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="promotionalEmails"
                      name="promotionalEmails"
                      label="Promotional emails and offers"
                      checked={notifications.promotionalEmails}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="newsletter"
                      name="newsletter"
                      label="Weekly newsletter"
                      checked={notifications.newsletter}
                      onChange={handleNotificationChange}
                    />
                  </Form.Group>
                </div>

                <div className="d-flex justify-content-end">
                  <Button 
                    variant="primary"
                    onClick={handleSaveNotifications}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                    Save Preferences
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Security Settings</h5>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="mb-1">Password</h6>
                      <p className="text-muted small mb-0">Last changed 30 days ago</p>
                    </div>
                    <Button 
                      variant="outline-primary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <FaKey className="me-2" /> Change Password
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Two-Factor Authentication</h6>
                      <p className="text-muted small mb-0">
                        {twoFactor.enabled 
                          ? 'Two-factor authentication is enabled' 
                          : 'Add an extra layer of security to your account'}
                      </p>
                    </div>
                    <Button 
                      variant={twoFactor.enabled ? 'outline-danger' : 'outline-success'}
                      onClick={twoFactor.enabled ? handleDisable2FA : handleEnable2FA}
                      disabled={loading}
                    >
                      {twoFactor.enabled ? 'Disable' : 'Enable'} 2FA
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">Active Sessions</h6>
                      <p className="text-muted small mb-0">
                        You're currently logged in on {loginHistory.filter(h => h.current).length} device
                      </p>
                    </div>
                    <Button 
                      variant="outline-warning"
                      onClick={handleLogoutAllDevices}
                      disabled={loading}
                    >
                      Logout All Devices
                    </Button>
                  </div>
                </div>

                <hr />

                <div>
                  <h6 className="mb-3 text-danger">Danger Zone</h6>
                  <Button 
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Privacy Settings</h5>

                <div className="mb-4">
                  <h6 className="mb-3">Profile Visibility</h6>
                  <Form.Group className="mb-2">
                    <Form.Select
                      name="profileVisibility"
                      value={privacy.profileVisibility}
                      onChange={handlePrivacyChange}
                    >
                      <option value="public">Public - Anyone can see my profile</option>
                      <option value="private">Private - Only service providers</option>
                      <option value="hidden">Hidden - No one can see my profile</option>
                    </Form.Select>
                  </Form.Group>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Personal Information</h6>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="showEmail"
                      name="showEmail"
                      label="Show email on profile"
                      checked={privacy.showEmail}
                      onChange={handlePrivacyChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="showPhone"
                      name="showPhone"
                      label="Show phone number"
                      checked={privacy.showPhone}
                      onChange={handlePrivacyChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="showLocation"
                      name="showLocation"
                      label="Show location"
                      checked={privacy.showLocation}
                      onChange={handlePrivacyChange}
                    />
                  </Form.Group>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Communication</h6>
                  <Form.Group className="mb-2">
                    <Form.Label>Who can message you</Form.Label>
                    <Form.Select
                      name="allowMessages"
                      value={privacy.allowMessages}
                      onChange={handlePrivacyChange}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="providers">Only service providers</option>
                      <option value="none">No one</option>
                    </Form.Select>
                  </Form.Group>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Activity Status</h6>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="activityStatus"
                      name="activityStatus"
                      label="Show when you're active"
                      checked={privacy.activityStatus}
                      onChange={handlePrivacyChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="readReceipts"
                      name="readReceipts"
                      label="Send read receipts"
                      checked={privacy.readReceipts}
                      onChange={handlePrivacyChange}
                    />
                  </Form.Group>
                </div>

                <div className="d-flex justify-content-end">
                  <Button 
                    variant="primary"
                    onClick={handleSavePrivacy}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                    Save Privacy Settings
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Appearance Settings</h5>

                <div className="mb-4">
                  <h6 className="mb-3">Theme</h6>
                  <div className="d-flex gap-3">
                    <Button
                      variant={appearance.theme === 'light' ? 'primary' : 'outline-secondary'}
                      onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                      className="theme-option"
                    >
                      <FaSun className="me-2" /> Light
                    </Button>
                    <Button
                      variant={appearance.theme === 'dark' ? 'primary' : 'outline-secondary'}
                      onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                      className="theme-option"
                    >
                      <FaMoon className="me-2" /> Dark
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Color Scheme</h6>
                  <div className="d-flex gap-2">
                    {['blue', 'purple', 'green', 'orange', 'red'].map(color => (
                      <Button
                        key={color}
                        variant={appearance.colorScheme === color ? 'primary' : 'outline-secondary'}
                        onClick={() => setAppearance({ ...appearance, colorScheme: color })}
                        className="color-option"
                        style={{
                          backgroundColor: appearance.colorScheme === color ? `var(--${color})` : 'transparent',
                          borderColor: `var(--${color})`,
                          color: appearance.colorScheme === color ? '#fff' : `var(--${color})`
                        }}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Font Size</h6>
                  <Form.Select
                    name="fontSize"
                    value={appearance.fontSize}
                    onChange={handleAppearanceChange}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </Form.Select>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Display Options</h6>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="compactView"
                      name="compactView"
                      label="Compact view"
                      checked={appearance.compactView}
                      onChange={handleAppearanceChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Check
                      type="switch"
                      id="animations"
                      name="animations"
                      label="Enable animations"
                      checked={appearance.animations}
                      onChange={handleAppearanceChange}
                    />
                  </Form.Group>
                </div>

                <div className="d-flex justify-content-end">
                  <Button 
                    variant="primary"
                    onClick={handleSaveAppearance}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                    Save Appearance
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Language Settings */}
          {activeTab === 'language' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Language Settings</h5>

                <Form.Group className="mb-4">
                  <Form.Label>Preferred Language</Form.Label>
                  <Form.Select
                    value={language.preferred}
                    onChange={(e) => setLanguage({ ...language, preferred: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="switch"
                    id="autoTranslate"
                    label="Auto-translate messages"
                    checked={language.autoTranslate}
                    onChange={(e) => setLanguage({ ...language, autoTranslate: e.target.checked })}
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button variant="primary">
                    <FaSave className="me-2" /> Save Language Settings
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Login History */}
          {activeTab === 'history' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Login History</h5>

                {loginHistory.map(login => (
                  <div key={login.id} className="login-history-item mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">
                          {login.device}
                          {login.current && <Badge bg="success" className="ms-2">Current</Badge>}
                        </h6>
                        <p className="text-muted small mb-1">
                          <FaMapMarkerAlt className="me-1" size={12} />
                          {login.location}
                        </p>
                        <p className="text-muted small mb-0">
                          IP: {login.ip} • {login.time}
                        </p>
                      </div>
                      {!login.current && (
                        <Button variant="outline-danger" size="sm">
                          Logout
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="mt-3">
                  <Button variant="outline-primary" onClick={handleLogoutAllDevices}>
                    Logout All Other Devices
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Data & Privacy */}
          {activeTab === 'data' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Data & Privacy</h5>

                <div className="mb-4">
                  <h6 className="mb-3">Download Your Data</h6>
                  <p className="text-muted small">
                    Get a copy of your data including profile information, bookings, and messages.
                  </p>
                  <Button variant="outline-primary" onClick={handleDownloadData}>
                    <FaDownload className="me-2" /> Request Data Download
                  </Button>
                </div>

                <hr />

                <div className="mb-4">
                  <h6 className="mb-3 text-danger">Delete Your Account</h6>
                  <p className="text-muted small">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FaTrash className="me-2" /> Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Help & Support */}
          {activeTab === 'help' && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-4">Help & Support</h5>

                <div className="mb-4">
                  <h6 className="mb-3">Frequently Asked Questions</h6>
                  <div className="faq-item mb-3">
                    <p className="fw-semibold mb-1">How do I change my password?</p>
                    <p className="text-muted small">
                      Go to Security settings and click on "Change Password". You'll need your current password to set a new one.
                    </p>
                  </div>
                  <div className="faq-item mb-3">
                    <p className="fw-semibold mb-1">How do I delete my account?</p>
                    <p className="text-muted small">
                      You can delete your account from the Data & Privacy section. This action is permanent and cannot be undone.
                    </p>
                  </div>
                  <div className="faq-item mb-3">
                    <p className="fw-semibold mb-1">How do I update my payment methods?</p>
                    <p className="text-muted small">
                      Go to Payment Methods in your dashboard to add, remove, or update your payment information.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="mb-3">Contact Support</h6>
                  <p className="text-muted small">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <div className="d-flex gap-2">
                    <Button variant="primary" href="mailto:support@example.com">
                      <FaEnvelope className="me-2" /> Email Support
                    </Button>
                    <Button variant="outline-primary" href="tel:+1234567890">
                      <FaPhone className="me-2" /> Call Us
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                isInvalid={!!passwordErrors.currentPassword}
              />
              <Form.Control.Feedback type="invalid">
                {passwordErrors.currentPassword}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                isInvalid={!!passwordErrors.newPassword}
              />
              <Form.Control.Feedback type="invalid">
                {passwordErrors.newPassword}
              </Form.Control.Feedback>
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small>Password strength: {getPasswordStrengthLabel()}</small>
                  </div>
                  <ProgressBar 
                    now={(passwordStrength / 5) * 100} 
                    variant={passwordStrength < 3 ? 'danger' : passwordStrength < 4 ? 'warning' : 'success'}
                    style={{ height: '4px' }}
                  />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                isInvalid={!!passwordErrors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {passwordErrors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Change Password'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Avatar Modal */}
      <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <Image
              src={previewAvatar || user?.avatar || getAvatarUrl(user?.name, 150)}
              alt="Profile Preview"
              roundedCircle
              style={{ width: 150, height: 150, objectFit: 'cover' }}
            />
          </div>
          <Form.Group>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAvatarModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveAvatar}
            disabled={loading || !previewAvatar}
          >
            {loading ? <Spinner size="sm" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Account Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">Are you sure you want to delete your account? This action:</p>
          <ul className="text-danger">
            <li>Cannot be undone</li>
            <li>Will permanently delete all your data</li>
            <li>Will cancel all upcoming bookings</li>
            <li>Will remove your reviews and history</li>
          </ul>
          <Form.Group className="mt-3">
            <Form.Check
              type="checkbox"
              label="I understand that this action is permanent"
              id="confirmDelete"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Permanently Delete Account'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx="true">{`
        .settings-nav .nav-link {
          padding: 12px 20px;
          color: #4a5568;
          border-radius: 0;
          border-left: 3px solid transparent;
        }

        .settings-nav .nav-link:hover {
          background: #f7fafc;
          border-left-color: #cbd5e0;
        }

        .settings-nav .nav-link.active {
          background: #ebf8ff;
          color: #3182ce;
          border-left-color: #3182ce;
          font-weight: 500;
        }

        .profile-avatar-wrapper {
          position: relative;
          display: inline-block;
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 2px solid #e2e8f0;
        }

        .theme-option, .color-option {
          min-width: 100px;
        }

        .login-history-item {
          transition: all 0.2s ease;
        }

        .login-history-item:hover {
          background: #f7fafc;
        }

        @media (max-width: 768px) {
          .settings-nav {
            margin-bottom: 20px;
          }
        }
      `}</style>
    </Container>
  );
};

export default CustomerSettings;