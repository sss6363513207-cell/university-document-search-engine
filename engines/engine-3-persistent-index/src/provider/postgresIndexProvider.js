
import { pool } from "../database/pool.js";
import {
  openSnapshot as createSnapshot,
  getOpenSnapshot,
  closeSnapshot as closeSnapshotRecord
} from "../snapshot/snapshotRepository.js";

export class PostgresIndexProvider {
  async openSnapshot() {
    const snapshot = await createSnapshot();

    return {
      snapshotId: snapshot.snapshotId,
      indexVersion: snapshot.indexVersion,
      documentCount: snapshot.documentCount,
      averageDocumentLength: snapshot.averageDocumentLength,
      normalizationVersion: snapshot.normalizationVersion
    };
  }

  async #getSnapshotContext(snapshotId) {
    if (typeof snapshotId !== "string" || !snapshotId.trim()) {
      throw new TypeError("A valid snapshotId is required");
    }

    return getOpenSnapshot(snapshotId);
  }

  #envelope(snapshot, data) {
    return {
      snapshotId: snapshot.snapshotId,
      indexVersion: snapshot.indexVersion,
      data
    };
  }

  async getPostings(terms, snapshotId) {
    if (!Array.isArray(terms)) {
      throw new TypeError("terms must be an array");
    }

    const snapshot = await this.#getSnapshotContext(snapshotId);
    const data = Object.create(null);

    for (const term of terms) {
      if (typeof term !== "string" || !term.trim()) {
        throw new TypeError("Every term must be a non-empty string");
      }

      data[term] = {
        documentFrequency: 0,
        postings: []
      };
    }

    if (terms.length === 0) {
      return this.#envelope(snapshot, data);
    }

    const result = await pool.query(
      `SELECT term, document_id, term_frequency, positions
       FROM engine3.postings
       WHERE index_version_id = $1
         AND term = ANY($2::text[])
       ORDER BY term, document_id`,
      [snapshot.indexVersionId, [...new Set(terms)]]
    );

    for (const row of result.rows) {
      if (!data[row.term]) continue;

      data[row.term].postings.push({
        documentId: row.document_id,
        termFrequency: row.term_frequency,
        positions: row.positions
      });
    }

    for (const term of Object.keys(data)) {
      data[term].documentFrequency =
        data[term].postings.length;
    }

    return this.#envelope(snapshot, data);
  }

  async getDocumentStats(documentIds, snapshotId) {
    if (!Array.isArray(documentIds)) {
      throw new TypeError("documentIds must be an array");
    }

    const snapshot = await this.#getSnapshotContext(snapshotId);
    const data = Object.create(null);

    if (documentIds.length > 0) {
      const result = await pool.query(
        `SELECT document_id, document_length
         FROM engine3.documents
         WHERE index_version_id = $1
           AND document_id = ANY($2::varchar[])
         ORDER BY document_id`,
        [snapshot.indexVersionId, documentIds]
      );

      for (const row of result.rows) {
        data[row.document_id] = row.document_length;
      }
    }

    return this.#envelope(snapshot, data);
  }

  async getDocumentMetadata(documentIds, snapshotId) {
    if (!Array.isArray(documentIds)) {
      throw new TypeError("documentIds must be an array");
    }

    const snapshot = await this.#getSnapshotContext(snapshotId);
    const data = Object.create(null);

    if (documentIds.length > 0) {
      const result = await pool.query(
        `SELECT document_id, title, file_name, file_type,
                source_file_path, content_hash,
                document_length, character_count, word_count
         FROM engine3.documents
         WHERE index_version_id = $1
           AND document_id = ANY($2::varchar[])
         ORDER BY document_id`,
        [snapshot.indexVersionId, documentIds]
      );

      for (const row of result.rows) {
        data[row.document_id] = {
          title: row.title,
          fileName: row.file_name,
          fileType: row.file_type,
          sourceFilePath: row.source_file_path,
          contentHash: row.content_hash,
          documentLength: row.document_length,
          characterCount: row.character_count,
          wordCount: row.word_count
        };
      }
    }

    return this.#envelope(snapshot, data);
  }

  async getAllDocumentIds(snapshotId) {
    const snapshot = await this.#getSnapshotContext(snapshotId);

    const result = await pool.query(
      `SELECT document_id
       FROM engine3.documents
       WHERE index_version_id = $1
       ORDER BY document_id`,
      [snapshot.indexVersionId]
    );

    return this.#envelope(
      snapshot,
      result.rows.map(row => row.document_id)
    );
  }

  async getDocumentContent(documentIds, snapshotId) {
    if (!Array.isArray(documentIds)) {
      throw new TypeError("documentIds must be an array");
    }

    const snapshot = await this.#getSnapshotContext(snapshotId);
    const data = Object.create(null);

    if (documentIds.length > 0) {
      const result = await pool.query(
        `SELECT document_id, content, title,
                file_name, file_type
         FROM engine3.documents
         WHERE index_version_id = $1
           AND document_id = ANY($2::varchar[])
         ORDER BY document_id`,
        [snapshot.indexVersionId, documentIds]
      );

      for (const row of result.rows) {
        data[row.document_id] = {
          content: row.content,
          title: row.title,
          fileName: row.file_name,
          fileType: row.file_type
        };
      }
    }

    return this.#envelope(snapshot, data);
  }

  async closeSnapshot(snapshotId) {
    return closeSnapshotRecord(snapshotId);
  }
}
