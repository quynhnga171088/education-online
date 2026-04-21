# LMS Platform — Implementation Plan

**Version:** 1.0  
**Ngày:** 14/04/2026  
**Dựa trên:** PRD.md v1.0, ERD.md v1.0, API.md v1.0

---

## Tổng quan kiến trúc

```
📁 LEARNING_ONLINE/
├── 📁 backend/          # Java Spring Boot (OpenJDK 20)
├── 📁 frontend/         # React 19 + Vite + TypeScript (Student Web)
├── 📁 admin/            # React 19 + Vite + TypeScript (Admin/Teacher Web)
├── 📄 docker-compose.yml
├── 📄 API.md
├── 📄 ERD.md
└── 📄 PRD.md
```

### Quyết định kỹ thuật đã chốt

| Hạng mục             | Quyết định                                                            |
| -------------------- | --------------------------------------------------------------------- |
| **Java version**     | Oracle OpenJDK 20                                                     |
| **Build tool**       | Maven                                                                 |
| **Database**         | PostgreSQL 15                                                         |
| **File storage**     | Local server storage (thư mục `/uploads` trên server, serve qua HTTP) |
| **Auth**             | JWT Bearer header — Access token 15 phút, Refresh token 30 ngày       |
| **DB ID type**       | BIGINT AUTO_INCREMENT (monolith)                                      |
| **Soft delete**      | `courses`, `lessons` dùng `deleted_at`. `users` dùng `status=BLOCKED` |
| **Email**            | ❌ Bỏ qua hoàn toàn trong MVP                                         |
| **Frontend bundler** | Vite (không dùng Webpack)                                             |
| **Frontend arch**    | Feature-Sliced Design (FSD) — React 2026 standard                     |

---

## User Review Required

> [!IMPORTANT]
> **File Storage:** Thay vì S3, video và tài liệu được upload lên server và lưu trong thư mục cấu hình (VD: `D:/lms-uploads/`). Backend serve file qua endpoint `GET /uploads/**`. Điều này có nghĩa:
>
> - Không có presigned URL. Upload trực tiếp qua `POST /upload/video` (multipart).
> - Cần đảm bảo dung lượng ổ cứng server đủ lớn.
> - Không có CDN — tốc độ tải video phụ thuộc vào băng thông server.

> [!WARNING]
> **Email bị bỏ qua hoàn toàn:** Các luồng sau sẽ thay đổi:
>
> - Forgot password: Tạm thời bỏ qua (hoặc Admin reset trực tiếp qua DB)
> - Enrollment APPROVED/REJECTED: Student tự refresh trang để xem trạng thái
> - Không có endpoint nào liên quan đến email

> [!NOTE]
> **Refresh token flow:** Client lưu cả `access_token` và `refresh_token` trong `localStorage`. Khi access token hết hạn (HTTP 401), frontend tự động gọi `POST /auth/refresh` và retry request gốc.

---

## Phase 0 — Project Setup & DevOps Foundation

**Mục tiêu:** Khởi tạo 3 project, cấu hình Docker Compose, đảm bảo tất cả chạy được local.

### [NEW] `docker-compose.yml` (root)

```yaml
services:
  postgres:   image: postgres:15, port 5432
  backend:    build ./backend, port 8080
  frontend:   build ./frontend, port 5173
  admin:      build ./admin, port 5174
  pgadmin:    pgAdmin4 để quản lý DB (dev only)
```

### [NEW] `backend/`

- Init Spring Boot project qua [start.spring.io]
- **Dependencies:** Web, Security, JPA, PostgreSQL Driver, Validation, Lombok, Flyway, DevTools
- Cấu hình `application.yml` cho dev/prod profile
- `Dockerfile` cho backend (multi-stage build: Maven → OpenJDK 20)

### [NEW] `frontend/`

- Init: `npm create vite@latest . -- --template react-ts`
- Cài dependencies: Bootstrap 5, React Router v7, TanStack Query v5, Redux Toolkit, Redux Persist, Axios, React Hook Form, Zod, Lucide Icons
- Setup Feature-Sliced Design folder structure

### [NEW] `admin/`

