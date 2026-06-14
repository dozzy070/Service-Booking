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
          'https://service-booking-3l1j.onrender.com',
          'https://service-booking-1-g46o.onrender.com' // Add deployed backend URL
        ];
        
        // Log origin information for debugging
        console.log('🔌 Socket.IO CORS check for origin:', origin);
        
        // Allow if no origin (mobile apps, curl)
        if (!origin) {
          console.log('✅ Socket.IO: Allowing request with no origin');
          return callback(null, true);
        }
        
        // Allow vercel.app subdomains
        if (origin.includes('vercel.app')) {
          console.log('✅ Socket.IO: Allowing Vercel origin:', origin);
          return callback(null, true);
        }
        
        // Allow render.com subdomains
        if (origin.includes('render.com')) {
          console.log('✅ Socket.IO: Allowing Render origin:', origin);
          return callback(null, true);
        }
        
        // Check explicit list
        if (allowedOrigins.includes(origin)) {
          console.log('✅ Socket.IO: Allowing whitelisted origin:', origin);
          return callback(null, true);
        }
        
        // Allow all for debugging (remove in production if needed)
        console.log('⚠️ Socket.IO: Allowing non-whitelisted origin (debug mode):', origin);
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    serveClient: true,
    path: '/socket.io/',
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    // Add better error handling
    retries: 10,
    connectTimeout: 10000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    console.log('🔌 Socket.IO authentication attempt:', {
      socketId: socket.id,
      hasToken: !!token,
      handshake: {
        origin: socket.handshake.headers.origin,
        userAgent: socket.handshake.headers['user-agent']?.substring(0, 50)
      }
    });
    
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
      console.error('❌ Socket authentication error:', {
        error: err.message,
        errorType: err.name,
        socketId: socket.id
      });
      next(new Error('Invalid or expired token'));
    }
  });

  // Error handling middleware
  io.use((socket, next) => {
    try {
      next();
    } catch (err) {
      console.error('❌ Socket.IO error:', {
        socketId: socket.id,
        error: err.message
      });
      next(err);
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 New client connected: ${socket.id} (User: ${socket.userId})`, {
      transport: socket.conn.transport.name,
      handshake: {
        origin: socket.handshake.headers.origin,
      }
    });
    
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