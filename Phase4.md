# Phase 4 — Backend: Enrollment, Progress, Reports & Config APIs

**Mục tiêu:** Hoàn thiện Module 6 (Enrollment), Module 7 (Progress), Module 8 (Reports), Module 9 (System Config / Bank Info) theo `implementation_plan.md`.

---

## Tổng quan các file đã tạo/cập nhật

| Loại | File | Mô tả |
|------|------|-------|
| Repository (update) | `repository/UserRepository.java` | Thêm `countByRoleAndDeletedAtIsNull` |
| Repository (update) | `repository/CourseRepository.java` | Thêm `countByStatus` |
| Repository (update) | `repository/EnrollmentRepository.java` | Thêm `countByStatus`, `countByCourse`, `findTopCoursesByEnrollmentCount`, `countEnrollmentsByMonth` (native query), `findAllByStudent` |
| Repository (update) | `repository/LessonProgressRepository.java` | Thêm `countByStatus`, `findLessonCompletionStatsByCourse` |
| DTO | `dto/enrollment/EnrollmentResponse.java` | Response enrollment kèm progress% và paymentProof |
| DTO | `dto/enrollment/CreateEnrollmentRequest.java` | `{ courseId }` |
| DTO | `dto/enrollment/RejectEnrollmentRequest.java` | `{ note }` optional |
| DTO | `dto/enrollment/PaymentProofResponse.java` | Id, imageUrl, note, createdAt |
| DTO | `dto/progress/CourseProgressResponse.java` | Tổng progress + lesson summaries |
| DTO | `dto/progress/LessonProgressSummary.java` | Per-lesson progress (status, watchedSecs, percent, completedAt) |
| DTO | `dto/progress/VideoProgressRequest.java` | `{ watchedSeconds }` |
| DTO | `dto/report/TopCourseItem.java` | courseId, title, slug, thumbnailUrl, enrollmentCount |
| DTO | `dto/report/OverviewReportResponse.java` | Platform stats + topCourses |
| DTO | `dto/report/MonthlyCountItem.java` | year, month, count |
| DTO | `dto/report/LessonCompletionStat.java` | lessonId, lessonTitle, completedCount |
| DTO | `dto/report/CourseReportResponse.java` | Course stats + enrollmentsByMonth + lessonCompletionStats |
| DTO | `dto/report/StudentCourseProgress.java` | Per-course progress for student report |
| DTO | `dto/report/StudentReportResponse.java` | Student info + list of course progresses |
| DTO | `dto/config/ConfigResponse.java` | id, key, value, description, updatedAt |
| DTO | `dto/config/UpdateConfigRequest.java` | `{ key, value }` |
| DTO | `dto/config/BankInfoResponse.java` | Full bank info |
| DTO | `dto/config/UpdateBankInfoRequest.java` | Bank info fields |
| Service | `service/SystemConfigService.java` | CRUD config + **in-memory cache 5 phút** |
| Service | `service/EnrollmentService.java` | CRUD enrollment + upload payment proof + approve/reject |
| Service | `service/ProgressService.java` | Track lesson open + video progress + COMPLETION_MODE logic |
| Service | `service/ReportService.java` | Overview / Course report / Student report |
| Controller | `controller/EnrollmentController.java` | REST `/enrollments/**` |
| Controller | `controller/ProgressController.java` | REST `/progress/**` |
| Controller | `controller/admin/ReportController.java` | REST `/admin/reports/**` |
| Controller | `controller/admin/ConfigController.java` | REST `/admin/config/**` |
| Config (update) | `config/SecurityConfig.java` | Thêm TEACHER access cho course report + public bank-info |

---

## 1) Enrollment Module (`/enrollments`)

### Business Rules

- **Không tạo enrollment trùng:** `existsByStudentAndCourseAndStatusIn(PENDING, APPROVED)` → 400 nếu đã tồn tại
- **Chỉ APPROVED enrollment** mới được vào trang học (kiểm tra trong `LessonService` & `ProgressService`)
- Enrollment chỉ cho phép `PENDING` trước khi được Admin approve/reject
- Upload payment proof chỉ được khi status = `PENDING`

### Endpoints

| Endpoint | Quyền | Ghi chú |
|---------|-------|---------|
| `GET /enrollments` | STUDENT / ADMIN | STUDENT → own + progress; ADMIN → all + filter |
| `GET /enrollments/{id}` | AUTH | STUDENT chỉ xem của mình; ADMIN xem tất cả |
| `POST /enrollments` | STUDENT | courseId trong body; validate không trùng |
| `POST /enrollments/{id}/payment-proof` | STUDENT | Multipart; lưu qua `FileStorageService.storeImage("receipt")` |
| `PATCH /enrollments/{id}/approve` | ADMIN | Set APPROVED + reviewedBy + reviewedAt |
| `PATCH /enrollments/{id}/reject` | ADMIN | Set REJECTED + note + reviewedBy + reviewedAt |

