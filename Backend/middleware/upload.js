// middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// DIRECTORY SETUP
// =========================================================================

const uploadDir = path.join(__dirname, '../uploads');
const avatarDir = path.join(uploadDir, 'avatars');
const serviceDir = path.join(uploadDir, 'services');
const documentDir = path.join(uploadDir, 'documents');

// Create directories if they don't exist
const dirs = [uploadDir, avatarDir, serviceDir, documentDir];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// =========================================================================
// STORAGE CONFIGURATION
// =========================================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadDir;
    
    // Determine destination based on field name or file type
    if (file.fieldname === 'avatar' || file.fieldname === 'profile') {
      dest = avatarDir;
    } else if (file.fieldname === 'service' || file.fieldname === 'serviceImage' || file.fieldname === 'images') {
      dest = serviceDir;
    } else if (file.fieldname === 'document' || file.fieldname === 'file') {
      dest = documentDir;
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-uuid.ext
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    const ext = path.extname(file.originalname);
    const sanitized = file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// =========================================================================
// FILE FILTER
// =========================================================================

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const imageTypes = /jpeg|jpg|png|gif|webp|svg|bmp|ico/;
  const documentTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|json|xml/;
  const allTypes = /jpeg|jpg|png|gif|webp|svg|bmp|ico|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|json|xml/;
  
  const extname = allTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allTypes.test(file.mimetype);
  
  // Check for image files specifically
  const isImage = imageTypes.test(path.extname(file.originalname).toLowerCase()) || 
                  imageTypes.test(file.mimetype);
  
  // Check for document files specifically
  const isDocument = documentTypes.test(path.extname(file.originalname).toLowerCase()) || 
                     documentTypes.test(file.mimetype);

  if (mimetype && extname) {
    // Add file type info to request for later use
    file.fileType = isImage ? 'image' : isDocument ? 'document' : 'file';
    file.isImage = isImage;
    file.isDocument = isDocument;
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: images, PDFs, Word, Excel, PowerPoint, and text files'), false);
  }
};

// =========================================================================
// MULTER CONFIGURATION
// =========================================================================

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 files per request
  },
  fileFilter: fileFilter
});

// =========================================================================
// ERROR HANDLING MIDDLEWARE
// =========================================================================

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const errorMap = {
      'LIMIT_FILE_SIZE': {
        status: 400,
        message: `File too large. Maximum size is ${upload.limits.fileSize / (1024 * 1024)}MB`
      },
      'LIMIT_FILE_COUNT': {
        status: 400,
        message: 'Too many files uploaded'
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
    
    const error = errorMap[err.code] || {
      status: 400,
      message: err.message
    };
    
    return res.status(error.status).json({
      success: false,
      message: error.message,
      code: err.code,
      field: err.field
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'UPLOAD_ERROR'
    });
  }
  next();
};

// =========================================================================
// UPLOAD MIDDLEWARE FUNCTIONS
// =========================================================================

export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  };
};

export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  };
};

export const uploadFields = (fields) => {
  return (req, res, next) => {
    const fieldsUpload = upload.fields(fields);
    
    fieldsUpload(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  };
};

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

export const deleteUploadedFile = (filePath) => {
  return new Promise((resolve, reject) => {
    // If it's a URL, extract the filename
    const filename = filePath.includes('/') 
      ? path.basename(filePath) 
      : filePath;
    
    // Check all possible directories
    const possibleDirs = [avatarDir, serviceDir, documentDir, uploadDir];
    let found = false;
    
    for (const dir of possibleDirs) {
      const fullPath = path.join(dir, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      resolve(false);
    }
  });
};

export const deleteMultipleFiles = (filePaths) => {
  return Promise.all(filePaths.map(deleteUploadedFile));
};

export const getFileUrl = (filename, type = 'general') => {
  if (!filename) return null;
  
  // If it's already a full URL, return it
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  
  // Determine the subdirectory based on type
  let subDir = '';
  switch(type) {
    case 'avatar':
      subDir = 'avatars';
      break;
    case 'service':
      subDir = 'services';
      break;
    case 'document':
      subDir = 'documents';
      break;
    default:
      subDir = '';
  }
  
  return `${baseUrl}/uploads/${subDir}/${filename}`;
};

export const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.json', '.xml'];
  
  if (imageExts.includes(ext)) return 'image';
  if (documentExts.includes(ext)) return 'document';
  return 'file';
};

export const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// =========================================================================
// VALIDATION MIDDLEWARE
// =========================================================================

export const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    const files = req.files || [];
    const file = req.file;
    const allFiles = file ? [file] : files;
    
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

export const validateFileSize = (maxSizeMB) => {
  return (req, res, next) => {
    const files = req.files || [];
    const file = req.file;
    const allFiles = file ? [file] : files;
    
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
// UPLOAD WITH CUSTOM VALIDATION
// =========================================================================

export const uploadWithValidation = (fieldName, options = {}) => {
  const { maxCount = 5, allowedTypes = null, maxSizeMB = 10, single = false } = options;
  
  return [
    // Upload middleware
    single 
      ? uploadSingle(fieldName)
      : uploadMultiple(fieldName, maxCount),
    
    // Validation middleware
    allowedTypes ? validateFileType(allowedTypes) : (req, res, next) => next(),
    validateFileSize(maxSizeMB)
  ];
};

// Export all utilities
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
  validateFileType,
  validateFileSize,
  uploadWithValidation,
  uploadDir,
  avatarDir,
  serviceDir,
  documentDir
};