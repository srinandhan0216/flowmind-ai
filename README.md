# FlowMind AI &mdash; Smart Automation Platform

**FlowMind AI** is an enterprise-grade, AI-powered Smart Automation platform designed to coordinate autonomous workflows, document triaging, and cognitive business processes.

---

## Project Structure

```text
flowmind-ai/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Layout, Navbar, Footer
│   │   ├── pages/                # HomePage, WorkflowsPage, SettingsPage, NotFoundPage
│   │   ├── router/               # AppRouter (React Router DOM)
│   │   ├── services/             # Axios API service client
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css             # Tailwind CSS tokens & styling
│   ├── .env                      # Local development environment configuration
│   ├── .env.example              # Environment variables template
│   ├── vite.config.ts            # Vite configured for port 5173
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                      # Node.js + Express.js + TypeScript
│   ├── src/
│   │   ├── config/               # Supabase & Google Gemini API client configs
│   │   ├── controllers/          # Health check & Automation controllers
│   │   ├── middlewares/          # Centralized error handler
│   │   ├── routes/               # API routes (/health, /api/health, /api/automations)
│   │   └── server.ts             # Express server configured for port 5000
│   ├── .env                      # Local development environment configuration
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   └── tsconfig.json
│
└── .gitignore                    # Git ignore file protecting .env and build assets
```

---

## Technology Stack

- **Frontend**:
  - React 19
  - Vite 8
  - TypeScript
  - Tailwind CSS v4
  - React Router DOM
  - Axios
  - Lucide React (Icons)
  - Port: **5173**

- **Backend**:
  - Node.js & Express.js
  - TypeScript
  - tsx (live TypeScript dev runner)
  - Port: **5000**

- **Database Layer**:
  - Supabase PostgreSQL Client (`@supabase/supabase-js`)

- **AI Layer**:
  - Google Gemini API (`@google/generative-ai`)

---

## Getting Started

Both applications are configured to run independently.

### 1. Running the Backend (Port 5000)

Navigate into the backend directory and start the dev server:

```powershell
cd backend
npm run dev
```

- **Server Base URL**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Automations API**: [http://localhost:5000/api/automations](http://localhost:5000/api/automations)

### 2. Running the Frontend (Port 5173)

In a separate terminal, navigate into the frontend directory and start Vite:

```powershell
cd frontend
npm run dev
```

- **Application URL**: [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` if not already present:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase PostgreSQL Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env` if not already present:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note on Security**: No secrets or API keys are hardcoded. All keys are safely isolated into `.env` files that are ignored by git.
