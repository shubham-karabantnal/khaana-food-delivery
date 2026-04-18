const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/health', (req, res) => res.json({ status: 'reviews router ok' }));

// ─── Submit a Review ─────────────────────────────────────────
// POST /api/reviews
router.post('/', authenticateToken, async (req, res) => {
  const { order_id, restaurant_id, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating (1-5) is required' });
  }

  try {
    // 1. Verify that the order belongs to user and is delivered
    const orderCheck = await query(
      "SELECT id FROM orders WHERE id = $1 AND user_id = $2 AND status = 'delivered'",
      [order_id, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You can only review delivered orders belonging to you' });
    }

    // 2. Insert review
    const result = await query(
      `INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id) DO UPDATE SET rating = $4, comment = $5
       RETURNING *`,
      [req.user.id, restaurant_id, order_id, rating, comment]
    );

    // Note: Triggers in DB will automatically update restaurant's avg_rating

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ─── Get Restaurant Reviews ──────────────────────────────────
// GET /api/reviews/restaurant/:id
router.get('/restaurant/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.restaurant_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
