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
      WHERE s.id = $1 AND s.deleted_at IS NULL
      GROUP BY s.id, u.id, u.name, u.avatar, u.phone, u.email, u.address, c.name, c.id
    `, [serviceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = result.rows[0];
    
    // Get service images from the images array
    const images = service.images || [];
    
    // Get service features from the features array
    const features = service.features || [];
    
    // Get service requirements from the requirements array
    const requirements = service.requirements || [];

    res.json({
      ...service,
      avg_rating: parseFloat(service.avg_rating || 0),
      review_count: parseInt(service.review_count || 0),
      booking_count: parseInt(service.booking_count || 0),
      total_revenue: parseFloat(service.total_revenue || 0),
      images: images,
      features: features,
      requirements: requirements,
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
      short_description,
      category_id,
      price,
      discount_price,
      price_type,
      currency,
      duration,
      location,
      address,
      city,
      state,
      zip_code,
      postal_code,
      features,
      requirements,
      images,
      cancellation_policy,
      max_bookings_per_day,
      advance_booking,
      service_type,
      languages,
      tags,
      is_remote,
      is_active
    } = req.body;
    
    const providerId = req.user.id;

    // Validate required fields
    if (!title || !description || !price) {
      return res.status(400).json({ message: 'Title, description, and price are required' });
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const result = await pool.query(
      `INSERT INTO services (
        provider_id, title, description, short_description, category_id, 
        price, discount_price, price_type, currency, duration,
        location, address, city, state, zip_code, postal_code,
        features, requirements, images, cancellation_policy,
        max_bookings_per_day, advance_booking, service_type, languages,
        tags, is_remote, is_active, slug, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, 'pending', NOW())
      RETURNING *`,
      [
        providerId, title, description, short_description || null, category_id || null,
        price, discount_price || null, price_type || 'fixed', currency || 'NGN', duration || '60',
        location || null, address || null, city || null, state || null, zip_code || null, postal_code || null,
        features || [], requirements || [], images || [], cancellation_policy || 'flexible',
        max_bookings_per_day || 5, advance_booking || 2, service_type || 'both', languages || ['English'],
        tags || [], is_remote || false, is_active !== undefined ? is_active : true, slug
      ]
    );

    const service = result.rows[0];
    res.status(201).json({
      message: 'Service created successfully. Waiting for admin approval.',
      service: {
        ...service,
        price: parseFloat(service.price),
        discount_price: service.discount_price ? parseFloat(service.discount_price) : null
      }
    });
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({ message: 'Failed to create service', error: error.message });
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
      short_description,
      category_id,
      price,
      discount_price,
      price_type,
      currency,
      duration,
      location,
      address,
      city,
      state,
      zip_code,
      postal_code,
      features,
      requirements,
      images,
      cancellation_policy,
      max_bookings_per_day,
      advance_booking,
      service_type,
      languages,
      tags,
      is_remote,
      is_active,
      status
    } = req.body;

    // Check if service exists and belongs to provider
    const serviceCheck = await pool.query(
      'SELECT provider_id FROM services WHERE id = $1 AND deleted_at IS NULL',
      [serviceId]
    );

    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (serviceCheck.rows[0].provider_id !== providerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    // Generate slug if title changed
    let slug = undefined;
    if (title) {
      slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const result = await pool.query(
      `UPDATE services SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        short_description = COALESCE($3, short_description),
        category_id = COALESCE($4, category_id),
        price = COALESCE($5, price),
        discount_price = COALESCE($6, discount_price),
        price_type = COALESCE($7, price_type),
        currency = COALESCE($8, currency),
        duration = COALESCE($9, duration),
        location = COALESCE($10, location),
        address = COALESCE($11, address),
        city = COALESCE($12, city),
        state = COALESCE($13, state),
        zip_code = COALESCE($14, zip_code),
        postal_code = COALESCE($15, postal_code),
        features = COALESCE($16, features),
        requirements = COALESCE($17, requirements),
        images = COALESCE($18, images),
        cancellation_policy = COALESCE($19, cancellation_policy),
        max_bookings_per_day = COALESCE($20, max_bookings_per_day),
        advance_booking = COALESCE($21, advance_booking),
        service_type = COALESCE($22, service_type),
        languages = COALESCE($23, languages),
        tags = COALESCE($24, tags),
        is_remote = COALESCE($25, is_remote),
        is_active = COALESCE($26, is_active),
        status = COALESCE($27, status),
        slug = COALESCE($28, slug),
        updated_at = NOW()
      WHERE id = $29
      RETURNING *`,
      [
        title, description, short_description, category_id, price, discount_price,
        price_type, currency, duration, location, address, city, state, zip_code,
        postal_code, features, requirements, images, cancellation_policy,
        max_bookings_per_day, advance_booking, service_type, languages,
        tags, is_remote, is_active, status, slug, serviceId
      ]
    );

    const service = result.rows[0];
    res.json({
      message: 'Service updated successfully',
      service: {
        ...service,
        price: parseFloat(service.price),
        discount_price: service.discount_price ? parseFloat(service.discount_price) : null
      }
    });
  } catch (error) {
    console.error('Error in updateService:', error);
    res.status(500).json({ message: 'Failed to update service', error: error.message });
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
      'SELECT provider_id FROM services WHERE id = $1 AND deleted_at IS NULL',
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
      `SELECT COUNT(*) as count FROM bookings 
       WHERE service_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [serviceId]
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Cannot delete service with active bookings' });
    }

    // Soft delete
    await pool.query(
      'UPDATE services SET deleted_at = NOW(), is_active = false WHERE id = $1',
      [serviceId]
    );

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error in deleteService:', error);
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};


