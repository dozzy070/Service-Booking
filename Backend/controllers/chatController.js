import pool from '../config/db.js';

export const getChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `WITH last_messages AS (
         SELECT DISTINCT ON (chat_id) 
                chat_id, 
                message, 
                created_at,
                sender_id
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
              u.online as other_user_online,
              lm.message as last_message,
              lm.created_at as last_message_time,
              lm.sender_id as last_message_sender,
              COUNT(CASE WHEN m2.read = false AND m2.sender_id != $1 THEN 1 END) as unread_count
       FROM messages m
       JOIN users u ON u.id = CASE 
         WHEN m.sender_id = $1 THEN m.receiver_id 
         ELSE m.sender_id 
       END
       LEFT JOIN last_messages lm ON lm.chat_id = m.chat_id
       LEFT JOIN messages m2 ON m2.chat_id = m.chat_id
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       GROUP BY m.chat_id, u.id, u.name, u.avatar, u.role, u.online, 
                lm.message, lm.created_at, lm.sender_id
       ORDER BY lm.created_at DESC NULLS LAST`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getChats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrCreateChat = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

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
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message, chat_id, created_at)
         VALUES ($1, $2, $3, (SELECT COALESCE(MAX(chat_id), 0) + 1 FROM messages), NOW())
         RETURNING chat_id`,
        [userId, otherUserId, 'Chat started']
      );
      chatId = result.rows[0].chat_id;
    }

    const otherUser = await pool.query(
      'SELECT id, name, email, avatar, role FROM users WHERE id = $1',
      [otherUserId]
    );

    res.json({
      chatId,
      otherUser: otherUser.rows[0]
    });
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

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

    const result = await pool.query(
      `SELECT m.*, 
              u.name as sender_name, u.avatar as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );

    await pool.query(
      `UPDATE messages 
       SET read = true 
       WHERE chat_id = $1 
         AND receiver_id = $2 
         AND read = false`,
      [chatId, userId]
    );

    res.json({
      messages: result.rows.reverse(),
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

export const sendMessage = async (req, res) => {
  try {
    const { chatId, receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const result = await pool.query(
      `INSERT INTO messages (chat_id, sender_id, receiver_id, message, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [chatId, senderId, receiverId, message.trim()]
    );

    const newMessage = result.rows[0];

    const sender = await pool.query(
      'SELECT id, name, avatar FROM users WHERE id = $1',
      [senderId]
    );

    const messageWithSender = {
      ...newMessage,
      sender: sender.rows[0]
    };

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, data)
       VALUES ($1, $2, $3, $4)`,
      [
        receiverId,
        'new_message',
        `New message from ${req.user.name}`,
        JSON.stringify({ chatId, message: message.trim() })
      ]
    );

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user.id;

    await pool.query(
      `UPDATE messages 
       SET read = true 
       WHERE chat_id = $1 
         AND receiver_id = $2 
         AND id = ANY($3::int[])`,
      [chatId, userId, messageIds]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = $1 AND read = false`,
      [userId]
    );

    res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const result = await pool.query(
      `SELECT m.*, 
              u.name as sender_name, u.avatar as sender_avatar,
              CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
              END as other_user_id,
              ou.name as other_user_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN users ou ON ou.id = CASE 
         WHEN m.sender_id = $1 THEN m.receiver_id 
         ELSE m.sender_id 
       END
       WHERE (m.sender_id = $1 OR m.receiver_id = $1)
         AND m.message ILIKE $2
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [userId, `%${query}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error in searchMessages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};