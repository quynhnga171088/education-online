package com.lms.service;

import com.lms.dto.course.*;
import com.lms.dto.lesson.LessonResponse;
import com.lms.entity.*;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import com.lms.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository          courseRepository;
    private final LessonRepository          lessonRepository;
    private final EnrollmentRepository      enrollmentRepository;
    private final LessonProgressRepository  lessonProgressRepository;

    // ──────────────────────────────────────────────────────────────
    // Retrieval
    // ──────────────────────────────────────────────────────────────

    public Course getCourseOrThrow(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
    }

    public Course getCourseBySlugOrThrow(String slug) {
        return courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + slug));
    }

    /**
     * Public listing with optional enrollment status for authenticated students.
     */
    @Transactional(readOnly = true)
    public Page<CourseResponse> listCourses(Course.Status status, String search, User currentUser, Pageable pageable) {
        String q = (search == null || search.isBlank()) ? null : search.trim();
        Page<Course> page = courseRepository.findAllWithFilters(status, q, pageable);

        // Build enrollment map for authenticated students to add enrollmentStatus per course
        Map<Long, Enrollment.Status> enrollMap = buildEnrollmentMap(currentUser, page.getContent());

        return page.map(c -> {
            long lessonCount = lessonRepository.countByCourse(c);
            Enrollment.Status es = enrollMap.get(c.getId());
            return CourseResponse.fromEntity(c, lessonCount, es);
        });
    }

    /**
     * Public course detail + lesson list (access-level-aware).
     */
    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetail(String slugOrId, User currentUser) {
        Course course = resolveCourse(slugOrId);
        List<Lesson> lessons = lessonRepository.findAllByCourseOrderByOrderIndexAsc(course);

        boolean fullAccess = hasFullLessonAccess(course, currentUser);

        List<LessonResponse> lessonResponses = lessons.stream()
                .map(l -> fullAccess ? LessonResponse.fromEntityFull(l) : LessonResponse.fromEntityPreview(l))
                .toList();

        Enrollment.Status enrollmentStatus = null;
        if (currentUser != null && currentUser.getRole() == User.Role.STUDENT) {
            enrollmentStatus = enrollmentRepository
                    .findByStudentAndCourseAndStatus(currentUser, course, Enrollment.Status.APPROVED)
                    .map(e -> Enrollment.Status.APPROVED)
                    .orElseGet(() -> enrollmentRepository
                            .findByStudentAndCourseAndStatusIn(currentUser, course,
                                    List.of(Enrollment.Status.PENDING, Enrollment.Status.REJECTED))
                            .map(Enrollment::getStatus)
                            .orElse(null));
        }

        return CourseDetailResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .description(course.getDescription())
                .shortDescription(course.getShortDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .price(course.getPrice())
                .status(course.getStatus())
                .teacher(TeacherInfo.fromEntity(course.getTeacher()))
                .publishedAt(course.getPublishedAt())
                .createdAt(course.getCreatedAt())
                .enrollmentStatus(enrollmentStatus)
                .lessons(lessonResponses)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // Mutation
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public Course createCourse(CreateCourseRequest req, User creator) {
        String slug = generateUniqueSlug(req.getTitle());

        Course course = Course.builder()
                .title(req.getTitle())
                .slug(slug)
                .description(req.getDescription())
                .shortDescription(req.getShortDescription())
                .thumbnailUrl(req.getThumbnailUrl())
                .price(req.getPrice() != null ? req.getPrice() : java.math.BigDecimal.ZERO)
                .status(Course.Status.DRAFT)
                .teacher(creator)
                .createdBy(creator)
                .build();

        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourse(Long id, UpdateCourseRequest req, User currentUser) {
        Course course = getCourseOrThrow(id);
        checkWriteAccess(course, currentUser);

        if (req.getTitle() != null)            course.setTitle(req.getTitle());
        if (req.getDescription() != null)      course.setDescription(req.getDescription());
        if (req.getShortDescription() != null) course.setShortDescription(req.getShortDescription());
        if (req.getThumbnailUrl() != null)     course.setThumbnailUrl(req.getThumbnailUrl());
        if (req.getPrice() != null)            course.setPrice(req.getPrice());
        if (req.getStatus() != null) {
            if (req.getStatus() == Course.Status.PUBLISHED && course.getPublishedAt() == null) {
                course.setPublishedAt(LocalDateTime.now());
            }
            course.setStatus(req.getStatus());
        }

        return courseRepository.save(course);
    }

    @Transactional
    public void softDeleteCourse(Long id, User admin) {
        Course course = getCourseOrThrow(id);

        if (course.getStatus() != Course.Status.DRAFT) {
            throw new IllegalArgumentException("Only DRAFT courses can be deleted");
        }

        long enrollmentCount = enrollmentRepository.findAllWithFilters(
                null, course.getId(), null, Pageable.unpaged()).getTotalElements();
        if (enrollmentCount > 0) {
            throw new IllegalArgumentException("Cannot delete a course that has enrollments");
        }

        course.setDeletedAt(LocalDateTime.now());
        courseRepository.save(course);
    }

    // ──────────────────────────────────────────────────────────────
    // Students with progress (TEACHER endpoint)
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StudentWithProgressResponse> getStudentsWithProgress(Long courseId, User currentUser) {
        Course course = getCourseOrThrow(courseId);
        checkReadTeacherAccess(course, currentUser);

        List<Enrollment> approved = enrollmentRepository.findApprovedStudentsByCourse(course);
        long totalLessons = lessonRepository.countByCourse(course);

        return approved.stream().map(e -> {
            User student = e.getStudent();
            long completed = lessonProgressRepository.countCompletedByStudentAndCourse(student, course);
            double pct = totalLessons > 0 ? (double) completed / totalLessons * 100.0 : 0.0;

            return StudentWithProgressResponse.builder()
                    .id(student.getId())
                    .fullName(student.getFullName())
                    .email(student.getEmail())
                    .avatarUrl(student.getAvatarUrl())
                    .progressPercent(Math.round(pct * 10.0) / 10.0)
                    .completedLessons((int) completed)
                    .totalLessons((int) totalLessons)
                    .enrolledAt(e.getCreatedAt())
                    .build();
        }).toList();
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private String generateUniqueSlug(String title) {
        String base = SlugUtils.toSlug(title);
        if (base.isBlank()) base = "course";

        if (!courseRepository.existsBySlug(base)) return base;

        int counter = 2;
        String candidate;
        do {
            candidate = base + "-" + counter++;
        } while (courseRepository.existsBySlug(candidate));
        return candidate;
    }

    private Course resolveCourse(String slugOrId) {
        try {
            long id = Long.parseLong(slugOrId);
            return getCourseOrThrow(id);
        } catch (NumberFormatException e) {
            return getCourseBySlugOrThrow(slugOrId);
        }
    }

    private void checkWriteAccess(Course course, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (user.getRole() == User.Role.TEACHER && course.getTeacher().getId().equals(user.getId())) return;
        throw new SecurityException("Access denied: you do not own this course");
    }

    private void checkReadTeacherAccess(Course course, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (user.getRole() == User.Role.TEACHER && course.getTeacher().getId().equals(user.getId())) return;
        throw new SecurityException("Access denied");
    }

    private boolean hasFullLessonAccess(Course course, User currentUser) {
        if (currentUser == null) return false;
        if (currentUser.getRole() == User.Role.ADMIN) return true;
        if (currentUser.getRole() == User.Role.TEACHER) return true;
        // STUDENT: check APPROVED enrollment
        return enrollmentRepository.existsByStudentAndCourseAndStatusIn(
                currentUser, course, List.of(Enrollment.Status.APPROVED));
    }

    private Map<Long, Enrollment.Status> buildEnrollmentMap(User user, List<Course> courses) {
        if (user == null || user.getRole() != User.Role.STUDENT || courses.isEmpty()) {
            return Map.of();
        }
        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        return enrollmentRepository.findAllByStudentAndCourseIds(user, courseIds)
                .stream()
                .collect(Collectors.toMap(
                        e -> e.getCourse().getId(),
                        Enrollment::getStatus,
                        (a, b) -> a // keep first (should be unique per course)
                ));
    }
}
