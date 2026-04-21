# LMS Platform — Product Requirements Document (PRD)
**Version:** 1.0 — MVP  
**Ngày:** 13/04/2026  
**Trạng thái:** Draft  

---

## 1. Mục tiêu & Phạm vi

### 1.1 Vấn đề cần giải quyết
- Giảng viên/tổ chức chưa có nền tảng tập trung để phân phối nội dung học tập (video, tài liệu).
- Học viên phải nhận tài liệu rời rạc qua email/drive, không có lộ trình học rõ ràng.
- Admin không có công cụ để theo dõi tiến độ và doanh thu khóa học.

### 1.2 Giải pháp
Xây dựng hệ thống LMS (Learning Management System) gồm:
- **Web Học viên** — Trang catalog, đăng ký, học bài, xem tiến độ.
- **Web Admin/LMS** — Quản lý khóa học, upload nội dung, duyệt thanh toán, báo cáo.

### 1.3 Phạm vi MVP
| Trong MVP | Ngoài MVP (làm sau) |
|-----------|---------------------|
| Auth: đăng ký, đăng nhập, quên mật khẩu | Quiz / bài tập |
| Catalog khóa học (tất cả / của tôi) | Thanh toán online (Stripe, VNPay) |
| Đăng ký + thanh toán chuyển khoản thủ công | Certificate / chứng chỉ |
| Upload video (file + link) & tài liệu | Forum / comment bài học |
| Xem tài liệu inline trên web | Live class / webinar |
| Theo dõi tiến độ học | Mobile app |
| Admin: CRUD khóa, lesson, duyệt TT, báo cáo | Multi-tenant |
| Phân quyền: Student / Teacher / Admin | |

### 1.4 Chỉ số thành công
| Chỉ số | Định nghĩa | Mục tiêu sơ bộ |
|--------|-----------|----------------|
| Số khóa bán | Số Enrollment được Approved | — |
| Tỷ lệ hoàn thành bài | % Lesson có Progress = COMPLETED / tổng Lesson mỗi khóa | >= 60% |
| Thời gian onboard Teacher | Từ tạo khóa → publish → có học viên đầu tiên | < 1 ngày |

---

## 2. Vai trò & Phân quyền (RBAC)

### 2.1 Danh sách role
| Role | Mô tả |
|------|-------|
| **STUDENT** | Người học. Đăng ký, mua khóa, học bài |
| **TEACHER** | Giảng viên. Tạo/quản lý khóa học của mình, xem học viên + báo cáo |
| **ADMIN** | Quản trị viên. Toàn quyền hệ thống, duyệt thanh toán, quản lý user |

> Một User chỉ có 1 role tại một thời điểm. Admin có thể đổi role cho user.

### 2.2 Ma trận quyền (Permission Matrix)
| Chức năng | STUDENT | TEACHER | ADMIN |
|-----------|:-------:|:-------:|:-----:|
| Xem trang chủ / catalog | ✅ | ✅ | ✅ |
| Đăng ký tài khoản | ✅ | — | — |
| Đăng nhập | ✅ | ✅ | ✅ |
| Đăng ký khóa học | ✅ | — | — |
| Xem "Khóa của tôi" | ✅ | — | — |
| Xem bài học (đã mua) | ✅ | — | — |
| Tạo / sửa khóa học | — | ✅ (khóa của mình) | ✅ |
| Upload lesson | — | ✅ (khóa của mình) | ✅ |
| Duyệt thanh toán | — | — | ✅ |
| Quản lý user / role | — | — | ✅ |
| Xem báo cáo toàn hệ thống | — | — | ✅ |
| Xem báo cáo khóa của mình | — | ✅ | ✅ |
| Thiết lập System Config | — | — | ✅ |

---

## 3. Business Rules (Quy tắc nghiệp vụ cứng)

