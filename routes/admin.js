const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// ─── Dashboard ───────────────────────────────────────────────────
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const [questions, exams, students, activeExams, results] = await Promise.all([
      db.query('SELECT COUNT(*) FROM questions'),
      db.query('SELECT COUNT(*) FROM exams'),
      db.query("SELECT COUNT(*) FROM users WHERE role='student'"),
      db.query("SELECT COUNT(*) FROM exams WHERE status='active' AND expiry_date >= NOW()"),
      db.query(`
        SELECT r.id, u.username, e.exam_title, r.score, r.total_marks, r.submitted_at
        FROM results r
        JOIN users u ON r.user_id = u.id
        JOIN exams e ON r.exam_id = e.id
        ORDER BY r.submitted_at DESC LIMIT 10
      `)
    ]);

    res.render('admin/dashboard', {
      totalQuestions: questions.rows[0].count,
      totalExams: exams.rows[0].count,
      totalStudents: students.rows[0].count,
      activeExams: activeExams.rows[0].count,
      results: results.rows
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading dashboard');
  }
});

// ─── Delete Result ────────────────────────────────────────────────
router.get('/delete-result/:id', isAdmin, async (req, res) => {
  await db.query('DELETE FROM results WHERE id=$1', [req.params.id]);
  res.redirect('/admin/dashboard');
});

// ─── Create Exam (GET) ────────────────────────────────────────────
router.get('/create-exam', isAdmin, (req, res) => {
  res.render('admin/create_exam');
});

// ─── Create Exam (POST) ───────────────────────────────────────────
router.post('/create-exam', isAdmin, async (req, res) => {
  const { exam_title, exam_date, duration, expiry_date, total_marks, pass_marks, negative_marking, instructions } = req.body;
  if (new Date(expiry_date) <= new Date()) {
    req.flash('error', 'Expiry date must be in the future!');
    return res.redirect('/admin/create-exam');
  }
  try {
    await db.query(
  "INSERT INTO exams (exam_title, exam_date, duration, status, expiry_date, total_marks, pass_marks, negative_marking, instructions) VALUES ($1,$2,$3,'active',$4,$5,$6,$7,$8)",
  [exam_title, exam_date, duration, expiry_date, total_marks, pass_marks, negative_marking, instructions]
);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating exam');
    res.redirect('/admin/create-exam');
  }
});

// ─── Add Question (GET) ───────────────────────────────────────────
router.get('/add-question', isAdmin, async (req, res) => {
  const exams = await db.query("SELECT * FROM exams WHERE status='active'");
  res.render('admin/add_question', { exams: exams.rows });
});

// ─── Add Question (POST) ──────────────────────────────────────────
router.post('/add-question', isAdmin, async (req, res) => {
  const { exam_id, question, option_a, option_b, option_c, option_d, correct_option } = req.body;
  try {
    await db.query(
      'INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [exam_id, question, option_a, option_b, option_c, option_d, correct_option]
    );
    req.flash('success', 'Question added successfully ✅');
    res.redirect('/admin/add-question');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error adding question');
    res.redirect('/admin/add-question');
  }
});

// ─── Manage Questions ─────────────────────────────────────────────
router.get('/manage-questions', isAdmin, async (req, res) => {
  const questions = await db.query('SELECT * FROM questions ORDER BY id DESC');
  res.render('admin/manage_questions', { questions: questions.rows });
});

// ─── Delete Question ──────────────────────────────────────────────
router.get('/delete-question/:id', isAdmin, async (req, res) => {
  await db.query('DELETE FROM questions WHERE id=$1', [req.params.id]);
  res.redirect('/admin/manage-questions');
});

// ─── Edit Question (GET) ──────────────────────────────────────────
router.get('/edit-question/:id', isAdmin, async (req, res) => {
  const [q, exams] = await Promise.all([
    db.query('SELECT * FROM questions WHERE id=$1', [req.params.id]),
    db.query("SELECT * FROM exams WHERE status='active'")
  ]);
  if (q.rows.length === 0) return res.send('Question not found');
  res.render('admin/edit_question', { question: q.rows[0], exams: exams.rows });
});

// ─── Edit Question (POST) ─────────────────────────────────────────
router.post('/edit-question/:id', isAdmin, async (req, res) => {
  const { exam_id, question, option_a, option_b, option_c, option_d, correct_option } = req.body;
  await db.query(
    'UPDATE questions SET exam_id=$1, question=$2, option_a=$3, option_b=$4, option_c=$5, option_d=$6, correct_option=$7 WHERE id=$8',
    [exam_id, question, option_a, option_b, option_c, option_d, correct_option, req.params.id]
  );
  req.flash('success', 'Question updated ✅');
  res.redirect('/admin/manage-questions');
});



// ─── View All Results ─────────────────────────────────────────────
router.get('/view-results', isAdmin, async (req, res) => {
  const results = await db.query(`
    SELECT r.id, u.username, e.exam_title, r.score, r.total_marks, r.submitted_at
    FROM results r
    JOIN users u ON r.user_id = u.id
    JOIN exams e ON r.exam_id = e.id
    ORDER BY r.submitted_at DESC
  `);
  res.render('admin/view_results', { results: results.rows });
});



// ─── Student Management ───────────────────────────────────────────
router.get('/students', isAdmin, async (req, res) => {
  const search = req.query.search || '';
  const students = await db.query(`
    SELECT id, username, email, is_blocked, created_at 
    FROM users 
    WHERE role='student' 
    AND (username ILIKE $1 OR email ILIKE $1)
    ORDER BY created_at DESC
  `, [`%${search}%`]);
  res.render('admin/students', { students: students.rows, search });
});

// Block/Unblock
router.get('/students/block/:id', isAdmin, async (req, res) => {
  await db.query('UPDATE users SET is_blocked=true WHERE id=$1', [req.params.id]);
  res.redirect('/admin/students');
});

router.get('/students/unblock/:id', isAdmin, async (req, res) => {
  await db.query('UPDATE users SET is_blocked=false WHERE id=$1', [req.params.id]);
  res.redirect('/admin/students');
});

// Delete Student
router.get('/students/delete/:id', isAdmin, async (req, res) => {
  await db.query('DELETE FROM users WHERE id=$1 AND role=$2', [req.params.id, 'student']);
  res.redirect('/admin/students');
});

// Reset Password
router.post('/students/reset-password/:id', isAdmin, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const newPass = 'Student@123';
  const hash = await bcrypt.hash(newPass, 10);
  await db.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.params.id]);
  req.flash('success', `Password reset to: Student@123`);
  res.redirect('/admin/students');
});

module.exports = router;
