import axios from 'axios';

// Get API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL || 'https://service-booking-3l1j.onrender.com';

// Log the API URL in development for debugging
if (import.meta.env.DEV) {
  console.log('🔧 API URL:', API_URL);
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
  timeout: 30000, // 30 second timeout
});

// Request interceptor for adding auth token
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
        if (!window.location.pathname.includes('/login')) {
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

// Health check function to test backend connection
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`, {
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
    const response = await axios.get(`${API_URL}/api/info`);
    console.log('📡 API Info:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get API info:', error.message);
    return null;
  }
};

export default api;