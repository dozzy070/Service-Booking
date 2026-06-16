// controllers/bookingController.js
import pool from '../config/db.js';
import Notification from '../models/Notification.js';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

const formatBooking = (row) => ({
  id: row.id,
  service_id: row.service_id,
  service_title: row.service_title || row.service_title,
  provider_id: row.provider_id,
  provider_name: row.provider_name || row.provider_name,
  customer_id: row.customer_id,
  customer_name: row.customer_name || row.customer_name,
  booking_date: row.booking_date,
  booking_time: row.booking_time,
  status: row.status,
  total_amount: parseFloat(row.total_amount || 0),
  payment_status: row.payment_status || 'pending',
  notes: row.notes,
  cancellation_reason: row.cancellation_reason,
  reschedule_reason: row.reschedule_reason,
  rating: row.rating,
  review: row.review,
  created_at: row.created_at,
  updated_at: row.updated_at,
  completed_at: row.completed_at
});

const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// =========================================================================
// CREATE BOOKING
// =========================================================================

export const createBooking = async (req, res) => {
  const { service_id, booking_date, booking_time, notes, location, customer_name, customer_phone, customer_address } = req.body;
  const customer_id = req.user.id;

  try {
    // Get service details
    const serviceRes = await pool.query(
      `SELECT s.id, s.title, s.price, s.provider_id, u.name as provider_name
       FROM services s
       JOIN users u ON u.id = s.provider_id
       WHERE s.id = $1 AND (s.status = 'approved' OR s.status = 'active')`,
      [service_id]
    );
    
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found or not available' });
    }
    
    const service = serviceRes.rows[0];

    // Check for overlapping bookings
    const overlapCheck = await pool.query(
      `SELECT id FROM bookings
       WHERE provider_id = $1 AND booking_date = $2 AND booking_time = $3
       AND status NOT IN ('cancelled', 'rejected')`,
      [service.provider_id, booking_date, booking_time]
    );
    
    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Time slot already booked' });
    }

    const result = await pool.query(
      `INSERT INTO bookings (
        service_id, customer_id, provider_id, booking_date, booking_time,
        total_amount, notes, location, customer_name, customer_phone, customer_address,
        status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending')
      RETURNING *`,
      [
        service_id, customer_id, service.provider_id, booking_date, booking_time,
        service.price, notes || null, location || null,
        customer_name || req.user.name,
        customer_phone || req.user.phone,
        customer_address || req.user.address
      ]
    );

    const booking = formatBooking(result.rows[0]);
    booking.service_title = service.title;
    booking.provider_name = service.provider_name;

    // Create notifications
    try {
      await Notification.create({
        user_id: customer_id,
        type: 'booking_created',
        title: 'Booking Created',
        message: `Your booking for ${service.title} has been created successfully.`,
        data: { booking_id: booking.id, service_id, provider_id: service.provider_id },
        link: `/customer/bookings/${booking.id}`
      });

      await Notification.create({
        user_id: service.provider_id,
        type: 'new_booking',
        title: 'New Booking Request',
        message: `You have a new booking request for ${service.title}.`,
        data: { booking_id: booking.id, service_id, customer_id },
        link: `/provider/bookings/${booking.id}`
      });
    } catch (notificationError) {
      console.error('Error creating booking notifications:', notificationError);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

// =========================================================================
// GET BOOKINGS
// =========================================================================

export const getBookings = async (req, res) => {
  try {
    let query;
    let params = [];
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (req.user.role === 'admin') {
      query = `
        SELECT b.*, s.title as service_title, u.name as provider_name, c.name as customer_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN users u ON u.id = b.provider_id
        JOIN users c ON c.id = b.customer_id
        WHERE 1=1
      `;
    } else if (req.user.role === 'provider') {
      query = `
        SELECT b.*, s.title as service_title, u.name as customer_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN users u ON u.id = b.customer_id
        WHERE b.provider_id = $1
      `;
      params.push(req.user.id);
    } else { // customer
      query = `
        SELECT b.*, s.title as service_title, u.name as provider_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN users u ON u.id = b.provider_id
        WHERE b.customer_id = $1
      `;
      params.push(req.user.id);
    }

    let paramIndex = params.length + 1;

    if (status && status !== 'all') {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (s.title ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND b.booking_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND b.booking_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY b.booking_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM (' + query.replace(/ORDER BY.*/, '') + ') as subquery', params.slice(0, -2));
    
    const bookings = result.rows.map(formatBooking);
    res.json({
      bookings,
      total: parseInt(totalResult.rows[0]?.total || 0),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(totalResult.rows[0]?.total || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

// =========================================================================
// GET BOOKING BY ID
// =========================================================================

export const getBookingById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, 
              s.title as service_title, s.description as service_description, s.price as service_price,
              u.name as provider_name, u.avatar as provider_avatar, u.phone as provider_phone, u.email as provider_email,
              c.name as customer_name, c.avatar as customer_avatar, c.phone as customer_phone, c.email as customer_email
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.provider_id
       JOIN users c ON c.id = b.customer_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = formatBooking(result.rows[0]);
    booking.service_title = result.rows[0].service_title;
    booking.service_description = result.rows[0].service_description;
    booking.service_price = parseFloat(result.rows[0].service_price || 0);
    booking.provider_name = result.rows[0].provider_name;
    booking.provider_avatar = result.rows[0].provider_avatar;
    booking.provider_phone = result.rows[0].provider_phone;
    booking.provider_email = result.rows[0].provider_email;
    booking.customer_name = result.rows[0].customer_name;
    booking.customer_avatar = result.rows[0].customer_avatar;
    booking.customer_phone = result.rows[0].customer_phone;
    booking.customer_email = result.rows[0].customer_email;
    
    res.json(booking);
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
};

// =========================================================================
// UPDATE BOOKING STATUS
// =========================================================================

export const updateBookingStatus = async (req, res) => {
  const { status, reason } = req.body;
  const bookingId = req.params.id;
  
  try {
    // Get booking details before update
    const bookingQuery = await pool.query(
      `SELECT b.*, s.title as service_title, u.name as provider_name, c.name as customer_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.provider_id
       JOIN users c ON c.id = b.customer_id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const oldBooking = bookingQuery.rows[0];
    
    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled', 'rejected'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': ['cancelled'],
      'cancelled': [],
      'rejected': []
    };

    const allowedStatuses = validTransitions[oldBooking.status] || [];
    if (!allowedStatuses.includes(status) && oldBooking.status !== status) {
      return res.status(400).json({ 
        message: `Cannot transition from ${oldBooking.status} to ${status}` 
      });
    }

    const result = await pool.query(
      `UPDATE bookings SET 
        status = $1, 
        status_reason = $2,
        updated_at = NOW(),
        completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = $3 RETURNING *`,
      [status, reason || null, bookingId]
    );

    const updatedBooking = result.rows[0];

    // Create notifications
    try {
      const statusMessages = {
        confirmed: `Your booking for ${oldBooking.service_title} has been confirmed.`,
        in_progress: `Your booking for ${oldBooking.service_title} is now in progress.`,
        completed: `Your booking for ${oldBooking.service_title} has been completed.`,
        cancelled: `Your booking for ${oldBooking.service_title} has been cancelled.`,
        rejected: `Your booking for ${oldBooking.service_title} has been rejected.`
      };

      if (statusMessages[status]) {
        await Notification.create({
          user_id: oldBooking.customer_id,
          type: 'booking_status_update',
          title: 'Booking Status Updated',
          message: statusMessages[status],
          data: { booking_id: bookingId, old_status: oldBooking.status, new_status: status },
          link: `/customer/bookings/${bookingId}`
        });
      }
    } catch (notificationError) {
      console.error('Error creating status update notifications:', notificationError);
    }

    res.json(formatBooking(updatedBooking));
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

// =========================================================================
// CANCEL BOOKING
// =========================================================================

export const cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
  const { reason } = req.body;
  const userId = req.user.id;
  
  try {
    const check = await pool.query(
      `SELECT id, customer_id, provider_id, status FROM bookings WHERE id = $1`,
      [bookingId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = check.rows[0];
    if (booking.customer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking cannot be cancelled' });
    }

    const result = await pool.query(
      `UPDATE bookings SET 
        status = 'cancelled', 
        cancellation_reason = $1,
        updated_at = NOW() 
      WHERE id = $2 RETURNING *`,
      [reason || 'Customer requested cancellation', bookingId]
    );
    
    // Create notification for provider
    await Notification.create({
      user_id: booking.provider_id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Booking for ${booking.service_title} has been cancelled.`,
      data: { booking_id: bookingId },
      link: `/provider/bookings/${bookingId}`
    });

    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

// =========================================================================
// RESCHEDULE BOOKING
// =========================================================================

export const rescheduleBooking = async (req, res) => {
  const { new_date, new_time, reason } = req.body;
  const bookingId = req.params.id;
  const userId = req.user.id;
  
  try {
    const check = await pool.query(
      `SELECT b.*, s.title as service_title
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.id = $1`,
      [bookingId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = check.rows[0];
    if (booking.customer_id !== userId && booking.provider_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking cannot be rescheduled' });
    }

    // Check availability of new slot
    if (new_time) {
      const overlapCheck = await pool.query(
        `SELECT id FROM bookings
         WHERE provider_id = $1 AND booking_date = $2 AND booking_time = $3
         AND status NOT IN ('cancelled', 'rejected')
         AND id != $4`,
        [booking.provider_id, new_date, new_time, bookingId]
      );
      
      if (overlapCheck.rows.length > 0) {
        return res.status(409).json({ message: 'The selected time slot is already booked' });
      }
    }

    const result = await pool.query(
      `UPDATE bookings SET 
        booking_date = COALESCE($1, booking_date),
        booking_time = COALESCE($2, booking_time),
        status = 'pending',
        reschedule_reason = $3,
        updated_at = NOW()
      WHERE id = $4 RETURNING *`,
      [new_date, new_time || booking.booking_time, reason || null, bookingId]
    );

    // Create notification for provider and customer
    const notifyUserId = booking.customer_id === userId ? booking.provider_id : booking.customer_id;
    await Notification.create({
      user_id: notifyUserId,
      type: 'booking_rescheduled',
      title: 'Booking Rescheduled',
      message: `Booking for ${booking.service_title} has been rescheduled.`,
      data: { booking_id: bookingId, new_date, new_time },
      link: `/customer/bookings/${bookingId}`
    });

    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ message: 'Failed to reschedule' });
  }
};

// =========================================================================
// COMPLETE BOOKING
// =========================================================================

export const completeBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  
  try {
    const check = await pool.query(
      `SELECT b.*, s.title as service_title, s.provider_id
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.id = $1`,
      [bookingId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = check.rows[0];
    if (booking.provider_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ message: 'Booking must be in progress to complete' });
    }

    const result = await pool.query(
      `UPDATE bookings SET 
        status = 'completed', 
        completed_at = NOW(),
        updated_at = NOW() 
      WHERE id = $1 RETURNING *`,
      [bookingId]
    );

    // Update provider earnings
    await pool.query(
      `UPDATE wallets 
       SET balance = balance + $1,
           lifetime_earnings = lifetime_earnings + $1
       WHERE user_id = $2`,
      [booking.total_amount, booking.provider_id]
    );

    // Create notification for customer
    await Notification.create({
      user_id: booking.customer_id,
      type: 'booking_completed',
      title: 'Booking Completed',
      message: `Your booking for ${booking.service_title} has been completed.`,
      data: { booking_id: bookingId },
      link: `/customer/bookings/${bookingId}`
    });

    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Failed to complete booking' });
  }
};

// =========================================================================
// START BOOKING
// =========================================================================

export const startBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  
  try {
    const check = await pool.query(
      `SELECT b.*, s.title as service_title
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.id = $1`,
      [bookingId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = check.rows[0];
    if (booking.provider_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed to start' });
    }

    const result = await pool.query(
      `UPDATE bookings SET 
        status = 'in_progress', 
        updated_at = NOW() 
      WHERE id = $1 RETURNING *`,
      [bookingId]
    );

    // Create notification for customer
    await Notification.create({
      user_id: booking.customer_id,
      type: 'booking_started',
      title: 'Booking Started',
      message: `Your booking for ${booking.service_title} has started.`,
      data: { booking_id: bookingId },
      link: `/customer/bookings/${bookingId}`
    });

    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Start booking error:', error);
    res.status(500).json({ message: 'Failed to start booking' });
  }
};

// =========================================================================
// RATE BOOKING
// =========================================================================

export const rateBooking = async (req, res) => {
  const bookingId = req.params.id;
  const { rating, comment, images } = req.body;
  const userId = req.user.id;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  
  try {
    const check = await pool.query(
      `SELECT b.*, s.title as service_title, s.id as service_id
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE b.id = $1 AND b.customer_id = $2 AND b.status = 'completed'`,
      [bookingId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or not completed' });
    }
    
    const booking = check.rows[0];

    // Check if already rated
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND user_id = $2',
      [bookingId, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'This booking has already been rated' });
    }

    // Insert review
    await pool.query(
      `INSERT INTO reviews (user_id, service_id, booking_id, rating, comment, images, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, booking.service_id, bookingId, rating, comment || '', images || []]
    );

    // Update booking rating
    const result = await pool.query(
      `UPDATE bookings SET 
        rating = $1, 
        review = $2,
        updated_at = NOW() 
      WHERE id = $3 RETURNING *`,
      [rating, comment || null, bookingId]
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

    res.json({
      message: 'Rating submitted successfully',
      booking: formatBooking(result.rows[0])
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
};

// =========================================================================
// GET AVAILABLE SLOTS
// =========================================================================

export const getAvailableSlots = async (req, res) => {
  const { service_id, date } = req.query;
  
  if (!service_id || !date) {
    return res.status(400).json({ message: 'service_id and date are required' });
  }
  
  try {
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

    const schedule = await pool.query(`
      SELECT start_time, end_time
      FROM provider_schedules
      WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true
    `, [providerId, dayOfWeek]);

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
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
};

// =========================================================================
// GET USER BOOKINGS
// =========================================================================

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['customer_id = $1'];
    let params = [userId];
    let paramIndex = 2;

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
      SELECT b.*, s.title as service_title, u.name as provider_name, u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN users u ON u.id = b.provider_id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    const bookings = result.rows.map(formatBooking);

    res.json({
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch your bookings' });
  }
};

// =========================================================================
// GET UPCOMING BOOKINGS
// =========================================================================

export const getUpcomingBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const result = await pool.query(`
      SELECT b.*, s.title as service_title, u.name as provider_name, u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN users u ON u.id = b.provider_id
      WHERE b.customer_id = $1
        AND b.status IN ('pending', 'confirmed')
        AND b.booking_date >= NOW()
      ORDER BY b.booking_date ASC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    const bookings = result.rows.map(formatBooking);
    res.json(bookings);
  } catch (error) {
    console.error('Get upcoming bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming bookings' });
  }
};

// =========================================================================
// GET BOOKING STATS
// =========================================================================

export const getBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params = [];

    if (userRole === 'customer') {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent
        FROM bookings
        WHERE customer_id = $1
      `;
      params = [userId];
    } else if (userRole === 'provider') {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings
        FROM bookings
        WHERE provider_id = $1
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue
        FROM bookings
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ message: 'Failed to fetch booking stats' });
  }
};

// =========================================================================
// GET PROVIDER BOOKINGS
// =========================================================================

export const getProviderBookings = async (req, res) => {
  const { providerId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    // Verify authorization
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
      SELECT b.*, s.title as service_title, u.name as customer_name, u.avatar as customer_avatar
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN users u ON u.id = b.customer_id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    const bookings = result.rows.map(formatBooking);

    res.json({
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Provider bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch provider bookings' });
  }
};

// =========================================================================
// GET BOOKING HISTORY (Customer)
// =========================================================================

export const getBookingHistory = async (req, res) => {
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
        s.image as service_image,
        u.name as provider_name,
        u.avatar as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    const bookings = result.rows.map(formatBooking);

    res.json({
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get booking history error:', error);
    res.status(500).json({ message: 'Failed to fetch booking history' });
  }
};