// controllers/paymentController.js
import pool from '../config/db.js';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// =========================================================================
// GET PAYMENT METHODS
// =========================================================================

export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, type, brand, last4, expiry, cardholder_name, email, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    
    const methods = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      brand: row.brand,
      last4: row.last4,
      expiry: row.expiry,
      cardholderName: row.cardholder_name,
      email: row.email,
      isDefault: row.is_default,
      displayName: row.type === 'card' 
        ? `${row.brand || 'Card'} ending in ${row.last4}`
        : row.type === 'paypal' 
          ? `PayPal (${row.email})`
          : 'Payment Method',
      createdAt: row.created_at
    }));
    
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

// =========================================================================
// ADD PAYMENT METHOD
// =========================================================================

export const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, cardNumber, cardholderName, expiry, cvv, email, setAsDefault } = req.body;

    // Note: In production, you should tokenize card details using Stripe/PayPal SDK.
    // Here we only store the last 4 digits and other non‑sensitive info.
    let brand = null;
    let last4 = null;
    let cardholder = null;
    let exp = null;

    if (type === 'card') {
      if (!cardNumber || !cardholderName || !expiry) {
        return res.status(400).json({ message: 'Card details incomplete' });
      }
      // Determine brand from first digit(s) – basic example
      const firstDigit = cardNumber.charAt(0);
      if (firstDigit === '4') brand = 'Visa';
      else if (firstDigit === '5') brand = 'Mastercard';
      else if (firstDigit === '3') brand = 'Amex';
      else if (firstDigit === '6') brand = 'Discover';
      else brand = 'Card';
      last4 = cardNumber.slice(-4);
      cardholder = cardholderName;
      exp = expiry;
    } else if (type === 'paypal') {
      if (!email) return res.status(400).json({ message: 'PayPal email required' });
      brand = 'PayPal';
    } else if (type === 'bank') {
      if (!email) return res.status(400).json({ message: 'Bank account details required' });
      brand = 'Bank';
    } else {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If setAsDefault, clear existing default for this user
      if (setAsDefault) {
        await client.query(
          'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      const result = await client.query(
        `INSERT INTO payment_methods 
         (user_id, type, brand, last4, expiry, cardholder_name, email, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, type, brand, last4, expiry, cardholder_name, email, is_default`,
        [userId, type, brand, last4, exp, cardholder, email, setAsDefault || false]
      );

      await client.query('COMMIT');

      const newMethod = result.rows[0];
      res.status(201).json({
        id: newMethod.id,
        type: newMethod.type,
        brand: newMethod.brand,
        last4: newMethod.last4,
        expiry: newMethod.expiry,
        cardholderName: newMethod.cardholder_name,
        email: newMethod.email,
        isDefault: newMethod.is_default,
        displayName: newMethod.type === 'card' 
          ? `${newMethod.brand || 'Card'} ending in ${newMethod.last4}`
          : newMethod.type === 'paypal' 
            ? `PayPal (${newMethod.email})`
            : 'Payment Method'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Failed to add payment method' });
  }
};

// =========================================================================
// SET DEFAULT PAYMENT METHOD
// =========================================================================

export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = parseInt(req.params.id);

    // Verify method belongs to user
    const check = await pool.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [methodId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [userId]
      );
      
      await client.query(
        'UPDATE payment_methods SET is_default = true WHERE id = $1',
        [methodId]
      );
      
      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Default payment method updated' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ message: 'Failed to update default payment method' });
  }
};

// =========================================================================
// DELETE PAYMENT METHOD
// =========================================================================

