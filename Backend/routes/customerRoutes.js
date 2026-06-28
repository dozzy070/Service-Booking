// Backend/routes/customerRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import pool from '../config/db.js';
import {
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getPaymentSummary
} from '../controllers/paymentController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// =========================================================================
// NOTIFICATION PREFERENCES
// =========================================================================

// GET /api/customer/notification-preferences - Get user's notification preferences
router.get('/notification-preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if preferences table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notification_preferences'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        email_notifications: true,
        push_notifications: true,
        booking_updates: true,
        promotions: true,
        reminders: true
      });
    }
    
    const result = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences
      await pool.query(
        `INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, booking_updates, promotions, reminders)
         VALUES ($1, true, true, true, true, true)`,
        [userId]
      );
      
      return res.json({
        email_notifications: true,
        push_notifications: true,
        booking_updates: true,
        promotions: true,
        reminders: true
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.json({
      email_notifications: true,
      push_notifications: true,
      booking_updates: true,
      promotions: true,
      reminders: true
    });
  }
});

// PUT /api/customer/notification-preferences - Update notification preferences
router.put('/notification-preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { email_notifications, push_notifications, booking_updates, promotions, reminders } = req.body;
    
    // Check if preferences exist
    const existing = await pool.query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, booking_updates, promotions, reminders)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email_notifications !== false, push_notifications !== false, booking_updates !== false, promotions !== false, reminders !== false]
      );
    } else {
      await pool.query(
        `UPDATE notification_preferences 
         SET email_notifications = $1,
             push_notifications = $2,
             booking_updates = $3,
             promotions = $4,
             reminders = $5,
             updated_at = NOW()
         WHERE user_id = $6`,
        [email_notifications !== false, push_notifications !== false, booking_updates !== false, promotions !== false, reminders !== false, userId]
      );
    }
    
    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// =========================================================================
// PAYMENT METHODS
// =========================================================================

router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.put('/payment-methods/:id/default', setDefaultPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);
router.get('/payment-summary', getPaymentSummary);

// =========================================================================
// FAVORITES
// =========================================================================

router.get('/favorites', async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.category_id,
        c.name as category,
        s.price,
        s.duration,
        s.city as location,
        COALESCE(s.avg_rating, 0) as rating,
        COALESCE(s.review_count, 0) as review_count,
        u.name as provider_name,
        u.avatar as provider_avatar,
        s.images,
        f.created_at as favorited_at
      FROM favorites f
      JOIN services s ON f.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.json([]);
  }
});

router.post('/favorites/:serviceId', async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceId = req.params.serviceId;

    const check = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
      [userId, serviceId]
    );

    if (check.rows.length > 0) {
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND service_id = $2',
        [userId, serviceId]
      );
      res.json({ favorited: false, message: 'Removed from favorites' });
    } else {
      await pool.query(
        'INSERT INTO favorites (user_id, service_id) VALUES ($1, $2)',
        [userId, serviceId]
      );
      res.json({ favorited: true, message: 'Added to favorites' });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: 'Failed to toggle favorite' });
  }
});

router.get('/favorites/:serviceId/check', async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceId = req.params.serviceId;

    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
      [userId, serviceId]
    );

    res.json({ favorited: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
});

// =========================================================================
// DASHBOARD STATS
// =========================================================================

