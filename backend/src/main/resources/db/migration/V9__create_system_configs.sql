CREATE TABLE system_configs (
    id          SERIAL        PRIMARY KEY,
    key         VARCHAR(100)  NOT NULL,
    value       TEXT          NOT NULL,
    description VARCHAR(500),
    updated_by  BIGINT        REFERENCES users (id),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_system_configs_key UNIQUE (key)
);

CREATE INDEX idx_system_configs_key ON system_configs (key);
