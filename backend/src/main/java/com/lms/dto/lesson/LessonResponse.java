package com.lms.dto.lesson;

import com.lms.entity.Lesson;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {
    private Long id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Lesson.Type type;
    private Lesson.Status status;

    // --- Fields below are null in "preview" mode (unauthenticated / unenrolled) ---

    private String textContent;
    private Lesson.VideoSourceType videoSourceType;
    private String videoUrl;
    private String videoFileKey;
    private Integer videoDurationSeconds;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Full data for enrolled students / teachers / admins */
    public static LessonResponse fromEntityFull(Lesson l) {
        return LessonResponse.builder()
                .id(l.getId())
                .title(l.getTitle())
                .description(l.getDescription())
                .orderIndex(l.getOrderIndex())
                .type(l.getType())
                .status(l.getStatus())
                .textContent(l.getTextContent())
                .videoSourceType(l.getVideoSourceType())
                .videoUrl(l.getVideoUrl())
                .videoFileKey(l.getVideoFileKey())
                .videoDurationSeconds(l.getVideoDurationSeconds())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }

    /** Preview-only data for public / unenrolled access */
    public static LessonResponse fromEntityPreview(Lesson l) {
        return LessonResponse.builder()
                .id(l.getId())
                .title(l.getTitle())
                .orderIndex(l.getOrderIndex())
                .type(l.getType())
                .status(l.getStatus())
                .build();
    }
}
