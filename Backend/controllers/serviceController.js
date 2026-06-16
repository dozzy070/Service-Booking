// controllers/serviceController.js
import pool from '../config/db.js';
import {
  getServiceById as getServiceByIdModel,
  createService as createServiceModel,
  updateService as updateServiceModel,
  deleteService as deleteServiceModel,
  getProviderServices as getProviderServicesModel
} from '../models/serviceModel.js';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// =========================================================================
// GET SERVICE BY ID
// =========================================================================

export const getServiceById = async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        s.*,
        u.id as provider_id,
        u.name as provider_name,
        u.avatar as provider_avatar,
        u.phone as provider_phone,
        u.email as provider_email,
        u.address as provider_address,
        c.name as category_name,
        c.id as category_id,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE s.id = $1
      GROUP BY s.id, u.id, u.name, u.avatar, u.phone, u.email, u.address, c.name, c.id
    `, [serviceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = result.rows[0];
    
    // Get service images
    const imagesResult = await pool.query(
      'SELECT image_url FROM service_images WHERE service_id = $1 ORDER BY display_order',
      [serviceId]
    );
    
    // Get service features
    const featuresResult = await pool.query(
      'SELECT feature FROM service_features WHERE service_id = $1 ORDER BY display_order',
      [serviceId]
    );

    res.json({
      ...service,
      avg_rating: parseFloat(service.avg_rating || 0),
      review_count: parseInt(service.review_count || 0),
      booking_count: parseInt(service.booking_count || 0),
      total_revenue: parseFloat(service.total_revenue || 0),
      images: imagesResult.rows.map(row => row.image_url),
      features: featuresResult.rows.map(row => row.feature),
      price: parseFloat(service.price)
    });
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
};

// =========================================================================
// CREATE SERVICE
// =========================================================================

export const createService = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      price,
      duration,
      location,
      address,
      city,
      state,
      zip_code,
      features,
      requirements,
      images,
      cancellation_policy,
      max_bookings_per_day,
      advance_booking,
      service_type,
      languages
    } = req.body;
    
    const providerId = req.user.id;

    // Validate required fields
    if (!title || !description || !price) {
      return res.status(400).json({ message: 'Title, description, and price are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert service
      const result = await client.query(
        `INSERT INTO services (
          provider_id, title, description, category_id, price, duration,
          location, address, city, state, zip_code, cancellation_policy,
          max_bookings_per_day, advance_booking, service_type, languages,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', NOW())
        RETURNING *`,
        [
          providerId, title, description, category_id, price, duration,
          location, address, city, state, zip_code, cancellation_policy || 'flexible',
          max_bookings_per_day || 5, advance_booking || 2, service_type || 'both',
          languages || ['English']
        ]
      );

      const serviceId = result.rows[0].id;

      // Insert features
      if (features && features.length > 0) {
        for (let i = 0; i < features.length; i++) {
          if (features[i].trim()) {
            await client.query(
              'INSERT INTO service_features (service_id, feature, display_order) VALUES ($1, $2, $3)',
              [serviceId, features[i].trim(), i]
            );
          }
        }
      }

      // Insert requirements
      if (requirements && requirements.length > 0) {
        for (let i = 0; i < requirements.length; i++) {
          if (requirements[i].trim()) {
            await client.query(
              'INSERT INTO service_requirements (service_id, requirement, display_order) VALUES ($1, $2, $3)',
              [serviceId, requirements[i].trim(), i]
            );
          }
        }
      }

      // Insert images
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          if (images[i]) {
            await client.query(
              'INSERT INTO service_images (service_id, image_url, display_order) VALUES ($1, $2, $3)',
              [serviceId, images[i], i]
            );
          }
        }
      }

      await client.query('COMMIT');

      // Fetch complete service
      const completeService = await getServiceByIdModel(serviceId);
      res.status(201).json(completeService);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({ message: 'Failed to create service' });
  }
};

// =========================================================================
// UPDATE SERVICE
// =========================================================================

export const updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const providerId = req.user.id;
    const {
      title,
      description,
      category_id,
      price,
      duration,
      location,
      address,
      city,
      state,
      zip_code,
      features,
      requirements,
      images,
      cancellation_policy,
      max_bookings_per_day,
      advance_booking,
      service_type,
      languages,
      status
    } = req.body;

    // Check if service exists and belongs to provider
    const serviceCheck = await pool.query(
      'SELECT provider_id FROM services WHERE id = $1',
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (serviceCheck.rows[0].provider_id !== providerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update service
      await client.query(
        `UPDATE services SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          price = COALESCE($4, price),
          duration = COALESCE($5, duration),
          location = COALESCE($6, location),
          address = COALESCE($7, address),
          city = COALESCE($8, city),
          state = COALESCE($9, state),
          zip_code = COALESCE($10, zip_code),
          cancellation_policy = COALESCE($11, cancellation_policy),
          max_bookings_per_day = COALESCE($12, max_bookings_per_day),
          advance_booking = COALESCE($13, advance_booking),
          service_type = COALESCE($14, service_type),
          languages = COALESCE($15, languages),
          status = COALESCE($16, status),
          updated_at = NOW()
        WHERE id = $17`,
        [
          title, description, category_id, price, duration, location,
          address, city, state, zip_code, cancellation_policy,
          max_bookings_per_day, advance_booking, service_type, languages,
          status, serviceId
        ]
      );

      // Update features (delete and re-insert)
      if (features !== undefined) {
        await client.query('DELETE FROM service_features WHERE service_id = $1', [serviceId]);
        if (features && features.length > 0) {
          for (let i = 0; i < features.length; i++) {
            if (features[i].trim()) {
              await client.query(
                'INSERT INTO service_features (service_id, feature, display_order) VALUES ($1, $2, $3)',
                [serviceId, features[i].trim(), i]
              );
            }
          }
        }
      }

      // Update requirements (delete and re-insert)
      if (requirements !== undefined) {
        await client.query('DELETE FROM service_requirements WHERE service_id = $1', [serviceId]);
        if (requirements && requirements.length > 0) {
          for (let i = 0; i < requirements.length; i++) {
            if (requirements[i].trim()) {
              await client.query(
                'INSERT INTO service_requirements (service_id, requirement, display_order) VALUES ($1, $2, $3)',
                [serviceId, requirements[i].trim(), i]
              );
            }
          }
        }
      }

      // Update images (delete and re-insert)
      if (images !== undefined) {
        await client.query('DELETE FROM service_images WHERE service_id = $1', [serviceId]);
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            if (images[i]) {
              await client.query(
                'INSERT INTO service_images (service_id, image_url, display_order) VALUES ($1, $2, $3)',
                [serviceId, images[i], i]
              );
            }
          }
        }
      }

      await client.query('COMMIT');

      // Fetch updated service
      const updatedService = await getServiceByIdModel(serviceId);
      res.json(updatedService);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in updateService:', error);
    res.status(500).json({ message: 'Failed to update service' });
  }
};

// =========================================================================
// DELETE SERVICE
// =========================================================================

export const deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const providerId = req.user.id;

    // Check if service exists and belongs to provider
    const serviceCheck = await pool.query(
      'SELECT provider_id FROM services WHERE id = $1',
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (serviceCheck.rows[0].provider_id !== providerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    // Check if service has active bookings
    const bookingCheck = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE service_id = $1 AND status NOT IN (\'completed\', \'cancelled\')',
      [serviceId]
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete service with active bookings' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete related records
      await client.query('DELETE FROM service_features WHERE service_id = $1', [serviceId]);
      await client.query('DELETE FROM service_requirements WHERE service_id = $1', [serviceId]);
      await client.query('DELETE FROM service_images WHERE service_id = $1', [serviceId]);
      await client.query('DELETE FROM favorites WHERE service_id = $1', [serviceId]);
      await client.query('DELETE FROM services WHERE id = $1', [serviceId]);

      await client.query('COMMIT');
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in deleteService:', error);
    res.status(500).json({ message: 'Failed to delete service' });
  }
};

// =========================================================================
// GET CATEGORIES
// =========================================================================

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.slug, c.icon, c.color, c.image,
             COUNT(DISTINCT s.id) as service_count,
             COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id AND s.status = 'approved'
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      GROUP BY c.id, c.name, c.slug, c.icon, c.color, c.image
      ORDER BY c.name
    `);

    if (result.rows.length > 0) {
      return res.json(result.rows);
    }

    // Fallback: get distinct categories from services
    const fallback = await pool.query(`
      SELECT DISTINCT category as name, category as slug, NULL as icon
      FROM services
      WHERE category IS NOT NULL AND status = 'approved'
      ORDER BY category
    `);

    res.json(fallback.rows);
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// =========================================================================
// ADD REVIEW
// =========================================================================

