
CREATE TABLE IF NOT EXISTS engine4.documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title VARCHAR(500) NOT NULL,
    description TEXT,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,

    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    checksum_sha256 CHAR(64) NOT NULL,

    document_type VARCHAR(100),
    access_level VARCHAR(20) NOT NULL DEFAULT 'PRIVATE'
        CHECK (
            access_level IN (
                'PUBLIC',
                'UNIVERSITY',
                'DEPARTMENT',
                'RESTRICTED',
                'PRIVATE'
            )
        ),

    department_id BIGINT REFERENCES engine4.departments(id),
    uploaded_by BIGINT NOT NULL REFERENCES engine4.users(id),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT documents_checksum_format
        CHECK (checksum_sha256 ~ '^[a-fA-F0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
    ON engine4.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_documents_department
    ON engine4.documents(department_id);

CREATE INDEX IF NOT EXISTS idx_documents_access_level
    ON engine4.documents(access_level);

CREATE INDEX IF NOT EXISTS idx_documents_created_at
    ON engine4.documents(created_at DESC);
