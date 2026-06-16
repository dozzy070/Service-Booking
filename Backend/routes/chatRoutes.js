import express from 'express';
import pool from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// =========================================================================
// ALL CHAT ROUTES REQUIRE AUTHENTICATION
// =========================================================================
router.use(protect);

// =========================================================================
// USER AVAILABILITY FOR CHAT
// =========================================================================

// GET /api/chat/users/available-for-chat - Get users available for chat
router.get('/users/available-for-chat', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentRole = req.user.role;
    
    let query;
    let params = [currentUserId];
    
    if (currentRole === 'provider') {
      // Provider can chat with customers and admin
      query = `
        SELECT id, name, email, role, avatar, is_active 
        FROM users 
        WHERE role IN ('customer', 'admin') 
          AND id != $1 
          AND is_active = true
        ORDER BY name
      `;
    } else if (currentRole === 'customer') {
      // Customer can chat with providers
      query = `
        SELECT id, name, email, role, avatar, is_active 
        FROM users 
        WHERE role = 'provider' 
          AND id != $1 
          AND is_active = true
        ORDER BY name
      `;
    } else if (currentRole === 'admin') {
      // Admin can chat with providers and customers
      query = `
        SELECT id, name, email, role, avatar, is_active 
        FROM users 
        WHERE role IN ('provider', 'customer') 
          AND id != $1 
          AND is_active = true
        ORDER BY name
      `;
    } else {
      return res.status(403).json({ message: 'Not allowed' });
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// CONVERSATION MANAGEMENT
// =========================================================================

// GET /api/chat/conversations - Get all conversations for the logged-in user
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    if (userRole === 'customer') {
      query = `
        SELECT 
          c.*, 
          u.id as other_party_id,
          u.name as other_party_name, 
          u.avatar as other_party_avatar,
          u.role as other_party_role,
          u.is_active as other_party_active,
          (SELECT COUNT(*) FROM messages 
           WHERE conversation_id = c.id 
             AND sender_id != $1 
             AND is_read = false) as unread_count,
          (SELECT message FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC 
           LIMIT 1) as last_message,
          (SELECT created_at FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC 
           LIMIT 1) as last_message_time,
          s.title as booking_service_title,
          b.status as booking_status,
          b.total_amount as booking_amount,
          b.booking_date as booking_date
        FROM conversations c
        JOIN users u ON u.id = c.provider_id
        LEFT JOIN bookings b ON b.id = c.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE c.customer_id = $1
        ORDER BY c.last_message_time DESC
      `;
    } else if (userRole === 'provider') {
      query = `
        SELECT 
          c.*, 
          u.id as other_party_id,
          u.name as other_party_name, 
          u.avatar as other_party_avatar,
          u.role as other_party_role,
          u.is_active as other_party_active,
          (SELECT COUNT(*) FROM messages 
           WHERE conversation_id = c.id 
             AND sender_id != $1 
             AND is_read = false) as unread_count,
          (SELECT message FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC 
           LIMIT 1) as last_message,
          (SELECT created_at FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC 
           LIMIT 1) as last_message_time,
          s.title as booking_service_title,
          b.status as booking_status,
          b.total_amount as booking_amount,
          b.booking_date as booking_date
        FROM conversations c
        JOIN users u ON u.id = c.customer_id
        LEFT JOIN bookings b ON b.id = c.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        WHERE c.provider_id = $1
        ORDER BY c.last_message_time DESC
      `;
    } else if (userRole === 'admin') {
      query = `
        SELECT 
          c.*, 
          u.id as other_party_id,
          u.name as other_party_name, 
          u.avatar as other_party_avatar,
          u.role as other_party_role,
          u.is_active as other_party_active,
          (SELECT COUNT(*) FROM messages 
           WHERE conversation_id = c.id 
             AND sender_id != $1 
             AND is_read = false) as unread_count,
          (SELECT message FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC 
           LIMIT 1) as last_message,
          (SELECT created_at FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC 
           LIMIT 1) as last_message_time,
          s.title as booking_service_title,
          b.status as booking_status,
          b.total_amount as booking_amount,
          b.booking_date as booking_date
        FROM conversations c
        JOIN users u ON u.id = c.provider_id
        LEFT JOIN bookings b ON b.id = c.booking_id
        LEFT JOIN services s ON s.id = b.service_id
        ORDER BY c.last_message_time DESC
      `;
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/chat/conversations/:id - Get a single conversation
router.get('/conversations/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify user is participant
    const convCheck = await pool.query(
      `SELECT customer_id, provider_id FROM conversations WHERE id = $1`,
      [conversationId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conv = convCheck.rows[0];
    const isParticipant = (userRole === 'customer' && conv.customer_id === userId) ||
                          (userRole === 'provider' && conv.provider_id === userId) ||
                          userRole === 'admin';
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(`
      SELECT c.*,
        u.id as other_party_id,
        u.name as other_party_name,
        u.avatar as other_party_avatar,
        u.role as other_party_role,
        u.is_active as other_party_active,
        s.title as booking_service_title,
        b.status as booking_status,
        b.total_amount as booking_amount,
        b.booking_date as booking_date
      FROM conversations c
      JOIN users u ON u.id = CASE 
        WHEN c.customer_id = $1 THEN c.provider_id 
        ELSE c.customer_id 
      END
      LEFT JOIN bookings b ON b.id = c.booking_id
      LEFT JOIN services s ON s.id = b.service_id
      WHERE c.id = $1
    `, [conversationId, userId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/conversations - Start a new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { otherPartyId, bookingId, initialMessage } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!otherPartyId) {
      return res.status(400).json({ message: 'Other party ID is required' });
    }

    let customerId, providerId;

    if (userRole === 'customer') {
      customerId = userId;
      providerId = otherPartyId;
    } else if (userRole === 'provider') {
      providerId = userId;
      // If otherPartyId belongs to a customer -> customerId = otherPartyId
      // If otherPartyId belongs to admin -> customerId = NULL
      const otherUser = await pool.query('SELECT role FROM users WHERE id = $1', [otherPartyId]);
      if (otherUser.rows[0]?.role === 'admin') {
        customerId = null;
      } else {
        customerId = otherPartyId;
      }
    } else {
      return res.status(403).json({ message: 'Only customers and providers can start conversations' });
    }

    // Check for existing conversation
    let existing;
    if (customerId === null) {
      existing = await pool.query(
        `SELECT id FROM conversations WHERE provider_id = $1 AND customer_id IS NULL`,
        [providerId]
      );
    } else {
      existing = await pool.query(
        `SELECT id FROM conversations WHERE customer_id = $1 AND provider_id = $2`,
        [customerId, providerId]
      );
    }

    if (existing.rows.length > 0) {
      // If there's an initial message, send it
      if (initialMessage) {
        const conversationId = existing.rows[0].id;
        await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [conversationId, userId, otherPartyId, initialMessage]
        );
        
        await pool.query(
          `UPDATE conversations SET last_message_time = NOW() WHERE id = $1`,
          [conversationId]
        );
      }
      
      return res.json({ 
        conversationId: existing.rows[0].id, 
        existing: true 
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO conversations (customer_id, provider_id, booking_id, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING id`,
        [customerId, providerId, bookingId || null]
      );

      const conversationId = result.rows[0].id;

      // If there's an initial message, send it
      if (initialMessage) {
        await client.query(
          `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [conversationId, userId, otherPartyId, initialMessage]
        );

        await client.query(
          `UPDATE conversations SET last_message_time = NOW() WHERE id = $1`,
          [conversationId]
        );
      }

      await client.query('COMMIT');
      
      res.status(201).json({ 
        conversationId, 
        existing: false 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/chat/conversations/:id - Delete a conversation
router.delete('/conversations/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Verify user is participant
    const convCheck = await pool.query(
      `SELECT customer_id, provider_id FROM conversations WHERE id = $1`,
      [conversationId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conv = convCheck.rows[0];
    const isParticipant = (userRole === 'customer' && conv.customer_id === userId) ||
                          (userRole === 'provider' && conv.provider_id === userId) ||
                          userRole === 'admin';
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete all messages
      await client.query(
        'DELETE FROM messages WHERE conversation_id = $1',
        [conversationId]
      );

      // Delete conversation
      await client.query(
        'DELETE FROM conversations WHERE id = $1',
        [conversationId]
      );

      await client.query('COMMIT');
      
      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// MESSAGE MANAGEMENT
// =========================================================================

// GET /api/chat/conversations/:id/messages - Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 50, before } = req.query;

    // Verify user is participant
    const convCheck = await pool.query(
      `SELECT customer_id, provider_id FROM conversations WHERE id = $1`,
      [conversationId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conv = convCheck.rows[0];
    const isParticipant = (userRole === 'customer' && conv.customer_id === userId) ||
                          (userRole === 'provider' && conv.provider_id === userId) ||
                          userRole === 'admin';
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let query = `
      SELECT 
        m.*, 
        u.name as sender_name,
        u.avatar as sender_avatar,
        u.role as sender_role
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
    `;
    
    const params = [conversationId];
    let paramIndex = 2;

    if (before) {
      query += ` AND m.id < $${paramIndex}`;
      params.push(before);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));

    const messages = await pool.query(query, params);
    
    // Mark messages as read (async, don't wait)
    pool.query(
      `UPDATE messages 
       SET is_read = true, read_at = NOW() 
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
      [conversationId, userId]
    ).catch(err => console.error('Error marking messages as read:', err));

    res.json(messages.rows.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/chat/conversations/:id/messages - Send a message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const senderId = req.user.id;
    const { message, receiverId, attachment, attachmentType } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Verify user is participant
    const convCheck = await pool.query(
      `SELECT * FROM conversations WHERE id = $1`,
      [conversationId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const conv = convCheck.rows[0];
    const isParticipant = conv.customer_id === senderId || conv.provider_id === senderId;
    
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Determine receiver
    let receiver = receiverId;
    if (!receiver) {
      if (conv.customer_id === senderId) {
        receiver = conv.provider_id;
      } else {
        receiver = conv.customer_id;
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert message
      const result = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, attachment, attachment_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [conversationId, senderId, receiver, message.trim(), attachment || null, attachmentType || null]
      );
      
      // Update conversation last message time
      await client.query(
        `UPDATE conversations SET last_message_time = NOW(), updated_at = NOW() WHERE id = $1`,
        [conversationId]
      );
      
      // Get sender info
      const sender = await client.query(
        'SELECT name, avatar, role FROM users WHERE id = $1',
        [senderId]
      );
      
      const newMessage = {
        ...result.rows[0],
        sender_name: sender.rows[0]?.name || 'User',
        sender_avatar: sender.rows[0]?.avatar || null,
        sender_role: sender.rows[0]?.role || 'user'
      };
      
      await client.query('COMMIT');
      res.status(201).json(newMessage);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/chat/conversations/:id/read - Mark messages as read
router.put('/conversations/:id/read', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { messageIds } = req.body;
    
    let result;
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      result = await pool.query(
        `UPDATE messages 
         SET is_read = true, read_at = NOW() 
         WHERE id = ANY($1) 
           AND conversation_id = $2 
           AND receiver_id = $3
         RETURNING id`,
        [messageIds, conversationId, userId]
      );
    } else {
      // Mark all messages as read
      result = await pool.query(
        `UPDATE messages 
         SET is_read = true, read_at = NOW() 
         WHERE conversation_id = $1 
           AND receiver_id = $2 
           AND is_read = false
         RETURNING id`,
        [conversationId, userId]
      );
    }
    
    res.json({ 
      message: 'Messages marked as read',
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/chat/messages/:id - Delete a message
router.delete('/messages/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;
    
    const result = await pool.query(
      'DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id',
      [messageId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// TYPING INDICATORS & PRESENCE
// =========================================================================

// POST /api/chat/typing - Send typing indicator
router.post('/typing', async (req, res) => {
  try {
    const { conversationId, recipientId, isTyping } = req.body;
    const userId = req.user.id;
    
    // Store typing status in memory or database (optional)
    // This is typically handled via WebSocket for real-time updates
    
    // For REST API, we just acknowledge the request
    res.json({ 
      success: true, 
      isTyping 
    });
  } catch (error) {
    console.error('Error handling typing indicator:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// MESSAGE STATISTICS
// =========================================================================

// GET /api/chat/stats - Get chat statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        (SELECT COUNT(*) FROM messages WHERE sender_id = $1) as sent_messages,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false) as unread_messages,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = true) as read_messages,
        (SELECT MAX(created_at) FROM messages WHERE sender_id = $1 OR receiver_id = $1) as last_message_at
      FROM conversations c
      WHERE c.customer_id = $1 OR c.provider_id = $1
    `, [userId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;