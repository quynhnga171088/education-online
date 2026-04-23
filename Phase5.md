# Phase 5 — Frontend (Student Web)

**Mục tiêu:** Xây dựng toàn bộ Student Web với Feature-Sliced Design (FSD) sử dụng React 19, TypeScript, Bootstrap 5, TanStack Query, React Hook Form, Zod, Zustand, React Player.

---

## 1. Kiến trúc dự án

Tuân thủ Feature-Sliced Design (FSD):

```
frontend/src/
├── app/
│   ├── router/       # Route definitions với AuthGuard/GuestGuard
│   └── styles/       # Global CSS / design tokens
│
├── pages/            # 10 trang Student
├── widgets/          # Header, Footer, CourseCard, LessonSidebar
├── features/auth/    # AuthGuard, GuestGuard
├── entities/         # TypeScript types cho Course, Lesson, Enrollment, User
└── shared/
    ├── api/          # axios instance + interceptors + 5 API modules
    ├── hooks/        # useAuth, useDebounce
    ├── lib/          # validations (Zod schemas), format utils
    ├── store/        # authStore (Zustand + persist)
    └── ui/           # Spinner, Badge, EmptyState, ProgressBar, Pagination
```

---

## 2. Shared Infrastructure

### 2.1 Fix `axiosInstance.ts`

**File:** `src/shared/api/axiosInstance.ts`

- **Sửa lỗi**: Response interceptor khi refresh token dùng `response.data.data` sai.
  - **Trước:** `const { accessToken, refreshToken } = response.data.data`
  - **Sau:** `const { accessToken, refreshToken, user } = response.data` → gọi `setAuth(user, newAccessToken, newRefreshToken)`
- Đảm bảo user info được cập nhật đúng sau khi refresh token xoay.

### 2.2 Shared API Layer

Tạo 5 module API mới trong `src/shared/api/`:

| File | Endpoints |
|------|-----------|
| `types.ts` | Định nghĩa `PageResponse<T>` (Spring Boot page shape) |
| `auth.ts` | login, register, logout, me (GET), updateMe (PATCH), changePassword |
| `courses.ts` | list (paginated), detail, getLesson, getStudents |
| `enrollments.ts` | list, getById, create, uploadPaymentProof |
| `progress.ts` | getCourseProgress, markLessonOpen, updateVideoProgress |
| `config.ts` | getBankInfo (public endpoint) |

Tất cả đều gọi qua `axiosInstance` đã cấu hình Bearer token và auto-refresh.

### 2.3 Shared Utilities

**`src/shared/lib/format.ts`** (mới):
- `formatPrice(value)` → định dạng VND hoặc "Miễn phí"
- `formatDate(iso)` → định dạng dd/MM/yyyy (vi-VN)
- `formatDuration(seconds)` → định dạng MM:SS hoặc HH:MM:SS
- `buildFileUrl(fileKey)` → ghép `API_BASE_URL/uploads/{fileKey}` cho video UPLOAD

### 2.4 Shared UI Components

Tạo mới trong `src/shared/ui/`:

| Component | Chức năng |
|-----------|-----------|
| `Spinner.tsx` | Loading spinner + `PageSpinner` centered cho toàn trang |
| `Badge.tsx` | Badge component + helper functions `enrollmentStatusBadge`, `courseStatusBadge` |
| `EmptyState.tsx` | Hiển thị trạng thái rỗng với icon, title, description, action |
| `ProgressBar.tsx` | Progress bar với % label và tùy chỉnh màu/height |
| `Pagination.tsx` | Phân trang (0-indexed, khớp Spring), ellipsis cho dải dài |

---

## 3. Entity Types (cập nhật)

### `entities/course/types.ts`
Mở rộng: thêm `shortDescription`, `description`, `teacher` (object), `lessonCount`, `publishedAt`, `createdAt`, `enrollmentStatus`.

### `entities/lesson/types.ts`
Mở rộng: thêm `description`, `status`, `textContent`, `videoSourceType`, `videoUrl`, `videoFileKey`, `videoDurationSeconds`. Thêm `LessonWithProgress` (kết hợp `Lesson` + progress state).

