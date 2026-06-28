// src/components/admin/AdminSettings.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  OverlayTrigger,
  Tooltip,
  Table
} from 'react-bootstrap';
import {
  Globe,
  Lock,
  Bell,
  Shield,
  CreditCard,
  Mail,
  Save,
  Database,
  Users,
  DollarSign,
  Clock,
  Server,
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Key,
  UserCheck,
  UserX,
  Activity,
  FileText,
  Printer,
  Download,
  Cloud,
  CloudUpload,
  CloudDownload,
  Zap,
  ShieldCheck,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    cache: 'connected',
    queue: 'connected',
    email: 'connected'
  });
  const [auditLogs, setAuditLogs] = useState([]);

  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);

  const [settings, setSettings] = useState({
    // General Settings
    siteName: '',
    siteEmail: '',
    sitePhone: '',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    currency: 'NGN',
    maintenanceMode: false,
    
    // Commission Settings
    commissionRate: 10,
    minPayoutAmount: 5000,
    maxPayoutAmount: 500000,
    processingFee: 0,
    
    // Notification Settings
    adminEmailAlerts: true,
    userSignupAlerts: true,
    bookingAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireVerification: true,
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    senderEmail: '',
    smtpSecure: true,
    
    // API Settings
    apiRateLimit: 100,
    apiKey: '',
    webhookUrl: '',
    
    // Feature Toggles
    enableBookings: true,
    enablePayments: true,
    enableReviews: true,
    enableChat: true
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

  // ✅ Fetch settings from real API
  const fetchSettings = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      // Try getSettings first
      if (typeof adminAPI.getSettings === 'function') {
        response = await adminAPI.getSettings();
      } 
      // Fallback to getPlatformSettings
      else if (typeof adminAPI.getPlatformSettings === 'function') {
        response = await adminAPI.getPlatformSettings();
      } 
      else {
        throw new Error('Settings API methods not available');
      }

      const data = response?.data || {};
      setSettings(prev => ({ 
        ...prev, 
        ...data,
        siteName: data.siteName || data.site_name || '',
        siteEmail: data.siteEmail || data.site_email || '',
        sitePhone: data.sitePhone || data.site_phone || '',
        senderEmail: data.senderEmail || data.sender_email || '',
        apiKey: data.apiKey || data.api_key || ''
      }));
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error.message || 'Failed to load settings');
      toast.error('Failed to load settings');
    }
  }, []);

  // ✅ Fetch audit logs from real API
  const fetchAuditLogs = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      // Try getActivities first (most common)
      if (typeof adminAPI.getActivities === 'function') {
        response = await adminAPI.getActivities({ limit: 10 });
        const data = response?.data || [];
        setAuditLogs(Array.isArray(data) ? data : 
                    Array.isArray(data?.activities) ? data.activities : 
                    Array.isArray(data?.logs) ? data.logs : []);
        return;
      }
      
      // Fallback to getAuditLogs
      if (typeof adminAPI.getAuditLogs === 'function') {
        response = await adminAPI.getAuditLogs({ limit: 10 });
        const data = response?.data || [];
        setAuditLogs(Array.isArray(data) ? data : 
                    Array.isArray(data?.logs) ? data.logs : []);
        return;
      }
      
      // Try getLogs as last resort
      if (typeof adminAPI.getLogs === 'function') {
        response = await adminAPI.getLogs({ limit: 10 });
        const data = response?.data || [];
        setAuditLogs(Array.isArray(data) ? data : 
                    Array.isArray(data?.logs) ? data.logs : []);
        return;
      }
      
      throw new Error('Audit log API methods not available');
      
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    }
  }, []);

  // ✅ Check system status with real API
  const checkSystemStatus = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      if (typeof adminAPI.getSystemHealth === 'function') {
        const response = await adminAPI.getSystemHealth();
        const data = response?.data || {};
        setSystemStatus(prev => ({ 
          ...prev, 
          ...data,
          database: data.database || data.db || 'connected',
          cache: data.cache || 'connected',
          queue: data.queue || 'connected',
          email: data.email || 'connected'
        }));
      } else {
        // Keep default status if method not available
        console.warn('System health check not available');
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      // Keep default status on error
    }
  }, []);

  // ✅ Fetch all data
  const loadAllData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchSettings(),
        fetchAuditLogs(),
        checkSystemStatus()
      ]);
    } catch (error) {
      console.error('Error loading all data:', error);
      setError(error.message || 'Failed to load settings data');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [fetchSettings, fetchAuditLogs, checkSystemStatus]);

  // ✅ Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        loadAllData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 60000); // Poll every 60 seconds for real-time updates
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    isPolling.current = false;
  };

  // Initial data load
  useEffect(() => {
    loadAllData(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // ✅ Save settings with real API
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      // Try updateSettings first
      if (typeof adminAPI.updateSettings === 'function') {
        response = await adminAPI.updateSettings(settings);
      } 
      // Fallback to updatePlatformSettings
      else if (typeof adminAPI.updatePlatformSettings === 'function') {
        response = await adminAPI.updatePlatformSettings(settings);
      } 
      else {
        throw new Error('Settings update API methods not available');
      }

      toast.success('Settings saved successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Refresh settings after save
      await fetchSettings();
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData(false);
    toast.success('Settings refreshed');
  };

  const getStatusBadge = (status) => {
    const config = {
      connected: { variant: 'success', icon: CheckCircle, text: 'Connected' },
      disconnected: { variant: 'danger', icon: XCircle, text: 'Disconnected' },
      warning: { variant: 'warning', icon: AlertCircle, text: 'Warning' },
      healthy: { variant: 'success', icon: CheckCircle, text: 'Healthy' },
      critical: { variant: 'danger', icon: XCircle, text: 'Critical' }
    };
    const item = config[status?.toLowerCase()] || config.disconnected;
    const Icon = item.icon;
    return (
      <Badge bg={item.variant} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={14} />
        <span className="ms-1">{item.text}</span>
      </Badge>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <Container fluid className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3 text-muted">Loading settings...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Success Alert */}
        {showSuccess && (
          <Alert variant="success" className="mb-4" onClose={() => setShowSuccess(false)} dismissible style={{ borderRadius: '12px' }}>
            <CheckCircle className="me-2" size={18} />
            Settings saved successfully!
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <AlertCircle className="me-2" size={18} />
            {error}
          </Alert>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">System Settings</h2>
            <p className="text-muted mb-0">Manage platform-wide configurations and preferences</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="d-flex align-items-center gap-2"
            >
              {saving ? <Spinner animation="border" size="sm" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* System Status */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Server size={18} className="text-primary" />
              System Status
            </h6>
            <div className="d-flex flex-wrap gap-4">
              <div className="d-flex align-items-center gap-2">
                <Database size={16} className="text-muted" />
                <span className="fw-medium">Database:</span>
                {getStatusBadge(systemStatus.database)}
              </div>
              <div className="d-flex align-items-center gap-2">
                <Zap size={16} className="text-muted" />
                <span className="fw-medium">Cache:</span>
                {getStatusBadge(systemStatus.cache)}
              </div>
              <div className="d-flex align-items-center gap-2">
                <Clock size={16} className="text-muted" />
                <span className="fw-medium">Queue:</span>
                {getStatusBadge(systemStatus.queue)}
              </div>
              <div className="d-flex align-items-center gap-2">
                <Mail size={16} className="text-muted" />
                <span className="fw-medium">Email:</span>
                {getStatusBadge(systemStatus.email)}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Settings Tabs */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="border-bottom px-4 pt-3"
              style={{ marginBottom: '24px' }}
            >
              <Tab eventKey="general" title={
                <span className="d-flex align-items-center gap-2">
                  <Globe size={16} /> General
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">General Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Site Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="siteName"
                          value={settings.siteName || ''}
                          onChange={handleChange}
                          placeholder="Enter site name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Site Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="siteEmail"
                          value={settings.siteEmail || ''}
                          onChange={handleChange}
                          placeholder="Enter site email"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Site Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="sitePhone"
                          value={settings.sitePhone || ''}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Timezone</Form.Label>
                        <Form.Select name="timezone" value={settings.timezone || 'Africa/Lagos'} onChange={handleChange}>
                          <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                          <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                          <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Date Format</Form.Label>
                        <Form.Select name="dateFormat" value={settings.dateFormat || 'DD/MM/YYYY'} onChange={handleChange}>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Currency</Form.Label>
                        <Form.Select name="currency" value={settings.currency || 'NGN'} onChange={handleChange}>
                          <option value="NGN">Nigerian Naira (₦)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="EUR">Euro (€)</option>
                          <option value="GBP">British Pound (£)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Maintenance Mode"
                          name="maintenanceMode"
                          checked={settings.maintenanceMode || false}
                          onChange={handleChange}
                        />
                        <Form.Text className="text-muted">
                          When enabled, the platform will display a maintenance page to visitors
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="commission" title={
                <span className="d-flex align-items-center gap-2">
                  <DollarSign size={16} /> Commission
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">Commission & Payout Settings</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Commission Rate (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="commissionRate"
                          value={settings.commissionRate || 0}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <Form.Text>Percentage taken from each booking</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Minimum Payout (₦)</Form.Label>
                        <Form.Control
                          type="number"
                          name="minPayoutAmount"
                          value={settings.minPayoutAmount || 0}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Maximum Payout (₦)</Form.Label>
                        <Form.Control
                          type="number"
                          name="maxPayoutAmount"
                          value={settings.maxPayoutAmount || 0}
                          onChange={handleChange}
                          min="0"
                          step="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Processing Fee (₦)</Form.Label>
                        <Form.Control
                          type="number"
                          name="processingFee"
                          value={settings.processingFee || 0}
                          onChange={handleChange}
                          min="0"
                          step="50"
                        />
                        <Form.Text>Fee charged per transaction</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="notifications" title={
                <span className="d-flex align-items-center gap-2">
                  <Bell size={16} /> Notifications
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">Admin Notification Settings</h6>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Email Alerts for Admin"
                      name="adminEmailAlerts"
                      checked={settings.adminEmailAlerts || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="New User Signup Alerts"
                      name="userSignupAlerts"
                      checked={settings.userSignupAlerts || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="New Booking Alerts"
                      name="bookingAlerts"
                      checked={settings.bookingAlerts || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Payment Alerts"
                      name="paymentAlerts"
                      checked={settings.paymentAlerts || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Review Alerts"
                      name="reviewAlerts"
                      checked={settings.reviewAlerts || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              </Tab>

              <Tab eventKey="security" title={
                <span className="d-flex align-items-center gap-2">
                  <Shield size={16} /> Security
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">Security Settings</h6>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Require Two-Factor Authentication for Admins"
                      name="twoFactorAuth"
                      checked={settings.twoFactorAuth || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Require Email Verification for New Users"
                      name="requireVerification"
                      checked={settings.requireVerification || false}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Session Timeout (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="sessionTimeout"
                          value={settings.sessionTimeout || 60}
                          onChange={handleChange}
                          min="5"
                          max="480"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Max Login Attempts</Form.Label>
                        <Form.Control
                          type="number"
                          name="maxLoginAttempts"
                          value={settings.maxLoginAttempts || 5}
                          onChange={handleChange}
                          min="3"
                          max="20"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="email" title={
                <span className="d-flex align-items-center gap-2">
                  <Mail size={16} /> Email
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">SMTP Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">SMTP Host</Form.Label>
                        <Form.Control
                          type="text"
                          name="smtpHost"
                          value={settings.smtpHost || ''}
                          onChange={handleChange}
                          placeholder="smtp.gmail.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">SMTP Port</Form.Label>
                        <Form.Control
                          type="number"
                          name="smtpPort"
                          value={settings.smtpPort || 587}
                          onChange={handleChange}
                          placeholder="587"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Sender Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="senderEmail"
                          value={settings.senderEmail || ''}
                          onChange={handleChange}
                          placeholder="noreply@example.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Use Secure Connection (SSL/TLS)"
                          name="smtpSecure"
                          checked={settings.smtpSecure || false}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="api" title={
                <span className="d-flex align-items-center gap-2">
                  <Server size={16} /> API
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">API Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">API Rate Limit (requests/hour)</Form.Label>
                        <Form.Control
                          type="number"
                          name="apiRateLimit"
                          value={settings.apiRateLimit || 100}
                          onChange={handleChange}
                          min="10"
                          max="10000"
                          step="10"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">API Key</Form.Label>
                        <div className="d-flex">
                          <Form.Control
                            type="text"
                            name="apiKey"
                            value={settings.apiKey || '•'.repeat(32)}
                            onChange={handleChange}
                            disabled
                            className="bg-light"
                          />
                          <Button variant="outline-secondary" className="ms-2">
                            <Key size={16} />
                          </Button>
                        </div>
                        <Form.Text>Regenerate API key when needed</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Webhook URL</Form.Label>
                        <Form.Control
                          type="url"
                          name="webhookUrl"
                          value={settings.webhookUrl || ''}
                          onChange={handleChange}
                          placeholder="https://your-app.com/webhook"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="features" title={
                <span className="d-flex align-items-center gap-2">
                  <SettingsIcon size={16} /> Features
                </span>
              }>
                <div className="p-4">
                  <h6 className="fw-bold mb-4">Feature Toggles</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Bookings"
                          name="enableBookings"
                          checked={settings.enableBookings || false}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Payments"
                          name="enablePayments"
                          checked={settings.enablePayments || false}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Reviews"
                          name="enableReviews"
                          checked={settings.enableReviews || false}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Chat"
                          name="enableChat"
                          checked={settings.enableChat || false}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="audit" title={
                <span className="d-flex align-items-center gap-2">
                  <FileText size={16} /> Audit Logs
                </span>
              }>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-bold mb-0">Recent Activity</h6>
                    <Button size="sm" variant="outline-secondary">
                      <Download size={14} className="me-1" />
                      Export Logs
                    </Button>
                  </div>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Action</th>
                          <th>Details</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-4">
                              <FileText size={32} className="text-muted mb-2 opacity-50" />
                              <p className="text-muted mb-0">No audit logs found</p>
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log, index) => (
                            <tr key={log.id || index}>
                              <td>{log.user || log.username || log.admin || 'System'}</td>
                              <td><Badge bg="secondary" className="rounded-pill">{log.action || log.type || 'Unknown'}</Badge></td>
                              <td>{log.details || log.message || log.description || 'No details'}</td>
                              <td><small className="text-muted">{log.timestamp || log.createdAt ? new Date(log.timestamp || log.createdAt).toLocaleString() : 'N/A'}</small></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Container>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .nav-tabs .nav-link {
          color: #4b5563;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px 12px 0 0;
          transition: all 0.2s;
        }
        .nav-tabs .nav-link.active {
          color: #6366f1;
          font-weight: 600;
          border-bottom: 3px solid #6366f1;
          background: none;
        }
        .nav-tabs .nav-link:hover {
          background: #f8fafc;
        }
        .nav-tabs .nav-link .d-flex {
          gap: 8px;
        }
        @media (max-width: 768px) {
          .nav-tabs .nav-link {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;