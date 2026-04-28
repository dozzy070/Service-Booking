import pool from '../config/db.js';

// GET /api/admin/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    // Users stats
    const userStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
        COUNT(CASE WHEN role = 'provider' THEN 1 END) as providers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified,
        COUNT(CASE WHEN verified = false THEN 1 END) as unverified,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended
      FROM users
    `);
    const newUsersToday = await pool.query(`
      SELECT COUNT(*) as new_today FROM users WHERE created_at::date = CURRENT_DATE
    `);
    // For growth, compare with previous month (simplified)
    const userGrowth = await pool.query(`
      SELECT 
        COUNT(*) as current_total,
        (SELECT COUNT(*) FROM users WHERE created_at < CURRENT_DATE - INTERVAL '30 days') as prev_total
      FROM users
    `);
    const growth = userGrowth.rows[0].current_total - userGrowth.rows[0].prev_total;
    const growthPercent = userGrowth.rows[0].prev_total > 0 ? (growth / userGrowth.rows[0].prev_total) * 100 : 0;

    // Services stats
    const serviceStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(DISTINCT category_id) as categories
      FROM services
    `);
    const featuredCount = await pool.query(`SELECT COUNT(*) FROM services WHERE featured = true`);
    const serviceGrowth = await pool.query(`
      SELECT 
        COUNT(*) as current_total,
        (SELECT COUNT(*) FROM services WHERE created_at < CURRENT_DATE - INTERVAL '30 days') as prev_total
      FROM services
    `);
    const serviceGrowthPercent = serviceGrowth.rows[0].prev_total > 0 
      ? ((serviceGrowth.rows[0].current_total - serviceGrowth.rows[0].prev_total) / serviceGrowth.rows[0].prev_total) * 100 
      : 0;

    // Bookings stats
    const bookingStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' OR status = 'upcoming' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN dispute = true THEN 1 END) as disputes
      FROM bookings
    `);
    const bookingGrowth = await pool.query(`
      SELECT 
        COUNT(*) as current_total,
        (SELECT COUNT(*) FROM bookings WHERE created_at < CURRENT_DATE - INTERVAL '30 days') as prev_total
      FROM bookings
    `);
    const bookingGrowthPercent = bookingGrowth.rows[0].prev_total > 0 
      ? ((bookingGrowth.rows[0].current_total - bookingGrowth.rows[0].prev_total) / bookingGrowth.rows[0].prev_total) * 100 
      : 0;

    // Revenue stats
    const revenueTotal = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = 'paid' AND status = 'completed'
    `);
    const monthlyRevenue = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as monthly 
      FROM bookings 
      WHERE payment_status = 'paid' AND status = 'completed' 
      AND created_at >= date_trunc('month', CURRENT_DATE)
    `);
    const weeklyRevenue = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as weekly 
      FROM bookings 
      WHERE payment_status = 'paid' AND status = 'completed' 
      AND created_at >= date_trunc('week', CURRENT_DATE)
    `);
    const dailyRevenue = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as daily 
      FROM bookings 
      WHERE payment_status = 'paid' AND status = 'completed' 
      AND created_at::date = CURRENT_DATE
    `);
    const avgOrderValue = await pool.query(`
      SELECT COALESCE(AVG(total_amount), 0) as avg 
      FROM bookings 
      WHERE payment_status = 'paid' AND status = 'completed'
    `);
    const commission = await pool.query(`
      SELECT COALESCE(SUM(commission_amount), 0) as commission 
      FROM bookings 
      WHERE payment_status = 'paid' AND status = 'completed'
    `);
    const revenueGrowth = await pool.query(`
      SELECT 
        COALESCE((SELECT SUM(total_amount) FROM bookings WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as current,
        COALESCE((SELECT SUM(total_amount) FROM bookings WHERE payment_status = 'paid' AND created_at < CURRENT_DATE - INTERVAL '30 days'), 0) as prev
    `);
    const revenueGrowthPercent = revenueGrowth.rows[0].prev > 0 
      ? ((revenueGrowth.rows[0].current - revenueGrowth.rows[0].prev) / revenueGrowth.rows[0].prev) * 100 
      : 0;

    // Ratings stats
    const ratings = await pool.query(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as avg,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one
      FROM reviews
    `);
    const avgRating = parseFloat(ratings.rows[0].avg) || 0;

    res.json({
      users: {
        total: parseInt(userStats.rows[0].total),
        new: parseInt(newUsersToday.rows[0].new_today),
        active: parseInt(userStats.rows[0].active),
        suspended: parseInt(userStats.rows[0].suspended),
        verified: parseInt(userStats.rows[0].verified),
        unverified: parseInt(userStats.rows[0].unverified),
        providers: parseInt(userStats.rows[0].providers),
        customers: parseInt(userStats.rows[0].customers),
        admins: parseInt(userStats.rows[0].admins),
        growth: parseFloat(growthPercent.toFixed(1))
      },
      services: {
        total: parseInt(serviceStats.rows[0].total),
        pending: parseInt(serviceStats.rows[0].pending),
        approved: parseInt(serviceStats.rows[0].approved),
        rejected: parseInt(serviceStats.rows[0].rejected),
        featured: parseInt(featuredCount.rows[0].count),
        categories: parseInt(serviceStats.rows[0].categories),
        growth: parseFloat(serviceGrowthPercent.toFixed(1))
      },
      bookings: {
        total: parseInt(bookingStats.rows[0].total),
        pending: parseInt(bookingStats.rows[0].pending),
        active: parseInt(bookingStats.rows[0].active),
        completed: parseInt(bookingStats.rows[0].completed),
        cancelled: parseInt(bookingStats.rows[0].cancelled),
        disputes: parseInt(bookingStats.rows[0].disputes),
        growth: parseFloat(bookingGrowthPercent.toFixed(1))
      },
      revenue: {
        total: parseFloat(revenueTotal.rows[0].total),
        monthly: parseFloat(monthlyRevenue.rows[0].monthly),
        weekly: parseFloat(weeklyRevenue.rows[0].weekly),
        daily: parseFloat(dailyRevenue.rows[0].daily),
        average: parseFloat(avgOrderValue.rows[0].avg),
        commission: parseFloat(commission.rows[0].commission),
        growth: parseFloat(revenueGrowthPercent.toFixed(1))
      },
      ratings: {
        average: avgRating,
        total: parseInt(ratings.rows[0].total),
        fiveStar: parseInt(ratings.rows[0].five),
        fourStar: parseInt(ratings.rows[0].four),
        threeStar: parseInt(ratings.rows[0].three),
        twoStar: parseInt(ratings.rows[0].two),
        oneStar: parseInt(ratings.rows[0].one)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// GET /api/admin/dashboard/revenue-chart?view=weekly|monthly|yearly
export const getRevenueChart = async (req, res) => {
  try {
    const { view = 'monthly' } = req.query;
    let labels = [], data = [], maxValue = 0;

    if (view === 'weekly') {
      // Last 7 days
      const result = await pool.query(`
        SELECT 
          TO_CHAR(created_at, 'Dy') as label,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM bookings
        WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY label
        ORDER BY MIN(created_at)
      `);
      labels = result.rows.map(r => r.label);
      data = result.rows.map(r => parseFloat(r.revenue));
    } 
    else if (view === 'yearly') {
      // Last 5 years
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
    } 
    else { // monthly
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
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ message: 'Failed to fetch chart data' });
  }
};

// GET /api/admin/dashboard/activities (last 20 activities)
export const getRecentActivities = async (req, res) => {
  try {
    // Union of different actions (users, bookings, services, reviews, payments)
    // This is a simplified example – you can expand as needed.
    const activities = await pool.query(`
      (SELECT 
        'user' as type,
        u.id as user_id,
        u.name as user_name,
        'registered' as action,
        u.created_at as timestamp,
        jsonb_build_object('role', u.role) as details
      FROM users u
      WHERE u.created_at IS NOT NULL)
      UNION ALL
      (SELECT 
        'booking' as type,
        b.customer_id as user_id,
        cu.name as user_name,
        'created booking #' || b.id as action,
        b.created_at as timestamp,
        jsonb_build_object('booking_id', b.id, 'amount', b.total_amount) as details
      FROM bookings b
      JOIN users cu ON b.customer_id = cu.id)
      UNION ALL
      (SELECT 
        'service' as type,
        s.provider_id as user_id,
        u.name as user_name,
        'added service: ' || s.title as action,
        s.created_at as timestamp,
        jsonb_build_object('service_id', s.id, 'status', s.status) as details
      FROM services s
      JOIN users u ON s.provider_id = u.id)
      UNION ALL
      (SELECT 
        'review' as type,
        r.user_id,
        u.name as user_name,
        'left a ' || r.rating || '-star review' as action,
        r.created_at as timestamp,
        jsonb_build_object('review_id', r.id, 'rating', r.rating) as details
      FROM reviews r
      JOIN users u ON r.user_id = u.id)
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    const formatted = activities.rows.map(a => ({
      id: a.timestamp.getTime() + Math.random(),
      user: a.user_name,
      action: a.action,
      time: timeAgo(a.timestamp),
      timestamp: a.timestamp,
      type: a.type,
      details: a.details
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};

// Helper: time ago string
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour ago`;
  const days = Math.floor(hours / 24);
  return `${days} day ago`;
}

// GET /api/admin/dashboard/top-providers
export const getTopProviders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.avatar,
        COUNT(DISTINCT s.id) as services,
        COUNT(b.id) as bookings,
        COALESCE(AVG(r.rating), 0) as rating,
        COALESCE(SUM(b.total_amount), 0) as revenue
      FROM users u
      LEFT JOIN services s ON s.provider_id = u.id AND s.status = 'approved'
      LEFT JOIN bookings b ON b.provider_id = u.id AND b.status = 'completed'
      LEFT JOIN reviews r ON r.provider_id = u.id
      WHERE u.role = 'provider'
      GROUP BY u.id, u.name, u.avatar
      ORDER BY revenue DESC
      LIMIT 5
    `);
    const providers = result.rows.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=667eea&color=fff&size=50`,
      services: parseInt(p.services),
      bookings: parseInt(p.bookings),
      rating: parseFloat(p.rating).toFixed(1),
      revenue: parseFloat(p.revenue)
    }));
    res.json(providers);
  } catch (error) {
    console.error('Top providers error:', error);
    res.status(500).json({ message: 'Failed to fetch top providers' });
  }
};