### `entities/enrollment/types.ts`
Mở rộng: thêm `courseSlug`, `courseThumbnailUrl`, `coursePrice`, `studentId`, `studentName`, `studentEmail`, `note`, `reviewedAt`, `completedLessons`, `totalLessons`, `paymentProof`.

### `entities/user/types.ts` (mới)
Định nghĩa `User`, `UserRole`, `UserStatus`.

---

## 4. Auth Features

### `features/auth/AuthGuard.tsx`
- Đọc `isAuthenticated` từ Zustand store.
- Nếu chưa đăng nhập → redirect `<Navigate to="/login" replace />`.
- Nếu đã đăng nhập → render `<Outlet />` cho nested protected routes.

### `features/auth/GuestGuard.tsx`
- Nếu đã đăng nhập → redirect `<Navigate to="/" replace />` (không để vào /login, /register khi đã có auth).
- Nếu chưa đăng nhập → render `<Outlet />`.

---

## 5. Widgets

### `widgets/header/Header.tsx` (cập nhật)
- Thanh điều hướng responsive (Bootstrap navbar collapse).
- **Trạng thái chưa đăng nhập**: hiển thị nav links "Khóa học", nút "Đăng nhập" + "Đăng ký".
- **Trạng thái đã đăng nhập**: hiển thị thêm "Khóa của tôi", "Đăng ký của tôi"; dropdown avatar với tên user → "Thông tin cá nhân" và "Đăng xuất".
- Xử lý logout: gọi `authApi.logout(refreshToken)` → xóa state → navigate `/login`.

### `widgets/footer/Footer.tsx` (cập nhật)
- Footer 3 cột: giới thiệu, khám phá, tài khoản.
- Copyright 2026.

### `widgets/course-card/CourseCard.tsx` (mới)
- Thumbnail với aspect ratio 16:9, fallback placeholder.
- Hiển thị: tên giáo viên, tiêu đề (clamp 2 dòng), số bài học, giá, nút CTA.
- Tùy chọn: `showProgress` → hiển thị progress bar, `showEnrollmentStatus` → hiển thị badge trạng thái đăng ký.
- Hover animation: lift + shadow.

### `widgets/lesson-sidebar/LessonSidebar.tsx` (mới)
- Danh sách bài học với icon tiến độ: ✅ COMPLETED, ▶️ IN_PROGRESS, ⭕ NOT_STARTED.
- Highlight bài học đang xem (active) bằng màu primary + border trái.
- Hiển thị loại bài (Video/Bài đọc), thời lượng video.
- Scroll riêng trong sidebar.

---

## 6. Router (cập nhật)

**`src/app/router/index.tsx`**

Cấu trúc route 3 nhóm:
```
/ (App layout)
├── Public routes
│   ├── /           (Home)
│   ├── /courses    (CoursesPage)
│   └── /courses/:slug (CourseDetailPage)
│
├── Guest-only (GuestGuard) – redirect nếu đã login
│   ├── /login
│   └── /register
│
└── Protected (AuthGuard) – redirect đến /login nếu chưa auth
    ├── /courses/:slug/payment
    ├── /my-courses
    ├── /my-enrollments
    ├── /learn/:slug/:lessonId
    └── /profile
```

Tất cả pages dùng `lazy` import → React Router v7 code splitting. Pages export `Component` named export.

---

## 7. Pages (10 màn hình)

### S-01: Trang chủ (`pages/home/HomePage.tsx`)
- **HeroBanner**: gradient tím-indigo, headline + subtitle + 2 CTA buttons ("Khám phá" / "Đăng ký miễn phí").
- **Stats bar**: 4 chỉ số (Khóa học, Học viên, Chứng chỉ, Đánh giá).
- **FeaturedCourses**: Query 6 khóa PUBLISHED, hiển thị `CourseCard` grid 3 cột.
- **CTA section**: dark section + nút "Bắt đầu ngay".

### S-02: Đăng ký (`pages/auth/RegisterPage.tsx`)
- Form: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu.
- Validation: Zod schema + React Hook Form + `@hookform/resolvers/zod`.
- Submit: `authApi.register()` → `setAuth()` → navigate `/`.
- Hiển thị lỗi server.

