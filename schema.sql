-- ============================================
-- Online Exam System - PostgreSQL Schema
-- Run this on your Railway/Render PostgreSQL DB
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  role          VARCHAR(20) DEFAULT 'student',
  profile_photo VARCHAR(255),
  otp           VARCHAR(10),
  otp_expiry    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id          SERIAL PRIMARY KEY,
  exam_title  VARCHAR(255) NOT NULL,
  exam_date   DATE,
  duration    INT NOT NULL,         -- minutes
  status      VARCHAR(20) DEFAULT 'active',
  expiry_date TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id             SERIAL PRIMARY KEY,
  exam_id        INT REFERENCES exams(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  option_a       TEXT NOT NULL,
  option_b       TEXT NOT NULL,
  option_c       TEXT NOT NULL,
  option_d       TEXT NOT NULL,
  correct_option VARCHAR(1) NOT NULL,  -- 'A', 'B', 'C', or 'D'
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
  id           SERIAL PRIMARY KEY,
  user_id      INT REFERENCES users(id) ON DELETE CASCADE,
  exam_id      INT REFERENCES exams(id) ON DELETE CASCADE,
  score        INT NOT NULL,
  total_marks  INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exam_id)  -- prevent duplicate attempts
);

-- ============================================
-- Default Admin Account
-- Password: Admin@123 (bcrypt hash below)
-- Change password after first login!
-- ============================================
INSERT INTO users (username, email, password, role)
VALUES (
  'admin',
  'admin@examportal.com',
  '$2b$10$K7PQe3XZjHXBpkW7K1oAkO9ZxCqQY3mHiH8x.3bZlKz1RuTmhBnlS',
  'admin'
) ON CONFLICT DO NOTHING;
