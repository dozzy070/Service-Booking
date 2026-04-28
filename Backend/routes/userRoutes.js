import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';

const router = express.Router();

// ---------- Setup for avatar uploads ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ---------- All routes require authentication ----------
router.use(protect);

// ---------- Profile & account management ----------
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, address, bio, avatar, role, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', async (req, res) => {
  const { name, phone, address, bio } = req.body;
  try {
    await pool.query(
      `UPDATE users SET name = $1, phone = $2, address = $3, bio = $4 
       WHERE id = $5`,
      [name, phone, address, bio, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isValid = await bcrypt.compare(currentPassword, userRes.rows[0].password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- User listing endpoints ----------
// GET /api/user?roles=customer,admin  (generic role filter)
router.get('/', async (req, res) => {
  try {
    let roles = req.query.roles ? req.query.roles.split(',') : [];
    if (roles.length === 0) {
      return res.json([]);
    }
    const placeholders = roles.map((_, i) => `$${i + 1}`).join(',');
    const query = `SELECT id, name, email, role, avatar FROM users WHERE role IN (${placeholders})`;
    const result = await pool.query(query, roles);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/user/users/available-for-chat
// (adjust mount point in your main app if this path seems nested)
router.get('/users/available-for-chat', async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentRole = req.user.role;
    let query;
    if (currentRole === 'provider') {
      // Provider can chat with customers and admin
      query = `SELECT id, name, role FROM users WHERE role IN ('customer', 'admin') AND id != $1 ORDER BY name`;
    } else if (currentRole === 'customer') {
      query = `SELECT id, name, role FROM users WHERE role = 'provider' AND id != $1 ORDER BY name`;
    } else if (currentRole === 'admin') {
      // Admin can chat with providers (and optionally customers)
      query = `SELECT id, name, role FROM users WHERE role = 'provider' AND id != $1 ORDER BY name`;
    } else {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const result = await pool.query(query, [currentUserId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;