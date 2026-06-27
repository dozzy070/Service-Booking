// src/components/common/WebSocketStatus.jsx
import React from 'react';
import { useSocket } from '../../context/SocketContext';

const WebSocketStatus = () => {
  // ✅ Always call useSocket at the top level
  const { isConnected } = useSocket();
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        fontSize: '12px',
        fontWeight: '500',
        color: isConnected ? '#10b981' : '#ef4444',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          animation: isConnected ? 'pulse 2s infinite' : 'none',
          display: 'inline-block',
        }}
      />
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default WebSocketStatus;