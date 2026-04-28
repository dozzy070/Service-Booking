// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Nav, Alert, Spinner, Badge } from 'react-bootstrap';
import { 
  FaBell, FaLock, FaGlobe, FaPalette, FaSave,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser,
  FaCreditCard, FaShieldAlt, 
  FaCog, FaUsers, FaServicestack, FaCalendarCheck,
  FaMoneyBillWave, FaChartBar, FaDatabase, FaPlug,
  FaLanguage, FaMoon, FaSun, 
  FaCheckCircle, FaClock,
  FaArrowLeft, FaHome
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine user role
  const role = user?.role || 'customer';
  const isCustomer = role === 'customer';
  const isProvider = role === 'provider';
  const isAdmin = role === 'admin';

  // Get dashboard route based on role
  const getDashboardRoute = () => {
    switch(role) {
      case 'admin': return '/admin/dashboard';
      case 'provider': return '/provider/dashboard';
      case 'customer': return '/customer/dashboard';
      default: return '/';
    }
  };

  // ========== PROFILE SETTINGS (Common for all roles) ==========
  const [profileSettings, setProfileSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });

  // ========== NOTIFICATION SETTINGS (All roles) ==========
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    
    // Common notifications
    bookingUpdates: true,
    paymentUpdates: true,
    messageAlerts: true,
    
    // Customer specific
    ...(isCustomer && {
      promotionAlerts: true,
      favoriteUpdates: false,
      reviewReminders: true
    }),
    
    // Provider specific
    ...(isProvider && {
      newBookingAlerts: true,
      bookingReminders: true,
      paymentAlerts: true,
      reviewAlerts: true,
      weeklySummary: false,
      earningReports: true
    }),
    
    // Admin specific
    ...(isAdmin && {
      userRegistrationAlerts: true,
      serviceApprovalAlerts: true,
      disputeAlerts: true,
      systemAlerts: true,
      reportAlerts: true,
      dailyDigest: false
    })
  });

  // ========== PRIVACY SETTINGS (All roles) ==========
  const [privacySettings, setPrivacySettings] = useState({
    showProfilePublic: true,
    showEmail: false,
    showPhone: false,
    showLocation: false,
    allowMessages: true,
    allowReviews: true,
    
    // Provider specific
    ...(isProvider && {
      showBusinessHours: true,
      showServiceArea: true,
      showRates: true,
      allowBookingRequests: true
    }),
    
    // Admin specific
    ...(isAdmin && {
      showOnlineStatus: false,
      showActivityLog: false,
      allowMentions: false
    })
  });

  // ========== SECURITY SETTINGS (All roles) ==========
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    deviceManagement: [],
    activeSessions: [
      { device: 'Chrome on Windows', location: 'New York, USA', lastActive: '2 minutes ago', current: true },
      { device: 'Safari on iPhone', location: 'New York, USA', lastActive: '2 hours ago', current: false }
    ]
  });

  // ========== PAYMENT SETTINGS (Customer & Provider) ==========
  const [paymentSettings, setPaymentSettings] = useState({
    // Customer payment settings
    ...(isCustomer && {
      defaultPaymentMethod: 'visa',
      autoPay: false,
      paymentMethods: [
        { id: 1, type: 'visa', last4: '4242', default: true },
        { id: 2, type: 'mastercard', last4: '8888', default: false }
      ]
    }),
    
    // Provider payment settings
    ...(isProvider && {
      autoPayout: true,
      payoutMethod: 'bank',
      payoutFrequency: 'weekly',
      bankAccount: {
        bankName: 'Chase Bank',
        accountNumber: '****1234',
        routingNumber: '****5678'
      },
      taxInfo: {
        businessType: 'Individual',
        taxId: '***-**-1234',
        w9Submitted: true
      }
    })
  });

  // ========== BUSINESS SETTINGS (Provider only) ==========
  const [businessSettings, setBusinessSettings] = useState({
    businessName: user?.businessName || '',
    businessAddress: '',
    businessPhone: user?.phone || '',
    businessEmail: user?.email || '',
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '', close: '', closed: true },
      sunday: { open: '', close: '', closed: true }
    },
    serviceRadius: 25,
    maxBookingsPerDay: 5,
    cancellationPolicy: 'flexible',
    serviceAreas: ['New York', 'Brooklyn', 'Queens'],
    categories: ['Cleaning', 'Repair', 'Maintenance']
  });

  // ========== SYSTEM SETTINGS (Admin only) ==========
  const [systemSettings, setSystemSettings] = useState({
    general: {
      siteName: 'SmartServices',
      siteUrl: 'https://smartservices.com',
      supportEmail: 'support@smartservices.com',
      supportPhone: '+1-800-123-4567',
      maintenanceMode: false
    },
    features: {
      enableReviews: true,
      enableChat: true,
      enablePayments: true,
      enableNotifications: true,
      enableProviderVerification: true
    },
    security: {
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireEmailVerification: true,
      sessionTimeout: 60
    },
    email: {
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: 'noreply@smartservices.com',
      smtpPassword: '********'
    },
    payment: {
      currency: 'USD',
      taxRate: 10,
      commissionRate: 15,
      minPayoutAmount: 50
    }
  });

  // ========== APPEARANCE SETTINGS (All roles) ==========
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    compactMode: false,
    fontSize: 'medium',
    colorScheme: 'default',
    animations: true
  });

  // ========== LANGUAGE SETTINGS (All roles) ==========
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: 'America/New_York'
  });

  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(`settings_${role}_${user?.id}`);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          
          // Merge saved settings with defaults
          if (parsed.profile) setProfileSettings(parsed.profile);
          if (parsed.notifications) setNotificationSettings(parsed.notifications);
          if (parsed.privacy) setPrivacySettings(parsed.privacy);
          if (parsed.security) setSecuritySettings(parsed.security);
          if (parsed.payment) setPaymentSettings(parsed.payment);
          if (isProvider && parsed.business) setBusinessSettings(parsed.business);
          if (isAdmin && parsed.system) setSystemSettings(parsed.system);
          if (parsed.appearance) setAppearanceSettings(parsed.appearance);
          if (parsed.language) setLanguageSettings(parsed.language);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (user?.id) {
      loadSettings();
    }
  }, [user?.id, role, isProvider, isAdmin]);

  // Save all settings
  const saveAllSettings = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const allSettings = {
        profile: profileSettings,
        notifications: notificationSettings,
        privacy: privacySettings,
        security: securitySettings,
        payment: paymentSettings,
        appearance: appearanceSettings,
        language: languageSettings,
        ...(isProvider && { business: businessSettings }),
        ...(isAdmin && { system: systemSettings })
      };
      
      localStorage.setItem(`settings_${role}_${user?.id}`, JSON.stringify(allSettings));
      
      // Update user context if name or email changed
      if (profileSettings.name !== user?.name || profileSettings.email !== user?.email) {
        updateUser({
          name: profileSettings.name,
          email: profileSettings.email,
          phone: profileSettings.phone
        });
      }
      
      setLoading(false);
      setSaved(true);
      toast.success('Settings saved successfully!');
      
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  // Get navigation items based on role
  const getNavItems = () => {
    const items = [
      { key: 'profile', label: 'Profile', icon: <FaUser />, roles: ['customer', 'provider', 'admin'] },
      { key: 'notifications', label: 'Notifications', icon: <FaBell />, roles: ['customer', 'provider', 'admin'] },
      { key: 'privacy', label: 'Privacy', icon: <FaLock />, roles: ['customer', 'provider', 'admin'] },
      { key: 'security', label: 'Security', icon: <FaShieldAlt />, roles: ['customer', 'provider', 'admin'] },
      { key: 'payment', label: 'Payments', icon: <FaCreditCard />, roles: ['customer', 'provider'] },
      { key: 'appearance', label: 'Appearance', icon: <FaPalette />, roles: ['customer', 'provider', 'admin'] },
      { key: 'language', label: 'Language', icon: <FaLanguage />, roles: ['customer', 'provider', 'admin'] },
    ];

    // Add provider-specific items
    if (isProvider) {
      items.splice(4, 0, { key: 'business', label: 'Business', icon: <FaMapMarkerAlt />, roles: ['provider'] });
    }

    // Add admin-specific items
    if (isAdmin) {
      items.push(
        { key: 'system', label: 'System', icon: <FaCog />, roles: ['admin'] },
        { key: 'users', label: 'User Management', icon: <FaUsers />, roles: ['admin'] },
        { key: 'services', label: 'Service Config', icon: <FaServicestack />, roles: ['admin'] },
        { key: 'bookings', label: 'Booking Config', icon: <FaCalendarCheck />, roles: ['admin'] },
        { key: 'financial', label: 'Financial', icon: <FaMoneyBillWave />, roles: ['admin'] },
        { key: 'reports', label: 'Reports', icon: <FaChartBar />, roles: ['admin'] },
        { key: 'database', label: 'Database', icon: <FaDatabase />, roles: ['admin'] },
        { key: 'integrations', label: 'Integrations', icon: <FaPlug />, roles: ['admin'] }
      );
    }

    return items.filter(item => item.roles.includes(role));
  };

  const navItems = getNavItems();

  // Handle mobile sidebar toggle
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Container fluid className="settings-container py-3 py-lg-4">
      {/* Header with Back Button and Title */}
      <Row className="mb-4 align-items-center">
        <Col xs={12}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px' }}
                onClick={() => navigate(getDashboardRoute())}
              >
                <FaArrowLeft />
              </Button>
              <div>
                <h2 className="mb-1 settings-title">Settings</h2>
                <p className="text-muted mb-0 d-flex align-items-center flex-wrap gap-2">
                  Manage your account preferences
                  <Badge 
                    bg={isAdmin ? 'danger' : isProvider ? 'success' : 'primary'} 
                    className="text-capitalize py-2 px-3 rounded-pill"
                  >
                    {role} Account
                  </Badge>
                </p>
              </div>
            </div>
            
            {/* Mobile Menu Toggle */}
            <Button 
              variant="outline-primary" 
              className="d-lg-none"
              onClick={toggleSidebar}
            >
              Menu
            </Button>

            {saved && (
              <Alert variant="success" className="mb-0 py-2 px-3 saved-alert">
                <FaCheckCircle className="me-2" /> Changes saved!
              </Alert>
            )}
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Sidebar Navigation - Desktop */}
        <Col lg={3} className="d-none d-lg-block">
          <Card className="border-0 shadow-sm settings-sidebar sticky-top" style={{ top: '80px' }}>
            <Card.Body className="p-3">
              <Nav variant="pills" className="flex-column">
                {navItems.map(item => (
                  <Nav.Link
                    key={item.key}
                    active={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                    className="d-flex align-items-center mb-2 py-3 px-3 rounded-3 nav-link-custom"
                  >
                    <span className="me-3 nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Nav.Link>
                ))}
              </Nav>

              {/* Quick Home Button */}
              <Button
                variant="outline-primary"
                className="w-100 mt-3 d-flex align-items-center justify-content-center"
                onClick={() => navigate(getDashboardRoute())}
              >
                <FaHome className="me-2" /> Back to Dashboard
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="mobile-sidebar-overlay" onClick={toggleSidebar}>
            <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
              <div className="mobile-sidebar-header">
                <h5 className="mb-0">Settings Menu</h5>
                <Button variant="link" className="p-0" onClick={toggleSidebar}>
                  ✕
                </Button>
              </div>
              <Nav variant="pills" className="flex-column p-3">
                {navItems.map(item => (
                  <Nav.Link
                    key={item.key}
                    active={activeTab === item.key}
                    onClick={() => {
                      setActiveTab(item.key);
                      setSidebarOpen(false);
                    }}
                    className="d-flex align-items-center mb-2 py-3 px-3 rounded-3 nav-link-custom"
                  >
                    <span className="me-3 nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Nav.Link>
                ))}
                <Button
                  variant="outline-primary"
                  className="w-100 mt-3 d-flex align-items-center justify-content-center"
                  onClick={() => {
                    navigate(getDashboardRoute());
                    setSidebarOpen(false);
                  }}
                >
                  <FaHome className="me-2" /> Dashboard
                </Button>
              </Nav>
            </div>
          </div>
        )}

        {/* Settings Content */}
        <Col lg={9}>
          <Card className="border-0 shadow-sm settings-content">
            <Card.Body className="p-3 p-lg-5">
              {/* PROFILE SETTINGS */}
              {activeTab === 'profile' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaUser className="me-2 text-primary" /> Profile Settings
                  </h4>
                  <Form>
                    <Row>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={profileSettings.name}
                            onChange={(e) => setProfileSettings({...profileSettings, name: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            value={profileSettings.email}
                            onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        value={profileSettings.phone}
                        onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={profileSettings.bio}
                        onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                        placeholder="Tell us a little about yourself..."
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileSettings.location}
                        onChange={(e) => setProfileSettings({...profileSettings, location: e.target.value})}
                        placeholder="City, Country"
                      />
                    </Form.Group>

                    {isProvider && (
                      <Form.Group className="mb-3">
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                          type="url"
                          value={profileSettings.website}
                          onChange={(e) => setProfileSettings({...profileSettings, website: e.target.value})}
                          placeholder="https://yourwebsite.com"
                        />
                      </Form.Group>
                    )}

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}

              {/* NOTIFICATION SETTINGS */}
              {activeTab === 'notifications' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaBell className="me-2 text-primary" /> Notification Settings
                  </h4>
                  <Form>
                    <div className="mb-4">
                      <h6 className="mb-3">Delivery Methods</h6>
                      <div className="settings-grid">
                        <Form.Check 
                          type="switch"
                          label="Email Notifications"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                          className="mb-2"
                        />
                        <Form.Check 
                          type="switch"
                          label="Push Notifications"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                          className="mb-2"
                        />
                        <Form.Check 
                          type="switch"
                          label="SMS Notifications"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                          className="mb-2"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <h6 className="mb-3">General Notifications</h6>
                      <div className="settings-grid">
                        <Form.Check 
                          type="switch"
                          label="Booking Updates"
                          checked={notificationSettings.bookingUpdates}
                          onChange={(e) => setNotificationSettings({...notificationSettings, bookingUpdates: e.target.checked})}
                          className="mb-2"
                        />
                        <Form.Check 
                          type="switch"
                          label="Payment Updates"
                          checked={notificationSettings.paymentUpdates}
                          onChange={(e) => setNotificationSettings({...notificationSettings, paymentUpdates: e.target.checked})}
                          className="mb-2"
                        />
                        <Form.Check 
                          type="switch"
                          label="Message Alerts"
                          checked={notificationSettings.messageAlerts}
                          onChange={(e) => setNotificationSettings({...notificationSettings, messageAlerts: e.target.checked})}
                          className="mb-2"
                        />
                      </div>
                    </div>

                    {/* Customer-specific notifications */}
                    {isCustomer && (
                      <div className="mb-4">
                        <h6 className="mb-3">Customer Notifications</h6>
                        <div className="settings-grid">
                          <Form.Check 
                            type="switch"
                            label="Promotional Alerts"
                            checked={notificationSettings.promotionAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, promotionAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Favorite Updates"
                            checked={notificationSettings.favoriteUpdates}
                            onChange={(e) => setNotificationSettings({...notificationSettings, favoriteUpdates: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Review Reminders"
                            checked={notificationSettings.reviewReminders}
                            onChange={(e) => setNotificationSettings({...notificationSettings, reviewReminders: e.target.checked})}
                            className="mb-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* Provider-specific notifications */}
                    {isProvider && (
                      <div className="mb-4">
                        <h6 className="mb-3">Provider Notifications</h6>
                        <div className="settings-grid">
                          <Form.Check 
                            type="switch"
                            label="New Booking Alerts"
                            checked={notificationSettings.newBookingAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, newBookingAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Payment Alerts"
                            checked={notificationSettings.paymentAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, paymentAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Review Alerts"
                            checked={notificationSettings.reviewAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, reviewAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Weekly Summary"
                            checked={notificationSettings.weeklySummary}
                            onChange={(e) => setNotificationSettings({...notificationSettings, weeklySummary: e.target.checked})}
                            className="mb-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* Admin-specific notifications */}
                    {isAdmin && (
                      <div className="mb-4">
                        <h6 className="mb-3">Admin Notifications</h6>
                        <div className="settings-grid">
                          <Form.Check 
                            type="switch"
                            label="User Registration Alerts"
                            checked={notificationSettings.userRegistrationAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, userRegistrationAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Service Approval Alerts"
                            checked={notificationSettings.serviceApprovalAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, serviceApprovalAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="Dispute Alerts"
                            checked={notificationSettings.disputeAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, disputeAlerts: e.target.checked})}
                            className="mb-2"
                          />
                          <Form.Check 
                            type="switch"
                            label="System Alerts"
                            checked={notificationSettings.systemAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                            className="mb-2"
                          />
                        </div>
                      </div>
                    )}

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}

              {/* PRIVACY SETTINGS */}
              {activeTab === 'privacy' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaLock className="me-2 text-primary" /> Privacy Settings
                  </h4>
                  <Form>
                    <div className="settings-grid">
                      <Form.Check 
                        type="switch"
                        label="Show profile publicly"
                        checked={privacySettings.showProfilePublic}
                        onChange={(e) => setPrivacySettings({...privacySettings, showProfilePublic: e.target.checked})}
                        className="mb-3"
                      />
                      <Form.Check 
                        type="switch"
                        label="Show email address"
                        checked={privacySettings.showEmail}
                        onChange={(e) => setPrivacySettings({...privacySettings, showEmail: e.target.checked})}
                        className="mb-3"
                      />
                      <Form.Check 
                        type="switch"
                        label="Show phone number"
                        checked={privacySettings.showPhone}
                        onChange={(e) => setPrivacySettings({...privacySettings, showPhone: e.target.checked})}
                        className="mb-3"
                      />
                      <Form.Check 
                        type="switch"
                        label="Show location"
                        checked={privacySettings.showLocation}
                        onChange={(e) => setPrivacySettings({...privacySettings, showLocation: e.target.checked})}
                        className="mb-3"
                      />
                      <Form.Check 
                        type="switch"
                        label="Allow messages from others"
                        checked={privacySettings.allowMessages}
                        onChange={(e) => setPrivacySettings({...privacySettings, allowMessages: e.target.checked})}
                        className="mb-3"
                      />
                      <Form.Check 
                        type="switch"
                        label="Allow reviews"
                        checked={privacySettings.allowReviews}
                        onChange={(e) => setPrivacySettings({...privacySettings, allowReviews: e.target.checked})}
                        className="mb-3"
                      />
                    </div>

                    {isProvider && (
                      <div className="mt-4">
                        <h6 className="mb-3">Provider Privacy</h6>
                        <div className="settings-grid">
                          <Form.Check 
                            type="switch"
                            label="Show business hours"
                            checked={privacySettings.showBusinessHours}
                            onChange={(e) => setPrivacySettings({...privacySettings, showBusinessHours: e.target.checked})}
                            className="mb-3"
                          />
                          <Form.Check 
                            type="switch"
                            label="Show service area"
                            checked={privacySettings.showServiceArea}
                            onChange={(e) => setPrivacySettings({...privacySettings, showServiceArea: e.target.checked})}
                            className="mb-3"
                          />
                          <Form.Check 
                            type="switch"
                            label="Show rates"
                            checked={privacySettings.showRates}
                            onChange={(e) => setPrivacySettings({...privacySettings, showRates: e.target.checked})}
                            className="mb-3"
                          />
                          <Form.Check 
                            type="switch"
                            label="Allow booking requests"
                            checked={privacySettings.allowBookingRequests}
                            onChange={(e) => setPrivacySettings({...privacySettings, allowBookingRequests: e.target.checked})}
                            className="mb-3"
                          />
                        </div>
                      </div>
                    )}

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn mt-4">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}

              {/* SECURITY SETTINGS */}
              {activeTab === 'security' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaShieldAlt className="me-2 text-primary" /> Security Settings
                  </h4>
                  <Form>
                    <Form.Check 
                      type="switch"
                      label="Two-Factor Authentication"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                      className="mb-3"
                    />
                    <Form.Check 
                      type="switch"
                      label="Login Alerts"
                      checked={securitySettings.loginAlerts}
                      onChange={(e) => setSecuritySettings({...securitySettings, loginAlerts: e.target.checked})}
                      className="mb-3"
                    />

                    <Form.Group className="mb-4">
                      <Form.Label>Session Timeout (minutes)</Form.Label>
                      <Form.Select 
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="240">4 hours</option>
                      </Form.Select>
                    </Form.Group>

                    <h6 className="mb-3">Active Sessions</h6>
                    <div className="sessions-list">
                      {securitySettings.activeSessions.map((session, index) => (
                        <div key={index} className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3 bg-light rounded mb-2">
                          <div className="mb-2 mb-md-0">
                            <p className="mb-1 fw-semibold">{session.device}</p>
                            <small className="text-muted">{session.location} • {session.lastActive}</small>
                          </div>
                          {session.current ? (
                            <Badge bg="success" className="py-2 px-3">Current Session</Badge>
                          ) : (
                            <Button variant="outline-danger" size="sm" className="w-100 w-md-auto">Logout</Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn mt-3">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}

              {/* PAYMENT SETTINGS */}
              {activeTab === 'payment' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaCreditCard className="me-2 text-primary" /> Payment Settings
                  </h4>
                  {isCustomer && (
                    <Form>
                      <h6 className="mb-3">Saved Payment Methods</h6>
                      <div className="payment-methods-list">
                        {paymentSettings.paymentMethods?.map(method => (
                          <div key={method.id} className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-3 border rounded mb-2">
                            <div className="d-flex align-items-center mb-2 mb-sm-0">
                              <FaCreditCard className="me-3 text-primary" size={24} />
                              <div>
                                <p className="mb-1 fw-semibold">
                                  {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ending in {method.last4}
                                </p>
                                {method.default && <Badge bg="success">Default</Badge>}
                              </div>
                            </div>
                            {!method.default && (
                              <Button variant="link" className="text-danger p-0">Remove</Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline-primary" className="mt-3 mb-4 w-100 w-sm-auto">
                        + Add Payment Method
                      </Button>

                      <Form.Check 
                        type="switch"
                        label="Auto-pay for recurring bookings"
                        checked={paymentSettings.autoPay}
                        onChange={(e) => setPaymentSettings({...paymentSettings, autoPay: e.target.checked})}
                        className="mb-4"
                      />
                    </Form>
                  )}

                  {isProvider && (
                    <Form>
                      <Form.Check 
                        type="switch"
                        label="Automatic payouts"
                        checked={paymentSettings.autoPayout}
                        onChange={(e) => setPaymentSettings({...paymentSettings, autoPayout: e.target.checked})}
                        className="mb-3"
                      />

                      <Form.Group className="mb-3">
                        <Form.Label>Payout Method</Form.Label>
                        <Form.Select 
                          value={paymentSettings.payoutMethod}
                          onChange={(e) => setPaymentSettings({...paymentSettings, payoutMethod: e.target.value})}
                        >
                          <option value="bank">Bank Transfer</option>
                          <option value="paypal">PayPal</option>
                          <option value="stripe">Stripe</option>
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Payout Frequency</Form.Label>
                        <Form.Select 
                          value={paymentSettings.payoutFrequency}
                          onChange={(e) => setPaymentSettings({...paymentSettings, payoutFrequency: e.target.value})}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-Weekly</option>
                          <option value="monthly">Monthly</option>
                        </Form.Select>
                      </Form.Group>

                      <div className="bg-light p-3 rounded mb-3">
                        <h6 className="mb-3">Bank Account Details</h6>
                        <p className="mb-2"><strong>Bank:</strong> {paymentSettings.bankAccount?.bankName}</p>
                        <p className="mb-2"><strong>Account:</strong> {paymentSettings.bankAccount?.accountNumber}</p>
                        <p className="mb-0"><strong>Routing:</strong> {paymentSettings.bankAccount?.routingNumber}</p>
                      </div>

                      <div className="bg-light p-3 rounded mb-3">
                        <h6 className="mb-3">Tax Information</h6>
                        <p className="mb-2"><strong>Business Type:</strong> {paymentSettings.taxInfo?.businessType}</p>
                        <p className="mb-2"><strong>Tax ID:</strong> {paymentSettings.taxInfo?.taxId}</p>
                        <Badge bg="success">W-9 {paymentSettings.taxInfo?.w9Submitted ? 'Submitted' : 'Pending'}</Badge>
                      </div>
                    </Form>
                  )}

                  <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn mt-3">
                    {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                    Save Changes
                  </Button>
                </div>
              )}

              {/* BUSINESS SETTINGS (Provider only) */}
              {activeTab === 'business' && isProvider && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaMapMarkerAlt className="me-2 text-primary" /> Business Settings
                  </h4>
                  <Form>
                    <Row>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Business Name</Form.Label>
                          <Form.Control 
                            type="text"
                            value={businessSettings.businessName}
                            onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Business Phone</Form.Label>
                          <Form.Control 
                            type="tel"
                            value={businessSettings.businessPhone}
                            onChange={(e) => setBusinessSettings({...businessSettings, businessPhone: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Business Address</Form.Label>
                      <Form.Control 
                        type="text"
                        value={businessSettings.businessAddress}
                        onChange={(e) => setBusinessSettings({...businessSettings, businessAddress: e.target.value})}
                      />
                    </Form.Group>

                    <Row>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Service Radius (miles)</Form.Label>
                          <Form.Control 
                            type="number"
                            value={businessSettings.serviceRadius}
                            onChange={(e) => setBusinessSettings({...businessSettings, serviceRadius: parseInt(e.target.value)})}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Max Bookings Per Day</Form.Label>
                          <Form.Control 
                            type="number"
                            value={businessSettings.maxBookingsPerDay}
                            onChange={(e) => setBusinessSettings({...businessSettings, maxBookingsPerDay: parseInt(e.target.value)})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h6 className="mb-3">Business Hours</h6>
                    <div className="business-hours">
                      {Object.entries(businessSettings.businessHours).map(([day, hours]) => (
                        <Row key={day} className="mb-2 align-items-center">
                          <Col xs={12} sm={2}>
                            <Form.Label className="mb-2 mb-sm-0 text-capitalize fw-semibold">{day}</Form.Label>
                          </Col>
                          <Col xs={6} sm={3}>
                            <Form.Check 
                              type="checkbox"
                              label="Closed"
                              checked={hours.closed}
                              onChange={(e) => setBusinessSettings({
                                ...businessSettings,
                                businessHours: {
                                  ...businessSettings.businessHours,
                                  [day]: { ...hours, closed: e.target.checked }
                                }
                              })}
                            />
                          </Col>
                          {!hours.closed && (
                            <>
                              <Col xs={6} sm={3}>
                                <Form.Control 
                                  size="sm"
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => setBusinessSettings({
                                    ...businessSettings,
                                    businessHours: {
                                      ...businessSettings.businessHours,
                                      [day]: { ...hours, open: e.target.value }
                                    }
                                  })}
                                />
                              </Col>
                              <Col xs={6} sm={3}>
                                <Form.Control 
                                  size="sm"
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => setBusinessSettings({
                                    ...businessSettings,
                                    businessHours: {
                                      ...businessSettings.businessHours,
                                      [day]: { ...hours, close: e.target.value }
                                    }
                                  })}
                                />
                              </Col>
                            </>
                          )}
                        </Row>
                      ))}
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label>Cancellation Policy</Form.Label>
                      <Form.Select 
                        value={businessSettings.cancellationPolicy}
                        onChange={(e) => setBusinessSettings({...businessSettings, cancellationPolicy: e.target.value})}
                      >
                        <option value="flexible">Flexible - Free cancellation up to 24 hours before</option>
                        <option value="moderate">Moderate - 50% refund up to 24 hours before</option>
                        <option value="strict">Strict - No refund within 48 hours</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Service Categories</Form.Label>
                      <Form.Control 
                        as="select"
                        multiple
                        size={3}
                        value={businessSettings.categories}
                        onChange={(e) => setBusinessSettings({
                          ...businessSettings,
                          categories: Array.from(e.target.selectedOptions, option => option.value)
                        })}
                      >
                        <option>Cleaning</option>
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>Painting</option>
                        <option>Gardening</option>
                        <option>Moving</option>
                      </Form.Control>
                      <Form.Text className="text-muted">Hold Ctrl to select multiple</Form.Text>
                    </Form.Group>

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}

              {/* APPEARANCE SETTINGS */}
              {activeTab === 'appearance' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaPalette className="me-2 text-primary" /> Appearance Settings
                  </h4>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Theme</Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        <Button 
                          variant={appearanceSettings.theme === 'light' ? 'primary' : 'outline-primary'}
                          onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'light'})}
                          className="flex-fill theme-btn"
                        >
                          <FaSun className="me-2" /> Light
                        </Button>
                        <Button 
                          variant={appearanceSettings.theme === 'dark' ? 'primary' : 'outline-primary'}
                          onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'dark'})}
                          className="flex-fill theme-btn"
                        >
                          <FaMoon className="me-2" /> Dark
                        </Button>
                        <Button 
                          variant={appearanceSettings.theme === 'system' ? 'primary' : 'outline-primary'}
                          onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'system'})}
                          className="flex-fill theme-btn"
                        >
                          <FaCog className="me-2" /> System
                        </Button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Font Size</Form.Label>
                      <Form.Select 
                        value={appearanceSettings.fontSize}
                        onChange={(e) => setAppearanceSettings({...appearanceSettings, fontSize: e.target.value})}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Check 
                      type="switch"
                      label="Compact Mode"
                      checked={appearanceSettings.compactMode}
                      onChange={(e) => setAppearanceSettings({...appearanceSettings, compactMode: e.target.checked})}
                      className="mb-3"
                    />

                    <Form.Check 
                      type="switch"
                      label="Enable Animations"
                      checked={appearanceSettings.animations}
                      onChange={(e) => setAppearanceSettings({...appearanceSettings, animations: e.target.checked})}
                      className="mb-3"
                    />

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}

              {/* LANGUAGE SETTINGS */}
              {activeTab === 'language' && (
                <div className="settings-section">
                  <h4 className="mb-4 section-title">
                    <FaLanguage className="me-2 text-primary" /> Language & Region
                  </h4>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Language</Form.Label>
                      <Form.Select 
                        value={languageSettings.language}
                        onChange={(e) => setLanguageSettings({...languageSettings, language: e.target.value})}
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Date Format</Form.Label>
                      <Form.Select 
                        value={languageSettings.dateFormat}
                        onChange={(e) => setLanguageSettings({...languageSettings, dateFormat: e.target.value})}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Time Format</Form.Label>
                      <Form.Select 
                        value={languageSettings.timeFormat}
                        onChange={(e) => setLanguageSettings({...languageSettings, timeFormat: e.target.value})}
                      >
                        <option value="12h">12-hour (3:30 PM)</option>
                        <option value="24h">24-hour (15:30)</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Timezone</Form.Label>
                      <Form.Select 
                        value={languageSettings.timezone}
                        onChange={(e) => setLanguageSettings({...languageSettings, timezone: e.target.value})}
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                      </Form.Select>
                    </Form.Group>

                    <Button variant="primary" onClick={saveAllSettings} disabled={loading} className="save-btn">
                      {loading ? <Spinner size="sm" /> : <FaSave className="me-2" />}
                      Save Changes
                    </Button>
                  </Form>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx="true">{`
        .settings-container {
          max-width: 1600px;
          margin: 0 auto;
        }

        .settings-title {
          font-size: clamp(1.5rem, 4vw, 2rem);
        }

        .saved-alert {
          width: 100%;
          max-width: 300px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .settings-sidebar {
          border-radius: 16px;
          overflow: hidden;
        }

        .nav-link-custom {
          transition: all 0.2s ease;
          color: #4b5563;
        }

        .nav-link-custom:hover:not(.active) {
          background-color: #f3f4f6 !important;
          transform: translateX(4px);
        }

        .nav-link-custom.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .nav-link-custom.active .nav-icon {
          color: white !important;
        }

        .settings-content {
          border-radius: 20px;
          overflow: hidden;
        }

        .section-title {
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 12px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .save-btn {
          min-width: 200px;
          padding: 12px 24px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          transition: all 0.3s ease;
        }

        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .save-btn:disabled {
          background: linear-gradient(135deg, #a0aec0, #718096);
        }

        .theme-btn {
          transition: all 0.2s ease;
        }

        .theme-btn:hover {
          transform: translateY(-2px);
        }

        /* Mobile Sidebar Styles */
        .mobile-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1050;
          animation: fadeIn 0.3s ease;
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 85%;
          max-width: 320px;
          background: white;
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.2);
          animation: slideInLeft 0.3s ease;
          overflow-y: auto;
        }

        .mobile-sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .mobile-sidebar-header button {
          color: white;
          font-size: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }

          .business-hours .row {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
          }

          .business-hours .row:last-child {
            border-bottom: none;
          }

          .theme-btn {
            width: 100%;
            margin-bottom: 8px;
          }

          .saved-alert {
            max-width: 100%;
            margin-top: 10px;
          }
        }

        @media (max-width: 576px) {
          .settings-content {
            padding: 15px;
          }

          .save-btn {
            width: 100%;
          }

          .payment-methods-list .d-flex {
            flex-direction: column;
            align-items: flex-start !important;
          }

          .payment-methods-list button {
            align-self: flex-end;
            margin-top: 8px;
          }
        }

        /* Touch-friendly improvements */
        @media (max-width: 992px) {
          .form-check {
            min-height: 44px;
            display: flex;
            align-items: center;
          }

          .form-check-input {
            width: 44px;
            height: 24px;
            margin-right: 12px;
          }

          .form-select, .form-control {
            min-height: 44px;
          }

          button {
            min-height: 44px;
          }
        }

        /* Print styles */
        @media print {
          .settings-sidebar,
          .save-btn,
          .mobile-sidebar-overlay {
            display: none !important;
          }

          .settings-content {
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default Settings;