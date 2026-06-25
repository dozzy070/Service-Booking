import express from 'express';
import { body, query, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import pool from '../config/db.js';

const router = express.Router();

// =========================================================================
// VALIDATION RULES
// =========================================================================

const bookingValidation = [
  body('service_id').isInt().withMessage('Valid service ID is required'),
  body('booking_date').isISO8601().withMessage('Valid booking date is required'),
  body('booking_time').notEmpty().withMessage('Booking time is required'),
  body('notes').optional().isString(),
  body('location').optional().isString(),
  body('customer_name').optional().isString(),
  body('customer_phone').optional().isString(),
  body('customer_address').optional().isString()
];

const statusValidation = [
  body('status').isIn(['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'])
    .withMessage('Invalid status')
];

const rescheduleValidation = [
  body('new_date').isISO8601().withMessage('Valid new date is required'),
  body('new_time').optional().isString(),
  body('reason').optional().isString()
];

const rateValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString()
];

// =========================================================================
// ALL BOOKING ROUTES REQUIRE AUTHENTICATION
// =========================================================================
router.use(protect);

// =========================================================================
// BOOKING CREATION & MANAGEMENT
// =========================================================================

// POST /api/bookings - Create a new booking
router.post('/', bookingValidation, validate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      service_id, 
      booking_date, 
      booking_time,
      notes,
      location,
      customer_name,
      customer_phone,
      customer_address
    } = req.body;

    // Check if service exists and is approved
    const serviceCheck = await pool.query(
      `SELECT s.*, u.name as provider_name, u.id as provider_id
       FROM services s
       JOIN users u ON s.provider_id = u.id
       WHERE s.id = $1 AND (s.status = 'approved' OR s.status = 'active')`,
      [service_id]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found or not available' });
    }

    const service = serviceCheck.rows[0];

    // Check if the selected time slot is available
    const existingBooking = await pool.query(
      `SELECT id FROM bookings 
       WHERE service_id = $1 
         AND booking_date = $2 
         AND booking_time = $3 
         AND status NOT IN ('cancelled', 'rejected')`,
      [service_id, booking_date, booking_time]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (
        customer_id, provider_id, service_id, booking_date, booking_time,
        total_amount, status, notes, location,
        customer_name, customer_phone, customer_address
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId, service.provider_id, service_id, booking_date, booking_time,
        service.price, notes, location,
        customer_name || req.user.name, 
        customer_phone || req.user.phone,
        customer_address || req.user.address
      ]
    );

    // Create notification for provider
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'booking', 'New Booking Request', 
               $2, $3, $4)`,
      [
        service.provider_id,
        `New booking request for ${service.title}`,
        JSON.stringify({ bookingId: result.rows[0].id, serviceId: service_id }),
        `/provider/bookings/${result.rows[0].id}`
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

// GET /api/bookings - Get all bookings (with filters)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      startDate, 
      endDate,
      serviceId,
      providerId,
      customerId
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (userRole === 'customer') {
      conditions.push(`b.customer_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    } else if (userRole === 'provider') {
      conditions.push(`b.provider_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }
    
    // Additional filters
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
    if (serviceId) {
      conditions.push(`b.service_id = $${paramIndex}`);
      params.push(serviceId);
      paramIndex++;
    }
    if (providerId && userRole === 'admin') {
      conditions.push(`b.provider_id = $${paramIndex}`);
      params.push(providerId);
      paramIndex++;
    }
    if (customerId && userRole === 'admin') {
      conditions.push(`b.customer_id = $${paramIndex}`);
      params.push(customerId);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.images as service_images,
        s.price as service_price,
        u.name as provider_name,
        u.avatar as provider_avatar,
        u.phone as provider_phone,
        u.email as provider_email,
        u2.name as customer_name,
        u2.avatar as customer_avatar,
        u2.phone as customer_phone,
        u2.email as customer_email,
        COALESCE(r.rating, 0) as rating
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      JOIN users u2 ON b.customer_id = u2.id
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewer_id = b.customer_id
      ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
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
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// =========================================================================
// GET /api/bookings/upcoming - MUST COME BEFORE /:id
// =========================================================================

// GET /api/bookings/upcoming - Get upcoming bookings
router.get('/upcoming', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 10;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (userRole === 'customer') {
      conditions.push(`b.customer_id = $${paramIndex}`);
    } else if (userRole === 'provider') {
      conditions.push(`b.provider_id = $${paramIndex}`);
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    params.push(userId);
    paramIndex++;

    conditions.push(`b.status IN ('pending', 'confirmed')`);
    conditions.push(`b.booking_date >= CURRENT_DATE`);

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.images as service_images,
        u.name as other_party_name,
        u.avatar as other_party_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON u.id = CASE 
        WHEN $1 = b.customer_id THEN b.provider_id 
        ELSE b.customer_id 
      END
      WHERE ${whereClause}
      ORDER BY b.booking_date ASC, b.booking_time ASC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming bookings' });
  }
});

// =========================================================================
// GET /api/bookings/:id - MUST COME AFTER SPECIFIC ROUTES
// =========================================================================

// GET /api/bookings/:id - Get a single booking
router.get('/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if it's a valid integer
    if (isNaN(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.description as service_description,
        s.images as service_images,
        s.price as service_price,
        s.duration as service_duration,
        u.name as provider_name,
        u.avatar as provider_avatar,
        u.phone as provider_phone,
        u.email as provider_email,
        u.address as provider_address,
        u2.name as customer_name,
        u2.avatar as customer_avatar,
        u2.phone as customer_phone,
        u2.email as customer_email,
        u2.address as customer_address,
        COALESCE(r.rating, 0) as rating,
        r.comment as review_comment
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      JOIN users u2 ON b.customer_id = u2.id
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewer_id = b.customer_id
      WHERE b.id = $1
    `;
    
    const result = await pool.query(query, [bookingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = result.rows[0];
    
    // Check authorization
    const isAuthorized = userRole === 'admin' || 
                         booking.customer_id === userId || 
                         booking.provider_id === userId;
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:id - Update booking (admin only)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status, booking_date, booking_time, total_amount, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE bookings SET 
        status = COALESCE($1, status),
        booking_date = COALESCE($2, booking_date),
        booking_time = COALESCE($3, booking_time),
        total_amount = COALESCE($4, total_amount),
        notes = COALESCE($5, notes),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [status, booking_date, booking_time, total_amount, notes, bookingId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

// =========================================================================
// BOOKING STATUS MANAGEMENT
// =========================================================================

// PUT /api/bookings/:id/status - Update booking status (provider/admin)
router.put('/:id/status', authorize('provider', 'admin'), statusValidation, validate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get booking details
    const bookingCheck = await pool.query(
      `SELECT b.*, s.title as service_title, s.provider_id
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check authorization
    if (userRole !== 'admin' && booking.provider_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled', 'rejected'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': ['cancelled'],
      'cancelled': [],
      'rejected': []
    };

    const allowedStatuses = validTransitions[booking.status] || [];
    if (!allowedStatuses.includes(status) && booking.status !== status) {
      return res.status(400).json({ 
        message: `Cannot transition from ${booking.status} to ${status}` 
      });
    }

    // Update booking status
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, 
           status_reason = $2,
           updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, reason || null, bookingId]
    );

    // Create notification for customer
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'booking', 'Booking Status Updated', 
               $2, $3, $4)`,
      [
        booking.customer_id,
        `Your booking for "${booking.service_title}" is now ${status}`,
        JSON.stringify({ bookingId, status }),
        `/customer/bookings/${bookingId}`
      ]
    );

    res.json({
      message: `Booking status updated to ${status}`,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    // Get booking details
    const bookingCheck = await pool.query(
      `SELECT b.*, s.title as service_title
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check authorization
    const isAuthorized = userRole === 'admin' || 
                         booking.customer_id === userId || 
                         booking.provider_id === userId;

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking cannot be cancelled' });
    }

    // Update booking
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', 
           cancellation_reason = $1,
           updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [reason || 'Customer requested cancellation', bookingId]
    );

    // Create notification for other party
    const notifyUserId = booking.customer_id === userId ? booking.provider_id : booking.customer_id;
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'booking', 'Booking Cancelled', 
               $2, $3, $4)`,
      [
        notifyUserId,
        `Booking for "${booking.service_title}" has been cancelled`,
        JSON.stringify({ bookingId, cancelledBy: userRole }),
        `/${userRole === 'customer' ? 'provider' : 'customer'}/bookings/${bookingId}`
      ]
    );

    res.json({ 
      message: 'Booking cancelled successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
});

// PUT /api/bookings/:id/reschedule - Reschedule a booking
router.put('/:id/reschedule', rescheduleValidation, validate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { new_date, new_time, reason } = req.body;

    // Get booking details
    const bookingCheck = await pool.query(
      `SELECT b.*, s.title as service_title
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check authorization
    const isAuthorized = userRole === 'admin' || 
                         booking.customer_id === userId || 
                         booking.provider_id === userId;

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to reschedule this booking' });
    }

    // Check if booking can be rescheduled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking cannot be rescheduled' });
    }

    // Check if new time slot is available
    if (new_time) {
      const existingBooking = await pool.query(
        `SELECT id FROM bookings 
         WHERE service_id = $1 
           AND booking_date = $2 
           AND booking_time = $3 
           AND status NOT IN ('cancelled', 'rejected')
           AND id != $4`,
        [booking.service_id, new_date, new_time, bookingId]
      );

      if (existingBooking.rows.length > 0) {
        return res.status(400).json({ message: 'The selected time slot is already booked' });
      }
    }

    // Update booking
    const result = await pool.query(
      `UPDATE bookings 
       SET booking_date = COALESCE($1, booking_date),
           booking_time = COALESCE($2, booking_time),
           status = 'pending',
           reschedule_reason = $3,
           updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [new_date, new_time || booking.booking_time, reason || null, bookingId]
    );

    // Create notification for other party
    const notifyUserId = booking.customer_id === userId ? booking.provider_id : booking.customer_id;
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'booking', 'Booking Rescheduled', 
               $2, $3, $4)`,
      [
        notifyUserId,
        `Booking for "${booking.service_title}" has been rescheduled`,
        JSON.stringify({ bookingId, newDate: new_date, newTime: new_time }),
        `/${userRole === 'customer' ? 'provider' : 'customer'}/bookings/${bookingId}`
      ]
    );

    res.json({ 
      message: 'Booking rescheduled successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ message: 'Failed to reschedule booking' });
  }
});

// PUT /api/bookings/:id/complete - Complete a booking (provider/admin)
router.put('/:id/complete', authorize('provider', 'admin'), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get booking details
    const bookingCheck = await pool.query(
      `SELECT b.*, s.title as service_title, s.provider_id
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check authorization
    if (userRole !== 'admin' && booking.provider_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    // Check if booking can be completed
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ message: 'Booking must be in progress to complete' });
    }

    // Update booking
    const result = await pool.query(
      `UPDATE bookings 
       SET status = 'completed', 
           completed_at = NOW(),
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [bookingId]
    );

    // Update provider wallet earnings
    await pool.query(
      `UPDATE wallets 
       SET balance = balance + $1,
           lifetime_earnings = lifetime_earnings + $1
       WHERE user_id = $2`,
      [booking.total_amount, booking.provider_id]
    );

    // Create notification for customer
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'booking', 'Booking Completed', 
               $2, $3, $4)`,
      [
        booking.customer_id,
        `Your booking for "${booking.service_title}" has been completed`,
        JSON.stringify({ bookingId }),
        `/customer/bookings/${bookingId}`
      ]
    );

    res.json({ 
      message: 'Booking completed successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ message: 'Failed to complete booking' });
  }
});

// =========================================================================
// BOOKING RATING
// =========================================================================

// PUT /api/bookings/:id/rate - Rate a booking (customer only)
router.put('/:id/rate', rateValidation, validate, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Get booking details
    const bookingCheck = await pool.query(
      `SELECT b.*, s.id as service_id
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [bookingId, userId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not authorized' });
    }

    const booking = bookingCheck.rows[0];

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed bookings' });
    }

    // Check if already rated
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'This booking has already been rated' });
    }

    // Create review
    const result = await pool.query(
      `INSERT INTO reviews (user_id, service_id, booking_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [userId, booking.service_id, bookingId, rating, comment || '']
    );

    // Update service average rating
    await pool.query(`
      UPDATE services 
      SET avg_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE service_id = $1
      ),
      review_count = (
        SELECT COUNT(*) FROM reviews WHERE service_id = $1
      )
      WHERE id = $1
    `, [booking.service_id]);

    // Update booking with rating
    await pool.query(
      'UPDATE bookings SET rating = $1 WHERE id = $2',
      [rating, bookingId]
    );

    res.status(201).json({
      message: 'Rating submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error rating booking:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// =========================================================================
// BOOKING STATISTICS
// =========================================================================

// GET /api/bookings/stats - Get booking statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    if (userRole === 'customer') {
      query = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent,
          COALESCE(SUM(CASE WHEN status IN ('pending', 'confirmed', 'in_progress') THEN total_amount ELSE 0 END), 0) as pending_amount
        FROM bookings
        WHERE customer_id = $1
      `;
    } else if (userRole === 'provider') {
      query = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status IN ('pending', 'confirmed', 'in_progress') THEN total_amount ELSE 0 END), 0) as pending_amount
        FROM bookings
        WHERE provider_id = $1
      `;
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    const result = await pool.query(query, [userId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ message: 'Failed to fetch booking stats' });
  }
});

// =========================================================================
// USER BOOKINGS
// =========================================================================

// GET /api/bookings/my-bookings - Get user's bookings
router.get('/my-bookings', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (userRole === 'customer') {
      conditions.push(`customer_id = $${paramIndex}`);
    } else if (userRole === 'provider') {
      conditions.push(`provider_id = $${paramIndex}`);
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    params.push(userId);
    paramIndex++;

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM bookings WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.images as service_images,
        u.name as other_party_name,
        u.avatar as other_party_avatar,
        u.phone as other_party_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON u.id = CASE 
        WHEN $1 = b.customer_id THEN b.provider_id 
        ELSE b.customer_id 
      END
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
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
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// =========================================================================
// AVAILABLE SLOTS
// =========================================================================

// GET /api/bookings/available-slots - Get available slots for a service
router.get('/available-slots', async (req, res) => {
  try {
    const { service_id, date } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({ message: 'Service ID and date are required' });
    }

    // Get service details
    const service = await pool.query(
      'SELECT provider_id, duration FROM services WHERE id = $1',
      [service_id]
    );

    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const providerId = service.rows[0].provider_id;
    const duration = service.rows[0].duration || 60;

    // Get provider's schedule for the day
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const schedule = await pool.query(
      `SELECT start_time, end_time
       FROM provider_schedules
       WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true`,
      [providerId, dayOfWeek]
    );

    if (schedule.rows.length === 0) {
      return res.json({ available: [], booked: [], peak_hours: [] });
    }

    // Generate time slots (30-minute intervals)
    const slots = [];
    const durationMinutes = parseInt(duration);
    const intervalMinutes = 30;

    schedule.rows.forEach(row => {
      const start = new Date(`1970-01-01T${row.start_time}`);
      const end = new Date(`1970-01-01T${row.end_time}`);
      let current = new Date(start);

      while (current < end) {
        const timeStr = current.toTimeString().slice(0, 5);
        slots.push(timeStr);
        current.setMinutes(current.getMinutes() + intervalMinutes);
      }
    });

    // Get existing bookings for the date
    const bookings = await pool.query(
      `SELECT booking_time FROM bookings
       WHERE service_id = $1 AND booking_date::date = $2
         AND status NOT IN ('cancelled', 'rejected')`,
      [service_id, date]
    );

    const bookedSlots = bookings.rows.map(b => b.booking_time);
    const availableSlots = slots.filter(s => !bookedSlots.includes(s));

    // Peak hours (10am-12pm and 4pm-6pm)
    const peakHours = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];

    res.json({
      available: availableSlots,
      booked: bookedSlots,
      time_slots: slots,
      peak_hours: peakHours,
      duration: durationMinutes
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
});

// =========================================================================
// PROVIDER BOOKINGS (Legacy - kept for backward compatibility)
// =========================================================================

// GET /api/bookings/provider/:providerId - Get provider's bookings
router.get('/provider/:providerId', authorize('provider', 'admin'), async (req, res) => {
  try {
    const providerId = req.params.providerId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== parseInt(providerId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let conditions = ['b.provider_id = $1'];
    let params = [providerId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM bookings b WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        u.name as customer_name,
        u.avatar as customer_avatar,
        u.phone as customer_phone,
        u.email as customer_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.customer_id = u.id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC, b.booking_time DESC
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
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ message: 'Failed to fetch provider bookings' });
  }
});

export default router;