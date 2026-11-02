
import test from "node:test";
import assert from "node:assert/strict";

import {
  validateEngine1Payload
} from "../../src/repository/documentInputValidator.js";

const validPayload = {
  schemaVersion: "1.0",
  document: {
    documentId: "engine1-task-001",
    fileName: "research-paper.txt",
    filePath: "/documents/research-paper.txt",
    fileType: ".txt",
    text: "Information retrieval is important.",
    characterCount: 35,
    wordCount: 5,
    processingStatus: "COMPLETED",
    metadata: {
      workerPid: 1234,
      processingTimeMs: 15,
      ocrConfidence: null
    }
  }
};

test("accepts a valid Engine 1 payload", () => {
  assert.equal(
    validateEngine1Payload(validPayload),
    validPayload.document
  );
});

test("rejects a missing payload", () => {
  assert.throws(() => validateEngine1Payload(null));
});

test("rejects an unsupported schema version", () => {
  const payload = structuredClone(validPayload);
  payload.schemaVersion = "2.0";

  assert.throws(() => validateEngine1Payload(payload));
});

test("rejects a missing required field", () => {
  const payload = structuredClone(validPayload);
  delete payload.document.fileName;

  assert.throws(() => validateEngine1Payload(payload));
});

test("rejects non-string document content", () => {
  const payload = structuredClone(validPayload);
  payload.document.text = 123;

  assert.throws(() => validateEngine1Payload(payload));
});

test("rejects incomplete processing", () => {
  const payload = structuredClone(validPayload);
  payload.document.processingStatus = "FAILED";

  assert.throws(() => validateEngine1Payload(payload));
});

test("rejects mismatched character count", () => {
  const payload = structuredClone(validPayload);
  payload.document.characterCount = 999;

  assert.throws(() => validateEngine1Payload(payload));
});

test("rejects empty document identifiers", () => {
  const payload = structuredClone(validPayload);
  payload.document.documentId = " ";

  assert.throws(() => validateEngine1Payload(payload));
});
