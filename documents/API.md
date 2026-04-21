# LMS Platform — API Specification
**Version:** 1.0 — MVP  
**Base URL:** `https://api.yourdomain.com/api/v1`  
**Ngày:** 13/04/2026  

---

## Quy ước chung

### Authentication
Tất cả endpoint có ký hiệu 🔒 yêu cầu:
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Response format chuẩn
```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }  // optional, cho list
}

// Error
{
  "success": false,
  "error": {
    "code": "ENROLLMENT_ALREADY_EXISTS",
    "message": "Bạn đã đăng ký khóa học này rồi.",
    "details": {}
  }
}
```

### HTTP Status Codes
| Code | Ý nghĩa |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (DELETE thành công) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (chưa đăng nhập) |
| 403 | Forbidden (không đủ quyền) |
| 404 | Not Found |
| 409 | Conflict (VD: email trùng) |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

### Phân quyền ký hiệu
- `PUBLIC` — không cần token
- `AUTH` — cần token, bất kỳ role
- `STUDENT` — role STUDENT
- `TEACHER` — role TEACHER hoặc ADMIN
- `ADMIN` — chỉ role ADMIN

---

## Module 1 — Authentication (`/auth`)

### POST `/auth/register`
Đăng ký tài khoản mới (role mặc định: STUDENT).  
**Auth:** `PUBLIC`

**Request Body:**
```json
{
  "email": "hocvien@example.com",
  "password": "matkhau123",
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "user": {
      "id": "uuid-123",
      "email": "hocvien@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "STUDENT"
    }
  }
}
```

**Errors:** `409 EMAIL_ALREADY_EXISTS`, `400 VALIDATION_ERROR`

---

### POST `/auth/login`
Đăng nhập.  
**Auth:** `PUBLIC`

**Request Body:**
```json
{
  "email": "hocvien@example.com",
  "password": "matkhau123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "user": {
      "id": "uuid-123",
      "email": "hocvien@example.com",
      "full_name": "Nguyễn Văn A",
      "role": "STUDENT",
      "avatar_url": null
    }
  }
}
```

**Errors:** `401 INVALID_CREDENTIALS`, `401 ACCOUNT_BLOCKED`

---

### POST `/auth/logout`
Đăng xuất (invalidate token phía server nếu dùng token blacklist).  
**Auth:** 🔒 `AUTH`

**Response 204:** (no body)

---

### POST `/auth/forgot-password`
Gửi email chứa link reset mật khẩu.  
**Auth:** `PUBLIC`

**Request Body:**
```json
{ "email": "hocvien@example.com" }
```

**Response 200:**
```json
{ "success": true, "data": { "message": "Email đặt lại mật khẩu đã được gửi." } }
```

> Luôn trả 200 dù email không tồn tại (tránh enumerate).

---

### POST `/auth/reset-password`
Đặt lại mật khẩu bằng token từ email.  
**Auth:** `PUBLIC`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "matkhaumoi456"
}
```

**Response 200:** `{ "success": true }`  
**Errors:** `400 INVALID_OR_EXPIRED_TOKEN`

---

### GET `/auth/me`
Lấy thông tin user đang đăng nhập.  
**Auth:** 🔒 `AUTH`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "hocvien@example.com",
    "full_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "avatar_url": "https://cdn.../avatar.jpg",
    "role": "STUDENT",
    "status": "ACTIVE",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### PATCH `/auth/me`
Cập nhật thông tin cá nhân.  
**Auth:** 🔒 `AUTH`

**Request Body** (tất cả optional):
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0912345678",
  "avatar_url": "https://cdn.../new-avatar.jpg"
}
```

**Response 200:** trả về user đã cập nhật (cấu trúc như GET `/auth/me`)

---

### POST `/auth/change-password`
Đổi mật khẩu (khi đã đăng nhập).  
**Auth:** 🔒 `AUTH`

**Request Body:**
```json
{
  "current_password": "matkhaucu",
  "new_password": "matkhaumoi"
}
```

**Response 200:** `{ "success": true }`  
**Errors:** `400 WRONG_CURRENT_PASSWORD`

---

### POST `/auth/refresh`
Lấy access token mới bằng refresh token (không cần đăng nhập lại).  
**Auth:** `PUBLIC` (gửi refresh token trong body)

