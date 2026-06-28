// src/api/api.jsx
import axios from 'axios';

// ==================== CONFIGURATION ====================
const API_BASE_URL = 'https://service-booking-3l1j.onrender.com/api';

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
    // ✅ Only log in development and skip expected 404 endpoints
    if (process.env.NODE_ENV === 'development') {
      // Skip logging for known 404 endpoints
      const skipLogging = ['/customer/reminders', '/customer/reviews/stats'];
      const shouldSkip = skipLogging.some(path => config.url?.includes(path));
      if (!shouldSkip) {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // ✅ Only log in development and skip expected 404 endpoints
    if (process.env.NODE_ENV === 'development') {
      const skipLogging = ['/customer/reminders', '/customer/reviews/stats'];
      const shouldSkip = skipLogging.some(path => response.config.url?.includes(path));
      if (!shouldSkip) {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    
    // ✅ SILENT HANDLING for expected 404s - Return empty data without logging
    const expected404s = [
      '/customer/reminders',
      '/customer/reviews/stats',
      '/customer/notification-preferences',
      '/customer/favorites'
    ];
    
    const isExpected404 = status === 404 && expected404s.some(path => url?.includes(path));
    
    if (isExpected404) {
      // ✅ Return empty data silently - no error logged
      return Promise.resolve({ 
        data: url?.includes('/reminders') ? [] : 
              url?.includes('/stats') ? { total: 0, average: 0, distribution: {} } :
              url?.includes('/favorites') ? [] :
              url?.includes('/notification-preferences') ? { email: true, push: true } :
              {},
        status: 200,
        statusText: 'OK (Silent)',
        config: error.config,
        headers: {}
      });
    }
    
    // Log other errors
    if (error.response) {
      console.error(`❌ API Error ${status}:`, error.response.data?.message || error.message);
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
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('⏰ Request timed out:', error.config?.url);
    } else {
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ==================== HEALTH CHECK ====================
export const checkBackendHealth = async () => {
  try {
    const healthUrl = `${API_BASE_URL.replace('/api', '')}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
    if (error.name === 'AbortError') {
      console.warn('⏰ Backend health check timed out');
    } else {
      console.warn('🌐 Backend health check failed:', error.message);
    }
    return false;
  }
};

// ==================== CUSTOMER API ====================
export const customerAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/customer/dashboard/stats'),
  getRecentBookings: () => api.get('/customer/bookings/recent'),
  
  // ✅ FIXED: Get reminders with silent 404 handling
  getReminders: async () => {
    try {
      const response = await api.get('/customer/reminders');
      return response;
    } catch (error) {
      // ✅ Silent handling - return empty array for 404
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw error;
    }
  },
  
  // Services
  getServices: (params) => api.get('/services', { params }),
  getPopularServices: () => api.get('/services/popular'),
  getRecommendedServices: () => api.get('/services/recommended'),
  getServiceById: (id) => api.get(`/services/${id}`),
  getCategories: () => api.get('/categories'),
  
  // Featured & Trending Services
  getFeaturedServices: () => api.get('/customer/featured-services'),
  getTrendingServices: () => api.get('/customer/trending-services'),
  
  // Favorites
  getFavorites: async () => {
    try {
      const response = await api.get('/customer/favorites');
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw error;
    }
  },
  toggleFavorite: (serviceId) => api.post(`/services/${serviceId}/favorite`),
  isFavorite: (serviceId) => api.get(`/services/${serviceId}/is-favorite`),
  
  // Bookings
  createBooking: (data) => api.post('/bookings', data),
  getBookings: () => api.get('/bookings/my-bookings'),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
  rescheduleBooking: (id, newDate) => api.put(`/bookings/${id}/reschedule`, { new_date: newDate }),
  getAvailableSlots: (serviceId, date) => api.get(`/bookings/available-slots?service_id=${serviceId}&date=${date}`),
  getUpcomingBookings: () => api.get('/bookings/upcoming'),
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
  getReviewStats: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.service_id) query.append('service_id', params.service_id);
      
      const queryString = query.toString();
      const response = await api.get(`/customer/reviews/stats${queryString ? `?${queryString}` : ''}`);
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: { total: 0, average: 0, distribution: {} } };
      }
      throw error;
    }
  },
  getReviewById: (id) => api.get(`/customer/reviews/${id}`),
  updateReview: (id, data) => api.put(`/customer/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/customer/reviews/${id}`),
  reportReview: (id, reason) => api.post(`/customer/reviews/${id}/report`, { reason }),
  markReviewHelpful: (id) => api.post(`/customer/reviews/${id}/helpful`),
  addReview: (serviceId, data) => api.post(`/services/${serviceId}/reviews`, data),
  
  // Notification Preferences
  getNotificationPreferences: async () => {
    try {
      const response = await api.get('/customer/notification-preferences');
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: { email: true, push: true, sms: false } };
      }
      throw error;
    }
  },
  updateNotificationPreferences: (data) => api.put('/customer/notification-preferences', data),
  
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
  
  // =========================================================================
  // HELP CENTER - CUSTOMER
  // =========================================================================
  
  // FAQs
  getFAQs: async (params) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.page) query.append('page', params.page);
      if (params?.limit) query.append('limit', params.limit);
      if (params?.category) query.append('category', params.category);
      return api.get(`/customer/faqs${query.toString() ? `?${query.toString()}` : ''}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw error;
    }
  },
  getHelpFAQs: (params) => customerAPI.getFAQs(params),
  
  // Support Tickets
  getSupportTickets: async (params) => {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.page) query.append('page', params.page);
      if (params?.limit) query.append('limit', params.limit);
      return api.get(`/customer/tickets${query.toString() ? `?${query.toString()}` : ''}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw error;
    }
  },
  getTickets: (params) => customerAPI.getSupportTickets(params),
  createSupportTicket: (data) => api.post('/customer/tickets', data),
  createTicket: (data) => customerAPI.createSupportTicket(data),
  replyToTicket: (ticketId, data) => api.post(`/customer/tickets/${ticketId}/reply`, data),
  addTicketReply: (ticketId, data) => customerAPI.replyToTicket(ticketId, data),
  
  // Knowledge Base
  getKnowledgeBase: async (params) => {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.category) query.append('category', params.category);
      if (params?.limit) query.append('limit', params.limit);
      return api.get(`/customer/knowledge-base${query.toString() ? `?${query.toString()}` : ''}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw error;
    }
  },
  getHelpArticles: (params) => customerAPI.getKnowledgeBase(params),
};

// ==================== PROVIDER API ====================
export const providerAPI = {
  // Dashboard
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
  
  // =========================================================================
  // HELP CENTER / SUPPORT - PROVIDER SIDE
  // =========================================================================

  // FAQs
  getFAQs: (params) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    if (params?.category) query.append('category', params.category);
    return api.get(`/provider/faqs${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getHelpFAQs: (params) => providerAPI.getFAQs(params),
  
  // Support Tickets
  getSupportTickets: (params) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    return api.get(`/provider/tickets${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getTickets: (params) => providerAPI.getSupportTickets(params),
  createSupportTicket: (data) => api.post('/provider/tickets', data),
  createTicket: (data) => providerAPI.createSupportTicket(data),
  replyToTicket: (ticketId, data) => api.post(`/provider/tickets/${ticketId}/reply`, data),
  addTicketReply: (ticketId, data) => providerAPI.replyToTicket(ticketId, data),
  
  // Announcements
  getAnnouncements: (params) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit);
    if (params?.page) query.append('page', params.page);
    return api.get(`/provider/announcements${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getAnnouncementsList: (params) => providerAPI.getAnnouncements(params),
  
  // Knowledge Base
  getKnowledgeBase: (params) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.limit) query.append('limit', params.limit);
    return api.get(`/provider/knowledge-base${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getHelpArticles: (params) => providerAPI.getKnowledgeBase(params),
  
  // FAQ Feedback
  submitFAQFeedback: (faqId, data) => api.post(`/provider/faqs/${faqId}/feedback`, data),
  faqFeedback: (faqId, data) => providerAPI.submitFAQFeedback(faqId, data),
  
  // Contact Form
  submitContactForm: (data) => api.post('/provider/contact', data),
  sendContactMessage: (data) => providerAPI.submitContactForm(data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Dashboard
  getStats: () => api.get('/admin/dashboard/stats'),
  getRevenueChart: (view = 'monthly') => api.get(`/admin/dashboard/revenue-chart?view=${view}`),
  getActivities: () => api.get('/admin/dashboard/activities'),
  getTopProviders: () => api.get('/admin/dashboard/top-providers'),
  getPopularServices: () => api.get('/admin/dashboard/popular-services'),
  getPendingApprovals: () => api.get('/admin/dashboard/pending-approvals'),
  getSystemHealth: () => api.get('/admin/dashboard/system-health'),
  
  // Users
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  
  // Providers
  getProviders: () => api.get('/admin/providers'),
  getProviderDetails: (id) => api.get(`/admin/providers/${id}`),
  
  // Services
  getServices: () => api.get('/admin/services'),
  getServiceById: (id) => api.get(`/admin/services/${id}`),
  approveService: (id) => api.put(`/admin/services/${id}/approve`),
  rejectService: (id, reason) => api.put(`/admin/services/${id}/reject`, { reason }),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  toggleFeatured: (id) => api.put(`/admin/services/${id}/featured`),
  
  // Bookings
  getBookings: () => api.get('/admin/bookings'),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
  
  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // =========================================================================
  // HELP CENTER - ADMIN
  // =========================================================================

  // FAQs
  getFAQs: (params) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    return api.get(`/admin/faqs${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getHelpFAQs: (params) => adminAPI.getFAQs(params),
  createFAQ: (data) => api.post('/admin/faqs', data),
  addFAQ: (data) => adminAPI.createFAQ(data),
  updateFAQ: (id, data) => api.put(`/admin/faqs/${id}`, data),
  editFAQ: (id, data) => adminAPI.updateFAQ(id, data),
  deleteFAQ: (id) => api.delete(`/admin/faqs/${id}`),
  removeFAQ: (id) => adminAPI.deleteFAQ(id),

  // Announcements
  getAnnouncements: (params) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    if (params?.status) query.append('status', params.status);
    return api.get(`/admin/announcements${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getAnnouncementsList: (params) => adminAPI.getAnnouncements(params),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  addAnnouncement: (data) => adminAPI.createAnnouncement(data),
  updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
  editAnnouncement: (id, data) => adminAPI.updateAnnouncement(id, data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
  removeAnnouncement: (id) => adminAPI.deleteAnnouncement(id),

  // Knowledge Base
  getKnowledgeBase: (params) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    if (params?.tag) query.append('tag', params.tag);
    return api.get(`/admin/knowledge-base${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getHelpArticles: (params) => adminAPI.getKnowledgeBase(params),
  createKnowledgeArticle: (data) => api.post('/admin/knowledge-base', data),
  addKnowledgeArticle: (data) => adminAPI.createKnowledgeArticle(data),
  updateKnowledgeArticle: (id, data) => api.put(`/admin/knowledge-base/${id}`, data),
  editKnowledgeArticle: (id, data) => adminAPI.updateKnowledgeArticle(id, data),
  deleteKnowledgeArticle: (id) => api.delete(`/admin/knowledge-base/${id}`),
  removeKnowledgeArticle: (id) => adminAPI.deleteKnowledgeArticle(id),

  // FAQ Feedback
  getFAQFeedback: (faqId) => api.get(`/admin/faqs/${faqId}/feedback`),
  getFAQStats: (faqId) => api.get(`/admin/faqs/${faqId}/stats`),

  // =========================================================================
  // PAYMENT MANAGEMENT
  // =========================================================================

  getPayments: (params) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    if (params?.status) query.append('status', params.status);
    if (params?.method) query.append('method', params.method);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    return api.get(`/admin/payments${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getPayouts: (params) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    return api.get(`/admin/payouts${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getPaymentOverview: () => api.get('/admin/payments/overview'),
  getRevenueByMethod: () => api.get('/admin/payments/revenue-by-method'),
  getPaymentTrends: (params) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    return api.get(`/admin/payments/trends${query.toString() ? `?${query.toString()}` : ''}`);
  },
  refundPayment: (id, data) => api.post(`/admin/payments/${id}/refund`, data),
  getPaymentDetails: (id) => api.get(`/admin/payments/${id}`),
  updatePaymentStatus: (id, status) => api.put(`/admin/payments/${id}/status`, { status }),
  getProviderPayoutSummary: (providerId) => api.get(`/admin/payouts/provider/${providerId}`),
  processBulkPayouts: (data) => api.post('/admin/payouts/bulk', data),

  // =========================================================================
  // SETTINGS
  // =========================================================================

  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getPlatformSettings: () => api.get('/admin/settings'),
  updatePlatformSettings: (data) => api.put('/admin/settings', data),

  // =========================================================================
  // REPORTS & ANALYTICS
  // =========================================================================

  getReports: (params) => api.get('/admin/reports', { params }),
  getAnalyticsOverview: (params) => api.get('/admin/analytics/overview', { params }),

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================

  getNotifications: () => api.get('/admin/notifications'),
  markAllRead: () => api.put('/admin/notifications/read-all'),

  // =========================================================================
  // ACTIVITY LOG
  // =========================================================================

  getActivityLog: (params) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page);
    if (params?.limit) query.append('limit', params.limit);
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.userId) query.append('userId', params.userId);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    return api.get(`/admin/activities${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getAuditLogs: (params) => adminAPI.getActivityLog(params),
  getActivities: (params) => adminAPI.getActivityLog(params),
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