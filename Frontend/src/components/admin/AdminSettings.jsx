import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Spinner, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  Globe, Lock, Bell, Shield, CreditCard, Mail, Save, Database, Users, 
  DollarSign, Clock, Server, Settings as SettingsIcon, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Info, Eye, EyeOff, Key,
  UserCheck, UserX, Activity, FileText, Printer, Download,
  Cloud, CloudUpload, CloudDownload, Zap, ShieldCheck,
  Wifi, WifiOff, Monitor, Smartphone, Tablet
} from 'lucide-react';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa';
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
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    cache: 'connected',
    queue: 'connected',
    email: 'connected'
  });
  const [auditLogs, setAuditLogs] = useState([]);

  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'ServiceHub',
    siteEmail: 'admin@servicehub.com',
    sitePhone: '+234 800 000 0000',
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
    senderEmail: 'noreply@servicehub.com',
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

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const response = await adminAPI.getAuditLogs({ limit: 10 });
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  }, []);

  const checkSystemStatus = useCallback(async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setSystemStatus(response.data);
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchAuditLogs(), checkSystemStatus()]);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Settings saved successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success('Settings refreshed');
  };

  const getStatusBadge = (status) => {
    const config = {
      connected: { variant: 'success', icon: CheckCircle, text: 'Connected' },
      disconnected: { variant: 'danger', icon: XCircle, text: 'Disconnected' },
      warning: { variant: 'warning', icon: AlertCircle, text: 'Warning' }
    };
    const item = config[status] || config.disconnected;
    const Icon = item.icon;
    return (
      <Badge bg={item.variant} className="d-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill">
        <Icon size={14} />
        <span className="ms-1">{item.text}</span>
      </Badge>
    );
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
        {/* Success Alert */}
        {showSuccess && (
          <Alert variant="success" className="mb-4" onClose={() => setShowSuccess(false)} dismissible style={{ borderRadius: '12px' }}>
            <CheckCircle className="me-2" size={18} />
            Settings saved successfully!
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
                          value={settings.siteName}
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
                          value={settings.siteEmail}
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
                          value={settings.sitePhone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Timezone</Form.Label>
                        <Form.Select name="timezone" value={settings.timezone} onChange={handleChange}>
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
                        <Form.Select name="dateFormat" value={settings.dateFormat} onChange={handleChange}>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Currency</Form.Label>
                        <Form.Select name="currency" value={settings.currency} onChange={handleChange}>
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
                          checked={settings.maintenanceMode}
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
                          value={settings.commissionRate}
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
                          value={settings.minPayoutAmount}
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
                          value={settings.maxPayoutAmount}
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
                          value={settings.processingFee}
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
                      checked={settings.adminEmailAlerts}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="New User Signup Alerts"
                      name="userSignupAlerts"
                      checked={settings.userSignupAlerts}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="New Booking Alerts"
                      name="bookingAlerts"
                      checked={settings.bookingAlerts}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Payment Alerts"
                      name="paymentAlerts"
                      checked={settings.paymentAlerts}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Review Alerts"
                      name="reviewAlerts"
                      checked={settings.reviewAlerts}
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
                      checked={settings.twoFactorAuth}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      label="Require Email Verification for New Users"
                      name="requireVerification"
                      checked={settings.requireVerification}
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
                          value={settings.sessionTimeout}
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
                          value={settings.maxLoginAttempts}
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
                          value={settings.smtpHost}
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
                          value={settings.smtpPort}
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
                          value={settings.senderEmail}
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
                          checked={settings.smtpSecure}
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
                          value={settings.apiRateLimit}
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
                          value={settings.webhookUrl}
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
                          checked={settings.enableBookings}
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
                          checked={settings.enablePayments}
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
                          checked={settings.enableReviews}
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
                          checked={settings.enableChat}
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
                            <tr key={index}>
                              <td>{log.user}</td>
                              <td><Badge bg="secondary" className="rounded-pill">{log.action}</Badge></td>
                              <td>{log.details}</td>
                              <td><small className="text-muted">{new Date(log.timestamp).toLocaleString()}</small></td>
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