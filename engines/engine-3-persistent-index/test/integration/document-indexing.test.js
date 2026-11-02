
import test from "node:test";
import assert from "node:assert/strict";

import { insertDocument } from "../../src/repository/documentRepository.js";
import { pool } from "../../src/database/pool.js";

import {
  resetTestDatabase,
  closeTestDatabase
} from "../../src/test-helpers/testDatabase.js";

test("inserts a document and its postings into the isolated test database", async () => {
  const version = await resetTestDatabase();
  const versionId = version.id;

  const text = "information retrieval information research";

  const payload = {
    schemaVersion: "1.0",
    document: {
      documentId: "engine1-integration-test-001",
      fileName: "integration-test.txt",
      filePath: "/test-fixtures/integration-test.txt",
      fileType: ".txt",
      text,
      characterCount: text.length,
      wordCount: 4,
      processingStatus: "COMPLETED",
      metadata: {
        workerPid: 1234,
        processingTimeMs: 10,
        ocrConfidence: null
      }
    }
  };

  const inserted = await insertDocument(versionId, payload);

  assert.equal(inserted.source_document_id, payload.document.documentId);
  assert.equal(inserted.document_length, 4);
  assert.equal(inserted.tokenCount, 4);
  assert.equal(inserted.uniqueTermCount, 3);

  const postings = await pool.query(
    `SELECT term, term_frequency, positions
     FROM engine3.postings
     WHERE index_version_id = $1
       AND document_id = $2
     ORDER BY term`,
    [versionId, inserted.document_id]
  );

  assert.deepEqual(
    postings.rows.map(row => ({
      term: row.term,
      frequency: row.term_frequency,
      positions: row.positions
    })),
    [
      { term: "information", frequency: 2, positions: [0, 2] },
      { term: "research", frequency: 1, positions: [3] },
      { term: "retrieval", frequency: 1, positions: [1] }
    ]
  );

  console.log("Test database insertion verified:", inserted);
});

test("rejects document insertion into an incompatible normalization version", async () => {
  await resetTestDatabase();

  const result = await pool.query(
    `INSERT INTO engine3.index_versions (normalization_version)
     VALUES ('1.0')
     RETURNING id`
  );

  const oldVersionId = result.rows[0].id;

  const payload = {
    schemaVersion: "1.0",
    document: {
      documentId: "normalization-compatibility-test",
      fileName: "compatibility-test.txt",
      filePath: "/test-fixtures/compatibility-test.txt",
      fileType: ".txt",
      text: "information retrieval",
      characterCount: 21,
      wordCount: 2,
      processingStatus: "COMPLETED",
      metadata: {
        workerPid: 1234,
        processingTimeMs: 10,
        ocrConfidence: null
      }
    }
  };

  await assert.rejects(
    insertDocument(oldVersionId, payload),
    /Index normalization version is incompatible/
  );

  console.log("Incompatible normalization version correctly rejected.");
});

test("closes the test database connection", async () => {
  await closeTestDatabase();
});
