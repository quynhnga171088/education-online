CREATE TYPE course_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE courses (
    id                BIGSERIAL       PRIMARY KEY,
    title             VARCHAR(255)    NOT NULL,
    slug              VARCHAR(255)    NOT NULL,
    description       TEXT,
    short_description VARCHAR(500),
    thumbnail_url     TEXT,
    price             DECIMAL(15, 2)  NOT NULL DEFAULT 0,
    status            course_status   NOT NULL DEFAULT 'DRAFT',
    teacher_id        BIGINT          NOT NULL REFERENCES users (id),
    created_by        BIGINT          NOT NULL REFERENCES users (id),
    published_at      TIMESTAMP,
    created_at        TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMP,
    CONSTRAINT uq_courses_slug UNIQUE (slug)
);

CREATE INDEX idx_courses_slug       ON courses (slug);
CREATE INDEX idx_courses_status     ON courses (status);
CREATE INDEX idx_courses_teacher_id ON courses (teacher_id);
CREATE INDEX idx_courses_deleted_at ON courses (deleted_at);
