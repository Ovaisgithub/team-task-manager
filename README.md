# Team Task Manager

A full-stack web application for managing team projects and tasks with role-based access control.

**Live URL:** https://your-frontend.railway.app  
**GitHub:** https://github.com/your-username/team-task-manager

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Spring Data JPA |
| Auth | Custom token-based auth with BCrypt password hashing |
| Database | MySQL 8 |
| Frontend | React 18, React Router v6, Axios |
| Deployment | Railway (separate services for backend, frontend, and MySQL) |

---

## Features

### Authentication
- User registration and login with JWT-style token auth
- Passwords hashed with BCrypt
- First registered user automatically becomes **Admin**; all subsequent users are **Members**
- Tokens expire after 7 days

### Role-Based Access Control
| Action                  | Admin | Member (owner) | Member (participant) |
|-------------------------|----   |---------       |-----------|
| View all projects       | ✅    | ✅ own        | ✅ joined |
| Create project          | ✅    | ✅            | ✅        |
| Delete project          | ✅    | ✅            | ❌        |
| Manage tasks            | ✅    | ✅            | ✅        |
| Add/remove team members | ✅    | ✅            | ❌        |
| View overdue tasks      | all   | own projects   | own projects |

### Projects
- Create, view, and delete projects
- Add/remove team members per project
- Members can view and manage tasks within joined projects

### Tasks
- Create tasks with title, description, due date, and assignee
- Three statuses: **Todo → In Progress → Done**
- One-click status transitions via Kanban-style board
- Delete tasks

### Dashboard
- Stat cards: total projects, total tasks, todo / in-progress / done counts, overdue count
- Overdue tasks list with project links and assignee info

---

## Running Locally

### Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8 running locally

### Backend

```bash
# 1. Create the DB (or let Hibernate create it automatically)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS task_manager;"

# 2. Start the backend
cd backend
mvn spring-boot:run
# API available at http://localhost:8080
```

The default DB connection is:
```
URL:      jdbc:mysql://localhost:3306/task_manager
Username: root
Password: password
```
Override any of these in `backend/src/main/resources/application.properties`.

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

To point the frontend at a different backend URL, create `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Deployment on Railway

### Step 1 — Set up MySQL
1. In Railway, click **+ New** → **Database** → **MySQL**.
2. Copy the generated connection variables (host, port, username, password, database name).

### Step 2 — Deploy the backend
1. Click **+ New** → **GitHub Repo** → select this repo.
2. Set the **root directory** to `backend`.
3. Add these environment variables in Railway's Variables tab:

```
DATABASE_URL=jdbc:mysql://<host>:<port>/<dbname>?useSSL=true&requireSSL=true
DATABASE_USERNAME=<mysql_user>
DATABASE_PASSWORD=<mysql_password>
PORT=8080
```

Railway will detect the `railway.toml` and build using Maven. The JAR is started automatically.

### Step 3 — Deploy the frontend
1. Click **+ New** → **GitHub Repo** → select this repo again.
2. Set the **root directory** to `frontend`.
3. Add this environment variable:

```
VITE_API_BASE_URL=https://<your-backend-railway-domain>/api
```

The `railway.toml` runs `npm run build` and serves the dist folder.

---

## API Reference

### Auth
| Method | Endpoint | Body | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | None |
| POST | `/api/auth/login` | `{email, password}` | None |

### Projects
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/projects` | Required |
| POST | `/api/projects` | Required |
| GET | `/api/projects/:id` | Required |
| DELETE | `/api/projects/:id` | Owner/Admin |
| POST | `/api/projects/:id/members/:userId` | Owner/Admin |
| DELETE | `/api/projects/:id/members/:userId` | Owner/Admin |

### Tasks
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/projects/:id/tasks` | Project member |
| POST | `/api/projects/:id/tasks` | Project member |
| PATCH | `/api/tasks/:id` | Project member |
| DELETE | `/api/tasks/:id` | Project member |
| GET | `/api/tasks/overdue` | Required |

### Dashboard & Users
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/dashboard/stats` | Required |
| GET | `/api/users` | Required |
| GET | `/api/health` | None |

---

## Validation Rules
- Email must be valid format
- Password minimum 6 characters
- Task title and project name are required (non-blank)
- Duplicate email registration is rejected
- Token validated on every protected request
