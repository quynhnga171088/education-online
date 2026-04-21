# Phase 1 — Backend: Database & Foundation

**Ngày thực hiện:** 21/04/2026  
**Mục tiêu:** Database schema hoàn chỉnh, JPA entities, repositories, Spring Security + JWT foundation.

---

## Tổng quan những gì đã làm

Phase 1 hoàn thiện toàn bộ nền tảng backend gồm 4 nhóm chính:

1. **Flyway Database Migrations** — 11 file SQL tạo đầy đủ schema và seed data
2. **JPA Entities** — 10 entity class ánh xạ các bảng DB, với enum, soft delete, relationships
3. **Spring Data JPA Repositories** — 10 repository với custom queries
4. **Spring Security + JWT** — SecurityFilterChain, JwtTokenProvider, JwtAuthenticationFilter, RefreshTokenService

---

## 1. Flyway Database Migrations

**Vị trí:** `backend/src/main/resources/db/migration/`

### V1__create_users.sql
- Tạo PostgreSQL ENUM type: `user_role` (`STUDENT`, `TEACHER`, `ADMIN`), `user_status` (`ACTIVE`, `BLOCKED`)
- Tạo bảng `users` với các cột: id (BIGSERIAL PK), email (UNIQUE), password_hash, full_name, avatar_url, phone, role, status, reset_token, reset_token_expires_at, created_at, updated_at
- Index: email (UNIQUE), role, status

### V2__create_refresh_tokens.sql
- Tạo bảng `refresh_tokens` với: id (BIGSERIAL PK), user_id (FK → users), token_hash (UNIQUE, SHA-256 hash), expires_at, revoked_at (NULL = còn valid), user_agent, ip_address, created_at
- Index: token_hash (UNIQUE), user_id, expires_at
- ON DELETE CASCADE khi user bị xóa

