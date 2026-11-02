
import { pool } from "../database/pool.js";
import { NORMALIZATION_VERSION } from "../tokenizer/normalization.js";

export async function createBuildingVersion() {
  const result = await pool.query(
    `INSERT INTO engine3.index_versions (normalization_version)
     VALUES ($1)
     RETURNING id, version_number, status, normalization_version,
               document_count, term_count, posting_count,
               average_document_length, created_at`,
    [NORMALIZATION_VERSION]
  );

  return result.rows[0];
}

export async function getVersionById(versionId) {
  const result = await pool.query(
    `SELECT id, version_number, status, normalization_version,
            document_count, term_count, posting_count,
            average_document_length, created_at, published_at
     FROM engine3.index_versions
     WHERE id = $1`,
    [versionId]
  );

  return result.rows[0] ?? null;
}

export async function publishVersion(versionId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const versionResult = await client.query(
      `SELECT id, status, normalization_version
       FROM engine3.index_versions
       WHERE id = $1
       FOR UPDATE`,
      [versionId]
    );

    if (versionResult.rowCount === 0) {
      throw new Error(`Index version ${versionId} does not exist`);
    }

    const version = versionResult.rows[0];

    if (version.status !== "BUILDING") {
      throw new Error("Only BUILDING versions can be published");
    }

    if (version.normalization_version !== NORMALIZATION_VERSION) {
      throw new Error("Index normalization version is incompatible");
    }

    const documentResult = await client.query(
      `SELECT
         COUNT(*)::integer AS document_count,
         COALESCE(AVG(document_length), 0)::double precision
           AS average_document_length
       FROM engine3.documents
       WHERE index_version_id = $1`,
      [versionId]
    );

    const termResult = await client.query(
      `SELECT COUNT(*)::integer AS term_count
       FROM engine3.terms
       WHERE index_version_id = $1`,
      [versionId]
    );

    const postingResult = await client.query(
      `SELECT COUNT(*)::bigint AS posting_count
       FROM engine3.postings
       WHERE index_version_id = $1`,
      [versionId]
    );

    const statistics = documentResult.rows[0];
    const documentCount = statistics.document_count;

    if (documentCount === 0) {
      throw new Error("Cannot publish an empty index version");
    }

    // Every document must have at least one posting, and the
    // sum of posting frequencies must equal its indexed length.
    const invalidDocuments = await client.query(
      `SELECT d.document_id
       FROM engine3.documents d
       LEFT JOIN (
         SELECT index_version_id, document_id,
                SUM(term_frequency)::bigint AS indexed_length
         FROM engine3.postings
         WHERE index_version_id = $1
         GROUP BY index_version_id, document_id
       ) p
         ON p.index_version_id = d.index_version_id
        AND p.document_id = d.document_id
       WHERE d.index_version_id = $1
         AND (
           p.document_id IS NULL
           OR p.indexed_length <> d.document_length
         )
       LIMIT 10`,
      [versionId]
    );

    if (invalidDocuments.rowCount > 0) {
      throw new Error(
        `Invalid document postings: ${invalidDocuments.rows
          .map(row => row.document_id)
          .join(", ")}`
      );
    }

    // Verify that stored document frequencies equal actual
    // posting counts for every term.
    const invalidTerms = await client.query(
      `SELECT t.term
       FROM engine3.terms t
       LEFT JOIN (
         SELECT index_version_id, term,
                COUNT(*)::integer AS actual_frequency
         FROM engine3.postings
         WHERE index_version_id = $1
         GROUP BY index_version_id, term
       ) p
         ON p.index_version_id = t.index_version_id
        AND p.term = t.term
       WHERE t.index_version_id = $1
         AND (
           p.term IS NULL
           OR p.actual_frequency <> t.document_frequency
         )
       LIMIT 10`,
      [versionId]
    );

    if (invalidTerms.rowCount > 0) {
      throw new Error(
        `Invalid term frequencies: ${invalidTerms.rows
          .map(row => row.term)
          .join(", ")}`
      );
    }

    // Verify posting positions and term frequencies.
    const invalidPostings = await client.query(
      `SELECT term, document_id
       FROM engine3.postings
       WHERE index_version_id = $1
         AND (
           cardinality(positions) <> term_frequency
           OR array_position(positions, NULL::integer) IS NOT NULL
           OR EXISTS (
             SELECT 1
             FROM generate_subscripts(positions, 1) AS s(i)
             WHERE positions[s.i] < 0
                OR (
                  s.i > 1
                  AND positions[s.i] <= positions[s.i - 1]
                )
           )
         )
       LIMIT 10`,
      [versionId]
    );

    if (invalidPostings.rowCount > 0) {
      throw new Error("Invalid posting positions detected");
    }

    await client.query(
      `UPDATE engine3.index_versions
       SET status = 'READY',
           document_count = $2,
           term_count = $3,
           posting_count = $4,
           average_document_length = $5,
           published_at = NOW()
       WHERE id = $1`,
      [
        versionId,
        documentCount,
        termResult.rows[0].term_count,
        postingResult.rows[0].posting_count,
        statistics.average_document_length
      ]
    );

    await client.query("COMMIT");

    return getVersionById(versionId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function failVersion(versionId) {
  const result = await pool.query(
    `UPDATE engine3.index_versions
     SET status = 'FAILED'
     WHERE id = $1 AND status = 'BUILDING'
     RETURNING id, version_number, status`,
    [versionId]
  );

  if (result.rowCount === 0) {
    throw new Error(
      `Index version ${versionId} does not exist or is not BUILDING`
    );
  }

  return result.rows[0];
}
