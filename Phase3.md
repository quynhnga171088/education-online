# Phase 3 — Backend: Course, Lesson & File Storage APIs

**Mục tiêu:** Hoàn thiện Module 2 (Courses), Module 3 (Lessons), Module 4 (Attachments), Module 5 (Upload) theo `implementation_plan.md`.

---

## Tổng quan các file đã tạo/cập nhật

| Loại | File | Mô tả |
|------|------|-------|
| Utility | `util/SlugUtils.java` | Chuyển chuỗi (kể cả tiếng Việt) sang URL slug |
| Exception | `exception/ResourceNotFoundException.java` | 404 exception |
| Exception (update) | `exception/GlobalExceptionHandler.java` | Thêm handler cho `ResourceNotFoundException` (404) và `AccessDeniedException` (403) |
| Config | `config/WebMvcConfig.java` | Serve static files qua `/uploads/**` với Range-header support |
| Config (update) | `config/SecurityConfig.java` | Mở public cho `GET /courses/{courseId}/lessons` |
| Repository (update) | `repository/EnrollmentRepository.java` | Thêm `findAllByStudentAndCourseIds` (batch enrollment check) |
| DTO | `dto/course/TeacherInfo.java` | Embedded teacher info trong course responses |
| DTO | `dto/course/CourseResponse.java` | Response cho course list (có `enrollmentStatus` nullable) |
| DTO | `dto/course/CourseDetailResponse.java` | Response cho course detail (full + lesson list) |
| DTO | `dto/course/CreateCourseRequest.java` | Request tạo course |
| DTO | `dto/course/UpdateCourseRequest.java` | Request cập nhật course (all fields optional) |
| DTO | `dto/course/StudentWithProgressResponse.java` | Student + progress% cho endpoint của Teacher |
| DTO | `dto/lesson/LessonResponse.java` | Lesson DTO với 2 factory: `fromEntityFull` / `fromEntityPreview` |
| DTO | `dto/lesson/LessonDetailResponse.java` | Single lesson detail kèm attachments |
| DTO | `dto/lesson/CreateLessonRequest.java` | Request tạo lesson (VIDEO/TEXT) |
| DTO | `dto/lesson/UpdateLessonRequest.java` | Request cập nhật lesson (all fields optional) |
| DTO | `dto/lesson/ReorderLessonsRequest.java` | Batch reorder request (list of `{lessonId, orderIndex}`) |
| DTO | `dto/upload/UploadResponse.java` | Response upload file (`fileKey`, `fileUrl`, `fileSizeBytes`, `contentType`) |
| DTO | `dto/attachment/AttachmentResponse.java` | Attachment DTO |
| Service | `service/FileStorageService.java` | Lưu/xóa file trên disk; `storeVideo`, `storeDocument`, `storeImage` |
| Service | `service/CourseService.java` | CRUD course + slug generation + student progress list |
| Service | `service/LessonService.java` | CRUD lesson + reorder + access-level control |
| Service | `service/AttachmentService.java` | CRUD attachment + delegate upload đến FileStorageService |
| Controller | `controller/CourseController.java` | REST endpoints `/courses/**` |
| Controller | `controller/LessonController.java` | REST endpoints `/courses/{cid}/lessons/**` |
| Controller | `controller/UploadController.java` | REST endpoints `/upload/video`, `/upload/image` |
| Controller | `controller/AttachmentController.java` | REST endpoints `/courses/{cid}/lessons/{lid}/attachments/**` |

---

## 1) Utilities & Exception Handling

### `util/SlugUtils.java`

- Dùng `Normalizer.normalize(NFD)` để tách dấu khỏi ký tự tiếng Việt
- Strip non-ASCII → lowercase → remove non-word chars → replace spaces bằng `-` → collapse dashes

### `exception/ResourceNotFoundException.java`

- Extends `RuntimeException`, được GlobalExceptionHandler map thành HTTP 404

### `exception/GlobalExceptionHandler.java` (update)

Thêm 2 handler mới:
- `ResourceNotFoundException` → 404 NOT FOUND
- `AccessDeniedException` (Spring Security) → 403 FORBIDDEN

---

## 2) File Storage — Static Serving & Upload

### `config/WebMvcConfig.java` (mới)

Thay vì tạo `FileController` riêng, dùng Spring MVC's `ResourceHttpRequestHandler`:

```java
registry.addResourceHandler("/uploads/**")
        .addResourceLocations("file:" + uploadDir + "/")
        .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic());
```

**Lợi ích:**
- Range header tự động được hỗ trợ → video seek hoạt động trong browser
- Cache-Control header được set đúng
- Không cần code thêm gì

### `service/FileStorageService.java`

| Method | Path pattern | Max size | Allowed types |
|--------|-------------|---------|--------------|
| `storeVideo(file, courseId)` | `videos/{courseId}/{uuid}.{ext}` | 2 GB (config servlet) | mp4, mov, webm, avi |
| `storeDocument(file, lessonId)` | `docs/{lessonId}/{uuid}.{ext}` | 100 MB | pdf, doc, docx, xls, xlsx, ppt, pptx, txt |
| `storeImage(file, type)` | `images/{type}/{uuid}.{ext}` | 5 MB | jpg, png, gif, webp |
| `deleteFile(fileKey)` | — | — | Silent if not exists |
| `buildUrl(fileKey)` | — | — | Builds `{base-url}/{fileKey}` |

- `@PostConstruct`: tự tạo thư mục `uploadDir` nếu chưa tồn tại
- Path traversal protection: validate `resolvedPath.startsWith(rootPath)`

