import Notification from '../models/Notification.js';
import pool from '../config/db.js';

export const getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, is_read, type } = req.query;
    
    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    if (is_read !== undefined) {
      filters.is_read = is_read === 'true';
    }
    
    if (type) {
      filters.type = type;
    }
    
    const notifications = await Notification.findByUser(req.user.id, filters);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

export const getPreferences = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      const newPrefs = await pool.query(
        `INSERT INTO notification_preferences (user_id) 
         VALUES ($1) RETURNING *`,
        [req.user.id]
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
    const { email_notifications, push_notifications, sms_notifications } = req.body;
    
    const result = await pool.query(
      `UPDATE notification_preferences 
       SET email_notifications = COALESCE($1, email_notifications),
           push_notifications = COALESCE($2, push_notifications),
           sms_notifications = COALESCE($3, sms_notifications),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [email_notifications, push_notifications, sms_notifications, req.user.id]
    );
    
    if (result.rows.length === 0) {
      const newPrefs = await pool.query(
        `INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, sms_notifications)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, email_notifications, push_notifications, sms_notifications]
      );
      return res.json(newPrefs.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in updatePreferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNotification = async (userId, type, message, data = {}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      message,
      data
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const createBulkNotifications = async (userIds, type, message, data = {}) => {
  try {
    const notifications = await Notification.createForMultipleUsers(userIds, {
      type,
      message,
      data
    });
    
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};