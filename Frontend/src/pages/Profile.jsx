// src/pages/Profile.jsx
import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Alert,
  Spinner
} from 'react-bootstrap';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCamera,
  FaSave,
  FaEdit,
  FaKey,
  FaSpinner
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, handleImageError } from '../utils/imageUtils';
import toast from 'react-hot-toast';

// ======================== FIXED URL CONFIGURATION ========================
// If your VITE_API_URL already includes "/api", do NOT add another "/api"
// Example: VITE_API_URL = "http://localhost:5000"
// Then use: `${API_BASE_URL}/api/user/avatar`
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to build full URL without double slashes
const buildUrl = (path) => {
  // If API_BASE_URL already ends with '/api', remove trailing slash and path starts without '/api'
  let base = API_BASE_URL.replace(/\/$/, '');
  // If path starts with '/', remove it to avoid double slash
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const Profile = () => {
  const { user, updateUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // -------------------- Refresh user from server --------------------
  const fetchLatestUser = async () => {
    try {
      const res = await fetch(buildUrl('user/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const freshUser = await res.json();
        updateUser(freshUser);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  // -------------------- Avatar Upload --------------------
  const handleAvatarUpload = () => {
    document.getElementById('avatar-upload').click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      // ✅ CORRECT ENDPOINT: adjust according to your backend route
      // If your backend route is POST /api/user/avatar, use:
      const endpoint = buildUrl('user/avatar');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      // data should contain { avatarUrl: '/uploads/avatars/...' }
      const newAvatarUrl = data.avatarUrl;

      // Update local context immediately
      updateUser({ ...user, avatar: newAvatarUrl });
      setAvatarTimestamp(Date.now()); // force image reload
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // In a real app, send to backend: PUT /api/user/profile
    updateUser(profileData);
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Call API to change password (example)
    // fetch(buildUrl('user/change-password'), { method: 'POST', ... })
    toast.success('Password changed successfully!');
    setChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Not Logged In</Alert.Heading>
          <p>Please log in to view your profile.</p>
        </Alert>
      </Container>
    );
  }

  // Clean avatar path (remove any leading /api if accidentally stored)
  let cleanAvatarPath = user?.avatar || null;
  if (cleanAvatarPath && cleanAvatarPath.startsWith('/api')) {
    cleanAvatarPath = cleanAvatarPath.substring(4); // remove '/api'
  }

  const avatarSrc = cleanAvatarPath
    ? `${API_BASE_URL.replace(/\/api$/, '')}${cleanAvatarPath}?t=${avatarTimestamp}`
    : getAvatarUrl(profileData.name, 150);

  return (
    <Container>
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <img
                  src={avatarSrc}
                  alt={profileData.name}
                  className="rounded-circle border"
                  style={{ width: 150, height: 150, objectFit: 'cover' }}
                  onError={(e) => handleImageError(e, getAvatarUrl(profileData.name, 150))}
                />
                {uploadingAvatar && (
                  <div className="position-absolute top-50 start-50 translate-middle bg-dark bg-opacity-50 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 150, height: 150 }}>
                    <Spinner animation="border" variant="light" size="sm" />
                  </div>
                )}
                <button
                  onClick={handleAvatarUpload}
                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 border-0"
                  style={{ cursor: 'pointer' }}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? <FaSpinner className="spin" /> : <FaCamera />}
                  <input type="file" id="avatar-upload" accept="image/*" style={{ display: 'none' }}
                    onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </button>
              </div>

              <h4>{profileData.name}</h4>
              <p className="text-muted mb-2">{profileData.email}</p>
              <Badge bg={user?.role === 'admin' ? 'danger' : user?.role === 'provider' ? 'success' : 'primary'} className="mb-3">
                {user?.role || 'User'}
              </Badge>

              <div className="text-start mt-3">
                <h6>Account Statistics</h6>
                <hr />
                <Row>
                  <Col xs={6} className="text-center">
                    <h5>24</h5>
                    <small className="text-muted">Bookings</small>
                  </Col>
                  <Col xs={6} className="text-center">
                    <h5>12</h5>
                    <small className="text-muted">Reviews</small>
                  </Col>
                </Row>
                <hr />
                <div>
                  <small className="text-muted">Member since: </small>
                  <br />
                  <strong>{formatDate(user?.created_at || new Date())}</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {/* Profile Information Card */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Profile Information</h5>
              {!isEditing && (
                <Button variant="outline-primary" size="sm" onClick={() => setIsEditing(true)}>
                  <FaEdit className="me-2" /> Edit Profile
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3">
                          <FaUser className="text-muted" />
                        </span>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          className="ps-5"
                          disabled={!isEditing}
                          readOnly={!isEditing}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3">
                          <FaEnvelope className="text-muted" />
                        </span>
                        <Form.Control
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className="ps-5"
                          disabled={!isEditing}
                          readOnly={!isEditing}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3">
                          <FaPhone className="text-muted" />
                        </span>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="ps-5"
                          disabled={!isEditing}
                          readOnly={!isEditing}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <div className="position-relative">
                        <span className="position-absolute top-50 translate-middle-y ps-3">
                          <FaMapMarkerAlt className="text-muted" />
                        </span>
                        <Form.Control
                          type="text"
                          name="address"
                          value={profileData.address}
                          onChange={handleProfileChange}
                          className="ps-5"
                          disabled={!isEditing}
                          readOnly={!isEditing}
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    readOnly={!isEditing}
                  />
                </Form.Group>

                {isEditing && (
                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary">
                      <FaSave className="me-2" /> Save Changes
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>

          {/* Password & Security Card */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Password & Security</h5>
              {!changingPassword && (
                <Button variant="outline-warning" size="sm" onClick={() => setChangingPassword(true)}>
                  <FaKey className="me-2" /> Change Password
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {changingPassword ? (
                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    <Form.Text className="text-muted">
                      Minimum 6 characters
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button type="submit" variant="warning">
                      Update Password
                    </Button>
                    <Button variant="secondary" onClick={() => setChangingPassword(false)}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <p className="text-muted mb-0">Your password is securely stored and never shared.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx="true">{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default Profile;