package com.lms.controller.admin;

import com.lms.dto.admin.AdminUserDetailResponse;
import com.lms.dto.admin.CreateTeacherRequest;
import com.lms.dto.admin.EnrollmentSummaryResponse;
import com.lms.dto.admin.UpdateUserAdminRequest;
import com.lms.dto.user.UserResponse;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.repository.EnrollmentRepository;
import com.lms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final EnrollmentRepository enrollmentRepository;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> list(
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) User.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserResponse> res = userService.listUsers(role, status, search, pageable).map(UserResponse::fromEntity);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailResponse> detail(@PathVariable Long id) {
        User user = userService.getByIdOrThrow(id);
        List<Enrollment> recent = enrollmentRepository.findRecentByStudent(user, PageRequest.of(0, 10));
        List<EnrollmentSummaryResponse> recentRes = recent.stream().map(EnrollmentSummaryResponse::fromEntity).toList();

        return ResponseEntity.ok(
                AdminUserDetailResponse.builder()
                        .user(UserResponse.fromEntity(user))
                        .recentEnrollments(recentRes)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<UserResponse> createTeacher(@Valid @RequestBody CreateTeacherRequest req) {
        User created = userService.createTeacher(req.getEmail(), req.getPassword(), req.getFullName(), req.getPhone());
        return ResponseEntity.ok(UserResponse.fromEntity(created));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateUserAdminRequest req) {
        User updated = userService.updateRoleStatus(id, req.getRole(), req.getStatus());
        return ResponseEntity.ok(UserResponse.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}

