package com.lms.repository;

import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByStudentAndCourseAndStatusIn(User student, Course course, List<Enrollment.Status> statuses);

    boolean existsByStudentAndCourseAndStatusIn(User student, Course course, List<Enrollment.Status> statuses);

    Optional<Enrollment> findByStudentAndCourseAndStatus(User student, Course course, Enrollment.Status status);

    Page<Enrollment> findAllByStudent(User student, Pageable pageable);

    @Query("""
            SELECT e FROM Enrollment e
            WHERE (:status IS NULL OR e.status = :status)
              AND (:courseId IS NULL OR e.course.id = :courseId)
              AND (:studentId IS NULL OR e.student.id = :studentId)
            """)
    Page<Enrollment> findAllWithFilters(
            @Param("status") Enrollment.Status status,
            @Param("courseId") Long courseId,
            @Param("studentId") Long studentId,
            Pageable pageable
    );

    @Query("""
            SELECT e FROM Enrollment e
            JOIN FETCH e.student
            WHERE e.course = :course AND e.status = 'APPROVED'
            """)
    List<Enrollment> findApprovedStudentsByCourse(@Param("course") Course course);
}
