// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create the context
const SocketContext = createContext(null);

// Custom hook - MUST be named useSocket and exported as a named export
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Integrated SocketService class with all features from both files
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.userId = null;
    this.isConnected = false;
  }

  getSocketUrl() {
    // Priority 1: Socket specific env
    if (import.meta.env.VITE_SOCKET_URL) {
      return import.meta.env.VITE_SOCKET_URL;
    }
    
    // Priority 2: API URL env (fallback)
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Priority 3: Production fallback (Render.com)
    if (import.meta.env.PROD) {
      return 'https://service-booking-3l1j.onrender.com';
    }
    
    // Priority 4: Same origin for production
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return window.location.origin;
    }
    
    // Priority 5: Local development
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
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user's room
      if (this.userId) {
        this.socket.emit('join-user', this.userId);
        console.log(`📡 Joined room: user-${this.userId}`);
      }
      
      onConnectionChange?.(true, this.socket.id);
      this.emitInternal('socket_connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnected = false;
      onConnectionChange?.(false, null, reason);
      this.emitInternal('socket_disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      this.reconnectAttempts++;
      this.isConnected = false;
      onConnectionChange?.(false, null, error.message);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        this.emitInternal('max_reconnect_attempts', { attempts: this.reconnectAttempts });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      onConnectionChange?.(true, this.socket.id);
      
      // Re-join user's room after reconnect
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

    // Connection timeout
    this.socket.on('connect_timeout', () => {
      console.warn('⏱️ Socket.IO connection timeout');
      this.isConnected = false;
      onConnectionChange?.(false, null, 'Connection timeout');
    });

    // General error
    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
      this.emitInternal('socket_error', error);
    });
  }

  // Internal event emitter for class-based listeners
  emitInternal(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.reconnectAttempts = 0;
      console.log('Socket.IO disconnected manually');
    }
  }

  // Chat methods
  sendMessage(recipientId, message, bookingId = null, senderName = '') {
    if (!this.socket || !this.isConnected) {
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
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('join-booking', bookingId);
    return true;
  }

  joinProviderRoom(providerId) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('join-provider', providerId);
    return true;
  }

  leaveRoom(roomName) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('leave-room', roomName);
    return true;
  }

  sendTyping(recipientId, bookingId, isTyping) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('typing', { recipientId, bookingId, isTyping });
    return true;
  }

  // Notification methods
  sendNotification(recipientId, message, type = 'info', bookingId = null) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('send-notification', {
      recipientId,
      message,
      type,
      bookingId
    });
    return true;
  }

  markNotificationRead(notificationId) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('mark-notification-read', { notificationId });
    return true;
  }

  sendBulkNotification(userIds, message, type = 'info', data = {}) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('send-bulk-notification', {
      userIds,
      type,
      message,
      notificationData: data
    });
    return true;
  }

  // Booking methods
  updateBookingStatus(bookingId, status) {
    if (!this.socket || !this.isConnected) return false;
    this.socket.emit('update-booking-status', { bookingId, status });
    return true;
  }

  // Generic event emitters
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      return false;
    }
    console.log(`📤 Emitting event: ${event}`, data);
    this.socket.emit(event, data);
    return true;
  }

  // Class-based event handling (for non-React usage)
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

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance for class-based usage
export const socketService = new SocketService();

// Provider component - MUST be exported as a named export
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const { user, token } = useAuth();

  // Connect to socket when user is authenticated
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

    // Define callback handlers
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
      // You can add additional handling here (toasts, etc.)
      console.log('💬 New message in context:', message);
    };

    const handleNewNotification = (notification) => {
      console.log('🔔 New notification in context:', notification);
      // You can show a toast notification here if desired
    };

    // Connect using the integrated service
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

    // Cleanup on unmount
    return () => {
      // Don't disconnect here if other components might still use it
      // The service will handle disconnection when user logs out
    };
  }, [user, token]);

  // Update user ID if it changes
  useEffect(() => {
    if (socketService.isConnected && user?.id && socketService.userId !== user.id) {
      console.log('🔄 User ID changed, rejoining room');
      socketService.userId = user.id;
      socketService.socket?.emit('join-user', user.id);
    }
  }, [user?.id]);

  // Socket event handlers wrapper for React components
  const emit = useCallback((event, data) => {
    return socketService.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
    return () => socketService.off(event, callback);
  }, []);

  // Convenience methods for common operations
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

  const value = {
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
    socketService // Expose the service for advanced use cases
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Default export for backward compatibility
export default SocketProvider;