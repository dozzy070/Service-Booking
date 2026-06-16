import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Card,
  ListGroup,
  Badge,
  Button,
  Spinner,
  Alert,
  Dropdown,
  Pagination,
  Tab,
  Tabs,
  Modal,
  Form
} from 'react-bootstrap';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaClock,
  FaCalendarCheck,
  FaComment,
  FaStar,
  FaMoneyBillWave,
  FaUserPlus,
  FaCog,
  FaCheckDouble,
  FaFilter,
  FaSearch,
  FaEllipsisV,
  FaReply,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaDownload,
  FaEnvelope,
  FaSms,
  FaGlobe
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationAPI } from '../../api/api';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    booking_alerts: true,
    payment_alerts: true,
    review_alerts: true,
    promotional_alerts: false
  });
  const [deleting, setDeleting] = useState(false);
  const [updatingPreferences, setUpdatingPreferences] = useState(false);

  const itemsPerPage = 20;

  // Format notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <FaCalendarCheck className="text-success" size={18} />;
      case 'payment':
        return <FaMoneyBillWave className="text-info" size={18} />;
      case 'review':
        return <FaStar className="text-warning" size={18} />;
      case 'message':
        return <FaComment className="text-primary" size={18} />;
      case 'user':
        return <FaUserPlus className="text-secondary" size={18} />;
      case 'system':
        return <FaCog className="text-secondary" size={18} />;
      default:
        return <FaBell className="text-primary" size={18} />;
    }
  };

  // Format time display
  const formatTime = (date) => {
    const notificationDate = new Date(date);
    if (isToday(notificationDate)) {
      return format(notificationDate, 'h:mm a');
    } else if (isYesterday(notificationDate)) {
      return 'Yesterday';
    } else {
      return format(notificationDate, 'MMM dd, yyyy');
    }
  };

  // Get category badge
  const getCategoryBadge = (type) => {
    const config = {
      booking: { variant: 'success', text: 'Booking' },
      payment: { variant: 'info', text: 'Payment' },
      review: { variant: 'warning', text: 'Review' },
      message: { variant: 'primary', text: 'Message' },
      user: { variant: 'secondary', text: 'User' },
      system: { variant: 'dark', text: 'System' }
    };
    const item = config[type] || config.system;
    return (
      <Badge bg={item.variant} className="rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
        {item.text}
      </Badge>
    );
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: filter !== 'all' ? filter : undefined,
        search: searchTerm || undefined
      };
      const response = await notificationAPI.getNotifications(params);
      setNotifications(response.data.notifications || []);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
      setTotalCount(response.data.total || 0);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, searchTerm]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await notificationAPI.getPreferences();
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, []);

  // Load data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchNotifications(), fetchPreferences()]);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    toast.success('Notifications updated');
  };

  useEffect(() => {
    loadData();
  }, [currentPage, filter, searchTerm]);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const handleDeleteNotification = async () => {
    if (!selectedNotification) return;

    setDeleting(true);
    try {
      await notificationAPI.deleteNotification(selectedNotification.id);
      toast.success('Notification deleted');
      setShowDeleteModal(false);
      setSelectedNotification(null);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setDeleting(false);
    }
  };

  // Update preferences
  const updatePreferences = async () => {
    setUpdatingPreferences(true);
    try {
      await notificationAPI.updatePreferences(preferences);
      toast.success('Notification preferences updated');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setUpdatingPreferences(false);
    }
  };

  // Export notifications
  const exportNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ export: true });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Notifications exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export notifications');
    }
  };

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifications.forEach(notif => {
      const date = new Date(notif.created_at);
      if (isToday(date)) {
        groups.today.push(notif);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notif);
      } else if (date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h2 className="mb-1 fw-bold d-flex align-items-center gap-2">
              <FaBell />
              Notifications
              {unreadCount > 0 && (
                <Badge bg="danger" pill className="ms-2">
                  {unreadCount} unread
                </Badge>
              )}
            </h2>
            <p className="text-muted mb-0">Stay updated with your latest activities</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={refreshData}
              disabled={refreshing}
              className="d-flex align-items-center gap-2"
            >
              <FaBell className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={exportNotifications}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload />
              Export
            </Button>
            <Button
              variant="outline-info"
              onClick={() => setShowSettingsModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaCog />
              Settings
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Alert variant="warning" className="mb-4" style={{ borderRadius: '12px' }}>
            <div className="d-flex align-items-center gap-2">
              <FaExclamationCircle />
              <span>Real-time connection lost. Notifications will update when you reconnect.</span>
            </div>
          </Alert>
        )}

        {/* Filters Bar */}
        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-4">
            <Row className="g-3">
              <Col md={4}>
                <Form.Label className="small text-muted">Filter by Type</Form.Label>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="rounded-pill"
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'booking' ? 'success' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('booking')}
                    className="rounded-pill"
                  >
                    <FaCalendarCheck className="me-1" size={12} />
                    Bookings
                  </Button>
                  <Button
                    variant={filter === 'payment' ? 'info' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('payment')}
                    className="rounded-pill"
                  >
                    <FaMoneyBillWave className="me-1" size={12} />
                    Payments
                  </Button>
                  <Button
                    variant={filter === 'review' ? 'warning' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('review')}
                    className="rounded-pill"
                  >
                    <FaStar className="me-1" size={12} />
                    Reviews
                  </Button>
                  <Button
                    variant={filter === 'message' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setFilter('message')}
                    className="rounded-pill"
                  >
                    <FaComment className="me-1" size={12} />
                    Messages
                  </Button>
                </div>
              </Col>

              <Col md={4}>
                <Form.Label className="small text-muted">Search</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <FaSearch size={12} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </InputGroup>
              </Col>

              <Col md={4} className="d-flex align-items-end">
                {unreadCount > 0 && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={markAllAsRead}
                    className="d-flex align-items-center gap-2"
                  >
                    <FaCheckDouble />
                    Mark All as Read
                  </Button>
                )}
              </Col>
            </Row>

            <div className="mt-3">
              <small className="text-muted">
                Showing {notifications.length} of {totalCount} notifications
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="border-0 shadow-sm text-center py-5" style={{ borderRadius: '20px' }}>
            <Card.Body>
              <FaBell size={48} className="text-muted mb-3 opacity-50" />
              <h6 className="text-muted">No notifications</h6>
              <p className="text-muted small mb-0">
                You're all caught up! New notifications will appear here.
              </p>
            </Card.Body>
          </Card>
        ) : (
          <>
            {/* Today's Notifications */}
            {groupedNotifications.today.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 text-muted">Today</h6>
                {groupedNotifications.today.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={() => {
                      setSelectedNotification(notification);
                      setShowDeleteModal(true);
                    }}
                    getNotificationIcon={getNotificationIcon}
                    getCategoryBadge={getCategoryBadge}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Yesterday's Notifications */}
            {groupedNotifications.yesterday.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 text-muted">Yesterday</h6>
                {groupedNotifications.yesterday.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={() => {
                      setSelectedNotification(notification);
                      setShowDeleteModal(true);
                    }}
                    getNotificationIcon={getNotificationIcon}
                    getCategoryBadge={getCategoryBadge}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* This Week */}
            {groupedNotifications.thisWeek.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 text-muted">This Week</h6>
                {groupedNotifications.thisWeek.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={() => {
                      setSelectedNotification(notification);
                      setShowDeleteModal(true);
                    }}
                    getNotificationIcon={getNotificationIcon}
                    getCategoryBadge={getCategoryBadge}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Older */}
            {groupedNotifications.older.length > 0 && (
              <div className="mb-4">
                <h6 className="mb-3 text-muted">Older</h6>
                {groupedNotifications.older.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={() => {
                      setSelectedNotification(notification);
                      setShowDeleteModal(true);
                    }}
                    getNotificationIcon={getNotificationIcon}
                    getCategoryBadge={getCategoryBadge}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.Prev
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  />
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">
            <FaTrash className="me-2" />
            Delete Notification
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="danger" className="mb-0" style={{ borderRadius: '12px' }}>
            <FaExclamationCircle className="me-2" />
            Are you sure you want to delete this notification? This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteNotification} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Settings Modal */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <FaCog className="me-2" />
            Notification Preferences
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          <Alert variant="info" className="mb-4" style={{ borderRadius: '12px' }}>
            <FaInfoCircle className="me-2" />
            Choose how you want to receive notifications
          </Alert>

          <h6 className="fw-bold mb-3">Channels</h6>
          <div className="mb-4 p-3 rounded-3" style={{ background: '#f8fafc' }}>
            <Form.Check
              type="switch"
              label="Email Notifications"
              checked={preferences.email_notifications}
              onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              label="Push Notifications"
              checked={preferences.push_notifications}
              onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              label="SMS Notifications"
              checked={preferences.sms_notifications}
              onChange={(e) => setPreferences({ ...preferences, sms_notifications: e.target.checked })}
            />
          </div>

          <h6 className="fw-bold mb-3">Alert Types</h6>
          <div className="p-3 rounded-3" style={{ background: '#f8fafc' }}>
            <Form.Check
              type="switch"
              label="Booking Alerts"
              checked={preferences.booking_alerts}
              onChange={(e) => setPreferences({ ...preferences, booking_alerts: e.target.checked })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              label="Payment Alerts"
              checked={preferences.payment_alerts}
              onChange={(e) => setPreferences({ ...preferences, payment_alerts: e.target.checked })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              label="Review Alerts"
              checked={preferences.review_alerts}
              onChange={(e) => setPreferences({ ...preferences, review_alerts: e.target.checked })}
              className="mb-2"
            />
            <Form.Check
              type="switch"
              label="Promotional Alerts"
              checked={preferences.promotional_alerts}
              onChange={(e) => setPreferences({ ...preferences, promotional_alerts: e.target.checked })}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowSettingsModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updatePreferences} disabled={updatingPreferences}>
            {updatingPreferences ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onDelete, getNotificationIcon, getCategoryBadge, formatTime }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      className={`border-0 shadow-sm mb-3 notification-item ${!notification.is_read ? 'unread' : ''}`}
      style={{ borderRadius: '16px', cursor: 'pointer' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card.Body className="p-4">
        <div className="d-flex gap-3">
          <div className="notification-icon-wrapper">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="fw-semibold">{notification.title || notification.type}</span>
                  {getCategoryBadge(notification.type)}
                  {!notification.is_read && (
                    <Badge bg="primary" pill className="ms-1">New</Badge>
                  )}
                </div>
                <p className="mb-2">{notification.message}</p>
                <div className="d-flex align-items-center gap-3 text-muted small">
                  <span className="d-flex align-items-center gap-1">
                    <FaClock size={10} />
                    {formatTime(notification.created_at)}
                  </span>
                  {notification.metadata && notification.metadata.reference && (
                    <span className="d-flex align-items-center gap-1">
                      <FaInfoCircle size={10} />
                      Ref: {notification.metadata.reference}
                    </span>
                  )}
                </div>
              </div>
              {showActions && (
                <div className="d-flex gap-2">
                  {!notification.is_read && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-success p-0"
                      onClick={() => onMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </Button>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={onDelete}
                    title="Delete"
                  >
                    <FaTrash />
                  </Button>
                </div>
              )}
            </div>
            {notification.action_url && (
              <Button
                variant="outline-primary"
                size="sm"
                className="mt-2 rounded-pill"
                href={notification.action_url}
                target="_blank"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Notifications;