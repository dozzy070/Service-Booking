import pool from '../config/db.js';

const ReviewModel = {
  async getAverageRatingForProvider(providerId) {
    const result = await pool.query(
      `SELECT COALESCE(AVG(r.rating), 0) as average_rating, COUNT(*) as total_reviews
       FROM reviews r
       JOIN services s ON r.service_id = s.id
       WHERE s.provider_id = $1`,
      [providerId]
    );
    return {
      averageRating: parseFloat(result.rows[0].average_rating),
      totalReviews: parseInt(result.rows[0].total_reviews)
    };
  },

  async getAverageRatingAndCountForProviderDirect(providerId) {
    // If reviews table has provider_id column (your schema may vary)
    const result = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE provider_id = $1`,
      [providerId]
    );
    return {
      averageRating: parseFloat(result.rows[0].average_rating),
      totalReviews: parseInt(result.rows[0].total_reviews)
    };
  }
};

export default ReviewModel;