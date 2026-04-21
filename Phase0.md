# Phase 0 — Project Setup & DevOps Foundation

**Hoàn thành:** 14/04/2026  
**Thời gian thực hiện:** ~0.5 ngày (theo kế hoạch)  
**Trạng thái:** ✅ HOÀN THÀNH

---

## Tóm tắt

Phase 0 thiết lập toàn bộ nền tảng dự án: khởi tạo 3 project (backend, frontend, admin), cấu hình Docker Compose, và đảm bảo tất cả có thể build thành công ở local.

---

## 1. Docker Compose (`docker-compose.yml`)

**File:** `LEARNING_ONLINE_STORE/docker-compose.yml`

### Services đã cấu hình

| Service      | Image / Build         | Port  | Ghi chú                                  |
| ------------ | --------------------- | ----- |------------------------------------------|
| `postgres`   | `postgres:15-alpine`  | 5432  | Healthcheck, persistent volume           |
| `pgadmin`    | `dpage/pgadmin4`      | 5050  | Dev-only (profile: `dev`)                |
| `backend`    | `./backend`           | 8080  | Đọc env vars, mount uploads volume       |
| `frontend`   | `./frontend`          | 5173  | Nginx serve SPA                          |
| `admin`      | `./admin`             | 5174  | Nginx serve SPA                          |

### Volumes & Networks
- `postgres_data` — persist DB data
- `uploads_data` — persist file uploads (`/app/uploads`)
- `lms_network` — bridge network nội bộ

### Khởi chạy toàn bộ stack
```bash
# Dev (bao gồm pgAdmin):
docker compose --profile dev up -d

# Production:
docker compose up -d

# Chỉ database:
docker compose up postgres -d
```

---

## 2. Backend — Spring Boot (`/backend`)

### Cấu trúc file
```
backend/
├── Dockerfile                          # Multi-stage: Maven build → JRE 20 runtime
├── .dockerignore
├── pom.xml                             # Maven dependencies đầy đủ
├── mvnw / mvnw.cmd                     # Maven Wrapper 3.9.6
├── .mvn/wrapper/maven-wrapper.properties
└── src/
    ├── main/
    │   ├── java/com/lms/
    │   │   └── LmsApplication.java     # @SpringBootApplication entry point
    │   └── resources/
    │       ├── application.yml         # Dev profile (localhost:5432)
    │       └── application-prod.yml    # Prod profile (đọc từ env vars Docker)
    └── test/
        ├── java/com/lms/
        │   └── LmsApplicationTests.java
        └── resources/
            └── application-test.yml    # H2 in-memory cho unit tests
```

### Dependencies (`pom.xml`)

| Dependency                     | Version / Scope       | Mục đích                        |
| ------------------------------ | --------------------- | --------------------------------|
| spring-boot-starter-web        | 3.2.5 (managed)       | REST API                        |
| spring-boot-starter-security   | 3.2.5 (managed)       | JWT Auth                        |
| spring-boot-starter-data-jpa   | 3.2.5 (managed)       | ORM                             |
| spring-boot-starter-validation | 3.2.5 (managed)       | Bean validation                 |
| postgresql                     | runtime               | PostgreSQL driver               |
| flyway-core + flyway-database-postgresql | 10.12.0   | DB migrations                   |
| lombok                         | optional              | Boilerplate reduction           |
| jjwt-api/impl/jackson          | 0.12.5                | JWT token                       |
| commons-io                     | 2.15.1                | File utilities                  |
| thumbnailator                  | 0.4.20                | Image resize                    |

### Cấu hình Environment (application.yml)

| Config Key                  | Dev value                                     | Prod source        |
| -------------------------   | --------------------------------------------- | -------------------|
| `spring.datasource.url`     | `jdbc:postgresql://localhost:5432/lms_db`     | `SPRING_DATASOURCE_URL` |
| `app.jwt.secret`            | dev key (insecure)                            | `APP_JWT_SECRET`   |
| `app.jwt.expiration-ms`     | `900000` (15 phút)                            | `APP_JWT_EXPIRATION_MS` |
| `app.refresh-token.expiration-days` | `30`                                  | `APP_REFRESH_TOKEN_EXPIRATION_DAYS` |
| `app.storage.upload-dir`    | `D:/lms-uploads`                              | `APP_STORAGE_UPLOAD_DIR` |
| `app.storage.base-url`      | `http://localhost:8080/uploads`               | `APP_STORAGE_BASE_URL` |

### Dockerfile (Multi-stage)
- **Stage 1 (builder):** `eclipse-temurin:20-jdk-alpine` — Maven build, skip tests
- **Stage 2 (runtime):** `eclipse-temurin:20-jre-alpine` — Non-root user `lms`, expose port 8080

### Khởi chạy local (dev)
```bash
# Cần PostgreSQL running (có thể dùng Docker):
docker compose up postgres -d

# Chạy backend:
cd backend
./mvnw spring-boot:run
# → http://localhost:8080
```

