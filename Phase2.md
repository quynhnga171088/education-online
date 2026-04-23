# Phase 2 — Backend: Auth & User Management APIs

**Mục tiêu:** Hoàn thiện Module Auth (`/auth`) và Admin Users (`/admin/users`) theo `implementation_plan.md`.

---

## 1) Bổ sung Soft Delete cho `users` (để support `DELETE /admin/users/:id`)

- **Tạo migration**: `backend/src/main/resources/db/migration/V12__add_deleted_at_to_users.sql`
  - Thêm cột `deleted_at TIMESTAMP`
  - Thêm index `idx_users_deleted_at`

- **Cập nhật entity**: `backend/src/main/java/com/lms/entity/User.java`
  - Thêm field `deletedAt`

- **Cập nhật repository**: `backend/src/main/java/com/lms/repository/UserRepository.java`
  - Đổi sang các method “chỉ lấy user chưa bị xoá”:
    - `findByEmailAndDeletedAtIsNull`
    - `existsByEmailAndDeletedAtIsNull`
    - `findByIdAndDeletedAtIsNull`
  - Update query `findAllWithFilters(...)` để luôn thêm điều kiện `u.deletedAt IS NULL`

- **Cập nhật security/user loading**
  - `backend/src/main/java/com/lms/security/UserDetailsServiceImpl.java`: dùng `findByEmailAndDeletedAtIsNull`
  - `backend/src/main/java/com/lms/security/JwtAuthenticationFilter.java`: dùng `findByIdAndDeletedAtIsNull`

---

## 2) Auth Module (`/auth`)

### 2.1 DTOs cho Auth

Tạo mới các DTO:

- `backend/src/main/java/com/lms/dto/auth/RegisterRequest.java`
- `backend/src/main/java/com/lms/dto/auth/LoginRequest.java`
- `backend/src/main/java/com/lms/dto/auth/RefreshTokenRequest.java`
- `backend/src/main/java/com/lms/dto/auth/LogoutRequest.java`
- `backend/src/main/java/com/lms/dto/auth/UpdateProfileRequest.java`
- `backend/src/main/java/com/lms/dto/auth/ChangePasswordRequest.java`
- `backend/src/main/java/com/lms/dto/auth/AuthResponse.java`

Và DTO dùng chung cho user:

- `backend/src/main/java/com/lms/dto/user/UserResponse.java`

### 2.2 Service Auth

- **Tạo mới** `backend/src/main/java/com/lms/service/AuthService.java`
  - `registerStudent(...)`: tạo user role `STUDENT` + issue token pair
  - `login(...)`: authenticate bằng `AuthenticationManager`, check `status`, issue token pair
  - `refresh(...)`: gọi `RefreshTokenService.rotateRefreshToken(...)` để **token rotation**, sau đó tạo access token mới
  - `logout(...)`: revoke refresh token hiện tại

### 2.3 Controller Auth

- **Tạo mới** `backend/src/main/java/com/lms/controller/AuthController.java`
  - `POST /auth/register`: tạo user STUDENT, trả `accessToken + refreshToken + user`
  - `POST /auth/login`: trả `accessToken + refreshToken + user`
  - `POST /auth/logout`: revoke refresh token (body có `refreshToken`)
  - `POST /auth/refresh`: rotate refresh token, trả token pair mới
  - `GET /auth/me`: trả thông tin user từ JWT
  - `PATCH /auth/me`: update `fullName/phone/avatarUrl`
  - `POST /auth/change-password`: validate `oldPassword`, update `passwordHash`

**Ghi chú**:
- `GET/PATCH /auth/me` và `change-password` dùng `Authentication` principal là `com.lms.entity.User` (được set bởi `JwtAuthenticationFilter`).

---

## 3) Admin Users Module (`/admin/users`)

### 3.1 DTOs cho Admin Users

Tạo mới:

- `backend/src/main/java/com/lms/dto/admin/CreateTeacherRequest.java`
- `backend/src/main/java/com/lms/dto/admin/UpdateUserAdminRequest.java`
- `backend/src/main/java/com/lms/dto/admin/EnrollmentSummaryResponse.java`
- `backend/src/main/java/com/lms/dto/admin/AdminUserDetailResponse.java`

### 3.2 Recent enrollments cho user detail

- **Cập nhật** `backend/src/main/java/com/lms/repository/EnrollmentRepository.java`
  - Thêm query `findRecentByStudent(student, pageable)` (JOIN FETCH `course`, order `createdAt DESC`)

### 3.3 Service Users

- **Tạo mới** `backend/src/main/java/com/lms/service/UserService.java`
  - `listUsers(...)`: phân trang + filter theo `role/status/search` (chỉ user `deleted_at IS NULL`)
  - `getByIdOrThrow(...)`: chỉ lấy user chưa xoá
  - `createTeacher(...)`: admin tạo TEACHER account
  - `updateRoleStatus(...)`: đổi role/status; nếu BLOCKED thì revoke all refresh tokens
  - `softDelete(...)`: set `deletedAt=now` + revoke all refresh tokens

### 3.4 Controller Admin Users

- **Tạo mới** `backend/src/main/java/com/lms/controller/admin/UserController.java`
  - `GET /admin/users`: phân trang + filter `role/status/search`
  - `GET /admin/users/{id}`: user detail + `recentEnrollments` (10 gần nhất)
  - `POST /admin/users`: tạo TEACHER
  - `PATCH /admin/users/{id}`: đổi role + status
  - `DELETE /admin/users/{id}`: soft delete (set `deleted_at`)

---

## 4) Chuẩn hoá response lỗi API (để debug dễ hơn)

- **Tạo mới**:
  - `backend/src/main/java/com/lms/exception/ApiError.java`
  - `backend/src/main/java/com/lms/exception/GlobalExceptionHandler.java`

Handler hiện hỗ trợ:
- Validation lỗi (`MethodArgumentNotValidException`) → 400
- `IllegalArgumentException` → 400
- `SecurityException` → 401
- Lỗi còn lại → 500

---

## 5) Kiểm tra nhanh

- Workspace hiện **không có Maven CLI (`mvn`)** nên không thể compile/build trực tiếp trong môi trường chạy agent.
- Mình đã kiểm tra static bằng cách:
  - đảm bảo các import/đường dẫn class hợp lệ
  - đảm bảo repository methods được cập nhật đồng bộ (không còn chỗ gọi `findByEmail(...)`/`existsByEmail(...)` cũ)
  - chạy lint trong IDE cho các file vừa chỉnh (không phát hiện lỗi)

