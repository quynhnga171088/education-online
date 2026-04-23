package com.lms.dto.course;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentWithProgressResponse {
    private Long id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private double progressPercent;
    private int completedLessons;
    private int totalLessons;
    private LocalDateTime enrolledAt;
}
