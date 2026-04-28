import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import MessageBubble from './MessageBubble';
import ChatList from './ChatList';

const ChatWindow = ({ chatId, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket, sendMessage, sendTyping, markMessagesRead } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      socket?.emit('join-chat', chatId);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatId]);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleUserTyping);
      socket.on('messages-read', handleMessagesRead);

      return () => {
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('messages-read');
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${chatId}/messages`);
      setMessages(response.data);
      
      // Mark unread messages as read
      const unreadIds = response.data
        .filter(m => !m.read && m.sender_id !== user.id)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        markMessagesRead({ chatId, messageIds: unreadIds });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    
    if (message.sender_id !== user.id) {
      markMessagesRead({ chatId, messageIds: [message.id] });
    }
  };

  const handleUserTyping = ({ userId, isTyping }) => {
    if (userId !== user.id) {
      setTyping(isTyping);
    }
  };

  const handleMessagesRead = ({ messageIds }) => {
    setMessages(prev => 
      prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      )
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      chatId,
      message: newMessage,
      receiverId: otherUser.id
    };

    sendMessage(messageData);
    setNewMessage('');

    // Stop typing indicator
    sendTyping({ chatId, isTyping: false });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTyping({ chatId, isTyping: true });

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping({ chatId, isTyping: false });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!chatId) {
    return (
      <Card className="h-100">
        <Card.Body className="d-flex align-items-center justify-content-center">
          <p className="text-muted">Select a conversation to start chatting</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="h-100">
      <Card.Header className="d-flex align-items-center">
        <img 
          src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}`}
          alt={otherUser.name}
          className="rounded-circle me-2"
          style={{ width: 40, height: 40, objectFit: 'cover' }}
        />
        <div>
          <h6 className="mb-0">{otherUser.name}</h6>
          <small className="text-muted">{otherUser.role}</small>
        </div>
      </Card.Header>

      <Card.Body style={{ height: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user.id}
                showAvatar={
                  index === 0 || 
                  messages[index - 1].sender_id !== message.sender_id
                }
              />
            ))}
            {typing && (
              <div className="text-muted small mt-2">
                <em>{otherUser.name} is typing...</em>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card.Body>

      <Card.Footer>
        <Form onSubmit={handleSendMessage}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleTyping}
            />
            <Button type="submit" variant="primary" disabled={!newMessage.trim()}>
              <FaPaperPlane />
            </Button>
          </InputGroup>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default ChatWindow;