### 3.1 Trạng thái Khóa học
```
DRAFT → PUBLISHED → ARCHIVED
              ↑___________↓  (có thể unpublish về DRAFT nếu chưa có enrollment)
```
- Chỉ khóa **PUBLISHED** mới hiển thị trên catalog học viên.
- Teacher chỉ xóa khóa ở trạng thái **DRAFT**.
- Khi có ít nhất 1 Enrollment APPROVED, không được xóa khóa.

### 3.2 Trạng thái Enrollment (Đăng ký khóa)
```
PENDING → APPROVED  (học viên được học)
        → REJECTED  (học viên không được học, có thể đăng ký lại)
```
- Học viên chỉ được vào trang học khi Enrollment = **APPROVED**.
- Học viên **không** được tạo 2 Enrollment PENDING/APPROVED cho cùng 1 khóa.
- Khi REJECTED, học viên được phép nộp lại.

### 3.3 Tiến độ học (Progress)
Admin có thể chọn **1 trong 2 chế độ** qua System Config:

| Config | Điều kiện "Hoàn thành bài" |
|--------|---------------------------|
| `COMPLETION_MODE = OPEN` | Học viên click mở bài → COMPLETED |
| `COMPLETION_MODE = VIDEO_50` | Học viên xem >= 50% video → COMPLETED (chỉ áp dụng lesson loại VIDEO; lesson TEXT vẫn dùng OPEN) |

- Progress được tính riêng theo từng học viên, từng lesson.
- % hoàn thành khóa = (số lesson COMPLETED) / (tổng số lesson PUBLISHED trong khóa) × 100.

### 3.4 Upload tài nguyên
- **Video**: chọn 1 trong 2: (a) upload file trực tiếp (mp4, mov, webm), (b) dán link embed (YouTube, Vimeo, Google Drive).
- **Tài liệu**: upload file (docx, xlsx, pptx, pdf, txt). Hệ thống render inline bằng viewer (Office Online Viewer hoặc PDF.js).
- Giới hạn kích thước file (Admin cấu hình, mặc định video 2GB, tài liệu 50MB).

### 3.5 Bài học (Lesson)
- Mỗi lesson thuộc đúng 1 khóa học.
- Lesson có thứ tự (order), có thể kéo-thả sắp xếp lại.
- Lesson type: **VIDEO** hoặc **TEXT**.
- 1 lesson TEXT có thể đính kèm nhiều attachment (file tài liệu).
- 1 lesson VIDEO có 1 nguồn video (file hoặc link) và có thể có attachment đi kèm.

### 3.6 Slug khóa học
- Backend **tự động generate** slug từ `title` khi tạo khóa học: lowercase, bỏ dấu tiếng Việt, thay khoảng trắng bằng `-`.
- Nếu slug bị trùng: tự động thêm suffix số (`-2`, `-3`…). Client **không** gửi slug.
- Ví dụ: `"Lập trình Python cơ bản"` → `lap-trinh-python-co-ban`.

### 3.7 Soft Delete
- `courses` và `lessons`: xóa theo kiểu **soft delete** (set cột `deleted_at`).
- `users`: không soft delete — dùng `status = BLOCKED` để vô hiệu hóa tài khoản.
- Dữ liệu enrollment/progress vẫn giữ sau khi xóa course/lesson (không cascade).

### 3.8 Thông báo (Notification)
| Sự kiện | Kênh | Người nhận | Bắt buộc |
|-----------|------|-----------|----------|
| Enrollment mới (PENDING) | Email | Admin | Should |
| Enrollment được APPROVED | Email | Student | Must |
| Enrollment bị REJECTED | Email | Student | Must |
| Quên mật khẩu (reset link) | Email | User | Must |

- Email được gửi **bất đồng bộ** (background job) sau khi API trả response, không cản trở main flow.
- Môi trường dev: dùng **Mailhog** (Docker) bắt email local, không gửi thật.
- Môi trường production: cấu hình SMTP qua System Config (`SMTP_HOST`, `SMTP_USER`…).

---

## 4. Function List (MVP)