### V3__create_courses.sql
- Tạo ENUM `course_status` (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
- Tạo bảng `courses` với: id, title, slug (UNIQUE), description, short_description, thumbnail_url, price (DECIMAL 15,2), status, teacher_id (FK), created_by (FK), published_at, created_at, updated_at, **deleted_at (soft delete)**
- Index: slug, status, teacher_id, deleted_at

### V4__create_lessons.sql
- Tạo ENUM: `lesson_type` (`VIDEO`, `TEXT`), `lesson_status` (`DRAFT`, `PUBLISHED`), `video_source_type` (`UPLOAD`, `YOUTUBE`, `VIMEO`, `DRIVE`)
- Tạo bảng `lessons` với: id, course_id (FK), title, description, order_index, type, status, text_content, video_source_type, video_url, video_file_key, video_duration_seconds, created_at, updated_at, **deleted_at (soft delete)**
- Index: course_id, (course_id, order_index), deleted_at

### V5__create_lesson_attachments.sql
- Tạo bảng `lesson_attachments` với: id, lesson_id (FK, CASCADE), file_name, file_key, file_url, file_type, file_size_bytes, order_index, created_at
- Index: lesson_id

### V6__create_enrollments.sql
- Tạo ENUM `enrollment_status` (`PENDING`, `APPROVED`, `REJECTED`)
- Tạo bảng `enrollments` với: id, student_id (FK), course_id (FK), status (DEFAULT PENDING), note, reviewed_by (FK), reviewed_at, created_at, updated_at
- Index: student_id, course_id, status

### V7__create_payment_proofs.sql
- Tạo bảng `payment_proofs` với: id, enrollment_id (FK, CASCADE, UNIQUE), image_url, image_key, note, created_at, updated_at
- UNIQUE constraint trên enrollment_id (1 enrollment → 1 proof)
- Index: enrollment_id

### V8__create_lesson_progress.sql
- Tạo ENUM `progress_status` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
- Tạo bảng `lesson_progress` với: id, student_id (FK), lesson_id (FK), course_id (FK — denormalized để query nhanh), status, video_watched_seconds, video_max_watched_percent, completed_at, last_accessed_at, created_at, updated_at
- UNIQUE constraint: (student_id, lesson_id)
- Index: (student_id, course_id), lesson_id, status

### V9__create_system_configs.sql
- Tạo bảng `system_configs` với: id (SERIAL PK), key (UNIQUE), value (TEXT), description, updated_by (FK), updated_at
- Index: key

### V10__create_bank_info.sql
- Tạo bảng `bank_info` với: id (SERIAL PK), bank_name, account_number, account_name, branch, transfer_template, qr_image_url, updated_by (FK), updated_at

### V11__insert_default_configs.sql
- Seed data cho `system_configs`:
  - `COMPLETION_MODE` = `"OPEN"` (hoặc `VIDEO_50`)
  - `MAX_VIDEO_SIZE_MB` = `"2048"`
  - `MAX_DOCUMENT_SIZE_MB` = `"50"`
  - `ALLOWED_VIDEO_TYPES` = `"mp4,mov,webm,avi"`
  - `ALLOWED_DOC_TYPES` = `"pdf,docx,xlsx,pptx,txt"`
- Seed data cho `bank_info`: 1 bản ghi mặc định (Vietcombank)

---

## 2. JPA Entities

**Vị trí:** `backend/src/main/java/com/lms/entity/`

Tất cả entity dùng **Lombok** (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`) và Hibernate annotations.

### User.java
- Enum nội: `Role` (STUDENT/TEACHER/ADMIN), `Status` (ACTIVE/BLOCKED)
- Mapping: `@Table("users")`, `@GeneratedValue(IDENTITY)`
- Enum columns dùng `@JdbcTypeCode(NAMED_ENUM)` để map đúng PostgreSQL native enum
- Timestamps: `@CreationTimestamp`, `@UpdateTimestamp`

### RefreshToken.java
- `@ManyToOne` → User (LAZY)
- Helper methods: `isExpired()`, `isRevoked()`, `isValid()`

### Course.java
- **`@Where(clause = "deleted_at IS NULL")`** — global soft delete filter
- Enum: `Status` (DRAFT/PUBLISHED/ARCHIVED)
- `@ManyToOne` → teacher (User), createdBy (User) — cả hai LAZY

### Lesson.java
- **`@Where(clause = "deleted_at IS NULL")`** — soft delete
- Enum: `Type` (VIDEO/TEXT), `Status` (DRAFT/PUBLISHED), `VideoSourceType` (UPLOAD/YOUTUBE/VIMEO/DRIVE)
- `@ManyToOne` → Course (LAZY)

### LessonAttachment.java
- `@ManyToOne` → Lesson (LAZY)
- Fields: fileName, fileKey, fileUrl, fileType, fileSizeBytes, orderIndex

### Enrollment.java
- Enum: `Status` (PENDING/APPROVED/REJECTED)
- `@ManyToOne` → student (User), course (Course), reviewedBy (User) — tất cả LAZY

### PaymentProof.java
- `@OneToOne` → Enrollment (LAZY, unique)
- Fields: imageUrl, imageKey, note

### LessonProgress.java
- Enum: `Status` (NOT_STARTED/IN_PROGRESS/COMPLETED)
- `@ManyToOne` → student, lesson, course — tất cả LAZY
- Fields: videoWatchedSeconds, videoMaxWatchedPercent, completedAt, lastAccessedAt

### SystemConfig.java
- PK: Integer (SERIAL), unique key column
- `@ManyToOne` → updatedBy (User, LAZY)

### BankInfo.java
- PK: Integer (SERIAL, chỉ 1 bản ghi với id=1)
- `@ManyToOne` → updatedBy (User, LAZY)

---

## 3. Spring Data JPA Repositories

**Vị trí:** `backend/src/main/java/com/lms/repository/`

### UserRepository
- `findByEmail(String)` — dùng cho login/auth
- `existsByEmail(String)` — kiểm tra email trùng khi register
- `findAllWithFilters(role, status, search, pageable)` — JPQL với pagination cho admin list

### RefreshTokenRepository
- `findByTokenHash(String)` — lookup token khi refresh/logout
- `revokeAllByUser(user, now)` — `@Modifying` bulk revoke khi phát hiện token reuse
- `deleteExpiredAndRevoked(cutoff)` — `@Modifying` cleanup job

### CourseRepository
- `findBySlug(String)` — public course detail endpoint
- `existsBySlug(String)` — kiểm tra slug unique khi tạo/update
- `findAllWithFilters(status, search, pageable)` — catalog với filter
- `findAllByTeacher(user, pageable)` — teacher's own courses

### LessonRepository
- `findAllByCourseOrderByOrderIndexAsc` — lesson list theo thứ tự
- `findByIdAndCourse` — validate lesson belongs to course
- `findMaxOrderIndexByCourse` — dùng khi thêm lesson mới (auto orderIndex)
- `countByCourse` — tổng số lesson trong khóa

### LessonAttachmentRepository
- `findAllByLessonOrderByOrderIndexAsc` — attachment list theo thứ tự

### EnrollmentRepository
- `findByStudentAndCourseAndStatusIn` — kiểm tra enrollment PENDING/APPROVED tồn tại
- `existsByStudentAndCourseAndStatusIn` — boolean check
- `findAllWithFilters` — admin filter theo status/courseId/studentId
- `findApprovedStudentsByCourse` — teacher xem danh sách học viên

### PaymentProofRepository
- `findByEnrollment(Enrollment)` — lấy proof của enrollment

### LessonProgressRepository
- `findByStudentAndLesson` — lấy progress 1 bài
- `findAllByStudentAndCourse` — tất cả progress trong khóa
- `countCompletedByStudentAndCourse` — đếm bài hoàn thành (tính %)

### SystemConfigRepository
- `findByKey(String)` — tra cứu config theo key

### BankInfoRepository
- Extends `JpaRepository<BankInfo, Integer>` — CRUD cơ bản

---

## 4. Spring Security & JWT

**Vị trí:** `backend/src/main/java/com/lms/security/` và `config/`

### JwtTokenProvider.java (`com.lms.security`)
- **`generateAccessToken(userId, email, role)`** — tạo JWT với claims: sub=userId, email, role. Expiry 15 phút (cấu hình qua `app.jwt.expiration-ms`)
- **`parseToken(String)`** — parse và verify token, trả về `Claims`
- **`validateToken(String)`** — boolean, log warning nếu expired/malformed/invalid
- **`getUserIdFromToken(String)`**, **`getRoleFromToken(String)`** — extract claims
- Signing key: HS256, decode từ Base64 secret (`app.jwt.secret`)

### JwtAuthenticationFilter.java (`com.lms.security`)
- Extends `OncePerRequestFilter`
- Extract Bearer token từ `Authorization` header
- Validate token → load user từ DB → kiểm tra status `ACTIVE`
- Set `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`
- Principal là `User` entity (không phải UserDetails string)

### UserDetailsServiceImpl.java (`com.lms.security`)
- Implements `UserDetailsService` — dùng cho `AuthenticationManager` trong SecurityConfig
- `loadUserByUsername(email)` — load user, set authorities = `ROLE_{ROLE}`
- Blocked user → `accountLocked = true`

### RefreshTokenService.java (`com.lms.service`)
- **`createRefreshToken(user, userAgent, ip)`** — tạo UUID token, hash SHA-256, lưu DB, trả về plaintext
- **`rotateRefreshToken(plainToken, ...)`** — validate → revoke old → tạo mới (token rotation)
  - Nếu token đã bị revoke mà vẫn dùng → revoke ALL sessions của user (security)
- **`revokeToken(plainToken)`** — logout 1 session
- **`revokeAllUserTokens(user)`** — logout tất cả sessions
- `hashToken(plain)` — SHA-256 → hex string (không lưu plaintext token)

### SecurityConfig.java (`com.lms.config`)
- `@EnableWebSecurity`, `@EnableMethodSecurity`
- **Public endpoints:**
  - `POST /auth/register`, `/auth/login`, `/auth/refresh`
  - `GET /courses`, `GET /courses/{id}`
  - `GET /uploads/**`
- **Admin-only:** `/admin/**` → `hasRole("ADMIN")`
- **Tất cả routes còn lại:** `authenticated()`
- Session: `STATELESS` (không dùng session)
- CSRF: disabled (JWT stateless API)
- CORS: cho phép `localhost:5173`, `localhost:5174`
- JWT Filter đặt trước `UsernamePasswordAuthenticationFilter`

---

## 5. Cấu hình đã cập nhật

### application.yml
- JWT secret đã chuyển sang **Base64-encoded** để tương thích với jjwt library
- Secret mới: `VGhpc0lzQURldlNlY3JldEtleUZvckxNUzIwMjZQbGF0Zm9ybUJhY2tlbmRNdXN0QmUyNTZCaXRzT3JNb3JlISE=`
- Tất cả config còn lại giữ nguyên

---

## Cấu trúc file sau Phase 1

```
backend/src/main/
├── java/com/lms/
│   ├── LmsApplication.java
│   ├── config/
│   │   └── SecurityConfig.java
│   ├── entity/
│   │   ├── User.java
│   │   ├── RefreshToken.java
│   │   ├── Course.java
│   │   ├── Lesson.java
│   │   ├── LessonAttachment.java
│   │   ├── Enrollment.java
│   │   ├── PaymentProof.java
│   │   ├── LessonProgress.java
│   │   ├── SystemConfig.java
│   │   └── BankInfo.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── RefreshTokenRepository.java
│   │   ├── CourseRepository.java
│   │   ├── LessonRepository.java
│   │   ├── LessonAttachmentRepository.java
│   │   ├── EnrollmentRepository.java
│   │   ├── PaymentProofRepository.java
│   │   ├── LessonProgressRepository.java
│   │   ├── SystemConfigRepository.java
│   │   └── BankInfoRepository.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── UserDetailsServiceImpl.java
│   └── service/
│       └── RefreshTokenService.java
└── resources/
    ├── application.yml
    ├── application-prod.yml
    └── db/migration/
        ├── V1__create_users.sql
        ├── V2__create_refresh_tokens.sql
        ├── V3__create_courses.sql
        ├── V4__create_lessons.sql
        ├── V5__create_lesson_attachments.sql
        ├── V6__create_enrollments.sql
        ├── V7__create_payment_proofs.sql
        ├── V8__create_lesson_progress.sql
        ├── V9__create_system_configs.sql
        ├── V10__create_bank_info.sql
        └── V11__insert_default_configs.sql
```

---

## Ghi chú kỹ thuật

| Vấn đề | Giải pháp |
|--------|-----------|
| PostgreSQL native ENUM với JPA | Dùng `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` của Hibernate 6+ |
| Soft delete tự động | `@Where(clause = "deleted_at IS NULL")` trên Course và Lesson entity |
| JWT secret Base64 | jjwt yêu cầu secret key được Base64 encode; đã cập nhật application.yml |
| Token reuse detection | RefreshTokenService revoke ALL sessions khi phát hiện token đã bị revoke được dùng lại |
| Security principal | JwtAuthenticationFilter đặt User entity (không phải String) làm principal để các controller có thể lấy trực tiếp |

---

## Bước tiếp theo (Phase 2)

Phase 2 sẽ implement:
- `AuthController` — register, login, logout, refresh, me, change-password
- `AuthService` — business logic cho auth flows
- `UserController` (admin routes) — CRUD users
- `UserService` — user management với soft delete awareness
