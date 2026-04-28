



// Add this at the very top of App.jsx or main.jsx
const cleanStoredToken = () => {
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
};
cleanStoredToken();import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);