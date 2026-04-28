import pool from '../config/db.js';

class User {
  static async findByEmail(email) {
    try {
      // Ensure connection is alive
      await pool.query('SELECT 1');
      
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in findByEmail:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  static async findById(id) {
    try {
      await pool.query('SELECT 1');
      
      const result = await pool.query(
        'SELECT id, name, email, role, avatar, phone, verified, created_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in findById:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  static async findByGoogleId(googleId) {
    try {
      await pool.query('SELECT 1');
      
      const result = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in findByGoogleId:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  static async create(userData) {
    try {
      await pool.query('SELECT 1');
      
      const { name, email, password, role = 'customer', phone, google_id, verified = false } = userData;
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, phone, google_id, verified, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         RETURNING id, name, email, role, google_id, verified`,
        [name, email, password, role, phone, google_id, verified]
      );
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in create:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      await pool.query('SELECT 1');
      
      const fields = [];
      const values = [];
      let paramCount = 1;

      const allowedUpdates = ['name', 'phone', 'avatar'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key) && value !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (fields.length === 0) return null;

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, name, email, role, avatar, phone, verified`;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in update:', error.message);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Connection terminated')) {
        throw new Error('Database connection failed');
      }
      throw error;
    }
  }

  static async getAll(filters = {}) {
    try {
      await pool.query('SELECT 1');
      
      let query = 'SELECT id, name, email, role, avatar, phone, verified, created_at FROM users';
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
}

export default User;