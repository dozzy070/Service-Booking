// Backend/routes/providerRoutes.js
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

    // Check if provider exists
    const providerCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [providerId, 'provider']
    );

    if (providerCheck.rows.length === 0) {
      return res.json({
        totalServices: 0,
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
        averageRating: 0
      });
    }

    const servicesResult = await pool.query(
      'SELECT COUNT(*) as count FROM services WHERE provider_id = $1 AND deleted_at IS NULL',
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
      totalServices: parseInt(servicesResult.rows[0].count || 0),
      totalBookings: parseInt(bookingsResult.rows[0].total_bookings || 0),
      pendingBookings: parseInt(bookingsResult.rows[0].pending_bookings || 0),
      completedBookings: parseInt(bookingsResult.rows[0].completed_bookings || 0),
      totalEarnings: parseFloat(bookingsResult.rows[0].total_earnings || 0),
      averageRating: parseFloat(ratingResult.rows[0].average_rating || 0)
    });
  } catch (error) {
    console.error('Error in provider stats:', error);
    res.json({
      totalServices: 0,
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      totalEarnings: 0,
      averageRating: 0
    });
  }
});

// GET /api/provider/dashboard/stats - Detailed dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const providerId = req.user.id;

    // Check if provider exists
    const providerCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [providerId, 'provider']
    );

    if (providerCheck.rows.length === 0) {
      return res.json({
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        totalEarnings: 0,
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        activeServices: 0,
        pendingApproval: 0,
        totalClients: 0,
        newClientsThisMonth: 0,
        averageRating: 0,
        totalReviews: 0,
        responseRate: 100,
        responseTime: '< 1 hour',
        earningsGrowth: 0,
        bookingGrowth: 0,
        completionRate: 0
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

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

    // Earnings growth
    const earningsGrowthResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN booking_date >= $1 THEN total_amount ELSE 0 END), 0) as this_month,
         COALESCE(SUM(CASE WHEN booking_date BETWEEN $2 AND $3 THEN total_amount ELSE 0 END), 0) as last_month
       FROM bookings
       WHERE provider_id = $4 AND status = 'completed'`,
      [monthStart, lastMonthStart, lastMonthEnd, providerId]
    );

    const thisMonthEarnings = parseFloat(earningsGrowthResult.rows[0].this_month || 0);
    const lastMonthEarnings = parseFloat(earningsGrowthResult.rows[0].last_month || 0);
    const earningsGrowth = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100)
      : 0;

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

    // Booking growth
    const bookingGrowthResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE booking_date >= $1) as this_month_count,
         COUNT(*) FILTER (WHERE booking_date BETWEEN $2 AND $3) as last_month_count
       FROM bookings
       WHERE provider_id = $4`,
      [monthStart, lastMonthStart, lastMonthEnd, providerId]
    );

    const thisMonthBookings = parseInt(bookingGrowthResult.rows[0].this_month_count || 0);
    const lastMonthBookings = parseInt(bookingGrowthResult.rows[0].last_month_count || 0);
    const bookingGrowth = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings * 100)
      : 0;

    // Active services
    const activeServices = await pool.query(
      `SELECT COUNT(*) as active_services
       FROM services
       WHERE provider_id = $1 AND status = 'approved' AND deleted_at IS NULL`,
      [providerId]
    );

    // Pending approval services
    const pendingApproval = await pool.query(
      `SELECT COUNT(*) as pending_approval
       FROM services
       WHERE provider_id = $1 AND status = 'pending' AND deleted_at IS NULL`,
      [providerId]
    );

    // Total clients
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
      `SELECT 
         COALESCE(AVG(r.rating), 0) as average_rating, 
         COUNT(r.id) as total_reviews
       FROM reviews r
       JOIN services s ON r.service_id = s.id
       WHERE s.provider_id = $1 AND r.status = 'approved'`,
      [providerId]
    );

    // Completion rate
    const completionRateResult = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status IN ('completed', 'in_progress')) as completed
       FROM bookings
       WHERE provider_id = $1 AND status NOT IN ('cancelled')`,
      [providerId]
    );
    
    const totalNonCancelled = parseInt(completionRateResult.rows[0].total || 0);
    const completedCount = parseInt(completionRateResult.rows[0].completed || 0);
    const completionRate = totalNonCancelled > 0 ? (completedCount / totalNonCancelled * 100) : 0;

    res.json({
      todayEarnings: parseFloat(todayResult.rows[0].today_earnings || 0),
      weeklyEarnings: parseFloat(weeklyResult.rows[0].weekly_earnings || 0),
      monthlyEarnings: parseFloat(monthlyResult.rows[0].monthly_earnings || 0),
      totalEarnings: parseFloat(totalEarningsResult.rows[0].total_earnings || 0),
      totalBookings: parseInt(bookingCounts.rows[0].total_bookings || 0),
      completedBookings: parseInt(bookingCounts.rows[0].completed_bookings || 0),
      pendingBookings: parseInt(bookingCounts.rows[0].pending_bookings || 0),
      cancelledBookings: parseInt(bookingCounts.rows[0].cancelled_bookings || 0),
      activeServices: parseInt(activeServices.rows[0].active_services || 0),
      pendingApproval: parseInt(pendingApproval.rows[0].pending_approval || 0),
      totalClients: parseInt(totalClients.rows[0].total_clients || 0),
      newClientsThisMonth: parseInt(newClients.rows[0].new_clients_this_month || 0),
      averageRating: parseFloat(reviews.rows[0].average_rating || 0),
      totalReviews: parseInt(reviews.rows[0].total_reviews || 0),
      responseRate: 98,
      responseTime: '< 1 hour',
      earningsGrowth: parseFloat(earningsGrowth.toFixed(1)),
      bookingGrowth: parseFloat(bookingGrowth.toFixed(1)),
      completionRate: parseFloat(completionRate.toFixed(1))
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.json({
      todayEarnings: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0,
      totalEarnings: 0,
      totalBookings: 0,
      completedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      activeServices: 0,
      pendingApproval: 0,
      totalClients: 0,
      newClientsThisMonth: 0,
      averageRating: 0,
      totalReviews: 0,
      responseRate: 100,
      responseTime: '< 1 hour',
      earningsGrowth: 0,
      bookingGrowth: 0,
      completionRate: 0
    });
  }
});

// GET /api/provider/dashboard/recent-bookings
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
      customer: row.customer || 'Unknown',
      customerAvatar: row.customer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.customer || 'U')}&background=667eea&color=fff&size=32`,
      service: row.service || 'Unknown Service',
      date: row.date || new Date().toISOString().split('T')[0],
      time: row.time || '12:00 PM',
      amount: parseFloat(row.amount || 0),
      status: row.status || 'pending'
    }));

    res.json(bookings);
  } catch (err) {
    console.error('Recent bookings error:', err);
    res.json([]);
  }
});

