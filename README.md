# Internship Management Portal

A full-stack platform for managing internship programs — applications, tasks, mentor reviews, attendance, analytics, and certification.

**Stack:** React (Vite + Tailwind + Recharts) · Node/Express · PostgreSQL · JWT auth

**Modules:** Auth · Attendance · Analytics · Programs & Applications · Tasks & Submissions · Mentor Review · Announcements · Certification

## Setup

**1. Database**
```bash
createdb internship_portal
psql -d internship_portal -f backend/src/db/schema.sql
psql -d internship_portal -f backend/src/db/migration_002_programs.sql
psql -d internship_portal -f backend/src/db/migration_003_tasks_reviews_comm_cert.sql
```

**2. Backend**
```bash
cd backend
cp .env.example .env      # add your DB credentials + JWT_SECRET
npm install
npm run dev                # http://localhost:4000
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Register a new account from the app — pick a role (admin/mentor/intern) on the signup form.

## Roles

- **Admin** — manages programs, applications, and certificates; sees everything
- **Mentor** — reviews their assigned interns' tasks and attendance
- **Intern** — checks in/out, submits tasks, views their own certificates

## What's next

File uploads for submissions (currently just a link field), email notifications, PDF certificate export, and stipend tracking.
