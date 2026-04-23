package com.lms.dto.report;

import com.lms.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentReportResponse {
    private UserResponse student;
    private List<StudentCourseProgress> courses;
}
