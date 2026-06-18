// src/components/provider/ProviderSettings.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Tabs,
  Tab,
  Spinner,
  Badge,
  Modal,
  Image,
  InputGroup
} from 'react-bootstrap';
import {
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  CreditCard,
  Users,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageCircle,
  DollarSign,
  Banknote,
  Building2,
  LogOut,
  
  
  ArrowUp,
  ArrowDown,
  User as UserIcon,
  Phone,
  MapPin,
  Briefcase,
  Calendar
} from 'lucide-react';
// No duplicate imports from react-icons/fa

import { useAuth } from '../../context/AuthContext';
import { providerAPI, authAPI } from '../../api/api';
import toast from 'react-hot-toast';

const ProviderSettings = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Profile Settings
    businessName: '',
    displayName: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    website: '',
    timezone: 'Africa/Lagos',
    language: 'English',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newBookingAlerts: true,
    paymentAlerts: true,
    marketingEmails: false,
    promotionalSMS: false,
    
    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showPhone: true,
    showAddress: false,
    
    // Payment Settings
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
    automaticPayouts: true,
    payoutThreshold: 50000,
    
    // Appearance
    theme: 'light',
    compactView: false,
    
    // Password change
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Fetch provider profile
  const fetchProviderProfile = useCallback(async () => {
    try {
      const response = await providerAPI.getProfile();
      const profileData = response.data;
      setSettings(prev => ({
        ...prev,
        businessName: profileData.business_name || '',
        displayName: profileData.display_name || user?.name || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        zipCode: profileData.zip_code || '',
        website: profileData.website || '',
        bankName: profileData.bank_name || '',
        accountNumber: profileData.account_number || '',
        accountName: profileData.account_name || '',
        automaticPayouts: profileData.automatic_payouts !== false,
        payoutThreshold: profileData.payout_threshold || 50000,
        profileVisibility: profileData.profile_visibility || 'public',
        showEmail: profileData.show_email || false,
        showPhone: profileData.show_phone !== false,
        showAddress: profileData.show_address || false
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  }, [user]);

  // Fetch notification preferences
  const fetchNotificationPrefs = useCallback(async () => {
    try {
      const response = await providerAPI.getNotificationPreferences();
      const prefs = response.data;
      setSettings(prev => ({
        ...prev,
        emailNotifications: prefs.email_notifications !== false,
        pushNotifications: prefs.push_notifications !== false,
        smsNotifications: prefs.sms_notifications || false,
        newBookingAlerts: prefs.new_booking_alerts !== false,
        paymentAlerts: prefs.payment_alerts !== false,
        marketingEmails: prefs.marketing_emails || false,
        promotionalSMS: prefs.promotional_sms || false
      }));
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProviderProfile(),
      fetchNotificationPrefs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Save profile settings
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const profileData = {
        business_name: settings.businessName,
        display_name: settings.displayName,
        phone: settings.phone,
        bio: settings.bio,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        zip_code: settings.zipCode,
        website: settings.website,
        bank_name: settings.bankName,
        account_number: settings.accountNumber,
        account_name: settings.accountName,
        automatic_payouts: settings.automaticPayouts,
        payout_threshold: settings.payoutThreshold,
        profile_visibility: settings.profileVisibility,
        show_email: settings.showEmail,
        show_phone: settings.showPhone,
        show_address: settings.showAddress
      };
      
      await providerAPI.updateProfile(profileData);
      await updateUser({ name: settings.displayName, email: settings.email });
      toast.success('Profile settings saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Save notification preferences
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await providerAPI.updateNotificationPreferences({
        email_notifications: settings.emailNotifications,
        push_notifications: settings.pushNotifications,
        sms_notifications: settings.smsNotifications,
        new_booking_alerts: settings.newBookingAlerts,
        payment_alerts: settings.paymentAlerts,
        marketing_emails: settings.marketingEmails,
        promotional_sms: settings.promotionalSMS
      });
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
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

  // Enable 2FA
  const handleEnable2FA = async () => {
    setSaving(true);
    try {
      const response = await providerAPI.enable2FA();
      // Show QR code or setup instructions
      toast.success('2FA setup initiated');
      // You can add QR code display logic here
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast.error('Failed to enable 2FA');
    } finally {
      setSaving(false);
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
                <div className="d-flex flex-column gap-2">
                  <Button
                    variant={activeTab === 'profile' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('profile')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <Users size={18} />
                    <span>Profile</span>
                  </Button>
                  
                  <Button
                    variant={activeTab === 'notifications' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('notifications')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <Bell size={18} />
                    <span>Notifications</span>
                  </Button>
                  
                  <Button
                    variant={activeTab === 'privacy' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('privacy')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <Shield size={18} />
                    <span>Privacy</span>
                  </Button>
                  
                  <Button
                    variant={activeTab === 'payments' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('payments')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <CreditCard size={18} />
                    <span>Payments</span>
                  </Button>
                  
                  <Button
                    variant={activeTab === 'security' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('security')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <Lock size={18} />
                    <span>Security</span>
                  </Button>
                  
                  <Button
                    variant={activeTab === 'appearance' ? 'primary' : 'light'}
                    onClick={() => setActiveTab('appearance')}
                    className="d-flex align-items-center gap-2 text-start border-0"
                    style={{ borderRadius: '12px', padding: '12px 16px' }}
                  >
                    <Palette size={18} />
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
                          <Form.Label className="fw-semibold">Business Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="businessName"
                            value={settings.businessName}
                            onChange={handleChange}
                            placeholder="Enter your business name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Display Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="displayName"
                            value={settings.displayName}
                            onChange={handleChange}
                            placeholder="How you want to be seen"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            placeholder="+234 XXX XXX XXXX"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Bio / Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="bio"
                            value={settings.bio}
                            onChange={handleChange}
                            placeholder="Tell customers about your services"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Address</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={settings.address}
                            onChange={handleChange}
                            placeholder="Street address"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">City</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={settings.city}
                            onChange={handleChange}
                            placeholder="City"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">State</Form.Label>
                          <Form.Control
                            type="text"
                            name="state"
                            value={settings.state}
                            onChange={handleChange}
                            placeholder="State"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="zipCode"
                            value={settings.zipCode}
                            onChange={handleChange}
                            placeholder="ZIP code"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Website (Optional)</Form.Label>
                          <Form.Control
                            type="url"
                            name="website"
                            value={settings.website}
                            onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <Save size={18} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div>
                    <h5 className="fw-bold mb-4">Notification Preferences</h5>
                    
                    <div className="mb-4">
                      <h6 className="mb-3">Channels</h6>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Email Notifications"
                          name="emailNotifications"
                          checked={settings.emailNotifications}
                          onChange={handleChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Push Notifications"
                          name="pushNotifications"
                          checked={settings.pushNotifications}
                          onChange={handleChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="SMS Notifications"
                          name="smsNotifications"
                          checked={settings.smsNotifications}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </div>

                    <div className="mb-4">
                      <h6 className="mb-3">Alert Types</h6>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="New Booking Alerts"
                          name="newBookingAlerts"
                          checked={settings.newBookingAlerts}
                          onChange={handleChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Payment Alerts"
                          name="paymentAlerts"
                          checked={settings.paymentAlerts}
                          onChange={handleChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Marketing Emails"
                          name="marketingEmails"
                          checked={settings.marketingEmails}
                          onChange={handleChange}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Promotional SMS"
                          name="promotionalSMS"
                          checked={settings.promotionalSMS}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleSaveNotifications}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <Save size={18} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Privacy Settings */}
                {activeTab === 'privacy' && (
                  <div>
                    <h5 className="fw-bold mb-4">Privacy Settings</h5>
                    
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Profile Visibility</Form.Label>
                      <Form.Select
                        name="profileVisibility"
                        value={settings.profileVisibility}
                        onChange={handleChange}
                      >
                        <option value="public">Public - Everyone can see</option>
                        <option value="private">Private - Only verified customers</option>
                        <option value="hidden">Hidden - Not searchable</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show email on profile"
                        name="showEmail"
                        checked={settings.showEmail}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show phone on profile"
                        name="showPhone"
                        checked={settings.showPhone}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Show address on profile"
                        name="showAddress"
                        checked={settings.showAddress}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <Save size={18} />
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payments' && (
                  <div>
                    <h5 className="fw-bold mb-4">Payment Settings</h5>
                    
                    <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
                      <div className="d-flex gap-2">
                        <Banknote size={20} />
                        <div>
                          <strong>Payout Information</strong>
                          <p className="mb-0 small">Minimum payout threshold is {formatNaira(settings.payoutThreshold)}</p>
                        </div>
                      </div>
                    </Alert>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Bank Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="bankName"
                            value={settings.bankName}
                            onChange={handleChange}
                            placeholder="e.g., First Bank"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Account Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="accountNumber"
                            value={settings.accountNumber}
                            onChange={handleChange}
                            placeholder="10-digit account number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">Account Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="accountName"
                            value={settings.accountName}
                            onChange={handleChange}
                            placeholder="Account holder name"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Automatic Payouts"
                        name="automaticPayouts"
                        checked={settings.automaticPayouts}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Payout Threshold ({formatNaira(settings.payoutThreshold)})</Form.Label>
                      <Form.Control
                        type="number"
                        name="payoutThreshold"
                        value={settings.payoutThreshold}
                        onChange={handleChange}
                        min="10000"
                        step="5000"
                      />
                      <Form.Text className="text-muted">
                        Auto-payout when your available balance reaches this amount (minimum ₦10,000)
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <Save size={18} />
                        )}
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
                        <Lock size={16} />
                        Change Password
                      </Button>
                    </div>

                    <hr className="my-4" />

                    <div>
                      <h6 className="mb-3">Two-Factor Authentication</h6>
                      <p className="text-muted small mb-3">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button
                        variant="outline-primary"
                        onClick={handleEnable2FA}
                        disabled={saving}
                        className="d-flex align-items-center gap-2"
                      >
                        <Shield size={16} />
                        Enable 2FA
                      </Button>
                    </div>

                    <hr className="my-4" />

                    <div>
                      <h6 className="mb-3 text-danger">Danger Zone</h6>
                      <Alert variant="danger" style={{ borderRadius: '12px' }}>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                          <div>
                            <strong>Deactivate Account</strong>
                            <p className="mb-0 small">Once you deactivate your account, all your data will be removed.</p>
                          </div>
                          <Button variant="outline-danger" size="sm">
                            Deactivate Account
                          </Button>
                        </div>
                      </Alert>
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
                          variant={settings.theme === 'light' ? 'primary' : 'outline-secondary'}
                          onClick={() => setSettings({ ...settings, theme: 'light' })}
                          className="d-flex align-items-center gap-2"
                        >
                          <Sun size={16} />
                          Light
                        </Button>
                        <Button
                          variant={settings.theme === 'dark' ? 'primary' : 'outline-secondary'}
                          onClick={() => setSettings({ ...settings, theme: 'dark' })}
                          className="d-flex align-items-center gap-2"
                        >
                          <Moon size={16} />
                          Dark
                        </Button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        label="Compact View (Show more items per page)"
                        name="compactView"
                        checked={settings.compactView}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {saving ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : (
                          <Save size={18} />
                        )}
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
              <div className="position-relative">
                <Form.Control
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-0 text-muted"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ textDecoration: 'none' }}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">New Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-0 text-muted"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ textDecoration: 'none' }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <Form.Text className="text-muted">Minimum 6 characters</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Confirm New Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-0 text-muted"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ textDecoration: 'none' }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleChangePassword}
            disabled={saving}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProviderSettings;