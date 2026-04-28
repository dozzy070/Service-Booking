import express from 'express';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ NEW: Get users available for starting a new chat
router.get('/users/available-for-chat', protect, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentRole = req.user.role;
    
    let query;
    if (currentRole === 'provider') {
      // Provider can chat with customers and admin
      query = `SELECT id, name, role FROM users WHERE role IN ('customer', 'admin') AND id != $1 ORDER BY name`;
    } else if (currentRole === 'customer') {
      // Customer can chat with providers
      query = `SELECT id, name, role FROM users WHERE role = 'provider' AND id != $1 ORDER BY name`;
    } else if (currentRole === 'admin') {
      // Admin can chat with providers
      query = `SELECT id, name, role FROM users WHERE role = 'provider' AND id != $1 ORDER BY name`;
    } else {
      return res.status(403).json({ message: 'Not allowed' });
    }
    
    const result = await pool.query(query, [currentUserId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all conversations for the logged-in user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    if (userRole === 'customer') {
      query = `
        SELECT c.*, 
               u.id as other_party_id,
               u.name as other_party_name, 
               u.avatar as other_party_avatar,
               u.role as other_party_role
        FROM conversations c
        JOIN users u ON (u.id = c.provider_id)
        WHERE c.customer_id = $1
        ORDER BY c.last_message_time DESC
      `;
    } else if (userRole === 'provider') {
      query = `
        SELECT c.*, 
               u.id as other_party_id,
               u.name as other_party_name, 
               u.avatar as other_party_avatar,
               u.role as other_party_role
        FROM conversations c
        JOIN users u ON (u.id = c.customer_id)
        WHERE c.provider_id = $1
        ORDER BY c.last_message_time DESC
      `;
    } else if (userRole === 'admin') {
      query = `
        SELECT c.*, 
               u.id as other_party_id,
               u.name as other_party_name, 
               u.avatar as other_party_avatar,
               u.role as other_party_role
        FROM conversations c
        JOIN users u ON (u.id = c.provider_id)
        ORDER BY c.last_message_time DESC
      `;
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', protect, async (req, res) => {
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

    const messages = await pool.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    res.json(messages.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start a new conversation (customer to provider, or provider to admin)
router.post('/conversations', protect, async (req, res) => {
  try {
    const { otherPartyId, bookingId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

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
      return res.json({ conversationId: existing.rows[0].id, existing: true });
    }

    const result = await pool.query(
      `INSERT INTO conversations (customer_id, provider_id, booking_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [customerId, providerId, bookingId || null]
    );
    res.status(201).json({ conversationId: result.rows[0].id, existing: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;