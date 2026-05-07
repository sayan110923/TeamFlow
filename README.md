# TeamFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control.

## Live Demo

> **[https://your-app.railway.app](https://your-app.railway.app)**

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

## Role Badges

Each project card shows your role within that project:

| Badge | Meaning |
|-------|---------|
| 👑 Owner | You created this project |
| Admin | You were promoted to admin by the owner |
| Member | You were added as a regular member |

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL)

### 1. Clone & install

```bash
git clone https://github.com/your-username/teamflow.git
cd teamflow

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit DATABASE_URL and JWT_SECRET in backend/.env
```

### 3. Start the database

```bash
docker run -d --name teamflow-db \
  -e POSTGRES_USER=taskuser \
  -e POSTGRES_PASSWORD=taskpass \
  -e POSTGRES_DB=taskmanager \
  -p 5432:5432 \
  postgres:16-alpine
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

# Terminal 2 — frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Returning to the project

If you've already set up the project and just want to run it again:

```bash
# Start the database container
docker start teamflow-db

# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## Docker (full stack)

```bash
docker-compose up --build
```

Open [http://localhost](http://localhost)

---

## Deployment on Railway

### Backend

1. Create a new Railway project
2. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`
3. Add a new service from GitHub (point to `/backend`)
4. Set environment variables:
   ```
   JWT_SECRET=<random-secret>
   FRONTEND_URL=https://your-frontend.railway.app
   NODE_ENV=production
   ```
5. Railway uses `railway.toml` — migrations run automatically on deploy

### Frontend

1. Add another service from GitHub (point to `/frontend`)
2. Set build command: `npm run build`
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/users/me` | ✓ | Get current user |
| PUT | `/api/users/me` | ✓ | Update current user |
| GET | `/api/projects` | ✓ | List my projects |
| POST | `/api/projects` | ✓ | Create project |
| GET | `/api/projects/:id` | ✓ Member | Get project |
| PUT | `/api/projects/:id` | ✓ Admin | Update project |
| DELETE | `/api/projects/:id` | ✓ Admin | Delete project |
| GET | `/api/projects/:id/members` | ✓ Member | List members |
| POST | `/api/projects/:id/members` | ✓ Admin | Add member |
| PUT | `/api/projects/:id/members/:uid` | ✓ Admin | Change role |
| DELETE | `/api/projects/:id/members/:uid` | ✓ Admin | Remove member |
| GET | `/api/tasks/project/:id` | ✓ Member | List tasks (filterable) |
| POST | `/api/tasks/project/:id` | ✓ Admin | Create task |
| GET | `/api/tasks/:id` | ✓ Member | Get task |
| PUT | `/api/tasks/:id` | ✓ Member* | Update task |
| DELETE | `/api/tasks/:id` | ✓ Admin | Delete task |
| GET | `/api/dashboard` | ✓ | Dashboard stats & tasks |
| GET | `/health` | — | Health check |

*Members can only update `status`. Admins can update all fields.

---

## Role Permissions

| Action | Owner/Admin | Member |
|--------|-------------|--------|
| Create/edit/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Edit task details | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| View project & tasks | ✅ | ✅ |
