# LMS Platform — Giải thích Chi tiết Kế hoạch Từng Phase

**Phiên bản:** 1.0  
**Ngày:** 14/04/2026  
**Ngôn ngữ:** Tiếng Việt  

---

## Tổng quan hệ thống

Dự án xây dựng một hệ thống **Learning Management System (LMS)** gồm 3 phần riêng biệt:

- **Backend** — Máy chủ Java Spring Boot, cung cấp toàn bộ API cho hệ thống, quản lý dữ liệu PostgreSQL và lưu trữ file trực tiếp trên server.
- **Frontend** — Giao diện web dành cho **Học viên** (Student), xây dựng bằng React + TypeScript.
- **Admin** — Giao diện web dành cho **Giảng viên** (Teacher) và **Quản trị viên** (Admin), xây dựng bằng React + TypeScript.

Toàn bộ quá trình phát triển được chia làm **7 Phase** theo thứ tự từ nền tảng đến hoàn thiện.

---

## Phase 0 — Thiết lập nền tảng dự án

### Mục tiêu
Tạo ra khung xương của toàn bộ dự án: 3 thư mục con tương ứng 3 project, cấu hình môi trường chạy local bằng Docker Compose, đảm bảo tất cả dịch vụ khởi động được mà không có lỗi.

### Công việc cụ thể

#### 1. Tạo cấu trúc thư mục gốc
```
LEARNING_ONLINE/
├── backend/      ← Java Spring Boot
├── frontend/     ← React (Student Web)
├── admin/        ← React (Admin Web)
└── docker-compose.yml
```

#### 2. Khởi tạo project Backend (`backend/`)
- Tạo project Spring Boot qua [start.spring.io] hoặc lệnh Maven với Java 20.
- Thêm các thư viện cần thiết vào `pom.xml`:
  - `spring-boot-starter-web` — tạo REST API
  - `spring-boot-starter-security` — bảo mật, JWT
  - `spring-boot-starter-data-jpa` — kết nối và thao tác database
  - `spring-boot-starter-validation` — validate dữ liệu đầu vào
  - `postgresql` — driver kết nối PostgreSQL
  - `flyway-core` — quản lý migration database
  - `lombok` — giảm boilerplate code (getter/setter tự động)
  - `jjwt` — thư viện sinh và xác thực JWT token
- Tạo file `application.yml` với cấu hình cho môi trường dev:
  - Cổng server: `8080`
  - Chuỗi kết nối PostgreSQL
  - Thư mục lưu file upload: `./uploads` (có thể cấu hình lại)
  - Cấu hình JWT (secret key, thời gian sống token)
- Tạo `Dockerfile` cho backend: dùng Maven để build → chạy bằng OpenJDK 20 slim.

#### 3. Khởi tạo project Frontend (`frontend/`)
- Chạy lệnh: `npm create vite@latest . -- --template react-ts`
- Cài các thư viện:
  - `react-router-dom@7` — điều hướng trang
  - `@tanstack/react-query@5` — quản lý data từ API (cache, loading, error)
  - `zustand@5` — quản lý trạng thái toàn cục (auth state)
  - `axios` — gọi HTTP API có interceptor
  - `react-hook-form` + `zod` — form và validation
  - `lucide-react` — bộ icon
  - `react-player` — nhúng video YouTube/Vimeo
- Cấu hình Vite: proxy `/api` → `http://localhost:8080`
- Tạo cấu trúc thư mục theo **Feature-Sliced Design (FSD)**.

#### 4. Khởi tạo project Admin (`admin/`)
- Tương tự frontend, thêm các thư viện riêng cho admin:
  - `@dnd-kit/core` + `@dnd-kit/sortable` — kéo thả sắp xếp bài học
  - `@tiptap/react` — soạn thảo rich text (nội dung bài học TEXT)
  - `recharts` — vẽ biểu đồ thống kê báo cáo
- Cấu hình Vite: proxy `/api` → `http://localhost:8080`, chạy cổng `5174`.

#### 5. Cấu hình Docker Compose
Tạo file `docker-compose.yml` để chạy toàn bộ hệ thống cùng lúc bằng một lệnh:
- **PostgreSQL 15**: database chính, lưu vào volume để không mất dữ liệu khi restart.
- **pgAdmin4**: công cụ quản lý database bằng giao diện web (chỉ dùng trong dev).
- **Backend**: build từ `./backend`, mount thư mục `./uploads` vào container để lưu file.
- **Frontend**: build từ `./frontend`, chạy ở cổng `5173`.
- **Admin**: build từ `./admin`, chạy ở cổng `5174`.

#### 6. Viết file README
Hướng dẫn cách chạy toàn bộ dự án bằng `docker-compose up`, cách chạy từng project riêng lẻ trong môi trường dev.

### Kết quả bàn giao
- File **`Phase00.md`**: Ghi lại toàn bộ cấu trúc đã tạo, lệnh khởi chạy, cổng dịch vụ, tài khoản mặc định (pgAdmin, DB).

---

## Phase 1 — Backend: Database và Nền tảng Bảo mật

### Mục tiêu
Tạo toàn bộ bảng cơ sở dữ liệu (theo đúng ERD.md), ánh xạ thành các class Java (Entity), thiết lập cấu hình bảo mật JWT cơ bản để các phase sau có thể viết API lên trực tiếp.

