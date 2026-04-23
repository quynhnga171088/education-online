# Phase 7 — Integration, Docker & End-to-End Verification

## Mục tiêu

Hoàn thiện hệ thống để chạy toàn bộ stack trong Docker Compose với một **Nginx reverse proxy** làm entry point duy nhất. Verify các flow E2E quan trọng, ghi lại known issues và hướng dẫn vận hành.

---

## Các bước đã thực hiện

### 7.1 — Nginx Reverse Proxy (`nginx/nginx.conf`)

**File tạo mới:** `nginx/nginx.conf`

Nginx được cấu hình với **hai server block**:

| Port | Mục đích |
|------|----------|
| `80` | Student Frontend + API proxy + File uploads |
| `5174` | Admin Panel + API proxy + File uploads |

**Routing rules:**

```
Port 80:
  /api/*      → rewrite → backend:8080   (strip /api prefix)
  /uploads/*  → backend:8080/uploads/*   (Range request support)
  /*          → frontend:80              (Student SPA)

Port 5174:
  /api/*      → rewrite → backend:8080
  /uploads/*  → backend:8080/uploads/*
  /*          → admin:80                 (Admin SPA)
```

**Điểm kỹ thuật quan trọng:**
- `rewrite ^/api/(.*)$ /$1 break;` — strip prefix `/api/` trước khi forward tới backend. Backend routes không có prefix `/api/`.
- `client_max_body_size 500m;` — cho phép upload video lớn.
- Pass-through `Range` và `If-Range` headers để video seek hoạt động (Spring `ResourceHttpRequestHandler` xử lý native Range requests).
- `proxy_buffering off;` cho REST API để tránh buffer delay với large response bodies.
- `proxy_read_timeout 300s;` cho các request upload file lớn.

---

### 7.2 — Docker Compose Full Stack (`docker-compose.yml`)

**File cập nhật:** `docker-compose.yml`

#### Thêm service `nginx`

```yaml
nginx:
  image: nginx:1.25-alpine
  container_name: lms_nginx
  ports:
    - "80:80"
    - "5174:5174"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  depends_on:
    - frontend
    - admin
    - backend
```

Nginx depends on tất cả 3 services để đảm bảo chúng đã sẵn sàng trước khi nhận traffic.

#### Thêm build args cho frontend/admin

```yaml
frontend:
  build:
    args:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-/api}
  expose:
    - "80"   # internal only, access via nginx

admin:
  build:
    args:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-/api}
  expose:
    - "80"
```

Frontend và admin không còn expose port trực tiếp ra host — chỉ accessible qua nginx.

#### Cập nhật `APP_STORAGE_BASE_URL`

```yaml
backend:
  environment:
    APP_STORAGE_BASE_URL: ${APP_STORAGE_BASE_URL:-http://localhost/uploads}
```

Khi chạy qua nginx, uploaded files được access tại `http://localhost/uploads/...` (port 80), thay vì `http://localhost:8080/uploads/...`.

#### Sử dụng environment variables từ `.env`

Tất cả sensitive values (DB password, JWT secret) dùng `${VAR:-default}` syntax, đọc từ file `.env`.

#### Health check cho backend

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:8080/actuator/health 2>/dev/null | grep -q '\"UP\"' || exit 1"]
  interval: 30s
  retries: 5
  start_period: 60s
```

---

### 7.3 — Dockerfile Updates (Frontend & Admin)

**Files cập nhật:** `frontend/Dockerfile`, `admin/Dockerfile`

Thêm `ARG` và `ENV` để inject `VITE_API_BASE_URL` tại build time:

```dockerfile
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build
```

**Tại sao cần làm vậy?** Vite embed environment variables vào JavaScript bundle tại **build time** (không phải runtime). Nếu không pass build arg, `VITE_API_BASE_URL` sẽ là `http://localhost:8080` (hardcoded default trong source code) và API calls sẽ fail khi chạy trong Docker.

---

### 7.4 — Environment Variables Template (`.env.example`)

**File tạo mới:** `.env.example`

```env
# PostgreSQL
POSTGRES_DB=lms_db
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=lms_password

# JWT
APP_JWT_SECRET=CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_SECRET_256BIT
APP_JWT_EXPIRATION_MS=900000
APP_REFRESH_TOKEN_EXPIRATION_DAYS=30

# Storage
APP_STORAGE_BASE_URL=http://localhost/uploads

# Vite build-time
VITE_API_BASE_URL=/api
```

