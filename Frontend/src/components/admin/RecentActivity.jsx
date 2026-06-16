import React from 'react';
import { ListGroup, Badge, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { 
  FaCalendarCheck, 
  FaUser, 
  FaStar, 
  FaComment, 
  FaMoneyBillWave,
  FaHeart,
  FaShoppingCart,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaArrowRight,
  FaArrowLeft,
  FaCreditCard,
  FaUserPlus,
  FaUserMinus,
  FaCog,
  FaBell,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaLink,
  FaFile,
  FaImage,
  FaVideo,
  FaMusic,
  FaBook,
  FaGift,
  FaAward,
  FaTrophy,
  FaMedal,
  FaCrown,
  FaGem
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const RecentActivity = ({ 
  activities = [], 
  loading = false,
  maxItems = 10,
  showAll = false,
  onViewAll,
  onItemClick,
  className = '',
  animated = true,
  compact = false,
  showTimestamps = true,
  showBadges = true,
  showAvatars = true
}) => {
  
  // Get activity icon based on type
  const getActivityIcon = (type) => {
    const iconMap = {
      booking: { icon: FaCalendarCheck, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      user: { icon: FaUser, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      review: { icon: FaStar, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      message: { icon: FaComment, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
      payment: { icon: FaMoneyBillWave, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)' },
      order: { icon: FaShoppingCart, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      like: { icon: FaHeart, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
      system: { icon: FaCog, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
      alert: { icon: FaBell, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      achievement: { icon: FaAward, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
    };
    return iconMap[type] || { icon: FaInfoCircle, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
  };

  // Get activity badge variant
  const getActivityBadge = (status) => {
    const variants = {
      completed: { bg: 'success', label: 'Completed' },
      pending: { bg: 'warning', label: 'Pending' },
      cancelled: { bg: 'danger', label: 'Cancelled' },
      new: { bg: 'primary', label: 'New' },
      in_progress: { bg: 'info', label: 'In Progress' },
      approved: { bg: 'success', label: 'Approved' },
      rejected: { bg: 'danger', label: 'Rejected' },
      refunded: { bg: 'info', label: 'Refunded' },
      failed: { bg: 'danger', label: 'Failed' }
    };
    return variants[status] || { bg: 'secondary', label: status || 'Unknown' };
  };

  // Format time with relative and absolute options
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // Display items
  const displayItems = showAll ? activities : activities.slice(0, maxItems);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" size="sm" />
        <p className="text-muted mt-2 mb-0 small">Loading activities...</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="rounded-circle bg-light d-inline-flex p-3 mb-2">
          <FaInfoCircle size={24} className="text-muted" />
        </div>
        <p className="text-muted mb-0 small">No recent activity to show</p>
        <p className="text-muted small">Activity will appear here as you interact with the platform</p>
      </div>
    );
  }

  return (
    <div className={`recent-activity ${className}`}>
      {!compact && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Recent Activity</h6>
          {onViewAll && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>View all activities</Tooltip>}
            >
              <button 
                onClick={onViewAll} 
                className="btn btn-link btn-sm text-decoration-none text-primary p-0"
              >
                View All <FaArrowRight size={12} className="ms-1" />
              </button>
            </OverlayTrigger>
          )}
        </div>
      )}

      <AnimatePresence>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="activity-list"
        >
          <ListGroup variant={compact ? 'flush' : undefined}>
            {displayItems.map((activity, index) => {
              const iconConfig = getActivityIcon(activity.type);
              const Icon = iconConfig.icon;
              const statusConfig = activity.status ? getActivityBadge(activity.status) : null;
              const timeAgo = activity.timestamp ? formatTime(activity.timestamp) : '';

              return (
                <motion.div
                  key={activity.id || index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                >
                  <ListGroup.Item 
                    className={`border-0 px-0 py-3 ${!compact ? 'border-bottom' : ''}`}
                    style={{ cursor: onItemClick ? 'pointer' : 'default' }}
                    onClick={() => onItemClick && onItemClick(activity)}
                  >
                    <div className="d-flex gap-3 align-items-start">
                      {/* Activity Icon / Avatar */}
                      {showAvatars && (
                        <div 
                          className="activity-icon-wrapper rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ 
                            width: compact ? '32px' : '40px',
                            height: compact ? '32px' : '40px',
                            background: iconConfig.bg,
                            color: iconConfig.color
                          }}
                        >
                          {activity.userAvatar ? (
                            <img 
                              src={activity.userAvatar} 
                              alt={activity.userName} 
                              className="rounded-circle w-100 h-100"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <Icon size={compact ? 14 : 18} />
                          )}
                        </div>
                      )}

                      {/* Activity Content */}
                      <div className="flex-grow-1 min-width-0">
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                          <div>
                            <p className={`mb-1 ${compact ? 'small' : ''}`}>
                              {activity.userName && (
                                <span className="fw-semibold">{activity.userName}</span>
                              )}
                              {activity.userName && ' '}
                              <span>{activity.description}</span>
                            </p>
                            {showTimestamps && timeAgo && (
                              <small className="text-muted d-flex align-items-center gap-1">
                                <FaClock size={10} />
                                <span>{timeAgo}</span>
                                {activity.location && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <FaMapMarkerAlt size={10} />
                                    <span>{activity.location}</span>
                                  </>
                                )}
                              </small>
                            )}
                          </div>

                          {/* Status Badge */}
                          {showBadges && statusConfig && (
                            <Badge 
                              bg={statusConfig.bg} 
                              className="px-2 py-1 rounded-pill flex-shrink-0"
                              style={{ fontSize: '10px' }}
                            >
                              {statusConfig.label}
                            </Badge>
                          )}
                        </div>

                        {/* Additional Info */}
                        {activity.details && (
                          <div className="mt-2">
                            <small className="text-muted">
                              <FaInfoCircle size={10} className="me-1" />
                              {activity.details}
                            </small>
                          </div>
                        )}

                        {/* Action Links */}
                        {activity.actionUrl && (
                          <div className="mt-1">
                            <a 
                              href={activity.actionUrl} 
                              className="small text-primary text-decoration-none"
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Details <FaArrowRight size={10} className="ms-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                </motion.div>
              );
            })}
          </ListGroup>
        </motion.div>
      </AnimatePresence>

      {/* Show more indicator */}
      {!showAll && activities.length > maxItems && (
        <div className="text-center mt-2">
          <button 
            onClick={onViewAll} 
            className="btn btn-link btn-sm text-decoration-none text-muted"
          >
            Show {activities.length - maxItems} more activities
          </button>
        </div>
      )}

      <style jsx="true">{`
        .recent-activity {
          max-height: ${compact ? '300px' : '500px'};
          overflow-y: auto;
        }
        .recent-activity::-webkit-scrollbar {
          width: 4px;
        }
        .recent-activity::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .recent-activity::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .recent-activity::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .activity-icon-wrapper {
          transition: transform 0.2s ease;
        }
        .activity-icon-wrapper:hover {
          transform: scale(1.1);
        }
        .min-width-0 {
          min-width: 0;
        }
        .list-group-item {
          transition: background 0.2s ease;
        }
        .list-group-item:hover {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
};

// Compact version for sidebars
export const CompactRecentActivity = (props) => {
  return <RecentActivity {...props} compact={true} maxItems={5} showAvatars={false} />;
};

// Timeline version with vertical line
export const TimelineActivity = ({ activities = [], loading = false, maxItems = 10 }) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" size="sm" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <p className="text-muted text-center small">No activity to show</p>;
  }

  const displayItems = activities.slice(0, maxItems);

  return (
    <div className="timeline-container">
      {displayItems.map((activity, index) => {
        const iconConfig = getActivityIcon(activity.type);
        const Icon = iconConfig.icon;
        
        return (
          <div key={activity.id || index} className="timeline-item">
            <div className="timeline-marker" style={{ background: iconConfig.color }}>
              <Icon size={12} color="white" />
            </div>
            <div className="timeline-content">
              <p className="mb-0 small">
                {activity.description}
              </p>
              <small className="text-muted">
                {activity.timestamp ? formatTime(activity.timestamp) : ''}
              </small>
            </div>
          </div>
        );
      })}
      
      <style jsx="true">{`
        .timeline-container {
          position: relative;
          padding-left: 30px;
        }
        .timeline-container::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e2e8f0;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
        }
        .timeline-marker {
          position: absolute;
          left: -24px;
          top: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 3px white;
        }
        .timeline-content {
          padding-left: 4px;
        }
      `}</style>
    </div>
  );
};

export default RecentActivity;