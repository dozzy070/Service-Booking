import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET all categories (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon, c.created_at,
              COALESCE(COUNT(s.id), 0) AS service_count
       FROM categories c
       LEFT JOIN services s ON s.category_id = c.id
         AND (s.status = 'approved' OR s.approved = true)
       GROUP BY c.id, c.name, c.slug, c.icon, c.created_at
       ORDER BY c.name`
    );

    if (result.rows.length > 0) {
      return res.json(result.rows.map(row => ({
        ...row,
        serviceCount: parseInt(row.service_count, 10)
      })));
    }

    // Fallback for services using category names if categories table is empty
    const fallback = await pool.query(
      `SELECT COALESCE(c.name, s.category::text) AS name,
              COALESCE(c.slug, LOWER(REPLACE(s.category::text, ' ', '-'))) AS slug,
              NULL::text AS icon,
              COUNT(s.id) AS service_count
       FROM services s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.status = 'approved' OR s.approved = true
       GROUP BY COALESCE(c.name, s.category::text), COALESCE(c.slug, LOWER(REPLACE(s.category::text, ' ', '-')))
       ORDER BY name`
    );

    res.json(fallback.rows.map(row => ({
      ...row,
      serviceCount: parseInt(row.service_count, 10)
    })));
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single category by slug or id (optional)
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;