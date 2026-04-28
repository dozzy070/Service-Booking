import pool from '../config/db.js';
import BookingModel from './BookingModel.js';
import ServiceModel from './serviceModel.js';
import ReviewModel from './reviewModel.js';

const ProviderDashboardModel = {
  async getSimpleStats(providerId) {
    const [servicesCount, bookingStats, rating] = await Promise.all([
      ServiceModel.countByProvider(providerId),
      BookingModel.getStats(providerId),
      ReviewModel.getAverageRatingForProvider(providerId)
    ]);

    return {
      totalServices: servicesCount,
      totalBookings: parseInt(bookingStats.total_bookings),
      pendingBookings: parseInt(bookingStats.pending_bookings),
      completedBookings: parseInt(bookingStats.completed_bookings),
      totalEarnings: parseFloat(bookingStats.total_earnings),
      averageRating: rating.averageRating
    };
  },

  async getDetailedStats(providerId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
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
      reviewStats
    ] = await Promise.all([
      BookingModel.getEarningsByPeriod(providerId, todayStart, todayEnd),
      BookingModel.getEarningsByPeriod(providerId, weekAgo),
      BookingModel.getEarningsByPeriod(providerId, monthStart),
      BookingModel.getEarningsByPeriod(providerId, new Date(0)), // all time
      BookingModel.getCounts(providerId),
      ServiceModel.countByProvider(providerId, 'active'),
      ServiceModel.countByProvider(providerId, 'pending'),
      BookingModel.getDistinctClientsCount(providerId),
      BookingModel.getDistinctClientsCount(providerId, monthStart),
      ReviewModel.getAverageRatingAndCountForProviderDirect(providerId)
    ]);

    // Placeholder response metrics (customize as needed)
    const responseRate = 98;
    const responseTime = '15 min';

    return {
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalEarnings,
      totalBookings: bookingCounts.total_bookings,
      completedBookings: bookingCounts.completed_bookings,
      pendingBookings: bookingCounts.pending_bookings,
      cancelledBookings: bookingCounts.cancelled_bookings,
      activeServices,
      pendingApproval,
      totalClients,
      newClientsThisMonth,
      averageRating: reviewStats.averageRating.toFixed(1),
      totalReviews: reviewStats.totalReviews,
      responseRate,
      responseTime
    };
  }
};

export default ProviderDashboardModel;