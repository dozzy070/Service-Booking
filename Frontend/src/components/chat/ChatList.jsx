import React from 'react';
import { ListGroup, Badge, Spinner } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';

const ChatList = ({ chats, activeChat, onSelectChat, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" size="sm" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted mb-0">No chats found</p>
      </div>
    );
  }

  return (
    <ListGroup variant="flush">
      {chats.map(chat => (
        <ListGroup.Item
          key={chat.id}
          action
          active={activeChat?.id === chat.id}
          onClick={() => onSelectChat(chat)}
          className="py-3 border-0 border-bottom"
        >
          <div className="d-flex">
            <div className="position-relative me-3">
              {chat.other_user_avatar ? (
                <img
                  src={chat.other_user_avatar}
                  alt={chat.other_user_name}
                  className="rounded-circle"
                  style={{ width: 48, height: 48, objectFit: 'cover' }}
                />
              ) : (
                <FaUserCircle size={48} className="text-secondary" />
              )}
            </div>

            <div className="flex-grow-1 min-width-0">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="mb-0 text-truncate">
                  {chat.other_user_name || 'User'}
                </h6>
                {chat.unread_count > 0 && (
                  <Badge bg="primary" pill className="ms-2">
                    {chat.unread_count}
                  </Badge>
                )}
              </div>
              <p className="text-muted small mb-0 text-truncate" 
                 style={{ maxWidth: '150px' }}>
                {chat.last_message || 'No messages yet'}
              </p>
            </div>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default ChatList;