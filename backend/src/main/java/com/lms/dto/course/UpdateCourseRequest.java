package com.lms.dto.course;

import com.lms.entity.Course;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateCourseRequest {

    @Size(max = 255)
    private String title;

    @Size(max = 65535)
    private String description;

    @Size(max = 500)
    private String shortDescription;

    @Size(max = 2000)
    private String thumbnailUrl;

    @DecimalMin("0")
    private BigDecimal price;

    /** DRAFT → PUBLISHED | ARCHIVED */
    private Course.Status status;
}
