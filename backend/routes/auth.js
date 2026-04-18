const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../db');
const { generateOTP, sendOTP } = require('../utils/mailer');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register user, insert into DB, generate and send OTP
 * @access Public
 */
router.post('/register', async (req, res) => {
  let { name, email, password, phone, role } = req.body;
  
  // Sanitize phone: convert empty string or whitespace-only to null
  if (phone && typeof phone === 'string' && phone.trim() === '') {
    phone = null;
  } else if (!phone) {
    phone = null;
  }

  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Use transactions to ensure User + OTP records are created atomically
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Check if user already exists
    const userCheck = await client.query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      
      if (existingUser.is_verified) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'User with this email already exists' });
      } else {
        // User exists but is NOT verified. Let's update their info and resend OTP.
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const userRole = role === 'restaurant_owner' || role === 'admin' ? role : 'customer';

        await client.query(
          'UPDATE users SET name = $1, password_hash = $2, phone = $3, role = $4 WHERE id = $5',
          [name, passwordHash, phone, userRole, existingUser.id]
        );

        const otp = generateOTP();
        await client.query(
          "INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
          [email, otp]
        );
        await sendOTP(email, otp);
        await client.query('COMMIT');
        
        return res.status(200).json({
          message: 'Account already exists but was not verified. A new verification code has been sent to your email.',
          user: { id: existingUser.id, name, email }
        });
      }
    }

    // 2. Hash password (DBMS Rule: bcrypt with salt rounds = 10)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Default role to customer if not explicitly requested
    const userRole = role === 'restaurant_owner' || role === 'admin' ? role : 'customer';

    // 3. Insert User (returning id)
    // DBMS Concept: Raw SQL INSERT with RETURNING
    const insertUserText = `
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email;
    `;
    const userResult = await client.query(insertUserText, [name, email, passwordHash, phone, userRole]);
    const newUser = userResult.rows[0];

    // 4. Generate OTP and Insert into otp_verifications table
    const otp = generateOTP();
    // DBMS Concept: Using INTERVAL for expiration datetime math
    const insertOtpText = `
      INSERT INTO otp_verifications (email, otp_code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
    `;
    await client.query(insertOtpText, [email, otp]);

    // 5. Send Email via Nodemailer
    await sendOTP(email, otp);

    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Registration successful. Please check your email for the OTP.',
      user: newUser
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Registration ErrorDetail:', error);

    // Handle unique constraint violations
    if (error.code === '23505' && error.constraint === 'users_phone_key') {
      return res.status(400).json({ error: 'This phone number is already associated with another account.' });
    }

    res.status(500).json({ 
      error: 'Registration failed due to a server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and mark user as verified
 * @access Public
 */
router.post('/verify-otp', async (req, res) => {
  const { email, otp_code } = req.body;

  if (!email || !otp_code) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  try {
    // 1. Find valid OTP record
    // DBMS Concept: Checking expiration timestamp against NOW() and boolean flags
    const getOtpText = `
      SELECT id FROM otp_verifications
      WHERE email = $1 AND otp_code = $2 AND is_used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    const otpResult = await query(getOtpText, [email, otp_code]);

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const otpRecordId = otpResult.rows[0].id;

    // Use transaction for the two updates
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 2. Mark OTP as used
      await client.query('UPDATE otp_verifications SET is_used = TRUE WHERE id = $1', [otpRecordId]);

      // 3. Mark User as verified
      await client.query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);

      await client.query('COMMIT');
      
      res.json({ message: 'Email verified successfully. You can now log in and place orders.' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get JWT token
 * @access Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Fetch user by email
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // 2. Compare password hashes
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // 3. Check if user is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email address before logging in.',
        notVerified: true,
        email: user.email
      });
    }

    // 4. Generate JWT Token (Expires in 7 days per requirements)
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * @route POST /api/auth/resend-otp
 * @desc Resends a new OTP to the given email
 * @access Public
 */
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists and is NOT verified
    const userResult = await query('SELECT is_verified FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userResult.rows[0].is_verified) {
      return res.status(400).json({ error: 'Account is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Insert new OTP record
    const insertOtpText = `
      INSERT INTO otp_verifications (email, otp_code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
    `;
    await query(insertOtpText, [email, otp]);

    // Send Email
    await sendOTP(email, otp);

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error while resending OTP' });
  }
});

const { sendPasswordResetOTP } = require('../utils/mailer');

/**
 * @route POST /api/auth/forgot-password
 * @desc Generate OTP for password reset
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Check if user exists
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // For security, don't reveal if email exists, but the prompt implies they want to fix their account
      return res.status(404).json({ error: 'User with this email not found' });
    }

    // 2. Generate OTP
    const otp = generateOTP();

    // 3. Store OTP
    const insertOtpText = `
      INSERT INTO otp_verifications (email, otp_code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
    `;
    await query(insertOtpText, [email, otp]);

    // 4. Send Email
    await sendPasswordResetOTP(email, otp);

    res.json({ message: 'A 6-digit code has been sent to your email for password reset.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error during forgot password process' });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Verify OTP and update password
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  const { email, otp_code, new_password } = req.body;

  if (!email || !otp_code || !new_password) {
    return res.status(400).json({ error: 'Email, OTP code, and new password are required' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // 1. Verify OTP
    const getOtpText = `
      SELECT id FROM otp_verifications
      WHERE email = $1 AND otp_code = $2 AND is_used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;
    const otpResult = await query(getOtpText, [email, otp_code]);

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    const otpRecordId = otpResult.rows[0].id;

    // 2. Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(new_password, saltRounds);

    // 3. Update password and mark OTP as used (Transaction)
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
      await client.query('UPDATE otp_verifications SET is_used = TRUE WHERE id = $1', [otpRecordId]);

      await client.query('COMMIT');
      res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error during password reset' });
  }
});

module.exports = router;