---

## 3) Course Module

### `config/SecurityConfig.java` (update)

```java
// Thêm vào permitAll:
.requestMatchers(HttpMethod.GET, "/courses", "/courses/{courseId}").permitAll()
.requestMatchers(HttpMethod.GET, "/courses/{courseId}/lessons").permitAll()
```

### `service/CourseService.java`

**Slug generation (`generateUniqueSlug`):**
- Gọi `SlugUtils.toSlug(title)` → base slug
- Kiểm tra uniqueness, thêm `-2`, `-3`, ... nếu trùng

**`listCourses`:**
1. Query paged courses với filter `status/search`
2. Nếu user là STUDENT: batch-query enrollments bằng `findAllByStudentAndCourseIds` → build Map
3. Map mỗi course thành `CourseResponse` với `enrollmentStatus`

**`getCourseDetail`:**
- Lấy lesson list
- `hasFullLessonAccess()`: true nếu ADMIN/TEACHER hoặc STUDENT có APPROVED enrollment
- Map lessons thành `fromEntityFull` hoặc `fromEntityPreview`

**`getStudentsWithProgress`:**
- Lấy danh sách enrolled APPROVED
- Tính `progressPercent = completedLessons / totalLessons * 100`

**`softDeleteCourse`:**
- Chỉ xóa được DRAFT course
- Không xóa nếu có bất kỳ enrollment nào

### `controller/CourseController.java`

| Endpoint | Quyền | Ghi chú |
|---------|-------|---------|
| `GET /courses` | Public | + enrollmentStatus nếu authenticated STUDENT |
| `GET /courses/{slugOrId}` | Public | Chấp nhận cả số ID và slug |
| `POST /courses` | TEACHER, ADMIN | Auto-generate unique slug |
| `PATCH /courses/{id}` | TEACHER (own), ADMIN | Partial update |
| `DELETE /courses/{id}` | ADMIN | Soft delete (DRAFT only, no enrollments) |
| `GET /courses/{id}/students` | TEACHER (own), ADMIN | Student list + progress% |

---

## 4) Lesson Module

### `service/LessonService.java`

**Access control:**
- `hasFullAccess(course, user)`: Admin/Teacher → true; Student → kiểm tra APPROVED enrollment
- `requireDetailAccess`: throw 401 nếu unauthenticated, 401 nếu student chưa enroll
- `checkTeacherWriteAccess`: Admin → pass; Teacher → chỉ own course

**`createLesson` validation:**
- VIDEO type: `videoSourceType` bắt buộc
- `UPLOAD` source: `videoFileKey` bắt buộc
- YouTube/Vimeo/Drive source: `videoUrl` bắt buộc

**`reorderLessons`:**
- Nhận `List<{lessonId, orderIndex}>`, batch update tất cả
- Return sorted list sau khi reorder

### `controller/LessonController.java`

| Endpoint | Quyền | Ghi chú |
|---------|-------|---------|
| `GET /courses/{cid}/lessons` | Public | Preview nếu unenrolled; Full nếu enrolled/teacher/admin |
| `GET /courses/{cid}/lessons/{lid}` | Authenticated | STUDENT cần APPROVED enrollment |
| `POST /courses/{cid}/lessons` | TEACHER, ADMIN | Tạo VIDEO hoặc TEXT lesson |
| `PATCH /courses/{cid}/lessons/{lid}` | TEACHER (own), ADMIN | Partial update |
| `DELETE /courses/{cid}/lessons/{lid}` | TEACHER (own), ADMIN | Soft delete |
| `PATCH /courses/{cid}/lessons/reorder` | TEACHER (own), ADMIN | Batch reorder |

**Lưu ý `reorder` vs `{lid}`:**
- Spring MVC ưu tiên literal segment trước path variable, nên `/reorder` được match trước `/{lessonId}`.

---

## 5) Upload Module

### `controller/UploadController.java`

| Endpoint | Quyền | Ghi chú |
|---------|-------|---------|
| `POST /upload/video?courseId={id}` | TEACHER, ADMIN | Multipart; trả `{fileKey, fileUrl, fileSizeBytes, contentType}` |
| `POST /upload/image?type={avatar\|thumbnail\|receipt}` | Authenticated | Max 5MB |

---

## 6) Attachment Module

### `service/AttachmentService.java`

- `listAttachments`: Student (APPROVED), Teacher, Admin
- `addAttachment`: Teacher/Admin → delegate to `FileStorageService.storeDocument` → lưu `LessonAttachment`
- `deleteAttachment`: xóa record DB + xóa file từ disk (`FileStorageService.deleteFile`)

### `controller/AttachmentController.java`

Base path: `/courses/{courseId}/lessons/{lessonId}/attachments`

| Endpoint | Quyền |
|---------|-------|
| `GET` | Student (enrolled), Teacher, Admin |
| `POST` (multipart) | TEACHER, ADMIN |
| `DELETE /{attachmentId}` | TEACHER, ADMIN |

---

## 7) Kiểm tra & ghi chú

- Tất cả files đã được kiểm tra qua IDE linter — không có lỗi.
- Maven CLI không khả dụng trong môi trường chạy agent, nhưng các import/class/method đều hợp lệ theo codebase hiện tại.
- `@Where(clause = "deleted_at IS NULL")` trên `Course` và `Lesson` đã có từ Phase 1 — tất cả JPA query tự động filter out deleted records.
- File serving qua `WebMvcConfig.addResourceHandlers` hỗ trợ Range header (video seek) hoàn toàn tự động bởi Spring's `ResourceHttpRequestHandler`.
