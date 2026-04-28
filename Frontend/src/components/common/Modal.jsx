import React from 'react';
import { Modal as BootstrapModal, Button } from 'react-bootstrap';

const Modal = ({
  show,
  onHide,
  title,
  children,
  size = 'md',
  centered = true,
  backdrop = 'static',
  footer,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  showConfirm = true,
  showCancel = true,
  className = '',
  ...props
}) => {
  return (
    <BootstrapModal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      className={className}
      {...props}
    >
      {title && (
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title>{title}</BootstrapModal.Title>
        </BootstrapModal.Header>
      )}

      <BootstrapModal.Body>
        {children}
      </BootstrapModal.Body>

      {(footer || showConfirm || showCancel) && (
        <BootstrapModal.Footer>
          {footer || (
            <>
              {showCancel && (
                <Button variant={cancelVariant} onClick={onHide}>
                  {cancelText}
                </Button>
              )}
              {showConfirm && (
                <Button variant={confirmVariant} onClick={onConfirm}>
                  {confirmText}
                </Button>
              )}
            </>
          )}
        </BootstrapModal.Footer>
      )}
    </BootstrapModal>
  );
};

export default Modal;