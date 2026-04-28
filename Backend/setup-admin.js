import bcrypt from 'bcryptjs';
import pool from './config/db.js';

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');

    const adminData = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin'
    };

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [adminData.email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️ User already exists!');
      console.log('Email:', existingAdmin.rows[0].email);
      console.log('Current Role:', existingAdmin.rows[0].role);
      
      // Update existing user to admin
      await pool.query(
        'UPDATE users SET role = $1, verified = true, updated_at = NOW() WHERE email = $2',
        ['admin', adminData.email]
      );
      
      console.log('✅ Updated user role to admin');
      
      // Show updated user
      const updated = await pool.query(
        'SELECT id, name, email, role, verified FROM users WHERE email = $1',
        [adminData.email]
      );
      console.log('Updated user:', updated.rows[0]);
      
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Insert admin with correct column names
    const result = await pool.query(
      `INSERT INTO users (
        name, email, password, role, verified, online, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, true, false, NOW(), NOW()
      ) RETURNING id, name, email, role, verified, created_at`,
      [adminData.name, adminData.email, hashedPassword, adminData.role]
    );

    console.log('✅ Admin user created successfully!');
    console.log('ID:', result.rows[0].id);
    console.log('Name:', result.rows[0].name);
    console.log('Email:', result.rows[0].email);
    console.log('Role:', result.rows[0].role);
    console.log('Verified:', result.rows[0].verified);
    console.log('Created:', result.rows[0].created_at);
    console.log('\n📝 Login credentials:');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();