**Request Body:**
```json
{
  "refresh_token": "eyJhbGci...<refresh_token>"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...<new_access_token>",
    "refresh_token": "eyJhbGci...<new_refresh_token>"  // rotation: token mới mỗi lần refresh
  }
}
```

**Errors:** `401 INVALID_REFRESH_TOKEN`, `401 REFRESH_TOKEN_EXPIRED`, `401 REFRESH_TOKEN_REVOKED`

> **Chiến lược Refresh Token:**
> - Access token expire: **15 phút** (ngắn để bảo mật).
> - Refresh token expire: **30 ngày** (lưu DB, revocable).
> - Mỗi lần refresh → cấp cặp token mới (token rotation), token cũ bị revoke ngay.
> - Client lưu refresh token trong **HttpOnly cookie** (web) hoặc **SecureStorage** (mobile).
> - Khi nhận `401 UNAUTHORIZED` từ API → tự động gọi refresh → retry request gốc.

---

## Module 2 — Courses (`/courses`)

### GET `/courses`
Danh sách tất cả khóa học PUBLISHED.  
**Auth:** `PUBLIC`

**Query Params:**
| Param | Kiểu | Mô tả |
|-------|------|-------|
| `page` | int | Trang (default 1) |
| `limit` | int | Số item/trang (default 20) |
| `search` | string | Tìm theo title |
| `status` | string | Filter: `PUBLISHED` (default), `DRAFT`, `ARCHIVED` — chỉ TEACHER/ADMIN dùng được |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "course-uuid",
      "title": "Lập trình Python cơ bản",
      "slug": "lap-trinh-python-co-ban",
      "short_description": "Khóa học dành cho người mới bắt đầu",
      "thumbnail_url": "https://cdn.../thumb.jpg",
      "price": 500000,
      "status": "PUBLISHED",
      "teacher": {
        "id": "teacher-uuid",
        "full_name": "Trần Thị B",
        "avatar_url": "..."
      },
      "total_lessons": 12,
      "enrollment_status": "APPROVED"  // null nếu chưa đăng ký (chỉ có khi có token STUDENT)
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

---

### GET `/courses/:id`
Chi tiết khóa học.  
**Auth:** `PUBLIC`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "course-uuid",
    "title": "Lập trình Python cơ bản",
    "slug": "lap-trinh-python-co-ban",
    "description": "<p>Nội dung mô tả đầy đủ...</p>",
    "short_description": "...",
    "thumbnail_url": "...",
    "price": 500000,
    "status": "PUBLISHED",
    "teacher": { "id": "...", "full_name": "...", "avatar_url": "..." },
    "total_lessons": 12,
    "published_at": "2026-02-01T00:00:00Z",
    "lessons_preview": [
      { "id": "lesson-uuid", "title": "Bài 1: Giới thiệu", "type": "VIDEO", "order_index": 1 }
    ],
    "enrollment_status": null  // "PENDING" | "APPROVED" | "REJECTED" | null
  }
}
```

---

### POST `/courses`
Tạo khóa học mới.  
**Auth:** 🔒 `TEACHER`

**Request Body:**
```json
{
  "title": "Lập trình Python cơ bản",
  "description": "<p>Mô tả chi tiết...</p>",
  "short_description": "Khóa học Python cho người mới",
  "thumbnail_url": "https://cdn.../thumb.jpg",
  "price": 500000,
  "teacher_id": "teacher-uuid"  // chỉ ADMIN mới được set; TEACHER tự gán bản thân
}
```

> **Slug:** Backend tự động generate từ `title` (bỏ dấu, lowercase, khoảng trắng → `-`). Nếu trùng thì thêm `-2`, `-3`… Client không cần gửi slug.

**Response 201:** trả về course object đầy đủ (bao gồm `slug` đã generate)  
**Errors:** `400 VALIDATION_ERROR`

---

### PATCH `/courses/:id`
Cập nhật thông tin khóa học.  
**Auth:** 🔒 `TEACHER` (chỉ course của mình hoặc ADMIN bất kỳ)

**Request Body** (tất cả optional):
```json
{
  "title": "Lập trình Python nâng cao",
  "description": "...",
  "price": 700000,
  "thumbnail_url": "...",
  "status": "PUBLISHED"
}
```

**Response 200:** course đã cập nhật  
**Errors:** `403 FORBIDDEN`, `404 NOT_FOUND`

---

### DELETE `/courses/:id`
Xóa khóa học (chỉ khi DRAFT và chưa có enrollment).  
**Auth:** 🔒 `ADMIN`

**Response 204**  
**Errors:** `409 COURSE_HAS_ENROLLMENTS`, `400 COURSE_NOT_DRAFT`

---

### GET `/courses/:id/students`
Danh sách học viên đã APPROVED trong khóa.  
**Auth:** 🔒 `TEACHER`

**Query Params:** `page`, `limit`, `search` (tên/email)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "enrollment_id": "...",
      "student": { "id": "...", "full_name": "...", "email": "...", "avatar_url": "..." },
      "enrolled_at": "2026-02-15T00:00:00Z",
      "progress_percent": 75.0
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 30 }
}
```

