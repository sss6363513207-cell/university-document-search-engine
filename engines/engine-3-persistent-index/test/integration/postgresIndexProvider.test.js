import test from "node:test";
import assert from "node:assert/strict";

import { PostgresIndexProvider } from "../../src/provider/postgresIndexProvider.js";
import { insertDocument } from "../../src/repository/documentRepository.js";
import { publishVersion } from "../../src/repository/indexVersionRepository.js";
import { resetTestDatabase, closeTestDatabase } from "../../src/test-helpers/testDatabase.js";

test("PostgreSQL provider implements the Engine 2 data contract", async () => {
  const provider = new PostgresIndexProvider();
  let snapshotId;

  try {
    const version = await resetTestDatabase();
    const versionId = version.id;

    const text = "search engines use inverted indexes for information retrieval";

    const payload = {
      schemaVersion: "1.0",
      document: {
        documentId: "provider-integration-test-001",
        fileName: "provider-test.txt",
        filePath: "/test-fixtures/provider-test.txt",
        fileType: ".txt",
        text,
        characterCount: text.length,
        wordCount: 8,
        processingStatus: "COMPLETED",
        metadata: {
          workerPid: 1234,
          processingTimeMs: 10,
          ocrConfidence: null
        }
      }
    };

    const inserted = await insertDocument(versionId, payload);
    const publishedVersion = await publishVersion(versionId);

    const snapshot = await provider.openSnapshot();
    snapshotId = snapshot.snapshotId;

    assert.equal(typeof snapshot.snapshotId, "string");
    assert.equal(snapshot.indexVersion, String(publishedVersion.version_number));
    assert.equal(snapshot.documentCount, 1);
    assert.equal(snapshot.normalizationVersion, "1.1");

    const postingsResponse = await provider.getPostings(
      ["search", "information", "missingterm"],
      snapshotId
    );

    assert.equal(postingsResponse.snapshotId, snapshotId);
    assert.equal(postingsResponse.indexVersion, snapshot.indexVersion);
    assert.equal(postingsResponse.data.search.documentFrequency, 1);
    assert.equal(postingsResponse.data.information.documentFrequency, 1);
    assert.equal(postingsResponse.data.missingterm.documentFrequency, 0);

    const idsResponse = await provider.getAllDocumentIds(snapshotId);
    assert.deepEqual(idsResponse.data, [inserted.document_id]);

    const documentId = idsResponse.data[0];

    const statsResponse = await provider.getDocumentStats(
      [documentId],
      snapshotId
    );
    assert.equal(statsResponse.data[documentId], 8);

    const metadataResponse = await provider.getDocumentMetadata(
      [documentId],
      snapshotId
    );
    assert.equal(metadataResponse.data[documentId].fileName, "provider-test.txt");

    const contentResponse = await provider.getDocumentContent(
      [documentId],
      snapshotId
    );
    assert.equal(contentResponse.data[documentId].content, text);

    console.log("Engine 2 provider contract verified against isolated PostgreSQL test data.");
  } finally {
    if (snapshotId) {
      await provider.closeSnapshot(snapshotId);
    }

    await closeTestDatabase();
  }
});
