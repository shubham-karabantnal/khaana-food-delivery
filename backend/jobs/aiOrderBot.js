const { query } = require('../db');
const { sendStatusUpdateEmail } = require('../utils/mailer');

/**
 * AI Order Bot — Automated Restaurant Simulation (Option 1: Timers Only)
 * Purpose: Automatically progresses order status to simulate restaurant operations.
 */

const STATUS_FLOW = {
  pending:          { next: 'confirmed',        delay: 30000 },  // 30 seconds
  confirmed:        { next: 'preparing',        delay: 120000 }, // 2 minutes
  preparing:        { next: 'out_for_delivery', delay: 180000 }, // 3 minutes
  out_for_delivery: { next: 'delivered',        delay: 120000 }  // 2 minutes
};

/**
 * processOrder
 * Recursively schedules the next status update for an order.
 */
const processOrder = async (orderId, currentStatus) => {
  const step = STATUS_FLOW[currentStatus];
  if (!step) return; // Order completed or no more steps

  console.log(`🤖 AI Bot: Order #${orderId.substring(0,8)} is ${currentStatus}. Scheduling ${step.next} in ${step.delay/1000}s...`);

  setTimeout(async () => {
    try {
      // 1. Fetch order details (email/name) and re-verify current status to prevent collisions
      const { rows } = await query(
        `SELECT o.status, u.email, u.name as customer_name
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`,
        [orderId]
      );

      if (!rows.length) return;
      
      // If status changed by human or another process, bail out
      if (rows[0].status !== currentStatus) {
        console.log(`🤖 AI Bot: Order #${orderId.substring(0,8)} status changed externally (${rows[0].status}). Skipping bot update.`);
        return;
      }

      const nextStatus = step.next;

      // 2. Update status in DB
      await query(
        'UPDATE orders SET status = $1 WHERE id = $2 AND status = $3',
        [nextStatus, orderId, currentStatus]
      );

      console.log(`🤖 AI Bot: Order #${orderId.substring(0,8)} → ${nextStatus}`);

      // 3. Notify user via email is disabled as per config
      // sendStatusUpdateEmail(...)


      // 4. Recurse to next step
      processOrder(orderId, nextStatus);
    } catch (error) {
      console.error('🤖 AI Bot Execution Error:', error);
    }
  }, step.delay);
};

module.exports = { processOrder };
