package com.lms.dto.lesson;

import com.lms.entity.Lesson;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateLessonRequest {

    @Size(max = 255)
    private String title;

    @Size(max = 65535)
    private String description;

    private Lesson.Status status;

    private String textContent;

    private Lesson.VideoSourceType videoSourceType;

    @Size(max = 2000)
    private String videoUrl;

    @Size(max = 500)
    private String videoFileKey;

    private Integer videoDurationSeconds;
}
