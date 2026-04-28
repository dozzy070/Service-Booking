import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

let io;
// ✅ New code with caching
let cachedProviders = {};

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // 🔐 Auth middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userRes = await pool.query(
        'SELECT id, name, role FROM users WHERE id = $1',
        [decoded.id]
      );
      if (userRes.rows.length === 0) throw new Error('User not found');
      socket.user = userRes.rows[0];
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // Use cached provider info if available, otherwise fetch once
    if (!cachedProviders[socket.user.id]) {
      cachedProviders[socket.user.id] = socket.user;
    }
    // Removed noisy log – connection already cached
    socket.join(`user:${socket.user.id}`);

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      const { conversationId, message, receiverId } = data;
      const senderId = socket.user.id;

      try {
        // Insert into DB
        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, receiver_id, message)
           VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
          [conversationId, senderId, receiverId, message]
        );

        const newMessage = {
          id: result.rows[0].id,
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          created_at: result.rows[0].created_at,
          sender_name: socket.user.name,
        };

        // Update conversation last message
        await pool.query(
          `UPDATE conversations SET last_message = $1, last_message_time = NOW()
           WHERE id = $2`,
          [message, conversationId]
        );

        // Emit to conversation room
        io.to(`conv:${conversationId}`).emit('new-message', newMessage);
        // Notify receiver individually
        io.to(`user:${receiverId}`).emit('message-notification', {
          conversationId,
          message: message.substring(0, 50),
          senderName: socket.user.name,
        });
      } catch (error) {
        console.error('Send message error:', error);
      }
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit('user-typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      // Removed noisy disconnect log
    });
  });

  return io;
};

export const getIo = () => io;