### Công việc cụ thể

#### 1. Viết Database Migrations (Flyway)
Flyway là công cụ quản lý phiên bản database. Mỗi file SQL là một "bước" thay đổi cấu trúc DB, Flyway đảm bảo chỉ chạy mỗi file một lần và theo đúng thứ tự.

Tạo các file trong `src/main/resources/db/migration/`:

| File | Nội dung |
|------|---------|
| `V1__create_users.sql` | Bảng `users`: id, email, password_hash, full_name, role (STUDENT/TEACHER/ADMIN), status (ACTIVE/BLOCKED), created_at, updated_at |
| `V2__create_refresh_tokens.sql` | Bảng `refresh_tokens`: id, user_id, token_hash, expires_at, revoked_at, user_agent, ip_address |
| `V3__create_courses.sql` | Bảng `courses`: id, title, slug, description, price, status (DRAFT/PUBLISHED/ARCHIVED), teacher_id, deleted_at |
| `V4__create_lessons.sql` | Bảng `lessons`: id, course_id, title, type (VIDEO/TEXT), order_index, video_source_type, video_url, text_content, deleted_at |
| `V5__create_lesson_attachments.sql` | Bảng `lesson_attachments`: id, lesson_id, file_name, file_key, file_url, file_type, file_size_bytes |
| `V6__create_enrollments.sql` | Bảng `enrollments`: id, student_id, course_id, status (PENDING/APPROVED/REJECTED), note, reviewed_by, reviewed_at |
| `V7__create_payment_proofs.sql` | Bảng `payment_proofs`: id, enrollment_id, image_url, image_key, note |
| `V8__create_lesson_progress.sql` | Bảng `lesson_progress`: id, student_id, lesson_id, course_id, status, video_watched_seconds, video_max_watched_percent, completed_at |
| `V9__create_system_configs.sql` | Bảng `system_configs`: id, key (UNIQUE), value, description |
| `V10__create_bank_info.sql` | Bảng `bank_info`: id, bank_name, account_number, account_name, branch, transfer_template, qr_image_url |
| `V11__insert_default_configs.sql` | Dữ liệu mặc định: COMPLETION_MODE=OPEN, MAX_VIDEO_SIZE_MB=2048, MAX_DOCUMENT_SIZE_MB=50 |

#### 2. Tạo JPA Entities
Mỗi Entity là một class Java tương ứng với một bảng DB. Dùng `@Entity`, `@Table`, `@Column` để ánh xạ.

Các điểm quan trọng:
- `User.java`: có enum `Role` (STUDENT, TEACHER, ADMIN) và `Status` (ACTIVE, BLOCKED).
- `Course.java` và `Lesson.java`: thêm `@SQLRestriction("deleted_at IS NULL")` để mọi query tự động lọc bỏ record đã xóa mềm (soft delete).
- `Enrollment.java`: có enum `Status` (PENDING, APPROVED, REJECTED).
- `LessonProgress.java`: có enum `Status` (NOT_STARTED, IN_PROGRESS, COMPLETED).
- `RefreshToken.java`: lưu hash của token (không lưu plaintext), có thể kiểm tra revoked.

#### 3. Tạo Repositories (Spring Data JPA)
Mỗi Repository là một interface kế thừa `JpaRepository`, Spring tự động tạo implementation với các câu query cơ bản (findById, save, delete...). Tạo thêm các method tùy chỉnh khi cần:

```java
// Ví dụ:
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
List<Course> findByTeacherIdAndDeletedAtIsNull(Long teacherId);
Optional<Enrollment> findByStudentIdAndCourseIdAndStatusIn(Long studentId, Long courseId, List<Status> statuses);
```

#### 4. Cấu hình Spring Security

Đây là bước quan trọng nhất của Phase 1. Tạo class `SecurityConfig.java` để định nghĩa:

**Các đường dẫn công khai (không cần đăng nhập):**
- `POST /api/auth/register` — đăng ký
- `POST /api/auth/login` — đăng nhập
- `POST /api/auth/refresh` — refresh token
- `GET /api/courses` — xem danh sách khóa học
- `GET /api/courses/*` — xem chi tiết khóa học
- `GET /uploads/**` — tải file (video, tài liệu)

**Các đường dẫn yêu cầu đăng nhập:**
- `/api/enrollments/**` — cần là STUDENT
- `/api/admin/**` — cần là ADMIN
- Tất cả còn lại — cần có JWT token hợp lệ

**Cơ chế JWT:**
- Tạo class `JwtTokenProvider.java`: sinh JWT với payload chứa userId, email, role; kiểm tra chữ ký và hạn sử dụng.
- Tạo class `JwtAuthenticationFilter.java`: filter chạy trước mọi request, đọc header `Authorization: Bearer <token>`, validate token, lấy thông tin user gán vào SecurityContext.

