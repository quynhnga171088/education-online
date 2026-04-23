package com.lms.service;

import com.lms.dto.attachment.AttachmentResponse;
import com.lms.dto.lesson.*;
import com.lms.entity.*;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository         lessonRepository;
    private final LessonAttachmentRepository attachmentRepository;
    private final EnrollmentRepository     enrollmentRepository;
    private final CourseService            courseService;

    // ──────────────────────────────────────────────────────────────
    // Retrieval
    // ──────────────────────────────────────────────────────────────

    /**
     * Lists lessons for a course. Access-aware:
     * - Unauthenticated / unenrolled student → preview fields only
     * - Enrolled student / Teacher / Admin   → full data
     */
    @Transactional(readOnly = true)
    public List<LessonResponse> listLessons(Long courseId, User currentUser) {
        Course course = courseService.getCourseOrThrow(courseId);
        List<Lesson> lessons = lessonRepository.findAllByCourseOrderByOrderIndexAsc(course);

        boolean full = hasFullAccess(course, currentUser);
        return lessons.stream()
                .map(l -> full ? LessonResponse.fromEntityFull(l) : LessonResponse.fromEntityPreview(l))
                .toList();
    }

    /**
     * Gets a single lesson detail with attachments.
     * Student requires APPROVED enrollment.
     */
    @Transactional(readOnly = true)
    public LessonDetailResponse getLessonDetail(Long courseId, Long lessonId, User currentUser) {
        Course course = courseService.getCourseOrThrow(courseId);
        Lesson lesson = getLessonOrThrow(lessonId, course);

        requireDetailAccess(course, currentUser);

        List<AttachmentResponse> attachments = attachmentRepository
                .findAllByLessonOrderByOrderIndexAsc(lesson)
                .stream()
                .map(AttachmentResponse::fromEntity)
                .toList();

        return LessonDetailResponse.fromEntity(lesson, attachments);
    }

    // ──────────────────────────────────────────────────────────────
    // Mutation (Teacher / Admin)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public Lesson createLesson(Long courseId, CreateLessonRequest req, User teacher) {
        Course course = courseService.getCourseOrThrow(courseId);
        checkTeacherWriteAccess(course, teacher);
        validateLessonRequest(req.getType(), req.getVideoSourceType(), req.getVideoUrl(), req.getVideoFileKey());

        int nextOrder = lessonRepository.findMaxOrderIndexByCourse(course) + 1;

        Lesson lesson = Lesson.builder()
                .course(course)
                .title(req.getTitle())
                .description(req.getDescription())
                .orderIndex(nextOrder)
                .type(req.getType())
                .status(req.getStatus() != null ? req.getStatus() : Lesson.Status.PUBLISHED)
                .textContent(req.getTextContent())
                .videoSourceType(req.getVideoSourceType())
                .videoUrl(req.getVideoUrl())
                .videoFileKey(req.getVideoFileKey())
                .videoDurationSeconds(req.getVideoDurationSeconds())
                .build();

        return lessonRepository.save(lesson);
    }

    @Transactional
    public Lesson updateLesson(Long courseId, Long lessonId, UpdateLessonRequest req, User teacher) {
        Course course = courseService.getCourseOrThrow(courseId);
        Lesson lesson = getLessonOrThrow(lessonId, course);
        checkTeacherWriteAccess(course, teacher);

        if (req.getTitle() != null)               lesson.setTitle(req.getTitle());
        if (req.getDescription() != null)         lesson.setDescription(req.getDescription());
        if (req.getStatus() != null)              lesson.setStatus(req.getStatus());
        if (req.getTextContent() != null)         lesson.setTextContent(req.getTextContent());
        if (req.getVideoSourceType() != null)     lesson.setVideoSourceType(req.getVideoSourceType());
        if (req.getVideoUrl() != null)            lesson.setVideoUrl(req.getVideoUrl());
        if (req.getVideoFileKey() != null)        lesson.setVideoFileKey(req.getVideoFileKey());
        if (req.getVideoDurationSeconds() != null) lesson.setVideoDurationSeconds(req.getVideoDurationSeconds());

        return lessonRepository.save(lesson);
    }

    @Transactional
    public void softDeleteLesson(Long courseId, Long lessonId, User teacher) {
        Course course = courseService.getCourseOrThrow(courseId);
        Lesson lesson = getLessonOrThrow(lessonId, course);
        checkTeacherWriteAccess(course, teacher);

        lesson.setDeletedAt(LocalDateTime.now());
        lessonRepository.save(lesson);
    }

    /**
     * Batch-update order_index for lessons.
     * Each item maps lessonId → new orderIndex.
     */
    @Transactional
    public List<LessonResponse> reorderLessons(Long courseId, ReorderLessonsRequest req, User teacher) {
        Course course = courseService.getCourseOrThrow(courseId);
        checkTeacherWriteAccess(course, teacher);

        List<Lesson> allLessons = lessonRepository.findAllByCourseOrderByOrderIndexAsc(course);
        Map<Long, Lesson> lessonMap = allLessons.stream()
                .collect(Collectors.toMap(Lesson::getId, Function.identity()));

        for (ReorderLessonsRequest.ReorderItem item : req.getItems()) {
            Lesson l = lessonMap.get(item.getLessonId());
            if (l == null) throw new ResourceNotFoundException("Lesson", item.getLessonId());
            l.setOrderIndex(item.getOrderIndex());
        }
        lessonRepository.saveAll(lessonMap.values());

        return lessonRepository.findAllByCourseOrderByOrderIndexAsc(course)
                .stream().map(LessonResponse::fromEntityFull).toList();
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    public Lesson getLessonOrThrow(Long lessonId, Course course) {
        return lessonRepository.findByIdAndCourse(lessonId, course)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));
    }

    private boolean hasFullAccess(Course course, User user) {
        if (user == null) return false;
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.TEACHER) return true;
        return enrollmentRepository.existsByStudentAndCourseAndStatusIn(
                user, course, List.of(Enrollment.Status.APPROVED));
    }

    private void requireDetailAccess(Course course, User user) {
        if (user == null) throw new SecurityException("Authentication required");
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.TEACHER) return;
        boolean enrolled = enrollmentRepository.existsByStudentAndCourseAndStatusIn(
                user, course, List.of(Enrollment.Status.APPROVED));
        if (!enrolled) throw new SecurityException("Enrollment required to access this lesson");
    }

    private void checkTeacherWriteAccess(Course course, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (user.getRole() == User.Role.TEACHER && course.getTeacher().getId().equals(user.getId())) return;
        throw new SecurityException("Access denied: you do not own this course");
    }

    private void validateLessonRequest(Lesson.Type type, Lesson.VideoSourceType vsType,
                                       String videoUrl, String videoFileKey) {
        if (type == Lesson.Type.VIDEO) {
            if (vsType == null) throw new IllegalArgumentException("videoSourceType is required for VIDEO lessons");
            if (vsType == Lesson.VideoSourceType.UPLOAD && (videoFileKey == null || videoFileKey.isBlank())) {
                throw new IllegalArgumentException("videoFileKey is required when videoSourceType=UPLOAD");
            }
            if (vsType != Lesson.VideoSourceType.UPLOAD && (videoUrl == null || videoUrl.isBlank())) {
                throw new IllegalArgumentException("videoUrl is required for " + vsType + " lessons");
            }
        }
    }
}
