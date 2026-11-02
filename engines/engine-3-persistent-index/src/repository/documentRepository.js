
import { createHash, randomUUID } from "node:crypto";

import { pool } from "../database/pool.js";
import { tokenizeText, NORMALIZATION_VERSION } from "../tokenizer/normalization.js";
import { validateEngine1Payload } from "./documentInputValidator.js";

function groupTokens(tokens) {
  const grouped = new Map();

  for (const { term, position } of tokens) {
    if (!grouped.has(term)) {
      grouped.set(term, []);
    }

    grouped.get(term).push(position);
  }

  return grouped;
}

export async function insertDocument(versionId, payload) {
  const document = validateEngine1Payload(payload);
  const tokens = tokenizeText(document.text);

  if (tokens.length === 0) {
    throw new Error("Cannot index a document with no searchable tokens");
  }

  if (tokens.length > 2147483647) {
    throw new Error("Document exceeds PostgreSQL integer token limit");
  }

  const groupedTerms = groupTokens(tokens);
  const documentId = randomUUID();

  const contentHash = createHash("sha256")
    .update(document.text, "utf8")
    .digest("hex");

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
      throw new Error("Documents can only be inserted into BUILDING versions");
    }

    if (version.normalization_version !== NORMALIZATION_VERSION) {
      throw new Error("Index normalization version is incompatible");
    }

    const documentResult = await client.query(
      `INSERT INTO engine3.documents (
         index_version_id,
         document_id,
         source_document_id,
         title,
         file_name,
         file_type,
         source_file_path,
         content_hash,
         content,
         document_length,
         character_count,
         word_count
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING
         index_version_id,
         document_id,
         source_document_id,
         file_name,
         file_type,
         document_length,
         character_count,
         word_count`,
      [
        versionId,
        documentId,
        document.documentId,
        null,
        document.fileName,
        document.fileType,
        document.filePath,
        contentHash,
        document.text,
        tokens.length,
        document.characterCount,
        document.wordCount
      ]
    );

    for (const [term, positions] of groupedTerms) {
      await client.query(
        `INSERT INTO engine3.terms (
           index_version_id,
           term,
           document_frequency
         )
         VALUES ($1, $2, 1)
         ON CONFLICT (index_version_id, term)
         DO UPDATE SET
           document_frequency =
             engine3.terms.document_frequency + 1`,
        [versionId, term]
      );

      await client.query(
        `INSERT INTO engine3.postings (
           index_version_id,
           term,
           document_id,
           term_frequency,
           positions
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          versionId,
          term,
          documentId,
          positions.length,
          positions
        ]
      );
    }

    await client.query("COMMIT");

    return {
      ...documentResult.rows[0],
      tokenCount: tokens.length,
      uniqueTermCount: groupedTerms.size,
      contentHash
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
