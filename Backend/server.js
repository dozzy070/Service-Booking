// server.js
// =========================================================================
// GLOBAL ERROR HANDLERS – must be first
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

import pool from './config/db.js';
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
import { testEmailConfig, sendTestEmail } from './services/emailService.js';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { initializeSocket } from './socket/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================================================
// PASSPORT CONFIGURATION
// =========================================================================
import('./config/passport.js').then(() => {
  console.log('✅ Passport configured');
}).catch(err => console.error('❌ Passport config error:', err));

// =========================================================================
// EXPRESS APP
// =========================================================================
const app = express();
const httpServer = createServer(app);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const serviceUploadsDir = path.join(__dirname, 'uploads', 'services');
if (!fs.existsSync(serviceUploadsDir)) {
  fs.mkdirSync(serviceUploadsDir, { recursive: true });
}

// =========================================================================
// MIDDLEWARE
// =========================================================================

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://service-booking-snowy.vercel.app',
  'https://service-booking-3l1j.onrender.com',
  'https://service-booking-1-g46o.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app') || origin.includes('render.com')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Length', 'X-Request-Id', 'X-Total-Count'],
  maxAge: 86400
}));

// =========================================================================
// SESSION CONFIGURATION WITH REDIS FALLBACK (SILENT)
// =========================================================================

let sessionStore;
let sessionStoreType = 'Memory';
let redisNotified = false;

try {
  const RedisStore = connectRedis;
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://127.0.0.1:6379';
  
  if (process.env.REDIS_DISABLED === 'true') {
    if (!redisNotified) {
      console.log('ℹ️ Using memory session store (Redis disabled)');
      redisNotified = true;
    }
    sessionStore = new session.MemoryStore();
    sessionStoreType = 'Memory (disabled)';
  } else {
    const redisClient = new IORedis(redisUrl, {
      retryStrategy: (times) => {
        return null; // Don't retry
      },
      maxRetriesPerRequest: 0,
      lazyConnect: true, // Don't connect immediately
    });

    let redisConnected = false;

    redisClient.on('error', (err) => {
      if (!redisNotified && err.code === 'ECONNREFUSED') {
        console.log('ℹ️ Using memory session store (Redis unavailable)');
        redisNotified = true;
      }
      if (!sessionStore) {
        sessionStore = new session.MemoryStore();
        sessionStoreType = 'Memory (fallback)';
      }
    });

    redisClient.on('connect', () => {
      if (!redisConnected) {
        console.log('✅ Redis connected');
        redisConnected = true;
      }
    });

    // Try to connect with timeout
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

    redisClient.on('ready', () => {
      clearTimeout(timeout);
    });

    // Only use Redis if client is ready
    if (!sessionStore) {
      sessionStore = new RedisStore({ client: redisClient, prefix: 'sess:' });
      sessionStoreType = 'Redis';
    }
  }
} catch (error) {
  if (!redisNotified) {
    console.log('ℹ️ Using memory session store (Redis error)');
    redisNotified = true;
  }
  sessionStore = new session.MemoryStore();
  sessionStoreType = 'Memory (fallback)';
}

// Ensure sessionStore is defined
if (!sessionStore) {
  sessionStore = new session.MemoryStore();
  sessionStoreType = 'Memory (fallback)';
}

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

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Security middleware
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: false
}));

// Logging - only in development
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
// ROOT & HEALTH CHECK ENDPOINTS
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
      notifications: '/api/notifications'
    }
  });
});

app.get('/api/test-email', async (req, res) => {
  try {
    console.log('📧 Testing email configuration...');
    
    // Test the configuration
    const configValid = await testEmailConfig();
    if (!configValid) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration is invalid. Check your .env settings.'
      });
    }

    // Send test email
    const testEmail = req.query.email || process.env.EMAIL_USER || 'test@example.com';
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    const result = await sendTestEmail(testEmail);
    
    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      messageId: result?.messageId,
      previewUrl: result?.messageId?.includes('ethereal') ? `https://ethereal.email/message/${result.messageId}` : null
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
// SOCKET.IO
// =========================================================================
const io = initializeSocket(httpServer);
app.set('io', io);

// =========================================================================
// START SERVER
// =========================================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    httpServer.listen(PORT, () => {
      console.log(`
🚀 Server running on port ${PORT}
📡 API: http://localhost:${PORT}/api
❤️  Health: http://localhost:${PORT}/health
💾 Session Store: ${sessionStoreType}
🔌 WebSocket: Ready
      `.trim());
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
  console.log(`\n${signal} received, closing server...`);
  
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
  
  setTimeout(() => {
    console.error('⚠️ Force shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { io, app };