// backend/socket/index.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Store online users
const onlineUsersMap = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5000',
          'https://service-booking-snowy.vercel.app',
          'https://service-booking-3l1j.onrender.com'
        ];
        
        if (!origin || allowedOrigins.includes(origin) || origin.includes('vercel.app') || origin.includes('render.com')) {
          callback(null, true);
        } else {
          console.log('Socket CORS blocked origin:', origin);
          callback(null, true); // Allow all for debugging
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      console.log('⚠️ Socket connection attempt without token');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      console.log(`✅ Socket authenticated for user: ${socket.userId} (${socket.userRole})`);
      next();
    } catch (err) {
      console.error('❌ Socket authentication error:', err.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 New client connected: ${socket.id} (User: ${socket.userId})`);
    
    // Add user to online users
    onlineUsersMap.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      connectedAt: new Date()
    });
    
    // Broadcast updated online users list
    const onlineUsersList = Array.from(onlineUsersMap.values());
    io.emit('online-users', onlineUsersList);
    console.log(`👥 Online users: ${onlineUsersList.length}`);

    // Join user to their personal room
    socket.join(`user-${socket.userId}`);
    console.log(`📡 User ${socket.userId} joined room: user-${socket.userId}`);

    // Handle joining provider room
    socket.on('join-provider', (providerId) => {
      socket.join(`provider-${providerId}`);
      console.log(`📡 User ${socket.userId} joined provider room: provider-${providerId}`);
    });

    // Handle joining booking room
    socket.on('join-booking', (bookingId) => {
      socket.join(`booking-${bookingId}`);
      console.log(`📡 User ${socket.userId} joined booking room: booking-${bookingId}`);
    });

    // Handle sending messages
    socket.on('send-message', (data) => {
      console.log(`💬 Message from ${socket.userId} to ${data.recipientId}:`, data.message);
      
      const { recipientId, message, bookingId, senderName } = data;
      
      // Emit to recipient's personal room
      io.to(`user-${recipientId}`).emit('new-message', {
        id: Date.now(),
        senderId: socket.userId,
        senderName: senderName,
        recipientId: recipientId,
        message: message,
        bookingId: bookingId,
        timestamp: new Date(),
        read: false
      });
      
      // Also emit to booking room if bookingId exists
      if (bookingId) {
        io.to(`booking-${bookingId}`).emit('booking-message', {
          senderId: socket.userId,
          message: message,
          timestamp: new Date()
        });
      }
      
      // Acknowledge message sent
      socket.emit('message-sent', { success: true, timestamp: new Date() });
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { recipientId, bookingId, isTyping } = data;
      socket.to(`user-${recipientId}`).emit('user-typing', {
        userId: socket.userId,
        bookingId: bookingId,
        isTyping: isTyping
      });
    });

    // Handle notifications
    socket.on('send-notification', (data) => {
      console.log(`🔔 Notification from ${socket.userId} to ${data.recipientId}:`, data.message);
      
      io.to(`user-${data.recipientId}`).emit('new-notification', {
        id: Date.now(),
        senderId: socket.userId,
        recipientId: data.recipientId,
        message: data.message,
        type: data.type || 'info',
        bookingId: data.bookingId,
        timestamp: new Date(),
        read: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔴 Client disconnected: ${socket.id} (User: ${socket.userId}) - Reason: ${reason}`);
      
      // Remove user from online users
      onlineUsersMap.delete(socket.userId);
      
      // Broadcast updated online users list
      const updatedOnlineUsersList = Array.from(onlineUsersMap.values());
      io.emit('online-users', updatedOnlineUsersList);
      console.log(`👥 Online users now: ${updatedOnlineUsersList.length}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${socket.userId}:`, error.message);
    });
  });

  // Return io instance for use in other parts of the app
  return io;
};

export default initializeSocket;