- Init: `npm create vite@latest . -- --template react-ts`
- Cài dependencies: Bootstrap 5, React Router v7, TanStack Query v5, Redux Toolkit, Redux Persist, Axios, React Hook Form, Zod, Lucide Icons, React DnD (drag-drop lesson reorder), Recharts (báo cáo)
- Setup Feature-Sliced Design folder structure

**Deliverable:** `Phase00.md` — toàn bộ folder structure, lệnh khởi chạy, cấu hình môi trường.

---

## Phase 1 — Backend: Database & Foundation

**Mục tiêu:** Database schema hoàn chỉnh, entities, repositories, cấu hình bảo mật cơ bản.

### Backend — Database Migrations (Flyway)

#### [NEW] `backend/src/main/resources/db/migration/`

```
V1__create_users.sql
V2__create_refresh_tokens.sql
V3__create_courses.sql
V4__create_lessons.sql
V5__create_lesson_attachments.sql
V6__create_enrollments.sql
V7__create_payment_proofs.sql
V8__create_lesson_progress.sql
V9__create_system_configs.sql
V10__create_bank_info.sql
V11__insert_default_configs.sql   ← seed data: COMPLETION_MODE, upload limits, etc.
```

### Backend — JPA Entities

#### [NEW] `backend/src/main/java/.../entity/`

- `User.java` — với enum `Role`, `Status`, `@Where(clause="deleted_at IS NULL")`
- `Course.java` — với enum `Status`, `@Where`, soft delete
- `Lesson.java` — enum `Type` (VIDEO/TEXT), `VideoSourceType`, `@Where`
- `LessonAttachment.java`
- `Enrollment.java` — enum `Status` (PENDING/APPROVED/REJECTED)
- `PaymentProof.java`
- `LessonProgress.java` — enum `Status` (NOT_STARTED/IN_PROGRESS/COMPLETED)
- `SystemConfig.java`
- `BankInfo.java`
- `RefreshToken.java`

### Backend — Repositories (Spring Data JPA)

- `UserRepository`, `CourseRepository`, `LessonRepository`
- `EnrollmentRepository`, `LessonProgressRepository`
- `RefreshTokenRepository`, `SystemConfigRepository`, etc.

### Backend — Spring Security Config

#### [MODIFY] `SecurityConfig.java`

```
- Permit: POST /auth/register, POST /auth/login, POST /auth/refresh
- Permit: GET /courses (public), GET /courses/:id (public)
- Permit: GET /uploads/** (serve static files)
- Authenticated: tất cả routes còn lại
- Role-based: /admin/** → ADMIN only
- Custom JWT filter: JwtAuthenticationFilter extends OncePerRequestFilter
```

### Backend — JWT Utilities

- `JwtTokenProvider.java` — generate/validate access token (15 phút)
- `RefreshTokenService.java` — generate, store, rotate, revoke refresh token

**Deliverable:** `Phase01.md`

---

## Phase 2 — Backend: Auth & User Management APIs

**Mục tiêu:** Hoàn thiện 100% Module 1 (Auth) và Module 8 (Admin Users).

### Auth Module (`/auth`)

#### [NEW] `AuthController.java`

| Endpoint                       | Action                                                |
| ------------------------------ | ----------------------------------------------------- |
| `POST /auth/register`          | Tạo user STUDENT, return access_token + refresh_token |
| `POST /auth/login`             | Validate credentials, return tokens                   |
| `POST /auth/logout`            | Revoke refresh token hiện tại                         |
| `POST /auth/refresh`           | Token rotation, return token pair mới                 |
| `GET /auth/me`                 | Return user info từ JWT                               |
| `PATCH /auth/me`               | Update profile (full_name, phone, avatar_url)         |
| `POST /auth/change-password`   | Validate old password, update hash                    |
| ~~POST /auth/forgot-password~~ | ❌ Bỏ qua (no email)                                  |
| ~~POST /auth/reset-password~~  | ❌ Bỏ qua (no email)                                  |

### User Management Module (`/admin/users`)

#### [NEW] `UserController.java` (Admin routes)

