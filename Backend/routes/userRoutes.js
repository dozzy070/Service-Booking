import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// ---------- Setup for avatar uploads ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ---------- All routes require authentication ----------
router.use(protect);

// =========================================================================
// PROFILE & ACCOUNT MANAGEMENT
// =========================================================================

// POST /api/user/avatar - Upload profile picture
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/profile - Get user profile
router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, address, city, state, zip_code, bio, avatar, role, 
              verified, is_active, created_at, last_login 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', async (req, res) => {
  const { name, phone, address, city, state, zip_code, bio } = req.body;
  try {
    await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        zip_code = COALESCE($6, zip_code),
        bio = COALESCE($7, bio),
        updated_at = NOW()
       WHERE id = $8`,
      [name, phone, address, city, state, zip_code, bio, req.user.id]
    );
    
    // Fetch updated profile
    const result = await pool.query(
      'SELECT id, name, email, phone, address, city, state, zip_code, bio, avatar, role FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/change-password - Change user password
router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isValid = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    // If using JWT, logout is handled client-side
    // If using sessions, destroy session here
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/user/account - Delete user account
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has any active bookings
    const activeBookings = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE (customer_id = $1 OR provider_id = $1) 
       AND status NOT IN ('completed', 'cancelled')`,
      [userId]
    );
    
    if (parseInt(activeBookings.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete account with active bookings. Please complete or cancel them first.' 
      });
    }
    
    // Soft delete - deactivate account
    await pool.query(
      'UPDATE users SET is_active = false, deleted_at = NOW() WHERE id = $1',
      [userId]
    );
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// USER STATISTICS
// =========================================================================