---

## 3. Frontend — Student Web (`/frontend`)

### Khởi tạo
```bash
npm create vite@latest frontend -- --template react-ts
```

### Dependencies đã cài

| Package                               | Version  | Mục đích                         |
| ------------------------------------- | -------- | -------------------------------- |
| `bootstrap`                           | ^5       | UI framework                     |
| `react-router-dom`                    | ^7       | Routing                          |
| `@tanstack/react-query`               | ^5       | Server state management          |
| `zustand`                             | latest   | Client state (auth)              |
| `axios`                               | latest   | HTTP client                      |
| `react-hook-form`                     | latest   | Form management                  |
| `@hookform/resolvers` + `zod`         | latest   | Form validation                  |
| `lucide-react`                        | latest   | Icons                            |
| `react-player`                        | latest   | Video player                     |

### Cấu trúc FSD (Feature-Sliced Design)

```
frontend/src/
├── app/
│   ├── router/index.tsx        # 10 routes (lazy loaded)
│   └── styles/global.css       # Design tokens + CSS reset
├── pages/                      # 10 màn hình
│   ├── home/HomePage.tsx       # S-01: /
│   ├── auth/
│   │   ├── LoginPage.tsx       # S-03: /login
│   │   └── RegisterPage.tsx    # S-02: /register
│   ├── courses/CoursesPage.tsx           # S-04: /courses
│   ├── course-detail/CourseDetailPage.tsx # S-05: /courses/:slug
│   ├── payment/PaymentPage.tsx           # S-06: /courses/:slug/payment
│   ├── my-courses/MyCoursesPage.tsx      # S-07: /my-courses
│   ├── my-enrollments/MyEnrollmentsPage.tsx # S-08: /my-enrollments
│   ├── learn/LearnPage.tsx               # S-09: /learn/:slug/:lessonId
│   └── profile/ProfilePage.tsx           # S-10: /profile
├── widgets/
│   ├── header/Header.tsx       # Navbar skeleton
│   └── footer/Footer.tsx       # Footer skeleton
├── entities/
│   ├── course/types.ts         # Course interface
│   ├── lesson/types.ts         # Lesson interface
│   └── enrollment/types.ts     # Enrollment interface
└── shared/
    ├── api/axiosInstance.ts    # Axios + auto-refresh interceptor
    ├── config/index.ts         # Constants (API_BASE_URL)
    ├── hooks/
    │   ├── useAuth.ts          # Auth hook
    │   └── useDebounce.ts      # Debounce hook
    ├── lib/validations.ts      # Zod schemas (login, register, changePassword)
    └── store/authStore.ts      # Zustand auth store (persist to localStorage)
```

### Tính năng chính đã implement ở Phase 0
- ✅ **Auto-refresh token:** Axios interceptor tự động gọi `/auth/refresh` khi nhận 401, retry request gốc. Queue các requests đang chờ trong thời gian refresh.
- ✅ **Zustand auth store:** Persist user, accessToken, refreshToken vào `localStorage` key `lms-auth`
- ✅ **Lazy loading:** Tất cả pages được lazy load bằng React Router `lazy()`
- ✅ **Zod validation schemas:** loginSchema, registerSchema, changePasswordSchema

### Khởi chạy local
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 4. Admin — Admin/Teacher Web (`/admin`)

### Khởi tạo
```bash
npm create vite@latest admin -- --template react-ts
```

### Dependencies đã cài (bổ sung so với frontend)

| Package                         | Mục đích                                  |
| ------------------------------- | ----------------------------------------- |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-drop lesson reorder (Phase 6) |
| `@tiptap/react` + `@tiptap/starter-kit` | Rich text editor (Phase 6)     |
| `recharts`                      | Charts/báo cáo (Phase 6)                  |
| (+ tất cả deps của frontend)    |                                           |

### Cấu trúc FSD (Admin)

```
admin/src/
├── app/
│   ├── router/index.tsx        # 14 routes + AdminLayout wrapper
│   └── styles/global.css       # Design tokens + sidebar layout CSS
├── pages/                      # 14 màn hình
│   ├── login/LoginPage.tsx             # A-01: /login
│   ├── dashboard/DashboardPage.tsx     # A-02: /
│   ├── courses/
│   │   ├── CoursesListPage.tsx         # A-03: /courses
│   │   ├── CourseCreatePage.tsx        # A-04: /courses/new
│   │   └── CourseEditPage.tsx          # A-05: /courses/:id/edit
│   ├── curriculum/CurriculumPage.tsx   # A-06: /courses/:id/curriculum
│   ├── lessons/
│   │   ├── LessonCreatePage.tsx        # A-07: /courses/:id/lessons/new
│   │   └── LessonEditPage.tsx          # A-08: /courses/:id/lessons/:lid/edit
│   ├── enrollments/EnrollmentsPage.tsx # A-09: /enrollments
│   ├── users/
│   │   ├── UsersPage.tsx               # A-10: /users
│   │   └── UserFormPage.tsx            # A-11: /users/new, /users/:id/edit
│   ├── reports/
│   │   ├── ReportsPage.tsx             # A-12: /reports
│   │   └── CourseReportPage.tsx        # A-13: /reports/courses/:id
│   └── settings/SettingsPage.tsx       # A-14: /settings
├── widgets/
│   └── admin-layout/AdminLayout.tsx    # Sidebar + Outlet layout
└── shared/
    ├── api/axiosInstance.ts            # Axios + auto-refresh (giống frontend)
    ├── config/index.ts
    └── store/authStore.ts              # Zustand auth (role: TEACHER | ADMIN)
```

