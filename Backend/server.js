// server.js
// =========================================================================
// GLOBAL ERROR HANDLERS – MUST BE FIRST
// =========================================================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// =========================================================================
// DEPENDENCIES & CONFIGURATION
// =========================================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import passport from 'passport';
import session from 'express-session';
import connectRedis from 'connect-redis';
import IORedis from 'ioredis';

// Load environment variables
dotenv.config();

// Import configurations
import pool from './config/db.js';
import './config/passport.js';

// Import middleware
import { protect, authorize } from './middleware/auth.js';
import { uploadSingle } from './middleware/upload.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Import services
import { testEmailConfig, sendTestEmail } from './services/emailService.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Import socket
import { initializeSocket } from './socket/index.js';

// =========================================================================
// PATH CONFIGURATION
// =========================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// EXPRESS APP INITIALIZATION
// =========================================================================
const app = express();
const httpServer = createServer(app);

// =========================================================================
// DIRECTORY SETUP
// =========================================================================
const uploadDirectories = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'avatars'),
  path.join(__dirname, 'uploads', 'services'),
  path.join(__dirname, 'uploads', 'reviews'),
  path.join(__dirname, 'uploads', 'documents'),
  path.join(__dirname, 'uploads', 'general')
];

uploadDirectories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('✅ Upload directories created');

// =========================================================================
// CORS CONFIGURATION
// =========================================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://service-booking-snowy.vercel.app',
  'https://service-booking-3l1j.onrender.com',
  'https://service-booking-1-g46o.onrender.com'
];

app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    // Allow all in development, check origins in production
    if (!origin || 
        allowedOrigins.indexOf(origin) !== -1 || 
        origin.includes('vercel.app') || 
        origin.includes('render.com') ||
        process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for flexibility
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Length', 'X-Request-Id', 'X-Total-Count'],
  maxAge: 86400
}));

// =========================================================================
// SESSION & REDIS CONFIGURATION
// =========================================================================
let sessionStore;
let sessionStoreType = 'Memory';
let redisNotified = false;

const setupSessionStore = () => {
  try {
    const RedisStore = connectRedis;
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://127.0.0.1:6379';
    
    if (process.env.REDIS_DISABLED === 'true') {
      if (!redisNotified) {
        console.log('ℹ️ Using memory session store (Redis disabled)');
        redisNotified = true;
      }
      return new session.MemoryStore();
    }

    const redisClient = new IORedis(redisUrl, {
      retryStrategy: () => null, // Don't retry
      maxRetriesPerRequest: 0,
      lazyConnect: true
    });

    let redisConnected = false;

    redisClient.on('error', (err) => {
      if (!redisNotified && err.code === 'ECONNREFUSED') {
        console.log('ℹ️ Using memory session store (Redis unavailable)');
        redisNotified = true;
      }
    });

    redisClient.on('connect', () => {
      if (!redisConnected) {
        console.log('✅ Redis connected');
        redisConnected = true;
      }
    });

    // Set timeout for Redis connection
    const timeout = setTimeout(() => {
      if (!sessionStore) {
        if (!redisNotified) {
          console.log('ℹ️ Using memory session store (Redis timeout)');
          redisNotified = true;
        }
        sessionStore = new session.MemoryStore();
        sessionStoreType = 'Memory (fallback)';
      }
    }, 2000);

    redisClient.on('ready', () => clearTimeout(timeout));

    return new RedisStore({ client: redisClient, prefix: 'sess:' });
  } catch (error) {
    if (!redisNotified) {
      console.log('ℹ️ Using memory session store (Redis error)');
      redisNotified = true;
    }
    return new session.MemoryStore();
  }
};

sessionStore = setupSessionStore();
sessionStoreType = sessionStore instanceof session.MemoryStore ? 'Memory' : 'Redis';

// Session middleware
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'sessionId',
  proxy: true,
}));

// =========================================================================
// PASSPORT MIDDLEWARE
// =========================================================================
app.use(passport.initialize());
app.use(passport.session());

console.log('✅ Passport configured');

// =========================================================================
// SECURITY & UTILITY MIDDLEWARE
// =========================================================================

// Helmet security
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: false
}));

// Logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/'
});

app.use('/api/', limiter);

// =========================================================================
// HEALTH & STATUS ENDPOINTS
// =========================================================================

app.get('/', (req, res) => {
  res.json({
    name: 'Service Booking API',
    status: 'online',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/db-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Service Booking API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    sessionStore: sessionStoreType,
    endpoints: {
      auth: '/api/auth',
      services: '/api/services',
      bookings: '/api/bookings',
      categories: '/api/categories',
      wallet: '/api/wallet',
      payments: '/api/payments',
      admin: '/api/admin',
      provider: '/api/provider',
      customer: '/api/customer',
      user: '/api/user',
      chat: '/api/chat',
      notifications: '/api/notifications',
      upload: '/api/upload'
    }
  });
});

