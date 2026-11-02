BEGIN;

CREATE SCHEMA IF NOT EXISTS engine3;

CREATE TABLE engine3.index_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'BUILDING'
        CHECK (status IN ('BUILDING', 'READY', 'FAILED')),
    normalization_version VARCHAR(20) NOT NULL,
    document_count INTEGER NOT NULL DEFAULT 0 CHECK (document_count >= 0),
    term_count INTEGER NOT NULL DEFAULT 0 CHECK (term_count >= 0),
    posting_count BIGINT NOT NULL DEFAULT 0 CHECK (posting_count >= 0),
    average_document_length DOUBLE PRECISION NOT NULL DEFAULT 0
        CHECK (average_document_length >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CHECK (
        (status = 'READY' AND published_at IS NOT NULL)
        OR status <> 'READY'
    )
);

CREATE TABLE engine3.documents (
    index_version_id BIGINT NOT NULL
        REFERENCES engine3.index_versions(id) ON DELETE RESTRICT,
    document_id VARCHAR(128) NOT NULL,
    source_document_id VARCHAR(128) NOT NULL,
    title TEXT,
    file_name VARCHAR(512) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    source_file_path TEXT,
    content_hash CHAR(64),
    content TEXT NOT NULL,
    document_length INTEGER NOT NULL CHECK (document_length > 0),
    character_count INTEGER NOT NULL CHECK (character_count >= 0),
    word_count INTEGER NOT NULL CHECK (word_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (index_version_id, document_id)
);

CREATE INDEX documents_source_id_idx
    ON engine3.documents(source_document_id);

CREATE INDEX documents_content_hash_idx
    ON engine3.documents(content_hash);

CREATE TABLE engine3.terms (
    index_version_id BIGINT NOT NULL
        REFERENCES engine3.index_versions(id) ON DELETE RESTRICT,
    term TEXT NOT NULL,
    document_frequency INTEGER NOT NULL
        CHECK (document_frequency >= 0),
    PRIMARY KEY (index_version_id, term)
);

CREATE TABLE engine3.postings (
    index_version_id BIGINT NOT NULL,
    term TEXT NOT NULL,
    document_id VARCHAR(128) NOT NULL,
    term_frequency INTEGER NOT NULL CHECK (term_frequency > 0),
    positions INTEGER[] NOT NULL,
    PRIMARY KEY (index_version_id, term, document_id),

    FOREIGN KEY (index_version_id, term)
        REFERENCES engine3.terms(index_version_id, term)
        ON DELETE RESTRICT,

    FOREIGN KEY (index_version_id, document_id)
        REFERENCES engine3.documents(index_version_id, document_id)
        ON DELETE RESTRICT,

    CHECK (cardinality(positions) = term_frequency),
    CHECK (array_position(positions, NULL) IS NULL)
);

CREATE OR REPLACE FUNCTION engine3.validate_posting_positions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    i INTEGER;
BEGIN
    IF array_position(NEW.positions, NULL) IS NOT NULL THEN
        RAISE EXCEPTION 'Posting positions cannot contain NULL';
    END IF;

    FOR i IN 1..cardinality(NEW.positions) LOOP
        IF NEW.positions[i] < 0 THEN
            RAISE EXCEPTION 'Posting positions must be non-negative';
        END IF;

        IF i > 1 AND NEW.positions[i] <= NEW.positions[i - 1] THEN
            RAISE EXCEPTION 'Posting positions must be strictly increasing';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_posting_positions
BEFORE INSERT OR UPDATE ON engine3.postings
FOR EACH ROW
EXECUTE FUNCTION engine3.validate_posting_positions();

CREATE INDEX postings_document_idx
    ON engine3.postings(index_version_id, document_id);

CREATE TABLE engine3.snapshots (
    snapshot_id UUID PRIMARY KEY,
    index_version_id BIGINT NOT NULL
        REFERENCES engine3.index_versions(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'CLOSED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    CHECK (expires_at > created_at)
);

CREATE INDEX snapshots_active_version_idx
    ON engine3.snapshots(index_version_id, expires_at)
    WHERE status = 'OPEN';

CREATE OR REPLACE FUNCTION engine3.prevent_published_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_version_id BIGINT;
    version_status VARCHAR(20);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_version_id := OLD.index_version_id;
    ELSE
        target_version_id := NEW.index_version_id;
    END IF;

    SELECT status
      INTO version_status
      FROM engine3.index_versions
     WHERE id = target_version_id
     FOR KEY SHARE;

    IF version_status = 'READY' THEN
        RAISE EXCEPTION
            'Published index version % is immutable',
            target_version_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION engine3.protect_index_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status = 'READY' THEN
        RAISE EXCEPTION
            'Published index version % cannot be modified',
            OLD.id;
    END IF;

    IF NEW.id <> OLD.id
       OR NEW.version_number <> OLD.version_number THEN
        RAISE EXCEPTION 'Index version identity cannot be changed';
    END IF;

    IF OLD.status <> 'BUILDING'
       AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION
            'Only BUILDING versions can transition to another state';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_index_version
BEFORE UPDATE OR DELETE ON engine3.index_versions
FOR EACH ROW
EXECUTE FUNCTION engine3.protect_index_version();

CREATE TRIGGER immutable_documents
BEFORE INSERT OR UPDATE OR DELETE ON engine3.documents
FOR EACH ROW
EXECUTE FUNCTION engine3.prevent_published_version_mutation();

CREATE TRIGGER immutable_terms
BEFORE INSERT OR UPDATE OR DELETE ON engine3.terms
FOR EACH ROW
EXECUTE FUNCTION engine3.prevent_published_version_mutation();

CREATE TRIGGER immutable_postings
BEFORE INSERT OR UPDATE OR DELETE ON engine3.postings
FOR EACH ROW
EXECUTE FUNCTION engine3.prevent_published_version_mutation();

COMMIT;
