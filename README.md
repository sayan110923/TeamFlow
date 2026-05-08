# TeamFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control.

---

## Features

- **Authentication** — JWT-based signup/login
- **Projects** — Create, update, delete projects; invite team members by email
- **Role-based access** — Project owners/admins manage everything; Members can only update task status
- **Tasks** — Create tasks with title, description, priority, due date, and assignee
- **Kanban board** — Column view (To Do / In Progress / Done) with inline status updates
- **Dashboard** — Summary stats, my open tasks, per-project progress bars, overdue indicators
- **Filters** — Filter tasks by status and priority

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, React Query, React Router |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (7-day tokens) |
| Deployment | Railway (backend + DB + frontend) |

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL installed locally — download from [postgresql.org](https://www.postgresql.org/download/)

### 1. Clone & install

```bash
git clone https://github.com/your-username/teamflow.git
cd teamflow
```

```bash
# Backend
cd backend
npm install
```

```bash
# Frontend
cd ../frontend
npm install
```

### 2. Create the database

Open **pgAdmin** or **psql** and run:

```sql
CREATE DATABASE taskmanager;
CREATE USER taskuser WITH PASSWORD 'taskpass';
GRANT ALL PRIVILEGES ON DATABASE taskmanager TO taskuser;
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://taskuser:taskpass@localhost:5432/taskmanager"
JWT_SECRET="any-long-random-string-here"
PORT=5000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### 4. Run migrations and seed

```bash
cd backend
npx prisma migrate dev --name init
node prisma/seed.js
```

### 5. Start both servers

```bash
# Terminal 1 — backend (port 5000)
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Returning to the project

If the project is already set up, just start both servers:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Make sure PostgreSQL is running on your machine before starting.

---

## Deployment on Railway

### Step 1 — Push to GitHub

Make sure your project is pushed to a GitHub repository.

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) and log in
2. Click **New Project** → **GitHub Repository**
3. Select your `teamflow` repo

### Step 3 — Add PostgreSQL

1. In the Railway project dashboard, click **New** → **Database** → **PostgreSQL**
2. Railway automatically sets `DATABASE_URL` for your backend service

### Step 4 — Configure backend service

1. Click on the backend service → **Settings**
2. Set **Root Directory** to `backend`
3. Go to **Variables** tab and add:

   | Variable | Value |
   |----------|-------|
   | `JWT_SECRET` | any long random string |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | add after frontend is deployed |

4. Railway uses `railway.toml` — migrations run automatically on every deploy

### Step 5 — Add frontend service

1. Click **New** → **GitHub Repository** → select `teamflow` again
2. Click on the service → **Settings**
3. Set **Root Directory** to `frontend`
4. Go to **Variables** tab and add:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-backend.up.railway.app/api` |

### Step 6 — Generate public URLs

1. Backend service → **Settings** → **Networking** → **Generate Domain**
2. Frontend service → **Settings** → **Networking** → **Generate Domain**
3. Copy the frontend URL and update `FRONTEND_URL` in the backend variables

### Step 7 — Verify

Visit your frontend Railway URL — the app should be fully live.

---

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create/edit/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Edit task details | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| View project & tasks | ✅ | ✅ |
