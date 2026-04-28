import React, { useState, useEffect } from 'react';
import { Alert as BootstrapAlert } from 'react-bootstrap';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

const Alert = ({
  variant = 'info',
  message,
  dismissible = true,
  onClose,
  icon,
  className = '',
  ...props
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
  }, [message]);

  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'success':
        return <FaCheckCircle className="me-2" />;
      case 'danger':
        return <FaExclamationCircle className="me-2" />;
      case 'warning':
        return <FaExclamationTriangle className="me-2" />;
      case 'info':
      default:
        return <FaInfoCircle className="me-2" />;
    }
  };

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  if (!show || !message) return null;

  return (
    <BootstrapAlert
      variant={variant}
      onClose={handleClose}
      dismissible={dismissible}
      className={`d-flex align-items-center ${className}`}
      {...props}
    >
      <div className="d-flex align-items-center w-100">
        {getIcon()}
        <div className="flex-grow-1">{message}</div>
      </div>
    </BootstrapAlert>
  );
};

export default Alert;