#### 5. Tạo Exception Handler toàn cục
Tạo `GlobalExceptionHandler.java` với `@RestControllerAdvice` để bắt tất cả lỗi và trả về đúng format:
```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Kết quả bàn giao
- File **`Phase01.md`**: Liệt kê toàn bộ bảng DB đã tạo, cấu trúc Entity, cấu hình Security, hướng dẫn kiểm tra bằng cách chạy migration.

---

## Phase 2 — Backend: API Xác thực và Quản lý Người dùng

### Mục tiêu
Xây dựng hoàn chỉnh các API liên quan đến đăng ký, đăng nhập, quản lý phiên làm việc (token), thông tin cá nhân, và quản lý người dùng cho Admin.

### Công việc cụ thể

#### 1. Auth Module — Xác thực người dùng

**`POST /api/auth/register`** — Đăng ký tài khoản
- Nhận: email, password, full_name, phone
- Kiểm tra: email chưa tồn tại trong DB
- Xử lý: mã hóa mật khẩu bằng BCrypt, tạo user với role=STUDENT
- Trả về: cặp access_token + refresh_token + thông tin user

**`POST /api/auth/login`** — Đăng nhập
- Nhận: email, password
- Kiểm tra: email tồn tại, password khớp, tài khoản không bị BLOCKED
- Xử lý: sinh access_token mới (hạn 15 phút), sinh refresh_token mới (hạn 30 ngày, lưu vào bảng `refresh_tokens` dưới dạng SHA-256 hash)
- Trả về: cặp token + thông tin user

**`POST /api/auth/logout`** — Đăng xuất
- Nhận: Bearer token (đã đăng nhập)
- Xử lý: đánh dấu refresh_token hiện tại là revoked (`revoked_at = NOW()`)
- Trả về: 204 No Content

**`POST /api/auth/refresh`** — Làm mới token
- Nhận: refresh_token (gửi trong body)
- Kiểm tra: token tồn tại trong DB, chưa hết hạn, chưa bị revoke
- Phát hiện tái sử dụng token đã revoke: nếu token đã bị revoke mà vẫn được dùng → nghi ngờ bị đánh cắp → revoke TẤT CẢ token của user đó
- Xử lý: revoke token cũ, sinh cặp token mới (token rotation)
- Trả về: access_token mới + refresh_token mới

**`GET /api/auth/me`** — Lấy thông tin người dùng hiện tại
- Đọc userId từ JWT trong header, truy vấn DB, trả về thông tin user

**`PATCH /api/auth/me`** — Cập nhật thông tin cá nhân
- Chỉ cho phép sửa: full_name, phone, avatar_url
- Email không được đổi sau khi đăng ký

**`POST /api/auth/change-password`** — Đổi mật khẩu
- Kiểm tra mật khẩu hiện tại khớp → mã hóa mật khẩu mới → lưu

> ⚠️ **Bỏ qua:** `forgot-password` và `reset-password` (liên quan đến email — không triển khai trong MVP).

#### 2. User Management Module — Quản lý người dùng (Admin)

**`GET /api/admin/users`** — Danh sách người dùng
- Phân trang (page, limit), tìm kiếm theo tên/email, lọc theo role và status

**`GET /api/admin/users/:id`** — Chi tiết người dùng
- Trả về thông tin user + danh sách enrollment gần nhất của user đó

**`POST /api/admin/users`** — Admin tạo tài khoản Teacher
- Admin nhập đầy đủ thông tin, chỉ định role=TEACHER

**`PATCH /api/admin/users/:id`** — Sửa thông tin user
- Admin có thể đổi role (STUDENT ↔ TEACHER ↔ ADMIN) và status (ACTIVE ↔ BLOCKED)

**`DELETE /api/admin/users/:id`** — Xóa người dùng (soft delete)
- Không cho xóa chính mình
- Không cho xóa nếu user là teacher đang có khóa học PUBLISHED

#### 3. Bảo vệ API theo Role
Tại mỗi endpoint, kiểm tra:
- STUDENT: chỉ được gọi các API dành cho student
- TEACHER: chỉ được thao tác trên khóa học/lesson của chính mình
- ADMIN: toàn quyền

### Kết quả bàn giao
- File **`Phase02.md`**: Liệt kê tất cả endpoint đã làm, cách test bằng Postman/curl, ví dụ request/response.

---

## Phase 3 — Backend: Khóa học, Bài học và Lưu trữ File

### Mục tiêu
Xây dựng toàn bộ API quản lý khóa học, bài học, upload file (video + tài liệu), và serve file lên giao diện người dùng.

### Công việc cụ thể

#### 1. Dịch vụ lưu trữ file cục bộ (Local Storage Service)

Thay vì dùng AWS S3, file được lưu trực tiếp trên server trong thư mục được cấu hình:

```yaml
# application.yml
app:
  storage:
    upload-dir: ./uploads        # Thư mục gốc lưu file
    base-url: http://localhost:8080  # URL gốc để truy cập file
