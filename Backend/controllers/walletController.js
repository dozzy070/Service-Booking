// controllers/walletController.js
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

// =========================================================================
// GET WALLET
// =========================================================================

export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getWallet(userId);

    // Calculate points to next tier
    let pointsToNext = 0;
    let nextTier = '';
    if (wallet.tier === 'Bronze') { pointsToNext = 500 - wallet.points; nextTier = 'Silver'; }
    else if (wallet.tier === 'Silver') { pointsToNext = 1000 - wallet.points; nextTier = 'Gold'; }
    else if (wallet.tier === 'Gold') { pointsToNext = 2000 - wallet.points; nextTier = 'Platinum'; }
    else if (wallet.tier === 'Platinum') { pointsToNext = 5000 - wallet.points; nextTier = 'Diamond'; }
    else { pointsToNext = 0; nextTier = 'Max'; }

    // Get this month & last month earnings from transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

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

    // Get pending payouts
    const pendingPayouts = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'debit' AND status = 'pending'`,
      [userId]
    );

    res.json({
      balance: parseFloat(wallet.balance),
      points: wallet.points,
      tier: wallet.tier,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNext),
      lifetimeEarnings: parseFloat(wallet.lifetime_earnings || 0),
      pendingPayout: parseFloat(pendingPayouts.rows[0].total || 0),
      totalWithdrawn: parseFloat(wallet.total_withdrawn || 0),
      thisMonthEarnings: parseFloat(thisMonthRes.rows[0].total),
      lastMonthEarnings: parseFloat(lastMonthRes.rows[0].total),
      currency: 'NGN',
      withdrawalLimit: 500000,
      minWithdrawal: 5000,
      maxWithdrawal: 200000,
      dailyWithdrawalLimit: 100000
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Failed to fetch wallet data' });
  }
};

// =========================================================================
// GET TRANSACTIONS
// =========================================================================

export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type, status, startDate, endDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (type && type !== 'all') {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM transactions WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
      SELECT id, amount, type, status, description, balance_after, reference, created_at as date
      FROM transactions
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    const formatted = result.rows.map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: parseFloat(t.amount),
      type: t.type,
      status: t.status,
      balance: parseFloat(t.balance_after || 0),
      reference: t.reference
    }));

    res.json({
      transactions: formatted,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// =========================================================================
// GET REWARDS
// =========================================================================

export const getRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await getWallet(userId);

    const result = await pool.query(
      `SELECT id, name, description, points_required, value, type, color, popular, icon, limit_info
       FROM rewards
       WHERE is_active = true
       ORDER BY points_required ASC`
    );

    const rewards = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      points: r.points_required,
      value: parseFloat(r.value),
      type: r.type,
      color: r.color || '#10b981',
      popular: r.popular || false,
      icon: r.icon || (r.type === 'cash' ? 'FaDollarSign' : 
                       r.type === 'commission' ? 'FaPercentage' : 
                       r.type === 'service' ? 'FaRocket' : 'FaCrown'),
      isAvailable: wallet.points >= r.points_required,
      limit: r.limit_info || 'Unlimited'
    }));

    res.json(rewards);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ message: 'Failed to fetch rewards' });
  }
};

// =========================================================================
// GET REDEEM HISTORY
// =========================================================================

export const getRedeemHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT rh.id, rh.code, rh.status, rh.redeemed_at, rh.expires_at,
              r.name as reward_name, r.points_required as points, r.type as reward_type
       FROM redeem_history rh
       JOIN rewards r ON rh.reward_id = r.id
       WHERE rh.user_id = $1
       ORDER BY rh.redeemed_at DESC
       LIMIT $2`,
      [userId, parseInt(limit)]
    );

    const formatted = result.rows.map(r => ({
      id: r.id,
      reward: r.reward_name,
      points: r.points,
      status: r.status,
      code: r.code,
      date: r.redeemed_at,
      expiresAt: r.expires_at,
      type: r.reward_type
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get redeem history error:', error);
    res.status(500).json({ message: 'Failed to fetch redemption history' });
  }
};

// =========================================================================
// PAYMENT METHODS
// =========================================================================

export const getWalletPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, type, brand, last4, expiry, cardholder_name, email, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    const methods = result.rows.map(m => {
      let name = '';
      if (m.type === 'paypal') {
        name = `PayPal (${m.email})`;
      } else if (m.brand && m.last4) {
        name = `${m.brand} ****${m.last4}`;
      } else if (m.last4) {
        name = `Card ****${m.last4}`;
      } else {
        name = 'Payment Method';
      }
      return {
        id: m.id,
        type: m.type,
        name,
        brand: m.brand,
        last4: m.last4,
        expiry: m.expiry,
        cardholderName: m.cardholder_name,
        email: m.email,
        isDefault: m.is_default,
        icon: m.type === 'card' ? 'FaCreditCard' : 'FaPaypal',
        created_at: m.created_at
      };
    });

    res.json(methods);
  } catch (error) {
    console.error('Get wallet payment methods error:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

export const addWalletPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, brand, last4, expiry, cardholderName, email, isDefault } = req.body;

    if (!type || !last4) {
      return res.status(400).json({ message: 'Type and last4 are required' });
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
        `INSERT INTO payment_methods (user_id, type, brand, last4, expiry, cardholder_name, email, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
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
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Failed to add payment method' });
  }
};

export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = req.params.id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

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
    console.error('Set default payment method error:', error);
    res.status(500).json({ message: 'Failed to set default payment method' });
  }
};

export const deletePaymentMethod = async (req, res) => {
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
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Failed to delete payment method' });
  }
};

// =========================================================================
// WITHDRAWAL METHODS
// =========================================================================

export const getWithdrawalMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, type, name, details, is_default
       FROM withdrawal_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, name`,
      [userId]
    );

    const methods = result.rows.map(m => ({
      id: m.id,
      type: m.type,
      name: m.name,
      details: m.details,
      isDefault: m.is_default,
      icon: m.type === 'card' ? 'FaCreditCard' : 
            m.type === 'paypal' ? 'FaPaypal' : 
            m.type === 'bank' ? 'FaUniversity' : 'FaWallet'
    }));

    res.json(methods);
  } catch (error) {
    console.error('Get withdrawal methods error:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawal methods' });
  }
};

