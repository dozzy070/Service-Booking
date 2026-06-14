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

// Provider component - MUST be exported as a named export
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const { user, token } = useAuth();

  // Get socket URL from environment with fallbacks
  const getSocketUrl = () => {
    // Priority 1: Environment variable
    if (import.meta.env.VITE_API_URL) {
      console.log('🔌 Using VITE_API_URL:', import.meta.env.VITE_API_URL);
      return import.meta.env.VITE_API_URL;
    }
    
    // Priority 2: Same origin for production
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.log('🔌 Using window.location.origin:', window.location.origin);
      return window.location.origin;
    }
    
    // Priority 3: Local development
    console.log('🔌 Using localhost:5000');
    return 'http://localhost:5000';
  };

  // Connect to socket
  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        console.log('🔌 No user/token, disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    console.log('🔌 Connecting to socket server...');
    
    const socketUrl = getSocketUrl();
    
    // Create socket connection with improved options
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      query: { userId: user.id },
      path: '/socket.io/',
      forceNew: false,
      multiplex: true,
      // Add better error handling
      secure: true,
      rejectUnauthorized: false // Allow self-signed certs in development
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully', {
        socketId: newSocket.id,
        url: socketUrl,
        transport: newSocket.io.engine.transport.name
      });
      setIsConnected(true);
      
      // Join user's room
      newSocket.emit('join-user', user.id);
      console.log(`📡 Joined room: user-${user.id}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', {
        message: error.message,
        code: error.code,
        type: error.type,
        socketUrl: socketUrl
      });
      setIsConnected(false);
    });

    newSocket.on('connect_timeout', () => {
      console.warn('⏱️ Socket.IO connection timeout');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', {
        reason: reason,
        willReconnect: newSocket.active
      });
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, reconnect manually
        console.log('🔄 Manually reconnecting after server disconnect');
        setTimeout(() => newSocket.connect(), 1000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      // Re-join user's room after reconnect
      newSocket.emit('join-user', user.id);
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('🔄 Socket.IO reconnection attempt...');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error.message);
    });

    // Listen for online users
    newSocket.on('online-users', (users) => {
      console.log('👥 Online users updated:', users);
      setOnlineUsers(users);
    });

    // Listen for new messages
    newSocket.on('new-message', (message) => {
      console.log('💬 New message received:', message);
      // You can add a toast notification here if needed
    });

    // Listen for notifications
    newSocket.on('new-notification', (notification) => {
      console.log('🔔 New notification:', notification);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        console.log('🔌 Cleaning up socket connection');
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('connect_timeout');
        newSocket.off('error');
        newSocket.off('disconnect');
        newSocket.off('reconnect');
        newSocket.off('reconnect_attempt');
        newSocket.off('reconnect_error');
        newSocket.off('online-users');
        newSocket.off('new-message');
        newSocket.off('new-notification');
        newSocket.disconnect();
      }
    };
  }, [user, token]);

  // Socket event handlers
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      console.log(`📤 Emitting event: ${event}`, data);
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
    }
  }, [isConnected]);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const value = {
    socket,
    onlineUsers,
    isConnected,
    emit,
    on,
    off,
    socketRef
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Default export for backward compatibility if needed
export default SocketProvider;