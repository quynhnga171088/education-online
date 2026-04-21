package com.lms.repository;

import com.lms.entity.Lesson;
import com.lms.entity.LessonAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonAttachmentRepository extends JpaRepository<LessonAttachment, Long> {

    List<LessonAttachment> findAllByLessonOrderByOrderIndexAsc(Lesson lesson);
}