export const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = parseInt(req.params.id);

    // Check if it's the only method
    const countCheck = await pool.query(
      'SELECT COUNT(*) as count FROM payment_methods WHERE user_id = $1',
      [userId]
    );

    if (parseInt(countCheck.rows[0].count) <= 1) {
      return res.status(400).json({ 
        message: 'Cannot delete the only payment method. Add another method first.' 
      });
    }

    // Check if it's the default method
    const defaultCheck = await pool.query(
      'SELECT is_default FROM payment_methods WHERE id = $1 AND user_id = $2',
      [methodId, userId]
    );

    const result = await pool.query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING id',
      [methodId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // If it was the default, set another method as default
    if (defaultCheck.rows.length > 0 && defaultCheck.rows[0].is_default) {
      await pool.query(
        'UPDATE payment_methods SET is_default = true WHERE user_id = $1 LIMIT 1',
        [userId]
      );
    }

    res.json({ success: true, message: 'Payment method deleted' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Failed to delete payment method' });
  }
};

// =========================================================================
// GET PAYMENT SUMMARY
// =========================================================================

export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total spent from completed bookings with paid status
    const totalSpentRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_spent
       FROM bookings
       WHERE customer_id = $1 AND payment_status = 'paid' AND status = 'completed'`,
      [userId]
    );
    const totalSpent = parseFloat(totalSpentRes.rows[0].total_spent);

    // Pending payments from unpaid confirmed bookings
    const pendingRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as pending
       FROM bookings
       WHERE customer_id = $1 AND payment_status != 'paid' AND status IN ('pending', 'confirmed', 'upcoming')`,
      [userId]
    );
    const pendingPayments = parseFloat(pendingRes.rows[0].pending);

    // Refunds (from payments table)
    const refundsRes = await pool.query(
      `SELECT COALESCE(SUM(refund_amount), 0) as refunds
       FROM payments
       WHERE user_id = $1 AND status = 'refunded'`,
      [userId]
    );
    const refunds = parseFloat(refundsRes.rows[0].refunds);

    // Wallet balance
    const walletRes = await pool.query(
      `SELECT COALESCE(wallet_balance, 0) as balance FROM users WHERE id = $1`,
      [userId]
    );
    const walletBalance = parseFloat(walletRes.rows[0].balance || 0);

    // Payment methods count
    const methodsCount = await pool.query(
      'SELECT COUNT(*) as count FROM payment_methods WHERE user_id = $1',
      [userId]
    );

    // Recent transactions
    const recentTransactions = await pool.query(`
      SELECT id, amount, type, status, description, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      totalSpent,
      pendingPayments,
      refunds,
      walletBalance,
      paymentMethodsCount: parseInt(methodsCount.rows[0].count),
      recentTransactions: recentTransactions.rows.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        type: t.type,
        status: t.status,
        description: t.description,
        date: t.created_at
      })),
      currency: 'NGN'
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Failed to fetch payment summary' });
  }
};

// =========================================================================
// CONFIRM PAYMENT
// =========================================================================

export const confirmPayment = async (req, res) => {
  const { bookingId, transactionId, amount, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!bookingId || !transactionId || !amount) {
    return res.status(400).json({ message: 'Booking ID, transaction ID, and amount are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get booking details
    const bookingResult = await client.query(
      `SELECT b.*, s.title as service_title, s.price as service_price, 
              u.id as provider_id, u.name as provider_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.provider_id = u.id
       WHERE b.id = $1 AND b.customer_id = $2`,
      [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check if already paid
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    // Calculate commission (10%)
    const commissionRate = 0.10;
    const commissionAmount = parseFloat(amount) * commissionRate;
    const providerAmount = parseFloat(amount) - commissionAmount;

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

    // Update provider wallet
    await client.query(
      `UPDATE wallets SET balance = balance + $1, lifetime_earnings = lifetime_earnings + $1, updated_at = NOW()
       WHERE user_id = $2`,
      [providerAmount, booking.provider_id]
    );

    // Insert transaction record for provider
    await client.query(
      `INSERT INTO transactions (
        user_id, amount, type, status, description, balance_after
      ) VALUES ($1, $2, 'credit', 'completed', $3, 
        (SELECT balance FROM wallets WHERE user_id = $1))`,
      [booking.provider_id, providerAmount, `Payment for booking #${bookingId}`]
    );

    // Insert transaction record for customer
    await client.query(
      `INSERT INTO transactions (
        user_id, amount, type, status, description, balance_after
      ) VALUES ($1, $2, 'debit', 'completed', $3, 
        (SELECT balance FROM wallets WHERE user_id = $1))`,
      [userId, -amount, `Payment for booking #${bookingId} - ${booking.service_title}`]
    );

    // Create notification for provider
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'payment', 'Payment Received', 
               $2, $3, $4)`,
      [
        booking.provider_id,
        `You received ₦${providerAmount.toLocaleString()} for booking #${bookingId}`,
        JSON.stringify({ bookingId, amount, providerAmount }),
        `/provider/bookings/${bookingId}`
      ]
    );

    // Create notification for customer
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data, link)
       VALUES ($1, 'payment', 'Payment Confirmed', 
               $2, $3, $4)`,
      [
        userId,
        `Your payment of ₦${amount.toLocaleString()} for booking #${bookingId} was confirmed`,
        JSON.stringify({ bookingId, amount }),
        `/customer/bookings/${bookingId}`
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      payment: paymentResult.rows[0],
      booking: {
        id: booking.id,
        service_title: booking.service_title,
        provider_name: booking.provider_name,
        total_amount: booking.total_amount,
        payment_status: 'paid'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  } finally {
    client.release();
  }
};

