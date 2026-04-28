import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simplified SSL config – accept self‑signed (for Aiven)
const ssl = { rejectUnauthorized: false };

// Connection pool – REDUCED MAX to avoid exhaustion
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 28771,
  database: process.env.DB_NAME,
  ssl,
  max: 10,                   // ✅ lower max connections (was 20)
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 60000,
  query_timeout: 60000,
  idle_in_transaction_session_timeout: 60000,
  application_name: 'service_booking_app',
  allowExitOnIdle: false,
  prepare: false,            // ✅ disable prepared statements
});

// Leak detection – only log pool errors (connection/acquisition logs were too noisy)
pool.on('error', (err) => console.error('Pool error:', err.message));

let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

// Test connection (always releases client)
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    isConnected = true;
    reconnectAttempts = 0;
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err.message);
    isConnected = false;
    return false;
  } finally {
    if (client) client.release(); // ✅ always release
  }
};

// Retry connection
const connectWithRetry = async (maxRetries = 5, initialDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    const delay = initialDelay * Math.pow(1.5, i);
    const success = await testConnection();
    if (success) return true;
    if (i < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.error('All connection attempts failed');
  return false;
};

// Handle connection loss
const handleConnectionLoss = async () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  reconnectAttempts++;
  await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY * reconnectAttempts));
  const success = await testConnection();
  if (success) reconnectAttempts = 0;
  else setTimeout(() => handleConnectionLoss(), RECONNECT_DELAY);
};

// Initial connection
(async () => {
  if (!(await connectWithRetry())) {
    console.error('Warning: Application starting without database connection');
  }
})();

// Pool error handling
pool.on('error', async (err) => {
  console.error('Database pool error:', err.message);
  if (err.code === '57P01' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    isConnected = false;
    setTimeout(() => testConnection().then(success => {
      if (!success) handleConnectionLoss();
    }), 2000);
  }
});

// Health check every minute
let healthCheckInterval = setInterval(async () => {
  if (!isConnected) return;
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
  } catch (err) {
    console.error('Health check failed:', err.message);
    isConnected = false;
    handleConnectionLoss();
  } finally {
    if (client) client.release();
  }
}, 60000);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, closing database pool...`);
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing pool:', err.message);
  }
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ✅ Safe query helper – always uses pool.query (auto‑releases)
export default {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),      // use only if you manually release
  end: () => pool.end(),
  isConnected: () => isConnected,
  getPool: () => pool,
};

export { pool };