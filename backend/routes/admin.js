const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check for Admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ─── Platform Statistics ─────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [revenueRes, popularRes, activeOrdersRes] = await Promise.all([
      query('SELECT * FROM restaurant_revenue_view'),
      query('SELECT * FROM popular_items_view LIMIT 10'),
      query('SELECT * FROM active_orders_view')
    ]);

    res.json({
      revenue_by_restaurant: revenueRes.rows,
      popular_items: popularRes.rows,
      active_orders: activeOrdersRes.rows,
      system_summary: {
        total_revenue: revenueRes.rows.reduce((sum, r) => sum + parseFloat(r.total_revenue), 0),
        active_orders_count: activeOrdersRes.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

module.exports = router;