export const addWithdrawalMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, name, details, isDefault } = req.body;

    if (!type || !name) {
      return res.status(400).json({ message: 'Type and name are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (isDefault) {
        await client.query(
          'UPDATE withdrawal_methods SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      const result = await client.query(
        `INSERT INTO withdrawal_methods (user_id, type, name, details, is_default)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, type, name, details, isDefault || false]
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
    console.error('Add withdrawal method error:', error);
    res.status(500).json({ message: 'Failed to add withdrawal method' });
  }
};

export const deleteWithdrawalMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = req.params.id;

    const result = await pool.query(
      'DELETE FROM withdrawal_methods WHERE id = $1 AND user_id = $2 RETURNING id',
      [methodId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Withdrawal method not found' });
    }

    res.json({ message: 'Withdrawal method deleted' });
  } catch (error) {
    console.error('Delete withdrawal method error:', error);
    res.status(500).json({ message: 'Failed to delete withdrawal method' });
  }
};

// =========================================================================
// ADD FUNDS
// =========================================================================

export const addFunds = async (req, res) => {
  const { amount, paymentMethodId } = req.body;
  const userId = req.user.id;

  if (!amount || amount < 1000) {
    return res.status(400).json({ message: 'Minimum deposit is ₦1,000' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const wallet = await getWallet(userId);
    const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

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
    res.json({
      transactionId: txRef,
      newBalance,
      message: 'Funds added successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add funds error:', error);
    res.status(500).json({ message: 'Failed to add funds' });
  } finally {
    client.release();
  }
};

// =========================================================================
// WITHDRAW FUNDS
// =========================================================================

export const withdrawFunds = async (req, res) => {
  const { amount, withdrawalMethodId } = req.body;
  const userId = req.user.id;

  const wallet = await getWallet(userId);

  if (!amount || amount < 5000) {
    return res.status(400).json({ message: 'Minimum withdrawal is ₦5,000' });
  }
  if (amount > wallet.balance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }
  if (amount > 200000) {
    return res.status(400).json({ message: 'Maximum withdrawal is ₦200,000' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const newBalance = parseFloat(wallet.balance) - parseFloat(amount);

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
    res.json({
      transactionId: txRef,
      newBalance,
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Withdraw error:', error);
    res.status(500).json({ message: 'Withdrawal failed' });
  } finally {
    client.release();
  }
};

// =========================================================================
// REDEEM REWARD
// =========================================================================

export const redeemReward = async (req, res) => {
  const { rewardId } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get reward details
    const rewardRes = await client.query(
      'SELECT * FROM rewards WHERE id = $1 AND is_active = true',
      [rewardId]
    );

    if (rewardRes.rows.length === 0) {
      throw new Error('Reward not found or inactive');
    }

    const reward = rewardRes.rows[0];
    const wallet = await getWallet(userId);

    // Check if user has enough points
    if (wallet.points < reward.points_required) {
      throw new Error('Insufficient points');
    }

    // Deduct points
    const newPoints = wallet.points - reward.points_required;
    await client.query(
      `UPDATE wallets SET points = $1, updated_at = NOW() WHERE user_id = $2`,
      [newPoints, userId]
    );

    // Generate redemption code
    const code = `${reward.type.toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Save redemption record
    await client.query(
      `INSERT INTO redeem_history (user_id, reward_id, code, status, expires_at)
       VALUES ($1, $2, $3, 'active', $4) RETURNING id`,
      [userId, rewardId, code, expiresAt]
    );

    // If cash reward, add to balance
    if (reward.type === 'cash') {
      const newBalance = parseFloat(wallet.balance) + parseFloat(reward.value);
      await client.query(
        `UPDATE wallets SET balance = $1 WHERE user_id = $2`,
        [newBalance, userId]
      );

      await client.query(
        `INSERT INTO transactions (user_id, amount, type, status, description, balance_after)
         VALUES ($1, $2, 'credit', 'completed', $3, $4)`,
        [userId, reward.value, `Redeemed: ${reward.name}`, newBalance]
      );
    }

    await client.query('COMMIT');
    res.json({
      code,
      message: `Successfully redeemed ${reward.name}`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Redeem error:', error);
    res.status(500).json({ message: error.message || 'Redemption failed' });
  } finally {
    client.release();
  }
};

// =========================================================================
// WALLET STATISTICS
// =========================================================================

export const getWalletStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        COUNT(CASE WHEN type = 'credit' AND status = 'completed' THEN 1 END) as total_credits,
        COUNT(CASE WHEN type = 'debit' AND status = 'completed' THEN 1 END) as total_debits,
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_credited,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_debited,
        COUNT(CASE WHEN type = 'debit' AND status = 'pending' THEN 1 END) as pending_withdrawals
      FROM transactions
      WHERE user_id = $1
    `, [userId]);

    res.json({
      totalCredits: parseInt(result.rows[0].total_credits),
      totalDebits: parseInt(result.rows[0].total_debits),
      totalCredited: parseFloat(result.rows[0].total_credited),
      totalDebited: parseFloat(result.rows[0].total_debited),
      pendingWithdrawals: parseInt(result.rows[0].pending_withdrawals)
    });
  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({ message: 'Failed to fetch wallet statistics' });
  }
};

// =========================================================================
// PAYMENT SUMMARY
// =========================================================================

export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_withdrawals,
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_deposits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as monthly_withdrawals
      FROM transactions
      WHERE user_id = $1
    `, [userId]);

    res.json({
      totalDeposits: parseFloat(result.rows[0].total_deposits),
      totalWithdrawals: parseFloat(result.rows[0].total_withdrawals),
      monthlyDeposits: parseFloat(result.rows[0].monthly_deposits),
      monthlyWithdrawals: parseFloat(result.rows[0].monthly_withdrawals)
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ message: 'Failed to fetch payment summary' });
  }
};