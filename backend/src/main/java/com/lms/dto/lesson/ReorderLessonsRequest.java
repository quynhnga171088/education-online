package com.lms.dto.lesson;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReorderLessonsRequest {

    @NotEmpty
    @Valid
    private List<ReorderItem> items;

    @Data
    public static class ReorderItem {
        @NotNull
        private Long lessonId;

        @NotNull
        private Integer orderIndex;
    }
}
