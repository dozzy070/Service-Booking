// Backend/routes/serviceRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple } from '../middleware/upload.js';
import pool from '../config/db.js';

const router = express.Router();

// =========================================================================
// GET /api/services - Get all services with filters - ✅ FIXED TYPE ERROR
// =========================================================================

router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      sort = 'newest', 
      page = 1, 
      limit = 12,
      minPrice,
      maxPrice,
      rating,
      providerId,
      featured,
      popular
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = parseInt(limit);
    
    // ✅ Build WHERE conditions
    let whereConditions = ["s.status = 'approved'"];
    const queryParams = [];
    let paramCounter = 1;

    // ✅ Handle category filter - FIXED: Properly convert to integer
    if (category) {
      try {
        let categoryId = null;
        
        // ✅ Check if category is already a number
        if (!isNaN(category) && Number.isInteger(parseFloat(category))) {
          // It's a number, use it directly
          categoryId = parseInt(category);
        } else {
          // It's a text name or slug - look it up
          const categoryResult = await pool.query(
            `SELECT id FROM categories 
             WHERE LOWER(name) = LOWER($1) 
             OR LOWER(slug) = LOWER($1)`,
            [category]
          );
          
          if (categoryResult.rows.length > 0) {
            categoryId = categoryResult.rows[0].id;
          }
        }
        
        if (categoryId !== null) {
          // ✅ Use integer comparison (no casting needed)
          whereConditions.push(`s.category_id = $${paramCounter}`);
          queryParams.push(categoryId);
          paramCounter++;
        } else {
          // Category not found - return empty result
          return res.json({
            services: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: queryLimit
            }
          });
        }
      } catch (categoryError) {
        console.error('⚠️ Category lookup error:', categoryError.message);
        return res.json({
          services: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: queryLimit
          }
        });
      }
    }

    // ✅ Search filter
    if (search) {
      whereConditions.push(`(s.title ILIKE $${paramCounter} OR s.description ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    // ✅ Price filters
    if (minPrice) {
      whereConditions.push(`s.price >= $${paramCounter}`);
      queryParams.push(parseFloat(minPrice));
      paramCounter++;
    }
    if (maxPrice) {
      whereConditions.push(`s.price <= $${paramCounter}`);
      queryParams.push(parseFloat(maxPrice));
      paramCounter++;
    }

    // ✅ Provider filter
    if (providerId) {
      whereConditions.push(`s.provider_id = $${paramCounter}`);
      queryParams.push(providerId);
      paramCounter++;
    }

    // ✅ Featured filter
    if (featured === 'true') {
      whereConditions.push(`s.is_featured = true`);
    }

    // ✅ Popular filter
    if (popular === 'true') {
      whereConditions.push(`s.is_popular = true`);
    }

    // ✅ Rating filter
    if (rating) {
      whereConditions.push(`s.avg_rating >= $${paramCounter}`);
      queryParams.push(parseFloat(rating));
      paramCounter++;
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // ✅ ORDER BY
    let orderBy = 's.created_at DESC';
    if (sort === 'price_low') orderBy = 's.price ASC';
    else if (sort === 'price_high') orderBy = 's.price DESC';
    else if (sort === 'rating') orderBy = 's.avg_rating DESC NULLS LAST';
    else if (sort === 'oldest') orderBy = 's.created_at ASC';
    else if (sort === 'popular') orderBy = 's.review_count DESC NULLS LAST';

    // ✅ MAIN QUERY
    const mainQuery = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.duration,
        s.created_at,
        s.updated_at,
        s.images,
        s.location,
        s.address,
        s.city,
        s.state,
        s.is_featured,
        s.is_popular,
        s.avg_rating,
        s.review_count,
        s.status,
        s.slug,
        c.id as category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        u.id AS provider_id,
        u.name AS provider_name,
        u.avatar AS provider_avatar,
        u.phone as provider_phone,
        u.email as provider_email
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.provider_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const allParams = [...queryParams, queryLimit, offset];
    const result = await pool.query(mainQuery, allParams);

    // ✅ COUNT QUERY
    const countQuery = `
      SELECT COUNT(*) as total
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // ✅ Format response
    const services = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      description: row.description || '',
      price: parseFloat(row.price || 0),
      duration: row.duration || '60',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      images: row.images || [],
      location: row.location || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      isFeatured: row.is_featured || false,
      isPopular: row.is_popular || false,
      avgRating: parseFloat(row.avg_rating || 0),
      reviewCount: parseInt(row.review_count || 0),
      status: row.status || 'pending',
      slug: row.slug || '',
      category: {
        id: row.category_id,
        name: row.category_name || 'Uncategorized',
        slug: row.category_slug || ''
      },
      provider: {
        id: row.provider_id,
        name: row.provider_name || 'Unknown Provider',
        avatar: row.provider_avatar || null,
        phone: row.provider_phone || '',
        email: row.provider_email || ''
      }
    }));

    res.json({
      services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / queryLimit) || 1,
        totalItems: total,
        itemsPerPage: queryLimit
      }
    });

  } catch (err) {
    console.error('❌ Service listing error:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      query: req.query
    });
    
    res.status(500).json({
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      services: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 12
      }
    });
  }
});