### S-03: Đăng nhập (`pages/auth/LoginPage.tsx`)
- Form: Email, Mật khẩu.
- Submit: `authApi.login()` → `setAuth()` → navigate đến `from` (preserved location) hoặc `/`.
- Đọc `location.state.from` để redirect sau login.

### S-04: Danh sách khóa học (`pages/courses/CoursesPage.tsx`)
- SearchBar với debounce 350ms.
- Query `courseApi.list()` với params `{ status: PUBLISHED, search, page, size: 12 }`.
- Grid 4 cột (xl) / 3 cột (lg) / 2 cột (sm).
- Pagination component.
- EmptyState khi không có kết quả.

### S-05: Chi tiết khóa học (`pages/course-detail/CourseDetailPage.tsx`)
- **CourseHero**: gradient dark, breadcrumb, title, subtitle, teacher/lessons/date info.
- **Sidebar card** (sticky): thumbnail, giá, EnrollButton.
- **EnrollButton** logic:
  - `null` → "Đăng ký" → gọi `enrollmentApi.create()` → navigate payment
  - `PENDING` → "Chờ duyệt" (disabled)
  - `APPROVED` → "Vào học ngay" → navigate learn page
  - `REJECTED` → "Từ chối" (disabled)
- **LessonOutline**: bảng bài học với type badge + thời lượng.
- **Description**: render HTML từ backend.

### S-06: Hướng dẫn thanh toán (`pages/payment/PaymentPage.tsx`)
- **CourseSummary**: thumbnail + title + giá.
- **BankInfoCard**: thông tin ngân hàng với nút copy từng trường, hỗ trợ template nội dung chuyển khoản.
- **QR Code**: nếu có `qrImageUrl`.
- **ReceiptUpload**: drag-drop ảnh, preview, upload qua `enrollmentApi.uploadPaymentProof()`.
- Màn hình thành công sau upload.
- Cảnh báo nếu không có enrollment đang PENDING.

### S-07: Khóa học của tôi (`pages/my-courses/MyCoursesPage.tsx`)
- Query enrollments status=APPROVED.
- Mỗi card query progress riêng để hiển thị tiến độ.
- ProgressBar trực quan.
- Nút "Bắt đầu" hoặc "Tiếp tục" → navigate đến bài học chưa hoàn thành.

### S-08: Đăng ký của tôi (`pages/my-enrollments/MyEnrollmentsPage.tsx`)
- Danh sách tất cả enrollments (mọi trạng thái).
- Status badge màu sắc: vàng/xanh/đỏ.
- Hiển thị ảnh chứng minh thanh toán nếu có.
- CTA: "Tải ảnh TT" (PENDING, chưa upload) / "Vào học" (APPROVED).
- Hiển thị lý do từ chối.

### S-09: Trang học (`pages/learn/LearnPage.tsx`)
- **Layout 2 cột**: LessonSidebar (320px, fixed) + Main content (flex-grow).
- **LessonSidebar**: course progress bar, danh sách bài với progress icons.
- **VideoPlayer** (wrapper quanh `ReactPlayer`):
  - Hỗ trợ UPLOAD (buildFileUrl + fileKey), YouTube, Vimeo.
  - `onProgress` callback: gọi `updateVideoProgress` mỗi 10 giây.
  - `onEnded`: gọi final progress update.
  - Disable download.
- **TextContent**: render HTML với `dangerouslySetInnerHTML`.
- **Navigation bar**: ← Bài trước / Bài tiếp → với lesson index display.
- Auto-call `markLessonOpen` khi mount/change lesson (useEffect).

### S-10: Thông tin cá nhân (`pages/profile/ProfilePage.tsx`)
- **ProfileForm**: Họ tên, Số điện thoại (email read-only). Avatar initials. Submit `authApi.updateMe()`.
- **ChangePasswordForm**: Mật khẩu cũ, mới, xác nhận. Submit `authApi.changePassword()`. Reset form sau thành công.
- Tách thành 2 component riêng trong cùng file.

---

## 8. Kỹ thuật & Quyết định thiết kế

### Auto-refresh Token
`axiosInstance` đã xử lý:
1. Request interceptor: attach `Authorization: Bearer {accessToken}`.
2. Response interceptor: khi nhận 401 → gọi `/auth/refresh` với `refreshToken` → cập nhật store → retry request gốc.
3. Queue: nhiều request đồng thời thất bại sẽ chờ 1 lần refresh duy nhất.

