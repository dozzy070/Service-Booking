// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        query: { userId: user.id },
        transports: ['websocket'],
        withCredentials: true
      });

      setSocket(newSocket);

      // Listen for online users
      newSocket.on('online-users', (users) => {
        setOnlineUsers(users);
      });

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setOnlineUsers([]);
      }
    }
  }, [user]);

  // Socket event handlers
  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token: localStorage.getItem('token') },  // <-- add this line
    transports: ['websocket'],
    withCredentials: true
  });

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    onlineUsers,
    emit,
    on,
    off,
    isConnected: !!socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Default export for backward compatibility if needed
export default SocketProvider;