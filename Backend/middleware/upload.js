// middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// CONFIGURATION
// =========================================================================

const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
  allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.txt', '.csv']
};

// =========================================================================
// DIRECTORY SETUP - FIXED
// =========================================================================

// Use __dirname instead of process.cwd() for reliability
const baseUploadDir = path.join(__dirname, '..', 'uploads');
const uploadDir = baseUploadDir;

const directories = {
  avatars: path.join(uploadDir, 'avatars'),
  services: path.join(uploadDir, 'services'),
  reviews: path.join(uploadDir, 'reviews'),
  documents: path.join(uploadDir, 'documents'),
  general: path.join(uploadDir, 'general')
};

// Create all directories
Object.values(directories).forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (err) {
      console.error(`❌ Failed to create directory ${dir}:`, err.message);
    }
  }
});

console.log('✅ Upload directories ready:', Object.keys(directories).join(', '));

// =========================================================================
// FIELD MAPPING
// =========================================================================

const FIELD_MAPPING = {
  // Avatar fields
  'avatar': 'avatars',
  'profile': 'avatars',
  'profileImage': 'avatars',
  
  // Service fields
  'service': 'services',
  'serviceImage': 'services',
  'images': 'services',
  'image': 'services',
  'serviceImages': 'services',
  
  // Review fields
  'reviewImage': 'reviews',
  'reviewImages': 'reviews',
  
  // Document fields
  'document': 'documents',
  'file': 'documents',
  'attachment': 'documents'
};

// =========================================================================
// STORAGE CONFIGURATION
// =========================================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on field name
    let dest = directories.general;
    const fieldName = file.fieldname;
    
    // Check if field name is mapped
    for (const [key, value] of Object.entries(FIELD_MAPPING)) {
      if (fieldName.includes(key) || key.includes(fieldName)) {
        dest = directories[value] || directories.general;
        break;
      }
    }
    
    // Ensure destination exists
    if (!fs.existsSync(dest)) {
      try {
        fs.mkdirSync(dest, { recursive: true });
      } catch (err) {
        console.error(`❌ Failed to create directory ${dest}:`, err.message);
      }
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-uuid.ext
    const timestamp = Date.now();
    const uuid = uuidv4().slice(0, 8);
    const ext = path.extname(file.originalname);
    
    // Sanitize original filename
    const sanitized = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');
    
    const filename = `${file.fieldname}-${timestamp}-${uuid}${ext}`;
    cb(null, filename);
  }
});

// =========================================================================
// FILE FILTER
// =========================================================================

const fileFilter = (req, file, cb) => {
  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtension = UPLOAD_CONFIG.allowedExtensions.includes(ext);
  
  // Check mime type
  const isImage = UPLOAD_CONFIG.allowedImageTypes.includes(file.mimetype);
  const isDocument = UPLOAD_CONFIG.allowedDocumentTypes.includes(file.mimetype);
  const allowedMimeType = isImage || isDocument;
  
  if (allowedExtension && allowedMimeType) {
    // Add file type metadata
    file.fileType = isImage ? 'image' : 'document';
    file.isImage = isImage;
    file.isDocument = isDocument;
    file.extension = ext;
    file.mimeType = file.mimetype;
    
    return cb(null, true);
  }
  
  // More detailed error message
  const allowedTypes = UPLOAD_CONFIG.allowedExtensions.join(', ');
  cb(new Error(`Invalid file type. Allowed: ${allowedTypes}`), false);
};

// =========================================================================
// MULTER INSTANCE
// =========================================================================

const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_CONFIG.maxFileSize,
    files: UPLOAD_CONFIG.maxFiles
  },
  fileFilter: fileFilter
});

// =========================================================================
// ERROR HANDLING
// =========================================================================

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const errorResponses = {
      'LIMIT_FILE_SIZE': {
        status: 400,
        message: `File too large. Maximum size is ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`
      },
      'LIMIT_FILE_COUNT': {
        status: 400,
        message: `Too many files. Maximum is ${UPLOAD_CONFIG.maxFiles}`
      },
      'LIMIT_UNEXPECTED_FILE': {
        status: 400,
        message: 'Unexpected file field'
      },
      'LIMIT_FIELD_SIZE': {
        status: 400,
        message: 'Field size exceeded'
      }
    };
    
    const error = errorResponses[err.code] || {
      status: 400,
      message: err.message
    };
    
    return res.status(error.status).json({
      success: false,
      message: error.message,
      code: err.code,
      field: err.field
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
  
  next();
};

// =========================================================================
// UPLOAD MIDDLEWARE FUNCTIONS
// =========================================================================

/**
 * Upload a single file
 * @param {string} fieldName - Field name for the file
 * @param {Object} options - Additional options
 */
export const uploadSingle = (fieldName, options = {}) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err) {
        handleMulterError(err, req, res, next);
      } else {
        // Add file info to request
        if (req.file) {
          req.uploadedFiles = [req.file];
        }
        next();
      }
    });
  };
};

/**
 * Upload multiple files with same field name
 * @param {string} fieldName - Field name for the files
 * @param {number} maxCount - Maximum number of files
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err) {
        handleMulterError(err, req, res, next);
      } else {
        // Add file info to request
        if (req.files && req.files.length > 0) {
          req.uploadedFiles = req.files;
        }
        next();
      }
    });
  };
};

/**
 * Upload multiple files with different field names
 * @param {Array} fields - Array of field configurations [{name, maxCount}]
 */
