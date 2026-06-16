// controllers/notificationController.js
import Notification from '../models/Notification.js';
import pool from '../config/db.js';

// =========================================================================
// GET NOTIFICATIONS
// =========================================================================

export const getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, is_read, type, unreadOnly } = req.query;
    
    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    if (is_read !== undefined) {
      filters.is_read = is_read === 'true';
    }
    
    if (unreadOnly === 'true') {
      filters.is_read = false;
    }
    
    if (type) {
      filters.type = type;
    }
    
    const notifications = await Notification.findByUser(req.user.id, filters);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    // Get total count for pagination
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
      [req.user.id]
    );
    const total = parseInt(totalResult.rows[0].total);
    
    res.json({
      notifications,
      unreadCount,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total
      }
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET UNREAD COUNT
// =========================================================================

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// MARK NOTIFICATION AS READ
// =========================================================================

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.markAsRead(id, req.user.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// MARK ALL AS READ
// =========================================================================

export const markAllAsRead = async (req, res) => {
  try {
    const notifications = await Notification.markAllAsRead(req.user.id);
    
    res.json({
      message: 'All notifications marked as read',
      count: notifications.length
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// DELETE NOTIFICATION
// =========================================================================

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Notification.delete(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      message: 'Notification deleted successfully',
      unreadCount
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// DELETE ALL READ NOTIFICATIONS
// =========================================================================

export const deleteAllRead = async (req, res) => {
  try {
    const deleted = await Notification.deleteAllRead(req.user.id);
    
    res.json({
      message: 'All read notifications deleted',
      count: deleted.length
    });
  } catch (error) {
    console.error('Error in deleteAllRead:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET NOTIFICATIONS BY TYPE
// =========================================================================

export const getByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    
    const notifications = await Notification.getByType(req.user.id, type, parseInt(limit));
    
    res.json(notifications);
  } catch (error) {
    console.error('Error in getByType:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET RECENT NOTIFICATIONS
// =========================================================================

export const getRecent = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const notifications = await Notification.getRecent(req.user.id, parseInt(days));
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error in getRecent:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET NOTIFICATION STATISTICS
// =========================================================================

export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
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
        COUNT(CASE WHEN type = 'promotional' THEN 1 END) as promotional_notifications
      FROM notifications
      WHERE user_id = $1
    `, [userId]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GET NOTIFICATION TYPES
// =========================================================================

export const getTypes = async (req, res) => {
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
    console.error('Error in getTypes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// NOTIFICATION PREFERENCES
// =========================================================================

export const getPreferences = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
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
      
      const newPrefs = await pool.query(
        `INSERT INTO notification_preferences (
          user_id, email_notifications, push_notifications, sms_notifications,
          booking_alerts, payment_alerts, review_alerts, promotional_alerts,
          system_alerts, marketing_emails
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          req.user.id,
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
      return res.json(newPrefs.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in getPreferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
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
    
    const result = await pool.query(
      `UPDATE notification_preferences 
       SET email_notifications = COALESCE($1, email_notifications),
           push_notifications = COALESCE($2, push_notifications),
           sms_notifications = COALESCE($3, sms_notifications),
           booking_alerts = COALESCE($4, booking_alerts),
           payment_alerts = COALESCE($5, payment_alerts),
           review_alerts = COALESCE($6, review_alerts),
           promotional_alerts = COALESCE($7, promotional_alerts),
           system_alerts = COALESCE($8, system_alerts),
           marketing_emails = COALESCE($9, marketing_emails),
           updated_at = NOW()
       WHERE user_id = $10
       RETURNING *`,
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
        req.user.id
      ]
    );
    
    if (result.rows.length === 0) {
      const newPrefs = await pool.query(
        `INSERT INTO notification_preferences (
          user_id, email_notifications, push_notifications, sms_notifications,
          booking_alerts, payment_alerts, review_alerts, promotional_alerts,
          system_alerts, marketing_emails
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          req.user.id,
          email_notifications,
          push_notifications,
          sms_notifications,
          booking_alerts,
          payment_alerts,
          review_alerts,
          promotional_alerts,
          system_alerts,
          marketing_emails
        ]
      );
      return res.json(newPrefs.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in updatePreferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// CREATE NOTIFICATION
// =========================================================================

export const createNotification = async (userId, type, title, message, data = {}, link = null) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      message,
      data,
      link
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// =========================================================================
// CREATE BULK NOTIFICATIONS
// =========================================================================

export const createBulkNotifications = async (userIds, type, title, message, data = {}, link = null) => {
  try {
    const notifications = await Notification.createForMultipleUsers(userIds, {
      type,
      title,
      message,
      data,
      link
    });
    
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// =========================================================================
// SEND NOTIFICATION (API Endpoint)
// =========================================================================

export const sendNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, link } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'userId, type, title, and message are required' });
    }
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND is_active = true', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notification = await createNotification(userId, type, title, message, data, link);
    
    if (!notification) {
      return res.status(500).json({ message: 'Failed to create notification' });
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error in sendNotification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// SEND BULK NOTIFICATIONS (API Endpoint)
// =========================================================================

export const sendBulkNotifications = async (req, res) => {
  try {
    const { userIds, type, title, message, data, link } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }
    
    if (!type || !title || !message) {
      return res.status(400).json({ message: 'type, title, and message are required' });
    }
    
    // Verify all users exist
    const usersResult = await pool.query(
      'SELECT id FROM users WHERE id = ANY($1) AND is_active = true',
      [userIds]
    );
    
    const validUserIds = usersResult.rows.map(r => r.id);
    
    if (validUserIds.length === 0) {
      return res.status(404).json({ message: 'No valid users found' });
    }
    
    const notifications = await createBulkNotifications(validUserIds, type, title, message, data, link);
    
    res.status(201).json({
      message: `Sent ${notifications.length} notifications`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error in sendBulkNotifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// SUBSCRIBE/UNSUBSCRIBE
// =========================================================================

export const subscribe = async (req, res) => {
  try {
    const { types } = req.body;
    
    if (!types || !Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ message: 'Types array is required' });
    }
    
    // Update preferences for each type
    const validTypes = ['booking', 'payment', 'review', 'promotional', 'system'];
    const updates = [];
    
    for (const type of types) {
      if (validTypes.includes(type)) {
        const column = `${type}_alerts`;
        updates.push(pool.query(
          `UPDATE notification_preferences 
           SET ${column} = true, updated_at = NOW() 
           WHERE user_id = $1`,
          [req.user.id]
        ));
      }
    }
    
    await Promise.all(updates);
    
    // Fetch updated preferences
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({
      message: 'Subscribed to notification types',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Error in subscribe:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { types } = req.body;
    
    if (!types || !Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ message: 'Types array is required' });
    }
    
    // Update preferences for each type
    const validTypes = ['booking', 'payment', 'review', 'promotional', 'system'];
    const updates = [];
    
    for (const type of types) {
      if (validTypes.includes(type)) {
        const column = `${type}_alerts`;
        updates.push(pool.query(
          `UPDATE notification_preferences 
           SET ${column} = false, updated_at = NOW() 
           WHERE user_id = $1`,
          [req.user.id]
        ));
      }
    }
    
    await Promise.all(updates);
    
    // Fetch updated preferences
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({
      message: 'Unsubscribed from notification types',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Error in unsubscribe:', error);
    res.status(500).json({ message: 'Server error' });
  }
};