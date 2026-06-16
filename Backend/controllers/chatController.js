// controllers/chatController.js
import pool from '../config/db.js';

// =========================================================================
// GET CONVERSATIONS
// =========================================================================

export const getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `WITH last_messages AS (
         SELECT DISTINCT ON (chat_id) 
                chat_id, 
                message, 
                created_at,
                sender_id,
                is_read
         FROM messages 
         ORDER BY chat_id, created_at DESC
       )
       SELECT DISTINCT 
              m.chat_id as id,
              CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
              END as other_user_id,
              u.name as other_user_name,
              u.avatar as other_user_avatar,
              u.role as other_user_role,
              u.is_active as other_user_active,
              u.last_seen as other_user_last_seen,
              lm.message as last_message,
              lm.created_at as last_message_time,
              lm.sender_id as last_message_sender,
              lm.is_read as last_message_read,
              COUNT(CASE WHEN m2.is_read = false AND m2.sender_id != $1 THEN 1 END) as unread_count,
              b.id as booking_id,
              b.status as booking_status,
              b.booking_date as booking_date,
              s.title as service_title
       FROM messages m
       JOIN users u ON u.id = CASE 
         WHEN m.sender_id = $1 THEN m.receiver_id 
         ELSE m.sender_id 
       END
       LEFT JOIN last_messages lm ON lm.chat_id = m.chat_id
       LEFT JOIN messages m2 ON m2.chat_id = m.chat_id
       LEFT JOIN bookings b ON b.id = m.booking_id
       LEFT JOIN services s ON s.id = b.service_id
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       GROUP BY m.chat_id, u.id, u.name, u.avatar, u.role, u.is_active, u.last_seen,
                lm.message, lm.created_at, lm.sender_id, lm.is_read,
                b.id, b.status, b.booking_date, s.title
       ORDER BY lm.created_at DESC NULLS LAST`,
      [userId]
    );

    // Format response
    const conversations = result.rows.map(row => ({
      id: row.id,
      otherUser: {
        id: row.other_user_id,
        name: row.other_user_name,
        avatar: row.other_user_avatar,
        role: row.other_user_role,
        isActive: row.other_user_active,
        lastSeen: row.other_user_last_seen
      },
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      lastMessageSender: row.last_message_sender,
      isLastMessageRead: row.last_message_read,
      unreadCount: parseInt(row.unread_count) || 0,
      booking: row.booking_id ? {
        id: row.booking_id,
        status: row.booking_status,
        date: row.booking_date,
        serviceTitle: row.service_title
      } : null
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Error in getChats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET OR CREATE CHAT
// =========================================================================

export const getOrCreateChat = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    if (parseInt(otherUserId) === userId) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if other user exists
    const userCheck = await pool.query(
      'SELECT id, name, email, avatar, role, is_active FROM users WHERE id = $1',
      [otherUserId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find existing chat
    const existingChat = await pool.query(
      `SELECT DISTINCT chat_id 
       FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       LIMIT 1`,
      [userId, otherUserId]
    );

    let chatId;

    if (existingChat.rows.length > 0) {
      chatId = existingChat.rows[0].chat_id;
    } else {
      // Create new chat with a system message
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, chat_id, created_at, is_read)
         VALUES ($1, $2, $3, (SELECT COALESCE(MAX(chat_id), 0) + 1 FROM messages), NOW(), true)
         RETURNING chat_id`,
        [userId, otherUserId, 'Chat started']
      );
      chatId = result.rows[0].chat_id;
    }

    res.json({
      chatId,
      otherUser: userCheck.rows[0]
    });
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET MESSAGES
// =========================================================================

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50, before } = req.query;

    const offset = (page - 1) * limit;

    // Verify user has access to this chat
    const hasAccess = await pool.query(
      `SELECT id FROM messages 
       WHERE chat_id = $1 
       AND (sender_id = $2 OR receiver_id = $2)
       LIMIT 1`,
      [chatId, userId]
    );

    if (hasAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = `
      SELECT m.*, 
             u.name as sender_name, 
             u.avatar as sender_avatar,
             u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
    `;
    const params = [chatId];
    let paramIndex = 2;

    if (before) {
      query += ` AND m.id < $${paramIndex}`;
      params.push(before);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Mark messages as read (async, don't wait)
    pool.query(
      `UPDATE messages 
       SET is_read = true, read_at = NOW() 
       WHERE chat_id = $1 AND receiver_id = $2 AND is_read = false`,
      [chatId, userId]
    ).catch(err => console.error('Error marking messages as read:', err));

    const messages = result.rows.reverse().map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      message: msg.message,
      isRead: msg.is_read,
      readAt: msg.read_at,
      createdAt: msg.created_at,
      senderName: msg.sender_name,
      senderAvatar: msg.sender_avatar,
      senderRole: msg.sender_role,
      bookingId: msg.booking_id
    }));

    // Get unread count for this chat
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE chat_id = $1 AND receiver_id = $2 AND is_read = false',
      [chatId, userId]
    );

    res.json({
      messages,
      unreadCount: parseInt(unreadResult.rows[0].count),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: result.rows.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// SEND MESSAGE
// =========================================================================

export const sendMessage = async (req, res) => {
  try {
    const { chatId, receiverId, message, bookingId } = req.body;
    const senderId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Verify chat exists and user has access
    const chatCheck = await pool.query(
      `SELECT id FROM messages 
       WHERE chat_id = $1 
       AND (sender_id = $2 OR receiver_id = $2)
       LIMIT 1`,
      [chatId, senderId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, receiver_id, message, booking_id, created_at, is_read)
       VALUES ($1, $2, $3, $4, $5, NOW(), false) RETURNING *`,
      [chatId, senderId, receiverId, message.trim(), bookingId || null]
    );

    const newMessage = result.rows[0];

    // Get sender info
    const sender = await pool.query(
      'SELECT id, name, avatar, role FROM users WHERE id = $1',
      [senderId]
    );

    const messageWithSender = {
      ...newMessage,
      sender: sender.rows[0]
    };

    // Create notification for receiver
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        receiverId,
        'message',
        'New Message',
        `New message from ${req.user.name}`,
        JSON.stringify({ chatId, message: message.trim(), senderId }),
        `/chat/${chatId}`
      ]
    );

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// MARK MESSAGES AS READ
// =========================================================================

export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      await pool.query(
        `UPDATE messages 
         SET is_read = true, read_at = NOW() 
         WHERE chat_id = $1 
           AND receiver_id = $2 
           AND id = ANY($3::int[])`,
        [chatId, userId, messageIds]
      );
    } else {
      // Mark all messages as read
      await pool.query(
        `UPDATE messages 
         SET is_read = true, read_at = NOW() 
         WHERE chat_id = $1 
           AND receiver_id = $2 
           AND is_read = false`,
        [chatId, userId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// DELETE MESSAGE
// =========================================================================

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id',
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET UNREAD COUNT
// =========================================================================

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );

    // Also get per-chat unread counts
    const perChat = await pool.query(
      `SELECT chat_id, COUNT(*) as count
       FROM messages
       WHERE receiver_id = $1 AND is_read = false
       GROUP BY chat_id`,
      [userId]
    );

    const perChatUnread = {};
    perChat.rows.forEach(row => {
      perChatUnread[row.chat_id] = parseInt(row.count);
    });

    res.json({
      unreadCount: parseInt(result.rows[0].unread_count),
      perChat: perChatUnread
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// SEARCH MESSAGES
// =========================================================================

export const searchMessages = async (req, res) => {
  try {
    const { query, chatId } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let sql = `
      SELECT m.*, 
              u.name as sender_name, 
              u.avatar as sender_avatar,
              CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
              END as other_user_id,
              ou.name as other_user_name,
              ou.avatar as other_user_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      JOIN users ou ON ou.id = CASE 
        WHEN m.sender_id = $1 THEN m.receiver_id 
        ELSE m.sender_id 
      END
      WHERE (m.sender_id = $1 OR m.receiver_id = $1)
        AND m.message ILIKE $2
    `;
    const params = [userId, `%${query}%`];

    if (chatId) {
      sql += ` AND m.chat_id = $3`;
      params.push(chatId);
    }

    sql += ` ORDER BY m.created_at DESC LIMIT 50`;

    const result = await pool.query(sql, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error in searchMessages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET AVAILABLE USERS FOR CHAT
// =========================================================================

export const getAvailableUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params = [userId];

    if (userRole === 'customer') {
      query = `
        SELECT id, name, email, avatar, role, is_active, last_seen
        FROM users 
        WHERE role = 'provider' 
          AND id != $1 
          AND is_active = true
        ORDER BY name
      `;
    } else if (userRole === 'provider') {
      query = `
        SELECT id, name, email, avatar, role, is_active, last_seen
        FROM users 
        WHERE role IN ('customer', 'admin') 
          AND id != $1 
          AND is_active = true
        ORDER BY name
      `;
    } else if (userRole === 'admin') {
      query = `
        SELECT id, name, email, avatar, role, is_active, last_seen
        FROM users 
        WHERE role IN ('provider', 'customer') 
          AND id != $1 
          AND is_active = true
        ORDER BY name
      `;
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getAvailableUsers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET CHAT DETAILS
// =========================================================================

export const getChatDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT 
              m.chat_id as id,
              CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
              END as other_user_id,
              u.name as other_user_name,
              u.avatar as other_user_avatar,
              u.role as other_user_role,
              u.is_active as other_user_active,
              u.last_seen as other_user_last_seen,
              b.id as booking_id,
              b.status as booking_status,
              b.booking_date as booking_date,
              b.total_amount as booking_amount,
              s.title as service_title,
              s.id as service_id
       FROM messages m
       JOIN users u ON u.id = CASE 
         WHEN m.sender_id = $1 THEN m.receiver_id 
         ELSE m.sender_id 
       END
       LEFT JOIN bookings b ON b.id = m.booking_id
       LEFT JOIN services s ON s.id = b.service_id
       WHERE m.chat_id = $2
         AND (m.sender_id = $1 OR m.receiver_id = $1)
       LIMIT 1`,
      [userId, chatId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in getChatDetails:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// DELETE CHAT / CONVERSATION
// =========================================================================

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this chat
    const hasAccess = await pool.query(
      `SELECT id FROM messages 
       WHERE chat_id = $1 
       AND (sender_id = $2 OR receiver_id = $2)
       LIMIT 1`,
      [chatId, userId]
    );

    if (hasAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all messages in the chat
    await pool.query(
      'DELETE FROM messages WHERE chat_id = $1',
      [chatId]
    );

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error in deleteChat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// TYPING INDICATOR (WebSocket will handle this, but endpoint for tracking)
// =========================================================================

export const updateTypingStatus = async (req, res) => {
  try {
    const { chatId, isTyping } = req.body;
    const userId = req.user.id;

    // Store typing status in memory (Redis would be better)
    // For now, just acknowledge
    res.json({ 
      success: true, 
      isTyping,
      userId,
      chatId
    });
  } catch (error) {
    console.error('Error in updateTypingStatus:', error);
    res.status(500).json({ message: 'Server error' });
  }
};