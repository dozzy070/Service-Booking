import React from 'react';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';

const MessageBubble = ({ message, isOwn, showAvatar, senderAvatar, senderName }) => {
  const getStatusIcon = () => {
    if (!isOwn) return null;
    if (message.read) return <FaCheckDouble className="text-primary" size={12} />;
    return <FaCheck className="text-muted" size={12} />;
  };

  return (
    <div className={`d-flex mb-3 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
      {!isOwn && showAvatar && (
        <div className="me-2">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="rounded-circle"
              style={{ width: 32, height: 32, objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32 }}
            >
              <span className="text-white small">
                {senderName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={`p-3 rounded-3 ${
          isOwn
            ? 'bg-primary text-white'
            : 'bg-light text-dark'
        }`}
        style={{ maxWidth: '70%', wordWrap: 'break-word' }}
      >
        {!isOwn && showAvatar && (
          <small className="fw-bold mb-1 d-block text-muted">
            {senderName || 'User'}
          </small>
        )}

        <p className="mb-1">{message.message}</p>

        <div className={`d-flex align-items-center justify-content-end mt-1 ${
          isOwn ? 'text-white-50' : 'text-muted'
        }`}>
          <small className="me-1">
            {formatDate(message.created_at)}
          </small>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;