CREATE TABLE bank_info (
    id                 SERIAL        PRIMARY KEY,
    bank_name          VARCHAR(255)  NOT NULL,
    account_number     VARCHAR(50)   NOT NULL,
    account_name       VARCHAR(255)  NOT NULL,
    branch             VARCHAR(255),
    transfer_template  TEXT,
    qr_image_url       TEXT,
    updated_by         BIGINT        REFERENCES users (id),
    updated_at         TIMESTAMP     NOT NULL DEFAULT NOW()
);
