# LMS Platform — Entity Relationship Diagram (ERD)
**Version:** 1.0 — MVP  
**Ngày:** 13/04/2026  

---

## 1. Danh sách Entities

| Entity | Bảng DB | Mô tả |
|--------|---------|-------|
| User | `users` | Tất cả người dùng hệ thống |
| RefreshToken | `refresh_tokens` | Refresh token lưu DB (revocable) |
| Course | `courses` | Khóa học |
| Lesson | `lessons` | Bài học trong khóa |
| LessonAttachment | `lesson_attachments` | File đính kèm của bài học |
| Enrollment | `enrollments` | Đăng ký khóa học của học viên |
| PaymentProof | `payment_proofs` | Biên lai chuyển khoản (đính kèm enrollment) |
| LessonProgress | `lesson_progress` | Tiến độ học từng bài của từng học viên |
| SystemConfig | `system_configs` | Cấu hình hệ thống (key-value) |
| BankInfo | `bank_info` | Thông tin tài khoản ngân hàng nhận CK |

---

## 2. Chi tiết từng Entity

### 2.1 `users`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK, NOT NULL | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| `full_name` | VARCHAR(255) | NOT NULL | Họ và tên |
| `avatar_url` | TEXT | NULL | URL ảnh đại diện |
| `phone` | VARCHAR(20) | NULL | Số điện thoại |
| `role` | ENUM | NOT NULL, DEFAULT 'STUDENT' | `STUDENT` \| `TEACHER` \| `ADMIN` |
| `status` | ENUM | NOT NULL, DEFAULT 'ACTIVE' | `ACTIVE` \| `BLOCKED` |
| `reset_token` | VARCHAR(255) | NULL | Token reset mật khẩu |
| `reset_token_expires_at` | TIMESTAMP | NULL | Hạn token reset |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Lần cập nhật cuối |

**Index:** `email` (UNIQUE)

---

### 2.2 `refresh_tokens`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK, NOT NULL | Primary key |
| `user_id` | FK → users.id | NOT NULL | Chủ sở hữu token |
| `token_hash` | VARCHAR(64) | UNIQUE, NOT NULL | SHA-256 hash của refresh token (không lưu plaintext) |
| `expires_at` | TIMESTAMP | NOT NULL | Thời điểm hết hạn (30 ngày từ lúc tạo) |
| `revoked_at` | TIMESTAMP | NULL | Thời điểm bị revoke (NULL = còn valid) |
| `user_agent` | VARCHAR(500) | NULL | Trình duyệt / thiết bị (để hiển thị session management) |
| `ip_address` | VARCHAR(45) | NULL | IP tạo token (IPv4/IPv6) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Index:** `token_hash` (UNIQUE), `user_id`, `expires_at`

> **Quy tắc vận hành:**
> - Mỗi lần `POST /auth/refresh` → revoke token cũ (`revoked_at = NOW()`), tạo token mới.
> - Nếu token đã bị revoke bị dùng lại → đây là dấu hiệu bị đánh cắp → revoke **tất cả** token của user đó.
> - Job định kỳ (cron mỗi ngày) xóa các record `expires_at < NOW() AND revoked_at IS NOT NULL`.

---

### 2.3 `courses`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK, NOT NULL | Primary key |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề khóa học |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly name (VD: `lap-trinh-python-co-ban`) |
| `description` | TEXT | NULL | Mô tả chi tiết (HTML/Markdown) |
| `short_description` | VARCHAR(500) | NULL | Mô tả ngắn (hiển thị card) |
| `thumbnail_url` | TEXT | NULL | Ảnh thumbnail khóa học |
| `price` | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Giá khóa (VND). 0 = miễn phí |
| `status` | ENUM | NOT NULL, DEFAULT 'DRAFT' | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| `teacher_id` | FK → users.id | NOT NULL | Giảng viên phụ trách |
| `created_by` | FK → users.id | NOT NULL | Người tạo (Admin hoặc Teacher) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `published_at` | TIMESTAMP | NULL | Thời điểm publish lần đầu |
| `deleted_at` | TIMESTAMP | NULL | **Soft delete** — NULL = chưa xóa |

