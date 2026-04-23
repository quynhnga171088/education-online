package com.lms.dto.admin;

import com.lms.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserAdminRequest {

    @NotNull
    private User.Role role;

    @NotNull
    private User.Status status;
}

