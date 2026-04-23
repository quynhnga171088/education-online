package com.lms.controller;

import com.lms.dto.progress.CourseProgressResponse;
import com.lms.dto.progress.VideoProgressRequest;
import com.lms.entity.LessonProgress;
import com.lms.entity.User;
import com.lms.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * STUDENT: full progress for a course they're enrolled in.
     * Returns: courseInfo, totalLessons, completedLessons, progressPercent, lesson summaries.
     */
    @GetMapping("/courses/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        User student = requireUser(authentication);
        return ResponseEntity.ok(progressService.getCourseProgress(courseId, student));
    }

    /**
     * STUDENT: mark a lesson as opened.
     * - COMPLETION_MODE=OPEN  → COMPLETED immediately
     * - COMPLETION_MODE=VIDEO_50 → IN_PROGRESS (completion by video-progress endpoint)
     * - TEXT lessons are always COMPLETED on open regardless of mode
     */
    @PostMapping("/lessons/{lessonId}/open")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<LessonProgress> openLesson(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        User student = requireUser(authentication);
        return ResponseEntity.ok(progressService.markLessonOpen(lessonId, student));
    }

    /**
     * STUDENT: report video watch progress.
     * Body: { watchedSeconds }
     * Marks COMPLETED when watchedPercent >= 50% and COMPLETION_MODE=VIDEO_50.
     */
    @PostMapping("/lessons/{lessonId}/video-progress")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<LessonProgress> videoProgress(
            @PathVariable Long lessonId,
            @Valid @RequestBody VideoProgressRequest req,
            Authentication authentication
    ) {
        User student = requireUser(authentication);
        return ResponseEntity.ok(progressService.updateVideoProgress(lessonId, req.getWatchedSeconds(), student));
    }

    // ──────────────────────────────────────────────────────────────
    private User requireUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        throw new SecurityException("Unauthorized");
    }
}
