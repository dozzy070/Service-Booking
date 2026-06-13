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

  // Get socket URL from environment
  const getSocketUrl = () => {
    const url = import.meta.env.VITE_API_URL || 'https://service-booking-3l1j.onrender.com';
    console.log('🔌 Socket URL:', url);
    return url;
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
    
    // Create socket connection
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: { userId: user.id }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
      setIsConnected(true);
      
      // Join user's room
      newSocket.emit('join-user', user.id);
      console.log(`📡 Joined room: user-${user.id}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.IO reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
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
        newSocket.off('disconnect');
        newSocket.off('reconnect');
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