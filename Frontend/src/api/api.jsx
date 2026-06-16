// api.js
import axios from 'axios';

// ==================== CONFIGURATION ====================
const getAPIUrl = () => {
  // Priority 1: Environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Current host (same origin for production)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // Priority 3: Production fallback (Render.com)
  if (import.meta.env.PROD) {
    return 'https://service-booking-3l1j.onrender.com';
  }
  
  // Priority 4: Local development
  return 'http://localhost:5000';
};

const BASE_URL = getAPIUrl();
const API_URL = `${BASE_URL}/api`;

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('🔧 API URL:', API_URL);
  console.log('🔧 Base URL:', BASE_URL);
  console.log('🔧 Environment:', {
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    mode: import.meta.env.MODE
  });
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
  timeout: 30000, // 30 second timeout
});

// ==================== INTERCEPTORS ====================
// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      console.error(`❌ API Error ${status}:`, data?.message || error.message);
      
      // Handle authentication errors
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Handle server errors
      if (status === 500) {
        console.error('Server error:', data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('🌐 Network Error:', error.message);
      console.error('No response received from server. Check if backend is running.');
    } else {
      // Something else happened
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ==================== UTILITY FUNCTIONS ====================
// Health check function to test backend connection
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ Backend health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
};

// Get API info
export const getAPIInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}/info`);
    console.log('📡 API Info:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get API info:', error.message);
    return null;
  }
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
    window.location.href = `${API_URL}/auth/google`;
  },
};

// ==================== PROVIDER API ====================
export const providerAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/provider/dashboard/stats'),
  getRecentBookings: () => api.get('/provider/dashboard/recent-bookings'),
  getTodaySchedule: () => api.get('/provider/dashboard/today-schedule'),
  getStats: () => api.get('/provider/stats'),
  
  // Bookings
  getBookings: () => api.get('/provider/bookings'),
  getBookingById: (id) => api.get(`/provider/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/provider/bookings/${id}/status`, { status }),
  completeBooking: (id) => api.put(`/provider/bookings/${id}/complete`),
  startBooking: (id) => api.post(`/provider/bookings/${id}/start`),
  rescheduleBooking: (id, newDate) => api.put(`/provider/bookings/${id}/reschedule`, { new_date: newDate }),
  
  // Services
  getServices: () => api.get('/provider/services'),
  getServiceById: (id) => api.get(`/provider/services/${id}`),
  createService: (data) => api.post('/provider/services', data),
  updateService: (id, data) => api.put(`/provider/services/${id}`, data),
  deleteService: (id) => api.delete(`/provider/services/${id}`),
  
  // Reviews
  getReviews: () => api.get('/provider/reviews'),
  respondToReview: (id, response) => api.post(`/provider/reviews/${id}/respond`, { response }),
  
  // Wallet/Earnings
  getWallet: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
  withdrawFunds: (amount, methodId) => api.post('/wallet/withdraw', { amount, withdrawalMethodId: methodId }),
  addFunds: (amount, methodId) => api.post('/wallet/add-funds', { amount, paymentMethodId: methodId }),
  getRewards: () => api.get('/wallet/rewards'),
  redeemReward: (rewardId) => api.post('/wallet/redeem', { rewardId }),
  getRedeemHistory: () => api.get('/wallet/redeem-history'),
  getPaymentMethods: () => api.get('/wallet/payment-methods'),
  getWithdrawalMethods: () => api.get('/wallet/withdrawal-methods'),
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
  getCategories: () => api.get('/services/categories'),
  
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
  addReview: (serviceId, data) => api.post(`/services/${serviceId}/reviews`, data),
  
  // Favorites
  getFavorites: () => api.get('/customer/favorites'),
  toggleFavorite: (serviceId) => api.post(`/services/${serviceId}/favorite`),
  isFavorite: (serviceId) => api.get(`/services/${serviceId}/is-favorite`),
  
  // Payment
  getPaymentMethods: () => api.get('/customer/payment-methods'),
  addPaymentMethod: (data) => api.post('/customer/payment-methods', data),
  setDefaultPaymentMethod: (id) => api.put(`/customer/payment-methods/${id}/default`),
  deletePaymentMethod: (id) => api.delete(`/customer/payment-methods/${id}`),
  getPaymentSummary: () => api.get('/customer/payment-summary'),
  confirmPayment: (data) => api.post('/payments/confirm', data),
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
  
  // User Management
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  verifyUser: (id) => api.put(`/admin/users/${id}/verify`),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  
  // Provider Management
  getProviders: () => api.get('/admin/providers'),
  
  // Service Management
  getServices: () => api.get('/admin/services'),
  getServiceById: (id) => api.get(`/admin/services/${id}`),
  approveService: (id) => api.put(`/admin/services/${id}/approve`),
  rejectService: (id) => api.put(`/admin/services/${id}/reject`),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  
  // Booking Management
  getBookings: () => api.get('/admin/bookings'),
  getBookingById: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
  
  // Category Management
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // Reports
  getReports: (params) => api.get('/admin/reports', { params }),
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
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

// Export the base api instance for custom requests
export default api;