// GET /api/user/stats - Get user statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole === 'customer') {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent,
          COUNT(DISTINCT provider_id) as total_providers,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as total_reviews
        FROM bookings b
        LEFT JOIN reviews r ON r.booking_id = b.id
        WHERE b.customer_id = $1
      `, [userId]);
      
      res.json({
        totalBookings: parseInt(result.rows[0].total_bookings),
        completedBookings: parseInt(result.rows[0].completed_bookings),
        pendingBookings: parseInt(result.rows[0].pending_bookings),
        cancelledBookings: parseInt(result.rows[0].cancelled_bookings),
        totalSpent: parseFloat(result.rows[0].total_spent),
        totalProviders: parseInt(result.rows[0].total_providers),
        averageRating: parseFloat(result.rows[0].average_rating),
        totalReviews: parseInt(result.rows[0].total_reviews)
      });
    } else if (userRole === 'provider') {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings,
          COUNT(DISTINCT customer_id) as total_customers,
          (SELECT COUNT(*) FROM services WHERE provider_id = $1 AND status = 'approved') as total_services,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as total_reviews
        FROM bookings b
        LEFT JOIN reviews r ON r.booking_id = b.id
        WHERE b.provider_id = $1
      `, [userId]);
      
      // Get pending service approvals
      const pendingServices = await pool.query(
        'SELECT COUNT(*) as pending FROM services WHERE provider_id = $1 AND status = \'pending\'',
        [userId]
      );
      
      res.json({
        totalBookings: parseInt(result.rows[0].total_bookings),
        completedBookings: parseInt(result.rows[0].completed_bookings),
        pendingBookings: parseInt(result.rows[0].pending_bookings),
        cancelledBookings: parseInt(result.rows[0].cancelled_bookings),
        totalEarnings: parseFloat(result.rows[0].total_earnings),
        totalCustomers: parseInt(result.rows[0].total_customers),
        totalServices: parseInt(result.rows[0].total_services),
        pendingServices: parseInt(pendingServices.rows[0].pending),
        averageRating: parseFloat(result.rows[0].average_rating),
        totalReviews: parseInt(result.rows[0].total_reviews)
      });
    } else {
      res.json({
        message: 'User role not recognized'
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/activity - Get user activity log
router.get('/activity', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    
    const result = await pool.query(`
      (SELECT 'booking' as type, id, 'created booking' as action, created_at as timestamp
       FROM bookings WHERE customer_id = $1 OR provider_id = $1)
      UNION
      (SELECT 'review' as type, id, 'left a review' as action, created_at as timestamp
       FROM reviews WHERE user_id = $1)
      UNION
      (SELECT 'service' as type, id, 'created service' as action, created_at as timestamp
       FROM services WHERE provider_id = $1)
      ORDER BY timestamp DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// NOTIFICATION PREFERENCES
// =========================================================================

// GET /api/user/notification-preferences
router.get('/notification-preferences', async (req, res) => {
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
        promotional_alerts: false
      };
      
      await pool.query(
        `INSERT INTO notification_preferences 
         (user_id, email_notifications, push_notifications, sms_notifications, 
          booking_alerts, payment_alerts, review_alerts, promotional_alerts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, defaultPrefs.email_notifications, defaultPrefs.push_notifications, 
         defaultPrefs.sms_notifications, defaultPrefs.booking_alerts, 
         defaultPrefs.payment_alerts, defaultPrefs.review_alerts, 
         defaultPrefs.promotional_alerts]
      );
      
      return res.json(defaultPrefs);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/notification-preferences
router.put('/notification-preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      email_notifications, 
      push_notifications, 
      sms_notifications, 
      booking_alerts, 
      payment_alerts, 
      review_alerts, 
      promotional_alerts 
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
        updated_at = NOW()
      WHERE user_id = $8`,
      [email_notifications, push_notifications, sms_notifications, booking_alerts, 
       payment_alerts, review_alerts, promotional_alerts, userId]
    );
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// CHAT & MESSAGING
// =========================================================================

// GET /api/user/available-for-chat
router.get('/available-for-chat', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentRole = req.user.role;
    let query;
    
    if (currentRole === 'provider') {
      query = `SELECT id, name, email, role, avatar FROM users 
               WHERE role IN ('customer', 'admin') AND id != $1 AND is_active = true 
               ORDER BY name`;
    } else if (currentRole === 'customer') {
      query = `SELECT id, name, email, role, avatar FROM users 
               WHERE role = 'provider' AND id != $1 AND is_active = true 
               ORDER BY name`;
    } else if (currentRole === 'admin') {
      query = `SELECT id, name, email, role, avatar FROM users 
               WHERE role = 'provider' AND id != $1 AND is_active = true 
               ORDER BY name`;
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

// GET /api/user/conversations - Get all conversations
router.get('/conversations', async (req, res) => {
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
               u.role as other_party_role,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
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
               u.role as other_party_role,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
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
               u.role as other_party_role,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
        FROM conversations c
        JOIN users u ON (u.id = c.provider_id)
        WHERE c.customer_id IS NOT NULL
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

// POST /api/user/conversations - Create new conversation
router.post('/conversations', async (req, res) => {
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
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/conversations/:id/messages - Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
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
    
    // Get messages
    const messages = await pool.query(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false`,
      [conversationId, userId]
    );
    
    res.json(messages.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/user/conversations/:id/messages - Send message
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const senderId = req.user.id;
    const { message, receiverId } = req.body;
    
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
    
    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [conversationId, senderId, receiverId, message.trim()]
    );
    
    // Update conversation last message time
    await pool.query(
      `UPDATE conversations SET last_message_time = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );
    
    // Get sender info
    const sender = await pool.query(
      'SELECT name, avatar FROM users WHERE id = $1',
      [senderId]
    );
    
    const newMessage = {
      ...result.rows[0],
      sender_name: sender.rows[0]?.name || 'User',
      sender_avatar: sender.rows[0]?.avatar || null
    };
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/conversations/:id/read - Mark all messages as read
router.put('/conversations/:id/read', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { messageIds } = req.body;
    
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      await pool.query(
        `UPDATE messages SET is_read = true, read_at = NOW()
         WHERE id = ANY($1) AND conversation_id = $2 AND receiver_id = $3`,
        [messageIds, conversationId, userId]
      );
    } else {
      // Mark all messages as read
      await pool.query(
        `UPDATE messages SET is_read = true, read_at = NOW()
         WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
        [conversationId, userId]
      );
    }
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/user/messages/:id - Delete a message
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
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// USER LISTING ENDPOINTS
// =========================================================================

// GET /api/user - Get users by roles
router.get('/', async (req, res) => {
  try {
    let roles = req.query.roles ? req.query.roles.split(',') : [];
    let search = req.query.search || '';
    
    if (roles.length === 0) {
      return res.json([]);
    }
    
    let query = `SELECT id, name, email, role, avatar FROM users WHERE role IN (${roles.map((_, i) => `$${i + 1}`).join(',')})`;
    let params = [...roles];
    let paramIndex = roles.length + 1;
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/search - Search users
router.get('/search', async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    let query = `SELECT id, name, email, role, avatar FROM users 
                 WHERE (name ILIKE $1 OR email ILIKE $1) AND is_active = true`;
    let params = [`%${q}%`];
    
    if (role) {
      query += ` AND role = $2`;
      params.push(role);
    }
    
    query += ` ORDER BY name LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PRIVACY SETTINGS
// =========================================================================

// GET /api/user/privacy-settings
router.get('/privacy-settings', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT profile_visibility, show_email, show_phone, show_address
       FROM privacy_settings WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default privacy settings
      const defaultSettings = {
        profile_visibility: 'public',
        show_email: false,
        show_phone: true,
        show_address: false
      };
      
      await pool.query(
        `INSERT INTO privacy_settings (user_id, profile_visibility, show_email, show_phone, show_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, defaultSettings.profile_visibility, defaultSettings.show_email, 
         defaultSettings.show_phone, defaultSettings.show_address]
      );
      
      return res.json(defaultSettings);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch privacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/privacy-settings
router.put('/privacy-settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { profile_visibility, show_email, show_phone, show_address } = req.body;
    
    await pool.query(
      `UPDATE privacy_settings SET 
        profile_visibility = COALESCE($1, profile_visibility),
        show_email = COALESCE($2, show_email),
        show_phone = COALESCE($3, show_phone),
        show_address = COALESCE($4, show_address),
        updated_at = NOW()
      WHERE user_id = $5`,
      [profile_visibility, show_email, show_phone, show_address, userId]
    );
    
    res.json({ message: 'Privacy settings updated' });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;