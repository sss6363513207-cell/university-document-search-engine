import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { scoreTfIdf } from "../../src/ranking/tfidf.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument(
    "D101",
    tokenizeText("database database system")
  );

  index.addDocument(
    "D102",
    tokenizeText("database network system")
  );

  index.addDocument(
    "D103",
    tokenizeText("network security")
  );

  return index;
}

test("calculates TF-IDF scores correctly", () => {
  const index = createTestIndex();

  const results = scoreTfIdf(
    ["database"],
    ["D101", "D102", "D103"],
    index
  );

  const idf = Math.log((3 + 1) / (2 + 1)) + 1;

  const expectedD101 = (2 / 3) * idf;
  const expectedD102 = (1 / 3) * idf;

  assert.equal(results.length, 3);

  assert.ok(
    Math.abs(results[0].score - expectedD101) < 1e-10
  );

  assert.ok(
    Math.abs(results[1].score - expectedD102) < 1e-10
  );

  assert.equal(results[2].documentId, "D103");
  assert.equal(results[2].score, 0);
});

test("does not count duplicate query terms twice", () => {
  const index = createTestIndex();

  const single = scoreTfIdf(
    ["database"],
    ["D101", "D102"],
    index
  );

  const duplicate = scoreTfIdf(
    ["database", "database"],
    ["D101", "D102"],
    index
  );

  assert.deepEqual(duplicate, single);
});

test("ranks documents by descending score", () => {
  const index = createTestIndex();

  const results = scoreTfIdf(
    ["database"],
    ["D103", "D102", "D101"],
    index
  );

  assert.deepEqual(
    results.map(result => result.documentId),
    ["D101", "D102", "D103"]
  );
});

test("uses document ID to break equal-score ties", () => {
  const index = createTestIndex();

  const results = scoreTfIdf(
    ["unknownterm"],
    ["D103", "D102", "D101"],
    index
  );

  assert.deepEqual(
    results.map(result => result.documentId),
    ["D101", "D102", "D103"]
  );

  assert.ok(results.every(result => result.score === 0));
});

test("returns an empty array for no candidates", () => {
  const index = createTestIndex();

  const results = scoreTfIdf(
    ["database"],
    [],
    index
  );

  assert.deepEqual(results, []);
});

test("rejects invalid query terms", () => {
  const index = createTestIndex();

  assert.throws(
    () => scoreTfIdf([""], ["D101"], index),
    /Invalid query terms/
  );
});