### Module A — Authentication & Profile
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| A-01 | Đăng ký | Form: tên, email, mật khẩu. Validate email chưa tồn tại. Role mặc định: STUDENT | Public | Must |
| A-02 | Đăng nhập | Email + password. Trả token (JWT). | All | Must |
| A-03 | Đăng xuất | Hủy session/token | All | Must |
| A-04 | Quên mật khẩu | Gửi link reset qua email | All | Should |
| A-05 | Đổi mật khẩu | Mật khẩu cũ + mới | All | Should |
| A-06 | Xem/sửa profile | Tên, avatar, email (readonly sau đăng ký), SĐT | All | Must |

### Module B — Catalog & Trang chủ (Học viên)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| B-01 | Trang chủ | Banner, featured courses, CTA đăng ký | Public | Must |
| B-02 | Danh sách tất cả khóa | List tất cả khóa PUBLISHED. Hiển thị badge "Đã đăng ký" nếu đã mua | Public/Student | Must |
| B-03 | Tìm kiếm / lọc khóa | Tìm theo tên, lọc theo trạng thái đã/chưa mua | Student | Should |
| B-04 | Chi tiết khóa học | Mô tả, giảng viên, giá, danh sách lesson (preview title), thumbnail | Public | Must |

### Module C — Đăng ký & Thanh toán (Học viên)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| C-01 | Yêu cầu đăng ký khóa | Student bấm "Đăng ký". Tạo Enrollment PENDING. Một lần mỗi khóa | Student | Must |
| C-02 | Trang hướng dẫn thanh toán | Hiển thị thông tin tài khoản ngân hàng, số tiền, nội dung CK, hướng dẫn upload biên lai | Student | Must |
| C-03 | Upload biên lai (optional) | Student upload ảnh chụp biên lai chuyển khoản | Student | Should |
| C-04 | Xem trạng thái đăng ký | Danh sách yêu cầu: PENDING / APPROVED / REJECTED + ghi chú từ Admin | Student | Must |

### Module D — Học bài & Tiến độ (Học viên)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| D-01 | Danh sách khóa của tôi | Chỉ khóa Enrollment = APPROVED. Hiển thị % hoàn thành | Student | Must |
| D-02 | Trang học — sidebar lesson | Danh sách lesson, hiển thị icon loại (video/text), trạng thái completed | Student | Must |
| D-03 | Xem lesson VIDEO (file) | HTML5 video player. Track % watched | Student | Must |
| D-04 | Xem lesson VIDEO (link) | Embed YouTube/Vimeo/Drive iframe | Student | Must |
| D-05 | Xem lesson TEXT | Hiển thị rich text content | Student | Must |
| D-06 | Xem tài liệu đính kèm (inline) | Office Online Viewer hoặc PDF.js, embed ngay trang học | Student | Must |
| D-07 | Đánh dấu hoàn thành bài | Tự động theo config (OPEN hoặc VIDEO_50) | Student | Must |
| D-08 | Tiến độ khóa học | Card % completed trên "Khóa của tôi", progress bar trong trang học | Student | Must |

### Module E — Quản lý Khóa học (Teacher/Admin)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| E-01 | Danh sách khóa học | Table: tên, giá, trạng thái, số học viên, actions | Teacher/Admin | Must |
| E-02 | Tạo khóa học | Form: tiêu đề, slug, mô tả, thumbnail, giá, Teacher (Admin chọn), status | Teacher/Admin | Must |
| E-03 | Sửa khóa học | Sửa tất cả trường, đổi trạng thái DRAFT↔PUBLISHED | Teacher/Admin | Must |
| E-04 | Xóa khóa học | Chỉ khi DRAFT & chưa có enrollment | Admin | Must |
| E-05 | Danh sách lesson của khóa | Drag-drop reorder, hiển thị type, status | Teacher/Admin | Must |
| E-06 | Tạo lesson VIDEO | Title, description, source type (FILE/LINK), upload file hoặc URL | Teacher/Admin | Must |
| E-07 | Tạo lesson TEXT | Title, rich text editor content, attach files | Teacher/Admin | Must |
| E-08 | Sửa/xóa lesson | Sửa tất cả fields, xóa khi chưa có progress | Teacher/Admin | Must |
| E-09 | Upload attachment | Upload file kèm lesson (multiple files), xem danh sách, xóa | Teacher/Admin | Must |
| E-10 | Reorder lesson | Kéo thả hoặc up/down để sắp xếp thứ tự | Teacher/Admin | Must |

