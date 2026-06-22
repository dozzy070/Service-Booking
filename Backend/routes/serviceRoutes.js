import express from 'express';
import { body, query, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple } from '../middleware/upload.js';
import pool from '../config/db.js';
import {
  getServiceById,
  createService,
  updateService,
  deleteService,
  getCategories,
  addReview,
  getReviews,
  getProviderServices,
  searchServices,
  getPopularServices,
  getSimilarServices,
  toggleFavorite,
  getFavorites,
  isFavorite,
  getAvailability
} from '../controllers/serviceController.js';

const router = express.Router();

const serviceValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('duration').optional().isString(),
  body('location').optional().isString(),
  body('features').optional().isArray(),
  body('requirements').optional().isArray()
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString(),
  body('images').optional().isArray()
];

// =========================================================================
// PUBLIC ROUTES (no authentication)
// =========================================================================

// GET /api/services - Get all services with filters
router.get('/', async (req, res) => {
  try {
    const { 
      sort = 'newest', 
      page = 1, 
      limit = 12, 
      category, 
      minPrice, 
      maxPrice, 
      search,
      providerId,
      featured,
      popular
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = parseInt(limit);

    // ORDER BY
    let orderBy = 's.created_at DESC';
    if (sort === 'price_low') orderBy = 's.price ASC';
    else if (sort === 'price_high') orderBy = 's.price DESC';
    else if (sort === 'rating') orderBy = 'COALESCE(rating_stats.avg_rating, 0) DESC NULLS LAST';
    else if (sort === 'oldest') orderBy = 's.created_at ASC';
    else if (sort === 'popular') orderBy = 'COALESCE(rating_stats.review_count, 0) DESC';

    // WHERE conditions
    const conditions = ['s.status = $1'];
    const params = ['approved'];
    let paramIndex = 2;

    if (category) {
      conditions.push(`(c.slug = $${paramIndex} OR c.id = $${paramIndex})`);
      params.push(category);
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
    if (search) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }
    if (providerId) {
      conditions.push(`s.provider_id = $${paramIndex}`);
      params.push(providerId);
      paramIndex++;
    }
    if (featured === 'true') {
      conditions.push(`s.is_featured = true`);
    }
    if (popular === 'true') {
      conditions.push(`s.is_popular = true`);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // ✅ FIXED: Replaced s.image with s.images
    const sql = `
      SELECT
        s.id, s.title, s.description, s.price, s.duration, s.created_at,
        s.images, s.city as location, s.is_featured, s.is_popular,
        c.id as category_id, c.name AS category_name, c.slug AS category_slug,
        COALESCE(rating_stats.avg_rating, 0)::float AS avg_rating,
        COALESCE(rating_stats.review_count, 0) AS review_count,
        u.name AS provider_name, u.id AS provider_id, u.avatar AS provider_avatar,
        u.phone as provider_phone, u.email as provider_email
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.provider_id = u.id
      LEFT JOIN (
        SELECT service_id, AVG(rating)::float AS avg_rating, COUNT(*) AS review_count
        FROM reviews
        GROUP BY service_id
      ) rating_stats ON s.id = rating_stats.service_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(queryLimit, offset);
    const result = await pool.query(sql, params);

    // Count query (with same filters)
    const countSql = `
      SELECT COUNT(*) as total
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      services: result.rows.map(s => ({
        ...s,
        price: parseFloat(s.price),
        avg_rating: parseFloat(s.avg_rating) || 0,
        review_count: parseInt(s.review_count),
        // Handle images array
        images: s.images || []
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / queryLimit),
        totalItems: total,
        itemsPerPage: queryLimit
      }
    });
  } catch (err) {
    console.error('❌ Service listing error:', err);
    res.status(500).json({ message: 'Failed to fetch services', error: err.message });
  }
});

// GET /api/services/search - Search services
router.get('/search', searchServices);

// GET /api/services/categories - Get all categories
router.get('/categories', getCategories);

// GET /api/services/popular - Get popular services
router.get('/popular', getPopularServices);

// ✅ FIXED: Featured services - replaced s.image with s.images
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const result = await pool.query(`
      SELECT
        s.id, s.title, s.description, s.price, s.images, s.city as location,
        c.name as category,
        u.name as provider_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.status = 'approved' AND s.is_featured = true
      GROUP BY s.id, c.name, u.name, u.avatar
      ORDER BY s.created_at DESC
      LIMIT $1
    `, [limit]);
    
    const services = result.rows.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: parseFloat(service.price),
      images: service.images || [],
      location: service.location,
      category: service.category,
      providerName: service.provider_name,
      avgRating: parseFloat(service.avg_rating),
      reviewCount: parseInt(service.review_count)
    }));
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching featured services:', error);
    res.status(500).json({ message: 'Failed to fetch featured services' });
  }
});

