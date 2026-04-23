package com.lms.dto.enrollment;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectEnrollmentRequest {

    @Size(max = 1000)
    private String note;
}