router.get('/dashboard/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const hasBookings = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE customer_id = $1',
      [userId]
    );

    if (parseInt(hasBookings.rows[0].count) === 0) {
      return res.json({
        totalBookings: 0,
        pendingBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
        totalProviders: 0,
        totalFavorites: 0,
        totalReviews: 0,
        loyaltyPoints: 0,
        tier: 'Bronze'
      });
    }

    const statsQuery = `
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status IN ('pending', 'confirmed') THEN 1 END) as upcoming_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as total_spent,
        COUNT(DISTINCT provider_id) as total_providers
      FROM bookings
      WHERE customer_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0] || {};

    const favorites = await pool.query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = $1',
      [userId]
    );

    const reviews = await pool.query(
      'SELECT COUNT(*) as count FROM reviews WHERE reviewer_id = $1',
      [userId]
    );

    const wallet = await pool.query(
      'SELECT points, tier FROM wallets WHERE user_id = $1',
      [userId]
    );

    res.json({
      totalBookings: parseInt(stats.total_bookings || 0),
      pendingBookings: parseInt(stats.pending_bookings || 0),
      upcomingBookings: parseInt(stats.upcoming_bookings || 0),
      completedBookings: parseInt(stats.completed_bookings || 0),
      cancelledBookings: parseInt(stats.cancelled_bookings || 0),
      totalSpent: parseFloat(stats.total_spent || 0),
      totalProviders: parseInt(stats.total_providers || 0),
      totalFavorites: parseInt(favorites.rows[0]?.count || 0),
      totalReviews: parseInt(reviews.rows[0]?.count || 0),
      loyaltyPoints: wallet.rows.length > 0 ? parseInt(wallet.rows[0].points || 0) : 0,
      tier: wallet.rows.length > 0 ? wallet.rows[0].tier || 'Bronze' : 'Bronze'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.json({
      totalBookings: 0,
      pendingBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
      totalProviders: 0,
      totalFavorites: 0,
      totalReviews: 0,
      loyaltyPoints: 0,
      tier: 'Bronze'
    });
  }
});

// =========================================================================
// RECENT BOOKINGS
// =========================================================================

router.get('/bookings/recent', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 4;

    const query = `
      SELECT
        b.id,
        b.service_id,
        b.provider_id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_amount,
        b.created_at,
        s.title as service_title,
        s.images,
        u.name as provider_name,
        u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.customer_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.json([]);
  }
});

// =========================================================================
// BOOKING HISTORY
// =========================================================================

router.get('/bookings/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = ['b.customer_id = $1'];
    let params = [userId];
    let paramIndex = 2;
    
    if (status && status !== 'all') {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (startDate) {
      conditions.push(`b.booking_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`b.booking_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.images as service_images,
        s.category_id,
        u.name as provider_name,
        u.avatar as provider_avatar,
        u.phone as provider_phone,
        COALESCE(r.rating, 0) as rating,
        r.id as review_id
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewer_id = b.customer_id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      bookings: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// UPCOMING BOOKINGS
// =========================================================================

router.get('/bookings/upcoming', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    console.log('📊 Fetching upcoming bookings for user:', userId);
    
    const query = `
      SELECT 
        b.id,
        b.service_id,
        b.provider_id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_amount,
        b.created_at,
        b.booking_number,
        s.title as service_title,
        s.images,
        u.name as provider_name,
        u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.customer_id = $1
        AND b.status IN ('pending', 'confirmed')
        AND b.booking_date >= NOW()
      ORDER BY b.booking_date ASC, b.booking_time ASC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    console.log('✅ Found bookings:', result.rows.length);
    
    const bookings = result.rows.map(booking => ({
      id: booking.id,
      service_id: booking.service_id,
      provider_id: booking.provider_id,
      service_name: booking.service_title || 'Service',
      provider_name: booking.provider_name || 'Provider',
      provider_avatar: booking.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider_name || 'Provider')}&background=10b981&color=fff`,
      date: booking.booking_date,
      time: booking.booking_time || new Date(booking.booking_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      amount: parseFloat(booking.total_amount) || 0,
      status: booking.status,
      booking_number: booking.booking_number,
      images: booking.images || []
    }));
    
    res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching upcoming bookings:', error);
    res.status(200).json([]);
  }
});

// =========================================================================
// BOOKING DETAILS
// =========================================================================

