// middleware/auth.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// =========================================================================
// PROTECT MIDDLEWARE - Verify JWT Token
// =========================================================================

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies (optional)
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ 
      message: 'Not authorized, no token',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Get user from database
    const userRes = await pool.query(
      `SELECT id, name, email, role, avatar, phone, verified, is_active, last_seen 
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userRes.rows[0];

    // Check if user is active
    if (user.is_active === false) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      verified: user.verified,
      is_active: user.is_active,
      last_seen: user.last_seen
    };

    // Update last seen timestamp (async, don't wait)
    pool.query(
      'UPDATE users SET last_seen = NOW() WHERE id = $1',
      [user.id]
    ).catch(err => console.error('Error updating last_seen:', err));

    next();
  } catch (error) {
    console.error('Auth error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({ 
      message: 'Not authorized, token failed',
      code: 'AUTH_FAILED'
    });
  }
};

// =========================================================================
// OPTIONAL AUTH MIDDLEWARE - Try to authenticate but continue if not
// =========================================================================

export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const userRes = await pool.query(
      `SELECT id, name, email, role, avatar, phone, verified, is_active 
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userRes.rows.length > 0 && userRes.rows[0].is_active !== false) {
      req.user = userRes.rows[0];
    }
  } catch (error) {
    // Silent fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

// =========================================================================
// AUTHORIZE MIDDLEWARE - Role-based Access Control
// =========================================================================

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authorized',
        code: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this resource`,
        code: 'FORBIDDEN',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    next();
  };
};

// =========================================================================
// VERIFY REFRESH TOKEN
// =========================================================================

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secret'
    );

    // Check if token exists in database
    const result = await pool.query(
      `SELECT id, role, is_active FROM users 
       WHERE id = $1 AND refresh_token = $2`,
      [decoded.id, refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = result.rows[0];

    if (user.is_active === false) {
      return res.status(403).json({ 
        message: 'Account is deactivated',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Refresh token verification error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({ 
      message: 'Failed to verify refresh token',
      code: 'REFRESH_TOKEN_VERIFICATION_FAILED'
    });
  }
};

// =========================================================================
// RATE LIMIT MIDDLEWARE (per user)
// =========================================================================

// Store rate limit data in memory (use Redis in production)
const rateLimitStore = new Map();

export const rateLimit = (maxRequests, windowMs) => {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const key = `rate_limit_${userId}`;
    const now = Date.now();

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
      for (const [k, data] of rateLimitStore) {
        if (now > data.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    const data = rateLimitStore.get(key);

    if (now > data.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    data.count++;

    if (data.count > maxRequests) {
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }

    rateLimitStore.set(key, data);
    next();
  };
};

// =========================================================================
// VERIFY EMAIL MIDDLEWARE
// =========================================================================

export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({
      message: 'Please verify your email address to access this resource',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// =========================================================================
// VERIFY ACCOUNT ACTIVE MIDDLEWARE
// =========================================================================

export const requireActiveAccount = (req, res, next) => {
  if (req.user.is_active === false) {
    return res.status(403).json({
      message: 'Account is deactivated. Please contact support.',
      code: 'ACCOUNT_INACTIVE'
    });
  }
  next();
};

// =========================================================================
// LOG ACTIVITY MIDDLEWARE
// =========================================================================

export const logActivity = (actionType, getDetails) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    // Override json method to log after response
    res.json = function(data) {
      // Log activity in background (don't wait)
      try {
        const userId = req.user?.id;
        const userRole = req.user?.role || 'guest';
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const details = getDetails ? getDetails(req, data) : { status: res.statusCode };

        pool.query(
          `INSERT INTO activity_logs (user_id, user_role, action, type, details, ip, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [userId, userRole, req.method + ' ' + req.path, actionType, JSON.stringify(details), ip]
        ).catch(err => console.error('Error logging activity:', err));
      } catch (error) {
        console.error('Activity log error:', error);
      }

      originalJson.call(this, data);
    };

    next();
  };
};

// Export all middleware as default
export default {
  protect,
  optionalAuth,
  authorize,
  verifyRefreshToken,
  rateLimit,
  requireVerifiedEmail,
  requireActiveAccount,
  logActivity
};