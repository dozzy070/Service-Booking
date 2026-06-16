import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// All routes require authentication and provider/admin role
router.use(protect);
router.use(authorize('provider', 'admin'));

// =========================================================================
// PROVIDER STATISTICS
// =========================================================================

// GET /api/provider/stats - Simple provider stats
router.get('/stats', async (req, res) => {
  try {
    const providerId = req.user.id;

    const servicesResult = await pool.query(
      'SELECT COUNT(*) as count FROM services WHERE provider_id = $1',
      [providerId]
    );

    const bookingsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_bookings,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings
       FROM bookings 
       WHERE provider_id = $1`,
      [providerId]
    );

    const ratingResult = await pool.query(
      `SELECT COALESCE(AVG(r.rating), 0) as average_rating
       FROM reviews r
       JOIN services s ON r.service_id = s.id
       WHERE s.provider_id = $1`,
      [providerId]
    );

    res.json({
      totalServices: parseInt(servicesResult.rows[0].count),
      totalBookings: parseInt(bookingsResult.rows[0].total_bookings),
      pendingBookings: parseInt(bookingsResult.rows[0].pending_bookings),
      completedBookings: parseInt(bookingsResult.rows[0].completed_bookings),
      totalEarnings: parseFloat(bookingsResult.rows[0].total_earnings),
      averageRating: parseFloat(ratingResult.rows[0].average_rating) || 0
    });
  } catch (error) {
    console.error('Error in provider stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/provider/dashboard/stats - Detailed dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const providerId = req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Today's earnings
    const todayResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as today_earnings
       FROM bookings
       WHERE provider_id = $1 AND status = 'completed'
         AND booking_date BETWEEN $2 AND $3`,
      [providerId, todayStart, todayEnd]
    );

    // Weekly earnings
    const weeklyResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as weekly_earnings
       FROM bookings
       WHERE provider_id = $1 AND status = 'completed' AND booking_date >= $2`,
      [providerId, weekAgo]
    );

    // Monthly earnings
    const monthlyResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as monthly_earnings
       FROM bookings
       WHERE provider_id = $1 AND status = 'completed' AND booking_date >= $2`,
      [providerId, monthStart]
    );

    // Total earnings all time
    const totalEarningsResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_earnings
       FROM bookings
       WHERE provider_id = $1 AND status = 'completed'`,
      [providerId]
    );

    // Booking counts
    const bookingCounts = await pool.query(
      `SELECT
         COUNT(*) as total_bookings,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings
       FROM bookings
       WHERE provider_id = $1`,
      [providerId]
    );

    // Active services
    const activeServices = await pool.query(
      `SELECT COUNT(*) as active_services
       FROM services
       WHERE provider_id = $1 AND status = 'approved'`,
      [providerId]
    );

    // Pending approval services
    const pendingApproval = await pool.query(
      `SELECT COUNT(*) as pending_approval
       FROM services
       WHERE provider_id = $1 AND status = 'pending'`,
      [providerId]
    );

    // Total clients (distinct customers)
    const totalClients = await pool.query(
      `SELECT COUNT(DISTINCT customer_id) as total_clients
       FROM bookings
       WHERE provider_id = $1`,
      [providerId]
    );

    // New clients this month
    const newClients = await pool.query(
      `SELECT COUNT(DISTINCT customer_id) as new_clients_this_month
       FROM bookings
       WHERE provider_id = $1 AND booking_date >= $2`,
      [providerId, monthStart]
    );

    // Reviews
    const reviews = await pool.query(
      `SELECT COALESCE(AVG(r.rating), 0) as average_rating, COUNT(r.id) as total_reviews
       FROM reviews r
       JOIN services s ON r.service_id = s.id
       WHERE s.provider_id = $1`,
      [providerId]
    );

    // Response rate (placeholder - can be calculated from actual data)
    const responseRate = 98;
    const responseTime = '15 min';

    res.json({
      todayEarnings: parseFloat(todayResult.rows[0].today_earnings),
      weeklyEarnings: parseFloat(weeklyResult.rows[0].weekly_earnings),
      monthlyEarnings: parseFloat(monthlyResult.rows[0].monthly_earnings),
      totalEarnings: parseFloat(totalEarningsResult.rows[0].total_earnings),
      totalBookings: parseInt(bookingCounts.rows[0].total_bookings),
      completedBookings: parseInt(bookingCounts.rows[0].completed_bookings),
      pendingBookings: parseInt(bookingCounts.rows[0].pending_bookings),
      cancelledBookings: parseInt(bookingCounts.rows[0].cancelled_bookings),
      activeServices: parseInt(activeServices.rows[0].active_services),
      pendingApproval: parseInt(pendingApproval.rows[0].pending_approval),
      totalClients: parseInt(totalClients.rows[0].total_clients),
      newClientsThisMonth: parseInt(newClients.rows[0].new_clients_this_month),
      averageRating: parseFloat(reviews.rows[0].average_rating).toFixed(1),
      totalReviews: parseInt(reviews.rows[0].total_reviews),
      responseRate,
      responseTime
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/provider/dashboard/recent-bookings - Recent bookings for dashboard
router.get('/dashboard/recent-bookings', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { limit = 10 } = req.query;
    
    const { rows } = await pool.query(
      `SELECT
         b.id,
         u.name as customer,
         u.avatar as customer_avatar,
         s.title as service,
         to_char(b.booking_date, 'YYYY-MM-DD') as date,
         to_char(b.booking_date, 'HH12:MI AM') as time,
         b.total_amount as amount,
         b.status
       FROM bookings b
       JOIN users u ON b.customer_id = u.id
       JOIN services s ON b.service_id = s.id
       WHERE b.provider_id = $1
       ORDER BY b.booking_date DESC
       LIMIT $2`,
      [providerId, parseInt(limit)]
    );

    const bookings = rows.map(row => ({
      id: row.id,
      customer: row.customer,
      customerAvatar: row.customer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.customer)}&background=667eea&color=fff&size=32`,
      service: row.service,
      date: row.date,
      time: row.time,
      amount: parseFloat(row.amount),
      status: row.status
    }));

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/provider/dashboard/today-schedule - Today's schedule
router.get('/dashboard/today-schedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { rows } = await pool.query(
      `SELECT
         b.id as booking_id,
         to_char(b.booking_date, 'HH12:MI AM') as time,
         s.title as service,
         u.name as customer,
         COALESCE(u.address, 'No address provided') as address,
         b.booking_date
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.customer_id = u.id
       WHERE b.provider_id = $1
         AND b.status IN ('confirmed', 'pending')
         AND b.booking_date BETWEEN $2 AND $3
       ORDER BY b.booking_date ASC`,
      [providerId, todayStart, todayEnd]
    );

    const schedule = rows.map(row => ({
      bookingId: row.booking_id,
      time: row.time,
      service: row.service,
      customer: row.customer,
      address: row.address,
      bookingDate: row.booking_date
    }));

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PROVIDER SERVICES
// =========================================================================

