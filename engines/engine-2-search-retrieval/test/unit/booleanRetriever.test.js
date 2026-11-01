import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { booleanRetriever } from "../../src/retrieval/booleanRetriever.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument("D1", tokenizeText("operating system"));
  index.addDocument("D2", tokenizeText("database system"));
  index.addDocument("D3", tokenizeText("operating database"));
  index.addDocument("D4", tokenizeText("computer networks"));

  return index;
}

test("TERM retrieves matching documents", () => {
  const index = createTestIndex();

  assert.deepEqual(
    booleanRetriever({ type: "TERM", value: "operating" }, index),
    ["D1", "D3"]
  );
});

test("AND returns documents containing both terms", () => {
  const index = createTestIndex();

  assert.deepEqual(
    booleanRetriever({
      type: "AND",
      left: { type: "TERM", value: "operating" },
      right: { type: "TERM", value: "system" }
    }, index),
    ["D1"]
  );
});

test("OR returns documents containing either term", () => {
  const index = createTestIndex();

  assert.deepEqual(
    booleanRetriever({
      type: "OR",
      left: { type: "TERM", value: "operating" },
      right: { type: "TERM", value: "system" }
    }, index),
    ["D1", "D2", "D3"]
  );
});

test("NOT returns documents excluding matching terms", () => {
  const index = createTestIndex();

  assert.deepEqual(
    booleanRetriever({
      type: "NOT",
      operand: { type: "TERM", value: "operating" }
    }, index),
    ["D2", "D4"]
  );
});

test("supports nested Boolean expressions", () => {
  const index = createTestIndex();

  assert.deepEqual(
    booleanRetriever({
      type: "AND",
      left: {
        type: "OR",
        left: { type: "TERM", value: "operating" },
        right: { type: "TERM", value: "database" }
      },
      right: {
        type: "NOT",
        operand: { type: "TERM", value: "system" }
      }
    }, index),
    ["D3"]
  );
});

test("supports exact phrase expressions", () => {
  const index = createTestIndex();

  assert.deepEqual(
    booleanRetriever({
      type: "PHRASE",
      terms: ["operating", "system"]
    }, index),
    ["D1"]
  );
});

test("rejects unsupported expression types", () => {
  const index = createTestIndex();

  assert.throws(
    () => booleanRetriever({ type: "UNKNOWN" }, index),
    TypeError
  );
});