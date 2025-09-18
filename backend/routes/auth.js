const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    message: 'Too many authentication attempts, please try again later',
    error: 'RATE_LIMITED'
  }
});

// Registration validation
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must contain only letters and spaces'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must contain only letters and spaces')
];

// Login validation
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register endpoint
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        error: 'VALIDATION_ERROR'
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Username or email already exists',
        error: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, first_name, last_name, created_at`,
      [username, email, passwordHash, firstName || null, lastName || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Registration failed',
      error: 'REGISTRATION_ERROR'
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
        error: 'VALIDATION_ERROR'
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const userResult = await pool.query(
      'SELECT id, username, email, password_hash, first_name, last_name, role, is_active FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        message: 'Account has been deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'LOGIN_ERROR'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user stats
    const statsResult = await pool.query(
      `SELECT 
         COUNT(up.id) as challenges_solved,
         COALESCE(SUM(c.points), 0) as total_points
       FROM user_progress up
       LEFT JOIN challenges c ON up.challenge_id = c.id
       WHERE up.user_id = $1`,
      [user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        stats: {
          challengesSolved: parseInt(stats.challenges_solved),
          totalPoints: parseInt(stats.total_points)
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      error: 'PROFILE_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear cookie
    res.clearCookie('token');
    
    // Optional: Add token to blacklist
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
    
    if (token) {
      const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);
      
      await pool.query(
        'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [req.user.id, tokenHash, expiresAt]
      );
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Logout failed',
      error: 'LOGOUT_ERROR'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role
    }
  });
});

module.exports = router;