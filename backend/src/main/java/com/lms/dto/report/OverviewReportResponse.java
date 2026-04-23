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
public class OverviewReportResponse {
    // Users
    private long totalStudents;
    private long totalTeachers;

    // Courses
    private long totalPublishedCourses;
    private long totalDraftCourses;
    private long totalArchivedCourses;

    // Enrollments
    private long totalEnrollmentsPending;
    private long totalEnrollmentsApproved;
    private long totalEnrollmentsRejected;

    // Progress
    private long totalLessonsCompleted;

    // Top 5 courses by enrollment count
    private List<TopCourseItem> topCourses;
}