### Khởi chạy local
```bash
cd admin
npm run dev
# → http://localhost:5174
```

---

## 5. Kết quả Build

### Frontend
```
✓ 85 modules transformed.
✓ built in 283ms
```

### Admin
```
✓ 92 modules transformed.
✓ built in 285ms
```

Cả hai **build thành công, không có lỗi**.

---

## 6. Cấu trúc thư mục tổng thể

```
LEARNING_ONLINE_STORE/
├── .gitignore                  # Monorepo gitignore (Java + Node)
├── docker-compose.yml          # 5 services: postgres, pgadmin, backend, frontend, admin
├── implementation_plan.md
├── documents/
│   ├── API.md
│   └── ERD.md
├── backend/
│   ├── Dockerfile              # Multi-stage Maven → JRE20
│   ├── pom.xml                 # Spring Boot 3.2.5 + JWT + Flyway + ...
│   ├── mvnw / mvnw.cmd
│   └── src/main/java/com/lms/LmsApplication.java
├── frontend/                   # Student Web (React 19 + Vite + TypeScript)
│   ├── Dockerfile              # Multi-stage Node → Nginx
│   ├── .env                    # VITE_API_BASE_URL=http://localhost:8080
│   └── src/ (FSD structure — 10 pages)
└── admin/                      # Admin/Teacher Web (React 19 + Vite + TypeScript)
    ├── Dockerfile              # Multi-stage Node → Nginx
    ├── .env                    # VITE_API_BASE_URL=http://localhost:8080
    └── src/ (FSD structure — 14 pages)
```

---

## 7. Checklist Phase 0

| Hạng mục                                         | Trạng thái |
| ------------------------------------------------ | ---------- |
| `docker-compose.yml` với 5 services              | ✅         |
| Backend: Spring Boot project khởi tạo           | ✅         |
| Backend: pom.xml đầy đủ dependencies            | ✅         |
| Backend: application.yml dev + prod + test       | ✅         |
| Backend: Dockerfile multi-stage                  | ✅         |
| Backend: Maven Wrapper 3.9.6                     | ✅         |
| Frontend: Vite + React 19 + TypeScript           | ✅         |
| Frontend: Tất cả dependencies cài đặt           | ✅         |
| Frontend: FSD folder structure                   | ✅         |
| Frontend: 10 placeholder pages (S-01 → S-10)    | ✅         |
| Frontend: Router (lazy loading)                  | ✅         |
| Frontend: Zustand auth store + persist           | ✅         |
| Frontend: Axios + auto-refresh interceptor       | ✅         |
| Frontend: Zod validation schemas                 | ✅         |
| Frontend: Global CSS + design tokens             | ✅         |
| Frontend: Dockerfile multi-stage                 | ✅         |
| Frontend: npm run build ✅ (no errors)           | ✅         |
| Admin: Vite + React 19 + TypeScript              | ✅         |
| Admin: Tất cả dependencies cài đặt              | ✅         |
| Admin: FSD folder structure                      | ✅         |
| Admin: 14 placeholder pages (A-01 → A-14)       | ✅         |
| Admin: Router với AdminLayout (sidebar)          | ✅         |
| Admin: Zustand auth store                        | ✅         |
| Admin: Axios + auto-refresh interceptor          | ✅         |
| Admin: Global CSS + sidebar design tokens        | ✅         |
| Admin: Dockerfile multi-stage                    | ✅         |
| Admin: npm run build ✅ (no errors)              | ✅         |
| Root .gitignore monorepo                         | ✅         |

**Tổng: 28/28 ✅ — Phase 0 HOÀN THÀNH 100%**

---

## 8. Bước tiếp theo — Phase 1

Chuyển sang **Phase 1: Backend Database & Foundation**:
- Tạo Flyway migrations (V1–V11)
- Tạo JPA Entities (User, Course, Lesson, Enrollment, ...)
- Tạo Repositories
- Cấu hình Spring Security + JWT filter

```bash
# Khởi chạy toàn bộ để test:
docker compose --profile dev up -d
# → postgres: localhost:5432
# → pgadmin:  http://localhost:5050 (admin@lms.local / admin123)
# → backend:  http://localhost:8080  (sau khi build)
# → frontend: http://localhost:5173
# → admin:    http://localhost:5174
```