// GET /api/provider/services - Get provider's services
router.get('/services', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { status } = req.query;
    
    let query = `
      SELECT
        s.id,
        s.title,
        c.name as category,
        s.price,
        s.duration,
        s.description,
        s.status,
        s.created_at,
        s.updated_at,
        (SELECT COUNT(*) FROM bookings WHERE service_id = s.id) as bookings,
        COALESCE((SELECT AVG(rating) FROM reviews WHERE service_id = s.id), 0) as rating
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.provider_id = $1
    `;
    
    const params = [providerId];
    
    if (status && status !== 'all') {
      query += ` AND s.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY s.created_at DESC`;
    
    const { rows } = await pool.query(query, params);

    const services = rows.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category || 'Uncategorized',
      price: parseFloat(s.price),
      duration: s.duration,
      description: s.description,
      status: s.status,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      bookings: parseInt(s.bookings),
      rating: parseFloat(s.rating).toFixed(1)
    }));

    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/provider/services - Create a new service
router.post('/services', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { 
      title, 
      category, 
      description, 
      price, 
      duration,
      location,
      features,
      requirements,
      images,
      cancellationPolicy,
      maxBookingsPerDay,
      advanceBooking
    } = req.body;
    
    // Get category_id from category name
    let categoryId = null;
    if (category) {
      const catResult = await pool.query(
        'SELECT id FROM categories WHERE name ILIKE $1 OR slug ILIKE $1',
        [`%${category}%`]
      );
      if (catResult.rows.length > 0) {
        categoryId = catResult.rows[0].id;
      }
    }
    
    const result = await pool.query(`
      INSERT INTO services (
        provider_id, title, description, price, duration, 
        category_id, location, features, requirements, images,
        cancellation_policy, max_bookings_per_day, advance_booking, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `, [
      providerId, title, description, price, duration,
      categoryId, location, features || [], requirements || [], images || [],
      cancellationPolicy || 'flexible', maxBookingsPerDay || 5, advanceBooking || 2
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create service' });
  }
});