| Endpoint                  | Action                                |
| ------------------------- | ------------------------------------- |
| `GET /admin/users`        | Phân trang, filter role/status/search |
| `GET /admin/users/:id`    | Chi tiết user + recent enrollments    |
| `POST /admin/users`       | Admin tạo TEACHER account             |
| `PATCH /admin/users/:id`  | Đổi role, đổi status ACTIVE/BLOCKED   |
| `DELETE /admin/users/:id` | Soft delete (set deleted_at)          |

### Services

- `AuthService.java` — register, login, token management
- `UserService.java` — CRUD với soft delete awareness

**Deliverable:** `Phase02.md`

---

## Phase 3 — Backend: Course, Lesson & File Storage APIs

**Mục tiêu:** Hoàn thiện Module 2 (Courses), Module 3 (Lessons), Module 4 (Attachments), Module 5 (Upload).

### File Storage Service

#### [NEW] `FileStorageService.java`

```java
// Cấu hình qua application.yml:
// app.storage.upload-dir: D:/lms-uploads
// app.storage.base-url: http://localhost:8080/uploads

public String storeVideo(MultipartFile file, Long courseId) → "videos/{courseId}/{uuid}.mp4"
public String storeDocument(MultipartFile file, Long lessonId) → "docs/{lessonId}/{uuid}.pdf"
public String storeImage(MultipartFile file, String type) → "images/{type}/{uuid}.jpg"
public void deleteFile(String fileKey) → xóa file khỏi disk
public Resource loadFile(String fileKey) → trả về Resource để serve
```

#### [NEW] `FileController.java`

```
GET /uploads/**  →  serve file tĩnh từ upload directory
```

> **Lưu ý:** Dùng `ResourceHttpRequestHandler` hoặc response với `InputStreamResource` cho streaming video (hỗ trợ Range header cho seek video).

### Course Module

#### [NEW] `CourseController.java`

| Endpoint                    | Chi tiết                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| `GET /courses`              | Public. Phân trang, search, filter status. Nếu Student có token → kèm `enrollment_status` |
| `GET /courses/:id`          | Public. Chi tiết + lesson preview (chỉ title/type)                                        |
| `POST /courses`             | TEACHER/ADMIN. Auto-generate slug từ title                                                |
| `PATCH /courses/:id`        | TEACHER (khóa của mình) / ADMIN (bất kỳ)                                                  |
| `DELETE /courses/:id`       | ADMIN. Soft delete nếu DRAFT & không có enrollment                                        |
| `GET /courses/:id/students` | TEACHER. Học viên APPROVED + progress%                                                    |

**Slug generation:** `SlugUtils.java` — bỏ dấu tiếng Việt → lowercase → replace space → `-`. Check unique, thêm `-2`, `-3` nếu trùng.

### Lesson Module

#### [NEW] `LessonController.java`

| Endpoint                              | Chi tiết                                                        |
| ------------------------------------- | --------------------------------------------------------------- |
| `GET /courses/:cid/lessons`           | Public (preview), STUDENT enrolled (full), TEACHER/ADMIN (full) |
| `GET /courses/:cid/lessons/:lid`      | Auth. Student cần enrollment APPROVED                           |
| `POST /courses/:cid/lessons`          | TEACHER — tạo VIDEO hoặc TEXT lesson                            |
| `PATCH /courses/:cid/lessons/:lid`    | TEACHER — update lesson                                         |
| `DELETE /courses/:cid/lessons/:lid`   | TEACHER — soft delete                                           |
| `PATCH /courses/:cid/lessons/reorder` | TEACHER — batch update order_index                              |

### Upload Module

#### [NEW] `UploadController.java`

| Endpoint                         | Chi tiết                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `POST /upload/video`             | TEACHER. Multipart. Validate type (mp4/mov/webm/avi), size. Lưu local. Return `{file_key, file_url, file_size_bytes}` |
| `POST /upload/image`             | AUTH. Multipart. type=avatar/thumbnail/receipt. Max 5MB                                                               |
| ~~POST /upload/video/presigned~~ | ❌ Không cần (không dùng S3)                                                                                          |

### Attachment Module

#### [NEW] `AttachmentController.java`

- `GET /lessons/:lid/attachments` — Students enrolled, Teacher, Admin
- `POST /lessons/:lid/attachments` — TEACHER. Multipart upload
- `DELETE /lessons/:lid/attachments/:aid` — TEACHER

