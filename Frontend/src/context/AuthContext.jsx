// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create the context
const AuthContext = createContext(null);

// Custom hook - MUST be named useAuth and exported as a named export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component - MUST be exported as a named export
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Get dashboard route based on user role
  const getDashboardRoute = (userRole) => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'provider':
        return '/provider/dashboard';
      case 'customer':
        return '/customer/dashboard';
      default:
        return '/';
    }
  };

  // Set axios default header for all requests
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch user profile when token exists
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching user profile...');
        
        const response = await api.get('/auth/profile');
        console.log('✅ User profile fetched:', response.data);
        setUser(response.data);
      } catch (error) {
        console.error('❌ Error fetching user:', error.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, ...userData } = response.data;
      
      console.log('✅ Login successful for:', userData.email);
      console.log('👤 User role:', userData.role);
      
      // Save token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}!`);
      
      // Return user data so the component can handle navigation
      return { 
        success: true, 
        data: userData,
        redirectTo: getDashboardRoute(userData.role)
      };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      
      let message = 'Login failed';
      if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if backend is running.';
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      
      const response = await api.post('/auth/register', userData);
      const newUser = response.data;
      
      console.log('✅ Registration successful for:', newUser.email);
      
      toast.success('Registration successful! Please login to continue.');
      
      // Return redirect to login
      return { 
        success: true, 
        data: newUser,
        redirectTo: '/login'
      };
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      
      let message = 'Registration failed';
      if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check if backend is running.';
      } else if (error.response?.status === 400) {
        message = error.response.data.message || 'Invalid registration data';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    toast.success('Profile updated');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    token,
    getDashboardRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;