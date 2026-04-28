import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  ListGroup,
  Badge,
  Button,
  Spinner
} from 'react-bootstrap';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaClock,
  FaCalendarCheck,
  FaComment,
  FaStar
} from 'react-icons/fa';
import api from '../api';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <FaCalendarCheck className="text-primary" />;
      case 'message':
        return <FaComment className="text-info" />;
      case 'review':
        return <FaStar className="text-warning" />;
      default:
        return <FaBell className="text-secondary" />;
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <Button variant="outline-primary" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm">
        <ListGroup variant="flush">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <ListGroup.Item
                key={notif.id}
                className={`py-3 ${!notif.is_read ? 'bg-light' : ''}`}
              >
                <div className="d-flex">
                  <div className="me-3">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="mb-1">{notif.message}</p>
                        <small className="text-muted d-flex align-items-center">
                          <FaClock className="me-1" size={10} />
                          {formatDate(notif.created_at)}
                        </small>
                      </div>
                      <div>
                        {!notif.is_read && (
                          <Badge bg="primary" pill className="me-2">
                            New
                          </Badge>
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted p-0 me-2"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <FaCheck />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => deleteNotification(notif.id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center py-5">
              <FaBell size={48} className="text-muted mb-3" />
              <h5>No notifications</h5>
              <p className="text-muted">You're all caught up!</p>
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card>
    </Container>
  );
};

export default Notifications;