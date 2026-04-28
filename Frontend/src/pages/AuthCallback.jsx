// src/pages/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
        return;
      }

      if (token) {
        try {
          // Store the token manually since Google auth bypasses normal login
          localStorage.setItem('token', token);

          // Fetch user profile to get user data
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            const redirectTo = userData.role === 'admin' ? '/admin/dashboard' :
                             userData.role === 'provider' ? '/provider/dashboard' :
                             '/customer/dashboard';

            navigate(redirectTo, { replace: true });
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } catch (err) {
          console.error('Callback error:', err);
          navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
        }
      } else {
        navigate('/login', { state: { error: 'No authentication token received.' } });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <Spinner animation="border" variant="primary" className="mb-3" />
        <h4>Completing sign in...</h4>
        <p className="text-muted">Please wait while we redirect you.</p>
      </div>
    </Container>
  );
};

export default AuthCallback;