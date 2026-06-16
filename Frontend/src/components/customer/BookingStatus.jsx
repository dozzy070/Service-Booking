import React from 'react';
import { Badge, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaExclamationCircle,
  FaQuestionCircle,
  FaHourglassHalf,
  FaThumbsUp,
  FaRegClock,
  FaCheckDouble,
  FaUndo,
  FaBan
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const BookingStatus = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showTooltip = true,
  className = '',
  animated = true,
  showLabel = true,
  statusText = '',
  compact = false
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        variant: 'warning',
        icon: FaClock,
        label: 'Pending',
        description: 'Waiting for provider confirmation',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#f59e0b'
      },
      confirmed: {
        variant: 'info',
        icon: FaCheckCircle,
        label: 'Confirmed',
        description: 'Provider has confirmed your booking',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6'
      },
      accepted: {
        variant: 'info',
        icon: FaSpinner,
        label: 'Accepted',
        description: 'Provider has accepted your booking',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6'
      },
      in_progress: {
        variant: 'primary',
        icon: FaHourglassHalf,
        label: 'In Progress',
        description: 'Service is currently in progress',
        color: '#667eea',
        bgColor: 'rgba(102, 126, 234, 0.1)',
        borderColor: '#667eea'
      },
      completed: {
        variant: 'success',
        icon: FaCheckDouble,
        label: 'Completed',
        description: 'Service has been completed successfully',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981'
      },
      cancelled: {
        variant: 'danger',
        icon: FaTimesCircle,
        label: 'Cancelled',
        description: 'Booking has been cancelled',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444'
      },
      rejected: {
        variant: 'danger',
        icon: FaExclamationCircle,
        label: 'Rejected',
        description: 'Booking request was rejected by provider',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444'
      },
      rescheduled: {
        variant: 'warning',
        icon: FaUndo,
        label: 'Rescheduled',
        description: 'Booking has been rescheduled',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#f59e0b'
      },
      waiting: {
        variant: 'secondary',
        icon: FaRegClock,
        label: 'Waiting',
        description: 'Awaiting your action',
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        borderColor: '#6b7280'
      },
      unknown: {
        variant: 'secondary',
        icon: FaQuestionCircle,
        label: 'Unknown',
        description: 'Status information unavailable',
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        borderColor: '#6b7280'
      }
    };
    return configs[status] || configs.unknown;
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  // Get size-specific classes
  const getSizeClasses = () => {
    if (compact) {
      return 'px-1 py-1 small';
    }
    switch (size) {
      case 'sm':
        return 'px-2 py-1 small';
      case 'lg':
        return 'px-4 py-2 fs-6';
      default:
        return 'px-3 py-2';
    }
  };

  // Get animation variants
  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  };

  // Check if status should pulse (for pending/in_progress)
  const shouldPulse = ['pending', 'in_progress', 'waiting'].includes(status);

  const statusBadge = (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      variants={badgeVariants}
      transition={{ duration: 0.3 }}
      style={{ display: 'inline-block' }}
    >
      <Badge
        bg={config.variant}
        className={`d-inline-flex align-items-center gap-2 ${getSizeClasses()} ${className}`}
        pill
        style={{
          cursor: showTooltip ? 'help' : 'default',
          transition: 'all 0.3s ease',
          boxShadow: shouldPulse ? `0 0 0 0 ${config.color}` : 'none',
          animation: shouldPulse && animated ? 'pulse 2s infinite' : 'none'
        }}
      >
        {showIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {status === 'in_progress' && animated ? (
              <Spinner animation="border" size="sm" variant="light" />
            ) : (
              <Icon />
            )}
          </span>
        )}
        
        {!compact && (
          <span>{showLabel ? statusText || config.label : ''}</span>
        )}
        
        {compact && showIcon && (
          <span className="visually-hidden">{config.label}</span>
        )}
      </Badge>
    </motion.div>
  );

  // Extended tooltip with more information
  const renderTooltip = (props) => (
    <Tooltip id={`status-tooltip-${status}`} {...props}>
      <div className="text-center">
        <strong>{config.label}</strong>
        <div className="small text-muted">{config.description}</div>
        {statusText && <div className="small text-muted mt-1">"{statusText}"</div>}
      </div>
    </Tooltip>
  );

  // If no tooltip, return just the badge
  if (!showTooltip) {
    return statusBadge;
  }

  // Return with tooltip
  return (
    <OverlayTrigger
      placement="top"
      overlay={renderTooltip}
      delay={{ show: 250, hide: 100 }}
      popperConfig={{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ],
      }}
    >
      {statusBadge}
    </OverlayTrigger>
  );
};

// Status indicator dot component for minimal display
export const StatusDot = ({ status, size = 'md', className = '' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: '#f59e0b', label: 'Pending' },
      confirmed: { color: '#3b82f6', label: 'Confirmed' },
      accepted: { color: '#3b82f6', label: 'Accepted' },
      in_progress: { color: '#667eea', label: 'In Progress' },
      completed: { color: '#10b981', label: 'Completed' },
      cancelled: { color: '#ef4444', label: 'Cancelled' },
      rejected: { color: '#ef4444', label: 'Rejected' },
      rescheduled: { color: '#f59e0b', label: 'Rescheduled' },
      waiting: { color: '#6b7280', label: 'Waiting' },
      unknown: { color: '#6b7280', label: 'Unknown' }
    };
    return configs[status] || configs.unknown;
  };

  const config = getStatusConfig(status);
  const sizeMap = { sm: 8, md: 12, lg: 16 };
  const dotSize = sizeMap[size] || 12;

  return (
    <span
      className={`status-dot ${className}`}
      style={{
        display: 'inline-block',
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: config.color,
        transition: 'all 0.3s ease'
      }}
      title={config.label}
    />
  );
};

// Status text component without badge
export const StatusText = ({ status, className = '' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'Pending', color: '#f59e0b' },
      confirmed: { label: 'Confirmed', color: '#3b82f6' },
      accepted: { label: 'Accepted', color: '#3b82f6' },
      in_progress: { label: 'In Progress', color: '#667eea' },
      completed: { label: 'Completed', color: '#10b981' },
      cancelled: { label: 'Cancelled', color: '#ef4444' },
      rejected: { label: 'Rejected', color: '#ef4444' },
      rescheduled: { label: 'Rescheduled', color: '#f59e0b' },
      waiting: { label: 'Waiting', color: '#6b7280' },
      unknown: { label: 'Unknown', color: '#6b7280' }
    };
    return configs[status] || configs.unknown;
  };

  const config = getStatusConfig(status);

  return (
    <span className={`fw-semibold ${className}`} style={{ color: config.color }}>
      {config.label}
    </span>
  );
};

export default BookingStatus;