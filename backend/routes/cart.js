const express = require('express');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/cart
 * @desc Get current user's cart items with menu item details
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // DBMS Concept: JOIN to get menu item + restaurant details alongside cart
    const sql = `
      SELECT c.id, c.quantity, 
             m.id as menu_item_id, m.name, m.price, m.image_url, m.is_available,
             r.id as restaurant_id, r.name as restaurant_name
      FROM cart c
      JOIN menu_items m ON c.menu_item_id = m.id
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE c.user_id = $1
      ORDER BY r.name ASC, m.name ASC
    `;
    const result = await query(sql, [req.user.id]);
    
    // Calculate total
    const items = result.rows;
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({ items, total: parseFloat(total.toFixed(2)) });
  } catch (error) {
    console.error('Cart Fetch Error:', error);
    res.status(500).json({ error: 'Failed to load cart' });
  }
});

/**
 * @route POST /api/cart
 * @desc Add item to cart (or update quantity if already exists)
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  const { menu_item_id, quantity } = req.body;
  const user_id = req.user.id;

  if (!menu_item_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'menu_item_id and quantity (>= 1) are required' });
  }

  try {
    // DBMS Concept: UPSERT using ON CONFLICT
    const sql = `
      INSERT INTO cart (user_id, menu_item_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, menu_item_id)
      DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
      RETURNING *
    `;
    const result = await query(sql, [user_id, menu_item_id, quantity]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Cart Add Error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

/**
 * @route PUT /api/cart/:id
 * @desc Update cart item quantity
 * @access Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const user_id = req.user.id;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be >= 1' });
  }

  try {
    const result = await query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cart Update Error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

/**
 * @route DELETE /api/cart/:id
 * @desc Remove item from cart
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM cart WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Cart Delete Error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

/**
 * @route DELETE /api/cart
 * @desc Clear entire cart
 * @access Private
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
