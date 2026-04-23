package com.lms.dto.admin;

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
public class AdminUserDetailResponse {
    private UserResponse user;
    private List<EnrollmentSummaryResponse> recentEnrollments;
}