---

## Module 3 — Lessons (`/courses/:courseId/lessons`)

### GET `/courses/:courseId/lessons`
Danh sách bài học trong khóa.  
**Auth:** `PUBLIC` (chỉ trả title/type cho public); 🔒 `AUTH` student phải có Enrollment APPROVED để xem full; TEACHER/ADMIN xem full

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lesson-uuid",
      "title": "Bài 1: Giới thiệu",
      "type": "VIDEO",
      "order_index": 1,
      "status": "PUBLISHED",
      "video_duration_seconds": 720,
      "has_attachments": true,
      "progress": {                        // null nếu chưa có enrollment/chưa auth
        "status": "COMPLETED",
        "video_max_watched_percent": 65.5,
        "completed_at": "2026-03-01T10:00:00Z"
      }
    }
  ]
}
```

---

### GET `/courses/:courseId/lessons/:lessonId`
Chi tiết bài học (bao gồm nội dung đầy đủ).  
**Auth:** 🔒 `AUTH` (Student cần Enrollment APPROVED, TEACHER cần là teacher của khóa)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "lesson-uuid",
    "course_id": "course-uuid",
    "title": "Bài 1: Giới thiệu Python",
    "description": "...",
    "type": "VIDEO",
    "order_index": 1,
    "status": "PUBLISHED",
    "video_source_type": "UPLOAD",
    "video_url": "https://cdn.s3.../video.mp4",  // signed URL nếu dùng S3
    "video_duration_seconds": 720,
    "text_content": null,
    "attachments": [
      {
        "id": "attach-uuid",
        "file_name": "bai-tap-python.pdf",
        "file_url": "https://cdn.s3.../file.pdf",
        "file_type": "application/pdf",
        "file_size_bytes": 204800,
        "order_index": 1
      }
    ],
    "progress": {
      "status": "IN_PROGRESS",
      "video_max_watched_percent": 30.0,
      "last_accessed_at": "2026-03-10T08:00:00Z"
    }
  }
}
```

---

### POST `/courses/:courseId/lessons`
Tạo bài học mới.  
**Auth:** 🔒 `TEACHER`

**Request Body:**
```json
{
  "title": "Bài 2: Biến và kiểu dữ liệu",
  "description": "Tìm hiểu về biến trong Python",
  "type": "VIDEO",
  "order_index": 2,
  "video_source_type": "UPLOAD",
  "video_url": "https://cdn.s3.../video-key",
  "video_file_key": "videos/course-uuid/lesson-uuid.mp4",
  "video_duration_seconds": 900
}
```

Hoặc với link:
```json
{
  "title": "Bài 3: Vòng lặp",
  "type": "VIDEO",
  "order_index": 3,
  "video_source_type": "YOUTUBE",
  "video_url": "https://www.youtube.com/embed/abc123"
}
```

Hoặc TEXT:
```json
{
  "title": "Bài 4: Tài liệu đọc thêm",
  "type": "TEXT",
  "order_index": 4,
  "text_content": "<h2>Giới thiệu</h2><p>Nội dung...</p>"
}
```

**Response 201:** lesson object đầy đủ

> **📋 Upload Video → Tạo Lesson: Flow 2 bước**
> 
> ```
> Bước 1 — Upload file video (nếu source = UPLOAD):
>   Teacher → POST /upload/video/presigned  → nhận { upload_url, file_key }
>   Teacher → PUT <upload_url> (upload file thẳng lên S3, không qua backend)
>
> Bước 2 — Tạo lesson với file_key vừa nhận:
>   Teacher → POST /courses/:courseId/lessons
>             body: { ..., video_source_type: "UPLOAD", video_file_key: "<file_key from bước 1>" }
>
> Nếu source = YOUTUBE / VIMEO / DRIVE:
>   Bỏ qua Bước 1, chỉ cần POST /courses/:courseId/lessons với video_url = embed URL.
> ```
> 
> Backend sẽ gọi S3 để lấy metadata (duration, size) từ `file_key` sau khi lesson được tạo.

