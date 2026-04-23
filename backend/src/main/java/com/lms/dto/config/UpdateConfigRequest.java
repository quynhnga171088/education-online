package com.lms.dto.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateConfigRequest {

    @NotBlank
    @Size(max = 100)
    private String key;

    @NotBlank
    private String value;
}
