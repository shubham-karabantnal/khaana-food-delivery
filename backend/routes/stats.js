const express = require('express');

const router = express.Router();

/**
 * @route GET /api/stats
 * @desc Get dynamically computed platform statistics
 * @access Public
 */
router.get('/', (req, res) => {
  // We compute some stats dynamically based on the current time
  // so the user sees a "live" updating system.
  const now = new Date();
  
  // A fake "active deliveries" number based on minutes
  const activeDeliveries = 150 + (now.getMinutes() * 2) + Math.floor(Math.random() * 10);
  
  // A fake "active users" metric
  const activeUsers = 500 + Math.floor(now.getSeconds() * 1.5) + Math.floor(Math.random() * 50);

  // Computed data response
  res.json({
    activeDeliveries,
    activeUsers,
    restaurantsOnline: 42,
    timestamp: now.toISOString()
  });
});

module.exports = router;
