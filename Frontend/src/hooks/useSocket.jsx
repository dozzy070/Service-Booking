// hooks/useSocket.jsx
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef(null);
  const isConnecting = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || socketRef.current || isConnecting.current) return;

    isConnecting.current = true;

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      isConnecting.current = false;
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
      isConnecting.current = false;
      if (err.message.includes('Authentication')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    socketRef.current = newSocket;

    // Cleanup only on unmount, not on re-runs
    return () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
      isConnecting.current = false;
    };
  }, []); // Empty dependency array – connects only once

  return {
    emit: (event, data) => socketRef.current?.emit(event, data),
    on: (event, cb) => socketRef.current?.on(event, cb),
    off: (event, cb) => socketRef.current?.off(event, cb),
    isConnected: () => socketRef.current?.connected || false,
  };
};