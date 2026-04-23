package com.lms.service;

import com.lms.dto.enrollment.EnrollmentResponse;
import com.lms.dto.enrollment.PaymentProofResponse;
import com.lms.dto.upload.UploadResponse;
import com.lms.entity.*;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository      enrollmentRepository;
    private final CourseRepository          courseRepository;
    private final LessonRepository          lessonRepository;
    private final LessonProgressRepository  lessonProgressRepository;
    private final PaymentProofRepository    paymentProofRepository;
    private final FileStorageService        fileStorageService;

    // ──────────────────────────────────────────────────────────────
    // List
    // ──────────────────────────────────────────────────────────────

    /** STUDENT: own enrollments + progress per course */
    @Transactional(readOnly = true)
    public Page<EnrollmentResponse> listForStudent(User student, Pageable pageable) {
        return enrollmentRepository.findAllByStudent(student, pageable)
                .map(e -> buildResponseWithProgress(e, student));
    }

    /** ADMIN: all enrollments with filter */
    @Transactional(readOnly = true)
    public Page<EnrollmentResponse> listForAdmin(Enrollment.Status status, Long courseId,
                                                  Long studentId, Pageable pageable) {
        return enrollmentRepository.findAllWithFilters(status, courseId, studentId, pageable)
                .map(EnrollmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getById(Long id, User currentUser) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        checkReadAccess(enrollment, currentUser);

        EnrollmentResponse res = EnrollmentResponse.fromEntity(enrollment);

        // Attach payment proof if any
        paymentProofRepository.findByEnrollment(enrollment)
                .ifPresent(p -> res.setPaymentProof(PaymentProofResponse.fromEntity(p)));

        // Attach progress for STUDENT viewing own enrollment
        if (currentUser.getRole() == User.Role.STUDENT
                && enrollment.getStudent().getId().equals(currentUser.getId())) {
            populateProgress(res, enrollment, currentUser);
        }

        return res;
    }

    // ──────────────────────────────────────────────────────────────
    // Create
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public EnrollmentResponse createEnrollment(Long courseId, User student) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        if (course.getStatus() != Course.Status.PUBLISHED) {
            throw new IllegalArgumentException("Course is not available for enrollment");
        }

        boolean alreadyActive = enrollmentRepository.existsByStudentAndCourseAndStatusIn(
                student, course, List.of(Enrollment.Status.PENDING, Enrollment.Status.APPROVED));
        if (alreadyActive) {
            throw new IllegalArgumentException("You already have an active enrollment for this course");
        }

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .status(Enrollment.Status.PENDING)
                .build();

        return EnrollmentResponse.fromEntity(enrollmentRepository.save(enrollment));
    }

    // ──────────────────────────────────────────────────────────────
    // Payment proof
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public EnrollmentResponse uploadPaymentProof(Long enrollmentId, MultipartFile file, User student) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", enrollmentId));

        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new SecurityException("Access denied");
        }
        if (enrollment.getStatus() != Enrollment.Status.PENDING) {
            throw new IllegalArgumentException("Payment proof can only be uploaded for PENDING enrollments");
        }

        UploadResponse upload = fileStorageService.storeImage(file, "receipt");

        PaymentProof proof = paymentProofRepository.findByEnrollment(enrollment)
                .orElseGet(() -> PaymentProof.builder().enrollment(enrollment).build());

        // Delete old file if replacing
        if (proof.getImageKey() != null) {
            fileStorageService.deleteFile(proof.getImageKey());
        }

        proof.setImageKey(upload.getFileKey());
        proof.setImageUrl(upload.getFileUrl());
        paymentProofRepository.save(proof);

        EnrollmentResponse res = EnrollmentResponse.fromEntity(enrollment);
        res.setPaymentProof(PaymentProofResponse.fromEntity(proof));
        return res;
    }

    // ──────────────────────────────────────────────────────────────
    // Approve / Reject (Admin)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public EnrollmentResponse approve(Long enrollmentId, User admin) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", enrollmentId));

        if (enrollment.getStatus() != Enrollment.Status.PENDING) {
            throw new IllegalArgumentException("Only PENDING enrollments can be approved");
        }

        enrollment.setStatus(Enrollment.Status.APPROVED);
        enrollment.setReviewedBy(admin);
        enrollment.setReviewedAt(LocalDateTime.now());

        return EnrollmentResponse.fromEntity(enrollmentRepository.save(enrollment));
    }

    @Transactional
    public EnrollmentResponse reject(Long enrollmentId, String note, User admin) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", enrollmentId));

        if (enrollment.getStatus() != Enrollment.Status.PENDING) {
            throw new IllegalArgumentException("Only PENDING enrollments can be rejected");
        }

        enrollment.setStatus(Enrollment.Status.REJECTED);
        enrollment.setNote(note);
        enrollment.setReviewedBy(admin);
        enrollment.setReviewedAt(LocalDateTime.now());

        return EnrollmentResponse.fromEntity(enrollmentRepository.save(enrollment));
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private EnrollmentResponse buildResponseWithProgress(Enrollment e, User student) {
        EnrollmentResponse res = EnrollmentResponse.fromEntity(e);

        // Attach payment proof
        paymentProofRepository.findByEnrollment(e)
                .ifPresent(p -> res.setPaymentProof(PaymentProofResponse.fromEntity(p)));

        // Attach progress
        populateProgress(res, e, student);
        return res;
    }

    private void populateProgress(EnrollmentResponse res, Enrollment e, User student) {
        Course course = e.getCourse();
        long total = lessonRepository.countByCourse(course);
        long completed = lessonProgressRepository.countCompletedByStudentAndCourse(student, course);
        double pct = total > 0 ? Math.round((double) completed / total * 1000.0) / 10.0 : 0.0;

        res.setTotalLessons((int) total);
        res.setCompletedLessons((int) completed);
        res.setProgressPercent(pct);
    }

    private void checkReadAccess(Enrollment enrollment, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (enrollment.getStudent().getId().equals(user.getId())) return;
        throw new SecurityException("Access denied");
    }
}
