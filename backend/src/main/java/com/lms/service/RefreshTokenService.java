package com.lms.service;

import com.lms.entity.RefreshToken;
import com.lms.entity.User;
import com.lms.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.refresh-token.expiration-days}")
    private int expirationDays;

    /**
     * Generates a new refresh token for the given user.
     * Returns the plaintext token (stored hashed in DB).
     */
    @Transactional
    public String createRefreshToken(User user, String userAgent, String ipAddress) {
        String plainToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String tokenHash = hashToken(plainToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(expirationDays))
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();

        refreshTokenRepository.save(refreshToken);
        return plainToken;
    }

    /**
     * Validates and rotates a refresh token.
     * Returns the user if valid, throws exception if invalid/revoked.
     */
    @Transactional
    public User rotateRefreshToken(String plainToken, String userAgent, String ipAddress, String[] newTokenHolder) {
        String tokenHash = hashToken(plainToken);
        Optional<RefreshToken> optToken = refreshTokenRepository.findByTokenHash(tokenHash);

        if (optToken.isEmpty()) {
            throw new IllegalArgumentException("Refresh token not found");
        }

        RefreshToken existing = optToken.get();

        if (existing.isRevoked()) {
            // Token reuse detected — revoke all tokens for this user
            refreshTokenRepository.revokeAllByUser(existing.getUser(), LocalDateTime.now());
            throw new SecurityException("Refresh token reuse detected. All sessions revoked.");
        }

        if (existing.isExpired()) {
            throw new IllegalArgumentException("Refresh token expired");
        }

        // Revoke old token
        existing.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(existing);

        // Issue new token
        User user = existing.getUser();
        String newPlainToken = createRefreshToken(user, userAgent, ipAddress);
        newTokenHolder[0] = newPlainToken;

        return user;
    }

    /**
     * Revokes a specific refresh token (logout).
     */
    @Transactional
    public void revokeToken(String plainToken) {
        String tokenHash = hashToken(plainToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
        });
    }

    /**
     * Revokes all refresh tokens for a user (force logout all sessions).
     */
    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());
    }

    private String hashToken(String plainToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plainToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