---

### PATCH `/courses/:courseId/lessons/:lessonId`
Cập nhật bài học.  
**Auth:** 🔒 `TEACHER`

**Request Body:** các field cần update (partial)

**Response 200:** lesson đã cập nhật

---

### DELETE `/courses/:courseId/lessons/:lessonId`
Xóa bài học.  
**Auth:** 🔒 `TEACHER`

**Response 204**  
**Errors:** `409 LESSON_HAS_PROGRESS` (nếu đã có học viên xem bài này, cảnh báo confirm)

---

### PATCH `/courses/:courseId/lessons/reorder`
Sắp xếp lại thứ tự bài học.  
**Auth:** 🔒 `TEACHER`

**Request Body:**
```json
{
  "lesson_orders": [
    { "lesson_id": "uuid-1", "order_index": 1 },
    { "lesson_id": "uuid-2", "order_index": 2 },
    { "lesson_id": "uuid-3", "order_index": 3 }
  ]
}
```

**Response 200:** `{ "success": true }`

---

## Module 4 — Attachments (`/lessons/:lessonId/attachments`)

### GET `/lessons/:lessonId/attachments`
Danh sách attachment của bài học.  
**Auth:** 🔒 `AUTH` (Student enrolled, Teacher/Admin)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "attach-uuid",
      "file_name": "slides.pptx",
      "file_url": "https://cdn.s3.../slides.pptx",
      "file_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "file_size_bytes": 5242880,
      "order_index": 1
    }
  ]
}
```

---

### POST `/lessons/:lessonId/attachments`
Upload file đính kèm vào bài học.  
**Auth:** 🔒 `TEACHER`  
**Content-Type:** `multipart/form-data`

**Form fields:**
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `file` | File | File đính kèm (PDF, DOCX, XLSX, PPTX...) |
| `order_index` | int | Thứ tự hiển thị |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "attach-uuid",
    "file_name": "slides.pptx",
    "file_url": "https://cdn.s3.../slides.pptx",
    "file_type": "...",
    "file_size_bytes": 5242880
  }
}
```

**Errors:** `400 FILE_TOO_LARGE`, `400 UNSUPPORTED_FILE_TYPE`

---

### DELETE `/lessons/:lessonId/attachments/:attachmentId`
Xóa attachment.  
**Auth:** 🔒 `TEACHER`

**Response 204**

---

## Module 5 — Upload (`/upload`)

### POST `/upload/video`
Upload file video lên cloud storage. Trả về URL/key để điền vào lesson.  
**Auth:** 🔒 `TEACHER`  
**Content-Type:** `multipart/form-data`

**Form fields:**
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `file` | File | File video (mp4, mov, webm, avi) |
| `course_id` | string | ID khóa học (dùng để tổ chức storage) |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "file_key": "videos/course-uuid/1710000000-video.mp4",
    "file_url": "https://cdn.s3.amazonaws.com/...",
    "file_size_bytes": 104857600,
    "duration_seconds": 900
  }
}
```

**Errors:** `400 FILE_TOO_LARGE`, `400 UNSUPPORTED_FORMAT`

> **Note:** Với file lớn, cân nhắc dùng **Presigned URL** (S3 presigned PUT URL) thay vì upload qua backend:
> 1. Client gọi `POST /upload/video/presigned` → nhận presigned URL
> 2. Client upload thẳng lên S3 với presigned URL (không qua server)
> 3. Client gọi `POST /upload/video/confirm` với `file_key` để confirm hoàn thành

### POST `/upload/video/presigned` *(Khuyến nghị cho production)*
Tạo presigned upload URL cho video.  
**Auth:** 🔒 `TEACHER`

**Request Body:**
```json
{
  "file_name": "video-bai-hoc.mp4",
  "file_size_bytes": 104857600,
  "course_id": "course-uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://s3.amazonaws.com/bucket/...?X-Amz-Signature=...",
    "file_key": "videos/course-uuid/1710000000-video.mp4",
    "expires_in_seconds": 3600
  }
}
```

---

### POST `/upload/image`
Upload ảnh (thumbnail, avatar, biên lai).  
**Auth:** 🔒 `AUTH`  
**Content-Type:** `multipart/form-data`

**Form fields:** `file` (jpg, png, webp, max 5MB), `type` (`avatar` | `thumbnail` | `receipt`)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "file_url": "https://cdn.s3.../images/filename.jpg",
    "file_key": "images/filename.jpg"
  }
}
```

