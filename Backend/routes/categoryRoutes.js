// routes/categoryRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// =========================================================================
// PUBLIC ROUTES (no authentication)
// =========================================================================

// GET /api/categories - Get all categories with service counts
router.get('/', async (req, res) => {
  try {
    // ✅ REMOVED c.image - it doesn't exist in your table!
    const result = await pool.query(
      `SSELECT c.id, c.name, c.slug, c.icon, c.color, c.description,
              c.is_featured, c.is_popular, c.created_at,
              COALESCE(COUNT(DISTINCT s.id), 0) AS service_count,
              COALESCE(SUM(b.total_amount), 0) AS total_revenue,
              COALESCE(COUNT(DISTINCT b.id), 0) AS total_bookings
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
       LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
       GROUP BY c.id, c.name, c.slug, c.icon, c.color, c.description,
                c.is_featured, c.is_popular, c.created_at
       ORDER BY c.is_featured DESC, c.name ASC`
    );

    if (result.rows.length > 0) {
      return res.json(result.rows.map(row => ({
        ...row,
        serviceCount: parseInt(row.service_count, 10),
        totalRevenue: parseFloat(row.total_revenue || 0),
        totalBookings: parseInt(row.total_bookings || 0)
      })));
    }

    // Fallback for services using category names if categories table is empty
    const fallback = await pool.query(
      `SELECT COALESCE(c.name, s.category::text) AS name,
              COALESCE(c.slug, LOWER(REPLACE(s.category::text, ' ', '-'))) AS slug,
              NULL::text AS icon,
              NULL::text AS color,
              NULL::text AS description,
              false AS is_featured,
              false AS is_popular,
              COUNT(DISTINCT s.id) AS service_count,
              COALESCE(SUM(b.total_amount), 0) AS total_revenue,
              COUNT(DISTINCT b.id) AS total_bookings
       FROM services s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
       WHERE s.status = 'approved' OR s.status = 'active'
       GROUP BY COALESCE(c.name, s.category::text), COALESCE(c.slug, LOWER(REPLACE(s.category::text, ' ', '-')))
       ORDER BY service_count DESC, name ASC`
    );

    res.json(fallback.rows.map(row => ({
      ...row,
      serviceCount: parseInt(row.service_count, 10),
      totalRevenue: parseFloat(row.total_revenue || 0),
      totalBookings: parseInt(row.total_bookings || 0)
    })));
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/popular - Get popular categories
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon, c.color,
              COALESCE(COUNT(DISTINCT s.id), 0) AS service_count,
              COALESCE(SUM(b.total_amount), 0) AS total_revenue,
              COALESCE(COUNT(DISTINCT b.id), 0) AS total_bookings
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
       LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
       GROUP BY c.id, c.name, c.slug, c.icon, c.color
       ORDER BY total_bookings DESC, service_count DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows.map(row => ({
      ...row,
      serviceCount: parseInt(row.service_count, 10),
      totalRevenue: parseFloat(row.total_revenue || 0),
      totalBookings: parseInt(row.total_bookings || 0)
    })));
  } catch (err) {
    console.error('Error fetching popular categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/featured - Get featured categories
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon, c.color, c.description,
              COALESCE(COUNT(DISTINCT s.id), 0) AS service_count,
              COALESCE(SUM(b.total_amount), 0) AS total_revenue
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
       LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
       WHERE c.is_featured = true
       GROUP BY c.id, c.name, c.slug, c.icon, c.color, c.description
       ORDER BY service_count DESC`
    );

    res.json(result.rows.map(row => ({
      ...row,
      serviceCount: parseInt(row.service_count, 10),
      totalRevenue: parseFloat(row.total_revenue || 0)
    })));
  } catch (err) {
    console.error('Error fetching featured categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/:identifier - Get single category by slug or id
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumber = !isNaN(parseInt(identifier));
    
    const query = isNumber
      ? `SELECT c.*,
            COALESCE(COUNT(DISTINCT s.id), 0) AS service_count,
            COALESCE(SUM(b.total_amount), 0) AS total_revenue,
            COALESCE(COUNT(DISTINCT b.id), 0) AS total_bookings
         FROM categories c
         LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
         LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
         WHERE c.id = $1
         GROUP BY c.id`
      : `SELECT c.*,
            COALESCE(COUNT(DISTINCT s.id), 0) AS service_count,
            COALESCE(SUM(b.total_amount), 0) AS total_revenue,
            COALESCE(COUNT(DISTINCT b.id), 0) AS total_bookings
         FROM categories c
         LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
         LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
         WHERE c.slug = $1
         GROUP BY c.id`;
    
    const result = await pool.query(query, [identifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const category = {
      ...result.rows[0],
      serviceCount: parseInt(result.rows[0].service_count || 0),
      totalRevenue: parseFloat(result.rows[0].total_revenue || 0),
      totalBookings: parseInt(result.rows[0].total_bookings || 0)
    };
    
    // Get services in this category
    const services = await pool.query(
      `SELECT s.id, s.title, s.description, s.price, s.duration, s.image, s.city,
              u.name as provider_name, u.avatar as provider_avatar,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(r.id) as review_count
       FROM services s
       JOIN users u ON s.provider_id = u.id
       LEFT JOIN reviews r ON r.service_id = s.id
       WHERE s.category_id = $1 AND (s.status = 'approved' OR s.status = 'active')
       GROUP BY s.id, u.name, u.avatar
       ORDER BY s.created_at DESC
       LIMIT 20`,
      [category.id]
    );
    
    res.json({
      ...category,
      services: services.rows.map(s => ({
        ...s,
        price: parseFloat(s.price),
        avg_rating: parseFloat(s.avg_rating || 0),
        review_count: parseInt(s.review_count || 0)
      }))
    });
  } catch (err) {
    console.error('Error fetching category:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/:id/services - Get services in a category
router.get('/:id/services', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { page = 1, limit = 12, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let orderBy = 's.created_at DESC';
    if (sort === 'price_low') orderBy = 's.price ASC';
    else if (sort === 'price_high') orderBy = 's.price DESC';
    else if (sort === 'rating') orderBy = 'COALESCE(AVG(r.rating), 0) DESC';
    else if (sort === 'popular') orderBy = 'COUNT(b.id) DESC';
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM services s
      WHERE s.category_id = $1 AND (s.status = 'approved' OR s.status = 'active')
    `;
    const countResult = await pool.query(countQuery, [categoryId]);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT s.id, s.title, s.description, s.price, s.duration, s.image, s.city,
             u.name as provider_name, u.avatar as provider_avatar,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as review_count,
             COUNT(DISTINCT b.id) as booking_count,
             COALESCE(SUM(b.total_amount), 0) as total_revenue
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN reviews r ON r.service_id = s.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      WHERE s.category_id = $1 AND (s.status = 'approved' OR s.status = 'active')
      GROUP BY s.id, u.name, u.avatar
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [categoryId, parseInt(limit), offset]);
    
    res.json({
      services: result.rows.map(s => ({
        ...s,
        price: parseFloat(s.price),
        avg_rating: parseFloat(s.avg_rating || 0),
        review_count: parseInt(s.review_count || 0),
        booking_count: parseInt(s.booking_count || 0),
        total_revenue: parseFloat(s.total_revenue || 0)
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching category services:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/:id/stats - Get category statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_services,
        COUNT(DISTINCT s.provider_id) as total_providers,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT r.id) as total_reviews,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.price), 0) as avg_price,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [categoryId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({
      totalServices: parseInt(result.rows[0].total_services || 0),
      totalProviders: parseInt(result.rows[0].total_providers || 0),
      totalBookings: parseInt(result.rows[0].total_bookings || 0),
      totalReviews: parseInt(result.rows[0].total_reviews || 0),
      totalRevenue: parseFloat(result.rows[0].total_revenue || 0),
      avgPrice: parseFloat(result.rows[0].avg_price || 0),
      avgRating: parseFloat(result.rows[0].avg_rating || 0)
    });
  } catch (err) {
    console.error('Error fetching category stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// ADMIN ROUTES (require authentication and admin role)
// =========================================================================

// POST /api/categories - Create a new category (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      icon, 
      color, 
      image, 
      slug,
      is_featured,
      is_popular,
      seo_title,
      seo_description,
      meta_keywords
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const slugValue = slug || name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    
    // ✅ REMOVED image from INSERT since it doesn't exist in your table
    const result = await pool.query(
      `INSERT INTO categories (
        name, slug, description, icon, color,
        is_featured, is_popular, seo_title, seo_description, meta_keywords
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        name, slugValue, description || null, icon || null, color || '#6366f1',
        is_featured || false, is_popular || false,
        seo_title || null, seo_description || null, meta_keywords || []
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/:id - Update a category (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { 
      name, 
      description, 
      icon, 
      color, 
      image, 
      slug,
      is_featured,
      is_popular,
      seo_title,
      seo_description,
      meta_keywords
    } = req.body;
    
    // ✅ REMOVED image from UPDATE since it doesn't exist in your table
    const result = await pool.query(
      `UPDATE categories SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        color = COALESCE($4, color),
        slug = COALESCE($5, slug),
        is_featured = COALESCE($6, is_featured),
        is_popular = COALESCE($7, is_popular),
        seo_title = COALESCE($8, seo_title),
        seo_description = COALESCE($9, seo_description),
        meta_keywords = COALESCE($10, meta_keywords),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        name, description, icon, color, slug,
        is_featured, is_popular, seo_title, seo_description,
        meta_keywords, categoryId
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id - Delete a category (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category has services
    const serviceCheck = await pool.query(
      'SELECT COUNT(*) as count FROM services WHERE category_id = $1',
      [categoryId]
    );
    
    if (parseInt(serviceCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated services. Please reassign or delete services first.' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [categoryId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories/bulk-delete - Delete multiple categories (admin only)
router.post('/bulk-delete', protect, authorize('admin'), async (req, res) => {
  try {
    const { categoryIds } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'Category IDs array is required' });
    }
    
    // Check if any category has services
    const serviceCheck = await pool.query(
      'SELECT category_id FROM services WHERE category_id = ANY($1)',
      [categoryIds]
    );
    
    const usedCategoryIds = serviceCheck.rows.map(r => r.category_id);
    if (usedCategoryIds.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete categories with associated services: ' + usedCategoryIds.join(', '),
        categoryIds: usedCategoryIds
      });
    }
    
    const result = await pool.query(
      'DELETE FROM categories WHERE id = ANY($1) RETURNING id',
      [categoryIds]
    );
    
    res.json({ 
      message: `${result.rows.length} categories deleted successfully`,
      deletedIds: result.rows.map(r => r.id)
    });
  } catch (err) {
    console.error('Error bulk deleting categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/categories/bulk-status - Update category featured/popular status (admin only)
router.put('/bulk-status', protect, authorize('admin'), async (req, res) => {
  try {
    const { categoryIds, is_featured, is_popular } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'Category IDs array is required' });
    }
    
    const result = await pool.query(
      `UPDATE categories 
       SET is_featured = COALESCE($1, is_featured),
           is_popular = COALESCE($2, is_popular),
           updated_at = NOW()
       WHERE id = ANY($3)
       RETURNING id`,
      [is_featured, is_popular, categoryIds]
    );
    
    res.json({ 
      message: `${result.rows.length} categories updated`,
      updatedIds: result.rows.map(r => r.id)
    });
  } catch (err) {
    console.error('Error updating category status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// SEARCH CATEGORIES
// =========================================================================

// GET /api/categories/search - Search categories
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon, c.color,
              COALESCE(COUNT(DISTINCT s.id), 0) AS service_count
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
       WHERE c.name ILIKE $1 OR c.description ILIKE $1
       GROUP BY c.id, c.name, c.slug, c.icon, c.color
       ORDER BY 
         CASE WHEN c.name ILIKE $2 THEN 1 ELSE 2 END,
         service_count DESC
       LIMIT $3`,
      [`%${q}%`, `${q}%`, parseInt(limit)]
    );
    
    res.json(result.rows.map(row => ({
      ...row,
      serviceCount: parseInt(row.service_count, 10)
    })));
  } catch (err) {
    console.error('Error searching categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;