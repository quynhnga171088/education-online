# Phase 6 — Admin Panel

**Mục tiêu:** Xây dựng toàn bộ Admin Panel với Feature-Sliced Design (FSD), 14 màn hình, sử dụng React 19, TypeScript, Bootstrap 5, TanStack Query, Zustand, @dnd-kit, TipTap, Recharts.

---

## 1. Tổng quan kiến trúc

Admin Panel nằm trong thư mục `admin/` với FSD architecture:

```
admin/src/
├── app/
│   ├── router/index.tsx      # 14 routes; Login riêng, còn lại dùng AdminLayout
│   └── styles/global.css     # Admin design tokens, sidebar/layout CSS
│
├── pages/                    # 14 trang (A-01 → A-14)
├── widgets/
│   └── admin-layout/         # Sidebar + auth guard + role-based nav
│
├── shared/
│   ├── api/                  # axiosInstance + 8 API modules
│   ├── lib/format.ts         # formatPrice, formatDate, buildFileUrl, monthLabel
│   ├── store/authStore.ts    # Zustand auth (TEACHER | ADMIN only)
│   ├── ui/                   # Spinner, Badge, EmptyState, Pagination, ConfirmModal, StatsCard
│   └── config/               # APP_CONFIG, API_BASE_URL
```

---

## 2. Shared Infrastructure

### 2.1 Fix `axiosInstance.ts`
- **Lỗi**: Response interceptor khi refresh token dùng `data.data` sai → sửa thành `const { accessToken, refreshToken, user } = data` và gọi `setAuth(user, newAt, newRt)`.

### 2.2 Shared API Modules (8 files mới)

| File | Endpoints Backend |
|------|-------------------|
| `types.ts` | `PageResponse<T>` (Spring page shape) |
| `auth.ts` | POST /auth/login, POST /auth/logout, GET /auth/me |
| `courses.ts` | GET/POST /courses, GET/PATCH/DELETE /courses/:id |
| `lessons.ts` | GET/POST /courses/:cid/lessons, GET/PATCH/DELETE /courses/:cid/lessons/:id, PUT /courses/:cid/lessons/reorder |
| `enrollments.ts` | GET /enrollments (admin), GET /enrollments/:id, PATCH /enrollments/:id/approve, PATCH /enrollments/:id/reject |
| `users.ts` | GET /admin/users, GET/PATCH/DELETE /admin/users/:id, POST /admin/users |
| `reports.ts` | GET /admin/reports/overview, /admin/reports/courses/:id, /admin/reports/students/:id |
| `config.ts` | GET /admin/config, PATCH /admin/config/:key, GET/PUT /admin/config/bank-info |
| `upload.ts` | POST /upload/video (with `onUploadProgress`), POST /upload/image |

### 2.3 Shared Lib

**`shared/lib/format.ts`** (mới):
- `formatPrice(value)` → VND hoặc "Miễn phí"
- `formatDate(iso)` / `formatDateTime(iso)` → vi-VN locale
- `buildFileUrl(fileKey)` → `${API_BASE_URL}/uploads/{fileKey}`
- `monthLabel(year, month)` → "T01/2025" cho recharts

### 2.4 Shared UI Components (6 mới)

| Component | Chức năng |
|-----------|-----------|
| `Spinner.tsx` | Loading spinner + `PageSpinner` |
| `Badge.tsx` | Badge + `statusBadge(status)` helper cho enrollment/user/course status |
| `EmptyState.tsx` | Trạng thái rỗng với icon/title/action |
| `Pagination.tsx` | Phân trang (0-indexed, Spring) |
| `ConfirmModal.tsx` | Modal xác nhận với optional textarea (dùng cho reject note) |
| `StatsCard.tsx` | Card chỉ số với icon, value, label, optional sub-text, màu sắc |

---

## 3. AdminLayout (cập nhật)

**`widgets/admin-layout/AdminLayout.tsx`**

**Auth guard:**
- Kiểm tra `isAuthenticated` và `user.role` từ Zustand store.
- Nếu không auth hoặc role không hợp lệ (không phải ADMIN/TEACHER) → `<Navigate to="/login" replace />`.
- Gọi `authApi.logout(refreshToken)` trước khi xóa store khi logout.

