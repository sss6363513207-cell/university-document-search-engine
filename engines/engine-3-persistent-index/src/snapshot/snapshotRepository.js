
import { randomUUID } from "node:crypto";
import { pool } from "../database/pool.js";

const DEFAULT_LEASE_SECONDS = 30 * 60;

export async function openSnapshot({
  versionId = null,
  leaseSeconds = DEFAULT_LEASE_SECONDS
} = {}) {
  if (!Number.isSafeInteger(leaseSeconds) || leaseSeconds <= 0) {
    throw new TypeError("leaseSeconds must be a positive integer");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const versionResult = versionId === null
      ? await client.query(
          `SELECT id, version_number, normalization_version,
                  document_count, average_document_length
           FROM engine3.index_versions
           WHERE status = 'READY'
           ORDER BY version_number DESC
           LIMIT 1
           FOR SHARE`
        )
      : await client.query(
          `SELECT id, version_number, normalization_version,
                  document_count, average_document_length
           FROM engine3.index_versions
           WHERE id = $1 AND status = 'READY'
           FOR SHARE`,
          [versionId]
        );

    if (versionResult.rowCount === 0) {
      throw new Error("No matching READY index version exists");
    }

    const version = versionResult.rows[0];
    const snapshotId = randomUUID();

    const snapshotResult = await client.query(
      `INSERT INTO engine3.snapshots (
         snapshot_id, index_version_id, expires_at
       )
       VALUES (
         $1, $2, NOW() + ($3 * INTERVAL '1 second')
       )
       RETURNING snapshot_id, index_version_id,
                 status, created_at, expires_at`,
      [snapshotId, version.id, leaseSeconds]
    );

    await client.query("COMMIT");

    return {
      snapshotId: snapshotResult.rows[0].snapshot_id,
      indexVersionId: version.id,
      indexVersion: String(version.version_number),
      normalizationVersion: version.normalization_version,
      documentCount: version.document_count,
      averageDocumentLength: version.average_document_length,
      status: snapshotResult.rows[0].status,
      createdAt: snapshotResult.rows[0].created_at,
      expiresAt: snapshotResult.rows[0].expires_at
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOpenSnapshot(snapshotId) {
  const result = await pool.query(
    `UPDATE engine3.snapshots
     SET status = 'EXPIRED'
     WHERE snapshot_id = $1
       AND status = 'OPEN'
       AND expires_at <= NOW()
     RETURNING snapshot_id`,
    [snapshotId]
  );

  const snapshotResult = await pool.query(
    `SELECT s.snapshot_id, s.index_version_id,
            s.status, s.created_at, s.expires_at,
            v.version_number, v.normalization_version,
            v.document_count, v.average_document_length
     FROM engine3.snapshots s
     JOIN engine3.index_versions v
       ON v.id = s.index_version_id
     WHERE s.snapshot_id = $1`,
    [snapshotId]
  );

  if (snapshotResult.rowCount === 0) {
    throw new Error("Snapshot does not exist");
  }

  const snapshot = snapshotResult.rows[0];

  if (snapshot.status !== "OPEN") {
    throw new Error(`Snapshot is ${snapshot.status}`);
  }

  return {
    snapshotId: snapshot.snapshot_id,
    indexVersionId: snapshot.index_version_id,
    indexVersion: String(snapshot.version_number),
    normalizationVersion: snapshot.normalization_version,
    documentCount: snapshot.document_count,
    averageDocumentLength: snapshot.average_document_length,
    expiresAt: snapshot.expires_at
  };
}

export async function closeSnapshot(snapshotId) {
  const result = await pool.query(
    `UPDATE engine3.snapshots
     SET status = 'CLOSED',
         closed_at = NOW()
     WHERE snapshot_id = $1
       AND status = 'OPEN'
     RETURNING snapshot_id, status, closed_at`,
    [snapshotId]
  );

  if (result.rowCount === 0) {
    throw new Error(
      "Snapshot does not exist or is not OPEN"
    );
  }

  return result.rows[0];
}
