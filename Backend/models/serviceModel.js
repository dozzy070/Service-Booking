import pool from '../config/db.js';

// Get all services for a provider
export const getProviderServices = async (providerId) => {
  const result = await pool.query(
    `SELECT s.*, c.name as category_name
     FROM services s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.provider_id = $1 AND s.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
    [providerId]
  );
  return result.rows;
};

// Get service by ID
export const getServiceById = async (id) => {
  const result = await pool.query(
    `SELECT s.*, c.name as category_name
     FROM services s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.id = $1 AND s.deleted_at IS NULL`,
    [id]
  );
  return result.rows[0];
};

// Create a new service
export const createService = async (serviceData) => {
  const {
    provider_id, category_id, title, slug, description, short_description,
    price, price_type, discount_price, currency, duration, location_type,
    address, city, state, country, postal_code, latitude, longitude,
    service_area, is_remote, min_notice, max_lead_time, cancellation_policy,
    requirements, faq, tags, status = 'pending', is_active = true, featured = false
  } = serviceData;

  const result = await pool.query(
    `INSERT INTO services (
      provider_id, category_id, title, slug, description, short_description,
      price, price_type, discount_price, currency, duration, location_type,
      address, city, state, country, postal_code, latitude, longitude,
      service_area, is_remote, min_notice, max_lead_time, cancellation_policy,
      requirements, faq, tags, status, is_active, featured, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
      $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, NOW(), NOW())
    RETURNING *`,
    [
      provider_id, category_id, title, slug, description, short_description,
      price, price_type, discount_price, currency, duration, location_type,
      address, city, state, country, postal_code, latitude, longitude,
      service_area, is_remote, min_notice, max_lead_time, cancellation_policy,
      requirements, faq, tags, status, is_active, featured
    ]
  );
  return result.rows[0];
};

// Update a service
export const updateService = async (id, updates) => {
  const allowedFields = [
    'category_id', 'title', 'slug', 'description', 'short_description',
    'price', 'price_type', 'discount_price', 'currency', 'duration',
    'location_type', 'address', 'city', 'state', 'country', 'postal_code',
    'latitude', 'longitude', 'service_area', 'is_remote', 'min_notice',
    'max_lead_time', 'cancellation_policy', 'requirements', 'faq', 'tags',
    'status', 'is_active', 'featured'
  ];
  
  const setClauses = [];
  const values = [id];
  let paramIndex = 2;
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex++}`);
      values.push(updates[field]);
    }
  }
  
  if (setClauses.length === 0) return null;
  
  setClauses.push(`updated_at = NOW()`);
  const query = `UPDATE services SET ${setClauses.join(', ')} WHERE id = $1 AND deleted_at IS NULL RETURNING *`;
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Soft delete a service
export const deleteService = async (id) => {
  const result = await pool.query(
    `UPDATE services SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

// Get services by provider
export const getServicesByProvider = async (providerId) => {
  const result = await pool.query(
    `SELECT s.*, c.name as category_name
     FROM services s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.provider_id = $1 AND s.deleted_at IS NULL
     ORDER BY s.created_at DESC`,
    [providerId]
  );
  return result.rows;
};

// Update service status (approve/reject)
export const updateServiceStatus = async (id, status, rejectionReason = null) => {
  let query = `UPDATE services SET status = $1, updated_at = NOW()`;
  const values = [status, id];
  if (rejectionReason) {
    query += `, rejection_reason = $3`;
    values.push(rejectionReason);
  }
  query += ` WHERE id = $2 AND deleted_at IS NULL RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Toggle featured status
export const toggleFeatured = async (id, featured) => {
  const result = await pool.query(
    `UPDATE services SET featured = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
    [featured, id]
  );
  return result.rows[0];
};

// Get service statistics
export const getServiceStats = async () => {
  const result = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'active') as active,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
       COUNT(*) FILTER (WHERE featured = true) as featured
     FROM services
     WHERE deleted_at IS NULL`
  );
  return result.rows[0];
};

// ========== NEW METHOD: countByProvider ==========
export const countByProvider = async (providerId) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count 
     FROM services 
     WHERE provider_id = $1 AND deleted_at IS NULL`,
    [providerId]
  );
  return parseInt(result.rows[0].count);
};

// Export all methods
export default {
  getProviderServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByProvider,
  updateServiceStatus,
  toggleFeatured,
  getServiceStats,
  countByProvider,   // <-- added
};