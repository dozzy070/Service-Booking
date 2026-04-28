import pool from '../config/db.js';  // Fixed import path

class Notification {
  static async create(notificationData) {
    const { user_id, type, message, data = {} } = notificationData;
    
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, message, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [user_id, type, message, JSON.stringify(data)]
    );
    
    return result.rows[0];
  }

  static async findByUser(userId, filters = {}) {
    const { limit = 50, offset = 0, is_read, type } = filters;
    
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
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, updated_at = NOW() 
       WHERE user_id = $1 AND is_read = false RETURNING *`,
      [userId]
    );
    return result.rows;
  }

  static async deleteNotification(notificationId, userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async deleteAllRead(userId) {
    const result = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING *',
      [userId]
    );
    return result.rows;
  }

  static async getByType(userId, type, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 AND type = $2 
       ORDER BY created_at DESC LIMIT $3`,
      [userId, type, limit]
    );
    return result.rows;
  }

  static async getRecent(userId, days = 7) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 
       AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async createForMultipleUsers(userIds, notificationData) {
    const { type, message, data = {} } = notificationData;
    const values = [];
    const params = [];
    let paramIndex = 1;
    
    userIds.forEach(userId => {
      values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, NOW(), NOW())`);
      params.push(userId, type, message, JSON.stringify(data));
    });
    
    const query = `
      INSERT INTO notifications (user_id, type, message, data, created_at, updated_at)
      VALUES ${values.join(', ')}
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default Notification;