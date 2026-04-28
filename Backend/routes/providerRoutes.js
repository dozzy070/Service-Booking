import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// All routes require authentication and provider/admin role
router.use(protect);
router.use(authorize('provider', 'admin'));

// =========================================================================
// GET /api/provider/stats (simple stats)
// =========================================================================
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

// =========================================================================
// GET /api/provider/dashboard/stats (direct SQL – no models)
// =========================================================================
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
       WHERE provider_id = $1 AND status = 'active'`,
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

    // Placeholder metrics
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

// =========================================================================
// GET /api/provider/dashboard/recent-bookings (FIXED: avatar column)
// =========================================================================
router.get('/dashboard/recent-bookings', async (req, res) => {
  try {
    const providerId = req.user.id;
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
       LIMIT 10`,
      [providerId]
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

// =========================================================================
// GET /api/provider/services (fixed category join)
// =========================================================================
router.get('/services', async (req, res) => {
  try {
    const providerId = req.user.id;
    const { rows } = await pool.query(
      `SELECT
         s.id,
         s.title,
         c.name as category,
         s.price,
         (SELECT COUNT(*) FROM bookings WHERE service_id = s.id) as bookings,
         COALESCE((SELECT AVG(rating) FROM reviews WHERE service_id = s.id), 0) as rating,
         s.status
       FROM services s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.provider_id = $1
       ORDER BY s.created_at DESC`,
      [providerId]
    );

    const services = rows.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category || 'Uncategorized',
      price: parseFloat(s.price),
      bookings: parseInt(s.bookings),
      rating: parseFloat(s.rating).toFixed(1),
      status: s.status
    }));

    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// GET /api/provider/dashboard/today-schedule (with address fallback)
// =========================================================================
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
         AND b.status IN ('accepted', 'pending')
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
// POST /api/provider/bookings/:id/start
// =========================================================================
router.post('/bookings/:id/start', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookingId = req.params.id;

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    if (rows[0].status !== 'accepted') {
      return res.status(400).json({ message: 'Booking cannot be started' });
    }

    await pool.query(`UPDATE bookings SET status = 'in_progress' WHERE id = $1`, [bookingId]);
    res.json({ message: 'Booking started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// PUT /api/provider/bookings/:id/reschedule
// =========================================================================
router.put('/bookings/:id/reschedule', async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookingId = req.params.id;
    const { new_date } = req.body;

    if (!new_date) return res.status(400).json({ message: 'New date required' });

    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    if (!['pending', 'accepted'].includes(rows[0].status)) {
      return res.status(400).json({ message: 'Booking cannot be rescheduled' });
    }

    await pool.query(
      `UPDATE bookings SET booking_date = $1, status = 'pending' WHERE id = $2`,
      [new_date, bookingId]
    );
    res.json({ message: 'Booking rescheduled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;