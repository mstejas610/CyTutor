const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { sendOTP } = require('../config/email');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    try {
      const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + process.env.OTP_EXPIRE_MINUTES * 60000);

      const result = await pool.query(
        'INSERT INTO users (email, password, name, otp, otp_expiry, verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [email, hashedPassword, name, otp, otpExpiry, false]
      );

      await sendOTP(email, otp);

      res.status(201).json({ 
        message: 'Registration successful. Please verify your email.',
        userId: result.rows[0].id 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Verify OTP
router.post('/verify-otp',
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, otp, otp_expiry, verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      if (user.verified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      if (new Date() > new Date(user.otp_expiry)) {
        return res.status(400).json({ error: 'OTP expired' });
      }

      if (user.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      await pool.query(
        'UPDATE users SET verified = $1, otp = NULL, otp_expiry = NULL WHERE id = $2',
        [true, user.id]
      );

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });

      res.json({ message: 'Email verified successfully', token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Resend OTP
router.post('/resend-otp',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const result = await pool.query('SELECT id, verified FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (result.rows[0].verified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + process.env.OTP_EXPIRE_MINUTES * 60000);

      await pool.query(
        'UPDATE users SET otp = $1, otp_expiry = $2 WHERE email = $3',
        [otp, otpExpiry, email]
      );

      await sendOTP(email, otp);

      res.json({ message: 'OTP resent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, email, password, name, verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.verified) {
        return res.status(403).json({ error: 'Please verify your email first' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });

      res.json({ 
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get current user (protected route example)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
