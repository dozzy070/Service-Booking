// src/api/api.jsx
import axios from 'axios';

// ==================== DEBUG LOGGING ====================
console.log("🔍 Checking import.meta.env:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
});

// ==================== CONFIGURATION ====================
const getAPIUrl = () => {
  return 'https://service-booking-3l1j.onrender.com/api';
};

const API_BASE_URL = getAPIUrl();

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// ==================== INTERCEPTORS ====================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`❌ API Error ${status}:`, data?.message || error.message);
      if (status === 401) {
        console.warn('🔑 Authentication expired, clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error('🌐 Network Error:', error.message);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏰ Request timed out:', error.config?.url);
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// src/api/api.js - Updated health check with better error handling

// ==================== HEALTH CHECK ====================
export const checkBackendHealth = async () => {
  try {
    const baseUrl = API_BASE_URL.replace('/api', '');
    const healthUrl = `${baseUrl}/health`;
    
    console.log(`🔍 Checking backend health at: ${healthUrl}`);
    
    // Use AbortController with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // 15 second timeout
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check passed:', data);
      return true;
    }
    
    console.warn('⚠️ Backend health check failed with status:', response.status);
    return false;
  } catch (error) {
    // Don't log abort errors as errors - they're expected timeouts
    if (error.name === 'AbortError') {
      console.warn('⏰ Backend health check timed out (server may be waking up)');
      return false;
    }
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('🌐 Backend health check failed - network error');
      return false;
    }
    console.error('❌ Backend health check error:', error.message);
    return false;
  }
};

// ==================== CUSTOMER API ====================
export const customerAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/customer/dashboard/stats'),
  getRecentBookings: () => api.get('/customer/bookings/recent'),
  getReminders: () => api.get('/customer/reminders'),
  
  // Services
  getServices: (params) => api.get('/services', { params }),
  getPopularServices: () => api.get('/services/popular'),
  getRecommendedServices: () => api.get('/services/recommended'),
  getServiceById: (id) => api.get(`/services/${id}`),
  getCategories: () => api.get('/categories'),
  
  // Featured & Trending Services
  getFeaturedServices: () => api.get('/customer/featured-services'),
  getTrendingServices: () => api.get('/customer/trending-services'),
  
  // Bookings
  createBooking: (data) => api.post('/bookings', data),
  getBookings: () => api.get('/bookings/my-bookings'),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  rescheduleBooking: (id, newDate) => api.put(`/bookings/${id}/reschedule`, { new_date: newDate }),
  getAvailableSlots: (serviceId, date) => api.get(`/bookings/available-slots?service_id=${serviceId}&date=${date}`),
  getUpcomingBookings: async () => {
    try {
      const response = await api.get('/bookings/upcoming');
      return response;
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      throw error;
    }
  },
  getBookingStats: () => api.get('/bookings/stats'),
  
  // Reviews
  getReviews: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.rating) query.append('rating', params.rating);
    if (params.sort) query.append('sort', params.sort);
    if (params.search) query.append('search', params.search);
    if (params.service_id) query.append('service_id', params.service_id);
    
    const queryString = query.toString();
    return api.get(`/customer/reviews${queryString ? `?${queryString}` : ''}`);
  },
  getReviewStats: (params = {}) => {
    const query = new URLSearchParams();
    if (params.service_id) query.append('service_id', params.service_id);
    
    const queryString = query.toString();
    return api.get(`/customer/reviews/stats${queryString ? `?${queryString}` : ''}`);
  },
  getReviewById: (id) => api.get(`/customer/reviews/${id}`),
  updateReview: (id, data) => api.put(`/customer/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/customer/reviews/${id}`),
  reportReview: (id, reason) => api.post(`/customer/reviews/${id}/report`, { reason }),
  markReviewHelpful: (id) => api.post(`/customer/reviews/${id}/helpful`),
  addReview: (serviceId, data) => api.post(`/services/${serviceId}/reviews`, data),
  
  // ✅ NOTIFICATION PREFERENCES
  getNotificationPreferences: () => api.get('/customer/notification-preferences'),
  updateNotificationPreferences: (data) => api.put('/customer/notification-preferences', data),
  
  // Favorites
  getFavorites: () => api.get('/customer/favorites'),
  toggleFavorite: (serviceId) => api.post(`/services/${serviceId}/favorite`),
  isFavorite: (serviceId) => api.get(`/services/${serviceId}/is-favorite`),
  
  // Wallet
  getWallet: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
  getRewards: () => api.get('/wallet/rewards'),
  redeemReward: (rewardId) => api.post('/wallet/redeem', { rewardId }),
  
  // Payment
  getPaymentMethods: () => api.get('/customer/payment-methods'),
  addPaymentMethod: (data) => api.post('/customer/payment-methods', data),
  setDefaultPaymentMethod: (id) => api.put(`/customer/payment-methods/${id}/default`),
  deletePaymentMethod: (id) => api.delete(`/customer/payment-methods/${id}`),
  getPaymentSummary: () => api.get('/customer/payment-summary'),
  confirmPayment: (data) => api.post('/payments/confirm', data),
};

