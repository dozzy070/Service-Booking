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

    // Check if user has any bookings
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
        b.status,
        b.total_amount,
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
    
    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        u.name as provider_name,
        u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.customer_id = $1
        AND b.status IN ('pending', 'confirmed')
        AND b.booking_date >= NOW()
      ORDER BY b.booking_date ASC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.json([]);
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
    const { new_date, reason } = req.body;
    
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
    
    await pool.query(
      `UPDATE bookings 
       SET booking_date = $1, 
           status = 'pending',
           reschedule_reason = $2,
           updated_at = NOW() 
       WHERE id = $3`,
      [new_date, reason || 'Customer requested reschedule', bookingId]
    );
    
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

router.get('/reminders', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const query = `
      SELECT
        b.id,
        b.service_id,
        b.provider_id,
        b.booking_date,
        b.status,
        s.title as service_title,
        u.name as provider_name,
        u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.customer_id = $1
        AND b.status = 'confirmed'
        AND b.booking_date >= CURRENT_DATE
        AND b.booking_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY b.booking_date ASC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.json([]);
  }
});

// =========================================================================
// REVIEWS
// =========================================================================

router.get('/reviews', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = ['r.reviewer_id = $1'];
    let params = [userId];
    let paramIndex = 2;
    
    if (rating && rating !== 'all') {
      conditions.push(`r.rating = $${paramIndex}`);
      params.push(parseInt(rating));
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total || 0);
    
    const query = `
      SELECT 
        r.*,
        s.title as service_title,
        u.name as provider_name,
        u.avatar as provider_avatar,
        u.phone as provider_phone
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      reviews: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, serviceId, rating, comment, images } = req.body;
    
    if (!bookingId || !serviceId || !rating) {
      return res.status(400).json({ message: 'Booking ID, Service ID, and rating are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const bookingCheck = await pool.query(
      'SELECT id FROM bookings WHERE id = $1 AND customer_id = $2 AND status = $3',
      [bookingId, userId, 'completed']
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Completed booking not found' });
    }
    
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
      [bookingId, userId]
    );
    
    if (reviewCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }
    
    // Get provider_id from booking
    const booking = await pool.query(
      'SELECT provider_id FROM bookings WHERE id = $1',
      [bookingId]
    );
    const providerId = booking.rows[0]?.provider_id;

    const result = await pool.query(
      `INSERT INTO reviews (reviewer_id, service_id, booking_id, provider_id, rating, comment, images, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [userId, serviceId, bookingId, providerId, rating, comment || '', images || []]
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
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Failed to add review' });
  }
});

router.get('/reviews/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    
    const result = await pool.query(`
      SELECT r.*, s.title as service_title, u.name as provider_name
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      WHERE r.id = $1 AND r.reviewer_id = $2
    `, [reviewId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching review details:', error);
    res.status(500).json({ message: 'Failed to fetch review details' });
  }
});

router.put('/reviews/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { rating, comment, images } = req.body;
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
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
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const review = result.rows[0];
    await pool.query(`
      UPDATE services 
      SET avg_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE service_id = $1
      )
      WHERE id = $1
    `, [review.service_id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review' });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2 RETURNING *',
      [reviewId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    const review = result.rows[0];
    await pool.query(`
      UPDATE services 
      SET avg_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE service_id = $1
      ),
      review_count = (
        SELECT COUNT(*) FROM reviews WHERE service_id = $1
      )
      WHERE id = $1
    `, [review.service_id]);
    
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
// WALLET - GET
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

export default router;