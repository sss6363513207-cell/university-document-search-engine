import test from "node:test";
import assert from "node:assert/strict";
import { selectTopK } from "../../src/ranking/topK.js";

const results = [
  { documentId: "D103", score: 0.4 },
  { documentId: "D101", score: 0.9 },
  { documentId: "D102", score: 0.7 },
  { documentId: "D104", score: 0.2 }
];

test("returns only the highest K documents", () => {
  assert.deepEqual(
    selectTopK(results, 2).map(item => item.documentId),
    ["D101", "D102"]
  );
});

test("returns all documents when K exceeds result count", () => {
  assert.equal(selectTopK(results, 10).length, 4);
});

test("uses document ID for equal-score tie-breaking", () => {
  const tied = [
    { documentId: "D103", score: 0.5 },
    { documentId: "D101", score: 0.5 },
    { documentId: "D102", score: 0.5 }
  ];

  assert.deepEqual(
    selectTopK(tied, 2).map(item => item.documentId),
    ["D101", "D102"]
  );
});

test("does not mutate the original results", () => {
  const original = [...results];

  selectTopK(results, 2);

  assert.deepEqual(results, original);
});

test("rejects invalid K", () => {
  assert.throws(() => selectTopK(results, 0), /positive integer/);
  assert.throws(() => selectTopK(results, -1), /positive integer/);
});

test("rejects duplicate document IDs", () => {
  assert.throws(
    () => selectTopK([
      { documentId: "D101", score: 0.8 },
      { documentId: "D101", score: 0.5 }
    ], 2),
    /Duplicate document ID/
  );
});