CREATE TYPE enrollment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE enrollments (
    id           BIGSERIAL          PRIMARY KEY,
    student_id   BIGINT             NOT NULL REFERENCES users (id),
    course_id    BIGINT             NOT NULL REFERENCES courses (id),
    status       enrollment_status  NOT NULL DEFAULT 'PENDING',
    note         TEXT,
    reviewed_by  BIGINT             REFERENCES users (id),
    reviewed_at  TIMESTAMP,
    created_at   TIMESTAMP          NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX idx_enrollments_course_id  ON enrollments (course_id);
CREATE INDEX idx_enrollments_status     ON enrollments (status);