**Deliverable:** `Phase03.md`

---

## Phase 4 — Backend: Enrollment, Progress, Reports & Config APIs

**Mục tiêu:** Hoàn thiện Module 6–10.

### Enrollment Module

#### [NEW] `EnrollmentController.java`

| Endpoint                              | Chi tiết                                                               |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `GET /enrollments`                    | STUDENT (chỉ của mình + progress) / ADMIN (tất cả + filter)            |
| `POST /enrollments`                   | STUDENT. Validate không trùng PENDING/APPROVED. Tạo enrollment PENDING |
| `GET /enrollments/:id`                | AUTH                                                                   |
| `POST /enrollments/:id/payment-proof` | STUDENT. Upload ảnh biên lai                                           |
| `PATCH /enrollments/:id/approve`      | ADMIN. Set APPROVED                                                    |
| `PATCH /enrollments/:id/reject`       | ADMIN. Set REJECTED + note                                             |

**Business rules kiểm tra trong service:**

- Không tạo enrollment thứ 2 khi đã PENDING/APPROVED
- Chỉ APPROVED mới cho vào trang học (check trong lesson detail API)

### Progress Module

#### [NEW] `ProgressController.java`

| Endpoint                                     | Chi tiết                                             |
| -------------------------------------------- | ---------------------------------------------------- |
| `GET /progress/courses/:cid`                 | STUDENT. Tổng progress + chi tiết từng lesson        |
| `POST /progress/lessons/:lid/open`           | STUDENT. Nếu `COMPLETION_MODE=OPEN` → COMPLETED ngay |
| `POST /progress/lessons/:lid/video-progress` | STUDENT. Cập nhật giây đã xem, check milestone 50%   |

**System Config đọc từ DB:** `SystemConfigService.java` — cache 5 phút để tránh query liên tục.

### Reports Module

#### [NEW] `ReportController.java`

- `GET /admin/reports/overview` — ADMIN: total stats + top courses
- `GET /admin/reports/courses/:id` — TEACHER/ADMIN: lesson stats + enrollment by month
- `GET /admin/reports/students/:id` — ADMIN: student course progress

### System Config Module

#### [NEW] `ConfigController.java`

- `GET /admin/config` — Tất cả config keys
- `PATCH /admin/config` — Update key-value (chỉ ADMIN)
- `GET /admin/config/bank-info` — Thông tin ngân hàng
- `PUT /admin/config/bank-info` — Cập nhật ngân hàng

**Deliverable:** `Phase04.md`

---

## Phase 5 — Frontend (Student Web)

**Mục tiêu:** Xây dựng toàn bộ Student Web với Feature-Sliced Design.

### Kiến trúc Feature-Sliced Design

```
frontend/src/
├── app/
│   ├── providers/          # QueryClientProvider, RouterProvider
│   ├── router/             # Route definitions (React Router v7)
│   └── styles/             # Global CSS / reset
│
├── pages/                  # Thin page components, chỉ compose widgets/features
│   ├── home/
│   ├── courses/
│   ├── course-detail/
│   ├── learn/
│   ├── my-courses/
│   ├── my-enrollments/
│   ├── auth/               # login, register
│   └── profile/
│
├── widgets/                # Reusable layout compositions
│   ├── header/
│   ├── footer/
│   ├── course-card/
│   └── lesson-sidebar/
│
├── features/               # Business features (có state + API calls)
│   ├── auth/               # login form, register form, auth guards
│   ├── course-enrollment/  # enroll button, enrollment status
│   ├── lesson-player/      # video player, text reader, progress tracking
│   ├── file-viewer/        # attachment inline viewer (PDF.js / Office)
│   └── course-progress/    # progress bar, completion tracking
│
├── entities/               # Business entities (pure UI, no side effects)
│   ├── course/             # CourseCard, CourseInfo, types
│   ├── lesson/             # LessonItem, LessonBadge, types
│   ├── user/               # UserAvatar, types
│   └── enrollment/         # EnrollmentBadge, types
│
└── shared/
    ├── api/                # axios instance + interceptors (auto-refresh token)
    ├── config/             # env vars, constants
    ├── hooks/              # useAuth, useLocalStorage, useDebounce
    ├── lib/                # formatting, validation (zod schemas)
    ├── store/              # Zustand stores (authStore)
    └── ui/                 # Reusable UI: Button, Input, Modal, Spinner, Badge
```

