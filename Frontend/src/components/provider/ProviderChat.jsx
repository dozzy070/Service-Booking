// src/components/provider/ProviderChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Badge,
  Spinner,
  Alert
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  User,
  Clock,
  CheckCheck,
  Image,
  Paperclip,
  Smile,
  ArrowLeft,
  Users,
  Star,
  Calendar,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  PhoneCall,
  VideoIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatAPI } from '../../api/api';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ProviderChat = () => {
  const { user } = useAuth();
  const { socket, isConnected, sendMessage: sendSocketMessage, sendTyping, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  
  // Refs for polling
  const pollingInterval = useRef(null);
  const isPolling = useRef(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Format currency to NGN
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Helper to get field with fallback
  const getField = (obj, fields, fallback = '') => {
    for (const field of fields) {
      if (obj?.[field]) return obj[field];
    }
    return fallback;
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations from real API
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (!chatAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof chatAPI.getConversations === 'function') {
        response = await chatAPI.getConversations();
      } else if (typeof chatAPI.getChats === 'function') {
        response = await chatAPI.getChats();
      } else {
        throw new Error('Conversations API methods not available');
      }

      const data = response?.data || [];
      setChats(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError(error.message || 'Failed to load conversations');
      setChats([]);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Failed to load conversations');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Fetch messages for selected conversation from real API
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      if (!chatAPI) {
        throw new Error('API service not available');
      }

      let response = null;
      
      if (typeof chatAPI.getMessages === 'function') {
        response = await chatAPI.getMessages(conversationId);
      } else if (typeof chatAPI.getChatHistory === 'function') {
        response = await chatAPI.getChatHistory(conversationId);
      } else {
        throw new Error('Messages API methods not available');
      }

      const data = response?.data || [];
      setSelectedChat(prev => ({
        ...prev,
        messages: Array.isArray(data) ? data : []
      }));
      scrollToBottom();
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  // Mark messages as read with real API
  const markAsRead = useCallback(async (conversationId, messageIds) => {
    if (!conversationId || !messageIds || messageIds.length === 0) return;
    
    try {
      if (!chatAPI) {
        throw new Error('API service not available');
      }

      const payload = { message_ids: messageIds };
      
      if (typeof chatAPI.markMessagesAsRead === 'function') {
        await chatAPI.markMessagesAsRead(conversationId, payload);
      } else if (typeof chatAPI.markAsRead === 'function') {
        await chatAPI.markAsRead(conversationId, payload);
      } else {
        throw new Error('Mark as read API methods not available');
      }
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Polling for real-time updates
  useEffect(() => {
    const startPolling = () => {
      stopPolling();
      pollingInterval.current = setInterval(() => {
        if (!isPolling.current) {
          isPolling.current = true;
          fetchConversations(false).finally(() => {
            isPolling.current = false;
          });
        }
      }, 30000); // Poll every 30 seconds
    };

    const stopPolling = () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      isPolling.current = false;
    };

    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [fetchConversations]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (!message) return;
      
      setSelectedChat(prev => {
        if (prev && prev.id === message.conversation_id) {
          return {
            ...prev,
            messages: [...(prev.messages || []), message],
            lastMessage: message.message,
            lastMessageTime: message.created_at
          };
        }
        return prev;
      });
      
      setChats(prev => prev.map(chat => {
        if (chat.id === message.conversation_id) {
          return {
            ...chat,
            lastMessage: message.message,
            lastMessageTime: message.created_at,
            unreadCount: chat.id === selectedChat?.id ? 0 : (chat.unreadCount || 0) + 1
          };
        }
        return chat;
      }));
      
      scrollToBottom();
    };

    const handleUserTyping = ({ conversationId, userId, isTyping }) => {
      if (conversationId === selectedChat?.id && userId !== user?.id) {
        setTyping(isTyping);
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, selectedChat, user]);

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    const otherPartyId = selectedChat?.other_party_id || selectedChat?.customer_id;
    const bookingId = selectedChat?.booking_id || selectedChat?.bookingId;
    
    if (otherPartyId) {
      sendTyping(otherPartyId, bookingId, true);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (otherPartyId) {
        sendTyping(otherPartyId, bookingId, false);
      }
    }, 1000);
  };

  // Send message with real API
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    
    setSending(true);
    const messageText = message.trim();
    setMessage('');
    
    const otherPartyId = selectedChat.other_party_id || selectedChat.customer_id;
    const bookingId = selectedChat.booking_id || selectedChat.bookingId;
    const senderName = user?.name || 'Provider';
    
    // Send via socket for real-time
    const sent = sendSocketMessage(
      otherPartyId,
      messageText,
      bookingId,
      senderName
    );
    
    if (!sent) {
      // Fallback to API if socket fails
      try {
        if (!chatAPI) {
          throw new Error('API service not available');
        }

        const conversationId = selectedChat.id || selectedChat.conversation_id;
        const payload = {
          message: messageText,
          recipient_id: otherPartyId,
          booking_id: bookingId
        };

        if (typeof chatAPI.sendMessage === 'function') {
          await chatAPI.sendMessage(conversationId, payload);
        } else if (typeof chatAPI.sendChatMessage === 'function') {
          await chatAPI.sendChatMessage(conversationId, payload);
        } else {
          throw new Error('Send message API methods not available');
        }
        
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error(error.message || 'Failed to send message');
        setMessage(messageText); // Restore message on failure
      }
    }
    
    setSending(false);
    scrollToBottom();
  };

  // Select conversation
  const handleSelectChat = async (chat) => {
    if (!chat) return;
    
    setSelectedChat(chat);
    setTyping(false);
    await fetchMessages(chat.id || chat.conversation_id);
    
    // Mark unread messages as read
    const unreadMessages = (chat.messages || []).filter(
      m => !m.is_read && m.sender_id !== user?.id
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m.id || m._id).filter(Boolean);
      markAsRead(chat.id || chat.conversation_id, messageIds);
      setChats(prev => prev.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  };

  // Get online status
  const isUserOnline = (userId) => {
    return onlineUsers && onlineUsers.includes(userId);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) {
      return (
        <Badge bg="secondary" className="d-inline-flex align-items-center gap-1 px-2 py-1">
          <ClockIcon size={10} />
          <span className="ms-1">Unknown</span>
        </Badge>
      );
    }
    
    const lowerStatus = status.toLowerCase();
    const statusConfig = {
      pending: { variant: 'warning', icon: ClockIcon, text: 'Pending' },
      confirmed: { variant: 'info', icon: CheckCircle, text: 'Confirmed' },
      accepted: { variant: 'info', icon: CheckCircle, text: 'Accepted' },
      in_progress: { variant: 'primary', icon: ClockIcon, text: 'In Progress' },
      completed: { variant: 'success', icon: CheckCircle, text: 'Completed' },
      cancelled: { variant: 'danger', icon: XCircle, text: 'Cancelled' },
      rejected: { variant: 'danger', icon: XCircle, text: 'Rejected' }
    };
    const config = statusConfig[lowerStatus] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge bg={config.variant} className="d-inline-flex align-items-center gap-1 px-2 py-1">
        <Icon size={10} />
        <span className="ms-1">{config.text}</span>
      </Badge>
    );
  };

  // Filter chats by search
  const filteredChats = chats.filter(chat => {
    const customerName = getField(chat, ['customer_name', 'customer.name', 'customerName', 'customer'], '');
    const serviceName = getField(chat, ['service_name', 'service.title', 'serviceName', 'title'], '');
    const search = searchTerm.toLowerCase();
    return customerName.toLowerCase().includes(search) || serviceName.toLowerCase().includes(search);
  });

  // Loading state removed - component renders immediately with empty data
  // Data loads in background via useEffect

  return (
    <div style={{ background: '#f8f9fa', height: 'calc(100vh - 60px)' }}>
      <Container fluid className="h-100 py-3">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px' }}>
              <Users size={18} className="me-2" />
              {error}
              <Button variant="outline-danger" size="sm" onClick={() => fetchConversations(false)} className="ms-3">
                Retry
              </Button>
            </Alert>
          </Alert>
        )}

        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Card.Body className="p-0 h-100">
            <Row className="h-100 g-0">
              {/* Chat List Sidebar */}
              <Col lg={4} xl={3} className="border-end" style={{ background: 'white' }}>
                <div className="p-3 border-bottom">
                  <h5 className="fw-bold mb-3">Messages</h5>
                  <div className="position-relative">
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <Form.Control
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '38px', borderRadius: '12px' }}
                    />
                  </div>
                </div>
                
                <div style={{ height: 'calc(100% - 80px)', overflowY: 'auto' }}>
                  {filteredChats.length === 0 ? (
                    <div className="text-center py-5">
                      <Users size={48} className="text-muted mb-3 opacity-50" />
                      <p className="text-muted mb-0">No conversations yet</p>
                      <small className="text-muted">Messages will appear here</small>
                    </div>
                  ) : (
                    filteredChats.map(chat => {
                      const chatId = chat.id || chat.conversation_id;
                      const customerName = getField(chat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown');
                      const serviceName = getField(chat, ['service_name', 'service.title', 'serviceName', 'title'], '');
                      const otherPartyId = chat.other_party_id || chat.customer_id;
                      const lastMessage = getField(chat, ['lastMessage', 'last_message', 'lastMessageText'], 'No messages yet');
                      const lastMessageTime = chat.lastMessageTime || chat.last_message_time || chat.updated_at;
                      const unreadCount = chat.unreadCount || chat.unread_count || 0;
                      const bookingStatus = getField(chat, ['booking_status', 'status', 'bookingStatus'], '');

                      return (
                        <div
                          key={chatId}
                          className={`chat-list-item ${selectedChat?.id === chatId ? 'active' : ''}`}
                          onClick={() => handleSelectChat(chat)}
                        >
                          <div className="d-flex gap-3">
                            <div className="position-relative">
                              <div className="chat-avatar">
                                {customerName.charAt(0).toUpperCase()}
                              </div>
                              {isUserOnline(otherPartyId) && (
                                <div className="online-dot"></div>
                              )}
                            </div>
                            <div className="flex-grow-1 min-width-0">
                              <div className="d-flex justify-content-between align-items-start">
                                <h6 className="mb-1 text-truncate">{customerName}</h6>
                                <small className="text-muted flex-shrink-0">
                                  {lastMessageTime && formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true })}
                                </small>
                              </div>
                              <p className="mb-1 small text-muted text-truncate">{lastMessage}</p>
                              <div className="d-flex gap-2">
                                {serviceName && (
                                  <small className="text-muted">{serviceName}</small>
                                )}
                                {bookingStatus && getStatusBadge(bookingStatus)}
                              </div>
                            </div>
                            {unreadCount > 0 && (
                              <Badge bg="success" pill className="unread-badge">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Col>

              {/* Chat Area */}
              <Col lg={8} xl={9} className="d-flex flex-column" style={{ background: '#f8f9fa' }}>
                {selectedChat ? (
                  <>
                    {/* Chat Header */}
                    <div className="chat-header">
                      <div className="d-flex align-items-center gap-3">
                        <Button
                          variant="light"
                          size="sm"
                          className="d-lg-none"
                          onClick={() => setSelectedChat(null)}
                        >
                          <ArrowLeft size={18} />
                        </Button>
                        <div className="position-relative">
                          <div className="chat-avatar-sm">
                            {getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'C').charAt(0).toUpperCase()}
                          </div>
                          {isUserOnline(selectedChat.other_party_id || selectedChat.customer_id) && (
                            <div className="online-dot-sm"></div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-0">{getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown')}</h6>
                          <small className="text-muted">
                            {isUserOnline(selectedChat.other_party_id || selectedChat.customer_id) ? 'Online' : 'Offline'}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="action-btn"
                          onClick={() => setShowCallModal(true)}
                        >
                          <Phone size={18} />
                        </Button>
                        <Button variant="light" size="sm" className="action-btn">
                          <Video size={18} />
                        </Button>
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="action-btn"
                          onClick={() => setShowInfo(!showInfo)}
                        >
                          <MoreVertical size={18} />
                        </Button>
                      </div>
                    </div>

                    {/* Booking Info Panel */}
                    {showInfo && (selectedChat.booking_id || selectedChat.bookingId) && (
                      <div className="booking-info-panel">
                        <Row className="g-3">
                          <Col sm={6}>
                            <div className="d-flex align-items-center gap-2">
                              <Calendar size={16} className="text-primary" />
                              <div>
                                <small className="text-muted d-block">Booking Date</small>
                                <span className="small fw-medium">
                                  {selectedChat.booking_date ? format(new Date(selectedChat.booking_date), 'MMM dd, yyyy') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="d-flex align-items-center gap-2">
                              <ClockIcon size={16} className="text-primary" />
                              <div>
                                <small className="text-muted d-block">Time</small>
                                <span className="small fw-medium">
                                  {selectedChat.booking_time || selectedChat.start_time || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="d-flex align-items-center gap-2">
                              <DollarSign size={16} className="text-primary" />
                              <div>
                                <small className="text-muted d-block">Amount</small>
                                <span className="small fw-medium">
                                  {formatNaira(selectedChat.booking_amount || selectedChat.amount || 0)}
                                </span>
                              </div>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="d-flex align-items-center gap-2">
                              <MapPin size={16} className="text-primary" />
                              <div>
                                <small className="text-muted d-block">Location</small>
                                <span className="small fw-medium text-truncate">
                                  {getField(selectedChat, ['location', 'service_location', 'address'], 'Not specified')}
                                </span>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* Messages Area */}
                    <div className="messages-area">
                      {(selectedChat.messages || []).length === 0 ? (
                        <div className="text-center py-5">
                          <div className="empty-chat-icon mb-3">
                            💬
                          </div>
                          <h6 className="text-muted">No messages yet</h6>
                          <p className="text-muted small">Send a message to start the conversation</p>
                        </div>
                      ) : (
                        (selectedChat.messages || []).map((msg, idx) => {
                          const isMine = msg.sender_id === user?.id;
                          const showAvatar = idx === 0 || (selectedChat.messages || [])[idx - 1]?.sender_id !== msg.sender_id;
                          const messageId = msg.id || msg._id;
                          const messageText = msg.message || msg.text || msg.content || '';
                          const createdAt = msg.created_at || msg.timestamp || msg.sent_at || new Date().toISOString();
                          const isRead = msg.is_read || msg.read || false;
                          
                          return (
                            <div
                              key={messageId}
                              className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'} mb-3`}
                            >
                              {!isMine && showAvatar && (
                                <div className="message-avatar me-2">
                                  {getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'C').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={`message-bubble ${isMine ? 'message-mine' : 'message-theirs'}`}>
                                <p className="mb-1">{messageText}</p>
                                <div className="d-flex justify-content-end align-items-center gap-1 mt-1">
                                  <small className="message-time">{format(new Date(createdAt), 'hh:mm a')}</small>
                                  {isMine && isRead && <CheckCheck size={12} className="text-success" />}
                                  {isMine && !isRead && <CheckCheck size={12} className="text-muted" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {typing && (
                        <div className="d-flex justify-content-start mb-3">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Connection Status */}
                    {!isConnected && (
                      <Alert variant="warning" className="mx-3 mb-0" style={{ borderRadius: '10px' }}>
                        <small>Reconnecting to chat server...</small>
                      </Alert>
                    )}

                    {/* Message Input */}
                    <div className="message-input-container">
                      <div className="d-flex gap-2">
                        <Button variant="light" className="attachment-btn">
                          <Paperclip size={18} />
                        </Button>
                        <Button variant="light" className="attachment-btn">
                          <Image size={18} />
                        </Button>
                        <Form.Control
                          type="text"
                          placeholder={isConnected ? "Type a message..." : "Connecting..."}
                          value={message}
                          onChange={handleTyping}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          disabled={!isConnected || sending}
                          className="message-input"
                        />
                        <Button
                          variant="success"
                          onClick={handleSendMessage}
                          disabled={!message.trim() || !isConnected || sending}
                          className="send-btn"
                        >
                          {sending ? (
                            <Spinner as="span" animation="border" size="sm" />
                          ) : (
                            <Send size={18} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                    <div className="empty-state-icon mb-4">
                      💬
                    </div>
                    <h5 className="mb-2">Select a conversation</h5>
                    <p className="text-muted mb-0">Choose a customer to start chatting</p>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      {/* Call Modal */}
      <div className={`call-modal ${showCallModal ? 'show' : ''}`} onClick={() => setShowCallModal(false)}>
        <div className="call-modal-content" onClick={(e) => e.stopPropagation()}>
          {!isCallActive ? (
            <>
              <div className="text-center mb-4">
                <div className="call-avatar mx-auto mb-3">
                  {getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'C').charAt(0).toUpperCase()}
                </div>
                <h5 className="mb-1">{getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown')}</h5>
                <small className="text-muted">Audio Call</small>
              </div>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="danger" className="call-btn" onClick={() => setShowCallModal(false)}>
                  <Phone size={24} />
                </Button>
                <Button variant="success" className="call-btn" onClick={() => {
                  setIsCallActive(true);
                  toast.success('Call initiated...');
                }}>
                  <PhoneCall size={24} />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="call-avatar mx-auto mb-3">
                  {getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'C').charAt(0).toUpperCase()}
                </div>
                <h5 className="mb-1">Call in progress</h5>
                <small className="text-muted">{getField(selectedChat, ['customer_name', 'customer.name', 'customerName', 'customer'], 'Unknown')}</small>
                <div className="call-timer mt-2">00:00</div>
              </div>
              <div className="d-flex justify-content-center gap-3">
                <Button 
                  variant={isMuted ? 'warning' : 'light'} 
                  className="call-control-btn"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>
                <Button 
                  variant={isSpeakerOn ? 'primary' : 'light'} 
                  className="call-control-btn"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                >
                  {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </Button>
                <Button variant="danger" className="call-control-btn" onClick={() => {
                  setIsCallActive(false);
                  setShowCallModal(false);
                  toast.success('Call ended');
                }}>
                  <Phone size={20} />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .chat-list-item {
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #e2e8f0;
        }
        .chat-list-item:hover {
          background: #f8fafc;
        }
        .chat-list-item.active {
          background: #f1f5f9;
        }
        .chat-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .chat-avatar-sm {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .online-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          position: absolute;
          bottom: 0;
          right: 0;
        }
        .online-dot-sm {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid white;
          position: absolute;
          bottom: 0;
          right: 0;
        }
        .unread-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 10px;
          padding: 2px 6px;
        }
        .chat-header {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .booking-info-panel {
          padding: 15px 20px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .message-bubble {
          max-width: 70%;
          padding: 10px 15px;
          border-radius: 18px;
          position: relative;
        }
        .message-mine {
          background: #10b981;
          color: white;
          border-bottom-right-radius: 4px;
        }
        .message-theirs {
          background: white;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .message-time {
          font-size: 10px;
          opacity: 0.7;
        }
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          flex-shrink: 0;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 10px 15px;
          background: white;
          border-radius: 18px;
          width: fit-content;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        .message-input-container {
          padding: 15px 20px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }
        .message-input {
          border-radius: 25px;
          padding: 10px 15px;
        }
        .attachment-btn, .send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .send-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
        }
        .send-btn:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }
        .empty-state-icon, .empty-chat-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto;
        }
        .call-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .call-modal.show {
          opacity: 1;
          visibility: visible;
        }
        .call-modal-content {
          background: white;
          border-radius: 24px;
          padding: 30px;
          width: 320px;
          text-align: center;
        }
        .call-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 32px;
        }
        .call-btn, .call-control-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .call-timer {
          font-family: monospace;
          font-size: 24px;
          font-weight: bold;
        }
        .min-width-0 {
          min-width: 0;
        }
        @media (max-width: 992px) {
          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProviderChat;