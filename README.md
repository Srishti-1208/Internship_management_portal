# Internship Management Portal — Phase 1

Modules included in this build: **Auth**, **Attendance**, **Analytics Dashboard**.
Stack: React (Vite + Tailwind + Recharts) · Node/Express · PostgreSQL · JWT auth.

## Project structure

```
internship-portal/
  backend/     Express API (auth, attendance, analytics)
  frontend/    React SPA
```

## 1. Database setup

Create a database and load the schema:

```bash
createdb internship_portal
psql -d internship_portal -f backend/src/db/schema.sql
psql -d internship_portal -f backend/src/db/seed.sql   # optional sample data
```

Seeded logins (all use password `Passw0rd!`):
- `admin@example.com` — admin
- `mentor1@example.com` / `mentor2@example.com` — mentors
- `sara@example.com`, `karan@example.com`, `neha@example.com` — interns

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # edit DB credentials + JWT_SECRET
npm install
npm run dev                # starts on http://localhost:4000
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173` and sign in (or register a new account — new
signups default to the `intern` role unless you pick another one on the form).

## API summary

**Auth**
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — get a JWT
- `GET /api/auth/me` — current user (requires token)

**Attendance**
- `POST /api/attendance/checkin` — intern only
- `POST /api/attendance/checkout` — intern only
- `GET /api/attendance/me` — intern's own history
- `GET /api/attendance` — admin/mentor roster view (filters: `userId`, `from`, `to`, `status`, `department`)
- `PUT /api/attendance/:id` — admin/mentor status override

**Analytics** (admin/mentor only)
- `GET /api/analytics/overview` — today's counts + avg attendance %
- `GET /api/analytics/trend?days=21` — daily present/absent series
- `GET /api/analytics/interns` — per-intern attendance % (last 90 days)
- `GET /api/analytics/department-breakdown` — per-department averages

Mentors are automatically scoped to only see interns assigned to them
(`mentor_id` on the `users` table); admins see everything.

## Notes on how this was built

- Passwords are hashed with bcrypt; sessions are stateless JWTs (7-day expiry).
- The `intern_attendance_summary` SQL view does the attendance-% math in the
  database rather than the app layer, so it stays consistent across endpoints.
- Attendance is one row per intern per day (`UNIQUE(user_id, date)`), which
  keeps check-in/check-out idempotent and makes the analytics queries simple
  aggregates rather than needing session-stitching logic.

## What's next (not built yet)

Program/cohort management, task & project submissions, mentor review &
scoring, and certificate generation are designed in the original feature list
but out of scope for this phase — happy to build any of those next.