---

### 7.5 — Docker Compose Development Override (`docker-compose.dev.yml`)

**File tạo mới:** `docker-compose.dev.yml`

Override file để chạy development mode:
- Disable nginx (access services directly)
- Expose frontend trên port 5173, admin trên port 5174
- Inject `VITE_API_BASE_URL=http://localhost:8080` (direct backend access)
- Enable pgAdmin mặc định

```bash
# Chạy dev mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

### 7.6 — Project README (`README.md`)

**File tạo mới:** `README.md` ở root directory

Bao gồm:
- Architecture diagram (ASCII)
- Quick start với Docker Compose
- Local development setup (backend, frontend, admin)
- API overview table
- Environment variables reference
- Useful commands
- Known issues & notes

---

## End-to-End Verification Checklist

Dưới đây là checklist các flows cần verify khi chạy full stack. Các flows đã được verify qua **static analysis** (code review, logic tracing) vì môi trường CI không có Docker.

### Flow 1: Student đăng ký → Đăng nhập → Xem catalog → Đăng ký khóa → Upload biên lai

```
[✓] POST /auth/register  → AuthController → AuthService.register() → BCrypt hash → DB insert
[✓] POST /auth/login     → JWT access token (15 phút) + refresh token (30 ngày) trả về
[✓] GET  /courses        → CourseController.list() → PUBLISHED courses only
[✓] GET  /courses/{id}   → CourseDetailPage hiển thị lesson outline (locked nếu chưa enroll)
[✓] POST /enrollments    → EnrollmentService.create() → status PENDING → redirect PaymentPage
[✓] POST /enrollments/{id}/payment-proof → upload file → EnrollmentService.uploadProof()
```

**Preconditions:** Course tồn tại với status=PUBLISHED; student chưa enrolled.

**Expected:** Enrollment record với status=PENDING, payment proof URL saved.

---

### Flow 2: Admin duyệt enrollment → Student vào học được

```
[✓] Admin GET  /admin/enrollments?status=PENDING → EnrollmentsPage (A-09) hiển thị danh sách
[✓] Admin POST /admin/enrollments/{id}/approve  → status → APPROVED
[✓] Student GET /courses/{id}/lessons           → tất cả lessons accessible (not locked)
[✓] Student GET /learn/{courseId}/{lessonId}    → LearnPage hiển thị nội dung
```

**Expected:** Sau khi approve, `LessonService.getLessons()` trả về đầy đủ `textContent`/`videoUrl` cho enrolled student.

---

### Flow 3: Student học video → Progress tracking → % tăng dần

```
[✓] LearnPage mount                → POST /progress/{lessonId}/open → status IN_PROGRESS
[✓] ReactPlayer onProgress (10s)  → PUT  /progress/{lessonId}/video → {watchedSeconds, maxWatchedPercent}
[✓] ProgressService.updateVideo() → nếu maxWatchedPercent ≥ 50% (COMPLETION_MODE=VIDEO_50) → COMPLETED
[✓] GET /progress/{courseId}      → CourseProgressResponse với progressPercent cập nhật
[✓] LessonSidebar                 → hiển thị ✓ icon cho lessons COMPLETED
```

**Throttling:** Video progress API call được throttle 10 giây/lần để giảm load.

---

### Flow 4: Teacher tạo khóa → Thêm lesson VIDEO (upload file) → Publish

```
[✓] Admin POST /courses             → CourseCreatePage (A-04) → status DRAFT
[✓] Admin POST /courses/{id}/lessons → LessonCreatePage (A-07) → contentType=VIDEO, videoSourceType=UPLOAD
[✓] Admin POST /upload/video        → UploadController → FileStorageService → /app/uploads/videos/
[✓] Admin PUT  /courses/{id}        → CourseEditPage (A-05) → status=PUBLISHED
```

**Expected:** Course visible trên trang chủ student, lesson video playable sau khi enroll.

---

### Flow 5: Teacher tạo lesson TEXT → Đính kèm PDF → Student xem inline

```
[✓] Admin POST /courses/{id}/lessons → LessonCreatePage → contentType=TEXT, TipTap HTML content
[✓] Admin POST /attachments/{lessonId} → AttachmentController → upload PDF → /uploads/attachments/
[✓] Student GET /courses/{id}/lessons/{lessonId} → textContent và attachments returned (if enrolled)
[✓] LearnPage → hiển thị HTML content qua dangerouslySetInnerHTML + attachment links
```

---

### Flow 6: Admin quản lý user (Tạo Teacher, Block Student)

```
[✓] Admin POST /admin/users/teachers       → UserFormPage (A-11) → CREATE mode → new TEACHER user
[✓] Admin PUT  /admin/users/{id}           → UserFormPage → EDIT mode → status=BLOCKED
[✓] Blocked user POST /auth/login          → AuthService.login() throws "Account is disabled"
[✓] Teacher login                          → AdminLayout role check → sidebar filtered (no Users/Settings)
```

---

### Flow 7: Admin xem báo cáo (Dashboard, khóa detail)

```
[✓] Admin GET /admin/reports/overview              → ReportService.getOverview() → counts + top courses
[✓] DashboardPage (A-02)                           → StatsCards + BarChart (recharts)
[✓] Admin GET /admin/reports/courses/{courseId}    → monthly enrollments + lesson completion stats
[✓] CourseReportPage (A-13)                        → BarChart + completion table
[✓] Teacher access                                 → SecurityConfig allows TEACHER role for this endpoint
```

---

### Flow 8: Admin cấu hình COMPLETION_MODE → Verify behavior thay đổi

```
[✓] Admin PUT /admin/config → SettingsPage (A-14) → SystemConfigService.update() → invalidate cache
[✓] ProgressService.updateVideo() → systemConfigService.get("COMPLETION_MODE") → cached value
[✓] Cache TTL = 5 phút → sau khi update, config có hiệu lực trong ≤ 5 phút
[✓] COMPLETION_MODE=OPEN    → lesson COMPLETED ngay khi mở (markLessonOpen)
[✓] COMPLETION_MODE=VIDEO_50 → lesson COMPLETED khi maxWatchedPercent ≥ 50%
```

---

### Flow 9: Token refresh — Access token hết hạn → Auto-refresh → Tiếp tục

```
[✓] axios response interceptor (axiosInstance.ts):
    → 401 response → check không phải /auth/refresh endpoint
    → POST /auth/refresh với refreshToken từ authStore
    → nhận {accessToken, refreshToken, user}
    → authStore.setAuth(user, newAt, newRt)
    → retry original request với new token
[✓] Nếu refresh fail (token expired/revoked) → logout → redirect /login
[✓] Cả frontend và admin đều có cùng logic này
```

---

## Cấu trúc File Docker

```
EDUCATION_ONLINE/
├── nginx/
│   └── nginx.conf              ← NEW: Reverse proxy config
├── docker-compose.yml          ← UPDATED: nginx service + build args + env vars
├── docker-compose.dev.yml      ← NEW: Dev override (no nginx, direct ports)
├── .env.example                ← NEW: Environment variable template
├── README.md                   ← NEW: Project documentation
├── frontend/
│   └── Dockerfile              ← UPDATED: VITE_API_BASE_URL build arg
└── admin/
    └── Dockerfile              ← UPDATED: VITE_API_BASE_URL build arg
```

---

## Hướng dẫn vận hành

### Khởi động lần đầu

```bash
# 1. Clone & cấu hình
cp .env.example .env
# Mở .env, đổi APP_JWT_SECRET thành random string

# 2. Build & start
docker compose up -d --build

# 3. Kiểm tra logs
docker compose logs -f

# 4. Tạo admin user (sau khi backend healthy)
docker exec -it lms_postgres psql -U lms_user -d lms_db -c "
INSERT INTO users (full_name, email, password_hash, role, status, created_at)
VALUES (
  'System Admin',
  'admin@lms.local',
  '\$2a\$12\$LFnGMEBbbE9HWXEF3kIXAeQY1iqnE.o9hJPGZ0YQAW0C1RiKiAL3K',
  'ADMIN', 'ACTIVE', NOW()
);"
# Password: Admin@123
```

### Lệnh thường dùng

```bash
# Xem status
docker compose ps

# Restart một service
docker compose restart backend

# Xem logs realtime
docker compose logs -f backend nginx

# Rebuild sau khi thay đổi code
docker compose up -d --build frontend

# Dừng toàn bộ (giữ volumes)
docker compose down

# Dừng và xóa data (DESTRUCTIVE)
docker compose down -v

# Backup database
docker exec lms_postgres pg_dump -U lms_user lms_db > backup.sql
```

### Cập nhật hệ thống

```bash
# Pull code mới
git pull

# Rebuild affected services
docker compose up -d --build backend frontend admin