// =========================================================================
// GET /api/services/categories - Get all categories
// =========================================================================

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        slug, 
        icon, 
        color,
        description,
        display_order
      FROM categories 
      ORDER BY display_order ASC, name ASC
    `);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// =========================================================================
// GET /api/services/popular - Get popular services
// =========================================================================

router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const result = await pool.query(`
      SELECT
        s.id,
        s.title,
        s.images,
        s.price,
        s.avg_rating,
        s.review_count,
        c.name as category_name,
        u.name as provider_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.provider_id = u.id
      WHERE s.status = 'approved'
      ORDER BY s.review_count DESC, s.avg_rating DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('❌ Error fetching popular services:', error);
    res.json([]);
  }
});

// =========================================================================
// GET /api/services/featured - Get featured services
// =========================================================================

router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const result = await pool.query(`
      SELECT
        s.id,
        s.title,
        s.images,
        s.price,
        s.avg_rating,
        s.review_count,
        c.name as category_name,
        u.name as provider_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.provider_id = u.id
      WHERE s.status = 'approved' AND s.is_featured = true
      ORDER BY s.created_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('❌ Error fetching featured services:', error);
    res.json([]);
  }
});

// =========================================================================
// GET /api/services/recommended - Get recommended services
// =========================================================================

router.get('/recommended', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const result = await pool.query(`
      SELECT
        s.id,
        s.title,
        s.images,
        s.price,
        s.avg_rating,
        s.review_count,
        c.name as category_name,
        u.name as provider_name
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.provider_id = u.id
      WHERE s.status = 'approved'
      ORDER BY s.avg_rating DESC, s.review_count DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('❌ Error fetching recommended services:', error);
    res.json([]);
  }
});

// =========================================================================
// GET /api/services/:id - Get single service
// =========================================================================

