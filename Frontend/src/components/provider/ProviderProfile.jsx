// src/components/provider/ProviderProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
  ProgressBar
} from 'react-bootstrap';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Award,
  Users,
  Globe,
  Languages,
  Shield,
  Heart,
  MessageCircle,
  Upload,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
// All social icons from react-icons/fa
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaWhatsapp
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { providerAPI, authAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bio: '',
    specialties: [],
    yearsOfExperience: 0,
    hourlyRate: 0,
    languages: [],
    website: '',
    availability: '',
    serviceAreas: [],
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: ''
    },
    avatar: null,
    coverPhoto: null
  });

  const [stats, setStats] = useState({
    totalJobs: 0,
    rating: 0,
    responseTime: '',
    completionRate: 0,
    totalEarnings: 0,
    repeatCustomers: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [serviceAreaInput, setServiceAreaInput] = useState('');

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Fetch provider profile
  const fetchProviderProfile = useCallback(async () => {
    try {
      const response = await providerAPI.getProfile();
      const profileData = response.data;
      setProfile({
        name: profileData.name || user?.name || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        zipCode: profileData.zip_code || '',
        bio: profileData.bio || '',
        specialties: profileData.specialties || [],
        yearsOfExperience: profileData.years_of_experience || 0,
        hourlyRate: profileData.hourly_rate || 0,
        languages: profileData.languages || [],
        website: profileData.website || '',
        availability: profileData.availability || '',
        serviceAreas: profileData.service_areas || [],
        socialMedia: profileData.social_media || {
          instagram: '',
          facebook: '',
          twitter: '',
          linkedin: ''
        },
        avatar: profileData.avatar,
        coverPhoto: profileData.cover_photo
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  }, [user]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await providerAPI.getStats();
      setStats({
        totalJobs: response.data.total_jobs || 0,
        rating: response.data.rating || 0,
        responseTime: response.data.response_time || '< 1 hour',
        completionRate: response.data.completion_rate || 0,
        totalEarnings: response.data.total_earnings || 0,
        repeatCustomers: response.data.repeat_customers || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch recent activity
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await providerAPI.getRecentActivity();
      setRecentActivity(response.data || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  }, []);

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProviderProfile(),
      fetchStats(),
      fetchRecentActivity()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSocialChange = (platform, value) => {
    setProfile({
      ...profile,
      socialMedia: {
        ...profile.socialMedia,
        [platform]: value
      }
    });
  };

  const addSpecialty = () => {
    if (specialtyInput && !profile.specialties.includes(specialtyInput)) {
      setProfile({
        ...profile,
        specialties: [...profile.specialties, specialtyInput]
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty) => {
    setProfile({
      ...profile,
      specialties: profile.specialties.filter(s => s !== specialty)
    });
  };

  const addLanguage = () => {
    if (languageInput && !profile.languages.includes(languageInput)) {
      setProfile({
        ...profile,
        languages: [...profile.languages, languageInput]
      });
      setLanguageInput('');
    }
  };

  const removeLanguage = (language) => {
    setProfile({
      ...profile,
      languages: profile.languages.filter(l => l !== language)
    });
  };

  const addServiceArea = () => {
    if (serviceAreaInput && !profile.serviceAreas.includes(serviceAreaInput)) {
      setProfile({
        ...profile,
        serviceAreas: [...profile.serviceAreas, serviceAreaInput]
      });
      setServiceAreaInput('');
    }
  };

  const removeServiceArea = (area) => {
    setProfile({
      ...profile,
      serviceAreas: profile.serviceAreas.filter(a => a !== area)
    });
  };

  const handleImageUpload = async (type, file) => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append(type, file);
    
    try {
      const response = await providerAPI.uploadImage(formData);
      if (type === 'avatar') {
        setProfile({ ...profile, avatar: response.data.url });
      } else {
        setProfile({ ...profile, coverPhoto: response.data.url });
      }
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover photo'} updated successfully`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setShowAvatarModal(false);
      setSelectedImage(null);
      setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileData = {
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zipCode,
        bio: profile.bio,
        specialties: profile.specialties,
        years_of_experience: profile.yearsOfExperience,
        hourly_rate: profile.hourlyRate,
        languages: profile.languages,
        website: profile.website,
        availability: profile.availability,
        service_areas: profile.serviceAreas,
        social_media: profile.socialMedia
      };
      
      await providerAPI.updateProfile(profileData);
      await updateUser({ name: profile.name });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      await fetchProviderProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold">Profile</h2>
            <p className="text-muted mb-0">Manage your professional profile and business information</p>
          </div>
          <Button
            variant={isEditing ? 'success' : 'primary'}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="d-flex align-items-center gap-2 px-4"
          >
            {saving ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : isEditing ? (
              <Save size={18} />
            ) : (
              <Edit2 size={18} />
            )}
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>

        {/* Cover & Avatar */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ position: 'relative' }}>
            {/* Cover Photo */}
            <div 
              style={{ 
                height: '200px', 
                background: profile.coverPhoto 
                  ? `url(${profile.coverPhoto}) center/cover` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative'
              }}
            >
              {isEditing && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => {
                    setShowAvatarModal(true);
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    borderRadius: '10px',
                    padding: '8px 12px'
                  }}
                >
                  <Camera size={16} className="me-2" />
                  Change Cover
                </Button>
              )}
            </div>

            {/* Avatar */}
            <div style={{ position: 'relative', marginTop: '-60px', marginLeft: '30px' }}>
              <div 
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%',
                  background: profile.avatar 
                    ? `url(${profile.avatar}) center/cover` 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '48px',
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {!profile.avatar && getInitials(profile.name)}
              </div>
              {isEditing && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => {
                    setShowAvatarModal(true);
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    borderRadius: '50%',
                    padding: '8px',
                    width: '36px',
                    height: '36px'
                  }}
                >
                  <Camera size={16} />
                </Button>
              )}
            </div>
          </div>

          <Card.Body className="pt-3 pb-4">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                {isEditing ? (
                  <Form.Control
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="mb-2"
                    style={{ fontSize: '24px', fontWeight: 'bold', width: '300px' }}
                  />
                ) : (
                  <h3 className="mb-2">{profile.name}</h3>
                )}
                <div className="d-flex gap-2 mb-2">
                  <Badge bg="success" className="px-3 py-2">Verified Professional</Badge>
                  <Badge bg="info" className="px-3 py-2">Top Rated</Badge>
                </div>
              </div>
              
              {!isEditing && (
                <Button
                  variant="outline-primary"
                  onClick={() => window.location.href = '/provider/chat'}
                  className="d-flex align-items-center gap-2"
                >
                  <MessageCircle size={18} />
                  Message
                </Button>
              )}
            </div>

            {/* Stats Row */}
            <div className="d-flex gap-4 flex-wrap mt-3 pt-2 border-top">
              <div className="text-center">
                <div className="d-flex align-items-center gap-1">
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <strong className="h5 mb-0">{stats.rating.toFixed(1)}</strong>
                </div>
                <small className="text-muted">Rating</small>
              </div>
              <div className="text-center">
                <strong className="h5 mb-0">{stats.totalJobs}</strong>
                <div><small className="text-muted">Jobs Completed</small></div>
              </div>
              <div className="text-center">
                <strong className="h5 mb-0">{stats.responseTime}</strong>
                <div><small className="text-muted">Response Time</small></div>
              </div>
              <div className="text-center">
                <strong className="h5 mb-0">{stats.completionRate}%</strong>
                <div><small className="text-muted">Completion Rate</small></div>
              </div>
              <div className="text-center">
                <strong className="h5 mb-0">{stats.repeatCustomers}</strong>
                <div><small className="text-muted">Repeat Customers</small></div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Row className="g-4">
          {/* Left Column */}
          <Col lg={4}>
            {/* Contact Information */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Contact Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Mail size={16} className="text-muted" />
                    <strong className="small">Email</strong>
                  </div>
                  {isEditing ? (
                    <Form.Control type="email" name="email" value={profile.email} onChange={handleChange} />
                  ) : (
                    <p className="mb-0">{profile.email}</p>
                  )}
                </div>
                
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Phone size={16} className="text-muted" />
                    <strong className="small">Phone</strong>
                  </div>
                  {isEditing ? (
                    <Form.Control type="tel" name="phone" value={profile.phone} onChange={handleChange} />
                  ) : (
                    <p className="mb-0">{profile.phone || 'Not provided'}</p>
                  )}
                </div>
                
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <MapPin size={16} className="text-muted" />
                    <strong className="small">Address</strong>
                  </div>
                  {isEditing ? (
                    <>
                      <Form.Control type="text" name="address" value={profile.address} onChange={handleChange} placeholder="Street address" className="mb-2" />
                      <Row>
                        <Col md={6}>
                          <Form.Control type="text" name="city" value={profile.city} onChange={handleChange} placeholder="City" />
                        </Col>
                        <Col md={6}>
                          <Form.Control type="text" name="state" value={profile.state} onChange={handleChange} placeholder="State" />
                        </Col>
                      </Row>
                    </>
                  ) : (
                    <p className="mb-0">
                      {profile.address}<br />
                      {profile.city && `${profile.city}, `}{profile.state}
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Globe size={16} className="text-muted" />
                    <strong className="small">Website</strong>
                  </div>
                  {isEditing ? (
                    <Form.Control type="url" name="website" value={profile.website} onChange={handleChange} placeholder="https://" />
                  ) : (
                    profile.website ? (
                      <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer">{profile.website}</a>
                    ) : (
                      <p className="text-muted mb-0">Not provided</p>
                    )
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Business Stats */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Business Stats</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Hourly Rate</small>
                    <strong>{formatNaira(profile.hourlyRate)}/hr</strong>
                  </div>
                  {isEditing && (
                    <Form.Control
                      type="number"
                      name="hourlyRate"
                      value={profile.hourlyRate}
                      onChange={handleChange}
                      min="1000"
                      step="500"
                    />
                  )}
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Experience</small>
                    <strong>{profile.yearsOfExperience}+ years</strong>
                  </div>
                  {isEditing && (
                    <Form.Control
                      type="number"
                      name="yearsOfExperience"
                      value={profile.yearsOfExperience}
                      onChange={handleChange}
                      min="0"
                      max="50"
                    />
                  )}
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Availability</small>
                    <strong className="small">{profile.availability || 'Not set'}</strong>
                  </div>
                  {isEditing && (
                    <Form.Control
                      type="text"
                      name="availability"
                      value={profile.availability}
                      onChange={handleChange}
                      placeholder="e.g., Monday - Friday, 9 AM - 6 PM"
                    />
                  )}
                </div>
                
                <div>
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Total Earnings</small>
                    <strong>{formatNaira(stats.totalEarnings)}</strong>
                  </div>
                  <ProgressBar 
                    variant="success" 
                    now={(stats.totalEarnings / 1000000) * 100} 
                    label={`₦${(stats.totalEarnings / 1000).toFixed(0)}k`}
                    style={{ height: '8px', borderRadius: '4px' }}
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Social Media */}
            {isEditing && (
              <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                <Card.Header className="bg-white border-0 pt-4">
                  <h5 className="fw-bold mb-0">Social Media</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaInstagram size={16} color="#E4405F" />
                      <small className="text-muted">Instagram</small>
                    </div>
                    <Form.Control
                      type="text"
                      value={profile.socialMedia.instagram}
                      onChange={(e) => handleSocialChange('instagram', e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                  <div className="mb-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaFacebook size={16} color="#1877F2" />
                      <small className="text-muted">Facebook</small>
                    </div>
                    <Form.Control
                      type="text"
                      value={profile.socialMedia.facebook}
                      onChange={(e) => handleSocialChange('facebook', e.target.value)}
                      placeholder="facebook.com/username"
                    />
                  </div>
                  <div className="mb-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaTwitter size={16} color="#1DA1F2" />
                      <small className="text-muted">Twitter/X</small>
                    </div>
                    <Form.Control
                      type="text"
                      value={profile.socialMedia.twitter}
                      onChange={(e) => handleSocialChange('twitter', e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <FaLinkedin size={16} color="#0A66C2" />
                      <small className="text-muted">LinkedIn</small>
                    </div>
                    <Form.Control
                      type="text"
                      value={profile.socialMedia.linkedin}
                      onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Right Column */}
          <Col lg={8}>
            {/* About & Bio */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">About Me</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <strong className="small text-muted d-block mb-2">Bio</strong>
                  {isEditing ? (
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      placeholder="Tell customers about your experience and services..."
                    />
                  ) : (
                    <p className="mb-0">{profile.bio || 'No bio provided yet.'}</p>
                  )}
                </div>

                <div className="mb-4">
                  <strong className="small text-muted d-block mb-2">Specialties</strong>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {profile.specialties.map((specialty, index) => (
                      <Badge key={index} bg="light" text="dark" className="p-2 d-flex align-items-center gap-1">
                        {specialty}
                        {isEditing && (
                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeSpecialty(specialty)} />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="d-flex gap-2 mt-2">
                      <Form.Control
                        type="text"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        placeholder="Add a specialty"
                        onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                      />
                      <Button variant="outline-primary" size="sm" onClick={addSpecialty}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <strong className="small text-muted d-block mb-2">Languages</strong>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {profile.languages.map((language, index) => (
                      <Badge key={index} bg="info" className="p-2 d-flex align-items-center gap-1">
                        {language}
                        {isEditing && (
                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeLanguage(language)} />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="d-flex gap-2 mt-2">
                      <Form.Control
                        type="text"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        placeholder="Add a language"
                        onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                      />
                      <Button variant="outline-primary" size="sm" onClick={addLanguage}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <strong className="small text-muted d-block mb-2">Service Areas</strong>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {profile.serviceAreas.map((area, index) => (
                      <Badge key={index} bg="secondary" className="p-2 d-flex align-items-center gap-1">
                        {area}
                        {isEditing && (
                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeServiceArea(area)} />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="d-flex gap-2 mt-2">
                      <Form.Control
                        type="text"
                        value={serviceAreaInput}
                        onChange={(e) => setServiceAreaInput(e.target.value)}
                        placeholder="Add service area (e.g., Lagos Island)"
                        onKeyPress={(e) => e.key === 'Enter' && addServiceArea()}
                      />
                      <Button variant="outline-primary" size="sm" onClick={addServiceArea}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <Card.Header className="bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Recent Activity</h5>
              </Card.Header>
              <Card.Body>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock size={32} className="text-muted mb-2 opacity-50" />
                    <p className="text-muted mb-0">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: activity.type === 'job' ? '#10b98120' : activity.type === 'review' ? '#3b82f620' : '#f59e0b20'
                        }}
                      >
                        {activity.type === 'job' && <CheckCircle size={20} color="#10b981" />}
                        {activity.type === 'review' && <Star size={20} color="#3b82f6" />}
                        {activity.type === 'booking' && <Calendar size={20} color="#f59e0b" />}
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0"><strong>{activity.title}</strong></p>
                        <small className="text-muted">{activity.description}</small>
                        <div className="small text-muted">
                          {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Image Upload Modal */}
      <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <Camera size={18} className="me-2" />
            Upload Photo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {previewUrl ? (
            <div className="text-center mb-3">
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ 
                  width: '200px', 
                  height: '200px', 
                  objectFit: 'cover', 
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0'
                }} 
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
                <Trash2 size={14} className="me-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div 
              className="text-center border-2 border-dashed rounded-3 p-5"
              style={{ borderColor: '#e2e8f0', cursor: 'pointer' }}
              onClick={() => document.getElementById('imageUpload').click()}
            >
              <Upload size={48} className="text-muted mb-3" />
              <p className="mb-1">Click to upload an image</p>
              <small className="text-muted">PNG, JPG up to 5MB</small>
              <input
                id="imageUpload"
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
          <Button
            variant="primary"
            onClick={() => handleImageUpload('avatar', selectedImage)}
            disabled={!selectedImage || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProviderProfile;