package com.lms.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCourseItem {
    private Long courseId;
    private String title;
    private String slug;
    private String thumbnailUrl;
    private long enrollmentCount;
}
