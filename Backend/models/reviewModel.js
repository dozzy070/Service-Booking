// models/ReviewModel.js
import pool from '../config/db.js';

const ReviewModel = {
  // =========================================================================
  // CREATE REVIEW
  // =========================================================================

  async create(reviewData) {
    const { user_id, service_id, booking_id, rating, comment, images = [] } = reviewData;

    const result = await pool.query(
      `INSERT INTO reviews (user_id, service_id, booking_id, rating, comment, images, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [user_id, service_id, booking_id, rating, comment || '', images]
    );

    // Update service average rating
    await this.updateServiceRating(service_id);

    // Update booking with rating
    if (booking_id) {
      await pool.query(
        'UPDATE bookings SET rating = $1 WHERE id = $2',
        [rating, booking_id]
      );
    }

    return result.rows[0];
  },

  // =========================================================================
  // UPDATE REVIEW
  // =========================================================================

  async update(reviewId, userId, data) {
    const { rating, comment, images } = data;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (rating !== undefined) {
      fields.push(`rating = $${paramIndex++}`);
      values.push(rating);
    }
    if (comment !== undefined) {
      fields.push(`comment = $${paramIndex++}`);
      values.push(comment);
    }
    if (images !== undefined) {
      fields.push(`images = $${paramIndex++}`);
      values.push(images);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    fields.push(`is_edited = true`);
    values.push(reviewId, userId);

    const result = await pool.query(
      `UPDATE reviews SET ${fields.join(', ')} 
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    if (result.rows.length > 0 && rating !== undefined) {
      // Get service_id from review
      const review = await this.getById(reviewId);
      if (review) {
        await this.updateServiceRating(review.service_id);
      }
    }

    return result.rows[0] || null;
  },

  // =========================================================================
  // GET REVIEW BY ID
  // =========================================================================

  async getById(reviewId) {
    const result = await pool.query(
      `SELECT r.*, 
              u.name as user_name, 
              u.avatar as user_avatar,
              s.title as service_title,
              s.provider_id,
              p.name as provider_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       JOIN users p ON s.provider_id = p.id
       WHERE r.id = $1`,
      [reviewId]
    );
    return result.rows[0] || null;
  },

  // =========================================================================
  // GET REVIEWS BY SERVICE
  // =========================================================================

  async getByService(serviceId, filters = {}) {
    const { page = 1, limit = 10, rating, sort = 'newest' } = filters;
    const offset = (page - 1) * limit;

    let conditions = ['r.service_id = $1'];
    let params = [serviceId];
    let paramIndex = 2;

    if (rating && rating !== 'all') {
      conditions.push(`r.rating = $${paramIndex++}`);
      params.push(parseInt(rating));
    }

    const whereClause = conditions.join(' AND ');

    let orderBy = 'r.created_at DESC';
    if (sort === 'oldest') orderBy = 'r.created_at ASC';
    else if (sort === 'highest') orderBy = 'r.rating DESC';
    else if (sort === 'lowest') orderBy = 'r.rating ASC';
    else if (sort === 'helpful') orderBy = 'r.helpful_count DESC';

    const countQuery = `SELECT COUNT(*) as total FROM reviews r WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT r.*, 
             u.name as user_name, 
             u.avatar as user_avatar,
             COALESCE(r.helpful_count, 0) as helpful_count,
             COALESCE(r.not_helpful_count, 0) as not_helpful_count
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      reviews: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  // =========================================================================
  // GET REVIEWS BY PROVIDER
  // =========================================================================

  async getByProvider(providerId, filters = {}) {
    const { page = 1, limit = 10, rating, sort = 'newest' } = filters;
    const offset = (page - 1) * limit;

    let conditions = ['s.provider_id = $1'];
    let params = [providerId];
    let paramIndex = 2;

    if (rating && rating !== 'all') {
      conditions.push(`r.rating = $${paramIndex++}`);
      params.push(parseInt(rating));
    }

    const whereClause = conditions.join(' AND ');

    let orderBy = 'r.created_at DESC';
    if (sort === 'oldest') orderBy = 'r.created_at ASC';
    else if (sort === 'highest') orderBy = 'r.rating DESC';
    else if (sort === 'lowest') orderBy = 'r.rating ASC';

    const countQuery = `SELECT COUNT(*) as total FROM reviews r JOIN services s ON r.service_id = s.id WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT r.*,
             u.name as user_name,
             u.avatar as user_avatar,
             s.title as service_title,
             s.id as service_id,
             COALESCE(r.helpful_count, 0) as helpful_count,
             COALESCE(r.not_helpful_count, 0) as not_helpful_count,
             r.response,
             r.responded_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get stats
    const stats = await this.getProviderStats(providerId);

    return {
      reviews: result.rows,
      stats,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  // =========================================================================
  // GET REVIEWS BY USER
  // =========================================================================

  async getByUser(userId, filters = {}) {
    const { page = 1, limit = 10, rating } = filters;
    const offset = (page - 1) * limit;

    let conditions = ['r.user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (rating && rating !== 'all') {
      conditions.push(`r.rating = $${paramIndex++}`);
      params.push(parseInt(rating));
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM reviews r WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT r.*,
             s.title as service_title,
             s.id as service_id,
             p.name as provider_name,
             p.id as provider_id,
             COALESCE(r.helpful_count, 0) as helpful_count,
             r.response as provider_response,
             r.responded_at as provider_responded_at
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users p ON s.provider_id = p.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return {
      reviews: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  // =========================================================================
  // GET AVERAGE RATING FOR PROVIDER
  // =========================================================================

  async getAverageRatingForProvider(providerId) {
    const result = await pool.query(
      `SELECT COALESCE(AVG(r.rating), 0) as average_rating, COUNT(*) as total_reviews
       FROM reviews r
       JOIN services s ON r.service_id = s.id
       WHERE s.provider_id = $1`,
      [providerId]
    );
    return {
      averageRating: parseFloat(result.rows[0].average_rating || 0),
      totalReviews: parseInt(result.rows[0].total_reviews || 0)
    };
  },

  // =========================================================================
  // GET PROVIDER STATS
  // =========================================================================

  async getProviderStats(providerId) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(AVG(rating), 0) as average,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
        COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as responded,
        COALESCE(SUM(helpful_count), 0) as total_helpful
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE s.provider_id = $1
    `, [providerId]);

    const row = result.rows[0];
    const total = parseInt(row.total || 0);

    return {
      total,
      average: parseFloat(row.average || 0),
      distribution: {
        5: parseInt(row.five_star || 0),
        4: parseInt(row.four_star || 0),
        3: parseInt(row.three_star || 0),
        2: parseInt(row.two_star || 0),
        1: parseInt(row.one_star || 0)
      },
      responded: parseInt(row.responded || 0),
      responseRate: total > 0 ? (parseInt(row.responded || 0) / total) * 100 : 0,
      totalHelpful: parseInt(row.total_helpful || 0)
    };
  },

  // =========================================================================
  // GET SERVICE STATS
  // =========================================================================

  async getServiceStats(serviceId) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COALESCE(AVG(rating), 0) as average,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE service_id = $1
    `, [serviceId]);

    const row = result.rows[0];
    const total = parseInt(row.total || 0);

    return {
      total,
      average: parseFloat(row.average || 0),
      distribution: {
        5: parseInt(row.five_star || 0),
        4: parseInt(row.four_star || 0),
        3: parseInt(row.three_star || 0),
        2: parseInt(row.two_star || 0),
        1: parseInt(row.one_star || 0)
      }
    };
  },

  // =========================================================================
  // UPDATE SERVICE RATING
  // =========================================================================

  async updateServiceRating(serviceId) {
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
  },

  // =========================================================================
  // RESPOND TO REVIEW (Provider)
  // =========================================================================

  async respondToReview(reviewId, providerId, response) {
    // Verify the review belongs to a service of this provider
    const check = await pool.query(
      `SELECT r.id 
       FROM reviews r
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1 AND s.provider_id = $2`,
      [reviewId, providerId]
    );

    if (check.rows.length === 0) {
      return null;
    }

    const result = await pool.query(
      `UPDATE reviews 
       SET response = $1, responded_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [response, reviewId]
    );

    return result.rows[0] || null;
  },

  // =========================================================================
  // MARK HELPFUL / NOT HELPFUL
  // =========================================================================

  async markHelpful(reviewId, userId) {
    // Check if user already marked this review
    const existing = await pool.query(
      'SELECT id FROM review_helpfulness WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (existing.rows.length > 0) {
      // Toggle off
      await pool.query(
        'DELETE FROM review_helpfulness WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );
      await pool.query(
        'UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = $1',
        [reviewId]
      );
      return { helpful: false };
    }

    await pool.query(
      'INSERT INTO review_helpfulness (review_id, user_id, is_helpful) VALUES ($1, $2, true)',
      [reviewId, userId]
    );
    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1',
      [reviewId]
    );
    return { helpful: true };
  },

  // =========================================================================
  // DELETE REVIEW
  // =========================================================================

  async delete(reviewId, userId) {
    // Get service_id before deleting
    const review = await this.getById(reviewId);
    
    if (!review) {
      return null;
    }

    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
      [reviewId, userId]
    );

    if (result.rows.length > 0) {
      await this.updateServiceRating(review.service_id);
    }

    return result.rows[0] || null;
  },

  // =========================================================================
  // GET REVIEW SUMMARY
  // =========================================================================

  async getReviewSummary(filters = {}) {
    const { providerId, serviceId, startDate, endDate } = filters;
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (providerId) {
      conditions.push(`s.provider_id = $${paramIndex++}`);
      params.push(providerId);
    }
    if (serviceId) {
      conditions.push(`r.service_id = $${paramIndex++}`);
      params.push(serviceId);
    }
    if (startDate) {
      conditions.push(`r.created_at >= $${paramIndex++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`r.created_at <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total,
        COALESCE(AVG(rating), 0) as average,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as neutral,
        COUNT(CASE WHEN rating < 3 THEN 1 END) as negative,
        COUNT(CASE WHEN r.response IS NOT NULL THEN 1 END) as responded,
        COALESCE(SUM(helpful_count), 0) as total_helpful
      FROM reviews r
      LEFT JOIN services s ON r.service_id = s.id
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];
    const total = parseInt(row.total || 0);

    return {
      total,
      average: parseFloat(row.average || 0),
      minRating: parseInt(row.min_rating || 0),
      maxRating: parseInt(row.max_rating || 0),
      positive: parseInt(row.positive || 0),
      neutral: parseInt(row.neutral || 0),
      negative: parseInt(row.negative || 0),
      responded: parseInt(row.responded || 0),
      responseRate: total > 0 ? (parseInt(row.responded || 0) / total) * 100 : 0,
      totalHelpful: parseInt(row.total_helpful || 0)
    };
  },

  // =========================================================================
  // GET RECENT REVIEWS
  // =========================================================================

  async getRecent(limit = 10, filters = {}) {
    const { providerId, serviceId } = filters;
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    if (providerId) {
      conditions.push(`s.provider_id = $${paramIndex++}`);
      params.push(providerId);
    }
    if (serviceId) {
      conditions.push(`r.service_id = $${paramIndex++}`);
      params.push(serviceId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT r.*,
             u.name as user_name,
             u.avatar as user_avatar,
             s.title as service_title,
             s.id as service_id,
             p.name as provider_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      JOIN users p ON s.provider_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex++}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  },

  // =========================================================================
  // GET AVERAGE RATING AND COUNT DIRECT
  // =========================================================================

  async getAverageRatingAndCountForProviderDirect(providerId) {
    const result = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE provider_id = $1`,
      [providerId]
    );
    return {
      averageRating: parseFloat(result.rows[0].average_rating || 0),
      totalReviews: parseInt(result.rows[0].total_reviews || 0)
    };
  }
};

export default ReviewModel;