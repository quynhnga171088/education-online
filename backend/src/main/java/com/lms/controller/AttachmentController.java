package com.lms.controller;

import com.lms.dto.attachment.AttachmentResponse;
import com.lms.entity.User;
import com.lms.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/courses/{courseId}/lessons/{lessonId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    /** Students (enrolled), Teacher, Admin can list attachments. */
    @GetMapping
    public ResponseEntity<List<AttachmentResponse>> list(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        User currentUser = requireUser(authentication);
        return ResponseEntity.ok(attachmentService.listAttachments(courseId, lessonId, currentUser));
    }

    /** TEACHER (own course) or ADMIN — upload a document attachment (multipart). */
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<AttachmentResponse> upload(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        User teacher = requireUser(authentication);
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        AttachmentResponse result = attachmentService.addAttachment(courseId, lessonId, file, teacher);
        return ResponseEntity.ok(result);
    }

    /** TEACHER (own course) or ADMIN — delete an attachment. */
    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @PathVariable Long attachmentId,
            Authentication authentication
    ) {
        User teacher = requireUser(authentication);
        attachmentService.deleteAttachment(courseId, lessonId, attachmentId, teacher);
        return ResponseEntity.noContent().build();
    }

    // ──────────────────────────────────────────────────────────────
    private User requireUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        throw new SecurityException("Unauthorized");
    }
}
