package com.lms.service;

import com.lms.dto.auth.AuthResponse;
import com.lms.entity.User;
import com.lms.repository.UserRepository;
import com.lms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse registerStudent(String email, String password, String fullName, String userAgent, String ipAddress) {
        if (userRepository.existsByEmailAndDeletedAtIsNull(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .email(email.trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(User.Role.STUDENT)
                .status(User.Status.ACTIVE)
                .build();
        userRepository.save(user);

        return issueTokenPair(user, userAgent, ipAddress);
    }

    @Transactional
    public AuthResponse login(String email, String password, String userAgent, String ipAddress) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        User user = userRepository.findByEmailAndDeletedAtIsNull(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getStatus() != User.Status.ACTIVE) {
            throw new SecurityException("User is blocked");
        }

        return issueTokenPair(user, userAgent, ipAddress);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken, String userAgent, String ipAddress) {
        String[] newTokenHolder = new String[1];
        User user = refreshTokenService.rotateRefreshToken(refreshToken, userAgent, ipAddress, newTokenHolder);

        if (user.getDeletedAt() != null) {
            refreshTokenService.revokeAllUserTokens(user);
            throw new SecurityException("User deleted");
        }
        if (user.getStatus() != User.Status.ACTIVE) {
            refreshTokenService.revokeAllUserTokens(user);
            throw new SecurityException("User blocked");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newTokenHolder[0])
                .user(com.lms.dto.user.UserResponse.fromEntity(user))
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeToken(refreshToken);
    }

    private AuthResponse issueTokenPair(User user, String userAgent, String ipAddress) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
        String refreshToken = refreshTokenService.createRefreshToken(user, userAgent, ipAddress);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(com.lms.dto.user.UserResponse.fromEntity(user))
                .build();
    }
}

