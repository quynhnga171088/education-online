package com.lms.dto.lesson;

import com.lms.dto.attachment.AttachmentResponse;
import com.lms.entity.Lesson;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonDetailResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private Integer orderIndex;
    private Lesson.Type type;
    private Lesson.Status status;
    private String textContent;
    private Lesson.VideoSourceType videoSourceType;
    private String videoUrl;
    private String videoFileKey;
    private Integer videoDurationSeconds;
    private List<AttachmentResponse> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LessonDetailResponse fromEntity(Lesson l, List<AttachmentResponse> attachments) {
        return LessonDetailResponse.builder()
                .id(l.getId())
                .courseId(l.getCourse().getId())
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
                .attachments(attachments)
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }
}
