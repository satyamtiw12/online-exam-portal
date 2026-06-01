const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// ─── Dashboard ───────────────────────────────────────────────────
router.get('/dashboard', isLoggedIn, async (req, res) => {
    if (req.session.role === 'admin') return res.redirect('/admin/dashboard');
  try {
    // Auto-expire old exams
    await db.query(`UPDATE exams SET status='inactive' WHERE expiry_date IS NOT NULL AND expiry_date <= NOW()`);

    // Get active exams not yet attempted by this user
    const result = await db.query(`
      SELECT e.* FROM exams e
      WHERE e.status = 'active'
      AND e.id NOT IN (
        SELECT exam_id FROM results WHERE user_id = $1
      )
    `, [req.session.userId]);

    res.render('student/dashboard', { exams: result.rows });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// ─── Profile (GET) ───────────────────────────────────────────────
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id=$1', [req.session.userId]);
    res.render('student/profile', { user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.send('Error');
  }
});

// ─── Update Email ─────────────────────────────────────────────────
router.post('/profile/update', isLoggedIn, async (req, res) => {
  const { email } = req.body;
  try {
    await db.query('UPDATE users SET email=$1 WHERE id=$2', [email, req.session.userId]);
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/profile');
  } catch (err) {
    req.flash('error', 'Update failed');
    res.redirect('/profile');
  }
});

// ─── Upload Photo ─────────────────────────────────────────────────
router.post('/profile/photo', isLoggedIn, async (req, res) => {
  if (!req.files || !req.files.photo) {
    req.flash('error', 'No file uploaded');
    return res.redirect('/profile');
  }
  const photo = req.files.photo;
  const ext = path.extname(photo.name);
  const fileName = `user_${req.session.userId}_${Date.now()}${ext}`;
  const uploadPath = path.join(__dirname, '../public/uploads/', fileName);

  photo.mv(uploadPath, async (err) => {
    if (err) {
      req.flash('error', 'Upload failed');
      return res.redirect('/profile');
    }
    await db.query('UPDATE users SET profile_photo=$1 WHERE id=$2', [fileName, req.session.userId]);
    req.flash('success', 'Profile photo updated!');
    res.redirect('/profile');
  });
});

// ─── My Results ───────────────────────────────────────────────────
router.get('/my-results', isLoggedIn, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.exam_title, r.score, r.total_marks, r.submitted_at
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      WHERE r.user_id = $1
      ORDER BY r.submitted_at DESC
    `, [req.session.userId]);

    res.render('student/my_results', { results: result.rows });
  } catch (err) {
    console.error(err);
    res.send('Error loading results');
  }
});

module.exports = router;
