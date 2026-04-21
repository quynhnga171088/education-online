CREATE TYPE lesson_type AS ENUM ('VIDEO', 'TEXT');
CREATE TYPE lesson_status AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE video_source_type AS ENUM ('UPLOAD', 'YOUTUBE', 'VIMEO', 'DRIVE');

CREATE TABLE lessons (
    id                      BIGSERIAL          PRIMARY KEY,
    course_id               BIGINT             NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    title                   VARCHAR(255)       NOT NULL,
    description             TEXT,
    order_index             INT                NOT NULL DEFAULT 0,
    type                    lesson_type        NOT NULL,
    status                  lesson_status      NOT NULL DEFAULT 'PUBLISHED',
    text_content            TEXT,
    video_source_type       video_source_type,
    video_url               TEXT,
    video_file_key          VARCHAR(500),
    video_duration_seconds  INT,
    created_at              TIMESTAMP          NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP          NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMP
);

CREATE INDEX idx_lessons_course_id             ON lessons (course_id);
CREATE INDEX idx_lessons_course_order          ON lessons (course_id, order_index);
CREATE INDEX idx_lessons_deleted_at            ON lessons (deleted_at);
