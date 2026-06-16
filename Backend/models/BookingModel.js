// models/BookingModel.js
import pool from '../config/db.js';

const BookingModel = {
  // =========================================================================
  // CREATE BOOKING
  // =========================================================================

  async create(data) {
    const {
      service_id,
      customer_id,
      provider_id,
      booking_date,
      booking_time,
      total_amount,
      notes,
      location,
      customer_name,
      customer_phone,
      customer_address,
      status = 'pending',
      payment_status = 'pending'
    } = data;

    const result = await pool.query(
      `INSERT INTO bookings (
        service_id, customer_id, provider_id, booking_date, booking_time,
        total_amount, notes, location, customer_name, customer_phone, customer_address,
        status, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *`,
      [
        service_id, customer_id, provider_id, booking_date, booking_time,
        total_amount, notes, location, customer_name, customer_phone, customer_address,
        status, payment_status
      ]
    );
    return result.rows[0];
  },

  // =========================================================================
  // GET BOOKINGS WITH FILTERS
  // =========================================================================

  async getBookings(filters = {}) {
    const {
      userId,
      userRole,
      status,
      search,
      startDate,
      endDate,
      serviceId,
      providerId,
      customerId,
      page = 1,
      limit = 10,
      sortBy = 'booking_date',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (userRole === 'customer' && userId) {
      conditions.push(`b.customer_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    } else if (userRole === 'provider' && userId) {
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

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.image as service_image,
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
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.user_id = b.customer_id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      bookings: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  // =========================================================================
  // GET BOOKING BY ID
  // =========================================================================

  async getById(bookingId) {
    const result = await pool.query(
      `SELECT 
        b.*,
        s.title as service_title,
        s.description as service_description,
        s.image as service_image,
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
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.user_id = b.customer_id
      WHERE b.id = $1`,
      [bookingId]
    );
    return result.rows[0] || null;
  },

  // =========================================================================
  // UPDATE BOOKING
  // =========================================================================

  async update(bookingId, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'status', 'payment_status', 'booking_date', 'booking_time',
      'total_amount', 'notes', 'location', 'customer_name',
      'customer_phone', 'customer_address', 'cancellation_reason',
      'reschedule_reason', 'status_reason', 'rating', 'review'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (data.status === 'completed') {
      fields.push(`completed_at = NOW()`);
    }

    fields.push(`updated_at = NOW()`);
    values.push(bookingId);

    const query = `
      UPDATE bookings 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // =========================================================================
  // GET STATS
  // =========================================================================

  async getStats(providerId) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_bookings,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
         COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_bookings,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
         COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
         COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_bookings,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_earnings,
         COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END), 0) as avg_booking_value
       FROM bookings 
       WHERE provider_id = $1`,
      [providerId]
    );
    return result.rows[0];
  },

  // =========================================================================
  // GET EARNINGS BY PERIOD
  // =========================================================================

  async getEarningsByPeriod(providerId, startDate, endDate = null) {
    let query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as earnings,
        COUNT(*) as booking_count
      FROM bookings
      WHERE provider_id = $1 
        AND status = 'completed' 
        AND booking_date >= $2
    `;
    const params = [providerId, startDate];
    if (endDate) {
      query += ` AND booking_date <= $3`;
      params.push(endDate);
    }
    const result = await pool.query(query, params);
    return {
      earnings: parseFloat(result.rows[0].earnings),
      bookingCount: parseInt(result.rows[0].booking_count)
    };
  },

  // =========================================================================
  // GET EARNINGS BY DAY (Weekly/Daily)
  // =========================================================================

  async getEarningsByDay(providerId, days = 7) {
    const result = await pool.query(
      `SELECT 
         DATE(booking_date) as date,
         COALESCE(SUM(total_amount), 0) as earnings,
         COUNT(*) as bookings
       FROM bookings
       WHERE provider_id = $1 
         AND status = 'completed' 
         AND booking_date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(booking_date)
       ORDER BY date ASC`,
      [providerId]
    );
    return result.rows;
  },

  // =========================================================================
  // GET COUNTS
  // =========================================================================

  async getCounts(providerId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_bookings,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_bookings,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
         COUNT(*) FILTER (WHERE status = 'disputed') as disputed_bookings
       FROM bookings
       WHERE provider_id = $1`,
      [providerId]
    );
    return result.rows[0];
  },

  // =========================================================================
  // GET DISTINCT CLIENTS COUNT
  // =========================================================================

  async getDistinctClientsCount(providerId, sinceDate = null) {
    let query = `SELECT COUNT(DISTINCT customer_id) as count FROM bookings WHERE provider_id = $1`;
    const params = [providerId];
    if (sinceDate) {
      query += ` AND booking_date >= $2`;
      params.push(sinceDate);
    }
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  // =========================================================================
  // GET RECENT BOOKINGS
  // =========================================================================

  async getRecentBookings(providerId, limit = 10) {
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
      [providerId, limit]
    );
    return rows;
  },

  // =========================================================================
  // GET TODAY SCHEDULE
  // =========================================================================

  async getTodaySchedule(providerId, startDate, endDate) {
    const { rows } = await pool.query(
      `SELECT
         b.id as booking_id,
         to_char(b.booking_date, 'HH12:MI AM') as time,
         s.title as service,
         u.name as customer,
         u.address as address,
         b.booking_date,
         b.status
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.customer_id = u.id
       WHERE b.provider_id = $1
         AND b.status IN ('confirmed', 'pending')
         AND b.booking_date BETWEEN $2 AND $3
       ORDER BY b.booking_date ASC`,
      [providerId, startDate, endDate]
    );
    return rows;
  },

  // =========================================================================
  // UPDATE STATUS
  // =========================================================================

  async updateStatus(bookingId, status, reason = null) {
    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, 
           status_reason = $2,
           updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [status, reason, bookingId]
    );
    return result.rows[0] || null;
  },

  // =========================================================================
  // UPDATE DATE AND STATUS
  // =========================================================================

  async updateDateAndStatus(bookingId, newDate, newStatus = 'pending') {
    const result = await pool.query(
      `UPDATE bookings 
       SET booking_date = $1, 
           booking_time = $2,
           status = $3, 
           updated_at = NOW()
       WHERE id = $4 
       RETURNING *`,
      [newDate.date, newDate.time, newStatus, bookingId]
    );
    return result.rows[0] || null;
  },

  // =========================================================================
  // GET BOOKING BY ID AND PROVIDER
  // =========================================================================

  async getBookingByIdAndProvider(bookingId, providerId) {
    const { rows } = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND provider_id = $2`,
      [bookingId, providerId]
    );
    return rows[0] || null;
  },

  // =========================================================================
  // GET BOOKING BY ID AND CUSTOMER
  // =========================================================================

  async getBookingByIdAndCustomer(bookingId, customerId) {
    const { rows } = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND customer_id = $2`,
      [bookingId, customerId]
    );
    return rows[0] || null;
  },

  // =========================================================================
  // GET UPCOMING BOOKINGS
  // =========================================================================

  async getUpcomingBookings(userId, userRole, limit = 10) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (userRole === 'customer') {
      conditions.push(`b.customer_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    } else if (userRole === 'provider') {
      conditions.push(`b.provider_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    } else {
      return [];
    }

    conditions.push(`b.status IN ('pending', 'confirmed')`);
    conditions.push(`b.booking_date >= CURRENT_DATE`);

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT 
        b.*,
        s.title as service_title,
        s.image as service_image,
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
    return result.rows;
  },

  // =========================================================================
  // GET BOOKING STATS FOR CUSTOMER
  // =========================================================================

  async getCustomerStats(customerId) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent,
        COUNT(DISTINCT provider_id) as total_providers
      FROM bookings
      WHERE customer_id = $1
    `, [customerId]);
    return result.rows[0];
  },

  // =========================================================================
  // CHECK AVAILABILITY
  // =========================================================================

  async checkAvailability(providerId, bookingDate, bookingTime) {
    const result = await pool.query(
      `SELECT id FROM bookings
       WHERE provider_id = $1 
         AND booking_date = $2 
         AND booking_time = $3
         AND status NOT IN ('cancelled', 'rejected')`,
      [providerId, bookingDate, bookingTime]
    );
    return result.rows.length === 0;
  },

  // =========================================================================
  // GET BOOKING HISTORY (Customer)
  // =========================================================================

  async getBookingHistory(customerId, filters = {}) {
    const { page = 1, limit = 10, status, search, startDate, endDate } = filters;
    const offset = (page - 1) * limit;
    
    let conditions = ['b.customer_id = $1'];
    let params = [customerId];
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
        u.avatar as provider_avatar,
        COALESCE(r.rating, 0) as rating
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      LEFT JOIN reviews r ON r.booking_id = b.id AND r.user_id = b.customer_id
      WHERE ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      bookings: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
};

export default BookingModel;