router.get('/bookings/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    
    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.description as service_description,
        s.price as service_price,
        s.images as service_images,
        u.name as provider_name,
        u.phone as provider_phone,
        u.email as provider_email,
        u.avatar as provider_avatar,
        u.address as provider_address,
        COALESCE(r.rating, 0) as rating,
        r.comment as review_comment
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewer_id = b.customer_id
      WHERE b.id = $1 AND b.customer_id = $2
    `;
    
    const result = await pool.query(query, [bookingId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Failed to fetch booking details' });
  }
});

// =========================================================================
// CANCEL BOOKING
// =========================================================================

router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { reason } = req.body;
    
    const check = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND customer_id = $2`,
      [bookingId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const currentStatus = check.rows[0].status;
    if (!['pending', 'confirmed'].includes(currentStatus)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }
    
    await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           cancellation_reason = $1,
           cancelled_at = NOW(),
           updated_at = NOW() 
       WHERE id = $2`,
      [reason || 'Customer requested cancellation', bookingId]
    );
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
});

// =========================================================================
// RESCHEDULE BOOKING
// =========================================================================

router.put('/bookings/:id/reschedule', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { new_date, new_time, reason } = req.body;
    
    if (!new_date) {
      return res.status(400).json({ message: 'New date is required' });
    }
    
    const check = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND customer_id = $2`,
      [bookingId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const currentStatus = check.rows[0].status;
    if (!['pending', 'confirmed'].includes(currentStatus)) {
      return res.status(400).json({ message: 'Booking cannot be rescheduled' });
    }
    
    let updateQuery = `UPDATE bookings SET booking_date = $1, status = 'pending', updated_at = NOW()`;
    let params = [new_date];
    let paramIndex = 2;
    
    if (new_time) {
      updateQuery += `, booking_time = $${paramIndex}`;
      params.push(new_time);
      paramIndex++;
    }
    
    if (reason) {
      updateQuery += `, reschedule_reason = $${paramIndex}`;
      params.push(reason);
      paramIndex++;
    }
    
    updateQuery += ` WHERE id = $${paramIndex}`;
    params.push(bookingId);
    
    await pool.query(updateQuery, params);
    
    res.json({ message: 'Booking rescheduled successfully' });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ message: 'Failed to reschedule booking' });
  }
});

// =========================================================================
// BOOKING STATS
// =========================================================================

