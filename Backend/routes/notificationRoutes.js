import express from 'express';
import { protect } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// =========================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =========================================================================
router.use(protect);

// =========================================================================
// NOTIFICATION CRUD OPERATIONS
// =========================================================================

// GET /api/notifications - Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type, unreadOnly } = req.query;
    
    let conditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;
    
    if (type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    
    if (unreadOnly === 'true') {
      conditions.push(`is_read = false`);
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countQuery = `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT * FROM notifications 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get unread count separately
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({
      notifications: result.rows,
      total,
      unreadCount: parseInt(unreadResult.rows[0].unread),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.json({ notifications: [], total: 0, unreadCount: 0 });
  }
});

// GET /api/notifications/unread/count - Get unread notification count
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error.message);
    res.json({ unreadCount: 0 });
  }
});

// GET /api/notifications/:id - Get a single notification
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW(), updated_at = NOW() 
       WHERE user_id = $1 AND is_read = false 
       RETURNING id`,
      [userId]
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error marking all as read:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications - Delete all notifications
router.delete('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    let query = 'DELETE FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }
    
    query += ' RETURNING id';
    
    const result = await pool.query(query, params);
    
    res.json({ 
      message: 'Notifications deleted successfully',
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error deleting notifications:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// NOTIFICATION PREFERENCES
// =========================================================================

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences
      const defaultPrefs = {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        booking_alerts: true,
        payment_alerts: true,
        review_alerts: true,
        promotional_alerts: false,
        system_alerts: true,
        marketing_emails: false
      };
      
      await pool.query(
        `INSERT INTO notification_preferences (
          user_id, email_notifications, push_notifications, sms_notifications, 
          booking_alerts, payment_alerts, review_alerts, promotional_alerts,
          system_alerts, marketing_emails
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId, 
          defaultPrefs.email_notifications, 
          defaultPrefs.push_notifications, 
          defaultPrefs.sms_notifications,
          defaultPrefs.booking_alerts, 
          defaultPrefs.payment_alerts, 
          defaultPrefs.review_alerts,
          defaultPrefs.promotional_alerts,
          defaultPrefs.system_alerts,
          defaultPrefs.marketing_emails
        ]
      );
      
      return res.json(defaultPrefs);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      email_notifications, 
      push_notifications, 
      sms_notifications, 
      booking_alerts, 
      payment_alerts, 
      review_alerts, 
      promotional_alerts,
      system_alerts,
      marketing_emails
    } = req.body;
    
    await pool.query(
      `UPDATE notification_preferences SET 
        email_notifications = COALESCE($1, email_notifications),
        push_notifications = COALESCE($2, push_notifications),
        sms_notifications = COALESCE($3, sms_notifications),
        booking_alerts = COALESCE($4, booking_alerts),
        payment_alerts = COALESCE($5, payment_alerts),
        review_alerts = COALESCE($6, review_alerts),
        promotional_alerts = COALESCE($7, promotional_alerts),
        system_alerts = COALESCE($8, system_alerts),
        marketing_emails = COALESCE($9, marketing_emails),
        updated_at = NOW()
      WHERE user_id = $10`,
      [
        email_notifications, 
        push_notifications, 
        sms_notifications, 
        booking_alerts, 
        payment_alerts, 
        review_alerts, 
        promotional_alerts,
        system_alerts,
        marketing_emails,
        userId
      ]
    );
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// NOTIFICATION TYPES & CATEGORIES
// =========================================================================

// GET /api/notifications/types - Get notification types
router.get('/types', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT type, COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 
       GROUP BY type 
       ORDER BY type`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notification types:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// NOTIFICATION STATISTICS
// =========================================================================

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = true THEN 1 END) as read,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as this_month,
        COUNT(CASE WHEN type = 'booking' THEN 1 END) as booking_notifications,
        COUNT(CASE WHEN type = 'payment' THEN 1 END) as payment_notifications,
        COUNT(CASE WHEN type = 'review' THEN 1 END) as review_notifications,
        COUNT(CASE WHEN type = 'system' THEN 1 END) as system_notifications,
        COUNT(CASE WHEN type = 'promotional' THEN 1 END) as promotional_notifications
      FROM notifications
      WHERE user_id = $1
    `, [userId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification stats:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// NOTIFICATION SUBSCRIPTIONS
// =========================================================================

// POST /api/notifications/subscribe - Subscribe to notification types
router.post('/subscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { types } = req.body; // Array of notification types to subscribe to
    
    if (!types || !Array.isArray(types)) {
      return res.status(400).json({ message: 'Types array is required' });
    }
    
    // Update preferences for each type
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const type of types) {
        await client.query(
          `UPDATE notification_preferences 
           SET ${type}_alerts = true, updated_at = NOW() 
           WHERE user_id = $1`,
          [userId]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Subscribed to notification types', types });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error subscribing to notifications:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications/unsubscribe - Unsubscribe from notification types
router.post('/unsubscribe', async (req, res) => {
  try {
    const userId = req.user.id;
    const { types } = req.body;
    
    if (!types || !Array.isArray(types)) {
      return res.status(400).json({ message: 'Types array is required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const type of types) {
        await client.query(
          `UPDATE notification_preferences 
           SET ${type}_alerts = false, updated_at = NOW() 
           WHERE user_id = $1`,
          [userId]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Unsubscribed from notification types', types });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// SEND NOTIFICATION (Internal - for other services)
// =========================================================================

// Helper function to create a notification (can be used by other routes)
export const createNotification = async (userId, type, title, message, data = {}, link = null) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data), link]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

// POST /api/notifications/send - Send a notification (admin only - for internal use)
router.post('/send', async (req, res) => {
  try {
    const { userId, type, title, message, data, link } = req.body;
    
    // Check if user is admin (optional)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'Only admins can send notifications' });
    // }
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'userId, type, title, and message are required' });
    }
    
    const notification = await createNotification(userId, type, title, message, data, link);
    
    if (!notification) {
      return res.status(500).json({ message: 'Failed to create notification' });
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications/bulk-send - Send notifications to multiple users (admin only)
router.post('/bulk-send', async (req, res) => {
  try {
    const { userIds, type, title, message, data, link } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }
    
    if (!type || !title || !message) {
      return res.status(400).json({ message: 'type, title, and message are required' });
    }
    
    const notifications = [];
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const userId of userIds) {
        const result = await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data, link, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING *`,
          [userId, type, title, message, JSON.stringify(data || {}), link]
        );
        notifications.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      res.status(201).json({
        message: `Sent ${notifications.length} notifications`,
        count: notifications.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error sending bulk notifications:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;