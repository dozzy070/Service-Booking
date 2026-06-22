import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import './index.css';

// ✅ Clean any malformed tokens on startup
const cleanStoredToken = () => {
  try {
    let token = localStorage.getItem('token');
    if (token) {
      // Remove any "Bearer " prefix and extra whitespace
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      if (cleanToken !== token) {
        console.log('🧹 Cleaned malformed token');
        localStorage.setItem('token', cleanToken);
      }
      // Also validate it's a real JWT (starts with eyJ)
      if (!cleanToken.startsWith('eyJ')) {
        console.warn('⚠️ Invalid token format, removing it');
        localStorage.removeItem('token');
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning token:', error);
  }
};

// ✅ Check API health on startup
const checkAPIHealth = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://service-booking-3l1j.onrender.com/api';
    const healthUrl = apiUrl.replace('/api', '/health');
    
    console.log('🔍 Checking API health at:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Short timeout so it doesn't hang
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend API is online:', data);
      return true;
    }
    console.log('❌ Backend API returned error:', response.status);
    return false;
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error('❌ API health check timed out');
    } else {
      console.error('❌ Cannot reach backend API:', error.message);
    }
    return false;
  }
};

// Clean token and check API on app start
cleanStoredToken();

// Also check API health after token cleanup
checkAPIHealth().then(isOnline => {
  if (!isOnline) {
    console.warn('⚠️ Backend API appears to be offline. Some features may not work.');
  }
});

// Add global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('⚠️ Unhandled Promise Rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);