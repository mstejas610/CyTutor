const express = require('express');
const { pool } = require('../config/database');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all challenges
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        c.id, c.name, c.category, c.difficulty, c.description, 
        c.points, c.docker_image, c.port, c.created_at,
        CASE WHEN up.id IS NOT NULL THEN true ELSE false END as solved
      FROM challenges c
      LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
      WHERE c.is_active = true
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (category) {
      query += ` AND c.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND c.difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM challenges WHERE is_active = true';
    const countParams = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (difficulty) {
      countQuery += ` AND difficulty = $${countParamIndex}`;
      countParams.push(difficulty);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      challenges: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({
      message: 'Failed to fetch challenges',
      error: 'FETCH_CHALLENGES_ERROR'
    });
  }
});

// Get challenge by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
         c.id, c.name, c.category, c.difficulty, c.description, 
         c.points, c.docker_image, c.port, c.created_at,
         CASE WHEN up.id IS NOT NULL THEN true ELSE false END as solved,
         up.solved_at, up.attempts, up.hints_used
       FROM challenges c
       LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
       WHERE c.id = $2 AND c.is_active = true`,
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Challenge not found',
        error: 'CHALLENGE_NOT_FOUND'
      });
    }

    res.json({
      challenge: result.rows[0]
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({
      message: 'Failed to fetch challenge',
      error: 'FETCH_CHALLENGE_ERROR'
    });
  }
});

// Submit flag for a challenge
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { flag } = req.body;

    if (!flag) {
      return res.status(400).json({
        message: 'Flag is required',
        error: 'MISSING_FLAG'
      });
    }

    // Get challenge details
    const challengeResult = await pool.query(
      'SELECT id, name, flag, points FROM challenges WHERE id = $1 AND is_active = true',
      [id]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Challenge not found',
        error: 'CHALLENGE_NOT_FOUND'
      });
    }

    const challenge = challengeResult.rows[0];

    // Check if already solved
    const existingProgress = await pool.query(
      'SELECT id FROM user_progress WHERE user_id = $1 AND challenge_id = $2',
      [req.user.id, id]
    );

    if (existingProgress.rows.length > 0) {
      return res.status(400).json({
        message: 'Challenge already solved',
        error: 'ALREADY_SOLVED'
      });
    }

    // Verify flag (case-insensitive)
    const isCorrect = flag.trim().toLowerCase() === challenge.flag.toLowerCase();

    if (isCorrect) {
      // Record successful solve
      await pool.query(
        'INSERT INTO user_progress (user_id, challenge_id) VALUES ($1, $2)',
        [req.user.id, id]
      );

      res.json({
        message: 'Congratulations! Flag is correct!',
        success: true,
        points: challenge.points
      });
    } else {
      res.status(400).json({
        message: 'Incorrect flag. Try again!',
        success: false,
        error: 'INCORRECT_FLAG'
      });
    }
  } catch (error) {
    console.error('Submit flag error:', error);
    res.status(500).json({
      message: 'Failed to submit flag',
      error: 'SUBMIT_FLAG_ERROR'
    });
  }
});

// Get user's progress/statistics
router.get('/user/progress', async (req, res) => {
  try {
    // Get overall stats
    const statsResult = await pool.query(
      `SELECT 
         COUNT(up.id) as total_solved,
         COALESCE(SUM(c.points), 0) as total_points,
         COUNT(DISTINCT c.category) as categories_completed
       FROM user_progress up
       JOIN challenges c ON up.challenge_id = c.id
       WHERE up.user_id = $1`,
      [req.user.id]
    );

    // Get category-wise progress
    const categoryStatsResult = await pool.query(
      `SELECT 
         c.category,
         COUNT(c.id) as total_challenges,
         COUNT(up.id) as solved_challenges,
         COALESCE(SUM(CASE WHEN up.id IS NOT NULL THEN c.points ELSE 0 END), 0) as points_earned
       FROM challenges c
       LEFT JOIN user_progress up ON c.id = up.challenge_id AND up.user_id = $1
       WHERE c.is_active = true
       GROUP BY c.category
       ORDER BY c.category`,
      [req.user.id]
    );

    // Get recent solves
    const recentSolvesResult = await pool.query(
      `SELECT 
         c.name, c.category, c.difficulty, c.points,
         up.solved_at
       FROM user_progress up
       JOIN challenges c ON up.challenge_id = c.id
       WHERE up.user_id = $1
       ORDER BY up.solved_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      overall: {
        totalSolved: parseInt(stats.total_solved),
        totalPoints: parseInt(stats.total_points),
        categoriesCompleted: parseInt(stats.categories_completed)
      },
      categories: categoryStatsResult.rows.map(row => ({
        category: row.category,
        totalChallenges: parseInt(row.total_challenges),
        solvedChallenges: parseInt(row.solved_challenges),
        pointsEarned: parseInt(row.points_earned),
        completionRate: row.total_challenges > 0 ? 
          Math.round((row.solved_challenges / row.total_challenges) * 100) : 0
      })),
      recentSolves: recentSolvesResult.rows
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      message: 'Failed to fetch progress',
      error: 'FETCH_PROGRESS_ERROR'
    });
  }
});

// Admin routes (require admin role)

// Add new challenge (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const {
      name, category, difficulty, description, flag, points = 100,
      dockerImage, port
    } = req.body;

    if (!name || !category || !difficulty || !description || !flag) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: 'MISSING_FIELDS'
      });
    }

    const result = await pool.query(
      `INSERT INTO challenges 
       (name, category, difficulty, description, flag, points, docker_image, port) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, name, category, difficulty, points, created_at`,
      [name, category, difficulty, description, flag, points, dockerImage, port]
    );

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: result.rows[0]
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({
      message: 'Failed to create challenge',
      error: 'CREATE_CHALLENGE_ERROR'
    });
  }
});

// Update challenge (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, difficulty, description, flag, points,
      dockerImage, port, isActive
    } = req.body;

    const result = await pool.query(
      `UPDATE challenges 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           difficulty = COALESCE($3, difficulty),
           description = COALESCE($4, description),
           flag = COALESCE($5, flag),
           points = COALESCE($6, points),
           docker_image = COALESCE($7, docker_image),
           port = COALESCE($8, port),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, name, category, difficulty, points, updated_at`,
      [name, category, difficulty, description, flag, points, dockerImage, port, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Challenge not found',
        error: 'CHALLENGE_NOT_FOUND'
      });
    }

    res.json({
      message: 'Challenge updated successfully',
      challenge: result.rows[0]
    });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({
      message: 'Failed to update challenge',
      error: 'UPDATE_CHALLENGE_ERROR'
    });
  }
});

module.exports = router;