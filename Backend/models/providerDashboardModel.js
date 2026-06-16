// models/ProviderDashboardModel.js
import pool from '../config/db.js';
import BookingModel from './BookingModel.js';
import ServiceModel from './serviceModel.js';
import ReviewModel from './reviewModel.js';

const ProviderDashboardModel = {
  // =========================================================================
  // SIMPLE STATS
  // =========================================================================

  async getSimpleStats(providerId) {
    const [servicesCount, bookingStats, rating] = await Promise.all([
      ServiceModel.countByProvider(providerId),
      BookingModel.getStats(providerId),
      ReviewModel.getAverageRatingForProvider(providerId)
    ]);

    return {
      totalServices: servicesCount,
      totalBookings: parseInt(bookingStats.total_bookings || 0),
      pendingBookings: parseInt(bookingStats.pending_bookings || 0),
      completedBookings: parseInt(bookingStats.completed_bookings || 0),
      totalEarnings: parseFloat(bookingStats.total_earnings || 0),
      averageRating: rating.averageRating || 0,
      totalReviews: rating.totalReviews || 0
    };
  },

  // =========================================================================
  // DETAILED STATS
  // =========================================================================

  async getDetailedStats(providerId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalEarnings,
      bookingCounts,
      activeServices,
      pendingApproval,
      totalClients,
      newClientsThisMonth,
      reviewStats,
      bookingGrowth,
      revenueGrowth
    ] = await Promise.all([
      BookingModel.getEarningsByPeriod(providerId, todayStart, todayEnd),
      BookingModel.getEarningsByPeriod(providerId, weekAgo),
      BookingModel.getEarningsByPeriod(providerId, monthStart),
      BookingModel.getEarningsByPeriod(providerId, new Date(0)), // all time
      BookingModel.getCounts(providerId),
      ServiceModel.countByProvider(providerId, 'approved'),
      ServiceModel.countByProvider(providerId, 'pending'),
      BookingModel.getDistinctClientsCount(providerId),
      BookingModel.getDistinctClientsCount(providerId, monthStart),
      ReviewModel.getAverageRatingAndCountForProviderDirect(providerId),
      this.getBookingGrowth(providerId),
      this.getRevenueGrowth(providerId)
    ]);

    // Placeholder response metrics (customize as needed)
    const responseRate = 98;
    const responseTime = '15 min';

    return {
      todayEarnings: parseFloat(todayEarnings.earnings || 0),
      weeklyEarnings: parseFloat(weeklyEarnings.earnings || 0),
      monthlyEarnings: parseFloat(monthlyEarnings.earnings || 0),
      totalEarnings: parseFloat(totalEarnings.earnings || 0),
      totalBookings: parseInt(bookingCounts.total_bookings || 0),
      completedBookings: parseInt(bookingCounts.completed_bookings || 0),
      pendingBookings: parseInt(bookingCounts.pending_bookings || 0),
      cancelledBookings: parseInt(bookingCounts.cancelled_bookings || 0),
      confirmedBookings: parseInt(bookingCounts.confirmed_bookings || 0),
      inProgressBookings: parseInt(bookingCounts.in_progress_bookings || 0),
      disputedBookings: parseInt(bookingCounts.disputed_bookings || 0),
      activeServices: parseInt(activeServices || 0),
      pendingApproval: parseInt(pendingApproval || 0),
      totalClients: parseInt(totalClients || 0),
      newClientsThisMonth: parseInt(newClientsThisMonth || 0),
      averageRating: parseFloat(reviewStats.averageRating || 0).toFixed(1),
      totalReviews: parseInt(reviewStats.totalReviews || 0),
      responseRate,
      responseTime,
      bookingGrowth: parseFloat(bookingGrowth || 0),
      revenueGrowth: parseFloat(revenueGrowth || 0)
    };
  },

  // =========================================================================
  // GET BOOKING GROWTH
  // =========================================================================

  async getBookingGrowth(providerId) {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings 
         WHERE provider_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days') as current_month,
        (SELECT COUNT(*) FROM bookings 
         WHERE provider_id = $1 AND created_at < CURRENT_DATE - INTERVAL '30 days' 
         AND created_at >= CURRENT_DATE - INTERVAL '60 days') as previous_month
    `, [providerId]);

    const current = parseInt(result.rows[0].current_month || 0);
    const previous = parseInt(result.rows[0].previous_month || 0);

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  },

  // =========================================================================
  // GET REVENUE GROWTH
  // =========================================================================

  async getRevenueGrowth(providerId) {
    const result = await pool.query(`
      SELECT 
        COALESCE((SELECT SUM(total_amount) FROM bookings 
         WHERE provider_id = $1 AND status = 'completed' 
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as current_month,
        COALESCE((SELECT SUM(total_amount) FROM bookings 
         WHERE provider_id = $1 AND status = 'completed' 
         AND created_at < CURRENT_DATE - INTERVAL '30 days' 
         AND created_at >= CURRENT_DATE - INTERVAL '60 days'), 0) as previous_month
    `, [providerId]);

    const current = parseFloat(result.rows[0].current_month || 0);
    const previous = parseFloat(result.rows[0].previous_month || 0);

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  },

  // =========================================================================
  // GET PERFORMANCE METRICS
  // =========================================================================

  async getPerformanceMetrics(providerId) {
    const result = await pool.query(`
      SELECT 
        COALESCE(AVG(b.total_amount), 0) as average_booking_value,
        COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE NULL END), 0) as average_completed_value,
        COALESCE(COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100, 0) as completion_rate,
        COALESCE(COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100, 0) as cancellation_rate,
        COALESCE(AVG(CASE WHEN b.status = 'completed' THEN EXTRACT(EPOCH FROM (b.updated_at - b.created_at)) / 3600 ELSE NULL END), 0) as avg_completion_time_hours
      FROM bookings b
      WHERE b.provider_id = $1
    `, [providerId]);

    return {
      averageBookingValue: parseFloat(result.rows[0].average_booking_value || 0),
      averageCompletedValue: parseFloat(result.rows[0].average_completed_value || 0),
      completionRate: parseFloat(result.rows[0].completion_rate || 0),
      cancellationRate: parseFloat(result.rows[0].cancellation_rate || 0),
      averageCompletionTimeHours: parseFloat(result.rows[0].avg_completion_time_hours || 0)
    };
  },

  // =========================================================================
  // GET MONTHLY PERFORMANCE
  // =========================================================================

  async getMonthlyPerformance(providerId, months = 6) {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END), 0) as avg_booking_value
      FROM bookings
      WHERE provider_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `, [providerId]);

    return result.rows.map(row => ({
      month: row.month,
      totalBookings: parseInt(row.total_bookings || 0),
      completedBookings: parseInt(row.completed_bookings || 0),
      revenue: parseFloat(row.revenue || 0),
      averageBookingValue: parseFloat(row.avg_booking_value || 0)
    }));
  },

  // =========================================================================
  // GET DAILY PERFORMANCE (Last N Days)
  // =========================================================================

  async getDailyPerformance(providerId, days = 30) {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue
      FROM bookings
      WHERE provider_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [providerId]);

    return result.rows.map(row => ({
      date: row.date,
      totalBookings: parseInt(row.total_bookings || 0),
      completedBookings: parseInt(row.completed_bookings || 0),
      revenue: parseFloat(row.revenue || 0)
    }));
  },

  // =========================================================================
  // GET POPULAR SERVICES
  // =========================================================================

  async getPopularServices(providerId, limit = 5) {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.price,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as revenue,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_reviews
      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE s.provider_id = $1
      GROUP BY s.id, s.title, s.price
      ORDER BY total_bookings DESC, revenue DESC
      LIMIT $2
    `, [providerId, limit]);

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      price: parseFloat(row.price || 0),
      totalBookings: parseInt(row.total_bookings || 0),
      completedBookings: parseInt(row.completed_bookings || 0),
      revenue: parseFloat(row.revenue || 0),
      averageRating: parseFloat(row.average_rating || 0),
      totalReviews: parseInt(row.total_reviews || 0)
    }));
  },

  // =========================================================================
  // GET TOP CUSTOMERS
  // =========================================================================

  async getTopCustomers(providerId, limit = 5) {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_spent,
        AVG(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE NULL END) as avg_booking_value,
        MAX(b.created_at) as last_booking_date
      FROM users u
      JOIN bookings b ON b.customer_id = u.id
      WHERE b.provider_id = $1
      GROUP BY u.id, u.name, u.email, u.phone
      ORDER BY total_spent DESC, total_bookings DESC
      LIMIT $2
    `, [providerId, limit]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      totalBookings: parseInt(row.total_bookings || 0),
      completedBookings: parseInt(row.completed_bookings || 0),
      totalSpent: parseFloat(row.total_spent || 0),
      averageBookingValue: parseFloat(row.avg_booking_value || 0),
      lastBookingDate: row.last_booking_date
    }));
  },

  // =========================================================================
  // GET SERVICE BREAKDOWN
  // =========================================================================

  async getServiceBreakdown(providerId) {
    const result = await pool.query(`
      SELECT 
        s.status,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as revenue,
        COUNT(b.id) as bookings
      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id
      WHERE s.provider_id = $1
      GROUP BY s.status
    `, [providerId]);

    const breakdown = {
      pending: { count: 0, revenue: 0, bookings: 0 },
      approved: { count: 0, revenue: 0, bookings: 0 },
      rejected: { count: 0, revenue: 0, bookings: 0 },
      inactive: { count: 0, revenue: 0, bookings: 0 }
    };

    result.rows.forEach(row => {
      const status = row.status || 'pending';
      if (breakdown[status]) {
        breakdown[status] = {
          count: parseInt(row.count || 0),
          revenue: parseFloat(row.revenue || 0),
          bookings: parseInt(row.bookings || 0)
        };
      }
    });

    return breakdown;
  },

  // =========================================================================
  // GET REVIEW SUMMARY
  // =========================================================================

  async getReviewSummary(providerId) {
    const result = await pool.query(`
      SELECT 
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_reviews,
        COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as positive_reviews,
        COUNT(CASE WHEN r.rating = 3 THEN 1 END) as neutral_reviews,
        COUNT(CASE WHEN r.rating < 3 THEN 1 END) as negative_reviews,
        COUNT(CASE WHEN r.response IS NOT NULL THEN 1 END) as responded_reviews,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE s.provider_id = $1
    `, [providerId]);

    const row = result.rows[0];
    const totalReviews = parseInt(row.total_reviews || 0);

    return {
      averageRating: parseFloat(row.average_rating || 0),
      totalReviews: totalReviews,
      positiveReviews: parseInt(row.positive_reviews || 0),
      neutralReviews: parseInt(row.neutral_reviews || 0),
      negativeReviews: parseInt(row.negative_reviews || 0),
      respondedReviews: parseInt(row.responded_reviews || 0),
      responseRate: totalReviews > 0 ? (parseInt(row.responded_reviews || 0) / totalReviews) * 100 : 0,
      ratingDistribution: {
        5: await this.getRatingCount(providerId, 5),
        4: await this.getRatingCount(providerId, 4),
        3: await this.getRatingCount(providerId, 3),
        2: await this.getRatingCount(providerId, 2),
        1: await this.getRatingCount(providerId, 1)
      }
    };
  },

  // =========================================================================
  // GET RATING COUNT
  // =========================================================================

  async getRatingCount(providerId, rating) {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      WHERE s.provider_id = $1 AND r.rating = $2
    `, [providerId, rating]);
    return parseInt(result.rows[0].count || 0);
  },

  // =========================================================================
  // GET WEEKLY PERFORMANCE
  // =========================================================================

  async getWeeklyPerformance(providerId) {
    const result = await pool.query(`
      SELECT 
        EXTRACT(DOW FROM booking_date) as day_of_week,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue
      FROM bookings
      WHERE provider_id = $1
        AND booking_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY EXTRACT(DOW FROM booking_date)
      ORDER BY day_of_week
    `, [providerId]);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const performance = {};
    
    days.forEach((day, index) => {
      performance[day] = {
        totalBookings: 0,
        completedBookings: 0,
        revenue: 0
      };
    });

    result.rows.forEach(row => {
      const dayIndex = parseInt(row.day_of_week);
      const dayName = days[dayIndex];
      if (performance[dayName]) {
        performance[dayName] = {
          totalBookings: parseInt(row.total_bookings || 0),
          completedBookings: parseInt(row.completed_bookings || 0),
          revenue: parseFloat(row.revenue || 0)
        };
      }
    });

    return performance;
  }
};

export default ProviderDashboardModel;