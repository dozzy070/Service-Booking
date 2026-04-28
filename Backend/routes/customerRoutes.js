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

// ---------- PAYMENT METHODS ----------
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.put('/payment-methods/:id/default', setDefaultPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);
router.get('/payment-summary', getPaymentSummary);

// ---------- FAVORITES ----------
router.get('/favorites', async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        s.id,
        s.title,
        s.category_id,
        c.name as category,
        s.price,
        COALESCE(s.rating, 0) as rating,
        COALESCE(s.review_count, 0) as review_count,
        u.name as provider_name,
        s.image
      FROM favorites f
      JOIN services s ON f.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const favorites = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category || 'Uncategorized',
      price: parseFloat(row.price),
      rating: parseFloat(row.rating),
      review_count: parseInt(row.review_count),
      provider_name: row.provider_name,
      image: row.image
    }));

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

// ---------- DASHBOARD STATS ----------
router.get('/dashboard/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const statsQuery = `
      SELECT
        COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as upcoming_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount END), 0) as total_spent
      FROM bookings
      WHERE customer_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    res.json({
      upcomingBookings: parseInt(stats.upcoming_bookings),
      completedBookings: parseInt(stats.completed_bookings),
      cancelledBookings: parseInt(stats.cancelled_bookings),
      totalSpent: parseFloat(stats.total_spent)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// ---------- RECENT BOOKINGS ----------
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
        s.image,
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
    const bookings = result.rows.map(booking => ({
      id: booking.id,
      serviceTitle: booking.service_title,
      providerName: booking.provider_name,
      providerAvatar: booking.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider_name)}&background=10b981&color=fff`,
      bookingDate: booking.booking_date,
      status: booking.status,
      totalPrice: parseFloat(booking.total_amount),
      serviceImage: booking.image ? booking.image[0] : null
    }));

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({ message: 'Failed to fetch recent bookings' });
  }
});

// ---------- REMINDERS ----------
router.get('/reminders', async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        b.id,
        b.service_id,
        b.provider_id,
        b.booking_date,
        b.status,
        s.title as service_title,
        u.name as provider_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.customer_id = $1
        AND b.status = 'upcoming'
        AND b.booking_date >= CURRENT_DATE
        AND b.booking_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY b.booking_date ASC
      LIMIT 5
    `;

    const result = await pool.query(query, [userId]);
    const reminders = result.rows.map(reminder => ({
      id: reminder.id,
      serviceTitle: reminder.service_title,
      providerName: reminder.provider_name,
      bookingDate: reminder.booking_date,
      daysUntil: Math.ceil((new Date(reminder.booking_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ message: 'Failed to fetch reminders' });
  }
});

export default router;