### Code Splitting
Tất cả pages dùng `lazy()` import trong router → chunks riêng biệt, tải theo demand.

### Video Progress Tracking
- Throttle 10 giây/lần để giảm API calls.
- Dùng `useRef` cho `watchedSeconds` và `lastReported` để tránh stale closure trong callback.
- Final call khi `onEnded`.

### Fallback Thumbnails
Dùng `placehold.co` API để generate placeholder image với màu primary khi khóa học không có thumbnail.

### Bootstrap 5 + Custom CSS
- Bootstrap classes cho layout, grid, forms, cards.
- CSS custom properties từ `global.css` cho màu sắc nhất quán.
- Inline style cho các giá trị pixel-specific (border-radius, width cố định...).

---

## 9. Files đã tạo/cập nhật

### Mới tạo (25 files)
| File | Loại |
|------|------|
| `src/shared/api/types.ts` | Type definition |
| `src/shared/api/auth.ts` | API module |
| `src/shared/api/courses.ts` | API module |
| `src/shared/api/enrollments.ts` | API module |
| `src/shared/api/progress.ts` | API module |
| `src/shared/api/config.ts` | API module |
| `src/shared/lib/format.ts` | Utility |
| `src/shared/ui/Spinner.tsx` | Component |
| `src/shared/ui/Badge.tsx` | Component |
| `src/shared/ui/EmptyState.tsx` | Component |
| `src/shared/ui/ProgressBar.tsx` | Component |
| `src/shared/ui/Pagination.tsx` | Component |
| `src/features/auth/AuthGuard.tsx` | Feature |
| `src/features/auth/GuestGuard.tsx` | Feature |
| `src/widgets/course-card/CourseCard.tsx` | Widget |
| `src/widgets/lesson-sidebar/LessonSidebar.tsx` | Widget |
| `src/entities/user/types.ts` | Entity type |

### Cập nhật (13 files)
| File | Thay đổi |
|------|----------|
| `src/shared/api/axiosInstance.ts` | Fix response.data.data → response.data |
| `src/entities/course/types.ts` | Mở rộng Course type |
| `src/entities/lesson/types.ts` | Mở rộng Lesson type |
| `src/entities/enrollment/types.ts` | Mở rộng Enrollment type |
| `src/widgets/header/Header.tsx` | Auth-aware nav, logout handling |
| `src/widgets/footer/Footer.tsx` | Real footer với 3 cột links |
| `src/app/router/index.tsx` | AuthGuard + GuestGuard layout routes |
| `src/pages/home/HomePage.tsx` | Full implementation S-01 |
| `src/pages/auth/LoginPage.tsx` | Full implementation S-03 |
| `src/pages/auth/RegisterPage.tsx` | Full implementation S-02 |
| `src/pages/courses/CoursesPage.tsx` | Full implementation S-04 |
| `src/pages/course-detail/CourseDetailPage.tsx` | Full implementation S-05 |
| `src/pages/payment/PaymentPage.tsx` | Full implementation S-06 |
| `src/pages/my-courses/MyCoursesPage.tsx` | Full implementation S-07 |
| `src/pages/my-enrollments/MyEnrollmentsPage.tsx` | Full implementation S-08 |
| `src/pages/learn/LearnPage.tsx` | Full implementation S-09 |
| `src/pages/profile/ProfilePage.tsx` | Full implementation S-10 |

---

## 10. Lưu ý vận hành

- **Môi trường**: Đặt `VITE_API_BASE_URL=http://localhost:8080` trong `.env.local`.
- **Bootstrap JS**: Các tính năng dropdown (navbar collapse, user dropdown) cần `bootstrap/dist/js/bootstrap.bundle.min.js`. Nếu dùng CDN hoặc chưa import JS, cần thêm `import 'bootstrap/dist/js/bootstrap.bundle.min'` vào `main.tsx`.
- **react-player**: Version 3.x, import `from 'react-player'` (default export).
- **Code chưa kiểm thử bằng mvn/vite build** do môi trường CI; toàn bộ code đã qua static analysis (TypeScript, ESLint) trong IDE — không có lỗi lint.
