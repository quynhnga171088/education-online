package com.lms.dto.config;

import com.lms.entity.SystemConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigResponse {
    private Integer id;
    private String key;
    private String value;
    private String description;
    private LocalDateTime updatedAt;

    public static ConfigResponse fromEntity(SystemConfig c) {
        return ConfigResponse.builder()
                .id(c.getId())
                .key(c.getKey())
                .value(c.getValue())
                .description(c.getDescription())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
