package com.lms.dto.admin;

import com.lms.entity.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentSummaryResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private Enrollment.Status status;
    private LocalDateTime createdAt;

    public static EnrollmentSummaryResponse fromEntity(Enrollment e) {
        return EnrollmentSummaryResponse.builder()
                .id(e.getId())
                .courseId(e.getCourse().getId())
                .courseTitle(e.getCourse().getTitle())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .build();
    }
}

