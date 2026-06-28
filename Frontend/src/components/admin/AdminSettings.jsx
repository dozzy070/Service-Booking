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

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Fetch settings from real API
  const fetchSettings = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getSettings === 'function') {
        response = await adminAPI.getSettings();
      } else if (typeof adminAPI.getPlatformSettings === 'function') {
        response = await adminAPI.getPlatformSettings();
      } else {
        throw new Error('Settings API methods not available');
      }

      const data = response?.data || {};
      setSettings(prev => ({ 
        ...prev, 
        ...data,
        siteName: getField(data, ['siteName', 'site_name'], ''),
        siteEmail: getField(data, ['siteEmail', 'site_email'], ''),
        sitePhone: getField(data, ['sitePhone', 'site_phone'], ''),
        senderEmail: getField(data, ['senderEmail', 'sender_email'], ''),
        apiKey: getField(data, ['apiKey', 'api_key'], ''),
        timezone: getField(data, ['timezone', 'time_zone'], 'Africa/Lagos'),
        dateFormat: getField(data, ['dateFormat', 'date_format'], 'DD/MM/YYYY'),
        currency: getField(data, ['currency', 'currency_code'], 'NGN')
      }));
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error.message || 'Failed to load settings');
      toast.error('Failed to load settings');
    }
  }, []);

  // Fetch audit logs from real API
  const fetchAuditLogs = useCallback(async () => {
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.getActivities === 'function') {
        response = await adminAPI.getActivities({ limit: 10 });
        const data = response?.data || [];
        setAuditLogs(Array.isArray(data) ? data : 
                    Array.isArray(data?.activities) ? data.activities : 
                    Array.isArray(data?.logs) ? data.logs : []);
        return;
      }
      
      if (typeof adminAPI.getAuditLogs === 'function') {
        response = await adminAPI.getAuditLogs({ limit: 10 });
        const data = response?.data || [];
        setAuditLogs(Array.isArray(data) ? data : 
                    Array.isArray(data?.logs) ? data.logs : []);
        return;
      }
      
      if (typeof adminAPI.getLogs === 'function') {
        response = await adminAPI.getLogs({ limit: 10 });
        const data = response?.data || [];
        setAuditLogs(Array.isArray(data) ? data : 
                    Array.isArray(data?.logs) ? data.logs : []);
        return;
      }
      
      // If no API methods available, set empty array
      setAuditLogs([]);
      
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    }
  }, []);

  // Check system status with real API
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
          database: getField(data, ['database', 'db'], 'connected'),
          cache: getField(data, ['cache', 'redis'], 'connected'),
          queue: getField(data, ['queue', 'queued'], 'connected'),
          email: getField(data, ['email', 'mail'], 'connected')
        }));
      } else {
        console.warn('System health check not available');
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  }, []);

  // Fetch all data
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

  // Polling functions
  const startPolling = () => {
    stopPolling();
    pollingInterval.current = setInterval(() => {
      if (!isPolling.current) {
        isPolling.current = true;
        loadAllData(false).finally(() => {
          isPolling.current = false;
        });
      }
    }, 60000);
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

  // Save settings with real API
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!adminAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof adminAPI.updateSettings === 'function') {
        response = await adminAPI.updateSettings(settings);
      } else if (typeof adminAPI.updatePlatformSettings === 'function') {
        response = await adminAPI.updatePlatformSettings(settings);
      } else {
        throw new Error('Settings update API methods not available');
      }

      toast.success('Settings saved successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      await fetchSettings();
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Manual refresh
  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData(false);
    toast.success('Settings refreshed');
  };

  // getStatusBadge with proper null/undefined handling
  const getStatusBadge = (status) => {
    const statusStr = String(status || '').toLowerCase().trim();
    
    const config = {
      connected: { variant: 'success', icon: CheckCircle, text: 'Connected' },
      healthy: { variant: 'success', icon: CheckCircle, text: 'Healthy' },
      ok: { variant: 'success', icon: CheckCircle, text: 'OK' },
      online: { variant: 'success', icon: CheckCircle, text: 'Online' },
      active: { variant: 'success', icon: CheckCircle, text: 'Active' },
      good: { variant: 'success', icon: CheckCircle, text: 'Good' },
      disconnected: { variant: 'danger', icon: XCircle, text: 'Disconnected' },
      critical: { variant: 'danger', icon: XCircle, text: 'Critical' },
      offline: { variant: 'danger', icon: XCircle, text: 'Offline' },
      error: { variant: 'danger', icon: XCircle, text: 'Error' },
      down: { variant: 'danger', icon: XCircle, text: 'Down' },
      warning: { variant: 'warning', icon: AlertCircle, text: 'Warning' },
      degraded: { variant: 'warning', icon: AlertCircle, text: 'Degraded' },
      pending: { variant: 'warning', icon: AlertCircle, text: 'Pending' }
    };
    
    const item = config[statusStr] || { 
      variant: 'secondary', 
      icon: AlertCircle, 
      text: statusStr || 'Unknown' 
    };
    
    const Icon = item.icon;
    return (
      <Badge bg={item.variant} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={14} />
        <span className="ms-1">{item.text}</span>
      </Badge>
    );
  };

  // Loading state removed - component renders immediately with empty data

  return (
    <div style={styles.container}>
      <Container fluid className="py-4">
        {/* Success Alert */}
        {showSuccess && (
          <Alert variant="success" style={styles.alert} onClose={() => setShowSuccess(false)} dismissible>
            <CheckCircle className="me-2" size={18} />
            Settings saved successfully!
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" style={styles.alert} dismissible onClose={() => setError(null)}>
            <AlertCircle className="me-2" size={18} />
            {error}
          </Alert>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>System Settings</h2>
            <p style={styles.headerSubtitle}>Manage platform-wide configurations and preferences</p>
          </div>
          <div style={styles.headerActions}>
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
              style={styles.refreshBtn}
            >
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="d-flex align-items-center gap-2"
              style={styles.saveBtn}
            >
              {saving ? <Spinner animation="border" size="sm" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* System Status */}
        <Card style={styles.statusCard}>
          <Card.Body style={styles.statusCardBody}>
            <h6 style={styles.statusTitle}>
              <Server size={18} className="text-primary" />
              System Status
            </h6>
            <div style={styles.statusItems}>
              <div style={styles.statusItem}>
                <Database size={16} className="text-muted" />
                <span style={styles.statusLabel}>Database:</span>
                {getStatusBadge(systemStatus.database)}
              </div>
              <div style={styles.statusItem}>
                <Zap size={16} className="text-muted" />
                <span style={styles.statusLabel}>Cache:</span>
                {getStatusBadge(systemStatus.cache)}
              </div>
              <div style={styles.statusItem}>
                <Clock size={16} className="text-muted" />
                <span style={styles.statusLabel}>Queue:</span>
                {getStatusBadge(systemStatus.queue)}
              </div>
              <div style={styles.statusItem}>
                <Mail size={16} className="text-muted" />
                <span style={styles.statusLabel}>Email:</span>
                {getStatusBadge(systemStatus.email)}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Settings Tabs */}
        <Card style={styles.tabsCard}>
          <Card.Body style={styles.tabsCardBody}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="custom-tabs"
              style={styles.tabs}
            >
              <Tab eventKey="general" title={
                <span style={styles.tabTitle}>
                  <Globe size={16} style={styles.tabIcon} /> General
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>General Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Site Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="siteName"
                          value={settings.siteName || ''}
                          onChange={handleChange}
                          placeholder="Enter site name"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Site Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="siteEmail"
                          value={settings.siteEmail || ''}
                          onChange={handleChange}
                          placeholder="Enter site email"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Site Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="sitePhone"
                          value={settings.sitePhone || ''}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Timezone</Form.Label>
                        <Form.Select name="timezone" value={settings.timezone || 'Africa/Lagos'} onChange={handleChange} style={styles.formControl}>
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
                        <Form.Label style={styles.formLabel}>Date Format</Form.Label>
                        <Form.Select name="dateFormat" value={settings.dateFormat || 'DD/MM/YYYY'} onChange={handleChange} style={styles.formControl}>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Currency</Form.Label>
                        <Form.Select name="currency" value={settings.currency || 'NGN'} onChange={handleChange} style={styles.formControl}>
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
                        <Form.Text style={styles.formText}>
                          When enabled, the platform will display a maintenance page to visitors
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="commission" title={
                <span style={styles.tabTitle}>
                  <DollarSign size={16} style={styles.tabIcon} /> Commission
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>Commission & Payout Settings</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Commission Rate (%)</Form.Label>
                        <Form.Control
                          type="number"
                          name="commissionRate"
                          value={settings.commissionRate || 0}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          step="0.5"
                          style={styles.formControl}
                        />
                        <Form.Text style={styles.formText}>Percentage taken from each booking</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Minimum Payout (₦)</Form.Label>
                        <Form.Control
                          type="number"
                          name="minPayoutAmount"
                          value={settings.minPayoutAmount || 0}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Maximum Payout (₦)</Form.Label>
                        <Form.Control
                          type="number"
                          name="maxPayoutAmount"
                          value={settings.maxPayoutAmount || 0}
                          onChange={handleChange}
                          min="0"
                          step="100"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Processing Fee (₦)</Form.Label>
                        <Form.Control
                          type="number"
                          name="processingFee"
                          value={settings.processingFee || 0}
                          onChange={handleChange}
                          min="0"
                          step="50"
                          style={styles.formControl}
                        />
                        <Form.Text style={styles.formText}>Fee charged per transaction</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="notifications" title={
                <span style={styles.tabTitle}>
                  <Bell size={16} style={styles.tabIcon} /> Notifications
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>Admin Notification Settings</h6>
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
                <span style={styles.tabTitle}>
                  <Shield size={16} style={styles.tabIcon} /> Security
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>Security Settings</h6>
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
                        <Form.Label style={styles.formLabel}>Session Timeout (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          name="sessionTimeout"
                          value={settings.sessionTimeout || 60}
                          onChange={handleChange}
                          min="5"
                          max="480"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Max Login Attempts</Form.Label>
                        <Form.Control
                          type="number"
                          name="maxLoginAttempts"
                          value={settings.maxLoginAttempts || 5}
                          onChange={handleChange}
                          min="3"
                          max="20"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="email" title={
                <span style={styles.tabTitle}>
                  <Mail size={16} style={styles.tabIcon} /> Email
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>SMTP Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>SMTP Host</Form.Label>
                        <Form.Control
                          type="text"
                          name="smtpHost"
                          value={settings.smtpHost || ''}
                          onChange={handleChange}
                          placeholder="smtp.gmail.com"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>SMTP Port</Form.Label>
                        <Form.Control
                          type="number"
                          name="smtpPort"
                          value={settings.smtpPort || 587}
                          onChange={handleChange}
                          placeholder="587"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Sender Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="senderEmail"
                          value={settings.senderEmail || ''}
                          onChange={handleChange}
                          placeholder="noreply@example.com"
                          style={styles.formControl}
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
                <span style={styles.tabTitle}>
                  <Server size={16} style={styles.tabIcon} /> API
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>API Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>API Rate Limit (requests/hour)</Form.Label>
                        <Form.Control
                          type="number"
                          name="apiRateLimit"
                          value={settings.apiRateLimit || 100}
                          onChange={handleChange}
                          min="10"
                          max="10000"
                          step="10"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>API Key</Form.Label>
                        <div style={styles.apiKeyWrapper}>
                          <Form.Control
                            type="text"
                            name="apiKey"
                            value={settings.apiKey || '•'.repeat(32)}
                            onChange={handleChange}
                            disabled
                            style={{ ...styles.formControl, background: '#f8f9fa' }}
                          />
                          <Button variant="outline-secondary" style={styles.apiKeyBtn}>
                            <Key size={16} />
                          </Button>
                        </div>
                        <Form.Text style={styles.formText}>Regenerate API key when needed</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label style={styles.formLabel}>Webhook URL</Form.Label>
                        <Form.Control
                          type="url"
                          name="webhookUrl"
                          value={settings.webhookUrl || ''}
                          onChange={handleChange}
                          placeholder="https://your-app.com/webhook"
                          style={styles.formControl}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="features" title={
                <span style={styles.tabTitle}>
                  <SettingsIcon size={16} style={styles.tabIcon} /> Features
                </span>
              }>
                <div style={styles.tabContent}>
                  <h6 style={styles.tabContentTitle}>Feature Toggles</h6>
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
                <span style={styles.tabTitle}>
                  <FileText size={16} style={styles.tabIcon} /> Audit Logs
                </span>
              }>
                <div style={styles.tabContent}>
                  <div style={styles.auditHeader}>
                    <h6 style={styles.auditTitle}>Recent Activity</h6>
                    <Button size="sm" variant="outline-secondary" style={styles.auditExportBtn}>
                      <Download size={14} className="me-1" />
                      Export Logs
                    </Button>
                  </div>
                  <div className="table-responsive">
                    <Table hover style={styles.auditTable}>
                      <thead>
                        <tr>
                          <th style={styles.auditTableHeader}>User</th>
                          <th style={styles.auditTableHeader}>Action</th>
                          <th style={styles.auditTableHeader}>Details</th>
                          <th style={styles.auditTableHeader}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={styles.auditEmptyState}>
                              <FileText size={32} style={styles.auditEmptyIcon} />
                              <p style={styles.auditEmptyText}>No audit logs found</p>
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log, index) => {
                            const logId = log.id || log._id || index;
                            const user = getField(log, ['user', 'username', 'admin', 'actor'], 'System');
                            const action = getField(log, ['action', 'type', 'event'], 'Unknown');
                            const details = getField(log, ['details', 'message', 'description', 'note'], 'No details');
                            const timestamp = log.timestamp || log.createdAt || log.date || new Date().toISOString();

                            return (
                              <tr key={logId} style={styles.auditTableRow}>
                                <td style={styles.auditTableCell}>{user}</td>
                                <td style={styles.auditTableCell}><Badge bg="secondary" className="rounded-pill">{action}</Badge></td>
                                <td style={styles.auditTableCell}>{details}</td>
                                <td style={styles.auditTableCell}><small className="text-muted">{new Date(timestamp).toLocaleString()}</small></td>
                              </tr>
                            );
                          })
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

      <style>{styles.globalStyles}</style>
    </div>
  );
};

const styles = {
  container: {
    background: '#f8f9fa',
    minHeight: '100vh'
  },
  alert: {
    borderRadius: '12px',
    marginBottom: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '4px'
  },
  headerSubtitle: {
    color: '#718096',
    marginBottom: 0,
    fontSize: '16px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  refreshBtn: {
    borderRadius: '12px',
    padding: '10px 20px'
  },
  saveBtn: {
    borderRadius: '12px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusCard: {
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    overflow: 'hidden'
  },
  statusCardBody: {
    padding: '16px 24px'
  },
  statusTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#1a202c'
  },
  statusItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusLabel: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#1a202c'
  },
  tabsCard: {
    border: 'none',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  tabsCardBody: {
    padding: 0
  },
  tabs: {
    borderBottom: 'none',
    padding: '0 24px',
    paddingTop: '16px'
  },
  tabTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500'
  },
  tabIcon: {
    opacity: 0.7
  },
  tabContent: {
    padding: '24px'
  },
  tabContentTitle: {
    fontWeight: '600',
    marginBottom: '20px',
    fontSize: '16px',
    color: '#1a202c'
  },
  formLabel: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1a202c'
  },
  formControl: {
    borderRadius: '10px',
    padding: '10px 14px'
  },
  formText: {
    color: '#718096',
    fontSize: '13px'
  },
  apiKeyWrapper: {
    display: 'flex',
    gap: '8px'
  },
  apiKeyBtn: {
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  auditHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  auditTitle: {
    fontWeight: '600',
    marginBottom: 0,
    fontSize: '14px',
    color: '#1a202c'
  },
  auditExportBtn: {
    borderRadius: '10px'
  },
  auditTable: {
    marginBottom: 0
  },
  auditTableHeader: {
    fontWeight: '600',
    fontSize: '12px',
    color: '#4a5568',
    padding: '10px 12px',
    borderBottom: '2px solid #e2e8f0'
  },
  auditTableRow: {
    transition: 'background 0.2s'
  },
  auditTableCell: {
    padding: '10px 12px',
    verticalAlign: 'middle',
    fontSize: '14px'
  },
  auditEmptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  auditEmptyIcon: {
    color: '#cbd5e0',
    marginBottom: '8px',
    opacity: 0.5
  },
  auditEmptyText: {
    color: '#a0aec0',
    marginBottom: 0
  },
  globalStyles: `
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
    .form-control:focus, .form-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .modal-content {
      border-radius: 20px;
      overflow: hidden;
    }
    .modal-header .btn-close {
      padding: 8px;
    }
    @media (max-width: 768px) {
      .nav-tabs .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
      }
      .table-responsive {
        font-size: 0.85rem;
      }
    }
  `
};

export default AdminSettings;