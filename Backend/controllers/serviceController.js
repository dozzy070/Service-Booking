import pool from '../config/db.js';
import {
  getServiceById as getServiceByIdModel,
  createService as createServiceModel,
  updateService as updateServiceModel,
  deleteService as deleteServiceModel,
  getProviderServices as getProviderServicesModel
} from '../models/serviceModel.js';

export const getServiceById = async (req, res) => {
  try {
    const service = await getServiceByIdModel(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, provider_id: req.user.id });
    res.status(201).json(service);
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await Service.update(req.params.id, req.body);
    res.json(service);
  } catch (error) {
    console.error('Error in updateService:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    await Service.delete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Error in deleteService:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    // First try to get from categories table
    const categoriesResult = await pool.query('SELECT name FROM categories ORDER BY name');
    
    if (categoriesResult.rows.length > 0) {
      const categories = categoriesResult.rows.map(row => row.name);
      return res.json(categories);
    }
    
    // If no categories in table, get distinct categories from services
    const servicesResult = await pool.query('SELECT DISTINCT category FROM services WHERE category IS NOT NULL ORDER BY category');
    const categories = servicesResult.rows.map(row => row.category);
    
    res.json(categories);
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req, res) => {
  try {
    const review = await Service.addReview(req.params.id, { ...req.body, user_id: req.user.id });
    res.status(201).json(review);
  } catch (error) {
    console.error('Error in addReview:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getReviews = async (req, res) => {
  try {
    const reviews = await Service.getReviews(req.params.id);
    res.json(reviews);
  } catch (error) {
    console.error('Error in getReviews:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getProviderServices = async (req, res) => {
  try {
    const services = await getProviderServicesModel(req.params.providerId);
    res.json(services);
  } catch (error) {
    console.error('Error in getProviderServices:', error);
    res.status(500).json({ message: error.message });
  }
};

export const searchServices = async (req, res) => {
  try {
    const { q, category, location, minPrice, maxPrice, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT s.*, u.name as provider_name, u.avatar as provider_avatar,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(DISTINCT r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.status = 'approved'
    `;
    const params = [];
    let paramIndex = 1;

    if (q) {
      query += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.tags::text ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (location) {
      query += ` AND s.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND s.price >= $${paramIndex}`;
      params.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND s.price <= $${paramIndex}`;
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    query += ` GROUP BY s.id, u.name, u.avatar ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in searchServices:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPopularServices = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const result = await pool.query(`
      SELECT s.*, 
             u.name as provider_name, 
             u.avatar as provider_avatar,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(DISTINCT r.id) as review_count,
             COUNT(DISTINCT b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      LEFT JOIN bookings b ON s.id = b.service_id
      WHERE s.status = 'approved'
      GROUP BY s.id, u.name, u.avatar
      ORDER BY COUNT(DISTINCT b.id) DESC, COALESCE(AVG(r.rating), 0) DESC
      LIMIT $1
    `, [parseInt(limit)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getPopularServices:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getSimilarServices = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    const services = await Service.getSimilar(id, parseInt(limit));
    res.json(services);
  } catch (error) {
    console.error('Error in getSimilarServices:', error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const result = await Service.toggleFavorite(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error in toggleFavorite:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Service.getFavorites(req.user.id);
    res.json(favorites);
  } catch (error) {
    console.error('Error in getFavorites:', error);
    res.status(500).json({ message: error.message });
  }
};

export const isFavorite = async (req, res) => {
  try {
    const isFav = await Service.isFavorite(req.user.id, req.params.id);
    res.json({ isFavorite: isFav });
  } catch (error) {
    console.error('Error in isFavorite:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const availability = await Service.getAvailability(req.params.id, req.query);
    res.json(availability);
  } catch (error) {
    console.error('Error in getAvailability:', error);
    res.status(500).json({ message: error.message });
  }
};