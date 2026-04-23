package com.lms.service;

import com.lms.entity.SystemConfig;
import com.lms.entity.User;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    public static final String KEY_COMPLETION_MODE = "COMPLETION_MODE";

    /** Supported completion modes */
    public static final String MODE_OPEN      = "OPEN";
    public static final String MODE_VIDEO_50  = "VIDEO_50";

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final SystemConfigRepository systemConfigRepository;

    private volatile Map<String, String> cache = new ConcurrentHashMap<>();
    private volatile Instant cacheLoadedAt = Instant.EPOCH;

    // ──────────────────────────────────────────────────────────────
    // Read
    // ──────────────────────────────────────────────────────────────

    public List<SystemConfig> findAll() {
        return systemConfigRepository.findAll();
    }

    /** Cached key → value lookup. Returns null if key not found. */
    public String getValue(String key) {
        ensureCacheFresh();
        return cache.get(key);
    }

    /** Returns the completion mode value; defaults to OPEN if not configured. */
    public String getCompletionMode() {
        String mode = getValue(KEY_COMPLETION_MODE);
        return mode != null ? mode : MODE_OPEN;
    }

    // ──────────────────────────────────────────────────────────────
    // Write
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public SystemConfig updateValue(String key, String value, User updatedBy) {
        SystemConfig config = systemConfigRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Config key not found: " + key));

        config.setValue(value);
        config.setUpdatedBy(updatedBy);
        SystemConfig saved = systemConfigRepository.save(config);

        invalidateCache();
        log.info("Config [{}] updated to [{}] by user {}", key, value, updatedBy.getEmail());
        return saved;
    }

    // ──────────────────────────────────────────────────────────────
    // Cache management
    // ──────────────────────────────────────────────────────────────

    public void invalidateCache() {
        cacheLoadedAt = Instant.EPOCH;
    }

    private void ensureCacheFresh() {
        if (Duration.between(cacheLoadedAt, Instant.now()).compareTo(CACHE_TTL) > 0) {
            reloadCache();
        }
    }

    private synchronized void reloadCache() {
        // Double-checked: another thread may have reloaded while we waited
        if (Duration.between(cacheLoadedAt, Instant.now()).compareTo(CACHE_TTL) <= 0) return;

        cache = systemConfigRepository.findAll().stream()
                .collect(Collectors.toConcurrentMap(SystemConfig::getKey, SystemConfig::getValue));
        cacheLoadedAt = Instant.now();
        log.debug("SystemConfig cache reloaded ({} keys)", cache.size());
    }
}
