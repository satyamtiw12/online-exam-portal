// Check if logged in
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.redirect('/login');
  async function isLoggedIn(req, res, next) {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  
  // Blocked check
  const db = require('../config/db');
  const user = await db.query('SELECT is_blocked FROM users WHERE id=$1', [req.session.userId]);
  if (user.rows[0]?.is_blocked) {
    req.session.destroy();
    return res.redirect('/login?blocked=1');
  }
  next();
}
}

// Check if admin
function isAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') return next();
  res.redirect('/login');
}

// Check if student
function isStudent(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.redirect('/login');
}

module.exports = { isLoggedIn, isAdmin, isStudent };
