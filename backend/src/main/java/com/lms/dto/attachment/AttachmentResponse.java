package com.lms.dto.attachment;

import com.lms.entity.LessonAttachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {
    private Long id;
    private Long lessonId;
    private String fileName;
    private String fileKey;
    private String fileUrl;
    private String fileType;
    private long fileSizeBytes;
    private int orderIndex;
    private LocalDateTime createdAt;

    public static AttachmentResponse fromEntity(LessonAttachment a) {
        return AttachmentResponse.builder()
                .id(a.getId())
                .lessonId(a.getLesson().getId())
                .fileName(a.getFileName())
                .fileKey(a.getFileKey())
                .fileUrl(a.getFileUrl())
                .fileType(a.getFileType())
                .fileSizeBytes(a.getFileSizeBytes())
                .orderIndex(a.getOrderIndex())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