---

## Module 6 — Enrollments (`/enrollments`)

### GET `/enrollments`
Danh sách enrollment.  
- Student: chỉ xem của mình  
- Admin: xem tất cả  
**Auth:** 🔒 `AUTH`

**Query Params (Admin):**
| Param | Kiểu | Mô tả |
|-------|------|-------|
| `status` | string | Filter: `PENDING`, `APPROVED`, `REJECTED` |
| `course_id` | string | Filter theo khóa |
| `student_id` | string | Filter theo học viên |
| `page` | int | |
| `limit` | int | |

**Response 200 (Admin xem tất cả):**
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-uuid",
      "status": "PENDING",
      "created_at": "2026-04-01T09:00:00Z",
      "student": { "id": "...", "full_name": "...", "email": "..." },
      "course": { "id": "...", "title": "...", "price": 500000 },
      "payment_proof": {
        "image_url": "https://cdn.../receipt.jpg",
        "note": "Đã CK lúc 9h"
      },
      "reviewed_at": null,
      "note": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 15 }
}
```

**Response 200 (Student tự xem — "Khóa của tôi"):**
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-uuid",
      "status": "APPROVED",
      "created_at": "2026-04-01T09:00:00Z",
      "reviewed_at": "2026-04-02T10:00:00Z",
      "note": null,
      "course": {
        "id": "course-uuid",
        "title": "Lập trình Python cơ bản",
        "slug": "lap-trinh-python-co-ban",
        "thumbnail_url": "https://cdn.../thumb.jpg",
        "price": 500000,
        "teacher": { "full_name": "Trần Thị B" },
        "total_lessons": 12
      },
      "progress": {
        "completed_lessons": 9,
        "total_lessons": 12,
        "progress_percent": 75.0,
        "last_activity_at": "2026-04-13T10:00:00Z"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

> **Note:** Backend tự detect role để trả response phù hợp. Student không truyền filter, chỉ nhận kết quả của chính mình kèm `progress`. Admin có thể truyền đầy đủ query params để filter.

---

### POST `/enrollments`
Học viên tạo yêu cầu đăng ký khóa học.  
**Auth:** 🔒 `STUDENT`

**Request Body:**
```json
{
  "course_id": "course-uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "enrollment-uuid",
    "status": "PENDING",
    "course_id": "course-uuid",
    "bank_info": {
      "bank_name": "Vietcombank",
      "account_number": "1234567890",
      "account_name": "NGUYEN VAN A",
      "transfer_template": "LMS HV001 Python"
    }
  }
}
```

**Errors:** `409 ALREADY_ENROLLED`, `404 COURSE_NOT_FOUND`, `400 COURSE_NOT_PUBLISHED`

---

### GET `/enrollments/:id`
Chi tiết 1 enrollment.  
**Auth:** 🔒 `AUTH` (Student chỉ xem của mình, Admin xem tất cả)

**Response 200:** enrollment object đầy đủ (xem GET /enrollments)

---

### POST `/enrollments/:id/payment-proof`
Student upload/cập nhật biên lai chuyển khoản.  
**Auth:** 🔒 `STUDENT`

**Request Body:**
```json
{
  "image_url": "https://cdn.s3.../receipt.jpg",
  "image_key": "images/receipt-uuid.jpg",
  "note": "Em đã chuyển khoản lúc 10h sáng ngày 13/04"
}
```

**Response 200:** payment_proof object  
**Errors:** `403 FORBIDDEN` (không phải enrollment của mình), `400 ENROLLMENT_NOT_PENDING`

---

### PATCH `/enrollments/:id/approve`
Admin duyệt enrollment.  
**Auth:** 🔒 `ADMIN`

**Request Body:**
```json
{
  "note": "Đã kiểm tra biên lai, xác nhận."  // optional
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "enrollment-uuid",
    "status": "APPROVED",
    "reviewed_at": "2026-04-13T11:00:00Z",
    "reviewed_by": "admin-uuid"
  }
}
```

---

### PATCH `/enrollments/:id/reject`
Admin từ chối enrollment.  
**Auth:** 🔒 `ADMIN`

**Request Body:**
```json
{
  "note": "Không tìm thấy giao dịch, vui lòng upload lại biên lai."
}
```

**Response 200:** enrollment với status REJECTED

---

## Module 7 — Progress (`/progress`)

### GET `/progress/courses/:courseId`
Tiến độ học của học viên trong 1 khóa.  
**Auth:** 🔒 `STUDENT`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "course_id": "course-uuid",
    "total_lessons": 12,
    "completed_lessons": 9,
    "progress_percent": 75.0,
    "lessons": [
      {
        "lesson_id": "lesson-uuid",
        "status": "COMPLETED",
        "video_max_watched_percent": 100,
        "completed_at": "2026-03-10T10:00:00Z",
        "last_accessed_at": "2026-03-10T10:00:00Z"
      }
    ]
  }
}
```

