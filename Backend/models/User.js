// models/User.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

class User {
  // =========================================================================
  // FIND BY EMAIL
  // =========================================================================

  static async findByEmail(email) {
    try {
      await pool.query('SELECT 1');
      
      const result = await pool.query(
        `SELECT id, name, email, password, role, avatar, phone, 
                address, city, state, zip_code, bio, verified, 
                is_active, refresh_token, last_seen, created_at 
         FROM users WHERE email = $1`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in findByEmail:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  // =========================================================================
  // FIND BY ID
  // =========================================================================

  static async findById(id) {
    try {
      await pool.query('SELECT 1');
      
      const result = await pool.query(
        `SELECT id, name, email, role, avatar, phone, address, city, state, 
                zip_code, bio, verified, is_active, last_seen, created_at 
         FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in findById:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  // =========================================================================
  // FIND BY GOOGLE ID
  // =========================================================================

  static async findByGoogleId(googleId) {
    try {
      await pool.query('SELECT 1');
      
      const result = await pool.query(
        `SELECT id, name, email, password, role, avatar, phone, 
                verified, is_active, created_at 
         FROM users WHERE google_id = $1`,
        [googleId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in findByGoogleId:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  // =========================================================================
  // FIND BY VERIFICATION TOKEN
  // =========================================================================

  static async findByVerificationToken(token) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, verified FROM users 
         WHERE verification_token = $1 AND verified = false`,
        [token]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in findByVerificationToken:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // FIND BY RESET TOKEN
  // =========================================================================

  static async findByResetToken(token) {
    try {
      const result = await pool.query(
        `SELECT id, name, email FROM users 
         WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
        [token]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in findByResetToken:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // CREATE USER
  // =========================================================================

  static async create(userData) {
    try {
      await pool.query('SELECT 1');
      
      const { 
        name, email, password, role = 'customer', phone, 
        address, city, state, zip_code, google_id, 
        verified = false, avatar = null 
      } = userData;
      
      const result = await pool.query(
        `INSERT INTO users (
          name, email, password, role, phone, address, city, state, 
          zip_code, google_id, avatar, verified, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW()) 
        RETURNING id, name, email, role, phone, address, city, state, 
                  zip_code, avatar, verified, google_id`,
        [name, email, password, role, phone, address, city, state, 
         zip_code, google_id, avatar, verified]
      );
      
      // Create wallet for user
      await pool.query(
        `INSERT INTO wallets (user_id, balance, points, tier, lifetime_earnings)
         VALUES ($1, 0, 0, 'Bronze', 0)`,
        [result.rows[0].id]
      );
      
      // Create notification preferences
      await pool.query(
        `INSERT INTO notification_preferences (user_id) VALUES ($1)`,
        [result.rows[0].id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in create:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      if (error.code === '23505') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  // =========================================================================
  // UPDATE USER
  // =========================================================================

  static async update(id, updates) {
    try {
      await pool.query('SELECT 1');
      
      const allowedUpdates = [
        'name', 'email', 'phone', 'address', 'city', 'state', 
        'zip_code', 'bio', 'avatar', 'role', 'is_active', 'verified',
        'refresh_token', 'last_seen', 'password'
      ];
      
      const fields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key) && value !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (fields.length === 0) return null;

      values.push(id);
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}, updated_at = NOW() 
        WHERE id = $${paramCount} 
        RETURNING id, name, email, role, avatar, phone, address, city, state, 
                  zip_code, bio, verified, is_active
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in update:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  // =========================================================================
  // UPDATE PASSWORD
  // =========================================================================

  static async updatePassword(id, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      const result = await pool.query(
        `UPDATE users 
         SET password = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id`,
        [hashedPassword, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in updatePassword:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // VERIFY EMAIL
  // =========================================================================

  static async verifyEmail(userId) {
    try {
      const result = await pool.query(
        `UPDATE users 
         SET verified = true, verification_token = NULL, updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, name, email, verified`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in verifyEmail:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // SET VERIFICATION TOKEN
  // =========================================================================

  static async setVerificationToken(id, token) {
    try {
      await pool.query(
        `UPDATE users 
         SET verification_token = $1, updated_at = NOW() 
         WHERE id = $2`,
        [token, id]
      );
    } catch (error) {
      console.error('❌ Error in setVerificationToken:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // SET RESET TOKEN
  // =========================================================================

  static async setResetToken(id, token) {
    try {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      await pool.query(
        `UPDATE users 
         SET reset_password_token = $1, reset_password_expires = $2, updated_at = NOW() 
         WHERE id = $3`,
        [token, expiresAt, id]
      );
    } catch (error) {
      console.error('❌ Error in setResetToken:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // CLEAR RESET TOKEN
  // =========================================================================

  static async clearResetToken(id) {
    try {
      await pool.query(
        `UPDATE users 
         SET reset_password_token = NULL, reset_password_expires = NULL, updated_at = NOW() 
         WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('❌ Error in clearResetToken:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // UPDATE REFRESH TOKEN
  // =========================================================================

  static async updateRefreshToken(id, refreshToken) {
    try {
      await pool.query(
        `UPDATE users 
         SET refresh_token = $1, updated_at = NOW() 
         WHERE id = $2`,
        [refreshToken, id]
      );
    } catch (error) {
      console.error('❌ Error in updateRefreshToken:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // GET ALL USERS
  // =========================================================================

  static async getAll(filters = {}) {
    try {
      await pool.query('SELECT 1');
      
      let query = `
        SELECT id, name, email, role, avatar, phone, address, city, state,
               verified, is_active, created_at, last_seen
        FROM users
      `;
      const values = [];
      const conditions = [];

      if (filters.role) {
        conditions.push(`role = $${values.length + 1}`);
        values.push(filters.role);
      }

      if (filters.verified !== undefined) {
        conditions.push(`verified = $${values.length + 1}`);
        values.push(filters.verified);
      }

      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${values.length + 1}`);
        values.push(filters.is_active);
      }

      if (filters.search) {
        conditions.push(`(name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 1})`);
        values.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${values.length + 1}`;
        values.push(parseInt(filters.limit));
      }

      if (filters.offset) {
        query += ` OFFSET $${values.length + 1}`;
        values.push(parseInt(filters.offset));
      }

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in getAll:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  // =========================================================================
  // GET USER STATS
  // =========================================================================

  static async getStats(userId) {
    try {
      const result = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM bookings WHERE customer_id = $1) as total_bookings,
          (SELECT COUNT(*) FROM bookings WHERE customer_id = $1 AND status = 'completed') as completed_bookings,
          (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as total_favorites,
          (SELECT COUNT(*) FROM reviews WHERE user_id = $1) as total_reviews,
          (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE customer_id = $1 AND status = 'completed') as total_spent,
          (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
      `, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in getStats:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // DELETE USER (Soft Delete)
  // =========================================================================

  static async deleteUser(id) {
    try {
      // Check for active bookings
      const bookingCheck = await pool.query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE (customer_id = $1 OR provider_id = $1) 
         AND status NOT IN ('completed', 'cancelled')`,
        [id]
      );

      if (parseInt(bookingCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete user with active bookings');
      }

      const result = await pool.query(
        `UPDATE users 
         SET is_active = false, deleted_at = NOW(), updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, name, email, is_active`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in deleteUser:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // COUNT USERS
  // =========================================================================

  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM users';
      const values = [];
      const conditions = [];

      if (filters.role) {
        conditions.push(`role = $${values.length + 1}`);
        values.push(filters.role);
      }

      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${values.length + 1}`);
        values.push(filters.is_active);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await pool.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in count:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // GET USERS BY ROLE
  // =========================================================================

  static async getByRole(role, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, avatar, phone, verified, is_active, created_at
         FROM users 
         WHERE role = $1 AND is_active = true
         ORDER BY created_at DESC
         LIMIT $2`,
        [role, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in getByRole:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // UPDATE LAST SEEN
  // =========================================================================

  static async updateLastSeen(id) {
    try {
      await pool.query(
        `UPDATE users SET last_seen = NOW() WHERE id = $1`,
        [id]
      );
    } catch (error) {
      console.error('❌ Error in updateLastSeen:', error.message);
      // Silently fail - not critical
    }
  }

  // =========================================================================
  // CHECK IF EMAIL EXISTS
  // =========================================================================

  static async emailExists(email) {
    try {
      const result = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error in emailExists:', error.message);
      throw error;
    }
  }

  // =========================================================================
  // GET USERS WITH PENDING VERIFICATION
  // =========================================================================

  static async getPendingVerification() {
    try {
      const result = await pool.query(
        `SELECT id, name, email, created_at 
         FROM users 
         WHERE verified = false AND is_active = true
         ORDER BY created_at ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in getPendingVerification:', error.message);
      throw error;
    }
  }
}

export default User;