package com.lms.service;

import com.lms.entity.User;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public User getByIdOrThrow(Long id) {
        return userRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public Page<User> listUsers(User.Role role, User.Status status, String search, Pageable pageable) {
        String q = (search == null || search.isBlank()) ? null : search.trim();
        return userRepository.findAllWithFilters(role, status, q, pageable);
    }

    @Transactional
    public User createTeacher(String email, String password, String fullName, String phone) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailAndDeletedAtIsNull(normalizedEmail)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .phone(phone)
                .role(User.Role.TEACHER)
                .status(User.Status.ACTIVE)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User updateRoleStatus(Long id, User.Role role, User.Status status) {
        User user = getByIdOrThrow(id);
        user.setRole(role);
        user.setStatus(status);
        User saved = userRepository.save(user);

        if (status == User.Status.BLOCKED) {
            refreshTokenService.revokeAllUserTokens(saved);
        }

        return saved;
    }

    @Transactional
    public void softDelete(Long id) {
        User user = getByIdOrThrow(id);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
        refreshTokenService.revokeAllUserTokens(user);
    }
}

