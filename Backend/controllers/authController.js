import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import pool from '../config/db.js';
import { sendWelcomeEmail, sendLoginNotificationEmail, sendEmail } from '../config/email.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '7d'
  });
};

export { generateToken, generateRefreshToken };

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

    console.log('✅ User found, verifying password...');
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password verified, generating token...');

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database (optional)
    try {
      await pool.query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, user.id]
      );
    } catch (err) {
      console.error('⚠️ Failed to store refresh token:', err.message);
      // Continue even if this fails - it's not critical
    }

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      verified: user.verified
    };

    console.log(`✅ Login successful for: ${email}`);

    // Send login notification email
    try {
      await sendLoginNotificationEmail(user);
      console.log('✅ Login notification email sent to:', user.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send login notification email:', emailError.message);
      // Don't fail login if email fails
    }

    res.json({
      ...userResponse,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('Stack:', error.stack);
    
    // Specific error messages based on error type
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

// ... rest of your auth controller functions

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone } = req.body;

    console.log(`🔍 Register attempt for email: ${email}`);

    const userExists = await User.findByEmail(email);
    if (userExists) {
      console.log('❌ User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone
    });

    console.log('✅ User created successfully');

    // Send immediate response to client
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Registration successful. Please login to continue.'
    });

    // Handle post-registration tasks asynchronously (don't await)
    // This prevents timeout issues and keeps response fast
    (async () => {
      try {
        // Create notification preference
        await pool.query(
          'INSERT INTO notification_preferences (user_id) VALUES ($1)',
          [user.id]
        );
        console.log('✅ Notification preferences created for:', user.email);
      } catch (err) {
        if (!err.message.includes('duplicate key')) {
          console.error('❌ Failed to create notification preferences:', err.message);
        } else {
          console.log('ℹ️ Notification preferences already exist for:', user.email);
        }
      }

      try {
        // Send welcome email
        await sendWelcomeEmail(user);
        console.log('✅ Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send welcome email:', emailError.message);
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

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
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

// ... rest of the controller functions remain the same with added error handling

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;

    const user = await User.update(req.user.id, updates);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
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

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`
      });

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
       reset_password_expires = NULL
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

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      'UPDATE users SET verified = true WHERE verification_token = $1 RETURNING id',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};