---

### POST `/progress/lessons/:lessonId/open`
Đánh dấu học viên đã mở bài học (dùng cho `COMPLETION_MODE = OPEN`).  
**Auth:** 🔒 `STUDENT`

**Request Body:** (empty `{}`)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "lesson_id": "lesson-uuid",
    "status": "COMPLETED",
    "completed_at": "2026-04-13T10:00:00Z"
  }
}
```

> Backend kiểm tra `COMPLETION_MODE`. Nếu là `OPEN`: set status = COMPLETED ngay.  
> Nếu là `VIDEO_50`: chỉ set status = IN_PROGRESS (chưa completed, cần video progress).

---

### POST `/progress/lessons/:lessonId/video-progress`
Cập nhật tiến độ xem video (gọi định kỳ từ video player, mỗi ~5 giây hoặc khi pause/end).  
**Auth:** 🔒 `STUDENT`

**Request Body:**
```json
{
  "current_time_seconds": 450,
  "duration_seconds": 900,
  "percent_watched": 50.0
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "lesson_id": "lesson-uuid",
    "status": "COMPLETED",           // "IN_PROGRESS" hoặc "COMPLETED"
    "video_max_watched_percent": 50.0,
    "just_completed": true           // true nếu vừa mới đạt milestone
  }
}
```

> Backend logic: nếu `COMPLETION_MODE = VIDEO_50` và `percent_watched >= 50` → set `COMPLETED`.

---

## Module 8 — Users / Admin (`/admin/users`)

### GET `/admin/users`
Danh sách tất cả user.  
**Auth:** 🔒 `ADMIN`

**Query Params:** `page`, `limit`, `search` (tên/email), `role`, `status`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "...",
      "full_name": "...",
      "role": "STUDENT",
      "status": "ACTIVE",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 200 }
}
```

---

### GET `/admin/users/:id`
Chi tiết 1 user.  
**Auth:** 🔒 `ADMIN`

**Response 200:** user object + danh sách enrollment gần đây

---

### POST `/admin/users`
Tạo user mới (Admin tạo Teacher).  
**Auth:** 🔒 `ADMIN`

**Request Body:**
```json
{
  "email": "teacher@example.com",
  "password": "matkhau123",
  "full_name": "Trần Thị B",
  "phone": "0987654321",
  "role": "TEACHER"
}
```

**Response 201:** user object  
**Errors:** `409 EMAIL_ALREADY_EXISTS`

---

### PATCH `/admin/users/:id`
Cập nhật thông tin user.  
**Auth:** 🔒 `ADMIN`

**Request Body** (partial):
```json
{
  "full_name": "...",
  "role": "TEACHER",
  "status": "BLOCKED"
}
```

**Response 200:** user đã cập nhật

---

### DELETE `/admin/users/:id`
Xóa user (soft delete).  
**Auth:** 🔒 `ADMIN`

**Response 204**  
**Errors:** `400 CANNOT_DELETE_SELF`, `409 USER_HAS_ACTIVE_COURSES`

---

## Module 9 — Reports (`/admin/reports`)

