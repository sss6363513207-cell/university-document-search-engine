import test from "node:test";
import assert from "node:assert/strict";

import { search } from "../../../engine-2-search-retrieval/src/searchService.js";
import { PostgresIndexProvider } from "../../src/provider/postgresIndexProvider.js";
import { insertDocument } from "../../src/repository/documentRepository.js";
import { publishVersion } from "../../src/repository/indexVersionRepository.js";
import {
  resetTestDatabase,
  closeTestDatabase
} from "../../src/test-helpers/testDatabase.js";

test("Engine 2 searches the isolated PostgreSQL index through Engine 3", async () => {
  const provider = new PostgresIndexProvider();

  try {
    const version = await resetTestDatabase();

    const text =
      "information retrieval systems use inverted indexes for efficient document searching";

    const payload = {
      schemaVersion: "1.0",
      document: {
        documentId: "engine2-postgres-search-test-001",
        fileName: "search-integration-test.txt",
        filePath: "/test-fixtures/search-integration-test.txt",
        fileType: ".txt",
        text,
        characterCount: text.length,
        wordCount: 11,
        processingStatus: "COMPLETED",
        metadata: {
          workerPid: 1234,
          processingTimeMs: 10,
          ocrConfidence: null
        }
      }
    };

    await insertDocument(version.id, payload);
    await publishVersion(version.id);

    const result = await search(
      {
        query: "information AND retrieval",
        algorithm: "bm25",
        topK: 10
      },
      provider
    );

    console.log("Isolated PostgreSQL search result:");
    console.log(JSON.stringify(result, null, 2));

    assert.ok(result);
    assert.equal(result.success, true);
    assert.ok(Array.isArray(result.results));

    const match = result.results.find(
      document =>
        document.metadata.fileName === "search-integration-test.txt"
    );

    assert.ok(match, "Expected test document was not retrieved");
    assert.ok(match.snippet.includes("information retrieval"));
    assert.equal(match.rank, 1);
  } finally {
    await closeTestDatabase();
  }
});
