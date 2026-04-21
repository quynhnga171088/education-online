CREATE TYPE progress_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE lesson_progress (
    id                        BIGSERIAL        PRIMARY KEY,
    student_id                BIGINT           NOT NULL REFERENCES users (id),
    lesson_id                 BIGINT           NOT NULL REFERENCES lessons (id),
    course_id                 BIGINT           NOT NULL REFERENCES courses (id),
    status                    progress_status  NOT NULL DEFAULT 'NOT_STARTED',
    video_watched_seconds     INT              NOT NULL DEFAULT 0,
    video_max_watched_percent FLOAT            NOT NULL DEFAULT 0,
    completed_at              TIMESTAMP,
    last_accessed_at          TIMESTAMP,
    created_at                TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP        NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lesson_progress_student_lesson UNIQUE (student_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_student_course ON lesson_progress (student_id, course_id);
CREATE INDEX idx_lesson_progress_lesson_id      ON lesson_progress (lesson_id);
CREATE INDEX idx_lesson_progress_status         ON lesson_progress (status);