export const addReview = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user.id;
    const { rating, comment, images } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user has completed a booking for this service
    const bookingCheck = await pool.query(
      `SELECT id FROM bookings 
       WHERE customer_id = $1 AND service_id = $2 AND status = 'completed'`,
      [userId, serviceId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You must complete a booking for this service to review it' });
    }

    // Check if user already reviewed this service
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND service_id = $2',
      [userId, serviceId]
    );

    if (reviewCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, service_id, rating, comment, images, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [userId, serviceId, rating, comment || '', images || []]
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
    `, [serviceId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in addReview:', error);
    res.status(500).json({ message: 'Failed to add review' });
  }
};

// =========================================================================
// GET REVIEWS
// =========================================================================

export const getReviews = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['service_id = $1'];
    let params = [serviceId];
    let paramIndex = 2;

    if (rating && rating !== 'all') {
      conditions.push(`rating = $${paramIndex}`);
      params.push(parseInt(rating));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM reviews WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      reviews: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getReviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// =========================================================================
// GET PROVIDER SERVICES
// =========================================================================

export const getProviderServices = async (req, res) => {
  try {
    const providerId = req.params.providerId || req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['s.provider_id = $1'];
    let params = [providerId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM services s WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT 
        s.*,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE ${whereClause}
      GROUP BY s.id, c.name
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      services: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getProviderServices:', error);
    res.status(500).json({ message: 'Failed to fetch provider services' });
  }
};

// =========================================================================
// SEARCH SERVICES
// =========================================================================

export const searchServices = async (req, res) => {
  try {
    const { q, category, location, minPrice, maxPrice, sort = 'newest', limit = 20, offset = 0 } = req.query;

    let conditions = ['s.status = $1'];
    let params = ['approved'];
    let paramIndex = 2;

    if (q) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`(s.category_id = $${paramIndex} OR c.slug = $${paramIndex})`);
      params.push(category);
      paramIndex++;
    }

    if (location) {
      conditions.push(`(s.location ILIKE $${paramIndex} OR s.city ILIKE $${paramIndex})`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (minPrice) {
      conditions.push(`s.price >= $${paramIndex}`);
      params.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      conditions.push(`s.price <= $${paramIndex}`);
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    let orderBy = 's.created_at DESC';
    if (sort === 'price_low') orderBy = 's.price ASC';
    else if (sort === 'price_high') orderBy = 's.price DESC';
    else if (sort === 'rating') orderBy = 'COALESCE(AVG(r.rating), 0) DESC';
    else if (sort === 'popular') orderBy = 'COUNT(DISTINCT b.id) DESC';

    const query = `
      SELECT 
        s.*,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE ${whereClause}
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      services: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error in searchServices:', error);
    res.status(500).json({ message: 'Failed to search services' });
  }
};

