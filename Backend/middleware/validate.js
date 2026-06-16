// middleware/validate.js
import { validationResult, matchedData } from 'express-validator';

// =========================================================================
// BASIC VALIDATION
// =========================================================================

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for better readability
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }
  next();
};

// =========================================================================
// VALIDATE WITH SANITIZED DATA
// =========================================================================

export const validateAndSanitize = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
      location: err.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }

  // Get sanitized data (only validated fields)
  req.sanitizedData = matchedData(req);
  next();
};

// =========================================================================
// VALIDATE WITH CUSTOM ERROR FORMATTER
// =========================================================================

export const validateWithFormatter = (formatter) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = formatter(errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: formattedErrors
      });
    }
    next();
  };
};

// =========================================================================
// VALIDATE AND CHECK FOR EMPTY FIELDS
// =========================================================================

export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of fields) {
      const value = req.body[field] || req.query[field] || req.params[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS',
        fields: missingFields
      });
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE DATA TYPES
// =========================================================================

export const validateTypes = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const data = { ...req.body, ...req.query, ...req.params };
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }
      
      if (value === undefined || value === null) continue;
      
      if (rules.type) {
        const type = typeof value;
        if (type !== rules.type) {
          errors.push({ field, message: `${field} must be a ${rules.type}` });
        }
      }
      
      if (rules.min !== undefined && value < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}` });
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push({ field, message: `${field} must be at most ${rules.max}` });
      }
      
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors
      });
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE ID (UUID or Number)
// =========================================================================

export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required`,
        code: 'ID_REQUIRED'
      });
    }
    
    // Check if it's a valid UUID or number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isNumber = /^\d+$/.test(id);
    
    if (!isUUID && !isNumber) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        code: 'INVALID_ID'
      });
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE EMAIL
// =========================================================================

export const validateEmail = (field = 'email') => {
  return (req, res, next) => {
    const email = req.body[field];
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        code: 'EMAIL_REQUIRED'
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE PHONE NUMBER (Nigeria format)
// =========================================================================

export const validatePhone = (field = 'phone') => {
  return (req, res, next) => {
    const phone = req.body[field];
    
    if (!phone) {
      // Phone is optional, so skip if not provided
      return next();
    }
    
    // Nigerian phone number formats: 08012345678, 08123456789, 09012345678, +2348012345678, 2348012345678
    const phoneRegex = /^(\+?234|0)([7-9][01]|[8-9][0-9])\d{7}$/;
    
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use Nigerian format (e.g., 08012345678)',
        code: 'INVALID_PHONE'
      });
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE PASSWORD STRENGTH
// =========================================================================

export const validatePasswordStrength = (field = 'password') => {
  return (req, res, next) => {
    const password = req.body[field];
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        code: 'PASSWORD_REQUIRED'
      });
    }
    
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be at most 128 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password strength validation failed',
        code: 'WEAK_PASSWORD',
        errors
      });
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE DATE RANGE
// =========================================================================

export const validateDateRange = (startField = 'startDate', endField = 'endDate') => {
  return (req, res, next) => {
    const start = req.query[startField] || req.body[startField];
    const end = req.query[endField] || req.body[endField];
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format',
          code: 'INVALID_DATE'
        });
      }
      
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }
    
    next();
  };
};

// =========================================================================
// VALIDATE PAGINATION
// =========================================================================

export const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;
  
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be at least 1',
      code: 'INVALID_PAGE'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100',
      code: 'INVALID_LIMIT'
    });
  }
  
  req.pagination = { page, limit };
  next();
};

// =========================================================================
// VALIDATE SORTING
// =========================================================================

export const validateSorting = (allowedFields) => {
  return (req, res, next) => {
    let { sortBy, sortOrder } = req.query;
    
    sortBy = sortBy || 'created_at';
    sortOrder = sortOrder || 'DESC';
    
    if (allowedFields && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed: ${allowedFields.join(', ')}`,
        code: 'INVALID_SORT_FIELD'
      });
    }
    
    if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Sort order must be ASC or DESC',
        code: 'INVALID_SORT_ORDER'
      });
    }
    
    req.sorting = { sortBy, sortOrder: sortOrder.toUpperCase() };
    next();
  };
};

export default {
  validate,
  validateAndSanitize,
  validateWithFormatter,
  validateRequired,
  validateTypes,
  validateId,
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateDateRange,
  validatePagination,
  validateSorting
};