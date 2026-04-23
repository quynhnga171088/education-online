package com.lms.dto.lesson;

import com.lms.entity.Lesson;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateLessonRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 65535)
    private String description;

    @NotNull
    private Lesson.Type type;

    private Lesson.Status status = Lesson.Status.PUBLISHED;

    // ── TEXT type ──────────────────────────────
    private String textContent;

    // ── VIDEO type ─────────────────────────────
    private Lesson.VideoSourceType videoSourceType;

    /** For YOUTUBE / VIMEO / DRIVE */
    @Size(max = 2000)
    private String videoUrl;

    /** For UPLOAD (returned by POST /upload/video) */
    @Size(max = 500)
    private String videoFileKey;

    private Integer videoDurationSeconds;
}
