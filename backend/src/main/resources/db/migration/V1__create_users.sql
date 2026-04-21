CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');

CREATE TABLE users (
    id                     BIGSERIAL PRIMARY KEY,
    email                  VARCHAR(255)  NOT NULL,
    password_hash          VARCHAR(255)  NOT NULL,
    full_name              VARCHAR(255)  NOT NULL,
    avatar_url             TEXT,
    phone                  VARCHAR(20),
    role                   user_role     NOT NULL DEFAULT 'STUDENT',
    status                 user_status   NOT NULL DEFAULT 'ACTIVE',
    reset_token            VARCHAR(255),
    reset_token_expires_at TIMESTAMP,
    created_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_role   ON users (role);
CREATE INDEX idx_users_status ON users (status);