**Index:** `slug` (UNIQUE), `status`, `teacher_id`, `deleted_at`

> **Slug rule:** Backend tự auto-generate slug từ `title` (lowercase, bỏ dấu tiếng Việt, thay khoảng trắng = `-`). Nếu slug trùng, thêm suffix số (`-2`, `-3`…). Client **không** cần gửi slug trong request.

> **Soft delete rule:** Courses bị xóa (`deleted_at IS NOT NULL`) ẩn khỏi catalog và không cho đăng ký mới. Dữ liệu enrollment/progress cũ vẫn giữ lại.

---

### 2.4 `lessons`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK, NOT NULL | |
| `course_id` | FK → courses.id | NOT NULL | Thuộc khóa nào |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề bài học |
| `description` | TEXT | NULL | Mô tả ngắn bài học |
| `order_index` | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị trong khóa |
| `type` | ENUM | NOT NULL | `VIDEO` \| `TEXT` |
| `status` | ENUM | NOT NULL, DEFAULT 'PUBLISHED' | `DRAFT` \| `PUBLISHED` |
| `text_content` | LONGTEXT | NULL | Nội dung rich text (nếu type=TEXT) |
| `video_source_type` | ENUM | NULL | `UPLOAD` \| `YOUTUBE` \| `VIMEO` \| `DRIVE` (nếu type=VIDEO) |
| `video_url` | TEXT | NULL | URL file video (nếu UPLOAD) hoặc embed URL (nếu link) |
| `video_file_key` | VARCHAR(500) | NULL | Storage key (S3 key) nếu UPLOAD |
| `video_duration_seconds` | INT | NULL | Thời lượng video (giây), dùng tính tiến độ |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `deleted_at` | TIMESTAMP | NULL | **Soft delete** — NULL = chưa xóa |

**Index:** `course_id`, `(course_id, order_index)`, `deleted_at`

> **Soft delete rule:** Lesson bị xóa (`deleted_at IS NOT NULL`) sẽ không tính vào tổng lesson khi tính % tiến độ. Các `lesson_progress` record liên quan được giữ nguyên để lịch sử.

---

### 2.5 `lesson_attachments`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK | |
| `lesson_id` | FK → lessons.id | NOT NULL | Bài học đính kèm |
| `file_name` | VARCHAR(255) | NOT NULL | Tên file gốc (VD: `bai-tap.docx`) |
| `file_key` | VARCHAR(500) | NOT NULL | Key lưu trên S3 |
| `file_url` | TEXT | NOT NULL | URL truy cập file |
| `file_type` | VARCHAR(100) | NOT NULL | MIME type (VD: `application/pdf`) |
| `file_size_bytes` | BIGINT | NOT NULL | Kích thước file (bytes) |
| `order_index` | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Index:** `lesson_id`

---

### 2.6 `enrollments`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK | |
| `student_id` | FK → users.id | NOT NULL | Học viên đăng ký |
| `course_id` | FK → courses.id | NOT NULL | Khóa học đăng ký |
| `status` | ENUM | NOT NULL, DEFAULT 'PENDING' | `PENDING` \| `APPROVED` \| `REJECTED` |
| `note` | TEXT | NULL | Ghi chú từ Admin khi Approve/Reject |
| `reviewed_by` | FK → users.id | NULL | Admin đã duyệt |
| `reviewed_at` | TIMESTAMP | NULL | Thời điểm duyệt |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Unique Constraint:** `(student_id, course_id)` WHERE `status IN ('PENDING','APPROVED')`  
> Một học viên không có 2 enrollment đang active cho cùng 1 khóa

**Index:** `student_id`, `course_id`, `status`

---

### 2.7 `payment_proofs`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK | |
| `enrollment_id` | FK → enrollments.id | NOT NULL, UNIQUE | 1 enrollment có 1 payment proof |
| `image_url` | TEXT | NULL | URL ảnh biên lai chuyển khoản |
| `image_key` | VARCHAR(500) | NULL | S3 key ảnh biên lai |
| `note` | TEXT | NULL | Ghi chú từ học viên (VD: "Đã CK lúc 10h") |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Index:** `enrollment_id`