```

`FileStorageService.java` thực hiện các thao tác:

- **Lưu file video**: `uploads/videos/{courseId}/{uuid}_{tên-gốc}.mp4`
- **Lưu file tài liệu**: `uploads/docs/{lessonId}/{uuid}_{tên-gốc}.pdf`
- **Lưu ảnh**: `uploads/images/{loại}/{uuid}.jpg` (avatar, thumbnail, biên lai)
- **Xóa file**: xóa khỏi ổ cứng khi lesson/attachment bị xóa
- **Serve file**: trả về `Resource` để stream file qua HTTP

`FileController.java` expose endpoint:
```
GET /uploads/**  →  Stream file từ thư mục uploads
```
Đặc biệt với video: hỗ trợ **HTTP Range header** để trình duyệt có thể tua video (seek).

#### 2. Course Module — Quản lý khóa học

**`GET /api/courses`** — Danh sách khóa học công khai
- Mặc định chỉ trả về khóa PUBLISHED
- Phân trang, tìm kiếm theo tên
- Nếu request kèm token của Student: bổ sung `enrollment_status` cho mỗi khóa
- Teacher/Admin được phép lọc thêm theo status (DRAFT, ARCHIVED)

**`GET /api/courses/:id`** — Chi tiết khóa học
- Thông tin đầy đủ + danh sách lesson preview (chỉ title và type, không có nội dung)
- Nếu Student đã đăng nhập: kèm `enrollment_status` hiện tại

**`POST /api/courses`** — Tạo khóa học mới
- Teacher/Admin tạo khóa
- **Tự động sinh slug** từ title: bỏ dấu tiếng Việt, lowercase, thay khoảng trắng bằng `-`. Nếu trùng → thêm `-2`, `-3`...
- Trạng thái mặc định: DRAFT

**`PATCH /api/courses/:id`** — Cập nhật khóa học
- Teacher chỉ được sửa khóa của mình (kiểm tra `teacherId == userId`)
- Admin sửa bất kỳ khóa nào
- Cho phép chuyển trạng thái: DRAFT ↔ PUBLISHED, PUBLISHED → ARCHIVED

**`DELETE /api/courses/:id`** — Xóa khóa học (soft delete)
- Chỉ Admin được xóa
- Điều kiện: khóa phải đang DRAFT VÀ chưa có enrollment nào
- Xóa mềm: set `deleted_at = NOW()`, không xóa thực sự khỏi DB

**`GET /api/courses/:id/students`** — Danh sách học viên của khóa
- Teacher xem học viên đã APPROVED của khóa mình
- Trả về: tên, email, ngày đăng ký, % hoàn thành

#### 3. Lesson Module — Quản lý bài học

**`GET /api/courses/:cid/lessons`** — Danh sách bài học
- Public: chỉ xem title và type (không có nội dung)
- Student có enrollment APPROVED: xem đầy đủ + trạng thái progress từng bài
- Teacher/Admin: xem đầy đủ kể cả bài DRAFT

**`GET /api/courses/:cid/lessons/:lid`** — Chi tiết bài học
- Kiểm tra Student có enrollment APPROVED mới cho xem nội dung
- Trả về: video URL, text_content, danh sách attachment, progress hiện tại

**`POST /api/courses/:cid/lessons`** — Tạo bài học
- Loại VIDEO: nhận `video_source_type` (UPLOAD/YOUTUBE/VIMEO/DRIVE) và `video_url` hoặc `video_file_key`
- Loại TEXT: nhận `text_content` (HTML từ rich text editor)

**`PATCH /api/courses/:cid/lessons/:lid`** — Cập nhật bài học

**`DELETE /api/courses/:cid/lessons/:lid`** — Xóa bài học (soft delete)
- Cảnh báo nếu đã có học viên xem bài (có progress record)

**`PATCH /api/courses/:cid/lessons/reorder`** — Sắp xếp lại thứ tự
- Nhận danh sách `[{lesson_id, order_index}]`, cập nhật hàng loạt

#### 4. Upload Module — Upload file lên server

**`POST /api/upload/video`** — Upload video
- Chỉ Teacher/Admin
- Validate: đúng định dạng (mp4, mov, webm, avi), không vượt giới hạn dung lượng (đọc từ SystemConfig)
- Lưu vào `uploads/videos/{courseId}/`
- Trả về: `file_key` (đường dẫn tương đối) và `file_url` (URL truy cập đầy đủ)

**`POST /api/upload/image`** — Upload ảnh
- Tất cả user đã đăng nhập
- Loại: `avatar`, `thumbnail`, `receipt` (biên lai)
- Giới hạn 5MB, định dạng jpg/png/webp
- Tự động resize ảnh nếu quá lớn (dùng Thumbnailator)

#### 5. Attachment Module — File đính kèm bài học

**`GET /api/lessons/:lid/attachments`** — Danh sách file đính kèm
- Student enrolled, Teacher, Admin mới xem được

**`POST /api/lessons/:lid/attachments`** — Upload file đính kèm
- Teacher upload file tài liệu (PDF, DOCX, XLSX, PPTX, TXT)
- Validate định dạng và giới hạn dung lượng từ SystemConfig

**`DELETE /api/lessons/:lid/attachments/:aid`** — Xóa file đính kèm
- Xóa cả file khỏi ổ cứng và record trong DB

### Kết quả bàn giao
- File **`Phase03.md`**: Liệt kê endpoint, mô tả cách lưu file, cấu trúc thư mục uploads, cách test upload.

---

## Phase 4 — Backend: Đăng ký Khóa học, Tiến độ học, Báo cáo và Cấu hình

### Mục tiêu
Hoàn thiện phần nghiệp vụ quan trọng nhất: luồng đăng ký và duyệt khóa học, theo dõi tiến độ học viên, hệ thống báo cáo và cấu hình hệ thống.

### Công việc cụ thể

#### 1. Enrollment Module — Đăng ký khóa học

**Luồng nghiệp vụ:**
```
Student bấm "Đăng ký" → Tạo Enrollment PENDING
          ↓
Student upload biên lai chuyển khoản (tùy chọn)
          ↓
Admin vào xem danh sách PENDING → Duyệt APPROVED hoặc Từ chối REJECTED
          ↓
APPROVED: Student vào học được | REJECTED: Student có thể đăng ký lại
```

**`GET /api/enrollments`** — Danh sách enrollment
- Student: chỉ xem của mình, kèm thông tin progress và khóa học
- Admin: xem tất cả, filter theo status/course/student, phân trang

**`POST /api/enrollments`** — Student tạo yêu cầu đăng ký
- Kiểm tra: không được có 2 enrollment PENDING/APPROVED cho cùng 1 khóa
- Kiểm tra: khóa phải đang PUBLISHED
- Tạo enrollment trạng thái PENDING
- Trả về: thông tin enrollment + thông tin ngân hàng để hiển thị trang hướng dẫn thanh toán

**`POST /api/enrollments/:id/payment-proof`** — Upload biên lai
- Student upload ảnh chụp màn hình hoặc ảnh chuyển khoản
- Liên kết với enrollment (1 enrollment có 1 payment_proof)
- Nếu đã có payment_proof: cập nhật lại (cho phép upload lại)

**`PATCH /api/enrollments/:id/approve`** — Admin duyệt enrollment
- Set status = APPROVED + ghi `reviewed_by`, `reviewed_at`
- Sau khi APPROVED: Student có thể vào trang học ngay

**`PATCH /api/enrollments/:id/reject`** — Admin từ chối
- Set status = REJECTED + lưu lý do vào `note`
- Student xem được lý do từ chối, có thể đăng ký lại

#### 2. Progress Module — Theo dõi tiến độ học

**Logic hoàn thành bài học** (đọc từ SystemConfig `COMPLETION_MODE`):
- `OPEN`: Học viên mở bài → tự động đánh dấu COMPLETED ngay lập tức
- `VIDEO_50`: Học viên phải xem hết 50% thời lượng video mới COMPLETED. Bài TEXT vẫn dùng OPEN.

**`GET /api/progress/courses/:cid`** — Tiến độ của student trong khóa
- Trả về: số bài đã hoàn thành, tổng số bài, % hoàn thành, chi tiết từng bài

**`POST /api/progress/lessons/:lid/open`** — Ghi nhận mở bài
- Gọi khi student bắt đầu xem bài
- Nếu `COMPLETION_MODE=OPEN`: set COMPLETED ngay
- Nếu `COMPLETION_MODE=VIDEO_50` và bài là TEXT: set COMPLETED ngay
- Nếu `COMPLETION_MODE=VIDEO_50` và bài là VIDEO: chỉ set IN_PROGRESS

**`POST /api/progress/lessons/:lid/video-progress`** — Cập nhật tiến độ video
- Frontend gọi API này mỗi 5 giây khi đang xem video
- Gửi lên: giây hiện tại, tổng thời lượng, % đã xem
- Backend lưu giá trị lớn nhất đã đạt được (`video_max_watched_percent`)
- Nếu `COMPLETION_MODE=VIDEO_50` và `percent >= 50`: tự động set COMPLETED

#### 3. Reports Module — Báo cáo thống kê

**`GET /api/admin/reports/overview`** — Dashboard tổng quan (Admin)
Trả về các con số tổng hợp:
- Tổng số khóa đang PUBLISHED
- Tổng số học viên
- Số enrollment APPROVED trong tháng này
- Số enrollment đang chờ duyệt (PENDING)
- % hoàn thành trung bình toàn hệ thống
- Top 5 khóa học có nhiều học viên nhất

**`GET /api/admin/reports/courses/:id`** — Báo cáo chi tiết khóa (Teacher/Admin)
- Tổng số học viên đã đăng ký
- Số học viên đã hoàn thành toàn bộ khóa
- % hoàn thành trung bình
- Thống kê từng bài: bao nhiêu học viên đã xem, tỉ lệ hoàn thành
- Biểu đồ enrollment theo tháng

**`GET /api/admin/reports/students/:id`** — Báo cáo học viên (Admin)
- Danh sách tất cả khóa đã đăng ký
- Tiến độ và trạng thái từng khóa
- Ngày đăng ký, lần học gần nhất

#### 4. System Config Module — Cấu hình hệ thống

**`GET /api/admin/config`** — Xem toàn bộ cấu hình
- Trả về: COMPLETION_MODE, MAX_VIDEO_SIZE_MB, MAX_DOCUMENT_SIZE_MB, ALLOWED_VIDEO_TYPES, ALLOWED_DOC_TYPES

**`PATCH /api/admin/config`** — Cập nhật cấu hình
- Chỉ ADMIN, cập nhật nhiều key cùng lúc
- Sau khi cập nhật: xóa cache để các request sau đọc giá trị mới

**`GET /api/admin/config/bank-info`** — Xem thông tin ngân hàng
**`PUT /api/admin/config/bank-info`** — Cập nhật thông tin ngân hàng nhận chuyển khoản

> **SystemConfigService** sử dụng cache 5 phút để không phải query DB mỗi lần cần đọc config (VD: đọc COMPLETION_MODE khi học viên gửi video-progress).

### Kết quả bàn giao
- File **`Phase04.md`**: Toàn bộ API backend đã hoàn chỉnh, hướng dẫn test từng luồng nghiệp vụ.

---

## Phase 5 — Frontend: Giao diện Web Học viên

### Mục tiêu
Xây dựng toàn bộ giao diện web dành cho học viên với 10 màn hình, theo kiến trúc Feature-Sliced Design (FSD).

### Kiến trúc Feature-Sliced Design (FSD) là gì?

FSD là kiến trúc tổ chức code phổ biến nhất cho React năm 2026. Thay vì chia theo loại file (components/, hooks/, utils/), FSD chia theo **tầng chức năng** từ cao xuống thấp:

```
app/        ← Khởi tạo ứng dụng (providers, router)
pages/      ← Trang (chỉ compose, không có logic phức tạp)
widgets/    ← Khối UI tái sử dụng lớn (Header, Footer...)
features/   ← Tính năng có side effect (gọi API, quản lý state)
entities/   ← Khái niệm nghiệp vụ (Course, User, Lesson)
shared/     ← Tiện ích, UI component thuần, không biết về domain
```

**Quy tắc:** Tầng cao hơn có thể dùng tầng thấp hơn, nhưng KHÔNG được ngược lại. VD: `features/` có thể dùng `entities/` và `shared/`, nhưng `entities/` không được dùng `features/`.

### Công việc cụ thể

#### 1. Shared Layer — Nền tảng dùng chung

**`shared/api/axiosInstance.ts`** — HTTP Client thông minh:
- Mọi request tự động đính kèm `Authorization: Bearer {accessToken}`
- Khi nhận response 401 (token hết hạn): tự động gọi `POST /auth/refresh`, lấy token mới, và thử lại request gốc một lần
- Nếu refresh cũng thất bại: đăng xuất người dùng và redirect về trang login

**`shared/store/authStore.ts`** — Zustand store lưu trạng thái đăng nhập:
```typescript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  login(tokens, user) { ... },
  logout() { ... },
  setAccessToken(token) { ... }
}
```

**`shared/ui/`** — Các component UI tái sử dụng:
Button, Input, Modal, Spinner, Badge, Pagination, Avatar, ProgressBar, Skeleton (loading state)

#### 2. Entities Layer — Khái niệm nghiệp vụ

- `entities/course/`: `CourseCard` (hiển thị card khóa học), `CourseStatus` badge, TypeScript types
- `entities/lesson/`: `LessonItem` (item trong sidebar), icon Video/Text, types
- `entities/user/`: `UserAvatar`, types
- `entities/enrollment/`: `EnrollmentBadge` (PENDING/APPROVED/REJECTED với màu sắc)

#### 3. Features Layer — Tính năng chính

**`features/auth/`**:
- `LoginForm` — form đăng nhập với validation Zod
- `RegisterForm` — form đăng ký tài khoản
- `AuthGuard` — wrapper bảo vệ route, redirect về `/login` nếu chưa đăng nhập
- `useAuth` hook — các action login/logout

**`features/course-enrollment/`**:
- `EnrollButton` — nút "Đăng ký khóa" với logic kiểm tra trạng thái
- `PaymentGuide` — hiển thị thông tin ngân hàng + form upload biên lai
- `useEnrollment` — TanStack Query mutations

**`features/lesson-player/`**:
- `VideoPlayer` — HTML5 video player cho file upload từ server; iframe embed cho YouTube/Vimeo/Drive
- `TextReader` — render HTML content an toàn (sanitize XSS bằng DOMPurify)
- `ProgressTracker` — hook gọi API `/progress/lessons/:id/open` và `/video-progress` tự động

**`features/file-viewer/`**:
- `AttachmentList` — danh sách file đính kèm
- `InlineViewer` — xem PDF inline bằng Google Docs Viewer; xem Office file bằng Microsoft Office Online Viewer

**`features/course-progress/`**:
- `CourseProgressBar` — thanh tiến độ % hoàn thành
- `useCourseProgress` — query progress từ API

#### 4. Pages — Màn hình

| Màn hình | URL | Mô tả |
|----------|-----|-------|
| Trang chủ | `/` | Banner giới thiệu, danh sách khóa nổi bật, nút kêu gọi hành động |
| Tất cả khóa học | `/courses` | Grid khóa học với tìm kiếm, phân trang, badge "Đã đăng ký" |
| Chi tiết khóa | `/courses/:slug` | Ảnh thumbnail, mô tả đầy đủ, outline bài học, nút Đăng ký |
| Hướng dẫn thanh toán | `/courses/:slug/payment` | Thông tin ngân hàng, form upload biên lai |
| Khóa của tôi | `/my-courses` | Danh sách khóa APPROVED + % tiến độ + nút "Vào học" |
| Yêu cầu đăng ký | `/my-enrollments` | Danh sách PENDING/APPROVED/REJECTED + lý do từ chối |
| Trang học | `/learn/:slug/:lessonId` | Video player hoặc text reader + sidebar danh sách bài |
| Thông tin cá nhân | `/profile` | Sửa tên, SĐT, avatar; đổi mật khẩu |
| Đăng nhập | `/login` | Form email + password |
| Đăng ký | `/register` | Form đăng ký đầy đủ |

#### 5. Điểm đặc biệt của Trang học (`/learn`)

Đây là màn hình phức tạp nhất:
- **Sidebar trái**: danh sách bài học, click để chuyển bài, icon loại bài (video 🎬 / text 📄), icon ✅ cho bài đã hoàn thành
- **Khu vực chính**: 
  - Video từ server: `<video>` tag với `src=/uploads/...`, track sự kiện `timeupdate` mỗi 5 giây → gọi API video-progress
  - Video YouTube/Vimeo: `<iframe>` embed, dùng YouTube Player API để track % đã xem
  - Bài TEXT: render HTML, hiển thị file đính kèm bên dưới
- **Tự động đánh dấu hoàn thành** theo `COMPLETION_MODE` lấy từ API

### Kết quả bàn giao
- File **`Phase05.md`**: Tất cả màn hình đã build, kiến trúc FSD đã áp dụng, cách chạy frontend.

---

## Phase 6 — Admin Panel: Giao diện Quản trị

### Mục tiêu
Xây dựng toàn bộ giao diện Admin/Teacher với 14 màn hình, tập trung vào quản lý nội dung, duyệt học viên và xem báo cáo.

### Công việc cụ thể

#### 1. Khung Admin (Layout)

**Sidebar cố định** với menu điều hướng:
- Dashboard, Khóa học (CRUD), Đăng ký (duyệt), Người dùng, Báo cáo, Cài đặt

**Role-based access:**
- TEACHER thấy: Dashboard, Khóa học của mình, Báo cáo khóa của mình
- ADMIN thấy: Tất cả menu

#### 2. Dashboard (`/`)

Hiển thị 4 cards thống kê nhanh:
- Tổng khóa học đang PUBLISHED
- Tổng học viên
- Số enrollment chờ duyệt (PENDING) — có badge đỏ nếu > 0
- % hoàn thành trung bình toàn hệ thống

Bảng "Top khóa học" với số lượng học viên.

#### 3. Quản lý Khóa học

**Danh sách khóa** (`/courses`):
- Bảng với cột: Tên, Giá, Trạng thái, Số học viên, Ngày tạo, Hành động
- Filter theo trạng thái (DRAFT/PUBLISHED/ARCHIVED)
- Nút tạo mới, sửa, xóa

**Tạo/Sửa khóa** (`/courses/new`, `/courses/:id/edit`):
- Form: Tiêu đề, Mô tả ngắn, Mô tả đầy đủ (text area), Giá, Upload thumbnail, Trạng thái
- Slug được tự động sinh bởi backend, chỉ hiển thị (readonly) sau khi tạo

**Curriculum (Nội dung khóa)** (`/courses/:id/curriculum`):
- Danh sách bài học có thể **kéo thả** để sắp xếp lại (dùng @dnd-kit)
- Mỗi bài hiển thị: icon loại (Video/Text), tên, nút sửa, nút xóa
- Nút "+ Thêm bài học"

**Tạo/Sửa bài học** (`/courses/:id/lessons/new`):
- Chọn loại: VIDEO hoặc TEXT
- **Nếu VIDEO:**
  - Chọn nguồn: Upload file hoặc Dán link (YouTube/Vimeo/Drive)
  - Upload file: hiển thị progress bar % upload, validate định dạng và kích thước
  - Link: nhập URL, backend tự xác định loại nguồn
- **Nếu TEXT:**
  - Rich text editor (TipTap): bold, italic, heading, list, image, code block
- Thêm file đính kèm: upload nhiều file PDF/DOCX/XLSX...

#### 4. Quản lý Enrollment (`/enrollments`)

Màn hình quan trọng để Admin duyệt thanh toán:
- Bảng với filter: Status (PENDING/APPROVED/REJECTED), Khóa học, Học viên
- Mỗi row: thông tin học viên, tên khóa, ngày yêu cầu, trạng thái, ảnh biên lai (click để phóng to)
- Nút **APPROVED** (xanh lá) → Duyệt ngay, học viên vào học được
- Nút **REJECTED** (đỏ) → Popup nhập lý do từ chối → Gửi

#### 5. Quản lý Người dùng (`/users`)

- Bảng user: tên, email, role, status, ngày tạo; phân trang, tìm kiếm
- Tạo tài khoản Teacher: form với họ tên, email, mật khẩu, role=TEACHER
- Sửa user: Admin có thể đổi role và block/unblock tài khoản

#### 6. Báo cáo

**Tổng quan** (`/reports`):
- Cards: tổng khóa, tổng học viên, enrollment tháng này, tỉ lệ hoàn thành TB
- Biểu đồ cột (Recharts): enrollment theo 6 tháng gần nhất
- Bảng top khóa học

**Chi tiết khóa** (`/reports/courses/:id`):
- Bảng từng bài học: số học viên đã xem, tỉ lệ hoàn thành (%)
- Biểu đồ đường: enrollment theo tháng

#### 7. Cài đặt hệ thống (`/settings`)

Hai tab:
- **Cài đặt chung**: chọn COMPLETION_MODE (radio button), giới hạn dung lượng upload
- **Thông tin ngân hàng**: form nhập đầy đủ thông tin TK ngân hàng + upload ảnh QR code

### Kết quả bàn giao
- File **`Phase06.md`**: Tất cả 14 màn màn Admin đã build, hướng dẫn sử dụng các tính năng phức tạp (rich text, drag-drop, video upload progress).

---

## Phase 7 — Tích hợp, Docker và Kiểm tra End-to-End

### Mục tiêu
Đảm bảo toàn bộ hệ thống chạy ổn định cùng nhau trong Docker Compose, kiểm tra tất cả luồng nghiệp vụ quan trọng từ đầu đến cuối.

### Công việc cụ thể

#### 1. Hoàn thiện Docker Compose

Bổ sung **Nginx** làm reverse proxy để toàn bộ hệ thống chạy qua 1 cổng (80):

```
http://localhost/          → Frontend (Student Web)
http://localhost/admin/    → Admin Panel
http://localhost/api/      → Backend API
http://localhost/uploads/  → File tĩnh (video, ảnh, tài liệu)
```

Cấu hình volume để dữ liệu không mất khi restart:
- PostgreSQL data: `postgres_data` volume
- Uploads: mount thư mục `./uploads` trên máy host vào container

#### 2. Build production

- Backend: `mvn clean package -DskipTests` → JAR file
- Frontend: `vite build` → thư mục `dist/`
- Admin: `vite build` → thư mục `dist/`
- Nginx serve static files từ `dist/` và proxy `/api/` đến backend

#### 3. Kiểm tra End-to-End (8 luồng chính)

**Flow 1 — Student đăng ký và học:**
```
Đăng ký tài khoản → Đăng nhập → Xem catalog → Bấm đăng ký khóa
→ Xem hướng dẫn thanh toán → Upload biên lai → Chờ duyệt
→ Admin duyệt → Vào học → Xem video → Progress tăng dần
```

**Flow 2 — Teacher tạo khóa học:**
```
Đăng nhập Admin → Tạo khóa (DRAFT) → Thêm bài học VIDEO (upload file)
→ Thêm bài học TEXT (rich text) → Upload PDF đính kèm
→ Sắp xếp lại thứ tự bài → Publish khóa → Kiểm tra hiện trên catalog
```

**Flow 3 — Admin duyệt thanh toán:**
```
Vào trang Enrollment → Filter PENDING → Xem biên lai
→ Duyệt APPROVED → Kiểm tra student vào học được
```

**Flow 4 — Token refresh tự động:**
```
Đăng nhập → Chờ access_token hết hạn (15 phút)
→ Gọi API bất kỳ → Tự động refresh token
→ Request gốc thành công (không cần đăng nhập lại)
```

**Flow 5 — Kiểm tra phân quyền:**
```
Student cố gọi /api/admin/users → nhận 403 Forbidden
Teacher cố sửa khóa của người khác → nhận 403 Forbidden
Request không có token → nhận 401 Unauthorized
```

**Flow 6 — Upload và xem file:**
```
Teacher upload video .mp4 (100MB) → hiển thị progress bar
→ Lưu thành công → Student vào học → Video phát được, seek được
→ Teacher upload PDF → Student xem inline trong trang học
```

**Flow 7 — COMPLETION_MODE:**
```
Admin đổi sang VIDEO_50 → Student mở bài video
→ % tiến độ không tăng → Xem đến 50% → % tự động tăng
Admin đổi sang OPEN → Student mở bài → % tăng ngay
```

**Flow 8 — Báo cáo:**
```
Admin xem Dashboard → số liệu chính xác
→ Xem báo cáo khóa → từng bài học hiển thị đúng tỉ lệ hoàn thành
```

#### 4. Kiểm tra Performance cơ bản
- API list/detail phải trả về trong < 500ms
- Upload video 100MB: hiển thị progress bar, không timeout
- Xem danh sách 100+ khóa học: phân trang hoạt động đúng

#### 5. Ghi lại Known Issues và Hướng dẫn vận hành
- Liệt kê các vấn đề đã biết (nếu có) và cách workaround
- Hướng dẫn backup database
- Hướng dẫn thêm dung lượng ổ cứng cho thư mục uploads

### Kết quả bàn giao
- File **`Phase07.md`**: Tổng kết toàn dự án, kết quả kiểm tra tất cả flows, hướng dẫn vận hành và bảo trì.

---

## Tổng kết

| Phase | Tên | Kết quả chính |
|-------|-----|---------------|
| 0 | Thiết lập dự án | 3 project khởi động được, Docker Compose chạy được |
| 1 | Backend: DB & Security | 11 bảng DB, JWT filter hoạt động |
| 2 | Backend: Auth & Users | 15 endpoint auth + user management |
| 3 | Backend: Course, Lesson & Files | Upload/serve file local, CRUD khóa học + bài học |
| 4 | Backend: Enrollment & Progress | Luồng đăng ký hoàn chỉnh, theo dõi tiến độ, báo cáo |
| 5 | Frontend Student | 10 màn hình học viên hoàn thiện |
| 6 | Admin Panel | 14 màn hình quản trị hoàn thiện |
| 7 | Tích hợp & Kiểm tra | Hệ thống chạy end-to-end trong Docker |

> **Lưu ý:** Sau mỗi Phase, một file `Phase0X.md` sẽ được tạo để ghi lại chi tiết những gì đã làm, lệnh chạy, và kết quả kiểm tra. Đây là tài liệu tham khảo khi cần debug hoặc onboard thành viên mới.
