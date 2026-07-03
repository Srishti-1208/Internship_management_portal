-- Internship Management Portal — Core Schema
-- Modules: Auth, Attendance, Analytics

CREATE TYPE user_role AS ENUM ('admin', 'mentor', 'intern');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave');

CREATE TABLE users (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(120)  NOT NULL,
  email          VARCHAR(160)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  role           user_role     NOT NULL DEFAULT 'intern',
  department     VARCHAR(120),
  mentor_id      INTEGER REFERENCES users(id) ON DELETE SET NULL, -- interns linked to a mentor
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE attendance (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE    NOT NULL DEFAULT CURRENT_DATE,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  status      attendance_status NOT NULL DEFAULT 'present',
  remarks     VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date) -- one attendance record per intern per day
);

CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_users_role ON users(role);

-- Helpful view: per-intern attendance % (last 90 days)
CREATE OR REPLACE VIEW intern_attendance_summary AS
SELECT
  u.id AS user_id,
  u.name,
  u.department,
  COUNT(a.id) FILTER (WHERE a.status = 'present') AS present_days,
  COUNT(a.id) FILTER (WHERE a.status = 'half_day') AS half_days,
  COUNT(a.id) FILTER (WHERE a.status = 'absent') AS absent_days,
  COUNT(a.id) FILTER (WHERE a.status = 'leave') AS leave_days,
  COUNT(a.id) AS total_marked_days,
  ROUND(
    (COUNT(a.id) FILTER (WHERE a.status = 'present')::NUMERIC +
     0.5 * COUNT(a.id) FILTER (WHERE a.status = 'half_day')::NUMERIC)
    / NULLIF(COUNT(a.id), 0) * 100, 1
  ) AS attendance_pct
FROM users u
LEFT JOIN attendance a ON a.user_id = u.id AND a.date >= CURRENT_DATE - INTERVAL '90 days'
WHERE u.role = 'intern'
GROUP BY u.id, u.name, u.department;
