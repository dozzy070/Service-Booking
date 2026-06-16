// middleware/errorHandler.js

// =========================================================================
// CUSTOM ERROR CLASSES
// =========================================================================

export class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// =========================================================================
// ERROR HANDLER MIDDLEWARE
// =========================================================================

export const errorHandler = (err, req, res, next) => {
  // Log error with details
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  let error = { ...err };
  error.message = err.message;

  // ============================================================
  // DATABASE ERRORS (PostgreSQL)
  // ============================================================

  // Duplicate key violation (unique constraint)
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    const message = `Duplicate value for ${field}. Please use a different value.`;
    error = new AppError(message, 400, 'DUPLICATE_ENTRY', { field, detail: err.detail });
  }

  // Foreign key violation
  if (err.code === '23503') {
    const message = 'Related record not found or cannot be deleted.';
    error = new AppError(message, 404, 'FOREIGN_KEY_VIOLATION', { detail: err.detail });
  }

  // Not null violation
  if (err.code === '23502') {
    const field = err.column || 'field';
    const message = `${field} is required.`;
    error = new AppError(message, 400, 'REQUIRED_FIELD', { field });
  }

  // Invalid input syntax (e.g., invalid UUID)
  if (err.code === '22P02') {
    const message = 'Invalid input format.';
    error = new AppError(message, 400, 'INVALID_INPUT', { detail: err.message });
  }

  // ============================================================
  // AUTHENTICATION & AUTHORIZATION ERRORS
  // ============================================================

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please login again.', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please login again.', 401, 'TOKEN_EXPIRED');
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    error = new AppError('Authentication required.', 401, 'UNAUTHORIZED');
  }

  // ============================================================
  // VALIDATION ERRORS (express-validator, Joi, etc.)
  // ============================================================

  if (err.name === 'ValidationError') {
    const details = err.errors || err.details || err.array?.() || null;
    error = new AppError(
      'Validation failed. Please check your input.',
      400,
      'VALIDATION_ERROR',
      details
    );
  }

  if (err.name === 'ValidatorError' || err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message);
    error = new AppError(
      messages.join(', ') || 'Validation failed.',
      400,
      'VALIDATION_ERROR',
      err.errors
    );
  }

  // ============================================================
  // RATE LIMITING ERRORS
  // ============================================================

  if (err.name === 'RateLimitError' || err.code === 'RATE_LIMIT') {
    error = new RateLimitError(err.message || 'Too many requests. Please try again later.');
  }

  // ============================================================
  // FILE UPLOAD ERRORS (Multer)
  // ============================================================

  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large. Maximum size is 5MB.', 400, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected file field.', 400, 'UNEXPECTED_FILE');
  }

  if (err.name === 'MulterError') {
    error = new AppError(err.message || 'File upload error.', 400, 'UPLOAD_ERROR');
  }

  // ============================================================
  // CUSTOM APP ERRORS
  // ============================================================

  // Check if it's already our custom AppError
  if (err.isOperational) {
    error = err;
  }

  // ============================================================
  // UNKNOWN ERRORS
  // ============================================================

  // If error doesn't have a status code, it's a server error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.code = 'INTERNAL_SERVER_ERROR';
    error.message = 'Something went wrong. Please try again later.';
  }

  // ============================================================
  // RESPONSE
  // ============================================================

  const response = {
    success: false,
    message: error.message || 'Server Error',
    code: error.code || 'UNKNOWN_ERROR'
  };

  // Add details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.fullError = err;
  }

  // Log the error (including stack trace)
  console.error('❌ Error Response:', {
    statusCode: error.statusCode,
    code: error.code,
    message: error.message,
    path: req.path,
    method: req.method
  });

  res.status(error.statusCode || 500).json(response);
};

// =========================================================================
// NOT FOUND HANDLER
// =========================================================================

export const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// =========================================================================
// ASYNC WRAPPER - Catch errors in async route handlers
// =========================================================================

export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// =========================================================================
// DATABASE CONNECTION ERROR HANDLER
// =========================================================================

export const handleDatabaseConnection = (err) => {
  console.error('❌ Database connection error:', err.message);
  // You could add retry logic here
  process.exit(1);
};

// =========================================================================
// UNHANDLED REJECTION HANDLER
// =========================================================================

export const handleUnhandledRejection = (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the server in production, but log the error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
};

// =========================================================================
// UNCAUGHT EXCEPTION HANDLER
// =========================================================================

export const handleUncaughtException = (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Log the error and exit gracefully
  console.error('Stack:', error.stack);
  process.exit(1);
};

// Export all handlers
export default {
  errorHandler,
  notFound,
  catchAsync,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleDatabaseConnection,
  handleUnhandledRejection,
  handleUncaughtException
};