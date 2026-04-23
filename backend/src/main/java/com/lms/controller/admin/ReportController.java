package com.lms.controller.admin;

import com.lms.dto.report.CourseReportResponse;
import com.lms.dto.report.OverviewReportResponse;
import com.lms.dto.report.StudentReportResponse;
import com.lms.entity.User;
import com.lms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** ADMIN: platform-wide overview — total users, courses, enrollments, progress, top 5 courses. */
    @GetMapping("/overview")
    public ResponseEntity<OverviewReportResponse> overview() {
        return ResponseEntity.ok(reportService.getOverview());
    }

    /**
     * TEACHER (own course) or ADMIN: lesson stats + enrollment counts by month.
     * NOTE: SecurityConfig grants TEACHER access to this endpoint specifically.
     */
    @GetMapping("/courses/{courseId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<CourseReportResponse> courseReport(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        User currentUser = requireUser(authentication);
        return ResponseEntity.ok(reportService.getCourseReport(courseId, currentUser));
    }

    /** ADMIN: student-specific course progress across all their enrollments. */
    @GetMapping("/students/{studentId}")
    public ResponseEntity<StudentReportResponse> studentReport(@PathVariable Long studentId) {
        return ResponseEntity.ok(reportService.getStudentReport(studentId));
    }

    // ──────────────────────────────────────────────────────────────
    private User requireUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        throw new SecurityException("Unauthorized");
    }
}
