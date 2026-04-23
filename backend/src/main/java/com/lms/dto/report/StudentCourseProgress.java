package com.lms.dto.report;

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
public class StudentCourseProgress {
    private Long courseId;
    private String title;
    private String slug;
    private String thumbnailUrl;
    private Enrollment.Status enrollmentStatus;
    private double progressPercent;
    private long completedLessons;
    private long totalLessons;
    private LocalDateTime enrolledAt;
}