// ✅ FIXED: Recommended services - replaced s.image with s.images
router.get('/recommended', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const userId = req.user?.id || null;
    
    let query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.price,
        s.images,
        s.city as location,
        c.name as category,
        u.name as provider_name,
        u.avatar as provider_avatar,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.status = 'approved'
      GROUP BY s.id, c.name, u.name, u.avatar
      HAVING COUNT(r.id) > 0
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT $1
    `;
    
    const params = [limit];
    
    // If user is logged in, get their booking history to personalize recommendations
    if (userId) {
      // Get categories user has booked before
      const userCategories = await pool.query(`
        SELECT DISTINCT s.category_id
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.customer_id = $1 AND b.status = 'completed'
      `, [userId]);
      
      if (userCategories.rows.length > 0) {
        const categoryIds = userCategories.rows.map(r => r.category_id).filter(id => id !== null);
        if (categoryIds.length > 0) {
          // Prioritize services from categories user has used before
          query = `
            SELECT
              s.id,
              s.title,
              s.description,
              s.price,
              s.images,
              s.city as location,
              c.name as category,
              u.name as provider_name,
              u.avatar as provider_avatar,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(r.id) as review_count,
              CASE WHEN s.category_id = ANY($2) THEN 1 ELSE 0 END as relevance
            FROM services s
            JOIN users u ON s.provider_id = u.id
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN reviews r ON s.id = r.service_id
            WHERE s.status = 'approved'
            GROUP BY s.id, c.name, u.name, u.avatar
            ORDER BY relevance DESC, avg_rating DESC, review_count DESC
            LIMIT $1
          `;
          params.push(categoryIds);
        }
      }
    }
    
    const result = await pool.query(query, params);
    
    const services = result.rows.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: parseFloat(service.price),
      images: service.images || [],
      location: service.location,
      category: service.category,
      providerName: service.provider_name,
      providerAvatar: service.provider_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(service.provider_name)}&background=10b981&color=fff`,
      avgRating: parseFloat(service.avg_rating),
      reviewCount: parseInt(service.review_count)
    }));
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching recommended services:', error);
    res.status(500).json({ message: 'Failed to fetch recommended services' });
  }
});

// GET /api/services/:id - Get single service by ID
router.get('/:id', getServiceById);

// GET /api/services/:id/availability - Get service availability
router.get('/:id/availability', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    
    // Get service details
    const service = await pool.query(
      'SELECT provider_id, duration FROM services WHERE id = $1 AND status = \'approved\'',
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
      return res.json({ available_slots: [], booked_slots: [], peak_hours: [] });
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
      SELECT time FROM bookings
      WHERE service_id = $1 AND booking_date::date = $2
        AND status NOT IN ('cancelled', 'rejected')
    `, [serviceId, date]);
    
    const bookedSlots = bookings.rows.map(b => b.time);
    const availableSlots = slots.filter(s => !bookedSlots.includes(s));
    
    // Peak hours (10am-12pm and 4pm-6pm)
    const peakHours = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
    
    res.json({
      available_slots: availableSlots,
      booked_slots: bookedSlots,
      time_slots: slots,
      peak_hours: peakHours,
      date_info: null,
      duration: durationMinutes
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// =========================================================================
// PROTECTED ROUTES (require authentication)
// =========================================================================
router.use(protect);

// POST /api/services - Create a new service (provider only)
router.post('/',
  authorize('provider', 'admin'),
  uploadMultiple('images', 5),
  serviceValidation,
  validate,
  createService
);

// PUT /api/services/:id - Update service (provider/admin only)
router.put('/:id',
  authorize('provider', 'admin'),
  uploadMultiple('images', 5),
  updateService
);

// DELETE /api/services/:id - Delete service (provider/admin only)
router.delete('/:id',
  authorize('provider', 'admin'),
  deleteService
);

// GET /api/services/provider/me - Get provider's services
router.get('/provider/me',
  authorize('provider'),
  getProviderServices
);

// GET /api/services/favorites/me - Get user's favorite services
router.get('/favorites/me', getFavorites);

// POST /api/services/:id/favorite - Toggle favorite status
router.post('/:id/favorite', toggleFavorite);

// GET /api/services/:id/is-favorite - Check if service is favorited
router.get('/:id/is-favorite', isFavorite);

// POST /api/services/:id/reviews - Add review to service
router.post('/:id/reviews',
  reviewValidation,
  validate,
  addReview
);

// GET /api/services/:id/reviews - Get reviews for a service
router.get('/:id/reviews', async (req, res) => {
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
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: Similar services - replaced s.image with s.images
router.get('/:id/similar', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const limit = parseInt(req.query.limit) || 4;
    
    // Get the service's category
    const service = await pool.query(
      'SELECT category_id FROM services WHERE id = $1 AND status = \'approved\'',
      [serviceId]
    );
    
    if (service.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const categoryId = service.rows[0].category_id;
    
    // ✅ FIXED: replaced s.image with s.images
    const result = await pool.query(`
      SELECT
        s.id, s.title, s.description, s.price, s.images, s.city as location,
        c.name as category,
        u.name as provider_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.status = 'approved' 
        AND s.id != $1 
        AND (s.category_id = $2 OR s.category_id IS NULL)
      GROUP BY s.id, c.name, u.name, u.avatar
      ORDER BY avg_rating DESC, review_count DESC
      LIMIT $3
    `, [serviceId, categoryId, limit]);
    
    const services = result.rows.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: parseFloat(service.price),
      images: service.images || [],
      location: service.location,
      category: service.category,
      providerName: service.provider_name,
      avgRating: parseFloat(service.avg_rating),
      reviewCount: parseInt(service.review_count)
    }));
    
    res.json(services);
  } catch (error) {
    console.error('Error fetching similar services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/services/:id/stats - Get service statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM services s
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
      total_reviews: 0
    });
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;