// =========================================================================
// GLOBAL ERROR HANDLERS – must be first
// =========================================================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash – just log. In production you might want to exit gracefully.
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log and decide whether to crash. Usually you still want to exit after cleanup.
  process.exit(1);
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

import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import userRoutes from './routes/userRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

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

// =========================================================================
// MIDDLEWARE
// =========================================================================

// CORS configuration - Updated for Render + Vercel
const allowedOrigins = [
  'http://localhost:5173',     // Local development (Vite default)
  'http://localhost:3000',      // Alternative dev port
  'http://localhost:5000',      // Backend itself
  'https://service-booking-snowy.vercel.app',  // Your Vercel frontend
  'https://service-booking-3l1j.onrender.com', // Your Render backend
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Allow any vercel.app subdomain for preview deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow any render.com subdomain
    if (origin.includes('render.com')) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS allowed origin: ${origin}`);
      callback(null, true); // Allow all for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // 24 hours
}));

// Session middleware for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'sessionId'
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Security middleware
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - more permissive in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests per 15 min in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// =========================================================================
// ROOT & HEALTH CHECK ENDPOINTS
// =========================================================================

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Service Booking API',
    status: 'online',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    frontend: process.env.FRONTEND_URL || 'https://service-booking-snowy.vercel.app',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      health: '/health',
      info: '/api/info',
      documentation: '/api/info'
    }
  });
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    uptime: process.uptime()
  });
});

// Detailed database status check
app.get('/api/db-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      connected: true, 
      time: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({ 
      connected: false, 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Service Booking API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL,
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

// =========================================================================
// API ROUTES
// =========================================================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Core feature routes
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/categories', categoryRoutes);

// User role specific routes
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/user', userRoutes);

// Financial routes
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);

// Communication routes
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// =========================================================================
// STATIC FRONTEND SERVING (Optional - for production)
// =========================================================================
// If you want to serve frontend from the same server in production
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = path.join(__dirname, '../Frontend/dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    console.log('✅ Serving frontend from:', frontendPath);
  } else {
    console.warn('⚠️ Frontend dist folder not found at:', frontendPath);
  }
}

// =========================================================================
// ERROR HANDLING - Must be last
// =========================================================================
app.use(notFound);
app.use(errorHandler);

// =========================================================================
// SOCKET.IO
// =========================================================================
const io = initializeSocket(httpServer);

// Make io accessible to routes
app.set('io', io);

// =========================================================================
// START SERVER
// =========================================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Server is running!                                 ║
║                                                          ║
║   📡 Port: ${PORT}                                          ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   🔗 API URL: https://service-booking-3l1j.onrender.com/api                    ║
║   ❤️  Health: https://service-booking-3l1j.onrender.com/health                 ║
║   🎨 Frontend: ${process.env.FRONTEND_URL || 'https://service-booking-snowy.vercel.app'}                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  }
};

startServer();

// =========================================================================
// GRACEFUL SHUTDOWN
// =========================================================================
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server`);
  
  httpServer.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      await pool.end();
      console.log('✅ Database pool closed');
    } catch (err) {
      console.error('❌ Error closing database pool:', err);
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force close after 10 seconds if server doesn't close naturally
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// =========================================================================
// EXPORTS
// =========================================================================
export { io, app };