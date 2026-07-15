// routes/student.js — profile data for the signed-in student

const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/student/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT full_name, student_id, email, program, year_label, advisor FROM users WHERE id = ?',
      [req.userId]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      name: user.full_name,
      studentId: user.student_id,
      email: user.email,
      program: user.program,
      year: user.year_label,
      advisor: user.advisor,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;