// =========================================================================
// GET CATEGORIES
// =========================================================================
export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.icon, 
        c.color, 
        c.description,
        c.display_order,
        c.created_at,
        COUNT(DISTINCT s.id) as service_count,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as total_bookings
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id 
        AND s.deleted_at IS NULL 
        AND (s.status = 'approved' OR s.status = 'active')
      LEFT JOIN bookings b ON b.service_id = s.id
      GROUP BY c.id, c.name, c.slug, c.icon, c.color, c.description, c.display_order, c.created_at
      ORDER BY c.display_order ASC NULLS LAST, c.name ASC
    `);

    // If no categories found, return empty array instead of error
    if (result.rows.length === 0) {
      return res.json([]);
    }

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: row.icon || '📦',
      color: row.color || '#3b82f6',
      description: row.description,
      display_order: row.display_order || 0,
      created_at: row.created_at,
      service_count: parseInt(row.service_count, 10),
      total_revenue: parseFloat(row.total_revenue || 0),
      total_bookings: parseInt(row.total_bookings || 0)
    }));

    console.log(`✅ Found ${categories.length} categories`);
    res.json(categories);
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    console.error('Stack:', error.stack);
    
    // Return empty array with 200 status instead of 500
    // This prevents frontend crashes while we debug
    res.status(200).json([]);
  }
};

// =========================================================================
// GET POPULAR SERVICES (FIXED)
// =========================================================================

export const getPopularServices = async (req, res) => {
  try {
    const { limit = 8, days = 30 } = req.query;

    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.short_description,
        s.price,
        s.discount_price,
        s.currency,
        s.price_type,
        s.image as main_image,
        s.images,
        s.location,
        s.city,
        s.state,
        s.avg_rating,
        s.review_count,
        s.status,
        s.slug,
        s.is_featured,
        s.is_popular,
        s.created_at,
        u.id as provider_id,
        u.name as provider_name,
        u.avatar as provider_avatar,
        u.phone as provider_phone,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(AVG(r.rating), s.avg_rating, 0) as avg_rating_calc,
        COUNT(DISTINCT r.id) as review_count_calc,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM services s
      JOIN users u ON s.provider_id = u.id AND u.is_active = true
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed' 
        AND b.booking_date >= NOW() - INTERVAL '${parseInt(days)} days'
      WHERE (s.status = 'approved' OR s.status = 'active')
        AND (s.is_active = true OR s.is_active IS NULL)
        AND s.deleted_at IS NULL
        AND u.is_active = true
      GROUP BY s.id, u.id, u.name, u.avatar, u.phone, c.id, c.name, c.icon, c.color
      ORDER BY booking_count DESC, avg_rating_calc DESC, s.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    const services = result.rows.map(s => {
      // Get first image from images array or use main_image
      const imageUrl = s.images && s.images.length > 0 
        ? s.images[0] 
        : s.main_image || 'https://via.placeholder.com/300x200?text=Service';

      return {
        id: s.id,
        title: s.title || 'Unnamed Service',
        description: s.description || 'No description available',
        short_description: s.short_description || null,
        price: parseFloat(s.price) || 0,
        discount_price: s.discount_price ? parseFloat(s.discount_price) : null,
        currency: s.currency || 'NGN',
        price_type: s.price_type || 'fixed',
        image: imageUrl,
        images: s.images || [],
        location: s.location || s.city || 'Location not specified',
        city: s.city,
        state: s.state,
        avg_rating: parseFloat(s.avg_rating_calc) || parseFloat(s.avg_rating) || 0,
        review_count: parseInt(s.review_count_calc) || parseInt(s.review_count) || 0,
        booking_count: parseInt(s.booking_count) || 0,
        total_revenue: parseFloat(s.total_revenue) || 0,
        provider_id: s.provider_id,
        provider_name: s.provider_name || 'Unknown Provider',
        provider_avatar: s.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.provider_name || 'Provider')}&background=10b981&color=fff&size=64`,
        provider_phone: s.provider_phone,
        category_id: s.category_id,
        category_name: s.category_name || 'Uncategorized',
        category_icon: s.category_icon || '📦',
        category_color: s.category_color || '#3b82f6',
        status: s.status,
        slug: s.slug,
        is_featured: s.is_featured || false,
        is_popular: s.is_popular || false,
        created_at: s.created_at
      };
    });
    
    console.log(`✅ Found ${services.length} popular services`);
    res.json(services);
    
  } catch (error) {
    console.error('❌ Error fetching popular services:', error.message);
    res.json([]);
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

    let conditions = ['s.provider_id = $1', 's.deleted_at IS NULL'];
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
      services: result.rows.map(s => ({
        ...s,
        price: parseFloat(s.price),
        discount_price: s.discount_price ? parseFloat(s.discount_price) : null,
        avg_rating: parseFloat(s.avg_rating || 0),
        review_count: parseInt(s.review_count || 0),
        booking_count: parseInt(s.booking_count || 0),
        total_revenue: parseFloat(s.total_revenue || 0)
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getProviderServices:', error);
    res.status(500).json({ message: 'Failed to fetch provider services', error: error.message });
  }
};

// =========================================================================
// SEARCH SERVICES
// =========================================================================

export const searchServices = async (req, res) => {
  try {
    const { q, category, location, minPrice, maxPrice, sort = 'newest', limit = 20, offset = 0 } = req.query;

    let conditions = ['s.deleted_at IS NULL', "(s.status = 'approved' OR s.status = 'active')"];
    let params = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.short_description ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`(s.category_id = $${paramIndex} OR c.slug = $${paramIndex} OR c.name ILIKE $${paramIndex})`);
      params.push(category);
      paramIndex++;
    }

    if (location) {
      conditions.push(`(s.location ILIKE $${paramIndex} OR s.city ILIKE $${paramIndex} OR s.state ILIKE $${paramIndex})`);
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

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderBy = 's.created_at DESC';
    if (sort === 'price_low') orderBy = 's.price ASC';
    else if (sort === 'price_high') orderBy = 's.price DESC';
    else if (sort === 'rating') orderBy = 's.avg_rating DESC';
    else if (sort === 'popular') orderBy = 's.review_count DESC';

    const query = `
      SELECT 
        s.*,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), s.avg_rating, 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id AND u.is_active = true
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      ${whereClause}
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      services: result.rows.map(s => ({
        ...s,
        price: parseFloat(s.price),
        discount_price: s.discount_price ? parseFloat(s.discount_price) : null,
        avg_rating: parseFloat(s.avg_rating || 0),
        review_count: parseInt(s.review_count || 0),
        booking_count: parseInt(s.booking_count || 0)
      })),
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error in searchServices:', error);
    res.status(500).json({ message: 'Failed to search services', error: error.message });
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
    res.status(500).json({ message: 'Failed to add review', error: error.message });
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
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
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
      'SELECT category_id FROM services WHERE id = $1 AND deleted_at IS NULL',
      [serviceId]
    );

    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const categoryId = service.rows[0].category_id;

    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.short_description,
        s.price,
        s.discount_price,
        s.currency,
        s.image as main_image,
        s.images,
        s.location,
        s.city,
        s.avg_rating,
        s.review_count,
        s.slug,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), s.avg_rating, 0) as avg_rating_calc,
        COUNT(DISTINCT r.id) as review_count_calc,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id AND u.is_active = true
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE (s.status = 'approved' OR s.status = 'active')
        AND s.deleted_at IS NULL
        AND s.id != $1 
        AND (s.category_id = $2 OR s.category_id IS NULL)
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY avg_rating_calc DESC, booking_count DESC
      LIMIT $3
    `, [serviceId, categoryId, parseInt(limit)]);

    const services = result.rows.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      short_description: s.short_description,
      price: parseFloat(s.price),
      discount_price: s.discount_price ? parseFloat(s.discount_price) : null,
      currency: s.currency || 'NGN',
      image: s.images && s.images.length > 0 ? s.images[0] : s.main_image || 'https://via.placeholder.com/300x200?text=Service',
      images: s.images || [],
      location: s.location || s.city,
      avg_rating: parseFloat(s.avg_rating_calc) || parseFloat(s.avg_rating) || 0,
      review_count: parseInt(s.review_count_calc) || parseInt(s.review_count) || 0,
      booking_count: parseInt(s.booking_count) || 0,
      provider_name: s.provider_name || 'Unknown Provider',
      provider_avatar: s.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.provider_name || 'Provider')}&background=10b981&color=fff&size=64`,
      category_name: s.category_name || 'Uncategorized',
      slug: s.slug
    }));

    res.json(services);
  } catch (error) {
    console.error('Error in getSimilarServices:', error);
    res.status(500).json({ message: 'Failed to fetch similar services', error: error.message });
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
      'SELECT id FROM services WHERE id = $1 AND deleted_at IS NULL AND (status = $2 OR status = $3)',
      [serviceId, 'approved', 'active']
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
    res.status(500).json({ message: 'Failed to toggle favorite', error: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.discount_price,
        s.currency,
        s.image as main_image,
        s.images,
        s.location,
        s.city,
        s.avg_rating,
        s.review_count,
        s.slug,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        f.created_at as favorited_at
      FROM favorites f
      JOIN services s ON f.service_id = s.id AND s.deleted_at IS NULL
      JOIN users u ON s.provider_id = u.id AND u.is_active = true
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);

    const favorites = result.rows.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      price: parseFloat(s.price),
      discount_price: s.discount_price ? parseFloat(s.discount_price) : null,
      currency: s.currency || 'NGN',
      image: s.images && s.images.length > 0 ? s.images[0] : s.main_image || 'https://via.placeholder.com/300x200?text=Service',
      images: s.images || [],
      location: s.location || s.city,
      avg_rating: parseFloat(s.avg_rating) || 0,
      review_count: parseInt(s.review_count) || 0,
      provider_name: s.provider_name || 'Unknown Provider',
      provider_avatar: s.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.provider_name || 'Provider')}&background=10b981&color=fff&size=64`,
      category_name: s.category_name || 'Uncategorized',
      slug: s.slug,
      favorited_at: s.favorited_at
    }));

    res.json(favorites);
  } catch (error) {
    console.error('Error in getFavorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites', error: error.message });
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
    res.status(500).json({ message: 'Failed to check favorite status', error: error.message });
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
      'SELECT provider_id, duration FROM services WHERE id = $1 AND deleted_at IS NULL',
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
    res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
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
        COUNT(DISTINCT CASE WHEN r.rating < 3 THEN r.id END) as negative_reviews
      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.id = $1 AND s.deleted_at IS NULL
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
    res.status(500).json({ message: 'Failed to fetch service stats', error: error.message });
  }
};