router.get('/bookings/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'confirmed') THEN total_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END), 0) as average_spent,
        COUNT(DISTINCT provider_id) as total_providers
      FROM bookings
      WHERE customer_id = $1
    `, [userId]);
    
    res.json({
      total: parseInt(result.rows[0].total || 0),
      pending: parseInt(result.rows[0].pending || 0),
      confirmed: parseInt(result.rows[0].confirmed || 0),
      completed: parseInt(result.rows[0].completed || 0),
      cancelled: parseInt(result.rows[0].cancelled || 0),
      totalSpent: parseFloat(result.rows[0].total_spent || 0),
      pendingAmount: parseFloat(result.rows[0].pending_amount || 0),
      averageSpent: parseFloat(result.rows[0].average_spent || 0),
      totalProviders: parseInt(result.rows[0].total_providers || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// REMINDERS
// =========================================================================

// GET /api/customer/reviews - Get customer's reviews with pagination (FIXED)
router.get('/reviews', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, rating, sort = 'newest', search, service_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['r.reviewer_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (rating && rating !== 'all') {
      conditions.push(`r.rating = $${paramIndex}`);
      params.push(parseInt(rating));
      paramIndex++;
    }

    if (service_id) {
      conditions.push(`r.service_id = $${paramIndex}`);
      params.push(parseInt(service_id));
      paramIndex++;
    }

    if (search) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // ✅ FIX: Use string concatenation, NOT template literals
    const countQuery = 
      `SELECT COUNT(*) as total 
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      WHERE ` + whereClause;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    let orderBy = 'r.created_at DESC';
    switch (sort) {
      case 'oldest': orderBy = 'r.created_at ASC'; break;
      case 'highest': orderBy = 'r.rating DESC'; break;
      case 'lowest': orderBy = 'r.rating ASC'; break;
      case 'helpful': orderBy = 'r.helpful_count DESC'; break;
      default: orderBy = 'r.created_at DESC';
    }

    // ✅ FIX: Use string concatenation, NOT template literals
    const query = 
      `SELECT 
        r.*,
        s.title as service_name,
        s.id as service_id,
        u.name as provider_name,
        u.avatar as provider_avatar,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        COALESCE(r.helpful_count, 0) as helpful_count,
        CASE WHEN r.updated_at > r.created_at THEN true ELSE false END as is_edited
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      JOIN users reviewer ON r.reviewer_id = reviewer.id
      WHERE ` + whereClause + `
      ORDER BY ` + orderBy + `
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      reviews: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error fetching customer reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// GET /api/customer/reviews/stats - Get review statistics (ULTRA SIMPLE)
router.get('/reviews/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { service_id } = req.query;

    console.log('📊 [STATS] Starting for user:', userId);

    // Build a simple query without complex conditions
    let queryText = 'SELECT rating FROM reviews WHERE reviewer_id = $1';
    let queryParams = [userId];

    if (service_id) {
      queryText += ' AND service_id = $2';
      queryParams.push(parseInt(service_id));
    }

    console.log('📊 [STATS] Executing:', queryText);
    console.log('📊 [STATS] Params:', queryParams);

    const result = await pool.query(queryText, queryParams);
    const ratings = result.rows.map(row => row.rating);

    console.log('📊 [STATS] Found', ratings.length, 'reviews');

    // Calculate stats
    const total = ratings.length;
    const average = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : 0;

    // Calculate distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(rating => {
      if (rating >= 1 && rating <= 5) {
        distribution[Math.round(rating)]++;
      }
    });

    // Count reviews with images (if images column exists)
    let withPhotos = 0;
    try {
      const photoQuery = 'SELECT COUNT(*) as count FROM reviews WHERE reviewer_id = $1 AND images IS NOT NULL' + (service_id ? ' AND service_id = $2' : '');
      const photoResult = await pool.query(photoQuery, queryParams);
      withPhotos = parseInt(photoResult.rows[0]?.count || 0);
    } catch (photoError) {
      console.warn('⚠️ [STATS] Could not count photos:', photoError.message);
    }

    // Count verified purchases (if booking_id column exists)
    let verifiedPurchases = 0;
    try {
      const verifiedQuery = 'SELECT COUNT(*) as count FROM reviews WHERE reviewer_id = $1 AND booking_id IS NOT NULL' + (service_id ? ' AND service_id = $2' : '');
      const verifiedResult = await pool.query(verifiedQuery, queryParams);
      verifiedPurchases = parseInt(verifiedResult.rows[0]?.count || 0);
    } catch (verifiedError) {
      console.warn('⚠️ [STATS] Could not count verified purchases:', verifiedError.message);
    }

    const response = {
      total_reviews: total,
      average_rating: parseFloat(average.toFixed(1)),
      rating_distribution: distribution,
      verified_purchases: verifiedPurchases,
      with_photos: withPhotos,
      with_provider_response: 0
    };

    console.log('✅ [STATS] Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ [STATS] Error:', error.message);
    console.error('❌ [STATS] Stack:', error.stack);
    
    // Always return 200 with safe defaults
    res.status(200).json({
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verified_purchases: 0,
      with_photos: 0,
      with_provider_response: 0
    });
  }
});

router.post('/reviews/:id/report', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const existingReport = await pool.query(
      'SELECT id FROM review_reports WHERE review_id = $1 AND reporter_id = $2',
      [reviewId, userId]
    );

    if (existingReport.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    await pool.query(
      `INSERT INTO review_reports (review_id, reporter_id, reason, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())`,
      [reviewId, userId, reason]
    );

    res.json({ message: 'Review reported successfully' });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ message: 'Failed to report review' });
  }
});

// POST /api/customer/reviews/:id/helpful - Mark review as helpful
router.post('/reviews/:id/helpful', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const existingHelpful = await pool.query(
      'SELECT id FROM review_helpful WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (existingHelpful.rows.length > 0) {
      await pool.query(
        'DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );
      
      await pool.query(
        'UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = $1',
        [reviewId]
      );
      
      return res.json({ 
        message: 'Removed helpful vote',
        helpful: false
      });
    }

    await pool.query(
      'INSERT INTO review_helpful (review_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [reviewId, userId]
    );

    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [reviewId]
    );

    res.json({ 
      message: 'Marked as helpful',
      helpful: true
    });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ message: 'Failed to mark review helpful' });
  }
});

