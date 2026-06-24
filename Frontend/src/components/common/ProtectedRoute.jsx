// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Debug logging - remove in production
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 ProtectedRoute Debug:', {
      user,
      userRole: user?.role,
      allowedRoles,
      isAuthenticated,
      loading,
      path: location.pathname
    });
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If no user or not authenticated, redirect to login
  if (!user || !isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified and user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized page
    return <Navigate to="/401" replace />;
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;