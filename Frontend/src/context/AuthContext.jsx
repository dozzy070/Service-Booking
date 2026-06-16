// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; // Import the shared api instance
import { socketService } from './SocketContext'; // Import socket service

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
    } else {
      delete api.defaults.headers.common['Authorization'];
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
        
        // Connect socket after user is loaded
        if (response.data && token) {
          console.log('🔌 Connecting socket for user:', response.data.id);
          socketService.connect(token, response.data.id);
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error.message);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        socketService.disconnect();
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      // Ensure socket is disconnected if no token
      socketService.disconnect();
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
      
      // Connect socket after successful login
      console.log('🔌 Connecting socket for user:', userData.id);
      socketService.connect(newToken, userData.id);
      
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
      
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
    
    // Disconnect socket first
    socketService.disconnect();
    console.log('🔌 Socket disconnected on logout');
    
    // Clear local storage and state
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data) => {
    try {
      console.log('📝 Updating profile...');
      const response = await api.put('/auth/profile', data);
      setUser(prev => ({ ...prev, ...response.data }));
      toast.success('Profile updated successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const changePassword = async (data) => {
    try {
      console.log('🔐 Changing password...');
      const response = await api.put('/auth/change-password', data);
      toast.success('Password changed successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      console.log('📧 Sending password reset email...');
      const response = await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email sent! Check your inbox.');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      console.log('🔐 Resetting password...');
      const response = await api.post('/auth/reset-password', { token: resetToken, password });
      toast.success('Password reset successfully! Please login.');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
      return { success: false, error: error.response?.data?.message };
    }
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
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
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