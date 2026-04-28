// controllers/bookingController.js
import pool from '../config/db.js';
import Notification from '../models/Notification.js';

// Helper: format booking rows
const formatBooking = (row) => ({
  id: row.id,
  service_id: row.service_id,
  service_title: row.service_title,
  provider_id: row.provider_id,
  provider_name: row.provider_name,
  customer_id: row.customer_id,
  customer_name: row.customer_name,
  booking_date: row.booking_date,
  status: row.status,
  total_amount: parseFloat(row.total_amount),
  payment_status: row.payment_status,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at
});

// Create booking
export const createBooking = async (req, res) => {
  const { service_id, booking_date, notes } = req.body;
  const customer_id = req.user.id;

  try {
    // Get service details (price, provider_id)
    const serviceRes = await pool.query(
      `SELECT s.id, s.title, s.price, s.provider_id, u.name as provider_name
       FROM services s
       JOIN users u ON u.id = s.provider_id
       WHERE s.id = $1`,
      [service_id]
    );
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const service = serviceRes.rows[0];

    // Check for overlapping bookings (simple)
    const overlapCheck = await pool.query(
      `SELECT id FROM bookings
       WHERE provider_id = $1 AND booking_date = $2 AND status NOT IN ('cancelled', 'rejected')`,
      [service.provider_id, booking_date]
    );
    if (overlapCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Time slot already booked' });
    }

    const result = await pool.query(
      `INSERT INTO bookings (service_id, customer_id, provider_id, booking_date, total_amount, notes, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'unpaid')
       RETURNING *`,
      [service_id, customer_id, service.provider_id, booking_date, service.price, notes || null]
    );

    const booking = formatBooking(result.rows[0]);
    // Add service_title and provider_name to response
    booking.service_title = service.title;
    booking.provider_name = service.provider_name;

    // Create notifications for customer and provider
    try {
      await Notification.create({
        user_id: customer_id,
        type: 'booking_created',
        message: `Your booking for ${service.title} has been created successfully.`,
        data: { booking_id: booking.id, service_id, provider_id: service.provider_id }
      });

      await Notification.create({
        user_id: service.provider_id,
        type: 'new_booking',
        message: `You have a new booking request for ${service.title}.`,
        data: { booking_id: booking.id, service_id, customer_id }
      });
    } catch (notificationError) {
      console.error('Error creating booking notifications:', notificationError);
      // Don't fail the booking if notifications fail
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};

// Get all bookings (admin) or user-specific
export const getBookings = async (req, res) => {
  try {
    let query;
    let params = [];
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

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
        SELECT b.*, s.title as service_title, u.name as customer_name, u.name as provider_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN users u ON u.id = b.customer_id
        WHERE b.provider_id = $1
      `;
      params.push(req.user.id);
    } else { // customer
      query = `
        SELECT b.*, s.title as service_title, u.name as provider_name, u.name as customer_name
        FROM bookings b
        JOIN services s ON s.id = b.service_id
        JOIN users u ON u.id = b.provider_id
        WHERE b.customer_id = $1
      `;
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY b.booking_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const bookings = result.rows.map(formatBooking);
    res.json({ bookings, pagination: { total: result.rowCount, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.title as service_title, u.name as provider_name, c.name as customer_name
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
    booking.provider_name = result.rows[0].provider_name;
    booking.customer_name = result.rows[0].customer_name;
    res.json(booking);
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
};

// Update booking status (provider/admin)
export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
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

    const result = await pool.query(
      `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, bookingId]
    );

    const updatedBooking = result.rows[0];

    // Create notifications based on status change
    try {
      const statusMessages = {
        confirmed: `Your booking for ${oldBooking.service_title} has been confirmed.`,
        completed: `Your booking for ${oldBooking.service_title} has been completed.`,
        cancelled: `Your booking for ${oldBooking.service_title} has been cancelled.`,
        rejected: `Your booking for ${oldBooking.service_title} has been rejected.`
      };

      if (statusMessages[status]) {
        await Notification.create({
          user_id: oldBooking.customer_id,
          type: 'booking_status_update',
          message: statusMessages[status],
          data: { booking_id: bookingId, old_status: oldBooking.status, new_status: status }
        });
      }

      // Notify provider of status changes
      const providerMessages = {
        confirmed: `Booking for ${oldBooking.service_title} has been confirmed by the customer.`,
        completed: `Booking for ${oldBooking.service_title} has been marked as completed.`,
        cancelled: `Booking for ${oldBooking.service_title} has been cancelled by the customer.`,
        rejected: `You rejected the booking for ${oldBooking.service_title}.`
      };

      if (providerMessages[status]) {
        await Notification.create({
          user_id: oldBooking.provider_id,
          type: 'booking_status_update',
          message: providerMessages[status],
          data: { booking_id: bookingId, old_status: oldBooking.status, new_status: status }
        });
      }
    } catch (notificationError) {
      console.error('Error creating status update notifications:', notificationError);
      // Don't fail the status update if notifications fail
    }

    res.json(formatBooking(updatedBooking));
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

// Cancel booking (customer)
export const cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
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
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    }
    const result = await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bookingId]
    );
    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

