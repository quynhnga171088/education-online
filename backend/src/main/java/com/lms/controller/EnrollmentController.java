package com.lms.controller;

import com.lms.dto.enrollment.CreateEnrollmentRequest;
import com.lms.dto.enrollment.EnrollmentResponse;
import com.lms.dto.enrollment.RejectEnrollmentRequest;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * STUDENT: own enrollments + progress.
     * ADMIN: all enrollments with filter.
     */
    @GetMapping
    public ResponseEntity<Page<EnrollmentResponse>> list(
            @RequestParam(required = false) Enrollment.Status status,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        User user = requireUser(authentication);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (user.getRole() == User.Role.STUDENT) {
            return ResponseEntity.ok(enrollmentService.listForStudent(user, pageable));
        } else {
            return ResponseEntity.ok(enrollmentService.listForAdmin(status, courseId, studentId, pageable));
        }
    }

    /** Authenticated — STUDENT or ADMIN can view. */
    @GetMapping("/{id}")
    public ResponseEntity<EnrollmentResponse> detail(@PathVariable Long id, Authentication authentication) {
        User user = requireUser(authentication);
        return ResponseEntity.ok(enrollmentService.getById(id, user));
    }

    /** STUDENT: create an enrollment for a course. */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentResponse> create(
            @Valid @RequestBody CreateEnrollmentRequest req,
            Authentication authentication
    ) {
        User student = requireUser(authentication);
        return ResponseEntity.ok(enrollmentService.createEnrollment(req.getCourseId(), student));
    }

    /**
     * STUDENT: upload payment receipt (image).
     * Multipart field name: "file"
     */
    @PostMapping(value = "/{id}/payment-proof", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentResponse> uploadPaymentProof(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        User student = requireUser(authentication);
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        return ResponseEntity.ok(enrollmentService.uploadPaymentProof(id, file, student));
    }

    /** ADMIN: approve an enrollment. */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EnrollmentResponse> approve(@PathVariable Long id, Authentication authentication) {
        User admin = requireUser(authentication);
        return ResponseEntity.ok(enrollmentService.approve(id, admin));
    }

    /** ADMIN: reject an enrollment with optional note. */
    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EnrollmentResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) RejectEnrollmentRequest req,
            Authentication authentication
    ) {
        User admin = requireUser(authentication);
        String note = req != null ? req.getNote() : null;
        return ResponseEntity.ok(enrollmentService.reject(id, note, admin));
    }

    // ──────────────────────────────────────────────────────────────
    private User requireUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        throw new SecurityException("Unauthorized");
    }
}