// GET /api/provider/dashboard/today-schedule
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
         b.booking_date,
         b.status
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.customer_id = u.id
       WHERE b.provider_id = $1
         AND b.status IN ('confirmed', 'pending', 'in_progress')
         AND b.booking_date BETWEEN $2 AND $3
       ORDER BY b.booking_date ASC`,
      [providerId, todayStart, todayEnd]
    );

    const schedule = rows.map(row => ({
      bookingId: row.booking_id,
      time: row.time || '12:00 PM',
      service: row.service || 'Unknown Service',
      customer: row.customer || 'Unknown',
      address: row.address || 'No address provided',
      bookingDate: row.booking_date || new Date().toISOString(),
      status: row.status || 'pending'
    }));

    res.json(schedule);
  } catch (err) {
    console.error('Today schedule error:', err);
    res.json([]);
  }
});

// =========================================================================
// PROVIDER SERVICES
// =========================================================================

// GET /api/provider/services
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
      WHERE s.provider_id = $1 AND s.deleted_at IS NULL
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
      title: s.title || 'Untitled',
      category: s.category || 'Uncategorized',
      price: parseFloat(s.price || 0),
      duration: s.duration || 60,
      description: s.description || '',
      status: s.status || 'pending',
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      bookings: parseInt(s.bookings || 0),
      rating: parseFloat(s.rating || 0).toFixed(1)
    }));

    res.json(services);
  } catch (err) {
    console.error('Services fetch error:', err);
    res.json([]);
  }
});

// =========================================================================
// PROVIDER BOOKINGS - ALL FIXED
// =========================================================================

// GET /api/provider/bookings
router.get('/bookings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Verify the user has the provider role
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [userId, 'provider']
    );
    
    if (userCheck.rows.length === 0) {
      return res.json({
        bookings: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    }
    
    // Build conditions using provider_id = user_id
    let conditions = ['b.provider_id = $1'];
    let params = [userId];
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
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN services s ON b.service_id = s.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);
    
    // Get bookings
    const query = `
      SELECT 
        b.id,
        b.booking_number,
        u.name as customer_name,
        u.phone as customer_phone,
        u.address as customer_address,
        s.title as service_name,
        b.booking_date as date,
        b.booking_time as time,
        b.total_amount as price,
        b.status,
        b.customer_notes as notes,
        b.created_at,
        b.duration,
        b.location_type,
        b.address as booking_address
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
      id: b.id,
      booking_number: b.booking_number || b.id?.slice(-8) || 'N/A',
      customer_name: b.customer_name || 'Unknown',
      customer_phone: b.customer_phone || '',
      customer_address: b.customer_address || '',
      service_name: b.service_name || 'Unknown Service',
      date: b.date || new Date().toISOString(),
      time: b.time || '12:00 PM',
      price: parseFloat(b.price || 0),
      status: b.status || 'pending',
      notes: b.notes || '',
      duration: b.duration || 'N/A',
      location_type: b.location_type || 'onsite',
      booking_address: b.booking_address || '',
      created_at: b.created_at || new Date().toISOString()
    }));
    
    res.json({
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)) || 1
    });
    
  } catch (err) {
    console.error('❌ Bookings fetch error:', err);
    console.error('❌ Error stack:', err.stack);
    res.json({
      bookings: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
  }
});

