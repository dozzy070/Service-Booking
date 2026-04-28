import express from 'express';
import { body } from 'express-validator';
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
  body('location').optional()
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString()
];

// =========================================================================
// PUBLIC ROUTES (no authentication)
// =========================================================================
router.get('/', async (req, res) => {
  try {
    const { sort = 'newest', page = 1, limit = 12, category, minPrice, maxPrice, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const queryLimit = parseInt(limit);

    // ORDER BY
    let orderBy = 's.created_at DESC';
    if (sort === 'price_low') orderBy = 's.price ASC';
    else if (sort === 'price_high') orderBy = 's.price DESC';
    else if (sort === 'rating') orderBy = 'COALESCE(AVG(r.rating), 0) DESC NULLS LAST';
    else if (sort === 'oldest') orderBy = 's.created_at ASC';

    // WHERE conditions
    const conditions = ['s.status = $1'];
    const params = ['approved'];
    let paramIndex = 2;

    if (category) {
      conditions.push(`c.slug = $${paramIndex++}`);
      params.push(category);
    }
    if (minPrice) {
      conditions.push(`s.price >= $${paramIndex++}`);
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push(`s.price <= $${paramIndex++}`);
      params.push(parseFloat(maxPrice));
    }
    if (search) {
      conditions.push(`(s.title ILIKE $${paramIndex++} OR s.description ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // ⚡ Full query with ratings subquery
    const sql = `
      SELECT
        s.id, s.title, s.description, s.price, s.duration, s.created_at,
        c.name AS category_name, c.slug AS category_slug,
        COALESCE(rating_stats.avg_rating, 0)::float AS avg_rating,
        COALESCE(rating_stats.review_count, 0) AS review_count,
        u.name AS provider_name, u.id AS provider_id, u.avatar AS provider_avatar
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
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
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
    const countParams = params.slice(0, -2); // Remove limit and offset params
    const countResult = await pool.query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      services: result.rows.map(s => ({
        ...s,
        price: parseFloat(s.price),
        avg_rating: parseFloat(s.avg_rating) || 0,
        review_count: parseInt(s.review_count)
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

router.get('/search', searchServices);
router.get('/categories', getCategories);
router.get('/popular', getPopularServices);

// GET /api/services/recommended
router.get('/recommended', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

    // Get recommended services based on popularity (most reviewed with high ratings)
    const query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.price,
        s.image,
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

    const result = await pool.query(query, [limit]);
    const services = result.rows.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: parseFloat(service.price),
      images: service.image,
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

router.get('/:id', getServiceById);               // 👈 single service – must come AFTER root

// =========================================================================
// PROTECTED ROUTES
// =========================================================================
router.use(protect);

router.post('/',
  authorize('provider', 'admin'),
  uploadMultiple('images', 5),
  serviceValidation,
  validate,
  createService
);

router.put('/:id',
  authorize('provider', 'admin'),
  uploadMultiple('images', 5),
  updateService
);

router.delete('/:id',
  authorize('provider', 'admin'),
  deleteService
);

router.get('/provider/me',
  authorize('provider'),
  getProviderServices
);

router.post('/:id/reviews',
  reviewValidation,
  validate,
  addReview
);

router.post('/:id/favorite', toggleFavorite);
router.get('/favorites/me', getFavorites);
router.get('/:id/is-favorite', isFavorite);

export default router;