**Role-based nav:**
- ADMIN thấy: Dashboard, Khóa học, Đăng ký học, Người dùng, Báo cáo, Cấu hình.
- TEACHER thấy: Dashboard, Khóa học, Đăng ký học, Báo cáo (chỉ 4 mục, không có Users/Settings).

**User info bar** (cuối sidebar): Avatar initials, tên, email, nút đăng xuất.

---

## 4. Trang đăng nhập A-01

**`pages/login/LoginPage.tsx`**

- Kiểm tra `isAuthenticated` → redirect về `/` nếu đã đăng nhập.
- Form email + password, gọi `authApi.login()`.
- Validate role: chỉ ADMIN/TEACHER mới được vào. Học viên sẽ nhận lỗi "Tài khoản không có quyền truy cập admin."
- UI: Full-screen gradient indigo background + card trắng trung tâm.

---

## 5. Dashboard A-02

**`pages/dashboard/DashboardPage.tsx`**

- Query `reportApi.getOverview()`.
- **6 StatsCard**: Học viên, Khóa học (kèm đã xuất bản), Đã duyệt, Chờ duyệt, Giáo viên, Bài học hoàn thành.
- **Recharts BarChart**: Top 10 khóa học theo số đăng ký (trục X xoay 30° để chứa tên dài).
- **Quick actions panel**: 5 link tắt đến tính năng chính.
- **Top courses table**: Danh sách chi tiết với nút "Xem báo cáo →".

---

## 6. Quản lý khóa học (A-03/04/05)

### A-03: `pages/courses/CoursesListPage.tsx`
- Bảng dữ liệu với: Thumbnail (mini), Title+Slug, Teacher, Giá, Status badge, Lesson count, Ngày tạo.
- Search bar với `queryKey` debounce (TanStack Query).
- Actions: 📋 (Curriculum), ✏️ (Edit), 🗑️ (Delete với ConfirmModal).
- Pagination.

### A-04: `pages/courses/CourseCreatePage.tsx`
- Form: Title, Short Description, Description (textarea), Price, Status selector.
- Thumbnail: chọn file upload (qua `uploadApi.image`) hoặc nhập URL.
- Upload progress bar (linear).
- Sau tạo thành công → redirect đến `/courses/:id/curriculum`.

### A-05: `pages/courses/CourseEditPage.tsx`
- Load course hiện tại từ API → pre-fill form.
- Các fields giống A-04.
- Header có nút "📋 Quản lý bài học" → navigate đến curriculum.

---

## 7. Curriculum & Lesson (A-06/07/08)

### A-06: `pages/curriculum/CurriculumPage.tsx`

**Drag-and-drop với @dnd-kit:**
```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
```
- Mỗi lesson là `SortableLesson` component dùng `useSortable({ id: lesson.id })`.
- Transform CSS computed thủ công: `translate3d(${transform.x}px, ${transform.y}px, 0)` (không cần `@dnd-kit/utilities`).
- Kéo handle `⠿` drag bài học → `arrayMove()` → update state → gọi `lessonApi.reorder()` (optimistic update).
- Nếu reorder API lỗi → rollback về `remoteLessons`.
- Actions mỗi dòng: ✏️ Edit, 🗑️ Delete.

### A-07: `pages/lessons/LessonCreatePage.tsx`

**TipTap Rich Text Editor:**
```tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
const editor = useEditor({
  extensions: [StarterKit],
  content: '',
  onUpdate: ({ editor }) => setForm(f => ({ ...f, textContent: editor.getHTML() })),
})
```
- Toolbar component với các nút: B, I, H2, H3, • List, 1. List, Code, ---, Undo.

**Video Uploader component (dùng cho UPLOAD source):**
- File input + Upload button.
- Progress bar realtime từ `uploadApi.video()` với `onUploadProgress`.
- Hiển thị `fileKey` sau upload thành công.

