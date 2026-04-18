const express = require('express');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/addresses
 * @desc Get all saved addresses for the user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY COALESCE(label, street) ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch Addresses Error:', error);
    res.status(500).json({ error: 'Failed to load addresses' });
  }
});

/**
 * @route POST /api/addresses
 * @desc Add a new address
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  const { label, street, city, pincode, lat, lng } = req.body;
  const user_id = req.user.id;

  if (!street || !city || !pincode) {
    return res.status(400).json({ error: 'Street, city, and pincode are required' });
  }

  try {
    const sql = `
      INSERT INTO addresses (user_id, label, street, city, pincode, lat, lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [user_id, label || 'Home', street, city, pincode, lat || null, lng || null];
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add Address Error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

/**
 * @route DELETE /api/addresses/:id
 * @desc Delete an address
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;
