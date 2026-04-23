package com.lms.repository;

import com.lms.entity.Course;
import com.lms.entity.Lesson;
import com.lms.entity.LessonProgress;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByStudentAndLesson(User student, Lesson lesson);

    List<LessonProgress> findAllByStudentAndCourse(User student, Course course);

    @Query("""
            SELECT COUNT(lp) FROM LessonProgress lp
            WHERE lp.student = :student AND lp.course = :course AND lp.status = 'COMPLETED'
            """)
    long countCompletedByStudentAndCourse(@Param("student") User student, @Param("course") Course course);

    Optional<LessonProgress> findByStudentAndLesson(User student, Lesson lesson);

    long countByStatus(LessonProgress.Status status);

    /** Returns [lessonId, lessonTitle, completedCount] per lesson for a course */
    @Query("""
            SELECT lp.lesson.id, lp.lesson.title, COUNT(lp)
            FROM LessonProgress lp
            WHERE lp.course.id = :courseId AND lp.status = :status
            GROUP BY lp.lesson.id, lp.lesson.title
            """)
    List<Object[]> findLessonCompletionStatsByCourse(@Param("courseId") Long courseId,
                                                     @Param("status") LessonProgress.Status status);
}
