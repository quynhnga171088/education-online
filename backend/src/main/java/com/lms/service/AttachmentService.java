package com.lms.service;

import com.lms.dto.attachment.AttachmentResponse;
import com.lms.dto.upload.UploadResponse;
import com.lms.entity.*;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.LessonAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final LessonAttachmentRepository attachmentRepository;
    private final EnrollmentRepository       enrollmentRepository;
    private final LessonService              lessonService;
    private final CourseService              courseService;
    private final FileStorageService         fileStorageService;

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listAttachments(Long courseId, Long lessonId, User currentUser) {
        Course course = courseService.getCourseOrThrow(courseId);
        Lesson lesson = lessonService.getLessonOrThrow(lessonId, course);

        requireReadAccess(course, currentUser);

        return attachmentRepository.findAllByLessonOrderByOrderIndexAsc(lesson)
                .stream()
                .map(AttachmentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public AttachmentResponse addAttachment(Long courseId, Long lessonId, MultipartFile file, User teacher) {
        Course course = courseService.getCourseOrThrow(courseId);
        Lesson lesson = lessonService.getLessonOrThrow(lessonId, course);
        requireTeacherAccess(course, teacher);

        UploadResponse upload = fileStorageService.storeDocument(file, lessonId);

        int nextOrder = attachmentRepository.findAllByLessonOrderByOrderIndexAsc(lesson).size();

        LessonAttachment attachment = LessonAttachment.builder()
                .lesson(lesson)
                .fileName(file.getOriginalFilename())
                .fileKey(upload.getFileKey())
                .fileUrl(upload.getFileUrl())
                .fileType(upload.getContentType())
                .fileSizeBytes(upload.getFileSizeBytes())
                .orderIndex(nextOrder)
                .build();

        return AttachmentResponse.fromEntity(attachmentRepository.save(attachment));
    }

    @Transactional
    public void deleteAttachment(Long courseId, Long lessonId, Long attachmentId, User teacher) {
        Course course = courseService.getCourseOrThrow(courseId);
        Lesson lesson = lessonService.getLessonOrThrow(lessonId, course);
        requireTeacherAccess(course, teacher);

        LessonAttachment att = attachmentRepository.findById(attachmentId)
                .filter(a -> a.getLesson().getId().equals(lesson.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));

        fileStorageService.deleteFile(att.getFileKey());
        attachmentRepository.delete(att);
    }

    // ──────────────────────────────────────────────────────────────
    // Access helpers
    // ──────────────────────────────────────────────────────────────

    private void requireReadAccess(Course course, User user) {
        if (user == null) throw new SecurityException("Authentication required");
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.TEACHER) return;
        boolean enrolled = enrollmentRepository.existsByStudentAndCourseAndStatusIn(
                user, course, List.of(Enrollment.Status.APPROVED));
        if (!enrolled) throw new SecurityException("Enrollment required");
    }

    private void requireTeacherAccess(Course course, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (user.getRole() == User.Role.TEACHER && course.getTeacher().getId().equals(user.getId())) return;
        throw new SecurityException("Access denied: you do not own this course");
    }
}
