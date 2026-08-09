// routes/uploadRoutes.js
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect, authorize } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// =========================================================================
// SERVICE IMAGE UPLOADS
// =========================================================================

// POST /api/upload/service-image - Upload a single service image
router.post('/service-image', protect, authorize('provider', 'admin'), uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const imageUrl = `/uploads/services/${req.file.filename}`;
    
    console.log('✅ Service image uploaded successfully:', imageUrl);
    
    return res.status(200).json({ 
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      path: req.file.path
    });
  } catch (error) {
    console.error('❌ Error uploading service image:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload service image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/upload/service-images - Upload multiple service images
router.post('/service-images', protect, authorize('provider', 'admin'), uploadMultiple('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files uploaded' 
      });
    }

    const uploadedFiles = req.files.map(file => ({
      url: `/uploads/services/${file.filename}`,
      filename: file.filename,
      path: file.path
    }));
    
    console.log(`✅ ${uploadedFiles.length} service images uploaded successfully`);
    
    return res.status(200).json({ 
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('❌ Error uploading service images:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload service images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =========================================================================
// AVATAR UPLOADS
// =========================================================================

// POST /api/upload/avatar - Upload avatar image
router.post('/avatar', protect, uploadSingle('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const imageUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Update user avatar in database
    const result = await pool.query(
      'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2 RETURNING id, avatar',
      [imageUrl, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    console.log('✅ Avatar uploaded successfully:', imageUrl);
    
    return res.status(200).json({ 
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      avatar: result.rows[0].avatar
    });
  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =========================================================================
// REVIEW IMAGE UPLOADS
// =========================================================================

// POST /api/upload/review-image - Upload review image
router.post('/review-image', protect, uploadSingle('reviewImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const imageUrl = `/uploads/reviews/${req.file.filename}`;
    
    console.log('✅ Review image uploaded successfully:', imageUrl);
    
    return res.status(200).json({ 
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('❌ Error uploading review image:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload review image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =========================================================================
// DOCUMENT UPLOADS
// =========================================================================

// POST /api/upload/document - Upload document
router.post('/document', protect, uploadSingle('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    console.log('✅ Document uploaded successfully:', fileUrl);
    
    return res.status(200).json({ 
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =========================================================================
// TEST ENDPOINT - To verify upload routes are working
// =========================================================================

router.get('/test', protect, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Upload routes are working',
    userId: req.user.id,
    timestamp: new Date().toISOString()
  });
});

export default router;