---

## 2) Progress Module (`/progress`)

### Completion Mode (đọc từ DB, cache 5 phút)

| Mode | Hành vi |
|------|---------|
| `OPEN` | Mở lesson là COMPLETED ngay |
| `VIDEO_50` | Phải xem ≥ 50% video mới COMPLETED |

- Lesson type `TEXT` luôn COMPLETED ngay khi mở, bất kể mode

### Endpoints

| Endpoint | Quyền | Ghi chú |
|---------|-------|---------|
| `GET /progress/courses/{courseId}` | STUDENT (enrolled) | Tổng progress + từng lesson |
| `POST /progress/lessons/{lessonId}/open` | STUDENT (enrolled) | COMPLETION_MODE-aware |
| `POST /progress/lessons/{lessonId}/video-progress` | STUDENT (enrolled) | `{ watchedSeconds }`; check milestone 50% |

### Logic `updateVideoProgress`

- Track `videoWatchedSeconds` (chỉ tăng, không giảm khi tua lại)
- Tính `videoMaxWatchedPercent = min(100, watchedSeconds / duration * 100)`
- Nếu `percent >= 50.0` và `MODE = VIDEO_50` → COMPLETED

---

## 3) Reports Module (`/admin/reports`)

### Security Update (`SecurityConfig.java`)

```java
// Thêm TRƯỚC rule /admin/** → ADMIN
.requestMatchers(HttpMethod.GET, "/admin/config/bank-info").permitAll()
.requestMatchers(HttpMethod.GET, "/admin/reports/courses/{courseId}").hasAnyRole("TEACHER", "ADMIN")
.requestMatchers("/admin/**").hasRole("ADMIN")
```

### Endpoints

| Endpoint | Quyền | Dữ liệu trả về |
|---------|-------|---------------|
| `GET /admin/reports/overview` | ADMIN | Total users/courses/enrollments, completedLessons, top 5 courses |
| `GET /admin/reports/courses/{id}` | TEACHER (own), ADMIN | Lesson count, enrollment stats, monthly chart (12 months), completion per lesson |
| `GET /admin/reports/students/{id}` | ADMIN | Student info + list courses + progress% |

### Queries đáng chú ý

- **Monthly enrollment**: dùng native query PostgreSQL `EXTRACT(YEAR/MONTH FROM created_at)`  
- **Top courses**: `GROUP BY course ORDER BY COUNT DESC LIMIT 5`  
- **Lesson completion stats**: `GROUP BY lesson WHERE status=COMPLETED`

---

## 4) System Config Module (`/admin/config`)

### `SystemConfigService` — Cache 5 phút

```
Lần đầu / hết TTL → reload toàn bộ configs từ DB vào ConcurrentHashMap
getValue(key)      → lookup từ cache
updateValue(...)   → save to DB + invalidateCache (reset TTL)
getCompletionMode()→ getValue("COMPLETION_MODE") ?? "OPEN"
```

### Endpoints

| Endpoint | Quyền | Ghi chú |
|---------|-------|---------|
| `GET /admin/config` | ADMIN | Tất cả config keys |
| `PATCH /admin/config` | ADMIN | `{ key, value }` — update một key |
| `GET /admin/config/bank-info` | **Public** | Hiển thị trang hướng dẫn thanh toán cho student |
| `PUT /admin/config/bank-info` | ADMIN | Cập nhật đầy đủ bank info |

Seed data (từ V11 migration):
- `COMPLETION_MODE = OPEN`
- `MAX_VIDEO_SIZE_MB = 2048`
- `MAX_DOCUMENT_SIZE_MB = 50`
- `ALLOWED_VIDEO_TYPES = mp4,mov,webm,avi`
- `ALLOWED_DOC_TYPES = pdf,docx,xlsx,pptx,txt`

---

## 5) Kiểm tra

- Tất cả file đã được kiểm tra qua IDE linter — không có lỗi.
- Repository methods dùng JPQL và native query đều có `@Param` annotation đầy đủ.
- `LessonProgressRepository.findByStudentAndLesson` đã được confirm từ entity `@Table(name="lesson_progress")` với unique constraint `(student_id, lesson_id)`.
