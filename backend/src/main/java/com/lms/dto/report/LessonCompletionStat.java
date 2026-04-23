package com.lms.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonCompletionStat {
    private Long lessonId;
    private String lessonTitle;
    private long completedCount;
}
