import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    // Simple query that works with your actual schema
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        slug, 
        icon, 
        color, 
        description,
        display_order,
        created_at
      FROM categories
      ORDER BY display_order ASC, name ASC
    `);

    console.log(`✅ Found ${result.rows.length} categories`);

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug || row.name?.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-') || 'uncategorized',
      icon: row.icon || '📦',
      color: row.color || '#3b82f6',
      description: row.description || '',
      display_order: row.display_order || 0,
      created_at: row.created_at,
      service_count: 0
    }));

    return res.status(200).json(categories);
    
  } catch (error) {
    console.error('❌ Error in categories:', error.message);
    return res.status(200).json([]);
  }
});

// GET /api/categories/popular - Get popular categories
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const result = await pool.query(`
      SELECT id, name, slug, icon, color
      FROM categories
      ORDER BY display_order ASC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching popular categories:', err.message);
    res.json([]);
  }
});

// GET /api/categories/featured - Get featured categories
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, icon, color, description
      FROM categories
      WHERE is_featured = true
      ORDER BY display_order ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching featured categories:', err.message);
    res.json([]);
  }
});

// GET /api/categories/:identifier - Get single category
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumber = !isNaN(parseInt(identifier));
    
    const query = isNumber 
      ? 'SELECT * FROM categories WHERE id = $1'
      : 'SELECT * FROM categories WHERE slug = $1';
    
    const result = await pool.query(query, [identifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching category:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/:id/services - Get services in a category
router.get('/:id/services', async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const result = await pool.query(`
      SELECT s.id, s.title, s.description, s.price, s.images, s.city,
             u.name as provider_name, u.avatar as provider_avatar,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.category_id = $1 AND (s.status = 'approved' OR s.status = 'active')
      GROUP BY s.id, u.name, u.avatar
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `, [categoryId, parseInt(limit), offset]);
    
    res.json(result.rows);
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
        COALESCE(AVG(s.price), 0) as avg_price
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id AND (s.status = 'approved' OR s.status = 'active')
      WHERE c.id = $1
      GROUP BY c.id
    `, [categoryId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json({
      totalServices: parseInt(result.rows[0].total_services || 0),
      totalProviders: parseInt(result.rows[0].total_providers || 0),
      avgPrice: parseFloat(result.rows[0].avg_price || 0)
    });
  } catch (err) {
    console.error('Error fetching category stats:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/categories/search - Search categories
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const result = await pool.query(`
      SELECT id, name, slug, icon, color
      FROM categories
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY name ASC
      LIMIT $2
    `, [`%${q}%`, parseInt(limit)]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// ADMIN ROUTES
// =========================================================================

// POST /api/categories - Create a new category (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, color, slug, display_order } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const slugValue = slug || name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    
    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, icon, color, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slugValue, description || null, icon || null, color || '#6366f1', display_order || 0]
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
    const { name, description, icon, color, slug, display_order } = req.body;
    
    const result = await pool.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        color = COALESCE($4, color),
        slug = COALESCE($5, slug),
        display_order = COALESCE($6, display_order),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *`,
      [name, description, icon, color, slug, display_order, categoryId]
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
        message: 'Cannot delete category with associated services' 
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

export default router;