// =========================================================================
// EMAIL TEST ENDPOINT
// =========================================================================

app.get('/api/test-email', async (req, res) => {
  try {
    console.log('📧 Testing email configuration...');
    
    const configValid = await testEmailConfig();
    if (!configValid) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration is invalid. Check your .env settings.'
      });
    }

    const testEmail = req.query.email || process.env.EMAIL_USER || 'test@example.com';
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    const result = await sendTestEmail(testEmail);
    
    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      messageId: result?.messageId,
      previewUrl: result?.messageId?.includes('ethereal') ? 
        `https://ethereal.email/message/${result.messageId}` : null
    });
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// =========================================================================
// API ROUTES
// =========================================================================

// Main API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

console.log('✅ All routes mounted');

// =========================================================================
// DIRECT UPLOAD ROUTES - FIXED (No /api prefix)
// =========================================================================

const handleServiceImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const imageUrl = `/uploads/services/${req.file.filename}`;
    console.log('✅ Image uploaded successfully (fallback):', imageUrl);
    
    return res.status(200).json({ 
      success: true,
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('❌ Error uploading service image (fallback):', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to upload service image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// FIX: These routes are already under /api, so don't add /api prefix
app.post('/provider/upload-service-image', protect, authorize('provider', 'admin'), uploadSingle('image'), handleServiceImageUpload);
app.post('/services/upload-service-image', protect, authorize('provider', 'admin'), uploadSingle('image'), handleServiceImageUpload);

console.log('✅ Fallback upload routes registered');

// =========================================================================
// ROUTE DEBUGGING (Development only)
// =========================================================================

if (process.env.NODE_ENV === 'development') {
  console.log('\n📋 Registered Upload Routes:');
  const listRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log(`  ${methods.padEnd(7)} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = layer.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\?/g, '')
          .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
        if (basePath.includes('upload') || basePath.includes('provider') || basePath.includes('services')) {
          listRoutes(layer.handle.stack, `${basePath}${routerPath}`);
        }
      }
    });
  };
  
  listRoutes(app._router.stack, '');
  console.log('✅ Route debugging complete\n');
}

// =========================================================================
// STATIC FRONTEND SERVING (Optional)
// =========================================================================

if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = path.join(__dirname, '../Frontend/dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    console.log('✅ Serving frontend from:', frontendPath);
  }
}

// =========================================================================
// ERROR HANDLING
// =========================================================================

app.use(notFound);
app.use(errorHandler);

// =========================================================================
// SOCKET.IO INITIALIZATION
// =========================================================================

const io = initializeSocket(httpServer);
app.set('io', io);

// =========================================================================
// SERVER STARTUP
// =========================================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 SERVER STARTED                        ║
╠══════════════════════════════════════════════════════════════╣
║  Port:          ${PORT.padEnd(40)}║
║  Environment:   ${(process.env.NODE_ENV || 'production').padEnd(40)}║
║  Session Store: ${sessionStoreType.padEnd(40)}║
║  API:           http://localhost:${PORT}/api${' '.repeat(40 - String(PORT).length - 14)}║
║  Health:        http://localhost:${PORT}/health${' '.repeat(40 - String(PORT).length - 17)}║
║  Upload:        http://localhost:${PORT}/api/upload${' '.repeat(40 - String(PORT).length - 15)}║
║  WebSocket:     Ready${' '.repeat(43)}║
╚══════════════════════════════════════════════════════════════╝
      `.trim());
      
      console.log('\n📡 Available Upload Endpoints:');
      console.log(`  ✅ POST /api/upload/service-image (Preferred)`);
      console.log(`  ✅ POST /api/upload/service-images (Multiple)`);
      console.log(`  ✅ POST /api/upload/avatar`);
      console.log(`  ✅ POST /api/upload/review-image`);
      console.log(`  ✅ POST /api/upload/document`);
      console.log(`  ✅ POST /api/upload/test (Test endpoint)`);
      console.log(`  ✅ POST /api/provider/upload-service-image (Fallback)`);
      console.log(`  ✅ POST /api/services/upload-service-image (Fallback)`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
};

startServer();

// =========================================================================
// GRACEFUL SHUTDOWN
// =========================================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n📡 ${signal} received, initiating graceful shutdown...`);
  
  httpServer.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      await pool.end();
      console.log('✅ Database pool closed');
    } catch (err) {
      console.error('❌ Error closing database pool:', err);
    }
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('⚠️ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// =========================================================================
// EXPORTS
// =========================================================================

export { io, app };