**Form fields:**
- Loại bài học: VIDEO / TEXT.
- Trạng thái: DRAFT / PUBLISHED.
- Điều kiện hoàn thành: OPEN / VIDEO_50.
- Nếu VIDEO: Nguồn (YouTube/Vimeo/Drive/Upload), URL hoặc file.
- Nếu TEXT: TipTap editor.

### A-08: `pages/lessons/LessonEditPage.tsx`
- Load lesson hiện tại, pre-fill editor với `editor.commands.setContent(lesson.textContent)`.
- Xử lý replace video: upload file mới → `set('videoFileKey', newKey)`.
- Tương tự A-07 nhưng cho edit.

---

## 8. Quản lý đăng ký (A-09)

**`pages/enrollments/EnrollmentsPage.tsx`**

- **Tab filters**: ⏳ Chờ duyệt | ✅ Đã duyệt | ❌ Từ chối | 🗂️ Tất cả.
- Bảng: Học viên (tên + email), Khóa học, Giá, Ngày đăng ký, Trạng thái, Biên lai, Thao tác.
- **Xem biên lai**: Modal nội trang hiển thị ảnh PaymentProof full-size + nút "Mở ảnh gốc".
- **Duyệt**: ConfirmModal → `enrollmentApi.approve(id)`.
- **Từ chối**: ConfirmModal với textarea nhập lý do → `enrollmentApi.reject(id, note)`.
- Chỉ hiển thị actions Duyệt/Từ chối cho status PENDING; show ngày xét duyệt cho status khác.

---

## 9. Quản lý người dùng (A-10/11)

### A-10: `pages/users/UsersPage.tsx`
- Bảng: ID, Avatar initials, Tên, Email, Vai trò badge, Trạng thái badge, Ngày tạo.
- Filter: Search (tên/email) + Role dropdown.
- Actions: ✏️ Edit, 🗑️ Delete (không cho xóa ADMIN).
- ConfirmModal để confirm xóa.

### A-11: `pages/users/UserFormPage.tsx`
- **Create mode** (khi không có `:id`): Họ tên, Email, Mật khẩu → gọi `userApi.createTeacher()`.
- **Edit mode** (khi có `:id`): Load user → pre-fill. Cho sửa Họ tên, Vai trò, Trạng thái. Email read-only.
- Validation frontend đơn giản (kiểm tra không rỗng).

---

## 10. Báo cáo (A-12/13)

### A-12: `pages/reports/ReportsPage.tsx`
- **6 StatsCard**: Students, Teachers, Courses, Approved, Pending, Completed Lessons.
- **BarChart (Recharts)**: Top courses by enrollment count với trục X nghiêng 35°.
- **Detail table**: Top courses với nút "Báo cáo chi tiết →".

### A-13: `pages/reports/CourseReportPage.tsx`
- Nhận `courseId` từ URL param.
- **3 summary cards**: Tổng đăng ký, Đã duyệt, Số bài học.
- **BarChart**: `monthlyTrend` → `[{ name: 'T01/2025', enrollments: N }]`. Dùng `monthLabel()` để format.
- **Lesson completion table**: Tên bài học, Completed/Total, Progress bar + % tỉ lệ.

---

## 11. Cấu hình hệ thống (A-14)

**`pages/settings/SettingsPage.tsx`**

### SystemConfigs section:
- Load toàn bộ configs từ `configApi.list()`.
- Mỗi config có: key badge, description, input + "Lưu" button.
- Disabled khi giá trị chưa thay đổi (optimistic equality check).
- Hiển thị "✅ Đã lưu" 2 giây sau khi thành công.

### BankInfoForm section:
- Fields: Tên ngân hàng, Số TK, Chủ TK, Chi nhánh, Nội dung CK mẫu.
- QR Image: upload file hoặc URL, preview inline.
- Gọi `configApi.updateBankInfo()` để lưu.

---

## 12. Router (không thay đổi)

Router đã được cấu hình sẵn trong `app/router/index.tsx`:
- `/login` → LoginPage (không có AdminLayout).
- `/` → AdminLayout (wrapper, có auth guard trong component).
- Tất cả admin routes là children của AdminLayout.

