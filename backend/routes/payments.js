const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Create Razorpay Order ────────────────────────────────────
// POST /api/payments/create-order
router.post('/create-order', authenticateToken, async (req, res) => {
  const { order_id } = req.body;

  try {
    // 1. Fetch order details from DB to verify amount
    const orderRes = await query(
      'SELECT total_price FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const amount = Math.round(parseFloat(orderRes.rows[0].total_price) * 100); // Razorpay expects paise

    // 2. Create Razorpay order
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${order_id.substring(0, 10)}`,
    };

    const rzpOrder = await razorpay.orders.create(options);

    // 3. Store payment record in DB
    await query(
      `INSERT INTO payments (order_id, razorpay_order_id, amount, status)
       VALUES ($1, $2, $3, 'created')
       ON CONFLICT (order_id) DO UPDATE SET razorpay_order_id = $2, amount = $3`,
      [order_id, rzpOrder.id, orderRes.rows[0].total_price]
    );

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      order: rzpOrder
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// ─── Verify Payment Signature ─────────────────────────────────
// POST /api/payments/verify
router.post('/verify', authenticateToken, async (req, res) => {
  const { 
    order_id, 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature 
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (isSignatureValid) {
    try {
      // 1. Update payment record
      await query(
        `UPDATE payments 
         SET razorpay_payment_id = $1, status = 'success', paid_at = NOW() 
         WHERE razorpay_order_id = $2`,
        [razorpay_payment_id, razorpay_order_id]
      );

      // 2. Update order payment status
      await query(
        "UPDATE orders SET payment_status = 'paid' WHERE id = $1",
        [order_id]
      );

      res.json({ message: 'Payment verified and captured' });
    } catch (error) {
      console.error('Error updating payment success:', error);
      res.status(500).json({ error: 'Payment recorded but status update failed' });
    }
  } else {
    res.status(400).json({ error: 'Invalid payment signature' });
  }
});

module.exports = router;
