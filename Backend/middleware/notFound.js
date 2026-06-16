// middleware/notFound.js

// =========================================================================
// NOT FOUND HANDLER - 404
// =========================================================================

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  error.method = req.method;
  error.path = req.originalUrl;
  error.ip = req.ip;
  
  // Log the 404 for debugging
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  next(error);
};

// =========================================================================
// API NOT FOUND - For API routes (returns JSON response)
// =========================================================================

export const apiNotFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'API_ROUTE_NOT_FOUND',
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: {
      auth: '/api/auth',
      services: '/api/services',
      bookings: '/api/bookings',
      categories: '/api/categories',
      wallet: '/api/wallet',
      payments: '/api/payments',
      admin: '/api/admin',
      provider: '/api/provider',
      customer: '/api/customer',
      user: '/api/user',
      chat: '/api/chat',
      notifications: '/api/notifications'
    }
  });
};

// =========================================================================
// SPA NOT FOUND - For Single Page Applications (serves index.html)
// =========================================================================

export const spaNotFound = (req, res) => {
  // Only use for SPA routes (like React, Vue, Angular)
  // This should be placed before the 404 handler
  if (req.accepts('html')) {
    // Check if the request is for an API route
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`
      });
    }
    
    // Serve the index.html for SPA routes
    try {
      const path = require('path');
      const fs = require('fs');
      const indexPath = path.join(process.cwd(), 'Frontend', 'dist', 'index.html');
      
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    } catch (error) {
      console.error('Error serving SPA:', error);
    }
  }
  
  // Fallback to JSON response
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
};

// =========================================================================
// CUSTOM 404 ERROR CLASS
// =========================================================================

export class NotFoundError extends Error {
  constructor(resource = 'Resource', id = null) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message);
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    this.resource = resource;
    this.id = id;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// =========================================================================
// NOT FOUND HANDLER FOR STATIC FILES
// =========================================================================

export const staticFileNotFound = (req, res, next) => {
  // Check if the request is for a static file
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticExtensions.some(ext => req.path.endsWith(ext));
  
  if (isStaticFile) {
    res.status(404).send('File not found');
    return;
  }
  
  next();
};

export default {
  notFound,
  apiNotFound,
  spaNotFound,
  staticFileNotFound,
  NotFoundError
};