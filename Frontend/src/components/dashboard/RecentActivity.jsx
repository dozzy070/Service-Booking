import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { FaCalendarCheck, FaUser, FaStar, FaComment } from 'react-icons/fa';

const RecentActivity = ({ activities = [], loading = false }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return <FaCalendarCheck className="text-primary" />;
      case 'user':
        return <FaUser className="text-success" />;
      case 'review':
        return <FaStar className="text-warning" />;
      case 'message':
        return <FaComment className="text-info" />;
      default:
        return <FaCalendarCheck className="text-secondary" />;
    }
  };

  const getActivityBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      cancelled: 'danger',
      new: 'primary'
    };
    return variants[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted mb-0">No recent activity</p>
      </div>
    );
  }

  return (
    <ListGroup variant="flush">
      {activities.map((activity, index) => (
        <ListGroup.Item key={index} className="px-0">
          <div className="d-flex">
            <div className="me-3">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mb-1">{activity.description}</p>
                  <small className="text-muted">
                    {timeAgo(activity.timestamp)}
                  </small>
                </div>
                {activity.status && (
                  <Badge bg={getActivityBadge(activity.status)} pill>
                    {activity.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default RecentActivity;