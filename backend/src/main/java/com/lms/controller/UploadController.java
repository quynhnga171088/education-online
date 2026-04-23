package com.lms.controller;

import com.lms.dto.upload.UploadResponse;
import com.lms.entity.User;
import com.lms.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    /**
     * TEACHER only. Upload a video file (mp4/mov/webm/avi).
     * Returns fileKey and fileUrl for later use in lesson creation.
     *
     * @param courseId  the course the video belongs to (for directory organisation)
     */
    @PostMapping("/video")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<UploadResponse> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "courseId", defaultValue = "0") Long courseId,
            Authentication authentication
    ) {
        requireUser(authentication);
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        UploadResponse result = fileStorageService.storeVideo(file, courseId);
        return ResponseEntity.ok(result);
    }

    /**
     * Authenticated users. Upload image for avatar / thumbnail / receipt.
     * @param type  One of: avatar | thumbnail | receipt
     */
    @PostMapping("/image")
    public ResponseEntity<UploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "avatar") String type,
            Authentication authentication
    ) {
        requireUser(authentication);
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        UploadResponse result = fileStorageService.storeImage(file, type);
        return ResponseEntity.ok(result);
    }

    // ──────────────────────────────────────────────────────────────
    private User requireUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        throw new SecurityException("Unauthorized");
    }
}
