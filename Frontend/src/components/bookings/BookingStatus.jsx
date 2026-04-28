import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaExclamationCircle
} from 'react-icons/fa';

const BookingStatus = ({ status, size = 'md', showIcon = true, className = '' }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        variant: 'warning',
        icon: FaClock,
        label: 'Pending',
        description: 'Waiting for provider confirmation'
      },
      accepted: {
        variant: 'info',
        icon: FaSpinner,
        label: 'Accepted',
        description: 'Provider has accepted your booking'
      },
      completed: {
        variant: 'success',
        icon: FaCheckCircle,
        label: 'Completed',
        description: 'Service has been completed'
      },
      cancelled: {
        variant: 'danger',
        icon: FaTimesCircle,
        label: 'Cancelled',
        description: 'Booking has been cancelled'
      },
      rejected: {
        variant: 'danger',
        icon: FaExclamationCircle,
        label: 'Rejected',
        description: 'Booking request was rejected'
      }
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const statusBadge = (
    <Badge 
      bg={config.variant} 
      className={`d-inline-flex align-items-center ${className} ${
        size === 'sm' ? 'px-2 py-1 small' : 'px-3 py-2'
      }`}
      pill
    >
      {showIcon && <Icon className={`${size === 'sm' ? 'me-1' : 'me-2'}`} />}
      {config.label}
    </Badge>
  );

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{config.description}</Tooltip>}
    >
      {statusBadge}
    </OverlayTrigger>
  );
};

export default BookingStatus;