### Screens cần build (12 màn — Student)

| Screen ID | Tên               | URL                      | Components chính                         |
| --------- | ----------------- | ------------------------ | ---------------------------------------- |
| S-01      | Trang chủ         | `/`                      | HeroBanner, FeaturedCourses, CTA         |
| S-02      | Đăng ký           | `/register`              | RegisterForm (RHF + Zod)                 |
| S-03      | Đăng nhập         | `/login`                 | LoginForm                                |
| S-04      | Danh sách khóa    | `/courses`               | CourseGrid, SearchBar, FilterBar         |
| S-05      | Chi tiết khóa     | `/courses/:slug`         | CourseHero, LessonOutline, EnrollButton  |
| S-06      | Hướng dẫn TT      | `/courses/:slug/payment` | BankInfoCard, ReceiptUpload              |
| S-07      | Khóa của tôi      | `/my-courses`            | MyCourseList + ProgressBar               |
| S-08      | Đăng ký của tôi   | `/my-enrollments`        | EnrollmentStatusList                     |
| S-09      | Trang học         | `/learn/:slug/:lessonId` | VideoPlayer / TextReader + LessonSidebar |
| S-10      | Thông tin cá nhân | `/profile`               | ProfileForm, ChangePasswordForm          |
| ~~S-11~~  | ~~Quên MK~~       | ~~`/forgot-password`~~   | ❌ Bỏ qua (no email)                     |
| ~~S-12~~  | ~~Reset MK~~      | ~~`/reset-password`~~    | ❌ Bỏ qua (no email)                     |

### Shared API Layer

#### `shared/api/axiosInstance.ts`

```typescript
// Axios instance với base URL, Bearer header interceptor
// Response interceptor: nếu 401 → auto gọi /auth/refresh → retry
// Zustand auth store: lưu { accessToken, refreshToken, user }
```

**Deliverable:** `Phase05.md`

---

## Phase 6 — Admin Panel

**Mục tiêu:** Xây dựng toàn bộ Admin Web với cùng FSD architecture.

### Kiến trúc Admin (giống Frontend, điều chỉnh features)

```
admin/src/
├── app/
│   ├── providers/
│   ├── router/             # Admin routes, protected by ADMIN/TEACHER role
│   └── styles/
│
├── pages/
│   ├── login/
│   ├── dashboard/
│   ├── courses/            # list, create, edit
│   ├── curriculum/         # lesson manager (drag-drop)
│   ├── lessons/            # create/edit lesson (VIDEO/TEXT)
│   ├── enrollments/        # approve/reject
│   ├── users/              # list, create, edit
│   ├── reports/            # overview, course detail
│   └── settings/           # config, bank info
│
├── widgets/
│   ├── admin-sidebar/
│   ├── admin-header/
│   ├── data-table/         # Generic sortable/filterable table
│   └── stats-card/
│
├── features/
│   ├── auth/
│   ├── course-management/
│   ├── lesson-management/  # RichTextEditor (TipTap/Quill), VideoUploader
│   ├── enrollment-review/  # approve/reject + view receipt
│   ├── user-management/
│   ├── drag-drop-reorder/  # lesson reorder (@dnd-kit/core)
│   └── file-upload/        # Upload video với progress bar
│
├── entities/
│   ├── course/
│   ├── lesson/
│   ├── enrollment/
│   └── user/
│
└── shared/         # (giống frontend)
```

### Screens Admin (14 màn)

| Screen ID | Tên                | URL                              |
| --------- | ------------------ | -------------------------------- |
| A-01      | Đăng nhập          | `/login`                         |
| A-02      | Dashboard          | `/`                              |
| A-03      | Danh sách khóa     | `/courses`                       |
| A-04      | Tạo khóa           | `/courses/new`                   |
| A-05      | Sửa khóa           | `/courses/:id/edit`              |
| A-06      | Curriculum         | `/courses/:id/curriculum`        |
| A-07      | Tạo lesson         | `/courses/:id/lessons/new`       |
| A-08      | Sửa lesson         | `/courses/:id/lessons/:lid/edit` |
| A-09      | Quản lý Enrollment | `/enrollments`                   |
| A-10      | Quản lý User       | `/users`                         |
| A-11      | Tạo/Sửa User       | `/users/new`, `/users/:id/edit`  |
| A-12      | Báo cáo tổng quan  | `/reports`                       |
| A-13      | Báo cáo khóa       | `/reports/courses/:id`           |
| A-14      | Cấu hình           | `/settings`                      |