// =========================================================================
// GET PAYMENT HISTORY
// =========================================================================

export const getPaymentHistory = async (req, res) => {
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
        p.*,
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
      payments: result.rows.map(p => ({
        id: p.id,
        transactionId: p.transaction_id,
        amount: parseFloat(p.amount),
        commissionAmount: parseFloat(p.commission_amount || 0),
        providerAmount: parseFloat(p.provider_amount || 0),
        paymentMethod: p.payment_method,
        status: p.status,
        createdAt: p.created_at,
        bookingId: p.booking_id,
        serviceTitle: p.service_title,
        customerName: p.customer_name,
        providerName: p.provider_name
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

// =========================================================================
// PROCESS REFUND
// =========================================================================

export const processRefund = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const userId = req.user.id;
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({ message: 'Amount and reason are required' });
    }

    // Verify payment exists and belongs to user (if customer)
    const paymentCheck = await pool.query(
      `SELECT p.*, b.customer_id, b.provider_id, b.total_amount
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

      // Reverse provider wallet balance
      const providerAmount = parseFloat(payment.provider_amount || 0);
      await client.query(
        `UPDATE wallets 
         SET balance = balance - $1, 
             total_withdrawn = total_withdrawn - $1, 
             updated_at = NOW()
         WHERE user_id = $2`,
        [providerAmount, payment.provider_id]
      );

      // Add refund transaction for provider
      await client.query(
        `INSERT INTO transactions (
          user_id, amount, type, status, description, balance_after
        ) VALUES ($1, $2, 'debit', 'completed', $3, 
          (SELECT balance FROM wallets WHERE user_id = $1))`,
        [payment.provider_id, -providerAmount, `Refund for payment #${paymentId} - ${reason}`]
      );

      // Add refund transaction for customer
      await client.query(
        `INSERT INTO transactions (
          user_id, amount, type, status, description, balance_after
        ) VALUES ($1, $2, 'credit', 'completed', $3, 
          (SELECT balance FROM wallets WHERE user_id = $1))`,
        [payment.user_id, amount, `Refund for payment #${paymentId} - ${reason}`]
      );

      await client.query('COMMIT');
      res.json({ 
        success: true, 
        message: 'Refund processed successfully',
        refundAmount: amount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Failed to process refund' });
  }
};

// =========================================================================
// GET PAYMENT STATISTICS (Admin)
// =========================================================================

export const getPaymentStats = async (req, res) => {
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

    // Monthly revenue breakdown
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
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch payment stats' });
  }
};