// PUT /api/customer/reviews/:id - Update a review
router.put('/reviews/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { rating, comment, images } = req.body;

    const check = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND reviewer_id = $2',
      [reviewId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or not authorized' });
    }

    const result = await pool.query(
      `UPDATE reviews 
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           images = COALESCE($3, images),
           updated_at = NOW()
       WHERE id = $4 AND reviewer_id = $5
       RETURNING *`,
      [rating, comment, images, reviewId, userId]
    );

    const review = result.rows[0];
    await pool.query(`
      UPDATE services 
      SET avg_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE service_id = $1
      )
      WHERE id = $1
    `, [review.service_id]);

    res.json({ 
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// DELETE /api/customer/reviews/:id - Delete a review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    const check = await pool.query(
      'SELECT service_id FROM reviews WHERE id = $1 AND reviewer_id = $2',
      [reviewId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or not authorized' });
    }

    const serviceId = check.rows[0].service_id;

    await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2',
      [reviewId, userId]
    );

    await pool.query(`
      UPDATE services 
      SET avg_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE service_id = $1
      ),
      review_count = (
        SELECT COUNT(*) FROM reviews WHERE service_id = $1
      )
      WHERE id = $1
    `, [serviceId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

// =========================================================================
// PROFILE
// =========================================================================

router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, address, city, state, zip_code, bio, avatar, created_at, is_active, verified
       FROM users WHERE id = $1 AND role = 'customer'`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, city, state, zip_code, bio, avatar } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        zip_code = COALESCE($6, zip_code),
        bio = COALESCE($7, bio),
        avatar = COALESCE($8, avatar),
        updated_at = NOW()
      WHERE id = $9 AND role = 'customer'
      RETURNING id, name, email, phone, address, city, state, zip_code, bio, avatar, created_at, is_active, verified`,
      [name, phone, address, city, state, zip_code, bio, avatar, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// =========================================================================
// FEATURED SERVICES
// =========================================================================

router.get('/featured-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.images,
        s.location,
        s.avg_rating,
        s.review_count,
        u.name as provider_name,
        c.name as category_name
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_featured = true AND s.status = 'approved' AND s.deleted_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.json([]);
  }
});

// =========================================================================
// TRENDING SERVICES
// =========================================================================

router.get('/trending-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.images,
        s.location,
        s.avg_rating,
        s.review_count,
        u.name as provider_name,
        c.name as category_name,
        COUNT(b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      WHERE s.status = 'approved' AND s.deleted_at IS NULL
      GROUP BY s.id, u.name, c.name
      ORDER BY booking_count DESC, s.avg_rating DESC
      LIMIT 5
    `);

    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching trending services:', error);
    res.json([]);
  }
});

// =========================================================================
// RECOMMENDED SERVICES
// =========================================================================

router.get('/recommended-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.images,
        s.location,
        s.avg_rating,
        s.review_count,
        u.name as provider_name,
        c.name as category_name
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.status = 'approved' AND s.deleted_at IS NULL
      ORDER BY s.avg_rating DESC, s.review_count DESC
      LIMIT 5
    `);

    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching recommended services:', error);
    res.json([]);
  }
});

// =========================================================================
// WALLET
// =========================================================================

router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM wallets WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        balance: 0,
        points: 0,
        tier: 'Bronze',
        lifetime_earnings: 0,
        total_withdrawn: 0,
        pending_payout: 0
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Failed to fetch wallet' });
  }
});

// =========================================================================
// CUSTOMER HELP CENTER - NEW
// =========================================================================

// ========================
// CUSTOMER FAQs
// ========================

