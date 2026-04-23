package com.lms.service;

import com.lms.dto.report.*;
import com.lms.dto.user.UserResponse;
import com.lms.entity.*;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository           userRepository;
    private final CourseRepository         courseRepository;
    private final LessonRepository         lessonRepository;
    private final EnrollmentRepository     enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseService            courseService;

    // ──────────────────────────────────────────────────────────────
    // GET /admin/reports/overview  (ADMIN)
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OverviewReportResponse getOverview() {
        List<Object[]> topRaw = enrollmentRepository.findTopCoursesByEnrollmentCount(PageRequest.of(0, 5));
        List<TopCourseItem> topCourses = topRaw.stream()
                .map(row -> TopCourseItem.builder()
                        .courseId(toLong(row[0]))
                        .title((String) row[1])
                        .slug((String) row[2])
                        .thumbnailUrl((String) row[3])
                        .enrollmentCount(toLong(row[4]))
                        .build())
                .toList();

        return OverviewReportResponse.builder()
                .totalStudents(userRepository.countByRoleAndDeletedAtIsNull(User.Role.STUDENT))
                .totalTeachers(userRepository.countByRoleAndDeletedAtIsNull(User.Role.TEACHER))
                .totalPublishedCourses(courseRepository.countByStatus(Course.Status.PUBLISHED))
                .totalDraftCourses(courseRepository.countByStatus(Course.Status.DRAFT))
                .totalArchivedCourses(courseRepository.countByStatus(Course.Status.ARCHIVED))
                .totalEnrollmentsPending(enrollmentRepository.countByStatus(Enrollment.Status.PENDING))
                .totalEnrollmentsApproved(enrollmentRepository.countByStatus(Enrollment.Status.APPROVED))
                .totalEnrollmentsRejected(enrollmentRepository.countByStatus(Enrollment.Status.REJECTED))
                .totalLessonsCompleted(lessonProgressRepository.countByStatus(LessonProgress.Status.COMPLETED))
                .topCourses(topCourses)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // GET /admin/reports/courses/:id  (TEACHER own course / ADMIN)
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CourseReportResponse getCourseReport(Long courseId, User currentUser) {
        Course course = courseService.getCourseOrThrow(courseId);
        checkCourseAccess(course, currentUser);

        long totalLessons = lessonRepository.countByCourse(course);
        long totalEnrollments = enrollmentRepository.countByCourse(course);
        long approvedEnrollments = enrollmentRepository
                .findAllWithFilters(Enrollment.Status.APPROVED, courseId, null, PageRequest.of(0, 1))
                .getTotalElements();
        long pendingEnrollments = enrollmentRepository
                .findAllWithFilters(Enrollment.Status.PENDING, courseId, null, PageRequest.of(0, 1))
                .getTotalElements();
        long rejectedEnrollments = enrollmentRepository
                .findAllWithFilters(Enrollment.Status.REJECTED, courseId, null, PageRequest.of(0, 1))
                .getTotalElements();

        // Enrollment by month (last 12 months)
        LocalDateTime from = LocalDateTime.now().minusMonths(12).withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0);
        List<Object[]> monthlyRaw = enrollmentRepository.countEnrollmentsByMonth(courseId, from);
        List<MonthlyCountItem> byMonth = monthlyRaw.stream()
                .map(row -> MonthlyCountItem.builder()
                        .year(toInt(row[0]))
                        .month(toInt(row[1]))
                        .count(toLong(row[2]))
                        .build())
                .toList();

        // Lesson completion stats
        List<Object[]> completionRaw = lessonProgressRepository
                .findLessonCompletionStatsByCourse(courseId, LessonProgress.Status.COMPLETED);
        List<LessonCompletionStat> completionStats = completionRaw.stream()
                .map(row -> LessonCompletionStat.builder()
                        .lessonId(toLong(row[0]))
                        .lessonTitle((String) row[1])
                        .completedCount(toLong(row[2]))
                        .build())
                .toList();

        return CourseReportResponse.builder()
                .courseId(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .totalLessons(totalLessons)
                .totalEnrollments(totalEnrollments)
                .approvedEnrollments(approvedEnrollments)
                .pendingEnrollments(pendingEnrollments)
                .rejectedEnrollments(rejectedEnrollments)
                .enrollmentsByMonth(byMonth)
                .lessonCompletionStats(completionStats)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // GET /admin/reports/students/:id  (ADMIN)
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StudentReportResponse getStudentReport(Long studentId) {
        User student = userRepository.findByIdAndDeletedAtIsNull(studentId)
                .orElseThrow(() -> new com.lms.exception.ResourceNotFoundException("User", studentId));

        List<Enrollment> enrollments = enrollmentRepository.findAllByStudent(student);

        List<StudentCourseProgress> courses = enrollments.stream().map(e -> {
            Course course = e.getCourse();
            long total = lessonRepository.countByCourse(course);
            long completed = lessonProgressRepository.countCompletedByStudentAndCourse(student, course);
            double pct = total > 0 ? Math.round((double) completed / total * 1000.0) / 10.0 : 0.0;

            return StudentCourseProgress.builder()
                    .courseId(course.getId())
                    .title(course.getTitle())
                    .slug(course.getSlug())
                    .thumbnailUrl(course.getThumbnailUrl())
                    .enrollmentStatus(e.getStatus())
                    .progressPercent(pct)
                    .completedLessons(completed)
                    .totalLessons(total)
                    .enrolledAt(e.getCreatedAt())
                    .build();
        }).toList();

        return StudentReportResponse.builder()
                .student(UserResponse.fromEntity(student))
                .courses(courses)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private void checkCourseAccess(Course course, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (user.getRole() == User.Role.TEACHER && course.getTeacher().getId().equals(user.getId())) return;
        throw new SecurityException("Access denied");
    }

    private static long toLong(Object o) {
        if (o instanceof Number n) return n.longValue();
        return 0L;
    }

    private static int toInt(Object o) {
        if (o instanceof Number n) return n.intValue();
        return 0;
    }
}