### GET `/admin/reports/overview`
Dashboard tổng quan.  
**Auth:** 🔒 `ADMIN`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_courses_published": 8,
    "total_students": 150,
    "total_enrollments_approved": 200,
    "enrollments_approved_this_month": 35,
    "pending_enrollments": 5,
    "avg_completion_percent": 62.5,
    "top_courses": [
      {
        "course_id": "...",
        "title": "Python cơ bản",
        "enrolled_count": 80,
        "avg_completion_percent": 70.0
      }
    ]
  }
}
```

---

### GET `/admin/reports/courses/:courseId`
Báo cáo chi tiết theo khóa học.  
**Auth:** 🔒 `TEACHER`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "course_id": "...",
    "title": "Python cơ bản",
    "total_enrolled": 80,
    "total_completed_all_lessons": 20,
    "avg_completion_percent": 70.0,
    "lessons_stats": [
      {
        "lesson_id": "...",
        "title": "Bài 1: Giới thiệu",
        "order_index": 1,
        "completed_count": 75,
        "completion_rate_percent": 93.75
      }
    ],
    "enrollment_by_month": [
      { "month": "2026-02", "count": 30 },
      { "month": "2026-03", "count": 50 }
    ]
  }
}
```

---

### GET `/admin/reports/students/:studentId`
Báo cáo tiến độ của 1 học viên.  
**Auth:** 🔒 `ADMIN`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "student": { "id": "...", "full_name": "...", "email": "..." },
    "courses": [
      {
        "course_id": "...",
        "title": "Python cơ bản",
        "enrollment_status": "APPROVED",
        "progress_percent": 75.0,
        "enrolled_at": "2026-02-01T00:00:00Z",
        "last_activity_at": "2026-04-10T15:00:00Z"
      }
    ]
  }
}
```

---

## Module 10 — System Config (`/admin/config`)

### GET `/admin/config`
Lấy tất cả cấu hình hệ thống.  
**Auth:** 🔒 `ADMIN`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "COMPLETION_MODE": "OPEN",
    "MAX_VIDEO_SIZE_MB": "2048",
    "MAX_DOCUMENT_SIZE_MB": "50",
    "ALLOWED_VIDEO_TYPES": "mp4,mov,webm,avi",
    "ALLOWED_DOC_TYPES": "pdf,docx,xlsx,pptx,txt"
  }
}
```

---

### PATCH `/admin/config`
Cập nhật cấu hình.  
**Auth:** 🔒 `ADMIN`

**Request Body:**
```json
{
  "COMPLETION_MODE": "VIDEO_50",
  "MAX_VIDEO_SIZE_MB": "1024"
}
```

**Response 200:** config đã cập nhật

---

