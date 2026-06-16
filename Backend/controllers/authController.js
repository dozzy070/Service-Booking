// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import pool from '../config/db.js';
import { 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendVerificationEmail,
  sendLoginNotificationEmail,
  sendEmail
} from '../services/emailService.js';

// =========================================================================
// TOKEN GENERATION
// =========================================================================

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '30d'
  });
};

export { generateToken, generateRefreshToken };

// =========================================================================
// REGISTER
// =========================================================================

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone, address, city, state } = req.body;

    console.log(`🔍 Register attempt for email: ${email}`);

    // Check if user exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      console.log('❌ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      phone,
      address,
      city,
      state
    });

    console.log('✅ User created successfully');

    // Send immediate response
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Registration successful. Please login to continue.'
    });

    // Handle post-registration tasks asynchronously
    (async () => {
      try {
        // Create notification preferences
        await pool.query(
          'INSERT INTO notification_preferences (user_id) VALUES ($1)',
          [user.id]
        );
        console.log('✅ Notification preferences created for:', user.email);
      } catch (err) {
        if (!err.message.includes('duplicate key')) {
          console.error('❌ Failed to create notification preferences:', err.message);
        }
      }

      try {
        // Create wallet
        await pool.query(
          `INSERT INTO wallets (user_id, balance, points, tier, lifetime_earnings)
           VALUES ($1, 0, 0, 'Bronze', 0)`,
          [user.id]
        );
        console.log('✅ Wallet created for:', user.email);
      } catch (err) {
        console.error('❌ Failed to create wallet:', err.message);
      }

      try {
        // Send welcome email
        await sendWelcomeEmail(user);
        console.log('✅ Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError.message);
        // Don't fail registration if email fails
      }
    })();

  } catch (error) {
    console.error('❌ Registration error:', error.message);
    
    if (error.message.includes('Connection terminated')) {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// LOGIN
// =========================================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log(`🔍 Login attempt for email: ${email}`);

    // Check database connection first
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError.message);
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.',
        error: 'Database unavailable'
      });
    }

    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.is_active === false) {
      console.log('❌ User account is deactivated');
      return res.status(403).json({ message: 'Account is deactivated. Please contact support.' });
    }

    console.log('✅ User found, verifying password...');
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password verified, generating token...');

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login and refresh token
    try {
      await pool.query(
        `UPDATE users SET 
          last_login = NOW(),
          refresh_token = $1 
        WHERE id = $2`,
        [refreshToken, user.id]
      );
    } catch (err) {
      console.error('⚠️ Failed to update user:', err.message);
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      verified: user.verified,
      is_active: user.is_active
    };

    console.log(`✅ Login successful for: ${email}`);

    res.json({
      ...userResponse,
      token,
      refreshToken
    });

    // Send login notification email in the background
    setTimeout(() => {
      // Get IP and user agent for login notification
      const loginData = {
        ip: req.ip || req.connection?.remoteAddress || 'Unknown IP',
        device: req.headers['user-agent'] || 'Unknown Device',
        location: req.headers['x-forwarded-for'] || req.ip || 'Unknown Location',
        time: new Date().toLocaleString()
      };
      
      sendLoginNotificationEmail(user, loginData)
        .then(() => {
          console.log('✅ Login notification email sent to:', user.email);
        })
        .catch((emailError) => {
          console.error('⚠️ Failed to send login notification email:', emailError.message);
        });
    }, 100);

  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
      return res.status(503).json({ 
        message: 'Database connection error. Please verify your database settings.',
        error: 'Database connection failed'
      });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({ 
        message: 'Request timeout. Please try again.',
        error: 'Timeout'
      });
    }
    
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// =========================================================================
// GET PROFILE
// =========================================================================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get additional stats
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE customer_id = $1) as total_bookings,
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as total_favorites,
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) as total_reviews
    `, [req.user.id]);

    res.json({
      ...user,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error.message);
    
    if (error.message.includes('Connection terminated')) {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.' 
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// UPDATE PROFILE
// =========================================================================

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, zip_code, bio, avatar } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (zip_code !== undefined) updates.zip_code = zip_code;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.update(req.user.id, updates);
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('❌ Update profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// CHANGE PASSWORD
// =========================================================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// FORGOT PASSWORD
// =========================================================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // For security, don't reveal that email doesn't exist
      return res.status(200).json({ message: 'If that email is registered, you will receive a reset link.' });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token and expiry in DB
    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Generate reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    try {
      // Send password reset email using the dedicated function
      await sendPasswordResetEmail(user, resetLink);
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Failed to send password reset email:', emailError.message);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    res.status(200).json({ message: 'Reset link sent to your email.' });
  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// RESET PASSWORD
// =========================================================================

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find user with valid token
    const userResult = await pool.query(
      `SELECT id FROM users
       WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = userResult.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users SET
       password = $1,
       reset_password_token = NULL,
       reset_password_expires = NULL,
       updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    console.log('✅ Password reset successful for user:', user.id);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// VERIFY EMAIL
// =========================================================================

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const result = await pool.query(
      'UPDATE users SET verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    console.log('✅ Email verified for user:', result.rows[0].id);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ Verify email error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// RESEND VERIFICATION EMAIL
// =========================================================================

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await pool.query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [verificationToken, user.id]
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await sendVerificationEmail(user, verificationLink);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('❌ Resend verification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// REFRESH TOKEN
// =========================================================================

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    
    const user = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const token = generateToken(user.rows[0].id, user.rows[0].role);
    const newRefreshToken = generateRefreshToken(user.rows[0].id);

    // Update refresh token
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.rows[0].id]
    );

    res.json({ 
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('❌ Refresh token error:', error.message);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// =========================================================================
// LOGOUT
// =========================================================================

export const logout = async (req, res) => {
  try {
    // Clear refresh token
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.id]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// DELETE ACCOUNT
// =========================================================================

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has active bookings
    const activeBookings = await pool.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE (customer_id = $1 OR provider_id = $1) 
         AND status NOT IN ('completed', 'cancelled')`,
      [userId]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot deactivate account with active bookings' 
      });
    }

    // Soft delete - deactivate account
    await pool.query(
      'UPDATE users SET is_active = false, deleted_at = NOW() WHERE id = $1',
      [userId]
    );

    // Clear refresh token
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('❌ Delete account error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// GOOGLE AUTH CALLBACK
// =========================================================================

export const googleAuthCallback = async (req, res) => {
  try {
    // This is handled by passport
    const token = generateToken(req.user.id, req.user.role);
    const refreshToken = generateRefreshToken(req.user.id);
    
    await pool.query(
      'UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2',
      [refreshToken, req.user.id]
    );
    
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    console.error('❌ Google auth callback error:', error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }
};

// =========================================================================
// GET USER STATS
// =========================================================================

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE customer_id = $1) as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE customer_id = $1 AND status = 'completed') as completed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE customer_id = $1 AND status = 'pending') as pending_bookings,
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as total_favorites,
        (SELECT COUNT(*) FROM reviews WHERE user_id = $1) as total_reviews,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE user_id = $1) as average_rating
    `, [userId]);

    // Get wallet balance
    const wallet = await pool.query(
      'SELECT balance, points, tier FROM wallets WHERE user_id = $1',
      [userId]
    );

    res.json({
      bookings: stats.rows[0],
      wallet: wallet.rows[0] || { balance: 0, points: 0, tier: 'Bronze' }
    });
  } catch (error) {
    console.error('❌ Get user stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================================================================
// EXPORTS
// =========================================================================

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  logout,
  deleteAccount,
  googleAuthCallback,
  getUserStats,
  generateToken,
  generateRefreshToken
};