### Module F — Quản lý Enrollment & Thanh toán (Admin)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| F-01 | Danh sách yêu cầu đăng ký | Filter theo status, khóa, học viên. Xem biên lai đính kèm | Admin | Must |
| F-02 | Duyệt APPROVED | Click approve → Enrollment = APPROVED, học viên có thể học | Admin | Must |
| F-03 | Từ chối REJECTED | Kèm ghi chú lý do từ chối | Admin | Must |

### Module G — Quản lý User (Admin)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| G-01 | Danh sách user | Table: tên, email, role, status, ngày tạo | Admin | Must |
| G-02 | Tạo user (Admin tạo Teacher) | Form đầy đủ, chọn role | Admin | Must |
| G-03 | Sửa role | Đổi role STUDENT/TEACHER/ADMIN | Admin | Must |
| G-04 | Khoá/mở tài khoản | status = ACTIVE/BLOCKED | Admin | Must |
| G-05 | Xem lịch sử đăng ký của học viên | Các khóa đã đăng ký + trạng thái | Admin | Should |

### Module H — Báo cáo & Thống kê
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| H-01 | Dashboard tổng quan | Cards: tổng khóa, tổng học viên, enrollment APPROVED tháng này, tỷ lệ hoàn thành trung bình | Admin | Must |
| H-02 | Báo cáo theo khóa | Số học viên, % hoàn thành từng lesson, doanh thu (nếu có giá) | Admin/Teacher | Must |
| H-03 | Báo cáo học viên | Danh sách khóa đã học, tiến độ từng khóa | Admin | Should |

### Module I — System Config (Admin)
| ID | Chức năng | Mô tả | Role | Ưu tiên |
|----|-----------|-------|------|---------|
| I-01 | Thiết lập completion mode | Chọn OPEN hoặc VIDEO_50 | Admin | Must |
| I-02 | Thiết lập thông tin ngân hàng | Tên ngân hàng, số TK, tên chủ TK, nội dung CK mẫu | Admin | Must |
| I-03 | Giới hạn dung lượng upload | Max video file size, max document file size | Admin | Should |

---

## 5. Screen List (Danh sách màn hình)

### 5.1 Web Học viên (Student Web)
| ID | Tên màn hình | URL (đề xuất) | Truy cập | Mô tả ngắn |
|----|-------------|---------------|----------|------------|
| S-01 | Trang chủ | `/` | Public | Banner, featured courses |
| S-02 | Đăng ký | `/register` | Guest | Form đăng ký tài khoản |
| S-03 | Đăng nhập | `/login` | Guest | Form đăng nhập |
| S-04 | Quên mật khẩu | `/forgot-password` | Guest | Nhập email nhận link reset |
| S-05 | Reset mật khẩu | `/reset-password?token=` | Guest | Nhập mật khẩu mới |
| S-06 | Danh sách tất cả khóa | `/courses` | Public | List tất cả khóa PUBLISHED |
| S-07 | Chi tiết khóa học | `/courses/:slug` | Public | Mô tả, outline, nút Đăng ký |
| S-08 | Hướng dẫn thanh toán | `/courses/:slug/payment` | Student | Thông tin CK, upload biên lai |
| S-09 | Khóa của tôi | `/my-courses` | Student | Danh sách khóa đã mua + tiến độ |
| S-10 | Yêu cầu đăng ký | `/my-enrollments` | Student | Trạng thái các yêu cầu PENDING/APPROVED/REJECTED |
| S-11 | Trang học | `/learn/:courseSlug/:lessonId` | Student (Enrolled) | Video/Text player + sidebar |
| S-12 | Thông tin cá nhân | `/profile` | Student | Sửa tên, avatar, SĐT, đổi MK |