---

### 2.8 `lesson_progress`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID / BIGINT | PK | |
| `student_id` | FK → users.id | NOT NULL | Học viên |
| `lesson_id` | FK → lessons.id | NOT NULL | Bài học |
| `course_id` | FK → courses.id | NOT NULL | Khóa học (denormalized để query nhanh) |
| `status` | ENUM | NOT NULL, DEFAULT 'NOT_STARTED' | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` |
| `video_watched_seconds` | INT | NOT NULL, DEFAULT 0 | Số giây đã xem (video) |
| `video_max_watched_percent` | FLOAT | NOT NULL, DEFAULT 0 | % xem tối đa đã đạt được (0–100) |
| `completed_at` | TIMESTAMP | NULL | Thời điểm hoàn thành |
| `last_accessed_at` | TIMESTAMP | NULL | Lần xem cuối |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Unique Constraint:** `(student_id, lesson_id)`  
**Index:** `(student_id, course_id)`, `(lesson_id)`, `status`

---

### 2.9 `system_configs`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, AUTO_INCREMENT | |
| `key` | VARCHAR(100) | UNIQUE, NOT NULL | Tên config |
| `value` | TEXT | NOT NULL | Giá trị (string/JSON) |
| `description` | VARCHAR(500) | NULL | Mô tả cho Admin |
| `updated_by` | FK → users.id | NULL | Admin đã sửa cuối |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

**Các key mặc định:**
| Key | Giá trị mặc định | Mô tả |
|-----|-----------------|-------|
| `COMPLETION_MODE` | `"OPEN"` | `"OPEN"` hoặc `"VIDEO_50"` |
| `MAX_VIDEO_SIZE_MB` | `"2048"` | Giới hạn upload video (MB) |
| `MAX_DOCUMENT_SIZE_MB` | `"50"` | Giới hạn upload tài liệu (MB) |
| `ALLOWED_VIDEO_TYPES` | `"mp4,mov,webm,avi"` | Định dạng video |
| `ALLOWED_DOC_TYPES` | `"pdf,docx,xlsx,pptx,txt"` | Định dạng tài liệu |

---

### 2.10 `bank_info`
| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | INT | PK, DEFAULT 1 | Chỉ 1 bản ghi |
| `bank_name` | VARCHAR(255) | NOT NULL | Tên ngân hàng (VD: Vietcombank) |
| `account_number` | VARCHAR(50) | NOT NULL | Số tài khoản |
| `account_name` | VARCHAR(255) | NOT NULL | Tên chủ tài khoản |
| `branch` | VARCHAR(255) | NULL | Chi nhánh |
| `transfer_template` | TEXT | NULL | Mẫu nội dung CK (VD: "LMS [MaHV] [TenKhoa]") |
| `qr_image_url` | TEXT | NULL | Ảnh QR code chuyển khoản (optional) |
| `updated_by` | FK → users.id | NULL | |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | |

---

## 3. Sơ đồ quan hệ (Mô tả text)

```
users ||--o{ courses           : "teacher_id (1 Teacher dạy nhiều Course)"
users ||--o{ enrollments       : "student_id (1 Student có nhiều Enrollment)"
users ||--o{ lesson_progress   : "student_id (1 Student có nhiều Progress)"
users ||--o{ refresh_tokens    : "user_id (1 User có nhiều RefreshToken / session)"

courses ||--o{ lessons         : "course_id (1 Course có nhiều Lesson)"
courses ||--o{ enrollments     : "course_id (1 Course có nhiều Enrollment)"

lessons ||--o{ lesson_attachments : "lesson_id (1 Lesson có nhiều Attachment)"
lessons ||--o{ lesson_progress    : "lesson_id (1 Lesson có nhiều Progress record)"

enrollments ||--o| payment_proofs : "enrollment_id (1 Enrollment có 0 hoặc 1 PaymentProof)"
```

---

## 4. Diagram (Mermaid — dán vào dbdiagram.io hoặc Mermaid Live)

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        text avatar_url
        varchar phone
        enum role
        enum status
        timestamp created_at
        timestamp updated_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        varchar token_hash UK
        timestamp expires_at
        timestamp revoked_at
        varchar user_agent
        varchar ip_address
        timestamp created_at
    }

    courses {
        uuid id PK
        varchar title
        varchar slug UK
        text description
        text short_description
        text thumbnail_url
        decimal price
        enum status
        uuid teacher_id FK
        uuid created_by FK
        timestamp published_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    lessons {
        uuid id PK
        uuid course_id FK
        varchar title
        text description
        int order_index
        enum type
        enum status
        longtext text_content
        enum video_source_type
        text video_url
        varchar video_file_key
        int video_duration_seconds
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    lesson_attachments {
        uuid id PK
        uuid lesson_id FK
        varchar file_name
        varchar file_key
        text file_url
        varchar file_type
        bigint file_size_bytes
        int order_index
        timestamp created_at
    }

    enrollments {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        enum status
        text note
        uuid reviewed_by FK
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    payment_proofs {
        uuid id PK
        uuid enrollment_id FK
        text image_url
        varchar image_key
        text note
        timestamp created_at
        timestamp updated_at
    }

    lesson_progress {
        uuid id PK
        uuid student_id FK
        uuid lesson_id FK
        uuid course_id FK
        enum status
        int video_watched_seconds
        float video_max_watched_percent
        timestamp completed_at
        timestamp last_accessed_at
        timestamp created_at
        timestamp updated_at
    }

    system_configs {
        int id PK
        varchar key UK
        text value
        varchar description
        uuid updated_by FK
        timestamp updated_at
    }

    bank_info {
        int id PK
        varchar bank_name
        varchar account_number
        varchar account_name
        varchar branch
        text transfer_template
        text qr_image_url
        uuid updated_by FK
        timestamp updated_at
    }

    users ||--o{ courses : "teacher_id"
    users ||--o{ enrollments : "student_id"
    users ||--o{ lesson_progress : "student_id"
    users ||--o{ refresh_tokens : "user_id"
    courses ||--o{ lessons : "course_id"
    courses ||--o{ enrollments : "course_id"
    lessons ||--o{ lesson_attachments : "lesson_id"
    lessons ||--o{ lesson_progress : "lesson_id"
    enrollments ||--o| payment_proofs : "enrollment_id"
```

---

## 5. Ghi chú thiết kế DB

1. **UUID vs BIGINT** ✅ **Đã chốt — dùng BIGINT AUTO_INCREMENT**: Dự án là monolith, không cần distributed ID. Đơn giản hơn, index nhanh hơn.

2. **Soft delete** ✅ **Đã chốt**:
   - `courses` và `lessons`: dùng `deleted_at TIMESTAMP NULL` (soft delete).
   - `users`: **không dùng soft delete** — dùng `status = BLOCKED` để vô hiệu hóa tài khoản. Hard delete user chỉ qua DB admin.
   - `lesson_attachments`, `payment_proofs`, `enrollments`, `lesson_progress`: hard delete bình thường (không cần audit trail).
   - **Mọi query phải thêm `WHERE deleted_at IS NULL`** cho `courses` và `lessons`. Nên dùng ORM filter global (Spring: `@Where`, Hibernate filter).

3. **Denormalize `course_id` trong `lesson_progress`**: Để query "tất cả progress của student trong 1 khóa" nhanh hơn, tránh JOIN qua lessons.

4. **Unique partial index cho Enrollment**: Cần DBMS hỗ trợ partial/conditional unique index (PostgreSQL, MySQL 8+) hoặc xử lý ở application layer.

5. **Video duration**: Cần lưu `video_duration_seconds` để backend tính % xem mà không phụ thuộc client gửi.

6. **Mở rộng Quiz sau này**: Thêm bảng `quizzes (lesson_id FK)`, `questions (quiz_id FK)`, `quiz_submissions (student_id, quiz_id FK)` mà không cần thay đổi schema hiện tại.

7. **Refresh Token cleanup**: Cron job chạy mỗi ngày xóa record `refresh_tokens` có `expires_at < NOW()` hoặc `revoked_at IS NOT NULL` quá 7 ngày để giữ bảng nhỏ gọn.
