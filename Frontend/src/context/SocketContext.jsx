// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create the context
const SocketContext = createContext(null);

// =========================================================================
// CUSTOM HOOK - ALWAYS CALLED AT TOP LEVEL
// =========================================================================

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// =========================================================================
// SOCKET SERVICE CLASS - FIXED
// =========================================================================

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.userId = null;
    // ✅ FIXED: Use a different property name or remove the setter conflict
    this._isConnected = false; // Use underscore for internal state
  }

  getSocketUrl() {
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    if (import.meta.env.PROD) {
      return 'https://service-booking-3l1j.onrender.com';
    }
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return window.location.origin;
    }
    return 'http://localhost:5000';
  }

  connect(token, userId, onConnectionChange, onOnlineUsers, onNewMessage, onNewNotification) {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return this.socket;
    }

    const socketUrl = this.getSocketUrl();
    console.log('🔌 Connecting to Socket.IO server:', socketUrl);

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
      query: { userId },
      path: '/socket.io/',
      forceNew: false,
      multiplex: true,
    });

    this.userId = userId;
    this.setupEventHandlers(onConnectionChange, onOnlineUsers, onNewMessage, onNewNotification);
    
    return this.socket;
  }

  setupEventHandlers(onConnectionChange, onOnlineUsers, onNewMessage, onNewNotification) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
      // ✅ FIXED: Use _isConnected instead of isConnected
      this._isConnected = true;
      this.reconnectAttempts = 0;
      
      if (this.userId) {
        this.socket.emit('join-user', this.userId);
        console.log(`📡 Joined room: user-${this.userId}`);
      }
      
      onConnectionChange?.(true, this.socket.id);
      this.emitInternal('socket_connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      // ✅ FIXED: Use _isConnected instead of isConnected
      this._isConnected = false;
      onConnectionChange?.(false, null, reason);
      this.emitInternal('socket_disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      this.reconnectAttempts++;
      // ✅ FIXED: Use _isConnected instead of isConnected
      this._isConnected = false;
      onConnectionChange?.(false, null, error.message);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        this.emitInternal('max_reconnect_attempts', { attempts: this.reconnectAttempts });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
      // ✅ FIXED: Use _isConnected instead of isConnected
      this._isConnected = true;
      onConnectionChange?.(true, this.socket.id);
      
      if (this.userId) {
        this.socket.emit('join-user', this.userId);
      }
    });

    // Message events
    this.socket.on('new-message', (message) => {
      console.log('💬 New message received:', message);
      onNewMessage?.(message);
      this.emitInternal('message_received', message);
    });

    this.socket.on('message-sent', (data) => {
      console.log('📤 Message sent confirmation:', data);
      this.emitInternal('message_sent', data);
    });

    // Notification events
    this.socket.on('new-notification', (notification) => {
      console.log('🔔 New notification:', notification);
      onNewNotification?.(notification);
      this.emitInternal('notification_received', notification);
    });

    this.socket.on('notification-read-ack', (data) => {
      this.emitInternal('notification_read', data);
    });

    // User status events
    this.socket.on('online-users', (users) => {
      console.log('👥 Online users updated:', users.length);
      onOnlineUsers?.(users);
      this.emitInternal('online_users_updated', users);
    });

    this.socket.on('user-typing', (data) => {
      this.emitInternal('user_typing', data);
    });

    // Booking events
    this.socket.on('booking-update', (data) => {
      console.log('📅 Booking update:', data);
      this.emitInternal('booking_updated', data);
    });

    this.socket.on('booking-message', (data) => {
      this.emitInternal('booking_message', data);
    });

    this.socket.on('connect_timeout', () => {
      console.warn('⏱️ Socket.IO connection timeout');
      // ✅ FIXED: Use _isConnected instead of isConnected
      this._isConnected = false;
      onConnectionChange?.(false, null, 'Connection timeout');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
      this.emitInternal('socket_error', error);
    });
  }

  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      // ✅ FIXED: Use _isConnected instead of isConnected
      this._isConnected = false;
      this.userId = null;
      this.reconnectAttempts = 0;
      console.log('Socket.IO disconnected manually');
    }
  }

  sendMessage(recipientId, message, bookingId = null, senderName = '') {
    if (!this.socket || !this._isConnected) {
      console.warn('⚠️ Cannot send message: socket not connected');
      return false;
    }
    
    this.socket.emit('send-message', {
      recipientId,
      message,
      bookingId,
      senderName
    });
    return true;
  }

  joinBookingRoom(bookingId) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('join-booking', bookingId);
    return true;
  }

  joinProviderRoom(providerId) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('join-provider', providerId);
    return true;
  }

  leaveRoom(roomName) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('leave-room', roomName);
    return true;
  }

  sendTyping(recipientId, bookingId, isTyping) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('typing', { recipientId, bookingId, isTyping });
    return true;
  }

  sendNotification(recipientId, message, type = 'info', bookingId = null) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('send-notification', {
      recipientId,
      message,
      type,
      bookingId
    });
    return true;
  }

  markNotificationRead(notificationId) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('mark-notification-read', { notificationId });
    return true;
  }

  sendBulkNotification(userIds, message, type = 'info', data = {}) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('send-bulk-notification', {
      userIds,
      type,
      message,
      notificationData: data
    });
    return true;
  }

  updateBookingStatus(bookingId, status) {
    if (!this.socket || !this._isConnected) return false;
    this.socket.emit('update-booking-status', { bookingId, status });
    return true;
  }

  emit(event, data) {
    if (!this.socket || !this._isConnected) {
      console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      return false;
    }
    console.log(`📤 Emitting event: ${event}`, data);
    this.socket.emit(event, data);
    return true;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  getConnectionStatus() {
    return {
      // ✅ FIXED: Use _isConnected instead of isConnected
      isConnected: this._isConnected,
      socketId: this.socket?.id || null,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // ✅ FIXED: Keep the getter but use it to return the internal state
  get isConnected() {
    return this._isConnected;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// =========================================================================
// SOCKET PROVIDER
// =========================================================================

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        console.log('🔌 No user/token, disconnecting socket');
        socketService.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setSocketId(null);
        setOnlineUsers([]);
      }
      return;
    }

    console.log('🔌 Setting up socket connection for user:', user.id);

    const handleConnectionChange = (connected, id, error = null) => {
      setIsConnected(connected);
      setSocketId(id || null);
      if (connected) {
        console.log('✅ Socket connected with ID:', id);
      } else if (error) {
        console.error('❌ Socket connection failed:', error);
      }
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleNewMessage = (message) => {
      console.log('💬 New message in context:', message);
    };

    const handleNewNotification = (notification) => {
      console.log('🔔 New notification in context:', notification);
    };

    const newSocket = socketService.connect(
      token,
      user.id,
      handleConnectionChange,
      handleOnlineUsers,
      handleNewMessage,
      handleNewNotification
    );

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      // Cleanup if needed
    };
  }, [user, token]);

  useEffect(() => {
    if (socketService.isConnected && user?.id && socketService.userId !== user.id) {
      console.log('🔄 User ID changed, rejoining room');
      socketService.userId = user.id;
      socketService.socket?.emit('join-user', user.id);
    }
  }, [user?.id]);

  const emit = useCallback((event, data) => {
    return socketService.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
    return () => socketService.off(event, callback);
  }, []);

  const sendMessage = useCallback((recipientId, message, bookingId = null, senderName = '') => {
    return socketService.sendMessage(recipientId, message, bookingId, senderName);
  }, []);

  const sendNotification = useCallback((recipientId, message, type = 'info', bookingId = null) => {
    return socketService.sendNotification(recipientId, message, type, bookingId);
  }, []);

  const joinBookingRoom = useCallback((bookingId) => {
    return socketService.joinBookingRoom(bookingId);
  }, []);

  const joinProviderRoom = useCallback((providerId) => {
    return socketService.joinProviderRoom(providerId);
  }, []);

  const sendTyping = useCallback((recipientId, bookingId, isTyping) => {
    return socketService.sendTyping(recipientId, bookingId, isTyping);
  }, []);

  const updateBookingStatus = useCallback((bookingId, status) => {
    return socketService.updateBookingStatus(bookingId, status);
  }, []);

  const sendBulkNotification = useCallback((userIds, message, type = 'info', data = {}) => {
    return socketService.sendBulkNotification(userIds, message, type, data);
  }, []);

  const value = useMemo(() => ({
    socket,
    onlineUsers,
    isConnected,
    socketId,
    emit,
    on,
    sendMessage,
    sendNotification,
    joinBookingRoom,
    joinProviderRoom,
    sendTyping,
    updateBookingStatus,
    sendBulkNotification,
    getConnectionStatus: () => socketService.getConnectionStatus(),
    socketService
  }), [
    socket,
    onlineUsers,
    isConnected,
    socketId,
    emit,
    on,
    sendMessage,
    sendNotification,
    joinBookingRoom,
    joinProviderRoom,
    sendTyping,
    updateBookingStatus,
    sendBulkNotification
  ]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;