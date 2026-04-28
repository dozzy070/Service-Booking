import pool from '../config/db.js';

// Get wallet summary (balance, points, tier)
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's wallet balance and points
    const userRes = await pool.query(
      'SELECT wallet_balance, loyalty_points FROM users WHERE id = $1',
      [userId]
    );
    const balance = parseFloat(userRes.rows[0]?.wallet_balance || 0);
    const points = parseInt(userRes.rows[0]?.loyalty_points || 0);

    // Tier logic
    let tier = 'Bronze', nextTier = 'Silver', pointsToNextTier = 500;
    if (points >= 2000) { tier = 'Platinum'; nextTier = 'Platinum (max)'; pointsToNextTier = 0; }
    else if (points >= 1000) { tier = 'Gold'; nextTier = 'Platinum'; pointsToNextTier = 2000 - points; }
    else if (points >= 500) { tier = 'Silver'; nextTier = 'Gold'; pointsToNextTier = 1000 - points; }
    else { pointsToNextTier = 500 - points; }

    // Earnings summary
    const earningsRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'earning' AND amount > 0 THEN amount ELSE 0 END), 0) as lifetime_earnings,
        COALESCE(SUM(CASE WHEN type = 'earning' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN type = 'earning' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month') THEN amount ELSE 0 END), 0) as last_month
      FROM wallet_transactions
      WHERE user_id = $1 AND status = 'completed'
    `, [userId]);

    const pendingRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as pending_payout
      FROM wallet_transactions
      WHERE user_id = $1 AND type = 'withdrawal' AND status = 'pending'
    `, [userId]);

    const totalWithdrawnRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_withdrawn
      FROM wallet_transactions
      WHERE user_id = $1 AND type = 'withdrawal' AND status = 'completed'
    `, [userId]);

    res.json({
      balance,
      points,
      tier,
      nextTier,
      pointsToNextTier,
      lifetimeEarnings: parseFloat(earningsRes.rows[0].lifetime_earnings),
      thisMonthEarnings: parseFloat(earningsRes.rows[0].this_month),
      lastMonthEarnings: parseFloat(earningsRes.rows[0].last_month),
      pendingPayout: parseFloat(pendingRes.rows[0].pending_payout),
      totalWithdrawn: parseFloat(totalWithdrawnRes.rows[0].total_withdrawn),
      currency: 'USD',
      withdrawalLimit: 10000,
      minWithdrawal: 10,
      maxWithdrawal: 5000,
      dailyWithdrawalLimit: 2000
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Failed to fetch wallet data' });
  }
};

// Get transaction history
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query(`
      SELECT id, type, amount, balance_after, description, status, created_at as date, reference_id
      FROM wallet_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// Get available rewards
export const getRewards = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, points, type, value, icon, color, limit_per_user as "limit"
      FROM rewards
      WHERE is_active = true
      ORDER BY points ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ message: 'Failed to fetch rewards' });
  }
};

// Get user's redemption history
export const getRedeemHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT rh.id, r.name as reward, rh.points_spent as points, rh.reward_code as code,
             rh.status, rh.created_at as date, rh.expires_at as "expiresAt"
      FROM redemption_history rh
      JOIN rewards r ON rh.reward_id = r.id
      WHERE rh.user_id = $1
      ORDER BY rh.created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get redeem history error:', error);
    res.status(500).json({ message: 'Failed to fetch redemption history' });
  }
};

// Get payment methods for adding funds (from payment_methods table)
export const getWalletPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT id, type, brand, last4, expiry, cardholder_name as "cardholderName", email, is_default as "isDefault"
      FROM payment_methods
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);
    const methods = result.rows.map(m => ({
      id: m.id,
      name: m.type === 'paypal' ? 'PayPal' : `${m.brand} ending in ${m.last4}`,
      type: m.type,
      icon: m.type === 'paypal' ? '💳' : '💳',
      details: {
        expiry: m.expiry,
        email: m.email,
        last4: m.last4
      },
      isDefault: m.isdefault
    }));
    res.json(methods);
  } catch (error) {
    console.error('Get wallet payment methods error:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

// Get withdrawal methods
export const getWithdrawalMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT id, type, name, details, is_default as "isDefault"
      FROM withdrawal_methods
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);
    const methods = result.rows.map(m => {
      let icon = '🏦';
      if (m.type === 'paypal') icon = '💰';
      if (m.type === 'card') icon = '💳';
      let estimatedTime = '2-3 business days';
      if (m.type === 'paypal') estimatedTime = '1-2 hours';
      if (m.type === 'card') estimatedTime = '3-5 business days';
      return {
        id: m.id,
        name: m.name,
        type: m.type,
        icon,
        details: {
          ...m.details,
          estimatedTime
        },
        isDefault: m.isdefault
      };
    });
    res.json(methods);
  } catch (error) {
    console.error('Get withdrawal methods error:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawal methods' });
  }
};