**Deliverable:** `Phase06.md`

---

## Phase 7 — Integration, Docker & End-to-End Verification

**Mục tiêu:** Chạy toàn bộ hệ thống ổn định trong Docker Compose, verify end-to-end flows.

### Docker Compose full stack

```yaml
services:
  postgres: # PostgreSQL 15
  backend: # Spring Boot, mount ./uploads:/app/uploads
  frontend: # Vite preview build, port 5173
  admin: # Vite preview build, port 5174
  nginx: # Reverse proxy:
    # /api/ → backend:8080
    # /uploads/ → backend:8080 (serve files)
    # /* → frontend:5173
    # /admin/* → admin:5174
```

### Nginx Config

```nginx
upstream backend { server backend:8080; }

server {
  location /api/       { proxy_pass http://backend; }
  location /uploads/   { proxy_pass http://backend; }
  location /admin/     { proxy_pass http://admin:5174; }
  location /           { proxy_pass http://frontend:5173; }
}
```

### End-to-End Verification Checklist

```
[ ] Flow 1: Student đăng ký → đăng nhập → xem catalog → đăng ký khóa → upload biên lai
[ ] Flow 2: Admin đăng nhập → duyệt enrollment → student vào học được
[ ] Flow 3: Student học video → progress tracking → % tăng dần
[ ] Flow 4: Teacher tạo khóa → thêm lesson VIDEO (upload file) → publish
[ ] Flow 5: Teacher tạo lesson TEXT → đính kèm PDF → Student xem inline
[ ] Flow 6: Admin quản lý user (tạo Teacher, block Student)
[ ] Flow 7: Admin xem báo cáo (dashboard, khóa detail)
[ ] Flow 8: Admin cấu hình COMPLETION_MODE → verify behavior thay đổi
[ ] Flow 9: Token refresh — access token hết hạn → auto-refresh → tiếp tục
```

**Deliverable:** `Phase07.md` — Tổng kết toàn dự án, hướng dẫn vận hành, known issues.

---

## Tóm tắt Phases

| Phase    | Tên                                            | Ước tính     |
| -------- | ---------------------------------------------- | ------------ |
| **0**    | Project Setup & DevOps                         | 0.5 ngày     |
| **1**    | Backend: DB & Foundation                       | 1 ngày       |
| **2**    | Backend: Auth & Users                          | 1 ngày       |
| **3**    | Backend: Course, Lesson & File Storage         | 2 ngày       |
| **4**    | Backend: Enrollment, Progress, Reports, Config | 1.5 ngày     |
| **5**    | Frontend (Student Web)                         | 3 ngày       |
| **6**    | Admin Panel                                    | 3 ngày       |
| **7**    | Integration & Verification                     | 1 ngày       |
| **Tổng** |                                                | **~13 ngày** |

---

## Dependencies Stack chi tiết

### Backend (`pom.xml`)

```xml
spring-boot-starter-web
spring-boot-starter-security
spring-boot-starter-data-jpa
spring-boot-starter-validation
postgresql (runtime)
flyway-core
lombok
jjwt-api + jjwt-impl + jjwt-jackson  ← JWT
commons-io                             ← File utilities
thumbnailator                          ← Image resize (avatar/thumbnail)
```

### Frontend & Admin (`package.json`)

```json
react@19, react-dom@19
react-router-dom@7
@tanstack/react-query@5
zustand@5
axios
react-hook-form + @hookform/resolvers + zod
lucide-react                    ← Icons
@dnd-kit/core + @dnd-kit/sortable  ← Drag-drop (admin only)
tiptap/react                    ← Rich text editor (admin only)
recharts                        ← Charts (admin reports)
react-player                    ← Video player (YouTube/Vimeo embed)
```
