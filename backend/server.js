// server.js — Khaana Backend Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Khaana API',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes (will be added phase by phase) ───────────────────
app.use('/api/auth', require('./routes/auth'));
// Phase 3:
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/upload', require('./routes/upload'));
// Phase 4:
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
// Phase 6:
app.use('/api/addresses', require('./routes/addresses'));

// Computed Stats:
app.use('/api/stats', require('./routes/stats'));

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🍛 Khaana API running on http://localhost:${PORT}`);
  try {
    const res = await query('SELECT NOW()');
    console.log('✅ Database connected at:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});
