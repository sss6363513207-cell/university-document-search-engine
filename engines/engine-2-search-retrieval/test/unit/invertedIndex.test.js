
import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument(
    "D1",
    tokenizeText("operating system manages memory")
  );

  index.addDocument(
    "D2",
    tokenizeText("operating system manages processes")
  );

  return index;
}

test("should index documents", () => {
  const index = createTestIndex();

  assert.equal(index.getDocumentCount(), 2);
});

test("should maintain unique terms", () => {
  const index = createTestIndex();

  assert.equal(index.getAllTerms().length, 5);
});

test("should calculate document frequency", () => {
  const index = createTestIndex();

  assert.equal(index.getDocumentFrequency("operating"), 2);
  assert.equal(index.getDocumentFrequency("memory"), 1);
});

test("should preserve term positions", () => {
  const index = createTestIndex();

  assert.deepEqual(index.getPostings("memory"), [
    {
      documentId: "D1",
      termFrequency: 1,
      positions: [3]
    }
  ]);
});

test("should calculate average document length", () => {
  const index = createTestIndex();

  assert.equal(index.getAverageDocumentLength(), 4);
});

test("should reject duplicate document IDs", () => {
  const index = createTestIndex();

  assert.throws(
    () => index.addDocument("D1", tokenizeText("new document")),
    /already indexed/
  );
});

test("should reject invalid tokens", () => {
  const index = new InvertedIndex();

  assert.throws(
    () => index.addDocument("D1", [
      { term: "memory", position: 2 },
      { term: "process", position: 1 }
    ]),
    /Invalid or unordered/
  );
});

test("should return empty postings for unknown terms", () => {
  const index = createTestIndex();

  assert.deepEqual(index.getPostings("unknown"), []);
});

test("should clear the index", () => {
  const index = createTestIndex();

  index.clear();

  assert.equal(index.getDocumentCount(), 0);
  assert.equal(index.getAllTerms().length, 0);
  assert.equal(index.getAverageDocumentLength(), 0);
});
