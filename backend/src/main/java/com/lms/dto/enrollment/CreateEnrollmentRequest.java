package com.lms.dto.enrollment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateEnrollmentRequest {

    @NotNull
    private Long courseId;
}