export const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      if (err) {
        handleMulterError(err, req, res, next);
      } else {
        // Add file info to request
        if (req.files) {
          req.uploadedFiles = Object.values(req.files).flat();
        }
        next();
      }
    });
  };
};

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Delete a single uploaded file
 * @param {string} filePath - File path or filename
 * @returns {Promise<boolean>}
 */
export const deleteUploadedFile = async (filePath) => {
  try {
    const filename = path.basename(filePath);
    
    // Check all possible directories
    for (const dir of Object.values(directories)) {
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
    }
    
    // If not found in any directory, check if path is full
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Delete multiple uploaded files
 * @param {string[]} filePaths - Array of file paths
 */
export const deleteMultipleFiles = async (filePaths) => {
  const results = await Promise.allSettled(
    filePaths.map(path => deleteUploadedFile(path))
  );
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
};

/**
 * Get URL for an uploaded file
 * @param {string} filename - File name
 * @param {string} type - File type (avatar, service, document, etc.)
 * @returns {string}
 */
export const getFileUrl = (filename, type = 'general') => {
  if (!filename) return null;
  
  // If it's already a full URL, return it
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  // Get base URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  // Determine subdirectory
  const subDir = directories[type] 
    ? path.basename(directories[type]) 
    : 'general';
  
  // Extract just filename if full path is provided
  const fileName = path.basename(filename);
  
  return `${baseUrl}/uploads/${subDir}/${fileName}`;
};

/**
 * Get file type
 * @param {string} filename - File name
 * @returns {string} 'image', 'document', or 'file'
 */
export const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];
  
  if (imageExts.includes(ext)) return 'image';
  if (documentExts.includes(ext)) return 'document';
  return 'file';
};

/**
 * Get file size
 * @param {string} filePath - File path
 * @returns {number} Size in bytes
 */
export const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file info object
 * @param {Object} file - Multer file object
 * @param {string} type - File type
 * @returns {Object} Standardized file info
 */
export const getFileInfo = (file, type = 'general') => {
  if (!file) return null;
  
  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    fileType: file.fileType || getFileType(file.filename),
    extension: file.extension || path.extname(file.filename),
    url: getFileUrl(file.filename, type),
    formattedSize: formatFileSize(file.size)
  };
};

// =========================================================================
// VALIDATION MIDDLEWARE
// =========================================================================

/**
 * Validate file types
 * @param {string[]} allowedTypes - Array of allowed extensions (e.g., ['jpg', 'png'])
 */
export const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    const files = req.files || [];
    const file = req.file;
    const allFiles = file ? [file] : (Array.isArray(files) ? files : Object.values(files).flat());
    
    if (allFiles.length === 0) {
      return next();
    }
    
    const invalidFiles = [];
    
    for (const f of allFiles) {
      const ext = path.extname(f.originalname).toLowerCase().substring(1);
      if (!allowedTypes.includes(ext)) {
        invalidFiles.push(f.originalname);
      }
    }
    
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type(s): ${invalidFiles.join(', ')}. Allowed: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
        invalidFiles
      });
    }
    
    next();
  };
};

/**
 * Validate file size
 * @param {number} maxSizeMB - Maximum file size in MB
 */
export const validateFileSize = (maxSizeMB) => {
  return (req, res, next) => {
    const files = req.files || [];
    const file = req.file;
    const allFiles = file ? [file] : (Array.isArray(files) ? files : Object.values(files).flat());
    
    if (allFiles.length === 0) {
      return next();
    }
    
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = [];
    
    for (const f of allFiles) {
      if (f.size > maxSizeBytes) {
        oversizedFiles.push(f.originalname);
      }
    }
    
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `File(s) too large: ${oversizedFiles.join(', ')}. Maximum size is ${maxSizeMB}MB`,
        code: 'FILE_TOO_LARGE',
        oversizedFiles
      });
    }
    
    next();
  };
};

// =========================================================================
// COMPOSITE UPLOAD WITH VALIDATION
// =========================================================================

/**
 * Upload with built-in validation
 * @param {string} fieldName - Field name
 * @param {Object} options - Upload options
 */
export const uploadWithValidation = (fieldName, options = {}) => {
  const {
    maxCount = 5,
    allowedTypes = null,
    maxSizeMB = 10,
    single = false,
    required = false
  } = options;
  
  const middlewares = [];
  
  // Upload middleware
  if (single) {
    middlewares.push(uploadSingle(fieldName));
  } else {
    middlewares.push(uploadMultiple(fieldName, maxCount));
  }
  
  // Validation middleware
  if (allowedTypes) {
    middlewares.push(validateFileType(allowedTypes));
  }
  
  middlewares.push(validateFileSize(maxSizeMB));
  
  // Required file check
  if (required) {
    middlewares.push((req, res, next) => {
      const files = req.files || [];
      const file = req.file;
      const allFiles = file ? [file] : (Array.isArray(files) ? files : Object.values(files).flat());
      
      if (allFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File is required',
          code: 'FILE_REQUIRED'
        });
      }
      
      next();
    });
  }
  
  return middlewares;
};

// =========================================================================
// EXPORTS
// =========================================================================

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteUploadedFile,
  deleteMultipleFiles,
  getFileUrl,
  getFileType,
  getFileSize,
  formatFileSize,
  getFileInfo,
  validateFileType,
  validateFileSize,
  uploadWithValidation,
  directories,
  uploadDir,
  UPLOAD_CONFIG
};

// =========================================================================
// BACKWARDS COMPATIBILITY EXPORTS
// =========================================================================

// For backward compatibility with older code
export const avatarDir = directories.avatars;
export const serviceDir = directories.services;
export const documentDir = directories.documents;