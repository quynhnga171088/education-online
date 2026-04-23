package com.lms.controller;

import com.lms.dto.auth.*;
import com.lms.dto.user.UserResponse;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest httpReq) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = httpReq.getRemoteAddr();
        AuthResponse res = authService.registerStudent(req.getEmail(), req.getPassword(), req.getFullName(), ua, ip);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpReq) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = httpReq.getRemoteAddr();
        AuthResponse res = authService.login(req.getEmail(), req.getPassword(), ua, ip);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest req) {
        authService.logout(req.getRefreshToken());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest req, HttpServletRequest httpReq) {
        String ua = httpReq.getHeader("User-Agent");
        String ip = httpReq.getRemoteAddr();
        AuthResponse res = authService.refresh(req.getRefreshToken(), ua, ip);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        User user = currentUser(authentication);
        return ResponseEntity.ok(UserResponse.fromEntity(user));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @Valid @RequestBody UpdateProfileRequest req,
            Authentication authentication
    ) {
        User user = currentUser(authentication);
        User dbUser = userRepository.findByIdAndDeletedAtIsNull(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (req.getFullName() != null) dbUser.setFullName(req.getFullName());
        if (req.getPhone() != null) dbUser.setPhone(req.getPhone());
        if (req.getAvatarUrl() != null) dbUser.setAvatarUrl(req.getAvatarUrl());

        userRepository.save(dbUser);
        return ResponseEntity.ok(UserResponse.fromEntity(dbUser));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest req,
            Authentication authentication
    ) {
        User user = currentUser(authentication);
        User dbUser = userRepository.findByIdAndDeletedAtIsNull(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(req.getOldPassword(), dbUser.getPasswordHash())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        dbUser.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(dbUser);
        return ResponseEntity.noContent().build();
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User u)) {
            throw new SecurityException("Unauthorized");
        }
        if (u.getDeletedAt() != null) {
            throw new SecurityException("User deleted");
        }
        if (u.getStatus() != User.Status.ACTIVE) {
            throw new SecurityException("User blocked");
        }
        return u;
    }
}

