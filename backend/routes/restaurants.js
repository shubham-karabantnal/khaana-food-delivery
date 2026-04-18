const express = require('express');
const { query } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/restaurants
 * @desc Get all active restaurants (with optional city/search filter)
 * @access Public
 */
router.get('/', async (req, res) => {
  console.log('GET /api/restaurants hit with params:', req.query);
  try {
    const { city, search } = req.query;
    
    let sql = 'SELECT * FROM restaurants WHERE is_open = true';
    const params = [];

    if (city) {
      params.push(city);
      sql += ` AND city ILIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND name ILIKE $${params.length}`;
    }

    // Sort by rating internally
    sql += ' ORDER BY avg_rating DESC NULLS LAST';

    const result = await query(sql, params);
    console.log('SQL:', sql);
    console.log('Params:', params);
    console.log(`Successfully fetched ${result.rows.length} restaurants`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

/**
 * @route GET /api/restaurants/:id
 * @desc Get single restaurant details
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM restaurants WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

/**
 * @route GET /api/restaurants/:id/menu
 * @desc Get menu items for a restaurant grouped by categories
 * @access Public
 */
router.get('/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if restaurant exists
    const restCheck = await query('SELECT id FROM restaurants WHERE id = $1', [id]);
    if (restCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Fetch menu items joined with category name
    // DBMS Concept: INNER JOIN
    const sql = `
      SELECT m.*, c.name as category_name
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.restaurant_id = $1 AND m.is_available = true
      ORDER BY c.id ASC, m.name ASC
    `;
    const result = await query(sql, [id]);

    // Group items by category in JavaScript
    const groupedMenu = result.rows.reduce((acc, item) => {
      const cat = item.category_name || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(item);
      return acc;
    }, {});

    // Convert to an array format easier for frontend mapping
    // e.g., [{ category: 'Starters', items: [...] }, ...]
    const menuArray = Object.keys(groupedMenu).map(cat => ({
      category: cat,
      items: groupedMenu[cat]
    }));

    res.json(menuArray);
  } catch (error) {
    console.error('❌ Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

/**
 * @route POST /api/restaurants
 * @desc Create or setup restaurant profile for owner
 * @access Private (restaurant_owner only)
 */
router.post('/', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  const { name, description, address, city, pincode, image_url, lat, lng } = req.body;
  const owner_id = req.user.id;

  if (!name || !address || !city || !pincode) {
    return res.status(400).json({ error: 'Name, address, city, and pincode are required' });
  }

  try {
    // Check if owner already has a restaurant
    const existCheck = await query('SELECT id FROM restaurants WHERE owner_id = $1', [owner_id]);
    if (existCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a registered restaurant profile' });
    }

    const sql = `
      INSERT INTO restaurants (owner_id, name, description, address, city, pincode, image_url, lat, lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [owner_id, name, description || '', address, city, pincode, image_url || null, lat || null, lng || null];
    
    const result = await query(sql, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Failed to setup restaurant profile' });
  }
});

/**
 * @route PUT /api/restaurants/:id
 * @desc Edit restaurant profile
 * @access Private (owner of the restaurant)
 */
router.put('/:id', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;
  const { name, description, address, city, pincode, image_url, is_open } = req.body;

  try {
    // Verify ownership
    const restCheck = await query('SELECT id FROM restaurants WHERE id = $1 AND owner_id = $2', [id, owner_id]);
    if (restCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to edit this restaurant' });
    }

    const sql = `
      UPDATE restaurants 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          address = COALESCE($3, address),
          city = COALESCE($4, city),
          pincode = COALESCE($5, pincode),
          image_url = COALESCE($6, image_url),
          is_open = COALESCE($7, is_open)
      WHERE id = $8
      RETURNING *
    `;
    const params = [name, description, address, city, pincode, image_url, is_open, id];

    const result = await query(sql, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ error: 'Failed to update restaurant details' });
  }
});

/**
 * @route GET /api/restaurants/owner/my-restaurant
 * @desc Get the logged-in owner's restaurant
 * @access Private (restaurant_owner only)
 */
router.get('/owner/my-restaurant', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  try {
    const owner_id = req.user.id;
    const result = await query('SELECT * FROM restaurants WHERE owner_id = $1', [owner_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No restaurant found for this owner.' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
