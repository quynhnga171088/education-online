package com.lms.dto.course;

import com.lms.entity.Course;
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
public class CourseResponse {
    private Long id;
    private String title;
    private String slug;
    private String shortDescription;
    private String thumbnailUrl;
    private BigDecimal price;
    private Course.Status status;
    private TeacherInfo teacher;
    private long lessonCount;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    /** Only populated when the requesting user is an authenticated STUDENT */
    private Enrollment.Status enrollmentStatus;

    public static CourseResponse fromEntity(Course c, long lessonCount, Enrollment.Status enrollmentStatus) {
        return CourseResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .slug(c.getSlug())
                .shortDescription(c.getShortDescription())
                .thumbnailUrl(c.getThumbnailUrl())
                .price(c.getPrice())
                .status(c.getStatus())
                .teacher(TeacherInfo.fromEntity(c.getTeacher()))
                .lessonCount(lessonCount)
                .publishedAt(c.getPublishedAt())
                .createdAt(c.getCreatedAt())
                .enrollmentStatus(enrollmentStatus)
                .build();
    }
}
