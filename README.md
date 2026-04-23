# EDUCATION_ONLINE — LMS Platform

A full-stack Learning Management System built with **Spring Boot**, **React 19**, **PostgreSQL**, and **Docker Compose**.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        Nginx :80 / :5174                   │
│  /api/*  → backend:8080     /uploads/* → backend:8080      │
│  /*      → frontend:80      (port 5174) → admin:80         │
└──────────────────┬─────────────────────┬───────────────────┘
                   │                     │
         ┌─────────▼──────────┐ ┌───────▼────────┐
         │  Backend (Spring)  │ │ frontend/admin  │
         │      :8080         │ │  (Nginx :80)    │
         └─────────┬──────────┘ └────────────────┘
                   │
         ┌─────────▼──────────┐
         │  PostgreSQL :5432  │
         └────────────────────┘
```

| Service      | Host URL                          | Technology             |
|--------------|-----------------------------------|------------------------|
| Student Web  | http://localhost                  | React 19 + Vite        |
| Admin Panel  | http://localhost:5174             | React 19 + Vite        |
| Backend API  | http://localhost:8080             | Spring Boot 3          |
| pgAdmin      | http://localhost:5050 (dev only)  | pgAdmin 4              |

---

## Quick Start (Docker Compose)

### Prerequisites
- Docker Desktop 24+ with Compose v2
- 4 GB RAM available for containers

### 1. Clone & configure

```bash
git clone <repo-url>
cd EDUCATION_ONLINE

# Copy and edit environment variables
cp .env.example .env
# Edit .env — at minimum change APP_JWT_SECRET
```

### 2. Start the full stack

```bash
docker compose up -d --build
```

First build downloads dependencies and compiles the Spring Boot fat-jar — allow **5–10 minutes**.

### 3. Verify services

```bash
docker compose ps
# All services should show "running"

curl http://localhost/health          # nginx → frontend
curl http://localhost:8080/actuator/health  # backend direct
```

### 4. Access

| URL | Description |
|-----|-------------|
| http://localhost | Student web app |
| http://localhost:5174 | Admin / Teacher panel |
| http://localhost:8080/swagger-ui.html | API docs (if SpringDoc enabled) |

---

## Development Setup (without Docker)

### Backend

```bash
cd backend

# Requires: OpenJDK 20, Maven 3.9+, PostgreSQL 15 running locally
cp src/main/resources/application.yml.example src/main/resources/application.yml
# Edit datasource URL / credentials

./mvnw spring-boot:run
# API available at http://localhost:8080
```

### Frontend (Student Web)

```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local

npm run dev
# http://localhost:5173
```

### Admin Panel

```bash
cd admin
npm install

echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local

npm run dev
# http://localhost:5174
```

---

## Development with Docker (all services except frontend/admin)

```bash
# Starts postgres + backend + pgAdmin; build frontend/admin locally with npm run dev
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres backend pgadmin
```

---

## Project Structure

```
EDUCATION_ONLINE/
├── backend/                     # Spring Boot 3 application
│   ├── src/main/java/com/lms/
│   │   ├── config/              # Security, CORS, WebMvc config
│   │   ├── controller/          # REST controllers
│   │   ├── dto/                 # Request / Response DTOs
│   │   ├── entity/              # JPA entities
│   │   ├── exception/           # Custom exceptions & global handler
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── security/            # JWT filter, UserDetailsService
│   │   ├── service/             # Business logic
│   │   └── util/                # SlugUtils, etc.
│   ├── src/main/resources/
│   │   ├── application.yml      # Dev config
│   │   ├── application-prod.yml # Production config (uses env vars)
│   │   └── db/migration/        # Flyway SQL migrations
│   └── Dockerfile
│
├── frontend/                    # Student Web — React 19 + Vite
│   └── src/
│       ├── app/                 # App entry, router, providers
│       ├── entities/            # Domain types (Course, Lesson, Enrollment…)
│       ├── features/            # Auth guards
│       ├── pages/               # Route pages (S-01 to S-10)
│       ├── shared/              # API layer, utilities, UI components
│       └── widgets/             # Header, Footer, CourseCard, LessonSidebar
│
├── admin/                       # Admin/Teacher Panel — React 19 + Vite
│   └── src/
│       ├── app/                 # App entry, router, providers
│       ├── pages/               # Admin pages (A-01 to A-14)
│       ├── shared/              # API layer, utilities, UI components
│       └── widgets/             # AdminLayout, sidebar nav
│
├── nginx/
│   └── nginx.conf               # Reverse proxy configuration
│
├── docker-compose.yml           # Production stack
├── docker-compose.dev.yml       # Development overrides
├── .env.example                 # Environment variable template
└── README.md
```

---

## API Overview

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Student registration |
| POST | `/auth/login` | Login (returns JWT) |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/courses` | List published courses |
| GET  | `/courses/{id}` | Course detail |
| GET  | `/courses/{id}/lessons` | Lesson list (preview) |
| GET  | `/admin/config/bank-info` | Bank info for payment |

### Authenticated (Student)

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/enrollments` | My enrollments |
| POST | `/enrollments` | Enroll in course |
| POST | `/enrollments/{id}/payment-proof` | Upload payment proof |
| GET  | `/progress/{courseId}` | Course progress |
| POST | `/progress/{lessonId}/open` | Mark lesson opened |
| PUT  | `/progress/{lessonId}/video` | Update video progress |

### Admin/Teacher

All admin endpoints are under `/admin/**` and require `ROLE_ADMIN` (or `ROLE_TEACHER` for course reports).

---

## Default Credentials

After running database migrations (Flyway), no default admin user is seeded — you must create one.

**Create initial admin via SQL:**

```sql
-- bcrypt hash of "Admin@123"
INSERT INTO users (full_name, email, password_hash, role, status, created_at)
VALUES (
  'System Admin',
  'admin@lms.local',
  '$2a$12$LFnGMEBbbE9HWXEF3kIXAeQY1iqnE.o9hJPGZ0YQAW0C1RiKiAL3K',
  'ADMIN',
  'ACTIVE',
  NOW()
);
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `lms_db` | Database name |
| `POSTGRES_USER` | `lms_user` | DB username |
| `POSTGRES_PASSWORD` | `lms_password` | DB password |
| `APP_JWT_SECRET` | *(required)* | JWT signing secret (256-bit) |
| `APP_JWT_EXPIRATION_MS` | `900000` | Access token TTL (15 min) |
| `APP_REFRESH_TOKEN_EXPIRATION_DAYS` | `30` | Refresh token TTL |
| `APP_STORAGE_BASE_URL` | `http://localhost/uploads` | Public URL for file uploads |
| `VITE_API_BASE_URL` | `/api` | API base URL injected at build time |

---

## Useful Commands

```bash
# View logs
docker compose logs -f backend

# Rebuild a single service
docker compose up -d --build frontend

# Stop everything
docker compose down

# Stop and remove volumes (DESTRUCTIVE)
docker compose down -v

# Access PostgreSQL shell
docker exec -it lms_postgres psql -U lms_user -d lms_db

# pgAdmin (dev profile)
docker compose --profile dev up -d pgadmin
```

---

## Known Issues & Notes

1. **Backend health check** — The `actuator/health` endpoint is used by docker-compose. Make sure `spring-boot-starter-actuator` is in `pom.xml`. If not, the healthcheck will fail but the container will still start.

2. **File upload size** — Nginx is configured with `client_max_body_size 500m`. Spring Boot multipart limit is set to 2 GB in `application.yml`. Adjust both if needed.

3. **CORS** — In production, update `SecurityConfig.corsConfigurationSource()` to only allow your actual domain instead of the wildcard `"*"` pattern.

4. **JWT Secret** — The default secret in `application.yml` is only for local development. Always override `APP_JWT_SECRET` in production.

5. **Video seek (Range requests)** — Nginx is configured to pass `Range` and `If-Range` headers through to the backend, which uses Spring's `ResourceHttpRequestHandler` for native Range support.
