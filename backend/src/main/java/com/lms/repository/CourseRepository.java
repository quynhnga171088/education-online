package com.lms.repository;

import com.lms.entity.Course;
import com.lms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("""
            SELECT c FROM Course c
            WHERE (:status IS NULL OR c.status = :status)
              AND (:search IS NULL
                   OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.shortDescription) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Course> findAllWithFilters(
            @Param("status") Course.Status status,
            @Param("search") String search,
            Pageable pageable
    );

    Page<Course> findAllByTeacher(User teacher, Pageable pageable);
}