// GET /api/provider/bookings/:id
router.get('/bookings/:id', async (req, res) => {
  try {
    const userId = req.user.id;
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
    `, [bookingId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Booking detail error:', err);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// PUT /api/provider/bookings/:id/status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 AND provider_id = $3 RETURNING *',
      [status, bookingId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ message: 'Booking status updated', status });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// POST /api/provider/bookings/:id/start
router.post('/bookings/:id/start', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (rows[0].status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking cannot be started' });
    }

    await pool.query(
      `UPDATE bookings SET status = 'in_progress', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );
    res.json({ message: 'Booking started' });
  } catch (err) {
    console.error('Start booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/provider/bookings/:id/complete
router.post('/bookings/:id/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (rows[0].status !== 'in_progress') {
      return res.status(400).json({ message: 'Booking cannot be completed' });
    }

    await pool.query(
      `UPDATE bookings SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );
    res.json({ message: 'Booking completed' });
  } catch (err) {
    console.error('Complete booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/provider/bookings/:id/reschedule
router.put('/bookings/:id/reschedule', async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const { new_date, reason } = req.body;

    if (!new_date) {
      return res.status(400).json({ message: 'New date required' });
    }

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (!['pending', 'confirmed'].includes(rows[0].status)) {
      return res.status(400).json({ message: 'Booking cannot be rescheduled' });
    }

    await pool.query(
      `UPDATE bookings SET booking_date = $1, status = 'pending', updated_at = NOW() 
       WHERE id = $2 AND provider_id = $3`,
      [new_date, bookingId, userId]
    );
    
    if (reason) {
      await pool.query(
        `UPDATE bookings SET provider_notes = COALESCE(provider_notes, '') || ' Rescheduled: ' || $1 || ' (new date: ' || $2 || ')'`,
        [reason, new_date, bookingId]
      );
    }
    
    res.json({ message: 'Booking rescheduled' });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PROVIDER SCHEDULE
// =========================================================================

// GET /api/provider/schedule
router.get('/schedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const result = await pool.query(`
      SELECT * FROM provider_schedules
      WHERE provider_id = $1
      ORDER BY day_of_week, start_time
    `, [providerId]);
    
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
    console.error('Schedule fetch error:', err);
    res.json({});
  }
});

// POST /api/provider/schedule
router.post('/schedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { day, start, end } = req.body;
    
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
    console.error('Add schedule error:', err);
    res.status(500).json({ message: 'Failed to add schedule slot' });
  }
});

// PUT /api/provider/schedule/:id
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
    console.error('Update schedule error:', err);
    res.status(500).json({ message: 'Failed to update schedule slot' });
  }
});

// DELETE /api/provider/schedule/:id
router.delete('/schedule/:id', async (req, res) => {
  try {
    const providerId = req.user.id;
    await pool.query(
      'DELETE FROM provider_schedules WHERE id = $1 AND provider_id = $2',
      [req.params.id, providerId]
    );
    res.json({ message: 'Schedule slot deleted' });
  } catch (err) {
    console.error('Delete schedule error:', err);
    res.status(500).json({ message: 'Failed to delete schedule slot' });
  }
});

// =========================================================================
// PROVIDER EARNINGS
// =========================================================================

// GET /api/provider/earnings
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
      total: parseFloat(row.total || 0),
      available: parseFloat(row.available || 0),
      pending: parseFloat(row.pending || 0),
      totalBookings: parseInt(row.total_bookings || 0),
      averageBookingValue: parseFloat(row.average_booking_value || 0),
      thisWeek: parseFloat(row.this_week || 0),
      thisMonth: parseFloat(row.this_month || 0),
      lastMonth: parseFloat(row.last_month || 0),
      growth: row.last_month > 0 
        ? ((row.this_month - row.last_month) / row.last_month * 100).toFixed(1)
        : 0,
      transactions: transactions.rows.map(t => ({
        id: t.id,
        date: t.date,
        customer: t.customer || 'Unknown',
        service: t.service || 'Unknown',
        amount: parseFloat(t.amount || 0),
        status: t.status || 'pending',
        paymentStatus: t.payment_status || 'pending'
      }))
    });
  } catch (err) {
    console.error('Earnings error:', err);
    res.json({
      total: 0,
      available: 0,
      pending: 0,
      totalBookings: 0,
      averageBookingValue: 0,
      thisWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      transactions: []
    });
  }
});

// =========================================================================
// PROVIDER REVIEWS
// =========================================================================

// GET /api/provider/reviews
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
    const total = parseInt(countResult.rows[0].total || 0);
    
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
      JOIN users u ON r.reviewer_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
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
      reviews: result.rows || [],
      stats: {
        total: parseInt(stats.rows[0]?.total || 0),
        average: parseFloat(stats.rows[0]?.average || 0),
        responded: parseInt(stats.rows[0]?.responded || 0),
        responseRate: stats.rows[0]?.total > 0 
          ? (stats.rows[0].responded / stats.rows[0].total * 100).toFixed(1)
          : 0
      },
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)) || 1
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    res.json({
      reviews: [],
      stats: { total: 0, average: 0, responded: 0, responseRate: 0 },
      total: 0,
      page: 1,
      totalPages: 1
    });
  }
});

// POST /api/provider/reviews/:id/respond
router.post('/reviews/:id/respond', async (req, res) => {
  try {
    const { response } = req.body;
    const reviewId = req.params.id;
    const providerId = req.user.id;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ message: 'Response is required' });
    }
    
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
      'UPDATE reviews SET admin_response = $1, responded_at = NOW() WHERE id = $2',
      [response.trim(), reviewId]
    );
    
    res.json({ message: 'Response added successfully' });
  } catch (err) {
    console.error('Review response error:', err);
    res.status(500).json({ message: 'Failed to add response' });
  }
});

// =========================================================================
// PROVIDER PROFILE
// =========================================================================

// GET /api/provider/profile
router.get('/profile', async (req, res) => {
  try {
    const providerId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.address, u.city, u.state, u.zip_code,
        u.bio, u.avatar, u.verified, u.created_at,
        (SELECT COUNT(*) FROM services WHERE provider_id = u.id AND status = 'approved' AND deleted_at IS NULL) as active_services,
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
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/provider/profile
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
    
    const result = await pool.query(
      'SELECT id, name, email, phone, address, city, state, zip_code, bio, avatar FROM users WHERE id = $1',
      [providerId]
    );
    
    res.json({ message: 'Profile updated successfully', profile: result.rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// =========================================================================
// PROVIDER NOTIFICATIONS
// =========================================================================

// GET /api/provider/notifications
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
    
    res.json(result.rows || []);
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.json([]);
  }
});

// =========================================================================
// PROVIDER WITHDRAWAL METHODS
// =========================================================================

// GET /api/provider/withdrawal-methods
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
    
    res.json(result.rows || []);
  } catch (err) {
    console.error('Withdrawal methods fetch error:', err);
    res.json([]);
  }
});

// POST /api/provider/withdrawal-methods
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
    console.error('Add withdrawal method error:', err);
    res.status(500).json({ message: 'Failed to add withdrawal method' });
  }
});

// DELETE /api/provider/withdrawal-methods/:id
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
    console.error('Delete withdrawal method error:', err);
    res.status(500).json({ message: 'Failed to delete withdrawal method' });
  }
});


export default router;