// PUT /api/provider/services/:id - Update a service
router.put('/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const providerId = req.user.id;
    const { 
      title, 
      category, 
      description, 
      price, 
      duration,
      location,
      features,
      requirements,
      images,
      cancellationPolicy,
      maxBookingsPerDay,
      advanceBooking,
      status
    } = req.body;
    
    // Get category_id from category name
    let categoryId = null;
    if (category) {
      const catResult = await pool.query(
        'SELECT id FROM categories WHERE name ILIKE $1',
        [`%${category}%`]
      );
      if (catResult.rows.length > 0) {
        categoryId = catResult.rows[0].id;
      }
    }
    
    const result = await pool.query(`
      UPDATE services 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        duration = COALESCE($4, duration),
        category_id = COALESCE($5, category_id),
        location = COALESCE($6, location),
        features = COALESCE($7, features),
        requirements = COALESCE($8, requirements),
        images = COALESCE($9, images),
        cancellation_policy = COALESCE($10, cancellation_policy),
        max_bookings_per_day = COALESCE($11, max_bookings_per_day),
        advance_booking = COALESCE($12, advance_booking),
        status = COALESCE($13, status),
        updated_at = NOW()
      WHERE id = $14 AND provider_id = $15
      RETURNING *
    `, [
      title, description, price, duration,
      categoryId, location, features, requirements, images,
      cancellationPolicy, maxBookingsPerDay, advanceBooking,
      status, serviceId, providerId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update service' });
  }
});

// DELETE /api/provider/services/:id - Delete a service
router.delete('/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const providerId = req.user.id;
    
    // Check if service has active bookings
    const bookingCheck = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE service_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [serviceId]
    );
    
    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete service with active bookings' 
      });
    }
    
    await pool.query(
      'DELETE FROM services WHERE id = $1 AND provider_id = $2',
      [serviceId, providerId]
    );
    
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete service' });
  }
});

// =========================================================================
// PROVIDER BOOKINGS
// =========================================================================