router.get('/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.discount_price,
        s.currency,
        s.price_type,
        s.duration,
        s.location,
        s.address,
        s.city,
        s.state,
        s.zip_code,
        s.postal_code,
        s.features,
        s.requirements,
        s.images,
        s.cancellation_policy,
        s.max_bookings_per_day,
        s.advance_booking,
        s.service_type,
        s.languages,
        s.tags,
        s.is_remote,
        s.is_active,
        s.is_featured,
        s.is_popular,
        s.avg_rating,
        s.review_count,
        s.status,
        s.slug,
        s.created_at,
        s.updated_at,
        c.id as category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        u.id AS provider_id,
        u.name AS provider_name,
        u.avatar AS provider_avatar,
        u.phone as provider_phone,
        u.email as provider_email,
        u.bio as provider_bio
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.provider_id = u.id
      WHERE s.id = $1 AND s.deleted_at IS NULL
    `, [serviceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const row = result.rows[0];
    res.json({
      id: row.id,
      title: row.title || 'Untitled',
      description: row.description || '',
      price: parseFloat(row.price || 0),
      discountPrice: parseFloat(row.discount_price || 0),
      currency: row.currency || 'NGN',
      priceType: row.price_type || 'fixed',
      duration: row.duration || '60',
      location: row.location || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      zipCode: row.zip_code || '',
      postalCode: row.postal_code || '',
      features: row.features || [],
      requirements: row.requirements || [],
      images: row.images || [],
      cancellationPolicy: row.cancellation_policy || '',
      maxBookingsPerDay: parseInt(row.max_bookings_per_day || 0),
      advanceBooking: parseInt(row.advance_booking || 0),
      serviceType: row.service_type || 'standard',
      languages: row.languages || [],
      tags: row.tags || [],
      isRemote: row.is_remote || false,
      isActive: row.is_active || true,
      isFeatured: row.is_featured || false,
      isPopular: row.is_popular || false,
      avgRating: parseFloat(row.avg_rating || 0),
      reviewCount: parseInt(row.review_count || 0),
      status: row.status || 'pending',
      slug: row.slug || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      category: {
        id: row.category_id,
        name: row.category_name || 'Uncategorized',
        slug: row.category_slug || ''
      },
      provider: {
        id: row.provider_id,
        name: row.provider_name || 'Unknown Provider',
        avatar: row.provider_avatar || null,
        phone: row.provider_phone || '',
        email: row.provider_email || '',
        bio: row.provider_bio || ''
      }
    });
  } catch (error) {
    console.error('❌ Error fetching service:', error);
    res.status(500).json({ 
      message: 'Failed to fetch service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// =========================================================================
// PROTECTED ROUTES (require authentication)
// =========================================================================

router.use(protect);

// POST /api/services - Create a new service
router.post('/',
  authorize('provider', 'admin'),
  uploadMultiple('images', 5),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        price,
        discount_price,
        currency,
        price_type,
        duration,
        location,
        address,
        city,
        state,
        zip_code,
        features,
        requirements,
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
      
      // Get category ID - handle null category
      let categoryId = null;
      if (category) {
        const categoryResult = await pool.query(
          'SELECT id FROM categories WHERE id = $1 OR slug = $1 OR LOWER(name) = LOWER($1)',
          [category]
        );
        categoryId = categoryResult.rows.length > 0 ? categoryResult.rows[0].id : null;
      }

      const images = req.files ? req.files.map(f => f.path) : [];

      const result = await pool.query(`
        INSERT INTO services (
          provider_id, category_id, title, description, price, discount_price,
          currency, price_type, duration, location, address, city, state,
          zip_code, features, requirements, images, cancellation_policy,
          max_bookings_per_day, advance_booking, service_type, languages,
          tags, is_remote, is_active, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'pending',
          NOW(), NOW()
        ) RETURNING *
      `, [
        providerId, categoryId, title, description, price, discount_price,
        currency, price_type, duration, location, address, city, state,
        zip_code, features || [], requirements || [], images,
        cancellation_policy, max_bookings_per_day, advance_booking,
        service_type, languages || [], tags || [], is_remote || false,
        is_active !== false
      ]);

      res.status(201).json({
        message: 'Service created successfully',
        service: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Error creating service:', error);
      res.status(500).json({ 
        message: 'Failed to create service',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// =========================================================================
// PUT /api/services/:id - Update service
// =========================================================================

router.put('/:id',
  authorize('provider', 'admin'),
  uploadMultiple('images', 5),
  async (req, res) => {
    try {
      const serviceId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check if service exists and belongs to provider
      const checkResult = await pool.query(
        'SELECT provider_id FROM services WHERE id = $1 AND deleted_at IS NULL',
        [serviceId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      if (userRole !== 'admin' && checkResult.rows[0].provider_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized to update this service' });
      }

      const {
        title,
        description,
        category,
        price,
        discount_price,
        currency,
        price_type,
        duration,
        location,
        address,
        city,
        state,
        zip_code,
        features,
        requirements,
        cancellation_policy,
        max_bookings_per_day,
        advance_booking,
        service_type,
        languages,
        tags,
        is_remote,
        is_active
      } = req.body;

      // Get category ID - handle null category
      let categoryId = null;
      if (category) {
        const categoryResult = await pool.query(
          'SELECT id FROM categories WHERE id = $1 OR slug = $1 OR LOWER(name) = LOWER($1)',
          [category]
        );
        categoryId = categoryResult.rows.length > 0 ? categoryResult.rows[0].id : null;
      }

      const images = req.files ? req.files.map(f => f.path) : [];

      const result = await pool.query(`
        UPDATE services SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          category_id = COALESCE($3, category_id),
          price = COALESCE($4, price),
          discount_price = COALESCE($5, discount_price),
          currency = COALESCE($6, currency),
          price_type = COALESCE($7, price_type),
          duration = COALESCE($8, duration),
          location = COALESCE($9, location),
          address = COALESCE($10, address),
          city = COALESCE($11, city),
          state = COALESCE($12, state),
          zip_code = COALESCE($13, zip_code),
          features = COALESCE($14, features),
          requirements = COALESCE($15, requirements),
          images = COALESCE($16, images),
          cancellation_policy = COALESCE($17, cancellation_policy),
          max_bookings_per_day = COALESCE($18, max_bookings_per_day),
          advance_booking = COALESCE($19, advance_booking),
          service_type = COALESCE($20, service_type),
          languages = COALESCE($21, languages),
          tags = COALESCE($22, tags),
          is_remote = COALESCE($23, is_remote),
          is_active = COALESCE($24, is_active),
          updated_at = NOW()
        WHERE id = $25
        RETURNING *
      `, [
        title, description, categoryId, price, discount_price,
        currency, price_type, duration, location, address, city, state,
        zip_code, features || [], requirements || [], images,
        cancellation_policy, max_bookings_per_day, advance_booking,
        service_type, languages || [], tags || [], is_remote || false,
        is_active !== false, serviceId
      ]);

      res.json({
        message: 'Service updated successfully',
        service: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Error updating service:', error);
      res.status(500).json({ 
        message: 'Failed to update service',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// =========================================================================
// DELETE /api/services/:id - Delete service (soft delete)
// =========================================================================

router.delete('/:id',
  authorize('provider', 'admin'),
  async (req, res) => {
    try {
      const serviceId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Check if service exists and belongs to provider
      const checkResult = await pool.query(
        'SELECT provider_id FROM services WHERE id = $1 AND deleted_at IS NULL',
        [serviceId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      if (userRole !== 'admin' && checkResult.rows[0].provider_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized to delete this service' });
      }

      await pool.query(
        'UPDATE services SET deleted_at = NOW(), status = $1 WHERE id = $2',
        ['deleted', serviceId]
      );

      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting service:', error);
      res.status(500).json({ 
        message: 'Failed to delete service',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// =========================================================================
// POST /api/services/:id/reviews - Add review to service
// =========================================================================

router.post('/:id/reviews',
  protect,
  authorize('customer'),
  async (req, res) => {
    try {
      const serviceId = req.params.id;
      const customerId = req.user.id;
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }

      // Check if service exists
      const serviceCheck = await pool.query(
        'SELECT id, provider_id FROM services WHERE id = $1 AND status = $2 AND deleted_at IS NULL',
        [serviceId, 'approved']
      );
      
      if (serviceCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Check if user has already reviewed this service
      const existingReview = await pool.query(
        'SELECT id FROM reviews WHERE service_id = $1 AND reviewer_id = $2',
        [serviceId, customerId]
      );
      
      if (existingReview.rows.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this service' });
      }

      // Insert review
      const result = await pool.query(`
        INSERT INTO reviews (service_id, reviewer_id, rating, comment, status, created_at)
        VALUES ($1, $2, $3, $4, 'approved', NOW())
        RETURNING *
      `, [serviceId, customerId, rating, comment]);

      // Update service avg_rating and review_count
      await pool.query(`
        UPDATE services SET
          avg_rating = (SELECT AVG(rating) FROM reviews WHERE service_id = $1 AND status = 'approved'),
          review_count = (SELECT COUNT(*) FROM reviews WHERE service_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [serviceId]);

      res.status(201).json({
        message: 'Review added successfully',
        review: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Error adding review:', error);
      res.status(500).json({ 
        message: 'Failed to add review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// =========================================================================
// GET /api/services/:id/reviews - Get reviews for a service
// =========================================================================

router.get('/:id/reviews', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM reviews WHERE service_id = $1 AND status = $2',
      [serviceId, 'approved']
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    const result = await pool.query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.service_id = $1 AND r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [serviceId, parseInt(limit), offset]);

    res.json({
      reviews: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)) || 1,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// =========================================================================
// EXPORT ROUTER
// =========================================================================

export default router;