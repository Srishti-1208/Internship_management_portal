-- Migration 002: Program & Intern Management
-- Run this AFTER schema.sql (it depends on the `users` table already existing)

CREATE TYPE program_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'offered', 'rejected', 'onboarded');

-- An internship program / cohort / batch
CREATE TABLE programs (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(160) NOT NULL,
  description  TEXT,
  department   VARCHAR(120),
  start_date   DATE,
  end_date     DATE,
  status       program_status NOT NULL DEFAULT 'draft',
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which interns belong to which program (many-to-many; an intern could join more than one cohort over time)
CREATE TABLE program_interns (
  id          SERIAL PRIMARY KEY,
  program_id  INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, user_id)
);

-- Applicants moving through the selection pipeline for a given program.
-- Not yet a `users` row until they're onboarded.
CREATE TABLE applications (
  id           SERIAL PRIMARY KEY,
  program_id   INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(160) NOT NULL,
  department   VARCHAR(120),
  notes        TEXT,
  status       application_status NOT NULL DEFAULT 'applied',
  onboarded_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, email)
);

CREATE INDEX idx_program_interns_program ON program_interns(program_id);
CREATE INDEX idx_program_interns_user ON program_interns(user_id);
CREATE INDEX idx_applications_program_status ON applications(program_id, status);

-- Keep updated_at current on applications
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
