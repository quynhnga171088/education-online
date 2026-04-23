package com.lms.dto.course;

import com.lms.dto.lesson.LessonResponse;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDetailResponse {
    private Long id;
    private String title;
    private String slug;
    private String description;
    private String shortDescription;
    private String thumbnailUrl;
    private BigDecimal price;
    private Course.Status status;
    private TeacherInfo teacher;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    /** Enrollment status of the requesting student (null if not authenticated or not student) */
    private Enrollment.Status enrollmentStatus;

    /**
     * Lesson list:
     * - Public / unenrolled → preview fields only (textContent, videoUrl, videoFileKey = null)
     * - Enrolled student / Teacher / Admin → full data
     */
    private List<LessonResponse> lessons;
}