### 5.2 Web Admin/LMS (Admin Web)
| ID | Tên màn hình | URL (đề xuất) | Truy cập | Mô tả ngắn |
|----|-------------|---------------|----------|------------|
| A-01 | Đăng nhập Admin | `/admin/login` | Guest | Form đăng nhập Admin/Teacher |
| A-02 | Dashboard | `/admin` | Admin/Teacher | Cards tổng quan |
| A-03 | Danh sách khóa học | `/admin/courses` | Admin/Teacher | Table + filter + actions |
| A-04 | Tạo khóa học | `/admin/courses/new` | Admin/Teacher | Form tạo mới |
| A-05 | Sửa thông tin khóa | `/admin/courses/:id/edit` | Admin/Teacher | Form sửa |
| A-06 | Nội dung khóa học (Curriculum) | `/admin/courses/:id/curriculum` | Admin/Teacher | Drag-drop lesson list |
| A-07 | Tạo lesson | `/admin/courses/:id/lessons/new` | Admin/Teacher | Chọn type VIDEO/TEXT, form |
| A-08 | Sửa lesson | `/admin/courses/:id/lessons/:lessonId/edit` | Admin/Teacher | Form sửa lesson |
| A-09 | Quản lý Enrollment | `/admin/enrollments` | Admin | Table + filter + approve/reject |
| A-10 | Quản lý User | `/admin/users` | Admin | Table user + filter |
| A-11 | Tạo/Sửa User | `/admin/users/new` · `/admin/users/:id/edit` | Admin | Form tạo/sửa |
| A-12 | Báo cáo tổng quan | `/admin/reports` | Admin | Dashboard báo cáo |
| A-13 | Báo cáo chi tiết khóa | `/admin/reports/courses/:id` | Admin/Teacher | Thống kê từng khóa |
| A-14 | Cấu hình hệ thống | `/admin/settings` | Admin | Completion mode, bank info, upload limits |

---

## 6. User Flows (Chi tiết)

### 6.1 Flow: Học viên đăng ký và học
```
[Trang chủ]
    → Xem danh sách khóa
    → Xem chi tiết khóa
    → Chưa đăng nhập? → [Đăng nhập / Đăng ký]
    → Bấm "Đăng ký khóa"
    → [Trang hướng dẫn thanh toán]
        - Xem thông tin ngân hàng
        - Chuyển khoản thực tế (ngoài hệ thống)
        - Upload ảnh biên lai (optional)
        - Bấm "Đã chuyển khoản"
        → Enrollment = PENDING
    → [Khóa của tôi] hoặc [Yêu cầu đăng ký]
        - Xem trạng thái PENDING
    → (Admin duyệt) → Enrollment = APPROVED
    → Nhận thông báo (hoặc tự refresh)
    → [Khóa của tôi]
        - Thấy khóa với % tiến độ = 0%
        - Bấm "Vào học"
    → [Trang học]
        - Sidebar: danh sách lesson
        - Click lesson → xem video hoặc đọc text
        - Xem tài liệu đính kèm inline
        - Tự động / thủ công mark completed
    → % tiến độ tăng dần
```

### 6.2 Flow: Admin/Teacher tạo khóa học
```
[Đăng nhập Admin]
    → [Dashboard]
    → [Danh sách khóa]
    → Bấm "Tạo khóa mới"
    → [Form tạo khóa]: Điền title, mô tả, giá, thumbnail → Lưu (DRAFT)
    → [Curriculum] của khóa vừa tạo
    → Bấm "Thêm bài học"
    → Chọn type VIDEO hoặc TEXT
        [VIDEO] → Chọn nguồn: UPLOAD FILE hoặc PASTE LINK
                → Upload file (progress bar) hoặc nhập URL
                → Upload attachment đi kèm (optional)
                → Lưu lesson
        [TEXT]  → Soạn nội dung rich text
                → Upload attachment
                → Lưu lesson
    → Kéo thả sắp xếp thứ tự lesson
    → Publish khóa (DRAFT → PUBLISHED)
    → Khóa xuất hiện trên catalog học viên
```

