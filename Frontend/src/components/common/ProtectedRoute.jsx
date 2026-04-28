import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();

  console.log('🔒 ProtectedRoute - User:', user);
  console.log('🔒 ProtectedRoute - Allowed roles:', allowedRoles);
  console.log('🔒 ProtectedRoute - Current path:', window.location.pathname);

  // Show nothing while checking authentication
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

  // If no user, redirect to login
  if (!user) {
    console.log('🔒 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('🔒 Role not allowed, redirecting to 401');
    return <Navigate to="/401" replace />;
  }

  // User is authenticated and authorized
  console.log('🔒 Access granted');
  return children;
};

export default ProtectedRoute;