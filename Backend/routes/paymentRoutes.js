import express from 'express';
import { body, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import pool from '../config/db.js';
import {
  confirmPayment,
  getPaymentMethods,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  getPaymentSummary,
  getPaymentHistory
} from '../controllers/paymentController.js';

const router = express.Router();

// =========================================================================
// VALIDATION RULES
// =========================================================================

const paymentValidation = [
  body('bookingId').isInt().withMessage('Valid booking ID is required'),
  body('transactionId').isString().withMessage('Transaction ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('paymentMethod').optional().isString()
];

const paymentMethodValidation = [
  body('type').isIn(['card', 'paypal', 'bank']).withMessage('Invalid payment method type'),
  body('last4').optional().isString().isLength({ min: 4, max: 4 }).withMessage('Last 4 digits are required for cards'),
  body('expiry').optional().isString().matches(/^(0[1-9]|1[0-2])\/\d{2}$/).withMessage('Invalid expiry format (MM/YY)'),
  body('cardholderName').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('isDefault').optional().isBoolean()
];

const refundValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('reason').isString().notEmpty().withMessage('Reason is required')
];

// =========================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =========================================================================
router.use(protect);

// =========================================================================
// PAYMENT CONFIRMATION
// =========================================================================

// POST /api/payments/confirm - Confirm a payment
router.post('/confirm', paymentValidation, validate, async (req, res) => {
  try {
    const { bookingId, transactionId, amount, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Verify booking belongs to user
    const bookingCheck = await pool.query(
      `SELECT b.*, s.price as service_price, u.id as provider_id
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON s.provider_id = u.id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [bookingId, userId]
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingCheck.rows[0];
    
    // Check if already paid
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }
    
    // Calculate commission (10%)
    const commissionRate = 0.10;
    const commissionAmount = parseFloat(amount) * commissionRate;
    const providerAmount = parseFloat(amount) - commissionAmount;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert payment record
      const paymentResult = await client.query(
        `INSERT INTO payments (
          booking_id, user_id, provider_id, transaction_id, amount, 
          commission_amount, provider_amount, payment_method, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'paid') RETURNING *`,
        [bookingId, userId, booking.provider_id, transactionId, amount, commissionAmount, providerAmount, paymentMethod || 'card']
      );
      
      // Update booking payment status
      await client.query(
        `UPDATE bookings SET payment_status = 'paid', updated_at = NOW() WHERE id = $1`,
        [bookingId]
      );
      
      // Update wallet balance for provider
      await client.query(
        `UPDATE wallets SET balance = balance + $1, lifetime_earnings = lifetime_earnings + $1, updated_at = NOW()
         WHERE user_id = $2`,
        [providerAmount, booking.provider_id]
      );
      
      // Add transaction record for provider
      await client.query(
        `INSERT INTO transactions (
          user_id, amount, type, status, description, balance_after
        ) VALUES ($1, $2, 'credit', 'completed', $3, 
          (SELECT balance FROM wallets WHERE user_id = $1))`,
        [booking.provider_id, providerAmount, `Payment for booking #${bookingId}`]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Payment confirmed successfully',
        payment: paymentResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// =========================================================================
// PAYMENT METHODS
// =========================================================================

// GET /api/payments/methods - Get user's payment methods
router.get('/methods', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, type, brand, last4, expiry, cardholder_name, email, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    
    const methods = result.rows.map(m => ({
      id: m.id,
      type: m.type,
      brand: m.brand,
      last4: m.last4,
      expiry: m.expiry,
      cardholderName: m.cardholder_name,
      email: m.email,
      isDefault: m.is_default,
      createdAt: m.created_at,
      displayName: m.type === 'card' 
        ? `${m.brand || 'Card'} ending in ${m.last4}`
        : m.type === 'paypal' 
          ? `PayPal (${m.email})`
          : m.type === 'bank'
            ? 'Bank Account'
            : 'Payment Method'
    }));
    
    res.json(methods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
});

// POST /api/payments/methods - Add a payment method
router.post('/methods', paymentMethodValidation, validate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, brand, last4, expiry, cardholderName, email, isDefault } = req.body;
    
    // Validate based on type
    if (type === 'card' && !last4) {
      return res.status(400).json({ message: 'Last 4 digits are required for cards' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      if (isDefault) {
        await client.query(
          'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }
      
      const result = await client.query(
        `INSERT INTO payment_methods (
          user_id, type, brand, last4, expiry, cardholder_name, email, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, type, brand, last4, expiry, cardholderName, email, isDefault || false]
      );
      
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Failed to add payment method' });
  }
});

// PUT /api/payments/methods/:id/default - Set default payment method
router.put('/methods/:id/default', async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = req.params.id;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verify method belongs to user
      const check = await client.query(
        'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
        [methodId, userId]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      
      await client.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [userId]
      );
      
      await client.query(
        'UPDATE payment_methods SET is_default = true WHERE id = $1',
        [methodId]
      );
      
      await client.query('COMMIT');
      res.json({ message: 'Default payment method updated' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ message: 'Failed to update default payment method' });
  }
});

// DELETE /api/payments/methods/:id - Delete a payment method
router.delete('/methods/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = req.params.id;
    
    const result = await pool.query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING id',
      [methodId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ message: 'Failed to delete payment method' });
  }
});

// =========================================================================
// PAYMENT SUMMARY & HISTORY
// =========================================================================

// GET /api/payments/summary - Get payment summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query;
    if (userRole === 'customer') {
      query = `
        SELECT 
          COALESCE(SUM(p.amount), 0) as total_spent,
          COUNT(p.id) as total_payments,
          COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as refunded_payments,
          COALESCE(SUM(p.commission_amount), 0) as total_commission
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE b.customer_id = $1 AND p.status = 'paid'
      `;
    } else if (userRole === 'provider') {
      query = `
        SELECT 
          COALESCE(SUM(p.provider_amount), 0) as total_earned,
          COUNT(p.id) as total_payments,
          COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as refunded_payments,
          COALESCE(SUM(p.commission_amount), 0) as total_commission
        FROM payments p
        WHERE p.provider_id = $1
      `;
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ message: 'Failed to fetch payment summary' });
  }
});

// GET /api/payments/history - Get payment history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = ['(b.customer_id = $1 OR b.provider_id = $1)'];
    let params = [userId];
    let paramIndex = 2;
    
    if (status) {
      conditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    const whereClause = conditions.join(' AND ');
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        p.id,
        p.transaction_id,
        p.amount,
        p.commission_amount,
        p.provider_amount,
        p.payment_method,
        p.status,
        p.created_at,
        b.id as booking_id,
        s.title as service_title,
        u.name as customer_name,
        u2.name as provider_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.customer_id = u.id
      JOIN users u2 ON b.provider_id = u2.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      payments: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// =========================================================================
// REFUNDS
// =========================================================================

// POST /api/payments/:id/refund - Process a refund
router.post('/:id/refund', refundValidation, validate, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const userId = req.user.id;
    const { amount, reason } = req.body;
    
    // Verify payment exists and belongs to user (if customer)
    const paymentCheck = await pool.query(
      `SELECT p.*, b.customer_id, b.provider_id 
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE p.id = $1 AND (b.customer_id = $2 OR b.provider_id = $2)`,
      [paymentId, userId]
    );
    
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    const payment = paymentCheck.rows[0];
    
    if (payment.status !== 'paid') {
      return res.status(400).json({ message: 'Payment cannot be refunded' });
    }
    
    if (parseFloat(amount) > parseFloat(payment.amount)) {
      return res.status(400).json({ message: 'Refund amount exceeds payment amount' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update payment status
      await client.query(
        `UPDATE payments 
         SET status = 'refunded', 
             refund_amount = $1, 
             refund_reason = $2, 
             refunded_at = NOW(),
             updated_at = NOW()
         WHERE id = $3`,
        [amount, reason, paymentId]
      );
      
      // Update booking payment status
      await client.query(
        `UPDATE bookings SET payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
        [payment.booking_id]
      );
      
      // Reverse provider balance
      await client.query(
        `UPDATE wallets 
         SET balance = balance - $1, 
             total_withdrawn = total_withdrawn - $1, 
             updated_at = NOW()
         WHERE user_id = $2`,
        [payment.provider_amount, payment.provider_id]
      );
      
      // Add refund transaction
      await client.query(
        `INSERT INTO transactions (
          user_id, amount, type, status, description, balance_after
        ) VALUES ($1, $2, 'debit', 'completed', $3, 
          (SELECT balance FROM wallets WHERE user_id = $1))`,
        [payment.provider_id, -payment.provider_amount, `Refund for payment #${paymentId}`]
      );
      
      await client.query('COMMIT');
      res.json({ message: 'Refund processed successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
});

// =========================================================================
// ADMIN PAYMENT MANAGEMENT
// =========================================================================

// GET /api/payments/admin/all - Get all payments (admin only)
router.get('/admin/all', authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`p.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (startDate) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `SELECT COUNT(*) as total FROM payments p ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const query = `
      SELECT 
        p.*,
        b.id as booking_id,
        u.name as customer_name,
        u.email as customer_email,
        u2.name as provider_name,
        u2.email as provider_email,
        s.title as service_title
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.customer_id = u.id
      JOIN users u2 ON b.provider_id = u2.id
      JOIN services s ON b.service_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      payments: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// GET /api/payments/admin/stats - Get payment stats (admin only)
router.get('/admin/stats', authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as total_commission,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COALESCE(AVG(amount), 0) as average_amount
      FROM payments
    `);
    
    // Get monthly revenue breakdown
    const monthly = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments
      WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month, EXTRACT(MONTH FROM created_at)
      ORDER BY MIN(created_at)
    `);
    
    res.json({
      ...result.rows[0],
      monthlyRevenue: monthly.rows
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Failed to fetch payment stats' });
  }
});

export default router;