### 6.3 Flow: Admin duyệt thanh toán
```
[Admin nhận thông báo / vào Enrollment list]
    → Filter PENDING
    → Click xem chi tiết
        - Thông tin học viên, khóa, ngày yêu cầu, biên lai (nếu có)
    → Bấm APPROVE → Enrollment = APPROVED → Học viên được học
       hoặc REJECT + ghi chú lý do → Enrollment = REJECTED
```

---

## 7. Acceptance Criteria (Tiêu chí chấp nhận quan trọng)

### AC-1: Đăng ký tài khoản
- ✅ Email chưa tồn tại mới cho đăng ký thành công
- ✅ Mật khẩu phải >= 8 ký tự
- ✅ Sau đăng ký thành công, tự động đăng nhập và redirect về trang chủ
- ✅ Role mặc định là STUDENT

### AC-2: Enrollment
- ✅ Student không thể tạo 2 enrollment PENDING/APPROVED trùng nhau cho 1 khóa
- ✅ Student không thể vào trang học nếu Enrollment != APPROVED
- ✅ Sau khi REJECTED, Student có thể tạo lại enrollment mới

### AC-3: Trang học
- ✅ Chỉ render khi `enrollmentStatus === APPROVED`
- ✅ Lesson VIDEO (file): dùng HTML5 `<video>` tag, track timeupdate event
- ✅ Lesson VIDEO (link YouTube/Vimeo): embed iframe, track qua YouTube/Vimeo API
- ✅ Lesson TEXT: render markdown/HTML an toàn (sanitize XSS)
- ✅ Attachment: render inline viewer, không force download

### AC-4: Tiến độ (Progress)
- ✅ Config OPEN: gọi API `POST /progress/lessons/:id/open` ngay khi lesson load
- ✅ Config VIDEO_50: gọi API khi video đạt >= 50% tổng duration
- ✅ % hoàn thành khóa = (completed lessons / total published lessons) × 100, làm tròn 1 chữ số

### AC-5: Upload video
- ✅ Hiển thị progress bar % khi upload
- ✅ Nếu file > giới hạn cấu hình → báo lỗi trước khi upload
- ✅ Định dạng cho phép: mp4, mov, webm, avi

### AC-6: Phân quyền API
- ✅ Mọi endpoint `/admin/*` phải trả 401 nếu không có token
- ✅ Mọi endpoint `/admin/*` phải trả 403 nếu role là STUDENT
- ✅ Teacher chỉ CRUD được course/lesson mà `teacherId === user.id`

---

## 8. Non-functional Requirements

| Hạng mục | Yêu cầu |
|----------|---------|
| **Bảo mật** | HTTPS bắt buộc, mật khẩu hash bcrypt, JWT expire 7 ngày, refresh token |
| **Auth** | JWT Bearer token cho API, HttpOnly cookie cho web (chọn 1 nhất quán) |
| **File storage** | Cloud storage (S3 hoặc tương đương) cho video/tài liệu, không lưu local server |
| **Video streaming** | Tối thiểu: direct URL từ S3. Nâng cao: signed URL (expire) để bảo vệ nội dung |
| **Inline viewer** | PDF: PDF.js hoặc Google Docs Viewer. Office: Microsoft Office Online Viewer |
| **Performance** | API response < 500ms cho list/detail thông thường |
| **Responsive** | Web học viên responsive mobile. Admin LMS ưu tiên desktop |
| **SEO** | Trang chi tiết khóa học cần meta tags (title, description, og:image) |
| **Concurrency** | Tối thiểu hỗ trợ 100 concurrent users trong MVP |
