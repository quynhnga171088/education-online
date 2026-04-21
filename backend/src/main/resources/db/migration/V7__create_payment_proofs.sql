CREATE TABLE payment_proofs (
    id             BIGSERIAL  PRIMARY KEY,
    enrollment_id  BIGINT     NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE,
    image_url      TEXT,
    image_key      VARCHAR(500),
    note           TEXT,
    created_at     TIMESTAMP  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_proofs_enrollment UNIQUE (enrollment_id)
);

CREATE INDEX idx_payment_proofs_enrollment_id ON payment_proofs (enrollment_id);
