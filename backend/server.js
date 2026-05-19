// server.js — Khaana Backend Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    /\.vercel\.app$/,          // all Vercel preview/prod domains
    'http://localhost:5173',    // local dev
    'http://localhost:3000',
  ],
  credentials: true,
}));
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

const { sendOTP } = require('./utils/mailer');

app.get('/api/debug-env', async (req, res) => {
  let emailError = null;
  let emailSuccess = false;
  try {
    await sendOTP('shubhamkarabantnal@gmail.com', '123456');
    emailSuccess = true;
  } catch (e) {
    emailError = e.message;
  }

  res.json({
    hasGmailUser: !!process.env.GMAIL_USER,
    gmailUser: process.env.GMAIL_USER,
    hasGmailPass: !!process.env.GMAIL_APP_PASSWORD,
    passLength: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0,
    hasRazorpayKey: !!process.env.RAZORPAY_KEY_ID,
    emailSuccess,
    emailError
  });
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/addresses', require('./routes/addresses'));
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

module.exports = app;
