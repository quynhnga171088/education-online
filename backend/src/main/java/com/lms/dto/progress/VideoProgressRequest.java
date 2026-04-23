package com.lms.dto.progress;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VideoProgressRequest {

    @NotNull
    @Min(0)
    private Integer watchedSeconds;
}
