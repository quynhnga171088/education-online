CREATE TABLE lesson_attachments (
    id               BIGSERIAL     PRIMARY KEY,
    lesson_id        BIGINT        NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    file_name        VARCHAR(255)  NOT NULL,
    file_key         VARCHAR(500)  NOT NULL,
    file_url         TEXT          NOT NULL,
    file_type        VARCHAR(100)  NOT NULL,
    file_size_bytes  BIGINT        NOT NULL,
    order_index      INT           NOT NULL DEFAULT 0,
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_attachments_lesson_id ON lesson_attachments (lesson_id);
