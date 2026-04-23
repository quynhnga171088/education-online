package com.lms.service;

import com.lms.dto.upload.UploadResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"
    );
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    private static final Set<String> ALLOWED_DOC_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain"
    );

    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;         // 5 MB
    private static final long MAX_DOC_BYTES   = 100L * 1024 * 1024;       // 100 MB

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    @Value("${app.storage.base-url}")
    private String baseUrl;

    private Path rootPath;

    @PostConstruct
    public void init() {
        rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
            log.info("Upload directory initialised: {}", rootPath);
        } catch (IOException e) {
            throw new RuntimeException("Cannot initialise upload directory: " + rootPath, e);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Public store methods
    // ──────────────────────────────────────────────────────────────

    /**
     * Stores a video file and returns UploadResponse.
     * File key: videos/{courseId}/{uuid}.{ext}
     */
    public UploadResponse storeVideo(MultipartFile file, Long courseId) {
        validateContentType(file, ALLOWED_VIDEO_TYPES, "Invalid video type. Allowed: mp4, mov, webm, avi");

        String fileKey = buildKey("videos/" + courseId, file.getOriginalFilename());
        return storeFile(file, fileKey);
    }

    /**
     * Stores a document attachment for a lesson.
     * File key: docs/{lessonId}/{uuid}.{ext}
     */
    public UploadResponse storeDocument(MultipartFile file, Long lessonId) {
        validateContentType(file, ALLOWED_DOC_TYPES, "Invalid document type");
        validateMaxSize(file, MAX_DOC_BYTES, "Document exceeds 100 MB limit");

        String fileKey = buildKey("docs/" + lessonId, file.getOriginalFilename());
        return storeFile(file, fileKey);
    }

    /**
     * Stores an image (avatar / thumbnail / receipt).
     * File key: images/{imageType}/{uuid}.{ext}
     */
    public UploadResponse storeImage(MultipartFile file, String imageType) {
        validateContentType(file, ALLOWED_IMAGE_TYPES, "Invalid image type. Allowed: jpg, png, gif, webp");
        validateMaxSize(file, MAX_IMAGE_BYTES, "Image exceeds 5 MB limit");

        String fileKey = buildKey("images/" + imageType, file.getOriginalFilename());
        return storeFile(file, fileKey);
    }

    /**
     * Deletes a file from disk. Silent if file does not exist.
     */
    public void deleteFile(String fileKey) {
        if (fileKey == null || fileKey.isBlank()) return;
        try {
            Path target = resolveKey(fileKey);
            Files.deleteIfExists(target);
            log.debug("Deleted file: {}", target);
        } catch (IOException e) {
            log.warn("Could not delete file [{}]: {}", fileKey, e.getMessage());
        }
    }

    /** Builds the public URL for a file key. */
    public String buildUrl(String fileKey) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return base + "/" + fileKey;
    }

    // ──────────────────────────────────────────────────────────────
    // Internals
    // ──────────────────────────────────────────────────────────────

    private UploadResponse storeFile(MultipartFile file, String fileKey) {
        Path target = resolveKey(fileKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Stored file: {}", target);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + fileKey, e);
        }

        return UploadResponse.builder()
                .fileKey(fileKey)
                .fileUrl(buildUrl(fileKey))
                .fileSizeBytes(file.getSize())
                .contentType(file.getContentType())
                .build();
    }

    private Path resolveKey(String fileKey) {
        // Prevent path-traversal attacks
        Path resolved = rootPath.resolve(fileKey).normalize();
        if (!resolved.startsWith(rootPath)) {
            throw new SecurityException("Invalid file path");
        }
        return resolved;
    }

    private String buildKey(String folder, String originalName) {
        String ext = extractExtension(originalName);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return folder + "/" + uuid + (ext.isEmpty() ? "" : "." + ext);
    }

    private static String extractExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 ? fileName.substring(dot + 1).toLowerCase() : "";
    }

    private static void validateContentType(MultipartFile file, Set<String> allowed, String message) {
        String ct = file.getContentType();
        if (ct == null || !allowed.contains(ct.toLowerCase())) {
            throw new IllegalArgumentException(message);
        }
    }

    private static void validateMaxSize(MultipartFile file, long maxBytes, String message) {
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(message);
        }
    }
}