---

## 13. Files đã tạo / cập nhật

### Cập nhật existing (2 files)
| File | Thay đổi |
|------|---------|
| `shared/api/axiosInstance.ts` | Fix `data.data` → `data`, gọi `setAuth` đúng |
| `widgets/admin-layout/AdminLayout.tsx` | Auth guard, role-based nav, user info, logout với API call |

### Mới tạo (30 files)

**Shared API (8):**
- `shared/api/types.ts`
- `shared/api/auth.ts`
- `shared/api/courses.ts`
- `shared/api/lessons.ts`
- `shared/api/enrollments.ts`
- `shared/api/users.ts`
- `shared/api/reports.ts`
- `shared/api/config.ts`
- `shared/api/upload.ts`

**Shared Lib (1):**
- `shared/lib/format.ts`

**Shared UI (6):**
- `shared/ui/Spinner.tsx`
- `shared/ui/Badge.tsx`
- `shared/ui/EmptyState.tsx`
- `shared/ui/Pagination.tsx`
- `shared/ui/ConfirmModal.tsx`
- `shared/ui/StatsCard.tsx`

**Pages (14):**
- `pages/login/LoginPage.tsx` — A-01
- `pages/dashboard/DashboardPage.tsx` — A-02
- `pages/courses/CoursesListPage.tsx` — A-03
- `pages/courses/CourseCreatePage.tsx` — A-04
- `pages/courses/CourseEditPage.tsx` — A-05
- `pages/curriculum/CurriculumPage.tsx` — A-06
- `pages/lessons/LessonCreatePage.tsx` — A-07
- `pages/lessons/LessonEditPage.tsx` — A-08
- `pages/enrollments/EnrollmentsPage.tsx` — A-09
- `pages/users/UsersPage.tsx` — A-10
- `pages/users/UserFormPage.tsx` — A-11
- `pages/reports/ReportsPage.tsx` — A-12
- `pages/reports/CourseReportPage.tsx` — A-13
- `pages/settings/SettingsPage.tsx` — A-14

---

## 14. Kỹ thuật & Quyết định thiết kế

### @dnd-kit Transform
Thay vì dùng `@dnd-kit/utilities` (không có trong package.json), tính transform thủ công:
```tsx
const style = {
  transform: transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined,
  transition,
}
```

### TipTap v3 Editor
```tsx
const editor = useEditor({
  extensions: [StarterKit],
  content: existingContent,
  onUpdate: ({ editor }) => onChange(editor.getHTML()),
})
```
`EditorContent` + custom toolbar (B, I, H2, H3, lists, code, hr, undo). Render HTML từ backend dùng `editor.commands.setContent()`.

### Video Upload Progress
```tsx
uploadApi.video(file, courseId, (pct) => setUploadPct(pct))
// axios onUploadProgress: pct = Math.round(100 * loaded / total)
```
Progress bar realtime với Bootstrap `.progress-bar`.

### Role-based Access
AdminLayout filter nav items theo `user.role`:
- ADMIN: tất cả 6 nav items
- TEACHER: chỉ Dashboard, Khóa học, Đăng ký học, Báo cáo

### Recharts Bar Charts
- `<ResponsiveContainer width="100%" height={N}>` cho responsive.
- Trục X có `angle={-30}` hoặc `-35` để tên khóa học không bị cắt.
- `margin={{ bottom: 40-50 }}` để chứa rotated labels.

---

## 15. Lưu ý vận hành

- **`VITE_API_BASE_URL`**: Set trong `admin/.env.local` → `http://localhost:8080`
- **Port**: Admin dev server chạy mặc định trên port 5174 (Vite sẽ tự increment nếu 5173 đã dùng)
- **@tiptap/starter-kit v3**: API tương thích với v2; StarterKit bao gồm Bold, Italic, Heading, BulletList, OrderedList, Code, HorizontalRule, Undo/Redo
- **recharts v3**: API giữ nguyên từ v2 cho các components cơ bản (BarChart, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer)
- **Tất cả code đã qua TypeScript & ESLint static check** — không có lỗi lint
