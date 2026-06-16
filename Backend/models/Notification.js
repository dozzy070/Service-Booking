// models/Notification.js
import pool from '../config/db.js';

class Notification {
  // =========================================================================
  // CREATE NOTIFICATION
  // =========================================================================

  static async create(notificationData) {
    const { user_id, type, title, message, data = {}, link = null } = notificationData;
    
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [user_id, type, title || null, message, JSON.stringify(data), link]
    );
    
    return result.rows[0];
  }

  // =========================================================================
  // CREATE FOR MULTIPLE USERS
  // =========================================================================

  static async createForMultipleUsers(userIds, notificationData) {
    const { type, title, message, data = {}, link = null } = notificationData;
    
    if (!userIds || userIds.length === 0) {
      return [];
    }
    
    const values = [];
    const params = [];
    let paramIndex = 1;
    
    userIds.forEach(userId => {
      values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NOW(), NOW())`);
      params.push(userId, type, title || null, message, JSON.stringify(data), link);
    });
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, link, created_at, updated_at)
      VALUES ${values.join(', ')}
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // =========================================================================
  // FIND BY USER
  // =========================================================================

  static async findByUser(userId, filters = {}) {
    const { limit = 50, offset = 0, is_read, type, search } = filters;
    
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;
    
    if (is_read !== undefined) {
      query += ` AND is_read = $${paramIndex++}`;
      params.push(is_read);
    }
    
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (search) {
      query += ` AND (title ILIKE $${paramIndex++} OR message ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // =========================================================================
  // FIND BY ID
  // =========================================================================

  static async findById(notificationId, userId) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
    return result.rows[0] || null;
  }

  // =========================================================================
  // GET UNREAD COUNT
  // =========================================================================

  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  // =========================================================================
  // GET UNREAD BY TYPE
  // =========================================================================

  static async getUnreadCountByType(userId, type) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND type = $2 AND is_read = false',
      [userId, type]
    );
    return parseInt(result.rows[0].count);
  }

  // =========================================================================
  // MARK AS READ
  // =========================================================================

  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, read_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0] || null;
  }

  // =========================================================================
  // MARK ALL AS READ
  // =========================================================================

  static async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, read_at = NOW(), updated_at = NOW() 
       WHERE user_id = $1 AND is_read = false RETURNING id`,
      [userId]
    );
    return result.rows.map(row => row.id);
  }

  // =========================================================================
  // MARK ALL AS READ BY TYPE
  // =========================================================================

  static async markAllAsReadByType(userId, type) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, read_at = NOW(), updated_at = NOW() 
       WHERE user_id = $1 AND type = $2 AND is_read = false RETURNING id`,
      [userId, type]
    );
    return result.rows.map(row => row.id);
  }

  // =========================================================================
  // DELETE NOTIFICATION
  // =========================================================================

  static async deleteNotification(notificationId, userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );
    return result.rows[0] || null;
  }

  // =========================================================================
  // DELETE ALL READ
  // =========================================================================

  static async deleteAllRead(userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING id',
      [userId]
    );
    return result.rows.map(row => row.id);
  }

  // =========================================================================
  // DELETE BY TYPE
  // =========================================================================

  static async deleteByType(userId, type) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND type = $2 RETURNING id',
      [userId, type]
    );
    return result.rows.map(row => row.id);
  }

  // =========================================================================
  // GET BY TYPE
  // =========================================================================

  static async getByType(userId, type, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 AND type = $2 
       ORDER BY created_at DESC LIMIT $3`,
      [userId, type, limit]
    );
    return result.rows;
  }

  // =========================================================================
  // GET RECENT
  // =========================================================================

  static async getRecent(userId, days = 7) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 
       AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // =========================================================================
  // GET STATS
  // =========================================================================

  static async getStats(userId) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as this_month,
        COUNT(CASE WHEN type = 'booking' THEN 1 END) as booking_notifications,
        COUNT(CASE WHEN type = 'payment' THEN 1 END) as payment_notifications,
        COUNT(CASE WHEN type = 'review' THEN 1 END) as review_notifications,
        COUNT(CASE WHEN type = 'system' THEN 1 END) as system_notifications,
        COUNT(CASE WHEN type = 'message' THEN 1 END) as message_notifications,
        COUNT(CASE WHEN type = 'promotional' THEN 1 END) as promotional_notifications
      FROM notifications
      WHERE user_id = $1
    `, [userId]);
    return result.rows[0];
  }

  // =========================================================================
  // GET TYPES
  // =========================================================================

  static async getTypes(userId) {
    const result = await pool.query(
      `SELECT DISTINCT type, COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 
       GROUP BY type 
       ORDER BY type`,
      [userId]
    );
    return result.rows;
  }

  // =========================================================================
  // UPDATE NOTIFICATION
  // =========================================================================

  static async updateNotification(notificationId, userId, data) {
    const { is_read, data: customData } = data;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (is_read !== undefined) {
      fields.push(`is_read = $${paramIndex++}`);
      values.push(is_read);
      if (is_read === true) {
        fields.push(`read_at = NOW()`);
      }
    }
    
    if (customData !== undefined) {
      fields.push(`data = $${paramIndex++}`);
      values.push(JSON.stringify(customData));
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(notificationId, userId);
    
    const query = `
      UPDATE notifications 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // =========================================================================
  // CREATE NOTIFICATION WITH TEMPLATE
  // =========================================================================

  static async createWithTemplate(userId, template, context = {}) {
    const templates = {
      booking_created: {
        type: 'booking',
        title: 'Booking Created',
        message: `Your booking has been created successfully. Booking #${context.bookingId || ''}`,
        data: { bookingId: context.bookingId }
      },
      booking_confirmed: {
        type: 'booking',
        title: 'Booking Confirmed',
        message: `Your booking has been confirmed. Booking #${context.bookingId || ''}`,
        data: { bookingId: context.bookingId }
      },
      booking_completed: {
        type: 'booking',
        title: 'Booking Completed',
        message: `Your booking has been completed. Thank you for using our service!`,
        data: { bookingId: context.bookingId }
      },
      booking_cancelled: {
        type: 'booking',
        title: 'Booking Cancelled',
        message: `Your booking has been cancelled. Booking #${context.bookingId || ''}`,
        data: { bookingId: context.bookingId }
      },
      payment_received: {
        type: 'payment',
        title: 'Payment Received',
        message: `Payment of ${context.amount || ''} has been received.`,
        data: { amount: context.amount, bookingId: context.bookingId }
      },
      payment_failed: {
        type: 'payment',
        title: 'Payment Failed',
        message: `Payment failed. Please try again or use a different payment method.`,
        data: { bookingId: context.bookingId }
      },
      new_message: {
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${context.senderName || 'a user'}.`,
        data: { senderId: context.senderId, chatId: context.chatId }
      },
      review_received: {
        type: 'review',
        title: 'New Review',
        message: `You received a new review. Rating: ${context.rating || ''} stars.`,
        data: { rating: context.rating, reviewId: context.reviewId }
      },
      welcome: {
        type: 'system',
        title: 'Welcome!',
        message: `Welcome to our platform! We're excited to have you onboard.`,
        data: {}
      },
      password_reset: {
        type: 'system',
        title: 'Password Reset',
        message: `Your password has been successfully reset.`,
        data: {}
      }
    };
    
    const templateData = templates[template];
    if (!templateData) {
      throw new Error(`Template "${template}" not found`);
    }
    
    return await this.create({
      user_id: userId,
      type: templateData.type,
      title: templateData.title,
      message: templateData.message,
      data: { ...templateData.data, ...context },
      link: context.link || null
    });
  }
}

export default Notification;