// GET /api/provider/bookings - Get provider's bookings
router.get('/bookings', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { status, page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = ['b.provider_id = $1'];
    let params = [providerId];
    let paramIndex = 2;
    
    if (status && status !== 'all') {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(u.name ILIKE $${paramIndex} OR s.title ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countQuery = `SELECT COUNT(*) as total FROM bookings b WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        b.id,
        b.booking_id,
        u.name as customer_name,
        u.phone as customer_phone,
        u.address as customer_address,
        s.title as service_name,
        b.booking_date as date,
        b.time,
        b.total_amount as price,
        b.status,
        b.notes,
        b.created_at
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN services s ON b.service_id = s.id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    const bookings = result.rows.map(b => ({
      id: b.booking_id || b.id,
      customerName: b.customer_name,
      customerPhone: b.customer_phone,
      customerAddress: b.customer_address,
      service: b.service_name,
      date: b.date,
      time: b.time,
      price: parseFloat(b.price),
      status: b.status,
      notes: b.notes,
      createdAt: b.created_at
    }));
    
    res.json({
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// GET /api/provider/bookings/:id - Get booking details
router.get('/bookings/:id', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookingId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        b.*,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        u.address as customer_address,
        s.title as service_name,
        s.price as service_price
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = $1 AND b.provider_id = $2
    `, [bookingId, providerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// PUT /api/provider/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    const providerId = req.user.id;
    
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 AND provider_id = $3',
      [status, bookingId, providerId]
    );
    
    res.json({ message: 'Booking status updated', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// POST /api/provider/bookings/:id/start - Start a booking
router.post('/bookings/:id/start', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookingId = req.params.id;

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    if (rows[0].status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking cannot be started' });
    }

    await pool.query(`UPDATE bookings SET status = 'in_progress', updated_at = NOW() WHERE id = $1`, [bookingId]);
    res.json({ message: 'Booking started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/provider/bookings/:id/complete - Complete a booking
router.post('/bookings/:id/complete', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookingId = req.params.id;

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    if (rows[0].status !== 'in_progress') {
      return res.status(400).json({ message: 'Booking cannot be completed' });
    }

    await pool.query(`UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = $1`, [bookingId]);
    res.json({ message: 'Booking completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/provider/bookings/:id/reschedule - Reschedule a booking
router.put('/bookings/:id/reschedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookingId = req.params.id;
    const { new_date, reason } = req.body;

    if (!new_date) return res.status(400).json({ message: 'New date required' });

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    if (!['pending', 'confirmed'].includes(rows[0].status)) {
      return res.status(400).json({ message: 'Booking cannot be rescheduled' });
    }

    await pool.query(
      `UPDATE bookings SET booking_date = $1, status = 'pending', updated_at = NOW() WHERE id = $2`,
      [new_date, bookingId]
    );
    
    // Add reschedule note if reason provided
    if (reason) {
      await pool.query(
        `UPDATE bookings SET notes = COALESCE(notes, '') || ' Rescheduled: ' || $1 || ' (new date: ' || $2 || ')'`,
        [reason, new_date, bookingId]
      );
    }
    
    res.json({ message: 'Booking rescheduled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PROVIDER SCHEDULE
// =========================================================================

// GET /api/provider/schedule - Get provider schedule
router.get('/schedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const result = await pool.query(`
      SELECT * FROM provider_schedules
      WHERE provider_id = $1
      ORDER BY day_of_week, start_time
    `, [providerId]);
    
    // Group by day
    const schedule = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => { schedule[day] = []; });
    
    result.rows.forEach(row => {
      const day = row.day_of_week.toLowerCase();
      if (schedule[day]) {
        schedule[day].push({
          id: row.id,
          start: row.start_time,
          end: row.end_time
        });
      }
    });
    
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/provider/schedule - Add schedule slot
router.post('/schedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { day, start, end } = req.body;
    
    // Validate
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid day' });
    }
    
    const result = await pool.query(
      `INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [providerId, day.toLowerCase(), start, end]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add schedule slot' });
  }
});

// PUT /api/provider/schedule/:id - Update schedule slot
router.put('/schedule/:id', async (req, res) => {
  try {
    const providerId = req.user.id;
    const slotId = req.params.id;
    const { start, end, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE provider_schedules 
       SET start_time = COALESCE($1, start_time),
           end_time = COALESCE($2, end_time),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4 AND provider_id = $5
       RETURNING *`,
      [start, end, is_active, slotId, providerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Schedule slot not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update schedule slot' });
  }
});

// DELETE /api/provider/schedule/:id - Delete schedule slot
router.delete('/schedule/:id', async (req, res) => {
  try {
    const providerId = req.user.id;
    await pool.query(
      'DELETE FROM provider_schedules WHERE id = $1 AND provider_id = $2',
      [req.params.id, providerId]
    );
    res.json({ message: 'Schedule slot deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete schedule slot' });
  }
});

// =========================================================================
// PROVIDER EARNINGS
// =========================================================================

// GET /api/provider/earnings - Get earnings
router.get('/earnings', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { range = 'month' } = req.query;
    
    let dateFilter;
    switch(range) {
      case 'week': dateFilter = "INTERVAL '7 days'"; break;
      case 'month': dateFilter = "INTERVAL '30 days'"; break;
      case 'quarter': dateFilter = "INTERVAL '90 days'"; break;
      case 'year': dateFilter = "INTERVAL '365 days'"; break;
      default: dateFilter = "INTERVAL '30 days'";
    }
    
    // Get completed bookings with payment status
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as available,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_status != 'paid' THEN total_amount ELSE 0 END), 0) as pending,
        COUNT(*) as total_bookings,
        COALESCE(AVG(total_amount), 0) as average_booking_value,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' 
                   AND booking_date >= NOW() - INTERVAL '7 days' THEN total_amount ELSE 0 END), 0) as this_week,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' 
                   AND booking_date >= NOW() - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN status = 'completed' AND payment_status = 'paid' 
                   AND booking_date BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' 
                   THEN total_amount ELSE 0 END), 0) as last_month
      FROM bookings
      WHERE provider_id = $1 AND booking_date >= NOW() - $2
    `, [providerId, dateFilter]);
    
    // Get detailed transaction list
    const transactions = await pool.query(`
      SELECT 
        b.id,
        b.booking_date as date,
        u.name as customer,
        s.title as service,
        b.total_amount as amount,
        b.status,
        b.payment_status,
        b.created_at
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN services s ON b.service_id = s.id
      WHERE b.provider_id = $1 AND b.booking_date >= NOW() - $2
      ORDER BY b.booking_date DESC
      LIMIT 20
    `, [providerId, dateFilter]);
    
    const row = result.rows[0];
    res.json({
      total: parseFloat(row.total),
      available: parseFloat(row.available),
      pending: parseFloat(row.pending),
      totalBookings: parseInt(row.total_bookings),
      averageBookingValue: parseFloat(row.average_booking_value),
      thisWeek: parseFloat(row.this_week),
      thisMonth: parseFloat(row.this_month),
      lastMonth: parseFloat(row.last_month),
      growth: row.last_month > 0 
        ? ((row.this_month - row.last_month) / row.last_month * 100).toFixed(1)
        : 0,
      transactions: transactions.rows.map(t => ({
        id: t.id,
        date: t.date,
        customer: t.customer,
        service: t.service,
        amount: parseFloat(t.amount),
        status: t.status,
        paymentStatus: t.payment_status
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PROVIDER REVIEWS
// =========================================================================

// GET /api/provider/reviews - Get provider reviews
router.get('/reviews', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { rating, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = ['s.provider_id = $1'];
    let params = [providerId];
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
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.response,
        r.created_at as date,
        r.responded_at,
        u.name as customer_name,
        s.title as service_name,
        s.id as service_id
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average,
        COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as responded
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE s.provider_id = $1
    `, [providerId]);
    
    res.json({
      reviews: result.rows,
      stats: {
        total: parseInt(stats.rows[0].total),
        average: parseFloat(stats.rows[0].average) || 0,
        responded: parseInt(stats.rows[0].responded),
        responseRate: stats.rows[0].total > 0 
          ? (stats.rows[0].responded / stats.rows[0].total * 100).toFixed(1)
          : 0
      },
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// POST /api/provider/reviews/:id/respond - Respond to a review
router.post('/reviews/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;
    const reviewId = req.params.id;
    const providerId = req.user.id;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ message: 'Response is required' });
    }
    
    // Verify the review belongs to the provider
    const check = await pool.query(`
      SELECT r.id 
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE r.id = $1 AND s.provider_id = $2
    `, [reviewId, providerId]);
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    await pool.query(
      'UPDATE reviews SET response = $1, responded_at = NOW() WHERE id = $2',
      [response.trim(), reviewId]
    );
    
    res.json({ message: 'Response added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add response' });
  }
});

// =========================================================================
// PROVIDER PROFILE
// =========================================================================

// GET /api/provider/profile - Get provider profile
router.get('/profile', async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.address, u.city, u.state, u.zip_code,
        u.bio, u.avatar, u.verified, u.created_at,
        (SELECT COUNT(*) FROM services WHERE provider_id = u.id AND status = 'approved') as active_services,
        (SELECT COUNT(*) FROM bookings WHERE provider_id = u.id AND status = 'completed') as completed_bookings,
        (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r 
         JOIN services s ON r.service_id = s.id 
         WHERE s.provider_id = u.id) as average_rating
      FROM users u
      WHERE u.id = $1 AND u.role = 'provider'
    `, [providerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/provider/profile - Update provider profile
router.put('/profile', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { name, phone, address, city, state, zip_code, bio } = req.body;
    
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
      WHERE id = $8 AND role = 'provider'`,
      [name, phone, address, city, state, zip_code, bio, providerId]
    );
    
    // Fetch updated profile
    const result = await pool.query(
      'SELECT id, name, email, phone, address, city, state, zip_code, bio, avatar FROM users WHERE id = $1',
      [providerId]
    );
    
    res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// =========================================================================
// PROVIDER NOTIFICATIONS
// =========================================================================

// GET /api/provider/notifications - Get provider notifications
router.get('/notifications', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { limit = 10, unread = false } = req.query;
    
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [providerId];
    
    if (unread === 'true') {
      query += ` AND is_read = false`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PROVIDER WITHDRAWAL METHODS
// =========================================================================

// GET /api/provider/withdrawal-methods - Get provider withdrawal methods
router.get('/withdrawal-methods', async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, type, name, details, is_default
       FROM withdrawal_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, name`,
      [providerId]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/provider/withdrawal-methods - Add withdrawal method
router.post('/withdrawal-methods', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { type, name, details, isDefault } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (isDefault) {
        await client.query(
          'UPDATE withdrawal_methods SET is_default = false WHERE user_id = $1',
          [providerId]
        );
      }
      
      const result = await client.query(
        `INSERT INTO withdrawal_methods (user_id, type, name, details, is_default)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [providerId, type, name, details, isDefault || false]
      );
      
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add withdrawal method' });
  }
});

// DELETE /api/provider/withdrawal-methods/:id - Delete withdrawal method
router.delete('/withdrawal-methods/:id', async (req, res) => {
  try {
    const providerId = req.user.id;
    const methodId = req.params.id;
    
    const result = await pool.query(
      'DELETE FROM withdrawal_methods WHERE id = $1 AND user_id = $2 RETURNING id',
      [methodId, providerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Withdrawal method not found' });
    }
    
    res.json({ message: 'Withdrawal method deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete withdrawal method' });
  }
});

export default router;