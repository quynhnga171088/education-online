package com.lms.service;

import com.lms.dto.progress.CourseProgressResponse;
import com.lms.dto.progress.LessonProgressSummary;
import com.lms.entity.*;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final LessonRepository         lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentRepository     enrollmentRepository;
    private final CourseService            courseService;
    private final SystemConfigService      systemConfigService;

    // ──────────────────────────────────────────────────────────────
    // GET /progress/courses/:cid
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(Long courseId, User student) {
        Course course = courseService.getCourseOrThrow(courseId);
        requireApprovedEnrollment(student, course);

        List<Lesson> lessons = lessonRepository.findAllByCourseOrderByOrderIndexAsc(course);

        // Fetch all progress records for this student + course in one query
        Map<Long, LessonProgress> progressMap = lessonProgressRepository
                .findAllByStudentAndCourse(student, course)
                .stream()
                .collect(Collectors.toMap(lp -> lp.getLesson().getId(), lp -> lp));

        List<LessonProgressSummary> summaries = lessons.stream()
                .map(l -> buildSummary(l, progressMap.get(l.getId())))
                .toList();

        long completed = summaries.stream()
                .filter(s -> s.getStatus() == LessonProgress.Status.COMPLETED)
                .count();
        double pct = lessons.isEmpty() ? 0.0
                : Math.round((double) completed / lessons.size() * 1000.0) / 10.0;

        return CourseProgressResponse.builder()
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .courseSlug(course.getSlug())
                .totalLessons(lessons.size())
                .completedLessons(completed)
                .progressPercent(pct)
                .lessons(summaries)
                .build();
    }

    // ──────────────────────────────────────────────────────────────
    // POST /progress/lessons/:lid/open
    // ──────────────────────────────────────────────────────────────

    /**
     * Called when a student opens/views a lesson.
     * - If COMPLETION_MODE=OPEN → immediately mark COMPLETED
     * - If COMPLETION_MODE=VIDEO_50 → mark IN_PROGRESS (completion triggered by video-progress)
     */
    @Transactional
    public LessonProgress markLessonOpen(Long lessonId, User student) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));

        requireApprovedEnrollment(student, lesson.getCourse());

        LessonProgress progress = getOrCreateProgress(student, lesson);
        progress.setLastAccessedAt(LocalDateTime.now());

        if (progress.getStatus() == LessonProgress.Status.COMPLETED) {
            return lessonProgressRepository.save(progress);
        }

        String mode = systemConfigService.getCompletionMode();
        if (SystemConfigService.MODE_OPEN.equals(mode)
                || lesson.getType() == Lesson.Type.TEXT) {
            // TEXT lessons are always completed on open
            progress.setStatus(LessonProgress.Status.COMPLETED);
            progress.setCompletedAt(LocalDateTime.now());
        } else {
            progress.setStatus(LessonProgress.Status.IN_PROGRESS);
        }

        return lessonProgressRepository.save(progress);
    }

    // ──────────────────────────────────────────────────────────────
    // POST /progress/lessons/:lid/video-progress
    // ──────────────────────────────────────────────────────────────

    /**
     * Updates the number of seconds watched for a video lesson.
     * Marks COMPLETED if watched >= 50% and COMPLETION_MODE=VIDEO_50.
     */
    @Transactional
    public LessonProgress updateVideoProgress(Long lessonId, int watchedSeconds, User student) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));

        if (lesson.getType() != Lesson.Type.VIDEO) {
            throw new IllegalArgumentException("Lesson is not a video lesson");
        }

        requireApprovedEnrollment(student, lesson.getCourse());

        LessonProgress progress = getOrCreateProgress(student, lesson);
        progress.setLastAccessedAt(LocalDateTime.now());

        if (progress.getStatus() == LessonProgress.Status.NOT_STARTED) {
            progress.setStatus(LessonProgress.Status.IN_PROGRESS);
        }

        // Track total watched seconds (take the max to avoid rewinding reducing progress)
        if (watchedSeconds > progress.getVideoWatchedSeconds()) {
            progress.setVideoWatchedSeconds(watchedSeconds);
        }

        // Update max percent if we know the duration
        Integer duration = lesson.getVideoDurationSeconds();
        if (duration != null && duration > 0) {
            double percent = Math.min(100.0, (double) watchedSeconds / duration * 100.0);
            if (percent > progress.getVideoMaxWatchedPercent()) {
                progress.setVideoMaxWatchedPercent(percent);
            }
        }

        // Check 50% milestone
        if (progress.getStatus() != LessonProgress.Status.COMPLETED) {
            String mode = systemConfigService.getCompletionMode();
            if (SystemConfigService.MODE_VIDEO_50.equals(mode)
                    && progress.getVideoMaxWatchedPercent() >= 50.0) {
                progress.setStatus(LessonProgress.Status.COMPLETED);
                progress.setCompletedAt(LocalDateTime.now());
            }
        }

        return lessonProgressRepository.save(progress);
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private LessonProgress getOrCreateProgress(User student, Lesson lesson) {
        return lessonProgressRepository.findByStudentAndLesson(student, lesson)
                .orElseGet(() -> LessonProgress.builder()
                        .student(student)
                        .lesson(lesson)
                        .course(lesson.getCourse())
                        .status(LessonProgress.Status.NOT_STARTED)
                        .videoWatchedSeconds(0)
                        .videoMaxWatchedPercent(0.0)
                        .build());
    }

    private void requireApprovedEnrollment(User student, Course course) {
        boolean enrolled = enrollmentRepository.existsByStudentAndCourseAndStatusIn(
                student, course, List.of(Enrollment.Status.APPROVED));
        if (!enrolled) {
            throw new SecurityException("Approved enrollment required to track progress");
        }
    }

    private LessonProgressSummary buildSummary(Lesson lesson, LessonProgress lp) {
        if (lp == null) {
            return LessonProgressSummary.builder()
                    .lessonId(lesson.getId())
                    .lessonTitle(lesson.getTitle())
                    .lessonType(lesson.getType())
                    .orderIndex(lesson.getOrderIndex())
                    .status(LessonProgress.Status.NOT_STARTED)
                    .videoWatchedSeconds(0)
                    .videoMaxWatchedPercent(0.0)
                    .build();
        }
        return LessonProgressSummary.builder()
                .lessonId(lesson.getId())
                .lessonTitle(lesson.getTitle())
                .lessonType(lesson.getType())
                .orderIndex(lesson.getOrderIndex())
                .status(lp.getStatus())
                .videoWatchedSeconds(lp.getVideoWatchedSeconds())
                .videoMaxWatchedPercent(lp.getVideoMaxWatchedPercent())
                .completedAt(lp.getCompletedAt())
                .lastAccessedAt(lp.getLastAccessedAt())
                .build();
    }
}
