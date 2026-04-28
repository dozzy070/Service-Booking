import pool from '../config/db.js';

const BookingModel = {
  async getStats(providerId) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_bookings,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings
       FROM bookings 
       WHERE provider_id = $1`,
      [providerId]
    );
    return result.rows[0];
  },

  async getEarningsByPeriod(providerId, startDate, endDate = null) {
    let query = `
      SELECT COALESCE(SUM(total_amount), 0) as earnings
      FROM bookings
      WHERE provider_id = $1 AND status = 'completed' AND booking_date >= $2
    `;
    const params = [providerId, startDate];
    if (endDate) {
      query += ` AND booking_date <= $3`;
      params.push(endDate);
    }
    const result = await pool.query(query, params);
    return parseFloat(result.rows[0].earnings);
  },

  async getCounts(providerId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_bookings,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings
       FROM bookings
       WHERE provider_id = $1`,
      [providerId]
    );
    return result.rows[0];
  },

  async getDistinctClientsCount(providerId, sinceDate = null) {
    let query = `SELECT COUNT(DISTINCT user_id) as count FROM bookings WHERE provider_id = $1`;
    const params = [providerId];
    if (sinceDate) {
      query += ` AND booking_date >= $2`;
      params.push(sinceDate);
    }
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  async getRecentBookings(providerId, limit = 10) {
    const { rows } = await pool.query(
      `SELECT
         b.id,
         u.name as customer,
         u.avatar_url as customer_avatar,
         s.title as service,
         to_char(b.booking_date, 'YYYY-MM-DD') as date,
         to_char(b.booking_date, 'HH12:MI AM') as time,
         b.total_amount as amount,
         b.status
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN services s ON b.service_id = s.id
       WHERE b.provider_id = $1
       ORDER BY b.booking_date DESC
       LIMIT $2`,
      [providerId, limit]
    );
    return rows;
  },

  async getTodaySchedule(providerId, startDate, endDate) {
    const { rows } = await pool.query(
      `SELECT
         b.id as booking_id,
         to_char(b.booking_date, 'HH12:MI AM') as time,
         s.title as service,
         u.name as customer,
         u.address as address,
         b.booking_date
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE b.provider_id = $1
         AND b.status IN ('accepted', 'pending')
         AND b.booking_date BETWEEN $2 AND $3
       ORDER BY b.booking_date ASC`,
      [providerId, startDate, endDate]
    );
    return rows;
  },

  async updateStatus(bookingId, status) {
    await pool.query(`UPDATE bookings SET status = $1 WHERE id = $2`, [status, bookingId]);
  },

  async updateDateAndStatus(bookingId, newDate, newStatus = 'pending') {
    await pool.query(`UPDATE bookings SET booking_date = $1, status = $2 WHERE id = $3`, [newDate, newStatus, bookingId]);
  },

  async getBookingByIdAndProvider(bookingId, providerId) {
    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    return rows[0];
  }
};

export default BookingModel;