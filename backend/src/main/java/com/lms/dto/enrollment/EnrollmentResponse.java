package com.lms.dto.enrollment;

import com.lms.entity.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponse {
    private Long id;

    // Course info
    private Long courseId;
    private String courseTitle;
    private String courseSlug;
    private String courseThumbnailUrl;
    private BigDecimal coursePrice;

    // Student info (visible to Admin)
    private Long studentId;
    private String studentName;
    private String studentEmail;

    private Enrollment.Status status;
    private String note;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Progress (populated for STUDENT's own listing)
    private Double progressPercent;
    private Integer completedLessons;
    private Integer totalLessons;

    // Payment proof (if uploaded)
    private PaymentProofResponse paymentProof;

    public static EnrollmentResponse fromEntity(Enrollment e) {
        return EnrollmentResponse.builder()
                .id(e.getId())
                .courseId(e.getCourse().getId())
                .courseTitle(e.getCourse().getTitle())
                .courseSlug(e.getCourse().getSlug())
                .courseThumbnailUrl(e.getCourse().getThumbnailUrl())
                .coursePrice(e.getCourse().getPrice())
                .studentId(e.getStudent().getId())
                .studentName(e.getStudent().getFullName())
                .studentEmail(e.getStudent().getEmail())
                .status(e.getStatus())
                .note(e.getNote())
                .reviewedAt(e.getReviewedAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
