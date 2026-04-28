import express from 'express';
import pool from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: get or create wallet for user
const getWallet = async (userId) => {
  let wallet = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
  if (wallet.rows.length === 0) {
    const result = await pool.query(
      `INSERT INTO wallets (user_id, balance, points, tier, lifetime_earnings)
       VALUES ($1, 0, 0, 'Bronze', 0) RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }
  return wallet.rows[0];
};

// GET /api/wallet – get wallet data
router.get('/wallet', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getWallet(userId);
    // Calculate points to next tier
    let pointsToNext = 0;
    let nextTier = '';
    if (wallet.tier === 'Bronze') { pointsToNext = 500 - wallet.points; nextTier = 'Silver'; }
    else if (wallet.tier === 'Silver') { pointsToNext = 1000 - wallet.points; nextTier = 'Gold'; }
    else if (wallet.tier === 'Gold') { pointsToNext = 2000 - wallet.points; nextTier = 'Platinum'; }
    else { pointsToNext = 0; nextTier = 'Max'; }
    
    // Get this month & last month earnings from transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'credit' AND status = 'completed' AND created_at >= $2`,
      [userId, startOfMonth]
    );
    const lastMonthRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'credit' AND status = 'completed' 
       AND created_at >= $2 AND created_at < $3`,
      [userId, startOfLastMonth, startOfMonth]
    );
    
    res.json({
      balance: parseFloat(wallet.balance),
      points: wallet.points,
      tier: wallet.tier,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNext),
      lifetimeEarnings: parseFloat(wallet.lifetime_earnings),
      pendingPayout: parseFloat(wallet.pending_payout || 0),
      totalWithdrawn: parseFloat(wallet.total_withdrawn || 0),
      thisMonthEarnings: parseFloat(thisMonthRes.rows[0].total),
      lastMonthEarnings: parseFloat(lastMonthRes.rows[0].total),
      currency: 'USD',
      withdrawalLimit: 10000,
      minWithdrawal: 50,
      maxWithdrawal: 5000,
      dailyWithdrawalLimit: 2000
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/wallet/transactions
router.get('/wallet/transactions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, amount, type, status, description, balance_after as balance, created_at as date
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    const formatted = result.rows.map(t => ({
      id: t.id,
      date: t.date.toISOString().split('T')[0],
      description: t.description,
      amount: parseFloat(t.amount),
      status: t.status,
      balance: parseFloat(t.balance)
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/wallet/rewards
router.get('/wallet/rewards', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, points_required as points,
              value, type, color, popular, limit_info as limit
       FROM rewards
       ORDER BY points_required`
    );
    const rewards = result.rows.map(r => ({
      ...r,
      icon: r.type === 'cash' ? 'FaDollarSign' : r.type === 'commission' ? 'FaPercentage' : r.type === 'service' ? 'FaRocket' : 'FaCrown'
    }));
    res.json(rewards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/wallet/redeem-history
router.get('/wallet/redeem-history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT rh.id, rh.code, rh.status, rh.redeemed_at as date, rh.expires_at,
              r.name as reward, r.points_required as points
       FROM redeem_history rh
       JOIN rewards r ON rh.reward_id = r.id
       WHERE rh.user_id = $1
       ORDER BY rh.redeemed_at DESC`,
      [userId]
    );
    const formatted = result.rows.map(r => ({
      id: r.id,
      reward: r.reward,
      points: r.points,
      status: r.status,
      code: r.code,
      date: r.date.toISOString().split('T')[0],
      expiresAt: r.expires_at ? r.expires_at.toISOString().split('T')[0] : null
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ FIXED: GET /api/wallet/payment-methods – build name from existing columns
router.get('/wallet/payment-methods', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    // Use the actual columns from your payment_methods table
    const result = await pool.query(
      `SELECT id, type, brand, last4, expiry, cardholder_name, email, is_default
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC`,
      [userId]
    );
    const methods = result.rows.map(m => {
      let name = '';
      if (m.type === 'paypal') {
        name = `PayPal (${m.email})`;
      } else if (m.brand && m.last4) {
        name = `${m.brand} ending in ${m.last4}`;
      } else if (m.last4) {
        name = `Card ending in ${m.last4}`;
      } else {
        name = 'Payment Method';
      }
      return {
        id: m.id,
        type: m.type,
        name,
        details: {
          expiry: m.expiry,
          email: m.email,
          last4: m.last4,
          cardholderName: m.cardholder_name
        },
        isDefault: m.is_default,
        icon: m.type === 'card' ? 'FaCreditCard' : 'FaPaypal'
      };
    });
    res.json(methods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/wallet/withdrawal-methods
router.get('/wallet/withdrawal-methods', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, type, name, details, is_default
       FROM withdrawal_methods
       WHERE user_id = $1
       ORDER BY is_default DESC`,
      [userId]
    );
    const methods = result.rows.map(m => ({
      id: m.id,
      type: m.type,
      name: m.name,
      details: m.details,
      isDefault: m.is_default,
      icon: m.type === 'card' ? 'FaCreditCard' : m.type === 'paypal' ? 'FaPaypal' : 'FaUniversity'
    }));
    res.json(methods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/wallet/add-funds
router.post('/wallet/add-funds', protect, async (req, res) => {
  const { amount, paymentMethodId } = req.body;
  const userId = req.user.id;
  if (!amount || amount < 10) return res.status(400).json({ message: 'Minimum $10' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await getWallet(userId);
    const newBalance = parseFloat(wallet.balance) + amount;
    await client.query(
      `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newBalance, userId]
    );
    const txRef = 'ADD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, status, description, balance_after, reference)
       VALUES ($1, $2, 'credit', 'completed', $3, $4, $5)`,
      [userId, amount, `Added funds via payment method`, newBalance, txRef]
    );
    await client.query('COMMIT');
    res.json({ transactionId: txRef });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Add funds failed' });
  } finally {
    client.release();
  }
});

// POST /api/wallet/withdraw
router.post('/wallet/withdraw', protect, async (req, res) => {
  const { amount, withdrawalMethodId } = req.body;
  const userId = req.user.id;
  const wallet = await getWallet(userId);
  if (!amount || amount < 50 || amount > wallet.balance) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const newBalance = parseFloat(wallet.balance) - amount;
    await client.query(
      `UPDATE wallets SET balance = $1, total_withdrawn = total_withdrawn + $2, updated_at = NOW() WHERE user_id = $3`,
      [newBalance, amount, userId]
    );
    const txRef = 'WTH-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, status, description, balance_after, reference)
       VALUES ($1, $2, 'debit', 'pending', $3, $4, $5)`,
      [userId, -amount, `Withdrawal request to method ID ${withdrawalMethodId}`, newBalance, txRef]
    );
    await client.query('COMMIT');
    res.json({ transactionId: txRef });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Withdrawal failed' });
  } finally {
    client.release();
  }
});

// POST /api/wallet/redeem
router.post('/wallet/redeem', protect, async (req, res) => {
  const { rewardId } = req.body;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rewardRes = await client.query('SELECT * FROM rewards WHERE id = $1', [rewardId]);
    if (rewardRes.rows.length === 0) throw new Error('Reward not found');
    const reward = rewardRes.rows[0];
    const wallet = await getWallet(userId);
    if (wallet.points < reward.points_required) throw new Error('Insufficient points');
    const newPoints = wallet.points - reward.points_required;
    await client.query(`UPDATE wallets SET points = $1 WHERE user_id = $2`, [newPoints, userId]);
    const code = `${reward.type.toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await client.query(
      `INSERT INTO redeem_history (user_id, reward_id, code, status, expires_at)
       VALUES ($1, $2, $3, 'active', $4)`,
      [userId, rewardId, code, expiresAt]
    );
    if (reward.type === 'cash') {
      const newBalance = parseFloat(wallet.balance) + parseFloat(reward.value);
      await client.query(`UPDATE wallets SET balance = $1 WHERE user_id = $2`, [newBalance, userId]);
      await client.query(
        `INSERT INTO transactions (user_id, amount, type, status, description, balance_after)
         VALUES ($1, $2, 'credit', 'completed', $3, $4)`,
        [userId, reward.value, `Redeemed: ${reward.name}`, newBalance]
      );
    }
    await client.query('COMMIT');
    res.json({ code });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: error.message || 'Redemption failed' });
  } finally {
    client.release();
  }
});

export default router;