### GET `/admin/config/bank-info`
Lấy thông tin ngân hàng.  
**Auth:** 🔒 `ADMIN`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "bank_name": "Vietcombank",
    "account_number": "1234567890",
    "account_name": "NGUYEN VAN A",
    "branch": "Chi nhánh HCM",
    "transfer_template": "LMS [MaHV] [TenKhoa]",
    "qr_image_url": "https://cdn.../qr.png"
  }
}
```

---

### PUT `/admin/config/bank-info`
Cập nhật thông tin ngân hàng.  
**Auth:** 🔒 `ADMIN`

**Request Body:**
```json
{
  "bank_name": "Techcombank",
  "account_number": "0987654321",
  "account_name": "TRAN THI B",
  "branch": "Chi nhánh Hà Nội",
  "transfer_template": "LMS [TenKhoa] [Email]",
  "qr_image_url": "https://cdn.../qr-new.png"
}
```

**Response 200:** bank_info đã cập nhật

---

## Module 11 — Email Notifications (Internal / Background)

> Email notification **không expose HTTP endpoint** cho client. Được trigger bởi backend sau một số sự kiện quan trọng.

### Danh sách email events

| Event trigger | Người nhận | Template | Ghi chú |
|---------------|-----------|----------|---------|
| Enrollment tạo mới (PENDING) | Admin | `enrollment_pending` | Thông báo Admin có đơn chờ duyệt |
| Enrollment được APPROVED | Student | `enrollment_approved` | Chúc mừng, link vào học |
| Enrollment bị REJECTED | Student | `enrollment_rejected` | Lý do từ chối, link đăng ký lại |
| Forgot password | User | `reset_password` | Link reset có TTL 1 giờ |

### Cấu hình email (System Config keys bổ sung)

| Config Key | Giá trị mặc định | Mô tả |
|------------|-----------------|-------|
| `SMTP_HOST` | `"smtp.gmail.com"` | SMTP server |
| `SMTP_PORT` | `"587"` | Port TLS |
| `SMTP_USER` | `""` | Email gửi |
| `SMTP_PASSWORD` | `""` | Mật khẩu App (lưu encrypted) |
| `EMAIL_FROM_NAME` | `"LMS Platform"` | Tên hiển thị |
| `EMAIL_ENABLED` | `"true"` | Tắt/bật tính năng email |

> **Môi trường dev:** Dùng [Mailhog](https://github.com/mailhog/MailHog) (Docker) để bắt email local thay vì gửi thật.

---

## Tóm tắt toàn bộ Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/auth/register` | PUBLIC | Đăng ký |
| POST | `/auth/login` | PUBLIC | Đăng nhập |
| POST | `/auth/logout` | AUTH | Đăng xuất |
| POST | `/auth/refresh` | PUBLIC | Làm mới access token |
| POST | `/auth/forgot-password` | PUBLIC | Quên mật khẩu |
| POST | `/auth/reset-password` | PUBLIC | Reset mật khẩu |
| GET | `/auth/me` | AUTH | Thông tin bản thân |
| PATCH | `/auth/me` | AUTH | Cập nhật profile |
| POST | `/auth/change-password` | AUTH | Đổi mật khẩu |
| GET | `/courses` | PUBLIC | Danh sách khóa học |
| GET | `/courses/:id` | PUBLIC | Chi tiết khóa học |
| POST | `/courses` | TEACHER | Tạo khóa học |
| PATCH | `/courses/:id` | TEACHER | Sửa khóa học |
| DELETE | `/courses/:id` | ADMIN | Xóa khóa học |
| GET | `/courses/:id/students` | TEACHER | Học viên của khóa |
| GET | `/courses/:courseId/lessons` | PUBLIC/AUTH | Danh sách bài học |
| GET | `/courses/:courseId/lessons/:id` | AUTH | Chi tiết bài học |
| POST | `/courses/:courseId/lessons` | TEACHER | Tạo bài học |
| PATCH | `/courses/:courseId/lessons/:id` | TEACHER | Sửa bài học |
| DELETE | `/courses/:courseId/lessons/:id` | TEACHER | Xóa bài học |
| PATCH | `/courses/:courseId/lessons/reorder` | TEACHER | Sắp xếp bài học |
| GET | `/lessons/:lessonId/attachments` | AUTH | Danh sách attachment |
| POST | `/lessons/:lessonId/attachments` | TEACHER | Upload attachment |
| DELETE | `/lessons/:lessonId/attachments/:id` | TEACHER | Xóa attachment |
| POST | `/upload/video` | TEACHER | Upload video |
| POST | `/upload/video/presigned` | TEACHER | Presigned upload URL |
| POST | `/upload/image` | AUTH | Upload ảnh |
| GET | `/enrollments` | AUTH | Danh sách enrollment |
| POST | `/enrollments` | STUDENT | Đăng ký khóa học |
| GET | `/enrollments/:id` | AUTH | Chi tiết enrollment |
| POST | `/enrollments/:id/payment-proof` | STUDENT | Upload biên lai |
| PATCH | `/enrollments/:id/approve` | ADMIN | Duyệt enrollment |
| PATCH | `/enrollments/:id/reject` | ADMIN | Từ chối enrollment |
| GET | `/progress/courses/:courseId` | STUDENT | Tiến độ theo khóa |
| POST | `/progress/lessons/:id/open` | STUDENT | Mở bài học |
| POST | `/progress/lessons/:id/video-progress` | STUDENT | Cập nhật tiến độ video |
| GET | `/admin/users` | ADMIN | Danh sách user |
| GET | `/admin/users/:id` | ADMIN | Chi tiết user |
| POST | `/admin/users` | ADMIN | Tạo user |
| PATCH | `/admin/users/:id` | ADMIN | Sửa user |
| DELETE | `/admin/users/:id` | ADMIN | Xóa user |
| GET | `/admin/reports/overview` | ADMIN | Dashboard tổng quan |
| GET | `/admin/reports/courses/:id` | TEACHER | Báo cáo theo khóa |
| GET | `/admin/reports/students/:id` | ADMIN | Báo cáo học viên |
| GET | `/admin/config` | ADMIN | Lấy config |
| PATCH | `/admin/config` | ADMIN | Cập nhật config |
| GET | `/admin/config/bank-info` | ADMIN | Thông tin ngân hàng |
| PUT | `/admin/config/bank-info` | ADMIN | Cập nhật ngân hàng |