// Reschedule booking
export const rescheduleBooking = async (req, res) => {
  const { new_date } = req.body;
  const bookingId = req.params.id;
  const userId = req.user.id;
  try {
    const check = await pool.query(
      `SELECT id, customer_id, status FROM bookings WHERE id = $1`,
      [bookingId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = check.rows[0];
    if (booking.customer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be rescheduled' });
    }
    const result = await pool.query(
      `UPDATE bookings SET booking_date = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [new_date, bookingId]
    );
    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ message: 'Failed to reschedule' });
  }
};

// Get available slots for a service on a date
export const getAvailableSlots = async (req, res) => {
  const { service_id, date } = req.query;
  if (!service_id || !date) {
    return res.status(400).json({ message: 'service_id and date are required' });
  }
  try {
    // Define working hours (9 AM to 5 PM, hourly slots)
    const workingHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    // Get booked slots for that service on that date
    const bookedRes = await pool.query(
      `SELECT booking_date FROM bookings
       WHERE service_id = $1 AND DATE(booking_date) = $2 AND status NOT IN ('cancelled', 'rejected')`,
      [service_id, date]
    );
    const bookedTimes = bookedRes.rows.map(row => {
      const d = new Date(row.booking_date);
      return d.toTimeString().slice(0,5);
    });
    const available = workingHours.filter(slot => !bookedTimes.includes(slot));
    res.json({ available });
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
};

// Get user's bookings (alias for getBookings with customer filter)
export const getUserBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.title as service_title, u.name as provider_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.provider_id
       WHERE b.customer_id = $1
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );
    const bookings = result.rows.map(formatBooking);
    res.json({ bookings });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch your bookings' });
  }
};

// Get upcoming bookings
export const getUpcomingBookings = async (req, res) => {
  try {
    const now = new Date().toISOString();
    let query;
    let params;
    if (req.user.role === 'customer') {
      query = `SELECT b.*, s.title as service_title, u.name as provider_name
               FROM bookings b
               JOIN services s ON s.id = b.service_id
               JOIN users u ON u.id = b.provider_id
               WHERE b.customer_id = $1 AND b.booking_date >= $2 AND b.status NOT IN ('cancelled', 'rejected', 'completed')
               ORDER BY b.booking_date ASC`;
      params = [req.user.id, now];
    } else if (req.user.role === 'provider') {
      query = `SELECT b.*, s.title as service_title, u.name as customer_name
               FROM bookings b
               JOIN services s ON s.id = b.service_id
               JOIN users u ON u.id = b.customer_id
               WHERE b.provider_id = $1 AND b.booking_date >= $2 AND b.status NOT IN ('cancelled', 'rejected', 'completed')
               ORDER BY b.booking_date ASC`;
      params = [req.user.id, now];
    } else {
      query = `SELECT b.*, s.title as service_title, u.name as provider_name, c.name as customer_name
               FROM bookings b
               JOIN services s ON s.id = b.service_id
               JOIN users u ON u.id = b.provider_id
               JOIN users c ON c.id = b.customer_id
               WHERE b.booking_date >= $1 AND b.status NOT IN ('cancelled', 'rejected', 'completed')
               ORDER BY b.booking_date ASC`;
      params = [now];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Upcoming bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming bookings' });
  }
};

// Get booking statistics
export const getBookingStats = async (req, res) => {
  try {
    let query;
    let params = [];
    if (req.user.role === 'customer') {
      query = `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
               FROM bookings WHERE customer_id = $1 GROUP BY status`;
      params = [req.user.id];
    } else if (req.user.role === 'provider') {
      query = `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
               FROM bookings WHERE provider_id = $1 GROUP BY status`;
      params = [req.user.id];
    } else {
      query = `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
               FROM bookings GROUP BY status`;
    }
    const result = await pool.query(query, params);
    const stats = { total: 0, totalAmount: 0, byStatus: {} };
    result.rows.forEach(row => {
      stats.byStatus[row.status] = { count: parseInt(row.count), total: parseFloat(row.total) };
      stats.total += parseInt(row.count);
      stats.totalAmount += parseFloat(row.total);
    });
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// Get provider bookings (for provider dashboard)
export const getProviderBookings = async (req, res) => {
  const { providerId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `
      SELECT b.*, s.title as service_title, u.name as customer_name
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      JOIN users u ON u.id = b.customer_id
      WHERE b.provider_id = $1
    `;
    let params = [providerId];
    if (status) {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }
    query += ` ORDER BY b.booking_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    const bookings = result.rows.map(formatBooking);
    res.json({ bookings, pagination: { total: result.rowCount, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    console.error('Provider bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch provider bookings' });
  }
};

// Complete booking (provider)
export const completeBooking = async (req, res) => {
  const bookingId = req.params.id;
  try {
    const result = await pool.query(
      `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [bookingId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Failed to complete booking' });
  }
};

// Rate booking (customer)
export const rateBooking = async (req, res) => {
  const bookingId = req.params.id;
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  try {
    const result = await pool.query(
      `UPDATE bookings SET rating = $1, review = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [rating, review || null, bookingId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    // Also update service rating
    const booking = result.rows[0];
    await pool.query(
      `UPDATE services SET rating = (
         SELECT AVG(rating) FROM bookings WHERE service_id = $1 AND rating IS NOT NULL
       ) WHERE id = $1`,
      [booking.service_id]
    );
    res.json(formatBooking(result.rows[0]));
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
};