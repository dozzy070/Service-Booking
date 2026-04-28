import pool from '../config/db.js';

// Get all payment methods for the logged-in user
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, type, brand, last4, expiry, cardholder_name, email, is_default
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
      isDefault: row.is_default
    }));
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

// Add a new payment method (card or PayPal)
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
      else brand = 'Card';
      last4 = cardNumber.slice(-4);
      cardholder = cardholderName;
      exp = expiry;
    } else if (type === 'paypal') {
      if (!email) return res.status(400).json({ message: 'PayPal email required' });
      brand = 'PayPal';
    } else {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    // If setAsDefault, clear existing default for this user
    if (setAsDefault) {
      await pool.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO payment_methods 
       (user_id, type, brand, last4, expiry, cardholder_name, email, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, brand, last4, expiry, cardholder_name, email, is_default`,
      [userId, type, brand, last4, exp, cardholder, email, setAsDefault || false]
    );

    const newMethod = result.rows[0];
    res.status(201).json({
      id: newMethod.id,
      type: newMethod.type,
      brand: newMethod.brand,
      last4: newMethod.last4,
      expiry: newMethod.expiry,
      cardholderName: newMethod.cardholder_name,
      email: newMethod.email,
      isDefault: newMethod.is_default
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Failed to add payment method' });
  }
};

// Set a payment method as default
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

    // Clear existing default and set new default
    await pool.query('BEGIN');
    await pool.query(
      'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
      [userId]
    );
    await pool.query(
      'UPDATE payment_methods SET is_default = true WHERE id = $1',
      [methodId]
    );
    await pool.query('COMMIT');

    res.json({ success: true, message: 'Default payment method updated' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Set default payment method error:', error);
    res.status(500).json({ message: 'Failed to update default payment method' });
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = parseInt(req.params.id);

    const result = await pool.query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2 RETURNING id',
      [methodId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.json({ success: true, message: 'Payment method deleted' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Failed to delete payment method' });
  }
};

// Get payment summary (total spent, pending, refunds, wallet balance)
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // total spent from completed bookings with paid status
    const totalSpentRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_spent
       FROM bookings
       WHERE customer_id = $1 AND payment_status = 'paid' AND status = 'completed'`,
      [userId]
    );
    const totalSpent = parseFloat(totalSpentRes.rows[0].total_spent);

    // pending payments from unpaid confirmed bookings
    const pendingRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as pending
       FROM bookings
       WHERE customer_id = $1 AND payment_status != 'paid' AND status IN ('pending', 'confirmed', 'upcoming')`,
      [userId]
    );
    const pendingPayments = parseFloat(pendingRes.rows[0].pending);

    // refunds (if you have a refunds table, otherwise 0)
    // For now, assume no refunds implemented
    const refunds = 0;

    // wallet balance (if you have a wallet system)
    const walletRes = await pool.query(
      `SELECT COALESCE(wallet_balance, 0) as balance FROM users WHERE id = $1`,
      [userId]
    );
    const walletBalance = parseFloat(walletRes.rows[0].balance || 0);

    res.json({
      totalSpent,
      pendingPayments,
      refunds,
      walletBalance
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Failed to fetch payment summary' });
  }
};
// Confirm payment and send email
export const confirmPayment = async (req, res) => {
  try {
    const { bookingId, transactionId, amount } = req.body;
    const userId = req.user.id;

    // Get booking details
    const bookingResult = await pool.query(
      `SELECT b.*, s.title as service_title, u.name as provider_name
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

    // Update payment status
    await pool.query(
      'UPDATE bookings SET payment_status = $1, updated_at = NOW() WHERE id = $2',
      ['paid', bookingId]
    );

    // Create transaction record
    const transaction = {
      id: transactionId,
      amount: amount,
      bookingId: bookingId,
      date: new Date()
    };

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      booking: {
        id: booking.id,
        service_title: booking.service_title,
        provider_name: booking.provider_name,
        total_amount: booking.total_amount,
        payment_status: 'paid'
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
};