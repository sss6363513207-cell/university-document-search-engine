const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  prepareDocumentForEngine2
} = require("../src/integration/engine2Adapter");

const sampleDocument = {
  documentId: "1",
  fileName: "dsa.txt",
  filePath: "/input/dsa.txt",
  fileType: ".txt",
  text: "Data structures and algorithms",
  characterCount: 30,
  wordCount: 4,
  processingStatus: "COMPLETED",
  metadata: {
    workerPid: 1234,
    processingTimeMs: 1.2,
    ocrConfidence: null
  }
};

test("Valid document should be prepared for Engine 2", () => {
  const result = prepareDocumentForEngine2(sampleDocument);

  assert.equal(result.schemaVersion, "1.0");
  assert.equal(result.document.documentId, "1");
  assert.equal(result.document.fileName, "dsa.txt");
  assert.equal(result.document.text, sampleDocument.text);
});

test("Invalid document should be rejected", () => {
  assert.throws(
    () => prepareDocumentForEngine2({
      documentId: "2",
      fileName: "test.txt"
    }),
    /Missing required field/
  );
});

test("Prepared document should preserve metadata", () => {
  const result = prepareDocumentForEngine2(sampleDocument);

  assert.deepEqual(
    result.document.metadata,
    sampleDocument.metadata
  );
});