// Add funds (simulate payment gateway)
export const addFunds = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { amount, paymentMethodId } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 10) {
      throw new Error('Minimum amount is $10');
    }

    // In production, integrate Stripe/PayPal here
    // For now, we'll simulate success
    const transactionId = `TXN_${Date.now()}_${userId}`;

    // Update wallet balance
    const updateRes = await client.query(`
      UPDATE users
      SET wallet_balance = wallet_balance + $1
      WHERE id = $2
      RETURNING wallet_balance
    `, [amount, userId]);
    const newBalance = parseFloat(updateRes.rows[0].wallet_balance);

    // Record transaction
    await client.query(`
      INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, status, reference_id)
      VALUES ($1, 'deposit', $2, $3, $4, 'completed', $5)
    `, [userId, amount, newBalance, `Added funds via ${paymentMethodId ? 'card' : 'method'}`, transactionId]);

    await client.query('COMMIT');
    res.json({ success: true, transactionId, newBalance });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add funds error:', error);
    res.status(500).json({ message: error.message || 'Failed to add funds' });
  } finally {
    client.release();
  }
};

// Withdraw funds
export const withdrawFunds = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { amount, withdrawalMethodId } = req.body;
    const userId = req.user.id;

    // Validate amount and balance
    const userRes = await client.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(userRes.rows[0].wallet_balance);
    if (amount > balance) throw new Error('Insufficient balance');
    if (amount < 10) throw new Error('Minimum withdrawal is $10');
    if (amount > 5000) throw new Error('Maximum withdrawal is $5000');

    // Deduct balance (hold until withdrawal processed)
    await client.query(`
      UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2
    `, [amount, userId]);

    const transactionId = `WTH_${Date.now()}_${userId}`;
    await client.query(`
      INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, status, reference_id)
      VALUES ($1, 'withdrawal', $2, $3, 'Withdrawal to bank', 'pending', $4)
    `, [userId, amount, balance - amount, transactionId]);

    await client.query('COMMIT');
    res.json({ success: true, transactionId, newBalance: balance - amount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Withdraw error:', error);
    res.status(500).json({ message: error.message || 'Withdrawal failed' });
  } finally {
    client.release();
  }
};

// Redeem reward
export const redeemReward = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rewardId } = req.body;
    const userId = req.user.id;

    // Get reward details
    const rewardRes = await client.query('SELECT * FROM rewards WHERE id = $1', [rewardId]);
    if (rewardRes.rows.length === 0) throw new Error('Reward not found');
    const reward = rewardRes.rows[0];

    // Check user points
    const userRes = await client.query('SELECT loyalty_points FROM users WHERE id = $1', [userId]);
    const points = parseInt(userRes.rows[0].loyalty_points || 0);
    if (points < reward.points) throw new Error('Insufficient points');

    // Deduct points
    await client.query('UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2', [reward.points, userId]);

    // Generate code
    const code = `${reward.type.toUpperCase()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Record redemption
    const redeemRes = await client.query(`
      INSERT INTO redemption_history (user_id, reward_id, points_spent, reward_code, status, expires_at)
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING id
    `, [userId, rewardId, reward.points, code, expiresAt]);

    // If cash reward, add to wallet balance
    if (reward.type === 'cash') {
      const balanceUpdate = await client.query(`
        UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance
      `, [reward.value, userId]);
      const newBalance = parseFloat(balanceUpdate.rows[0].wallet_balance);
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, status, reference_id)
        VALUES ($1, 'reward', $2, $3, $4, 'completed', $5)
      `, [userId, reward.value, newBalance, `Redeemed ${reward.name}`, redeemRes.rows[0].id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, code, reward });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Redeem error:', error);
    res.status(500).json({ message: error.message || 'Redemption failed' });
  } finally {
    client.release();
  }
};