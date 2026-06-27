// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { checkBackendHealth } from './api/api';

// ============================================================
// TOKEN CLEANUP
// ============================================================

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
        localStorage.removeItem('user');
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning token:', error);
  }
};

// ============================================================
// BACKEND HEALTH CHECK WITH RETRY LOGIC (SIMPLIFIED)
// ============================================================

const checkBackendWithRetry = async (maxRetries = 3, delay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Health check attempt ${attempt}/${maxRetries}...`);
      
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        console.log('✅ Backend API is healthy');
        return true;
      }
      
      console.log(`⚠️ Health check attempt ${attempt} failed`);
    } catch (error) {
      // Skip logging for abort errors (timeouts)
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log(`⏰ Health check attempt ${attempt} timed out`);
      } else {
        console.error(`❌ Health check attempt ${attempt} failed:`, error.message);
      }
    }
    
    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      console.log(`⏳ Waiting ${delay/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.warn('⚠️ Backend API appears to be offline. Some features may not work.');
  return false;
};

// ============================================================
// RENDER APP
// ============================================================

const renderApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <SocketProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
            }}
          />
          <App />
        </SocketProvider>
      </AuthProvider>
    </React.StrictMode>
  );
};

// ============================================================
// INITIALIZE APP
// ============================================================

console.log('🚀 Initializing application...');

// 1. Clean any malformed tokens
cleanStoredToken();

// 2. Check API health in the background (non-blocking)
// Don't await this - let it run in the background
checkBackendWithRetry(2, 3000)
  .then((isHealthy) => {
    if (!isHealthy) {
      console.warn('⚠️ Backend may be offline - some features may be limited');
    }
  })
  .catch(() => {});

// 3. Render the app immediately (don't wait for health checks)
renderApp();

// ============================================================
// SERVICE WORKER REGISTRATION (Optional)
// ============================================================

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // navigator.serviceWorker.register('/sw.js');
}

// ============================================================
// GLOBAL ERROR HANDLING
// ============================================================

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Ignore abort errors (they're expected)
  if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('aborted')) {
    return;
  }
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught Error:', event.error || event.message);
});

console.log('✅ App initialization complete');