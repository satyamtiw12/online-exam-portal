const express = require('express');
const router = express.Router();
module.exports = function(loginLimiter) {
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const db = require('../config/db');
// const { Resend } = require('resend');
// const resend = new Resend(process.env.RESEND_API_KEY);

// ─── GET Login ───────────────────────────────────────────────────
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// ─── POST Login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      // req.flash('error', 'User not found ❌');
      req.flash('error', 'Invalid username or password ❌');
      return res.redirect('/login');
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // req.flash('error', 'Wrong Password ❌');
      req.flash('error', 'Invalid username or password ❌');
      return res.redirect('/login');
    }
    req.session.userId   = user.id;
    req.session.username = user.username;
    req.session.role     = user.role;

    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/login');
  }
});

// ─── GET Register ────────────────────────────────────────────────
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// ─── POST Register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!strongPass.test(password)) {
    req.flash('error', '❌ Password must be 8+ chars with Uppercase, Lowercase, Number & Special char');
    return res.redirect('/register');
  }

  try {
    const exists = await db.query(
      'SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]
    );
    if (exists.rows.length > 0) {
      req.flash('error', '❌ Username or Email already exists');
      return res.redirect('/register');
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
      [username, email, hash]
    );
    req.flash('success', '✅ Registration successful! Please login.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/register');
  }
});

// ─── GET Logout ──────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ─── GET Forgot Password ─────────────────────────────────────────
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot_password');
});

// ─── POST Forgot Password (Send OTP) ─────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      req.flash('error', 'Email not found ❌');
      return res.redirect('/forgot-password');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.query('UPDATE users SET otp=$1, otp_expiry=$2 WHERE email=$3', [otp, expiry, email]);

    // Send email
// Send email
   const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

await transporter.sendMail({
  // from: `"Exam Portal" <${process.env.EMAIL_USER}>`,
  from: `"Exam Portal" <${process.env.BREVO_USER}>`,
  to: email,
  subject: `${otp} is your OTP`,
  text: `Your OTP is: ${otp}\nValid for 5 minutes.\nDo not share with anyone.`
});
    
    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to send OTP');
    res.redirect('/forgot-password');
  }
});

// ─── GET Verify OTP ──────────────────────────────────────────────
router.get('/verify-otp', (req, res) => {
  res.render('auth/verify_otp', { email: req.query.email });
});

// ─── POST Verify OTP ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await db.query(
      'SELECT otp, otp_expiry FROM users WHERE email=$1', [email]
    );
    if (result.rows.length === 0) {
      req.flash('error', 'Invalid request');
      return res.redirect('/forgot-password');
    }
    const user = result.rows[0];
    if (user.otp !== otp || new Date() > new Date(user.otp_expiry)) {
      req.flash('error', '❌ Invalid or expired OTP');
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }
    res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error(err);
    res.redirect('/forgot-password');
  }
});

// ─── GET Reset Password ──────────────────────────────────────────
router.get('/reset-password', (req, res) => {
  res.render('auth/reset_password', { email: req.query.email });
});

// ─── POST Reset Password ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, password, confirm_password } = req.body;
  if (password !== confirm_password) {
    req.flash('error', '❌ Passwords do not match');
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }
  const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!strongPass.test(password)) {
    req.flash('error', '❌ Password too weak');
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password=$1, otp=NULL, otp_expiry=NULL WHERE email=$2', [hash, email]);
    req.flash('success', '✅ Password reset successful!');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

return router;
};
