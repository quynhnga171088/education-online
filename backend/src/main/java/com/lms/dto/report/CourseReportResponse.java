package com.lms.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseReportResponse {
    private Long courseId;
    private String title;
    private String slug;
    private long totalLessons;
    private long totalEnrollments;
    private long approvedEnrollments;
    private long pendingEnrollments;
    private long rejectedEnrollments;

    /** Monthly enrollment counts (last 12 months) */
    private List<MonthlyCountItem> enrollmentsByMonth;

    /** Per-lesson completion counts */
    private List<LessonCompletionStat> lessonCompletionStats;
}
