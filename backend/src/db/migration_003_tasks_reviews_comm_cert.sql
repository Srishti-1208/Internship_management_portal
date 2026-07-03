-- Migration 003: Task/Project Management, Mentor Review, Communication, Certification
-- Run this AFTER migration_002_programs.sql

CREATE TYPE submission_status AS ENUM ('not_started', 'in_progress', 'submitted', 'needs_revision', 'approved');

-- A task/project, created within a program, assigned by a mentor (or admin)
CREATE TABLE tasks (
  id           SERIAL PRIMARY KEY,
  program_id   INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title        VARCHAR(160) NOT NULL,
  description  TEXT,
  due_date     DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which interns a task is assigned to (a task can go to one intern or a whole cohort)
CREATE TABLE task_assignments (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  intern_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      submission_status NOT NULL DEFAULT 'not_started',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, intern_id)
);

-- An intern's submitted work for a task assignment (one row per assignment; resubmission updates it)
CREATE TABLE submissions (
  id             SERIAL PRIMARY KEY,
  assignment_id  INTEGER NOT NULL UNIQUE REFERENCES task_assignments(id) ON DELETE CASCADE,
  content_url    VARCHAR(500),
  notes          TEXT,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mentor review/score for a submission
CREATE TABLE reviews (
  id             SERIAL PRIMARY KEY,
  submission_id  INTEGER NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  score          NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  feedback       TEXT,
  reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements — program-scoped, or global if program_id is NULL
CREATE TABLE announcements (
  id          SERIAL PRIMARY KEY,
  program_id  INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title       VARCHAR(160) NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Simple comment thread on a task, visible to the mentor + assigned interns
CREATE TABLE task_comments (
  id          SERIAL PRIMARY KEY,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issued completion certificates
CREATE TABLE certificates (
  id                SERIAL PRIMARY KEY,
  intern_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id        INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  certificate_code  VARCHAR(24) NOT NULL UNIQUE,
  attendance_pct    NUMERIC(5,1),
  avg_score         NUMERIC(5,2),
  issued_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (intern_id, program_id)
);

CREATE INDEX idx_tasks_program ON tasks(program_id);
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_intern ON task_assignments(intern_id);
CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_announcements_program ON announcements(program_id);
CREATE INDEX idx_certificates_program ON certificates(program_id);

-- Per-intern average review score, reused by both analytics and certification eligibility
CREATE OR REPLACE VIEW intern_review_summary AS
SELECT
  ta.intern_id AS user_id,
  COUNT(r.id) AS reviewed_count,
  COUNT(ta.id) AS assigned_count,
  ROUND(AVG(r.score), 1) AS avg_score
FROM task_assignments ta
LEFT JOIN submissions s ON s.assignment_id = ta.id
LEFT JOIN reviews r ON r.submission_id = s.id
GROUP BY ta.intern_id;