// GET /api/customer/faqs - Get published FAQs for customers
router.get('/faqs', async (req, res) => {
  try {
    const { limit = 20, category, search } = req.query;
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'faqs'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json([]);
    }
    
    let conditions = ["status = 'published'"];
    let params = [];
    let paramIndex = 1;
    
    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(question ILIKE $${paramIndex} OR answer ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const query = `
      SELECT id, question, answer, category, icon, helpful_count, created_at
      FROM faqs
      WHERE ${whereClause}
      ORDER BY helpful_count DESC, created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer FAQs:', error);
    res.json([]);
  }
});

// ========================
// CUSTOMER SUPPORT TICKETS
// ========================

// GET /api/customer/tickets - Get customer's support tickets
router.get('/tickets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'support_tickets'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        tickets: [],
        total: 0,
        page: parseInt(page),
        totalPages: 0
      });
    }
    
    let conditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;
    
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countQuery = `SELECT COUNT(*) as total FROM support_tickets ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);
    
    const query = `
      SELECT * FROM support_tickets
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get messages for each ticket
    const ticketsWithMessages = await Promise.all(result.rows.map(async (ticket) => {
      const messages = await pool.query(
        'SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
        [ticket.id]
      );
      return { ...ticket, messages: messages.rows };
    }));
    
    res.json({
      tickets: ticketsWithMessages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    res.json({
      tickets: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
  }
});

// POST /api/customer/tickets - Create support ticket
router.post('/tickets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, category, priority = 'medium', message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }
    
    const ticketResult = await pool.query(`
      INSERT INTO support_tickets (user_id, subject, category, priority, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'open', NOW(), NOW())
      RETURNING *
    `, [userId, subject, category || 'general', priority]);
    
    const ticket = ticketResult.rows[0];
    
    await pool.query(`
      INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, created_at)
      VALUES ($1, $2, 'user', $3, NOW())
    `, [ticket.id, userId, message]);
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
});

// POST /api/customer/tickets/:id/reply - Reply to ticket
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    const ticketCheck = await pool.query(
      'SELECT id, status FROM support_tickets WHERE id = $1 AND user_id = $2',
      [ticketId, userId]
    );
    
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    if (ticketCheck.rows[0].status === 'closed') {
      return res.status(400).json({ message: 'Cannot reply to closed ticket' });
    }
    
    const result = await pool.query(`
      INSERT INTO ticket_messages (ticket_id, sender_id, sender_type, message, created_at)
      VALUES ($1, $2, 'user', $3, NOW())
      RETURNING *
    `, [ticketId, userId, message]);
    
    await pool.query(`
      UPDATE support_tickets 
      SET status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
          updated_at = NOW()
      WHERE id = $1
    `, [ticketId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ message: 'Failed to reply to ticket' });
  }
});

// ========================
// CUSTOMER ANNOUNCEMENTS
// ========================

// GET /api/customer/announcements - Get announcements for customers
router.get('/announcements', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'announcements'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json([]);
    }
    
    const result = await pool.query(`
      SELECT * FROM announcements 
      WHERE is_active = true
      ORDER BY created_at DESC 
      LIMIT $1
    `, [parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer announcements:', error);
    res.json([]);
  }
});

// ========================
// CUSTOMER KNOWLEDGE BASE
// ========================

// GET /api/customer/knowledge-base - Get knowledge base for customers
router.get('/knowledge-base', async (req, res) => {
  try {
    const { search, category, limit = 10 } = req.query;
    
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'knowledge_base'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json([]);
    }
    
    let conditions = ['is_published = true'];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const query = `
      SELECT id, title, content, category, tags, read_time, created_at, updated_at
      FROM knowledge_base
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer knowledge base:', error);
    res.json([]);
  }
});

// Backend/routes/customerRoutes.js

// GET /api/customer/reminders - Get customer reminders
router.get('/reminders', async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Check if reminders table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'customer_reminders'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Return empty array if table doesn't exist
      return res.json([]);
    }
    
    const result = await pool.query(`
      SELECT * FROM customer_reminders 
      WHERE customer_id = $1 
        AND is_read = false 
        AND reminder_date >= NOW()
      ORDER BY reminder_date ASC
      LIMIT 10
    `, [customerId]);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    // Return empty array on error instead of 404
    res.json([]);
  }
});

export default router;