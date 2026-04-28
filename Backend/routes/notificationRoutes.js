import express from 'express';
import { protect } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    
    res.json({
      notifications: result.rows,
      unreadCount: result.rows.filter(n => !n.is_read).length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    // Return empty array instead of error to prevent UI crashes
    res.json({ notifications: [], unreadCount: 0 });
  }
});

// Get unread count
router.get('/unread/count', protect, async (req, res) => {
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

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, updated_at = NOW() 
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

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, updated_at = NOW() 
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

// Delete notification
router.delete('/:id', protect, async (req, res) => {
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
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;