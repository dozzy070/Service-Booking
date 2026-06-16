// routes/adminRoutes.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

// ========================
// AUTH MIDDLEWARE
// ========================
router.use(protect);
router.use(authorize('admin'));

// ========================
// DASHBOARD ENDPOINTS
// ========================

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Users
    const userRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'provider' THEN 1 END) as providers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified,
        COUNT(CASE WHEN verified = false THEN 1 END) as unverified,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as suspended
      FROM users
    `);
    
    const newUsersToday = await pool.query(
      `SELECT COUNT(*) as new FROM users WHERE created_at::date = CURRENT_DATE`
    );
    
    const userGrowth = await pool.query(`
      SELECT 
        COUNT(*) as current,
        (SELECT COUNT(*) FROM users WHERE created_at < CURRENT_DATE - INTERVAL '30 days') as prev
      FROM users
    `);
    const growthPercent = userGrowth.rows[0].prev > 0
      ? ((userGrowth.rows[0].current - userGrowth.rows[0].prev) / userGrowth.rows[0].prev) * 100
      : 0;

    // Services
    const serviceRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
        COUNT(DISTINCT category_id) as categories
      FROM services
    `);
    
    const serviceGrowth = await pool.query(`
      SELECT 
        COUNT(*) as current,
        (SELECT COUNT(*) FROM services WHERE created_at < CURRENT_DATE - INTERVAL '30 days') as prev
      FROM services
    `);
    const serviceGrowthPercent = serviceGrowth.rows[0].prev > 0
      ? ((serviceGrowth.rows[0].current - serviceGrowth.rows[0].prev) / serviceGrowth.rows[0].prev) * 100
      : 0;

    // Bookings
    const bookingRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status IN ('confirmed','accepted') THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputes
      FROM bookings
    `);
    
    const bookingGrowth = await pool.query(`
      SELECT 
        COUNT(*) as current,
        (SELECT COUNT(*) FROM bookings WHERE created_at < CURRENT_DATE - INTERVAL '30 days') as prev
      FROM bookings
    `);
    const bookingGrowthPercent = bookingGrowth.rows[0].prev > 0
      ? ((bookingGrowth.rows[0].current - bookingGrowth.rows[0].prev) / bookingGrowth.rows[0].prev) * 100
      : 0;

    // Revenue
    const revenueRes = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as monthly,
        COALESCE(SUM(CASE WHEN created_at >= date_trunc('week', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as weekly,
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_amount ELSE 0 END), 0) as daily,
        COALESCE(AVG(total_amount), 0) as average
      FROM bookings
      WHERE payment_status = 'paid' AND status = 'completed'
    `);
    
    const revenueGrowth = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as current,
        COALESCE(SUM(CASE WHEN created_at < CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END), 0) as prev
      FROM bookings
      WHERE payment_status = 'paid' AND status = 'completed'
    `);
    const revenueGrowthPercent = revenueGrowth.rows[0].prev > 0
      ? ((revenueGrowth.rows[0].current - revenueGrowth.rows[0].prev) / revenueGrowth.rows[0].prev) * 100
      : 0;

    // Commission
    const commissionRes = await pool.query(`
      SELECT COALESCE(SUM(commission_amount), 0) as total_commission
      FROM bookings
      WHERE payment_status = 'paid' AND status = 'completed'
    `);

    // Ratings
    const ratingRes = await pool.query(`
      SELECT
        COUNT(*) as total,
        COALESCE(AVG(rating), 0) as avg,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one
      FROM reviews
    `);

    res.json({
      users: {
        total: parseInt(userRes.rows[0].total),
        new: parseInt(newUsersToday.rows[0].new),
        active: parseInt(userRes.rows[0].active),
        suspended: parseInt(userRes.rows[0].suspended),
        verified: parseInt(userRes.rows[0].verified),
        unverified: parseInt(userRes.rows[0].unverified),
        providers: parseInt(userRes.rows[0].providers),
        customers: parseInt(userRes.rows[0].customers),
        admins: parseInt(userRes.rows[0].admins),
        growth: parseFloat(growthPercent.toFixed(1))
      },
      services: {
        total: parseInt(serviceRes.rows[0].total),
        pending: parseInt(serviceRes.rows[0].pending),
        approved: parseInt(serviceRes.rows[0].approved),
        rejected: parseInt(serviceRes.rows[0].rejected),
        featured: parseInt(serviceRes.rows[0].featured),
        categories: parseInt(serviceRes.rows[0].categories),
        growth: parseFloat(serviceGrowthPercent.toFixed(1))
      },
      bookings: {
        total: parseInt(bookingRes.rows[0].total),
        pending: parseInt(bookingRes.rows[0].pending),
        active: parseInt(bookingRes.rows[0].active),
        completed: parseInt(bookingRes.rows[0].completed),
        cancelled: parseInt(bookingRes.rows[0].cancelled),
        disputes: parseInt(bookingRes.rows[0].disputes),
        growth: parseFloat(bookingGrowthPercent.toFixed(1))
      },
      revenue: {
        total: parseFloat(revenueRes.rows[0].total),
        monthly: parseFloat(revenueRes.rows[0].monthly),
        weekly: parseFloat(revenueRes.rows[0].weekly),
        daily: parseFloat(revenueRes.rows[0].daily),
        average: parseFloat(revenueRes.rows[0].average),
        commission: parseFloat(commissionRes.rows[0].total_commission),
        growth: parseFloat(revenueGrowthPercent.toFixed(1))
      },
      ratings: {
        average: parseFloat(ratingRes.rows[0].avg),
        total: parseInt(ratingRes.rows[0].total),
        fiveStar: parseInt(ratingRes.rows[0].five),
        fourStar: parseInt(ratingRes.rows[0].four),
        threeStar: parseInt(ratingRes.rows[0].three),
        twoStar: parseInt(ratingRes.rows[0].two),
        oneStar: parseInt(ratingRes.rows[0].one)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Revenue chart
router.get('/dashboard/revenue-chart', async (req, res) => {
  try {
    const { view = 'monthly' } = req.query;
    let labels = [], data = [], maxValue = 0;

    if (view === 'weekly') {
      const result = await pool.query(`
        SELECT 
          TO_CHAR(created_at, 'Dy') as label,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY label, DATE(created_at)
        ORDER BY MIN(created_at)
      `);
      labels = result.rows.map(r => r.label);
      data = result.rows.map(r => parseFloat(r.revenue));
    } else if (view === 'yearly') {
      const result = await pool.query(`
        SELECT 
          EXTRACT(YEAR FROM created_at)::text as label,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '4 years'
        GROUP BY label
        ORDER BY label
      `);
      labels = result.rows.map(r => r.label);
      data = result.rows.map(r => parseFloat(r.revenue));
    } else {
      const result = await pool.query(`
        SELECT 
          TO_CHAR(created_at, 'Mon') as label,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '11 months'
        GROUP BY label, EXTRACT(MONTH FROM created_at)
        ORDER BY MIN(created_at)
      `);
      labels = result.rows.map(r => r.label);
      data = result.rows.map(r => parseFloat(r.revenue));
    }

    maxValue = Math.max(...data, 1);
    res.json({ labels, data, maxValue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Recent activities
router.get('/dashboard/activities', async (req, res) => {
  try {
    const userActivities = await pool.query(`
      SELECT 'user' as type, id, name as user_name, 'registered' as action, created_at as timestamp
      FROM users ORDER BY created_at DESC LIMIT 10
    `);
    const bookingActivities = await pool.query(`
      SELECT 'booking' as type, b.id, u.name as user_name, 'created booking' as action, b.created_at as timestamp
      FROM bookings b JOIN users u ON b.customer_id = u.id ORDER BY b.created_at DESC LIMIT 10
    `);
    const serviceActivities = await pool.query(`
      SELECT 'service' as type, s.id, u.name as user_name, 'added service: ' || s.title as action, s.created_at as timestamp
      FROM services s JOIN users u ON s.provider_id = u.id ORDER BY s.created_at DESC LIMIT 10
    `);
    
    let activities = [
      ...userActivities.rows.map(r => ({ ...r, timestamp: new Date(r.timestamp) })),
      ...bookingActivities.rows.map(r => ({ ...r, timestamp: new Date(r.timestamp) })),
      ...serviceActivities.rows.map(r => ({ ...r, timestamp: new Date(r.timestamp) }))
    ];
    activities.sort((a,b) => b.timestamp - a.timestamp);
    activities = activities.slice(0, 20);
    
    const formatted = activities.map(a => ({
      id: a.id,
      user: a.user_name,
      action: a.action,
      time: timeAgo(a.timestamp),
      timestamp: a.timestamp,
      type: a.type
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Top providers
router.get('/dashboard/top-providers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name,
        COALESCE(COUNT(DISTINCT s.id), 0) as services,
        COALESCE(COUNT(b.id), 0) as bookings,
        COALESCE(AVG(r.rating), 0) as rating,
        COALESCE(SUM(b.total_amount), 0) as revenue
      FROM users u
      LEFT JOIN services s ON s.provider_id = u.id AND s.status = 'approved'
      LEFT JOIN bookings b ON b.provider_id = u.id AND b.status = 'completed'
      LEFT JOIN reviews r ON r.provider_id = u.id
      WHERE u.role = 'provider'
      GROUP BY u.id, u.name
      ORDER BY revenue DESC LIMIT 5
    `);
    const providers = result.rows.map(p => ({
      id: p.id,
      name: p.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=667eea&color=fff&size=50`,
      services: parseInt(p.services),
      bookings: parseInt(p.bookings),
      rating: parseFloat(p.rating).toFixed(1),
      revenue: parseFloat(p.revenue)
    }));
    res.json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Popular services
router.get('/dashboard/popular-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, s.title, c.name as category,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.total_amount), 0) as revenue,
        COALESCE(AVG(r.rating), 0) as rating
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.status = 'approved'
      GROUP BY s.id, s.title, c.name
      ORDER BY bookings DESC LIMIT 5
    `);
    const services = result.rows.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category || 'Uncategorized',
      bookings: parseInt(s.bookings),
      revenue: parseFloat(s.revenue),
      rating: parseFloat(s.rating).toFixed(1)
    }));
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Pending approvals
router.get('/dashboard/pending-approvals', async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users WHERE verified = false');
    const services = await pool.query('SELECT COUNT(*) FROM services WHERE status = \'pending\'');
    const reviews = await pool.query('SELECT COUNT(*) FROM reviews WHERE status = \'pending\'');
    const disputes = await pool.query('SELECT COUNT(*) FROM bookings WHERE status = \'disputed\'');
    
    res.json({
      users: parseInt(users.rows[0].count),
      services: parseInt(services.rows[0].count),
      reviews: parseInt(reviews.rows[0].count),
      disputes: parseInt(disputes.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// System health
router.get('/dashboard/system-health', (req, res) => {
  res.json({
    server: { status: 'healthy', uptime: '99.9%', responseTime: 120 },
    database: { status: 'healthy', queries: 3456, slowQueries: 12 },
    cache: { status: 'healthy', hitRate: 94 },
    api: { status: 'healthy', requests: 12345, errors: 23 }
  });
});

// ========================
// USER MANAGEMENT
// ========================

// Get all users with filters
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, verified } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }
    if (status === 'active') {
      conditions.push(`is_active = true`);
    } else if (status === 'inactive') {
      conditions.push(`is_active = false`);
    } else if (status === 'suspended') {
      conditions.push(`is_active = false`);
    }
    if (verified === 'true') {
      conditions.push(`verified = true`);
    } else if (verified === 'false') {
      conditions.push(`verified = false`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT id, name, email, phone, role, verified, is_active, avatar, 
             created_at as joined, last_login as last_active
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get additional stats for each user
    const users = await Promise.all(result.rows.map(async (user) => {
      const bookingCount = await pool.query(
        'SELECT COUNT(*) as bookings FROM bookings WHERE customer_id = $1 OR provider_id = $1',
        [user.id]
      );
      const spent = await pool.query(
        'SELECT COALESCE(SUM(total_amount), 0) as spent FROM bookings WHERE customer_id = $1 AND status = \'completed\'',
        [user.id]
      );
      const rating = await pool.query(
        'SELECT COALESCE(AVG(rating), 0) as rating, COUNT(*) as reviews FROM reviews WHERE provider_id = $1',
        [user.id]
      );
      
      return {
        ...user,
        bookings: parseInt(bookingCount.rows[0].bookings),
        spent: parseFloat(spent.rows[0].spent),
        rating: parseFloat(rating.rows[0].rating),
        reviews: parseInt(rating.rows[0].reviews)
      };
    }));
    
    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, phone, address, bio, is_active } = req.body;
    await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name), 
        email = COALESCE($2, email), 
        role = COALESCE($3, role),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        bio = COALESCE($6, bio),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8`,
      [name, email, role, phone, address, bio, is_active, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Verify user
router.put('/users/:id/verify', async (req, res) => {
  try {
    await pool.query('UPDATE users SET verified = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'User verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Suspend user
router.put('/users/:id/suspend', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'User suspended' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Unsuspend user
router.put('/users/:id/unsuspend', async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'User unsuspended' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk user actions
router.post('/users/bulk', async (req, res) => {
  try {
    const { userIds, action } = req.body;
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected' });
    }
    
    let query = '';
    switch(action) {
      case 'verify':
        query = `UPDATE users SET verified = true WHERE id = ANY($1)`;
        break;
      case 'suspend':
        query = `UPDATE users SET is_active = false WHERE id = ANY($1)`;
        break;
      case 'activate':
        query = `UPDATE users SET is_active = true WHERE id = ANY($1)`;
        break;
      case 'delete':
        query = `DELETE FROM users WHERE id = ANY($1)`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    await pool.query(query, [userIds]);
    res.json({ message: `Bulk action ${action} completed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// PROVIDER MANAGEMENT
// ========================

// Get all providers
router.get('/providers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, verified, is_active, created_at,
        (SELECT COUNT(*) FROM services WHERE provider_id = users.id) as total_services,
        (SELECT COUNT(*) FROM bookings WHERE provider_id = users.id AND status = 'completed') as total_bookings,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = users.id) as rating
      FROM users
      WHERE role = 'provider'
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get provider details
router.get('/providers/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM services WHERE provider_id = u.id) as total_services,
        (SELECT COUNT(*) FROM bookings WHERE provider_id = u.id AND status = 'completed') as total_bookings,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = u.id) as rating
      FROM users u
      WHERE u.id = $1 AND u.role = 'provider'
    `, [req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Provider not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// SERVICE MANAGEMENT
// ========================

// Get all services with filters
router.get('/services', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status, providerId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      conditions.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (category) {
      conditions.push(`s.category_id = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (status) {
      conditions.push(`s.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (providerId) {
      conditions.push(`s.provider_id = $${paramIndex}`);
      params.push(providerId);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM services s ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        s.*, 
        u.name as provider_name,
        c.name as category_name
      FROM services s
      LEFT JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get additional stats for each service
    const services = await Promise.all(result.rows.map(async (service) => {
      const bookingStats = await pool.query(
        'SELECT COUNT(*) as bookings, COALESCE(SUM(total_amount), 0) as revenue FROM bookings WHERE service_id = $1 AND status = \'completed\'',
        [service.id]
      );
      const ratingStats = await pool.query(
        'SELECT COALESCE(AVG(rating), 0) as rating, COUNT(*) as reviews FROM reviews WHERE service_id = $1',
        [service.id]
      );
      
      return {
        ...service,
        bookings: parseInt(bookingStats.rows[0].bookings),
        revenue: parseFloat(bookingStats.rows[0].revenue),
        rating: parseFloat(ratingStats.rows[0].rating),
        reviews: parseInt(ratingStats.rows[0].reviews)
      };
    }));
    
    res.json({
      services,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single service
router.get('/services/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.name as provider_name, c.name as category_name
      FROM services s
      LEFT JOIN users u ON s.provider_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Service not found' });
    
    const service = result.rows[0];
    const bookingStats = await pool.query(
      'SELECT COUNT(*) as bookings, COALESCE(SUM(total_amount), 0) as revenue FROM bookings WHERE service_id = $1 AND status = \'completed\'',
      [service.id]
    );
    const ratingStats = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as rating, COUNT(*) as reviews FROM reviews WHERE service_id = $1',
      [service.id]
    );
    
    res.json({
      ...service,
      bookings: parseInt(bookingStats.rows[0].bookings),
      revenue: parseFloat(bookingStats.rows[0].revenue),
      rating: parseFloat(ratingStats.rows[0].rating),
      reviews: parseInt(ratingStats.rows[0].reviews)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Approve service
router.put('/services/:id/approve', async (req, res) => {
  try {
    await pool.query("UPDATE services SET status = 'approved' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Service approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reject service
router.put('/services/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    await pool.query("UPDATE services SET status = 'rejected', rejection_reason = $1 WHERE id = $2", [reason, req.params.id]);
    res.json({ message: 'Service rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Toggle featured status
router.put('/services/:id/featured', async (req, res) => {
  try {
    const { featured } = req.body;
    await pool.query('UPDATE services SET is_featured = $1 WHERE id = $2', [featured, req.params.id]);
    res.json({ message: 'Featured status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete service
router.delete('/services/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk service actions
router.post('/services/bulk', async (req, res) => {
  try {
    const { serviceIds, action } = req.body;
    if (!serviceIds || serviceIds.length === 0) {
      return res.status(400).json({ message: 'No services selected' });
    }
    
    let query = '';
    switch(action) {
      case 'approve':
        query = `UPDATE services SET status = 'approved' WHERE id = ANY($1)`;
        break;
      case 'reject':
        query = `UPDATE services SET status = 'rejected' WHERE id = ANY($1)`;
        break;
      case 'delete':
        query = `DELETE FROM services WHERE id = ANY($1)`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    await pool.query(query, [serviceIds]);
    res.json({ message: `Bulk action ${action} completed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// BOOKING MANAGEMENT
// ========================

// Get all bookings with filters
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, serviceId, providerId, customerId, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      conditions.push(`(b.id::text ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex} OR s.title ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (status) {
      conditions.push(`b.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (serviceId) {
      conditions.push(`b.service_id = $${paramIndex}`);
      params.push(serviceId);
      paramIndex++;
    }
    if (providerId) {
      conditions.push(`b.provider_id = $${paramIndex}`);
      params.push(providerId);
      paramIndex++;
    }
    if (customerId) {
      conditions.push(`b.customer_id = $${paramIndex}`);
      params.push(customerId);
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
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM bookings b ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        b.*,
        u.name as customer_name,
        u.avatar as customer_avatar,
        u2.name as provider_name,
        u2.avatar as provider_avatar,
        s.title as service_title,
        s.category_id,
        c.name as service_category
      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN users u2 ON b.provider_id = u2.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
      ORDER BY b.booking_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      bookings: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single booking
router.get('/bookings/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as customer_name, u2.name as provider_name, s.title as service_title
      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN users u2 ON b.provider_id = u2.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE b.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const { status, booking_date, notes, total_amount } = req.body;
    await pool.query(
      `UPDATE bookings SET 
        status = COALESCE($1, status),
        booking_date = COALESCE($2, booking_date),
        notes = COALESCE($3, notes),
        total_amount = COALESCE($4, total_amount),
        updated_at = NOW()
      WHERE id = $5`,
      [status, booking_date, notes, total_amount, req.params.id]
    );
    res.json({ message: 'Booking updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk booking actions
router.post('/bookings/bulk', async (req, res) => {
  try {
    const { bookingIds, action } = req.body;
    if (!bookingIds || bookingIds.length === 0) {
      return res.status(400).json({ message: 'No bookings selected' });
    }
    
    let query = '';
    switch(action) {
      case 'confirm':
        query = `UPDATE bookings SET status = 'confirmed' WHERE id = ANY($1)`;
        break;
      case 'cancel':
        query = `UPDATE bookings SET status = 'cancelled' WHERE id = ANY($1)`;
        break;
      case 'complete':
        query = `UPDATE bookings SET status = 'completed' WHERE id = ANY($1)`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    await pool.query(query, [bookingIds]);
    res.json({ message: `Bulk action ${action} completed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// PAYMENT MANAGEMENT
// ========================

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, method, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (method) {
      conditions.push(`p.payment_method = $${paramIndex}`);
      params.push(method);
      paramIndex++;
    }
    if (startDate) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM payments p ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        p.*,
        b.booking_date,
        u.name as customer_name,
        u.email as customer_email,
        u2.name as provider_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.customer_id = u.id
      JOIN users u2 ON b.provider_id = u2.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      payments: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Payment overview
router.get('/payments/overview', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' AND created_at >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_revenue,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_transactions,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_payouts,
        COALESCE(COUNT(CASE WHEN status = 'paid' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100, 0) as conversion_rate
      FROM payments
    `);
    res.json({
      totalRevenue: parseFloat(result.rows[0].total_revenue),
      monthlyRevenue: parseFloat(result.rows[0].monthly_revenue),
      totalTransactions: parseInt(result.rows[0].total_transactions),
      successfulTransactions: parseInt(result.rows[0].successful_transactions),
      pendingPayouts: parseFloat(result.rows[0].pending_payouts),
      conversionRate: parseFloat(result.rows[0].conversion_rate)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Revenue by method
router.get('/payments/revenue-by-method', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        payment_method as method,
        COALESCE(SUM(amount), 0) as amount,
        COUNT(*) as count,
        COALESCE(SUM(amount)::float / NULLIF((SELECT SUM(amount) FROM payments WHERE status = 'paid'), 0) * 100, 0) as percentage
      FROM payments
      WHERE status = 'paid'
      GROUP BY payment_method
      ORDER BY amount DESC
    `);
    res.json(result.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      percentage: parseFloat(r.percentage)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Payment trends
router.get('/payments/trends', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments
      WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY month, EXTRACT(MONTH FROM created_at)
      ORDER BY MIN(created_at)
    `);
    res.json(result.rows.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Refund transaction
router.post('/payments/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    await pool.query(
      `UPDATE payments SET 
        status = 'refunded',
        refund_amount = $1,
        refund_reason = $2,
        refunded_at = NOW()
      WHERE id = $3`,
      [amount, reason, req.params.id]
    );
    res.json({ message: 'Refund processed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// CATEGORY MANAGEMENT
// ========================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM services WHERE category_id = c.id) as service_count,
        (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b 
         JOIN services s ON b.service_id = s.id 
         WHERE s.category_id = c.id AND b.status = 'completed') as total_revenue
      FROM categories c
      ORDER BY c.name
    `);
    res.json(result.rows.map(r => ({
      ...r,
      serviceCount: parseInt(r.service_count),
      totalRevenue: parseFloat(r.total_revenue)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { name, description, icon, color, image, slug } = req.body;
    const slugValue = slug || name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, icon, color, image) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slugValue, description, icon, color, image]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, icon, color, image, slug } = req.body;
    await pool.query(
      `UPDATE categories SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        color = COALESCE($4, color),
        image = COALESCE($5, image),
        slug = COALESCE($6, slug),
        updated_at = NOW()
      WHERE id = $7`,
      [name, description, icon, color, image, slug, req.params.id]
    );
    res.json({ message: 'Category updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk category actions
router.post('/categories/bulk', async (req, res) => {
  try {
    const { categoryIds, action } = req.body;
    if (!categoryIds || categoryIds.length === 0) {
      return res.status(400).json({ message: 'No categories selected' });
    }
    
    let query = '';
    switch(action) {
      case 'delete':
        query = `DELETE FROM categories WHERE id = ANY($1)`;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    await pool.query(query, [categoryIds]);
    res.json({ message: `Bulk action ${action} completed` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// REPORT ENDPOINTS
// ========================

// Get reports
router.get('/reports', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let result;
    
    if (type === 'revenue') {
      result = await pool.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COALESCE(SUM(total_amount), 0) as revenue,
          COUNT(*) as bookings
        FROM bookings
        WHERE payment_status = 'paid' AND status = 'completed'
          AND created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `, [startDate, endDate]);
    } else if (type === 'bookings') {
      result = await pool.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as bookings,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `, [startDate, endDate]);
    } else if (type === 'users') {
      result = await pool.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as registrations,
          COUNT(CASE WHEN role = 'provider' THEN 1 END) as providers,
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers
        FROM users
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `, [startDate, endDate]);
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Analytics overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE created_at BETWEEN $1 AND $2) as new_users,
        (SELECT COUNT(*) FROM services WHERE created_at BETWEEN $1 AND $2) as new_services,
        (SELECT COUNT(*) FROM bookings WHERE created_at BETWEEN $1 AND $2) as new_bookings,
        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE created_at BETWEEN $1 AND $2 AND status = 'completed') as revenue,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE created_at BETWEEN $1 AND $2) as avg_rating
    `, [startDate, endDate]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get activity log
router.get('/activities', async (req, res) => {
  try {
    const { startDate, endDate, type, status, search, sortBy, sortOrder, limit = 50 } = req.query;
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    if (type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(user ILIKE $${paramIndex} OR action ILIKE $${paramIndex} OR details ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortOrder || 'DESC'}` : 'ORDER BY timestamp DESC';
    
    const query = `
      SELECT id, user, user_type, action, type, details, timestamp, ip, status
      FROM activity_logs
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex}
    `;
    params.push(parseInt(limit) || 50);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// ADDITIONAL ADMIN ENDPOINTS
// ========================

// Get admin profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update admin profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, avatar } = req.body;
    
    await pool.query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        avatar = COALESCE($3, avatar),
        updated_at = NOW()
      WHERE id = $4 AND role = 'admin'`,
      [name, email, avatar, userId]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get platform settings
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM platform_settings LIMIT 1');
    if (result.rows.length === 0) {
      // Return default settings
      return res.json({
        siteName: 'ServiceHub',
        siteEmail: 'admin@servicehub.com',
        sitePhone: '+234 800 000 0000',
        timezone: 'Africa/Lagos',
        dateFormat: 'DD/MM/YYYY',
        currency: 'NGN',
        commissionRate: 10,
        minPayoutAmount: 5000,
        maxPayoutAmount: 500000,
        maintenanceMode: false,
        enableBookings: true,
        enablePayments: true,
        enableReviews: true,
        enableChat: true
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update platform settings
router.put('/settings', async (req, res) => {
  try {
    const {
      siteName, siteEmail, sitePhone, timezone, dateFormat, currency,
      commissionRate, minPayoutAmount, maxPayoutAmount,
      maintenanceMode, enableBookings, enablePayments, enableReviews, enableChat
    } = req.body;
    
    // Check if settings exist
    const check = await pool.query('SELECT id FROM platform_settings LIMIT 1');
    
    let result;
    if (check.rows.length === 0) {
      result = await pool.query(`
        INSERT INTO platform_settings (
          site_name, site_email, site_phone, timezone, date_format, currency,
          commission_rate, min_payout_amount, max_payout_amount,
          maintenance_mode, enable_bookings, enable_payments, enable_reviews, enable_chat
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [siteName, siteEmail, sitePhone, timezone, dateFormat, currency,
          commissionRate, minPayoutAmount, maxPayoutAmount,
          maintenanceMode, enableBookings, enablePayments, enableReviews, enableChat]);
    } else {
      result = await pool.query(`
        UPDATE platform_settings SET
          site_name = COALESCE($1, site_name),
          site_email = COALESCE($2, site_email),
          site_phone = COALESCE($3, site_phone),
          timezone = COALESCE($4, timezone),
          date_format = COALESCE($5, date_format),
          currency = COALESCE($6, currency),
          commission_rate = COALESCE($7, commission_rate),
          min_payout_amount = COALESCE($8, min_payout_amount),
          max_payout_amount = COALESCE($9, max_payout_amount),
          maintenance_mode = COALESCE($10, maintenance_mode),
          enable_bookings = COALESCE($11, enable_bookings),
          enable_payments = COALESCE($12, enable_payments),
          enable_reviews = COALESCE($13, enable_reviews),
          enable_chat = COALESCE($14, enable_chat),
          updated_at = NOW()
        RETURNING *
      `, [siteName, siteEmail, sitePhone, timezone, dateFormat, currency,
          commissionRate, minPayoutAmount, maxPayoutAmount,
          maintenanceMode, enableBookings, enablePayments, enableReviews, enableChat]);
    }
    
    res.json({ message: 'Settings updated successfully', settings: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (action) {
      conditions.push(`action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }
    if (userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      logs: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get system notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, unread = false } = req.query;
    
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (unread === 'true') {
      query += ` AND is_read = false`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE user_id = $1 AND is_read = false 
       RETURNING id`,
      [userId]
    );
    
    res.json({
      message: 'All notifications marked as read',
      count: result.rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;