// GET /api/admin/dashboard/popular-services
export const getPopularServices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        c.name as category,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.total_amount), 0) as revenue,
        COALESCE(AVG(r.rating), 0) as rating
      FROM services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.status = 'approved'
      GROUP BY s.id, s.title, c.name
      ORDER BY bookings DESC
      LIMIT 5
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
  } catch (error) {
    console.error('Popular services error:', error);
    res.status(500).json({ message: 'Failed to fetch popular services' });
  }
};

// GET /api/admin/dashboard/pending-approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const [users, services, reviews, disputes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE verified = false`),
      pool.query(`SELECT COUNT(*) FROM services WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM reviews WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM bookings WHERE dispute = true`)
    ]);
    res.json({
      users: parseInt(users.rows[0].count),
      services: parseInt(services.rows[0].count),
      reviews: parseInt(reviews.rows[0].count),
      disputes: parseInt(disputes.rows[0].count)
    });
  } catch (error) {
    console.error('Pending approvals error:', error);
    res.status(500).json({ message: 'Failed to fetch pending approvals' });
  }
};

// GET /api/admin/dashboard/system-health
export const getSystemHealth = async (req, res) => {
  // Since this is a simplified demo, we return "healthy" with dummy data.
  // In production, you would check actual database connections, cache, etc.
  res.json({
    server: { status: 'healthy', uptime: '99.9%', responseTime: 120 },
    database: { status: 'healthy', queries: 3456, slowQueries: 12 },
    cache: { status: 'healthy', hitRate: 94 },
    api: { status: 'healthy', requests: 12345, errors: 23 }
  });
};