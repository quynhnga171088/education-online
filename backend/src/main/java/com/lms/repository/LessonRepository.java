package com.lms.repository;

import com.lms.entity.Course;
import com.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findAllByCourseOrderByOrderIndexAsc(Course course);

    Optional<Lesson> findByIdAndCourse(Long id, Course course);

    @Query("SELECT COALESCE(MAX(l.orderIndex), -1) FROM Lesson l WHERE l.course = :course")
    int findMaxOrderIndexByCourse(@Param("course") Course course);

    long countByCourse(Course course);
}
