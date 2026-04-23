package com.lms.dto.auth;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 255)
    private String fullName;

    @Size(max = 20)
    private String phone;

    @Size(max = 2000)
    private String avatarUrl;
}

