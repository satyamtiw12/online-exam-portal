const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../middleware/auth');

// ─── Instructions Page ────────────────────────────────────────────
router.get('/instructions', isLoggedIn, async (req, res) => {
  const exam_id = parseInt(req.query.exam_id);
  try {
    const exam = await db.query(
      "SELECT * FROM exams WHERE id=$1 AND status='active'", [exam_id]
    );
    if (exam.rows.length === 0) return res.send('Invalid or inactive exam.');

    const attempted = await db.query(
      'SELECT id FROM results WHERE user_id=$1 AND exam_id=$2',
      [req.session.userId, exam_id]
    );
    if (attempted.rows.length > 0) return res.send('You already attempted this exam.');

    res.render('exam/instructions', {
      exam: exam.rows[0],
      username: req.session.username
    });
  } catch (err) {
    console.error(err);
    res.send('Error');
  }
});

// ─── Exam Screen ──────────────────────────────────────────────────
router.get('/exam', isLoggedIn, async (req, res) => {
  const exam_id = parseInt(req.query.exam_id);
  try {
    const exam = await db.query(
      "SELECT * FROM exams WHERE id=$1 AND status='active'", [exam_id]
    );
    if (exam.rows.length === 0) return res.send('Invalid exam.');

    const attempted = await db.query(
      'SELECT id FROM results WHERE user_id=$1 AND exam_id=$2',
      [req.session.userId, exam_id]
    );
    if (attempted.rows.length > 0) return res.send('Already Attempted.');

    const questions = await db.query(
      'SELECT * FROM questions WHERE exam_id=$1', [exam_id]
    );

    // Only send non-answer fields to client
    const safeQuestions = questions.rows.map(q => ({
      id: q.id,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d
    }));

    res.render('exam/exam', {
      exam: exam.rows[0],
      questions: JSON.stringify(safeQuestions),
      duration: exam.rows[0].duration * 60
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading exam');
  }
});

// ─── Submit Exam ──────────────────────────────────────────────────
router.post('/submit', isLoggedIn, async (req, res) => {
  const { exam_id, answers } = req.body;
  const user_id = req.session.userId;

  try {
    // Double-check not already attempted
    const check = await db.query(
      'SELECT id FROM results WHERE user_id=$1 AND exam_id=$2', [user_id, exam_id]
    );
    if (check.rows.length > 0) return res.redirect('/dashboard');

    const questions = await db.query(
      'SELECT id, correct_option FROM questions WHERE exam_id=$1', [exam_id]
    );

    let parsedAnswers = {};
    try { parsedAnswers = JSON.parse(answers); } catch (e) {}

    let score = 0;
    const total = questions.rows.length;

    questions.rows.forEach(q => {
      if (parsedAnswers[q.id] && parsedAnswers[q.id].toUpperCase() === q.correct_option.toUpperCase()) {
        score++;
      }
    });

    await db.query(
      'INSERT INTO results (user_id, exam_id, score, total_marks, submitted_at) VALUES ($1,$2,$3,$4,NOW())',
      [user_id, exam_id, score, total]
    );

    res.redirect('/result?exam_id=' + exam_id);
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});


// ─── Result Page ──────────────────────────────────────────────────
router.get('/result', isLoggedIn, async (req, res) => {
  const exam_id = parseInt(req.query.exam_id);
  try {
    const [result, exam] = await Promise.all([
      db.query('SELECT * FROM results WHERE user_id=$1 AND exam_id=$2 ORDER BY id DESC LIMIT 1', [req.session.userId, exam_id]),
      db.query('SELECT exam_title FROM exams WHERE id=$1', [exam_id])
    ]);
    res.render('exam/result', {
      result: result.rows[0],
      exam: exam.rows[0]
    });
  } catch(err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});




module.exports = router;
