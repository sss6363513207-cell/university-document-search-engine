import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { scoreBm25 } from "../../src/ranking/bm25.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument("D101", tokenizeText("database database system"));
  index.addDocument("D102", tokenizeText("database network system"));
  index.addDocument("D103", tokenizeText("network security"));

  return index;
}

test("calculates BM25 scores correctly", () => {
  const index = createTestIndex();

  const results = scoreBm25(
    ["database"],
    ["D101", "D102", "D103"],
    index
  );

  const idf = Math.log(1 + (3 - 2 + 0.5) / (2 + 0.5));
  const avgdl = 8 / 3;
  const k1 = 1.2;
  const b = 0.75;

  function expectedScore(tf, length) {
    return idf * (
      (tf * (k1 + 1)) /
      (tf + k1 * (1 - b + b * length / avgdl))
    );
  }

  assert.equal(results.length, 3);
  assert.ok(Math.abs(results[0].score - expectedScore(2, 3)) < 1e-10);
  assert.ok(Math.abs(results[1].score - expectedScore(1, 3)) < 1e-10);
  assert.equal(results[2].score, 0);
});

test("does not count duplicate query terms twice", () => {
  const index = createTestIndex();

  assert.deepEqual(
    scoreBm25(["database", "database"], ["D101", "D102"], index),
    scoreBm25(["database"], ["D101", "D102"], index)
  );
});

test("supports custom BM25 parameters", () => {
  const index = createTestIndex();

  const defaultResults = scoreBm25(["database"], ["D101", "D102"], index);
  const customResults = scoreBm25(
    ["database"],
    ["D101", "D102"],
    index,
    { k1: 2, b: 0.5 }
  );

  assert.notDeepEqual(customResults, defaultResults);
});

test("ranks documents by descending BM25 score", () => {
  const index = createTestIndex();

  const results = scoreBm25(
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

  const results = scoreBm25(
    ["unknownterm"],
    ["D103", "D102", "D101"],
    index
  );

  assert.deepEqual(
    results.map(result => result.documentId),
    ["D101", "D102", "D103"]
  );
});

test("returns an empty array for no candidates", () => {
  const index = createTestIndex();

  assert.deepEqual(scoreBm25(["database"], [], index), []);
});

test("rejects invalid BM25 parameters", () => {
  const index = createTestIndex();

  assert.throws(
    () => scoreBm25(["database"], ["D101"], index, { k1: -1 }),
    /Invalid BM25 parameters/
  );

  assert.throws(
    () => scoreBm25(["database"], ["D101"], index, { b: 1.5 }),
    /Invalid BM25 parameters/
  );
});

test("rejects invalid query terms", () => {
  const index = createTestIndex();

  assert.throws(
    () => scoreBm25([""], ["D101"], index),
    /Invalid query terms/
  );
});