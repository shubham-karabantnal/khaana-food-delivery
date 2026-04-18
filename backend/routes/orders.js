const express = require('express');
const { query, getClient } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { processOrder } = require('../jobs/aiOrderBot');

const router = express.Router();

/**
 * @route POST /api/orders/place
 * @desc Place an order using the place_order() stored procedure
 * @access Private (customer)
 */
router.post('/place', authenticateToken, async (req, res) => {
  const { restaurant_id, address_id } = req.body;
  const user_id = req.user.id;

  if (!restaurant_id || !address_id) {
    return res.status(400).json({ error: 'restaurant_id and address_id are required' });
  }

  try {
    // DBMS Concept: Calling a Stored Procedure / PL/pgSQL Function
    const result = await query(
      'SELECT place_order($1, $2, $3) as order_id',
      [user_id, restaurant_id, address_id]
    );

    const orderId = result.rows[0].order_id;

    // Start AI Bot simulation for this order (Option 1: Timers)
    processOrder(orderId, 'pending');

    // Fetch details for the billing email
    try {
      const orderRes = await query(
        `SELECT o.id as order_id, o.total_price, o.status, o.created_at,
                u.name as customer_name, u.email as customer_email,
                r.name as restaurant_name,
                a.street, a.city, a.pincode
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN addresses a ON o.address_id = a.id
         WHERE o.id = $1`,
        [orderId]
      );

      const itemsRes = await query(
        `SELECT m.name as item_name, oi.quantity, oi.unit_price as price_at_time
         FROM order_items oi
         JOIN menu_items m ON oi.menu_item_id = m.id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      if (orderRes.rows.length > 0 && itemsRes.rows.length > 0) {
        // Normalize the key to match mailer expectations
        orderRes.rows[0].total_amount = orderRes.rows[0].total_price;
        // Send email asynchronously without awaiting
        sendOrderBillEmail(orderRes.rows[0], itemsRes.rows).catch(err => 
          console.error('Failed to send billing email in background:', err)
        );
      }
    } catch (emailErr) {
      console.error('Failed to prepare billing email:', emailErr);
    }

    res.status(201).json({ message: 'Order placed successfully!', order_id: orderId });
  } catch (error) {
    console.error('Place Order Error:', error);
    // The stored procedure raises exceptions for closed restaurant / empty cart
    if (error.message.includes('Cart is empty')) {
      return res.status(400).json({ error: 'Your cart is empty or has no items from this restaurant' });
    }
    if (error.message.includes('closed')) {
      return res.status(400).json({ error: 'This restaurant is currently closed' });
    }
    res.status(500).json({ error: 'Failed to place order' });
  }
});

/**
 * @route GET /api/orders
 * @desc Get order history for the logged-in user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // DBMS Concept: JOIN + ORDER BY for denormalized read
    const sql = `
      SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await query(sql, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Orders Fetch Error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});


const { sendStatusUpdateEmail, sendOrderBillEmail } = require('../utils/mailer');

/**
 * @route GET /api/orders/restaurant
 * @desc Get orders for the owner's restaurant (active orders only)
 * @access Private (restaurant_owner)
 */
router.get('/restaurant', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  try {
    const sql = `
      SELECT o.*, u.name AS customer_name,
            json_agg(json_build_object('id', oi.id, 'name', m.name, 'quantity', oi.quantity)) AS items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE r.owner_id = $1
        AND o.status NOT IN ('delivered', 'cancelled')
      GROUP BY o.id, u.name
      ORDER BY o.created_at DESC
    `;
    const result = await query(sql, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Restaurant Orders Error:', error);
    res.status(500).json({ error: 'Failed to load restaurant orders' });
  }
});

/**
 * @route PATCH /api/orders/:id/status
 * @desc Update order status using incremental flow
 * @access Private (restaurant_owner)
 */
const STATUS_FLOW = {
  pending          : 'confirmed',
  confirmed        : 'preparing',
  preparing        : 'out_for_delivery',
  out_for_delivery : 'delivered'
};

router.patch('/:id/status', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Get current status, customer email, and owner check
    const { rows } = await query(
      `SELECT o.status, r.owner_id, u.email, u.name as customer_name
       FROM orders o 
       JOIN restaurants r ON o.restaurant_id = r.id 
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    // 2. Auth check
    if (rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your restaurant' });
    }

    const currentStatus = rows[0].status;
    const nextStatus    = STATUS_FLOW[currentStatus];

    if (!nextStatus) {
      return res.status(400).json({ error: 'Order already completed or cancelled' });
    }

    // 3. Update status
    const updated = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [nextStatus, id]
    );

    // 4. Send Email notification (non-blocking)
    sendStatusUpdateEmail(rows[0].email, id, nextStatus).catch(err => console.error('Email notify error:', err));

    res.json({ message: `Order moved to ${nextStatus}`, order: updated.rows[0] });
  } catch (error) {
    console.error('Status Update Error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * @route GET /api/orders/restaurant/incoming
 * @desc Get all orders for the owner's restaurant
 * @access Private (restaurant_owner)
 */
router.get('/restaurant/incoming', authenticateToken, requireRole(['restaurant_owner']), async (req, res) => {
  try {
    const sql = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN users u ON o.user_id = u.id
      WHERE r.owner_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await query(sql, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load incoming orders' });
  }
});

/**
 * @route GET /api/orders/:id
 * @desc Get single order details with items
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Get order
    const orderRes = await query(
      `SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image
       FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, req.user.id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items with menu item names
    const itemsRes = await query(
      `SELECT oi.*, m.name as item_name, m.image_url as item_image
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ order: orderRes.rows[0], items: itemsRes.rows });
  } catch (error) {
    console.error('Order Detail Error:', error);
    res.status(500).json({ error: 'Failed to load order details' });
  }
});

module.exports = router;
