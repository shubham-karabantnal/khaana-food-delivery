const express = require('express');
const { query } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/menu/categories
 * @desc Get all generic menu categories
 * @access Public
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

/**
 * @route POST /api/menu
 * @desc Add a new menu item
 * @access Private (restaurant_owner only)
 */
router.post('/', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  const { restaurant_id, category_id, name, description, price, image_url, is_available } = req.body;
  const owner_id = req.user.id;

  if (!restaurant_id || !name || !price) {
    return res.status(400).json({ error: 'Restaurant ID, name, and price are required' });
  }

  try {
    // 1. Verify owner owns this restaurant
    const restCheck = await query('SELECT id FROM restaurants WHERE id = $1 AND owner_id = $2', [restaurant_id, owner_id]);
    if (restCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not authorized to add items to this restaurant' });
    }

    // 2. Insert item
    // DBMS Concept: Prepared Statements
    const sql = `
      INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const available = is_available !== undefined ? is_available : true;
    const catId = category_id || null; // Provide fallback to unassigned
    
    const params = [restaurant_id, catId, name, description, price, image_url, available];
    const result = await query(sql, params);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add Menu Error:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

/**
 * @route PUT /api/menu/:id
 * @desc Update a menu item
 * @access Private (restaurant_owner only)
 */
router.put('/:id', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;
  const { category_id, name, description, price, image_url, is_available } = req.body;

  try {
    // 1. Verify owner owns the restaurant that this menu item belongs to
    // DBMS Concept: JOIN in authorization check
    const authQuery = `
      SELECT m.id 
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.id = $1 AND r.owner_id = $2
    `;
    const authCheck = await query(authQuery, [id, owner_id]);
    
    if (authCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    // 2. Update item using COALESCE to gracefully fall back on existing data
    const sql = `
      UPDATE menu_items
      SET category_id = COALESCE($1, category_id),
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          price = COALESCE($4, price),
          image_url = COALESCE($5, image_url),
          is_available = COALESCE($6, is_available)
      WHERE id = $7
      RETURNING *
    `;
    const params = [category_id, name, description, price, image_url, is_available, id];
    const result = await query(sql, params);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Menu Update Error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

/**
 * @route DELETE /api/menu/:id
 * @desc Delete a menu item
 * @access Private (restaurant_owner only)
 */
router.delete('/:id', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;

  try {
    // 1. Verify ownership (same as PUT)
    const authQuery = `
      SELECT m.id 
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.id = $1 AND r.owner_id = $2
    `;
    const authCheck = await query(authQuery, [id, owner_id]);
    
    if (authCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    // 2. Delete item
    await query('DELETE FROM menu_items WHERE id = $1', [id]);
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Menu Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;