// =========================================================================
// GET FEATURED SERVICES
// =========================================================================

export const getFeaturedServices = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.short_description,
        s.price,
        s.discount_price,
        s.currency,
        s.images,
        s.location,
        s.city,
        s.avg_rating,
        s.review_count,
        s.slug,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), s.avg_rating, 0) as avg_rating_calc,
        COUNT(DISTINCT r.id) as review_count_calc,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id AND u.is_active = true
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE (s.status = 'approved' OR s.status = 'active')
        AND s.deleted_at IS NULL
        AND s.is_featured = true
        AND (s.is_active = true OR s.is_active IS NULL)
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY s.avg_rating DESC, s.review_count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    const services = result.rows.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      short_description: s.short_description,
      price: parseFloat(s.price),
      discount_price: s.discount_price ? parseFloat(s.discount_price) : null,
      currency: s.currency || 'NGN',
      image: s.images && s.images.length > 0 ? s.images[0] : 'https://via.placeholder.com/300x200?text=Service',
      images: s.images || [],
      location: s.location || s.city,
      avg_rating: parseFloat(s.avg_rating_calc) || parseFloat(s.avg_rating) || 0,
      review_count: parseInt(s.review_count_calc) || parseInt(s.review_count) || 0,
      booking_count: parseInt(s.booking_count) || 0,
      provider_name: s.provider_name || 'Unknown Provider',
      provider_avatar: s.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.provider_name || 'Provider')}&background=10b981&color=fff&size=64`,
      category_name: s.category_name || 'Uncategorized',
      slug: s.slug
    }));

    res.json(services);
  } catch (error) {
    console.error('Error in getFeaturedServices:', error);
    res.status(500).json({ message: 'Failed to fetch featured services', error: error.message });
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
        s.id,
        s.title,
        s.description,
        s.price,
        s.discount_price,
        s.currency,
        s.images,
        s.location,
        s.city,
        s.avg_rating,
        s.review_count,
        s.slug,
        u.name as provider_name,
        u.avatar as provider_avatar,
        c.name as category_name,
        COALESCE(AVG(r.rating), s.avg_rating, 0) as avg_rating_calc,
        COUNT(DISTINCT r.id) as review_count_calc,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id AND u.is_active = true
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
      WHERE (s.status = 'approved' OR s.status = 'active')
        AND s.deleted_at IS NULL
        AND (s.is_active = true OR s.is_active IS NULL)
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
          const result = await pool.query(query + `
            GROUP BY s.id, u.name, u.avatar, c.name
            ORDER BY avg_rating_calc DESC, booking_count DESC
            LIMIT $2
          `, [categoryIds, parseInt(limit)]);
          return res.json(result.rows);
        }
      }
    }

    // Fallback: get highest rated services
    query += `
      GROUP BY s.id, u.name, u.avatar, c.name
      ORDER BY avg_rating_calc DESC, booking_count DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [parseInt(limit)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getRecommendedServices:', error);
    res.status(500).json({ message: 'Failed to fetch recommended services', error: error.message });
  }
};