// =========================================================================
// GET POPULAR SERVICES
// =========================================================================

export const getPopularServices = async (req, res) => {
  try {
    const { limit = 8, days = 30 } = req.query;

    const result = await pool.query(`
      SELECT 
        s.*,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed' 
        AND b.booking_date >= NOW() - INTERVAL '${days} days'
      WHERE s.status = 'approved'
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY booking_count DESC, avg_rating DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getPopularServices:', error);
    res.status(500).json({ message: 'Failed to fetch popular services' });
  }
};

// =========================================================================
// GET RECOMMENDED SERVICES
// =========================================================================

export const getRecommendedServices = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { limit = 6 } = req.query;

    let query = `
      SELECT 
        s.*,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE s.status = 'approved'
      GROUP BY s.id, u.name, u.avatar, c.name
    `;

    // If user is logged in, prioritize categories they've used before
    if (userId) {
      const userCategories = await pool.query(`
        SELECT DISTINCT s.category_id
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.customer_id = $1 AND b.status = 'completed'
      `, [userId]);

      if (userCategories.rows.length > 0) {
        const categoryIds = userCategories.rows.map(r => r.category_id).filter(id => id !== null);
        if (categoryIds.length > 0) {
          query += ` AND s.category_id = ANY($1)`;
          const result = await pool.query(query + ` ORDER BY avg_rating DESC, booking_count DESC LIMIT $2`, [categoryIds, parseInt(limit)]);
          return res.json(result.rows);
        }
      }
    }

    // Fallback: get highest rated services
    query += ` ORDER BY avg_rating DESC, booking_count DESC LIMIT $1`;
    const result = await pool.query(query, [parseInt(limit)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getRecommendedServices:', error);
    res.status(500).json({ message: 'Failed to fetch recommended services' });
  }
};

// =========================================================================
// GET SIMILAR SERVICES
// =========================================================================

export const getSimilarServices = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { limit = 4 } = req.query;

    // Get the service's category
    const service = await pool.query(
      'SELECT category_id FROM services WHERE id = $1',
      [serviceId]
    );

    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const categoryId = service.rows[0].category_id;

    const result = await pool.query(`
      SELECT 
        s.*,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE s.status = 'approved' 
        AND s.id != $1 
        AND (s.category_id = $2 OR s.category_id IS NULL)
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY avg_rating DESC, booking_count DESC
      LIMIT $3
    `, [serviceId, categoryId, parseInt(limit)]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getSimilarServices:', error);
    res.status(500).json({ message: 'Failed to fetch similar services' });
  }
};

// =========================================================================
// FAVORITES
// =========================================================================

export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceId = req.params.id;

    // Check if service exists
    const serviceCheck = await pool.query(
      'SELECT id FROM services WHERE id = $1 AND status = \'approved\'',
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if already favorited
    const favoriteCheck = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
      [userId, serviceId]
    );

    if (favoriteCheck.rows.length > 0) {
      // Remove from favorites
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND service_id = $2',
        [userId, serviceId]
      );
      return res.json({ favorited: false, message: 'Removed from favorites' });
    } else {
      // Add to favorites
      await pool.query(
        'INSERT INTO favorites (user_id, service_id) VALUES ($1, $2)',
        [userId, serviceId]
      );
      return res.json({ favorited: true, message: 'Added to favorites' });
    }
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    res.status(500).json({ message: 'Failed to toggle favorite' });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        s.*,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        f.created_at as favorited_at
      FROM favorites f
      JOIN services s ON f.service_id = s.id
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE f.user_id = $1 AND s.status = 'approved'
      GROUP BY s.id, u.name, u.avatar, c.name, f.created_at
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error in getFavorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
};

export const isFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceId = req.params.id;

    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
      [userId, serviceId]
    );

    res.json({ isFavorite: result.rows.length > 0 });
  } catch (error) {
    console.error('Error in isFavorite:', error);
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
};

// =========================================================================
// GET AVAILABILITY
// =========================================================================

export const getAvailability = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Get service details
    const service = await pool.query(
      'SELECT provider_id, duration FROM services WHERE id = $1',
      [serviceId]
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
    const bookings = await pool.query(`
      SELECT booking_time FROM bookings
      WHERE service_id = $1 AND booking_date::date = $2
        AND status NOT IN ('cancelled', 'rejected')
    `, [serviceId, date]);

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
    console.error('Error in getAvailability:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
};

// =========================================================================
// GET SERVICE STATS
// =========================================================================

export const getServiceStats = async (req, res) => {
  try {
    const serviceId = req.params.id;

    const result = await pool.query(`
      SELECT
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews,
        COUNT(DISTINCT CASE WHEN r.rating >= 4 THEN r.id END) as positive_reviews,
        COUNT(DISTINCT CASE WHEN r.rating < 3 THEN r.id END) as negative_reviews      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [serviceId]);

    res.json(result.rows[0] || {
      total_revenue: 0,
      total_bookings: 0,
      completed_bookings: 0,
      pending_bookings: 0,
      cancelled_bookings: 0,
      avg_rating: 0,
      total_reviews: 0,
      positive_reviews: 0,
      negative_reviews: 0
    });
  } catch (error) {
    console.error('Error in getServiceStats:', error);
    res.status(500).json({ message: 'Failed to fetch service stats' });
  }
};