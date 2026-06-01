require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. HELMET — XSS, Clickjacking rokta hai
app.use(helmet({ contentSecurityPolicy: false }));

// 2. Rate Limiting — Brute Force rokta hai
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: '⛔ Too many attempts! Wait 15 minutes.'
// });

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
app.use(globalLimiter);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

// 3. Secure Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'examSecretKey123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

app.use(flash());

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.session = req.session;
  next();
});

// Routes — loginLimiter pass karo
app.use('/', require('./routes/auth')());
app.use('/', require('./routes/student'));
app.use('/admin', require('./routes/admin'));
app.use('/', require('./routes/exam'));

app.get('/', (req, res) => res.redirect('/login'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security active!`);
});