package com.lms.dto.course;

import com.lms.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherInfo {
    private Long id;
    private String fullName;
    private String avatarUrl;

    public static TeacherInfo fromEntity(User user) {
        return TeacherInfo.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
