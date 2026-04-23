package com.lms.dto.progress;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressResponse {
    private Long courseId;
    private String courseTitle;
    private String courseSlug;
    private int totalLessons;
    private long completedLessons;
    private double progressPercent;
    private List<LessonProgressSummary> lessons;
}
