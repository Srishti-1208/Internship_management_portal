## Features

- **Auth** — register/login, JWT-protected routes, password reset flow
- **Programs & Applications** — browse internship programs, apply, track application status
- **Tasks** — task assignment, detail view, comments
- **Attendance** — attendance tracking per intern
- **Certificates** — certificate generation/viewing
- **Announcements** — program-wide announcements
- **Analytics Dashboard** — charts via Recharts
- **AI Chat Assistant** — floating launcher (bottom-right) backed by Gemini, answers questions about tasks, certificates, attendance, and applications. Includes an animated CTA tooltip and attention-pulse UX.

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Gemini API key (for the chat assistant)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development

# Optional — required only if email sending (password reset) is used
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Run the server:

```bash
npm run dev     # nodemon, auto-reload
# or
npm start       # plain node
```

The API will be available at `http://localhost:4000/api`, with a health check at `/api/health`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`. It expects the backend to be reachable at the URL configured in `src/api/axios.js` (defaults to `http://localhost:4000/api`).

### 3. Build for Production

```bash
cd frontend
npm run build      # outputs to frontend/dist
npm run preview    # preview the production build locally
```

## API Overview

All routes are prefixed with `/api`.

| Route | Purpose |
|---|---|
| `/auth` | Register, login, password reset |
| `/attendance` | Attendance records |
| `/analytics` | Dashboard metrics |
| `/programs` | Internship programs |
| `/applications` | Program applications |
| `/tasks` | Task assignment & tracking |
| `/announcements` | Announcements |
| `/certificates` | Certificate issuance/retrieval |
| `/chat` | AI assistant (Gemini-backed) |

Protected routes require a `Bearer <token>` header, issued at login/register.

## Notes

- `frontend/CHATBOT_UX_README.md` documents the chatbot launcher's tooltip/pulse UX in detail, including a fix for a timing bug where the tooltip wouldn't show automatically on page load.
- `node_modules` is excluded from any distributed zip of this project — run `npm install` in both `frontend/` and `backend/` after extracting.
