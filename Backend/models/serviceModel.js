// backend/models/serviceModel.js
import pool from '../config/db.js';

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

const formatService = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  category_id: row.category_id,
  price: parseFloat(row.price),
  duration: row.duration,
  location: row.location,
  address: row.address,
  city: row.city,
  state: row.state,
  zip_code: row.zip_code,
  provider_id: row.provider_id,
  provider_name: row.provider_name,
  status: row.status,
  is_featured: row.is_featured,
  is_popular: row.is_popular,
  avg_rating: parseFloat(row.avg_rating || 0),
  review_count: parseInt(row.review_count || 0),
  booking_count: parseInt(row.booking_count || 0),
  total_revenue: parseFloat(row.total_revenue || 0),
  images: row.images || [],
  features: row.features || [],
  requirements: row.requirements || [],
  cancellation_policy: row.cancellation_policy,
  max_bookings_per_day: row.max_bookings_per_day,
  advance_booking: row.advance_booking,
  service_type: row.service_type,
  languages: row.languages || ['English'],
  created_at: row.created_at,
  updated_at: row.updated_at
});

// =========================================================================
// GET SERVICE BY ID
// =========================================================================

export const getServiceById = async (id) => {
  const result = await pool.query(`
    SELECT 
      s.*,
      u.name as provider_name,
      u.avatar as provider_avatar,
      u.phone as provider_phone,
      u.email as provider_email,
      c.name as category_name,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      COUNT(DISTINCT b.id) as booking_count,
      COALESCE(SUM(b.total_amount), 0) as total_revenue
    FROM services s
    JOIN users u ON s.provider_id = u.id
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN reviews r ON s.id = r.service_id
    LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
    WHERE s.id = $1
    GROUP BY s.id, u.name, u.avatar, u.phone, u.email, c.name
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const service = result.rows[0];
  
  // Get images
  const imagesResult = await pool.query(
    'SELECT image_url FROM service_images WHERE service_id = $1 ORDER BY display_order',
    [id]
  );
  
  // Get features
  const featuresResult = await pool.query(
    'SELECT feature FROM service_features WHERE service_id = $1 ORDER BY display_order',
    [id]
  );
  
  // Get requirements
  const requirementsResult = await pool.query(
    'SELECT requirement FROM service_requirements WHERE service_id = $1 ORDER BY display_order',
    [id]
  );

  return {
    ...formatService(service),
    images: imagesResult.rows.map(row => row.image_url),
    features: featuresResult.rows.map(row => row.feature),
    requirements: requirementsResult.rows.map(row => row.requirement)
  };
};

// =========================================================================
// CREATE SERVICE
// =========================================================================

export const createService = async (data) => {
  const {
    provider_id,
    title,
    description,
    category_id,
    price,
    duration,
    location,
    address,
    city,
    state,
    zip_code,
    images,
    features,
    requirements,
    cancellation_policy,
    max_bookings_per_day,
    advance_booking,
    service_type,
    languages
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert service
    const result = await client.query(
      `INSERT INTO services (
        provider_id, title, description, category_id, price, duration,
        location, address, city, state, zip_code, cancellation_policy,
        max_bookings_per_day, advance_booking, service_type, languages,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', NOW())
      RETURNING *`,
      [
        provider_id, title, description, category_id, price, duration,
        location, address, city, state, zip_code, cancellation_policy || 'flexible',
        max_bookings_per_day || 5, advance_booking || 2, service_type || 'both',
        languages || ['English']
      ]
    );

    const serviceId = result.rows[0].id;

    // Insert features
    if (features && features.length > 0) {
      for (let i = 0; i < features.length; i++) {
        if (features[i].trim()) {
          await client.query(
            'INSERT INTO service_features (service_id, feature, display_order) VALUES ($1, $2, $3)',
            [serviceId, features[i].trim(), i]
          );
        }
      }
    }

    // Insert requirements
    if (requirements && requirements.length > 0) {
      for (let i = 0; i < requirements.length; i++) {
        if (requirements[i].trim()) {
          await client.query(
            'INSERT INTO service_requirements (service_id, requirement, display_order) VALUES ($1, $2, $3)',
            [serviceId, requirements[i].trim(), i]
          );
        }
      }
    }

    // Insert images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        if (images[i]) {
          await client.query(
            'INSERT INTO service_images (service_id, image_url, display_order) VALUES ($1, $2, $3)',
            [serviceId, images[i], i]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Fetch the complete service
    return await getServiceById(serviceId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =========================================================================
// UPDATE SERVICE
// =========================================================================

export const updateService = async (id, data) => {
  const {
    title,
    description,
    category_id,
    price,
    duration,
    location,
    address,
    city,
    state,
    zip_code,
    images,
    features,
    requirements,
    cancellation_policy,
    max_bookings_per_day,
    advance_booking,
    service_type,
    languages,
    status
  } = data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update service
    await client.query(
      `UPDATE services SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        price = COALESCE($4, price),
        duration = COALESCE($5, duration),
        location = COALESCE($6, location),
        address = COALESCE($7, address),
        city = COALESCE($8, city),
        state = COALESCE($9, state),
        zip_code = COALESCE($10, zip_code),
        cancellation_policy = COALESCE($11, cancellation_policy),
        max_bookings_per_day = COALESCE($12, max_bookings_per_day),
        advance_booking = COALESCE($13, advance_booking),
        service_type = COALESCE($14, service_type),
        languages = COALESCE($15, languages),
        status = COALESCE($16, status),
        updated_at = NOW()
      WHERE id = $17`,
      [
        title, description, category_id, price, duration, location,
        address, city, state, zip_code, cancellation_policy,
        max_bookings_per_day, advance_booking, service_type, languages,
        status, id
      ]
    );

    // Update features (delete and re-insert)
    if (features !== undefined) {
      await client.query('DELETE FROM service_features WHERE service_id = $1', [id]);
      if (features && features.length > 0) {
        for (let i = 0; i < features.length; i++) {
          if (features[i].trim()) {
            await client.query(
              'INSERT INTO service_features (service_id, feature, display_order) VALUES ($1, $2, $3)',
              [id, features[i].trim(), i]
            );
          }
        }
      }
    }

    // Update requirements (delete and re-insert)
    if (requirements !== undefined) {
      await client.query('DELETE FROM service_requirements WHERE service_id = $1', [id]);
      if (requirements && requirements.length > 0) {
        for (let i = 0; i < requirements.length; i++) {
          if (requirements[i].trim()) {
            await client.query(
              'INSERT INTO service_requirements (service_id, requirement, display_order) VALUES ($1, $2, $3)',
              [id, requirements[i].trim(), i]
            );
          }
        }
      }
    }

    // Update images (delete and re-insert)
    if (images !== undefined) {
      await client.query('DELETE FROM service_images WHERE service_id = $1', [id]);
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          if (images[i]) {
            await client.query(
              'INSERT INTO service_images (service_id, image_url, display_order) VALUES ($1, $2, $3)',
              [id, images[i], i]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    // Fetch the updated service
    return await getServiceById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =========================================================================
// DELETE SERVICE
// =========================================================================

export const deleteService = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete related records
    await client.query('DELETE FROM service_features WHERE service_id = $1', [id]);
    await client.query('DELETE FROM service_requirements WHERE service_id = $1', [id]);
    await client.query('DELETE FROM service_images WHERE service_id = $1', [id]);
    await client.query('DELETE FROM favorites WHERE service_id = $1', [id]);
    
    // Delete service
    const result = await client.query(
      'DELETE FROM services WHERE id = $1 RETURNING id',
      [id]
    );

    await client.query('COMMIT');
    return result.rows.length > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// =========================================================================
// GET PROVIDER SERVICES
// =========================================================================

export const getProviderServices = async (providerId, filters = {}) => {
  const { status, page = 1, limit = 10 } = filters;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['s.provider_id = $1'];
  let params = [providerId];
  let paramIndex = 2;

  if (status && status !== 'all') {
    conditions.push(`s.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  const query = `
    SELECT 
      s.*,
      c.name as category_name,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      COUNT(DISTINCT b.id) as booking_count,
      COALESCE(SUM(b.total_amount), 0) as total_revenue
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN reviews r ON s.id = r.service_id
    LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'completed'
    WHERE ${whereClause}
    GROUP BY s.id, c.name
    ORDER BY s.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(parseInt(limit), offset);

  const result = await pool.query(query, params);
  return result.rows.map(formatService);
};

// =========================================================================
// TOGGLE FAVORITE
// =========================================================================

export const toggleFavorite = async (userId, serviceId) => {
  // Check if service exists
  const serviceCheck = await pool.query(
    'SELECT id FROM services WHERE id = $1 AND status = \'approved\'',
    [serviceId]
  );

  if (serviceCheck.rows.length === 0) {
    throw new Error('Service not found');
  }

  // Check if already favorited
  const favoriteCheck = await pool.query(
    'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
    [userId, serviceId]
  );

  if (favoriteCheck.rows.length > 0) {
    // Remove from favorites
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND service_id = $2',
      [userId, serviceId]
    );
    return { favorited: false };
  } else {
    // Add to favorites
    await pool.query(
      'INSERT INTO favorites (user_id, service_id) VALUES ($1, $2)',
      [userId, serviceId]
    );
    return { favorited: true };
  }
};

// =========================================================================
// GET FAVORITES
// =========================================================================

export const getFavorites = async (userId) => {
  const result = await pool.query(`
    SELECT 
      s.*,
      u.name as provider_name,
      u.avatar as provider_avatar,
      c.name as category_name,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(DISTINCT r.id) as review_count,
      f.created_at as favorited_at
    FROM favorites f
    JOIN services s ON f.service_id = s.id
    JOIN users u ON s.provider_id = u.id
    LEFT JOIN categories c ON s.category_id = c.id
    LEFT JOIN reviews r ON s.id = r.service_id
    WHERE f.user_id = $1 AND s.status = 'approved'
    GROUP BY s.id, u.name, u.avatar, c.name, f.created_at
    ORDER BY f.created_at DESC
  `, [userId]);

  return result.rows.map(row => ({
    ...formatService(row),
    favorited_at: row.favorited_at
  }));
};

// =========================================================================
// IS FAVORITE
// =========================================================================

export const isFavorite = async (userId, serviceId) => {
  const result = await pool.query(
    'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
    [userId, serviceId]
  );
  return result.rows.length > 0;
};

// =========================================================================
// GET AVAILABILITY
// =========================================================================

export const getAvailability = async (serviceId, date) => {
  // Get service details
  const service = await pool.query(
    'SELECT provider_id, duration FROM services WHERE id = $1',
    [serviceId]
  );

  if (service.rows.length === 0) {
    throw new Error('Service not found');
  }

  const providerId = service.rows[0].provider_id;
  const duration = service.rows[0].duration || 60;

  // Get provider's schedule for the day
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  const schedule = await pool.query(`
    SELECT start_time, end_time
    FROM provider_schedules
    WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true
  `, [providerId, dayOfWeek]);

  if (schedule.rows.length === 0) {
    return { available: [], booked: [], time_slots: [], peak_hours: [], duration: parseInt(duration) };
  }

  // Generate time slots (30-minute intervals)
  const slots = [];
  const durationMinutes = parseInt(duration);
  const intervalMinutes = 30;

  schedule.rows.forEach(row => {
    const start = new Date(`1970-01-01T${row.start_time}`);
    const end = new Date(`1970-01-01T${row.end_time}`);
    let current = new Date(start);

    while (current < end) {
      const timeStr = current.toTimeString().slice(0, 5);
      slots.push(timeStr);
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
  });

  // Get existing bookings for the date
  const bookings = await pool.query(`
    SELECT booking_time FROM bookings
    WHERE service_id = $1 AND booking_date::date = $2
      AND status NOT IN ('cancelled', 'rejected')
  `, [serviceId, date]);

  const bookedSlots = bookings.rows.map(b => b.booking_time);
  const availableSlots = slots.filter(s => !bookedSlots.includes(s));

  // Peak hours (10am-12pm and 4pm-6pm)
  const peakHours = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];

  return {
    available: availableSlots,
    booked: bookedSlots,
    time_slots: slots,
    peak_hours: peakHours,
    duration: durationMinutes
  };
};

// =========================================================================
// EXPORTS
// =========================================================================

export default {
  getServiceById,
  createService,
  updateService,
  deleteService,
  getProviderServices,
  toggleFavorite,
  getFavorites,
  isFavorite,
  getAvailability
};