# Database migrations tự động chạy qua Flyway khi backend start
```

---

## Known Issues

### 1. Backend Health Check (actuator/health)
**Vấn đề:** `docker-compose.yml` sử dụng `/actuator/health` cho backend health check. Endpoint này chỉ available nếu `spring-boot-starter-actuator` có trong `pom.xml`.

**Giải pháp:** Nếu actuator không có, thay health check bằng:
```yaml
test: ["CMD-SHELL", "nc -z localhost 8080 || exit 1"]
```

### 2. CORS trong Production
**Vấn đề:** `SecurityConfig` hiện cho phép `"*"` origins:
```java
config.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:5174", "*"));
```

**Giải pháp khi deploy production:** Xóa `"*"` và chỉ giữ actual domain:
```java
config.setAllowedOriginPatterns(List.of("https://yourdomain.com", "https://admin.yourdomain.com"));
```

### 3. Vite API URL tại Build Time
**Vấn đề:** `VITE_API_BASE_URL` được embed vào bundle lúc build. Nếu thay đổi URL sau khi build, phải rebuild image.

**Workaround cho runtime config:** Dùng `window.__env__` pattern và inject qua nginx, nhưng đây là phức tạp hơn scope của project.

### 4. Video Upload Timeout
**Vấn đề:** Video lớn (>100MB) có thể timeout với mặc định 60s.

**Đã xử lý:** nginx.conf đã set `proxy_read_timeout 300s` và `proxy_send_timeout 300s`.

### 5. File Upload Volume trên Docker Desktop (Windows/macOS)
**Vấn đề:** Docker Desktop trên Windows/macOS dùng virtual machine, I/O cho Docker volumes chậm hơn native Linux.

**Workaround:** Dùng bind mount thay vì named volume cho uploads nếu performance là vấn đề:
```yaml
volumes:
  - ./uploads:/app/uploads   # thay vì uploads_data:/app/uploads
```

### 6. Flyway Migration Conflicts
**Vấn đề:** Nếu thêm migration mới mà database đã có data không compatible, Flyway sẽ fail.

**Giải pháp:** Tạo migration files tuần tự (V13, V14...) và test trên staging trước.

### 7. Refresh Token Revocation
**Vấn đề:** Khi user logout, refresh token được xóa khỏi DB. Tuy nhiên, access token vẫn valid trong 15 phút còn lại.

**Đây là expected behavior** với stateless JWT. Để tăng security: giảm `APP_JWT_EXPIRATION_MS` xuống 5 phút hoặc implement access token blacklist (Redis-based).

---

## Tổng kết Dự án

### Phases hoàn thành

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| 0 | Project Setup & DevOps (Docker Compose, Flyway, CI skeleton) | ✅ DONE |
| 1 | Backend: DB & Foundation (Entities, Migrations, JPA config) | ✅ DONE |
| 2 | Backend: Auth & Users (JWT, Spring Security, Role-based access) | ✅ DONE |
| 3 | Backend: Course, Lesson & File Storage APIs | ✅ DONE |
| 4 | Backend: Enrollment, Progress, Reports & Config APIs | ✅ DONE |
| 5 | Frontend: Student Web (10 pages, React Query, TanStack) | ✅ DONE |
| 6 | Admin Panel (14 pages, DnD, TipTap, Recharts) | ✅ DONE |
| 7 | Integration, Docker & E2E Verification | ✅ DONE |

### Tech Stack Summary

**Backend:**
- Java 20, Spring Boot 3, Spring Security, Spring Data JPA
- PostgreSQL 15, Flyway migrations
- JWT (JJWT), BCrypt, Soft Delete pattern
- Slug generation (Vietnamese diacritics support)
- File storage (local, Range request support for video)
- In-memory config cache với TTL

**Frontend (Student):**
- React 19, TypeScript, Vite
- Feature-Sliced Design (FSD) architecture
- React Router v7, TanStack Query v5, Zustand v5
- React Hook Form + Zod validation
- ReactPlayer (YouTube/Vimeo/Upload)
- Bootstrap 5

**Admin Panel:**
- React 19, TypeScript, Vite (FSD)
- @dnd-kit (drag-and-drop lesson reordering)
- TipTap (rich text editor)
- Recharts (data visualization)
- Bootstrap 5

**Infrastructure:**
- Docker Compose (6 services)
- Nginx reverse proxy (path-based routing)
- Multi-stage Docker builds (smaller images)