// ==================== PROVIDER API ====================
export const providerAPI = {
  getDashboardStats: () => api.get('/provider/dashboard/stats'),
  getRecentBookings: () => api.get('/provider/dashboard/recent-bookings'),
  getTodaySchedule: () => api.get('/provider/dashboard/today-schedule'),
  getStats: () => api.get('/provider/stats'),
  getBookings: () => api.get('/provider/bookings'),
  getBookingById: (id) => api.get(`/provider/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/provider/bookings/${id}/status`, { status }),
  completeBooking: (id) => api.put(`/provider/bookings/${id}/complete`),
  startBooking: (id) => api.post(`/provider/bookings/${id}/start`),
  rescheduleBooking: (id, newDate) => api.put(`/provider/bookings/${id}/reschedule`, { new_date: newDate }),
  getServices: () => api.get('/provider/services'),
  getServiceById: (id) => api.get(`/provider/services/${id}`),
  createService: (data) => api.post('/provider/services', data),
  updateService: (id, data) => api.put(`/provider/services/${id}`, data),
  deleteService: (id) => api.delete(`/provider/services/${id}`),
  getReviews: () => api.get('/provider/reviews'),
  respondToReview: (id, response) => api.post(`/provider/reviews/${id}/respond`, { response }),
  getWallet: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
  withdrawFunds: (amount, methodId) => api.post('/wallet/withdraw', { amount, withdrawalMethodId: methodId }),
  addFunds: (amount, methodId) => api.post('/wallet/add-funds', { amount, paymentMethodId: methodId }),
  getRewards: () => api.get('/wallet/rewards'),
  redeemReward: (rewardId) => api.post('/wallet/redeem', { rewardId }),
  getRedeemHistory: () => api.get('/wallet/redeem-history'),
  getPaymentMethods: () => api.get('/wallet/payment-methods'),
  getWithdrawalMethods: () => api.get('/wallet/withdrawal-methods'),
  getProfile: () => api.get('/provider/profile'),
  updateProfile: (data) => api.put('/provider/profile', data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRevenueChart: (view = 'monthly') => api.get(`/admin/dashboard/revenue-chart?view=${view}`),
  getActivities: () => api.get('/admin/dashboard/activities'),
  getTopProviders: () => api.get('/admin/dashboard/top-providers'),
  getPopularServices: () => api.get('/admin/dashboard/popular-services'),
  getPendingApprovals: () => api.get('/admin/dashboard/pending-approvals'),
  getSystemHealth: () => api.get('/admin/dashboard/system-health'),
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  getProviders: () => api.get('/admin/providers'),
  getProviderDetails: (id) => api.get(`/admin/providers/${id}`),
  getServices: () => api.get('/admin/services'),
  getServiceById: (id) => api.get(`/admin/services/${id}`),
  approveService: (id) => api.put(`/admin/services/${id}/approve`),
  rejectService: (id, reason) => api.put(`/admin/services/${id}/reject`, { reason }),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  toggleFeatured: (id) => api.put(`/admin/services/${id}/featured`),
  getBookings: () => api.get('/admin/bookings'),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getPayments: () => api.get('/admin/payments'),
  getPaymentOverview: () => api.get('/admin/payments/overview'),
  getRevenueByMethod: () => api.get('/admin/payments/revenue-by-method'),
  getPaymentTrends: () => api.get('/admin/payments/trends'),
  refundPayment: (id, data) => api.post(`/admin/payments/${id}/refund`, data),
  getReports: (params) => api.get('/admin/reports', { params }),
  getAnalyticsOverview: (params) => api.get('/admin/analytics/overview', { params }),
  getNotifications: () => api.get('/admin/notifications'),
  markAllRead: () => api.put('/admin/notifications/read-all'),
  getActivityLog: (params) => api.get('/admin/activities', { params }),
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
  getNotifications: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/notifications${query}`);
  },
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
};

// ==================== CHAT API ====================
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId) => api.get(`/chat/conversations/${conversationId}/messages`),
  createConversation: (otherPartyId, bookingId = null) => 
    api.post('/chat/conversations', { otherPartyId, bookingId }),
  getAvailableUsers: () => api.get('/chat/users/available-for-chat'),
  sendMessage: (conversationId, message, receiverId) => 
    api.post(`/chat/conversations/${conversationId}/messages`, { message, receiverId }),
  markMessagesAsRead: (conversationId, messageIds) => 
    api.put(`/chat/conversations/${conversationId}/read`, { messageIds }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
};

// ==================== AUTH API ====================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  logout: () => api.post('/auth/logout'),
  googleAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
};

// ==================== EXPORTS ====================
export default api;
export { API_BASE_URL };