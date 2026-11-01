import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { phraseRetriever } from "../../src/retrieval/phraseRetriever.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument(
    "D1",
    tokenizeText("operating system concepts")
  );

  index.addDocument(
    "D2",
    tokenizeText("system operating concepts")
  );

  index.addDocument(
    "D3",
    tokenizeText("operating modern system")
  );

  index.addDocument(
    "D4",
    tokenizeText("introduction to operating system")
  );

  return index;
}

test("finds exact consecutive phrases", () => {
  const index = createTestIndex();

  assert.deepEqual(
    phraseRetriever(["operating", "system"], index),
    ["D1", "D4"]
  );
});

test("does not match words in the wrong order", () => {
  const index = createTestIndex();

  assert.deepEqual(
    phraseRetriever(["operating", "system"], index),
    ["D1", "D4"]
  );
});

test("does not match phrases with gaps", () => {
  const index = createTestIndex();

  assert.deepEqual(
    phraseRetriever(["operating", "system"], index),
    ["D1", "D4"]
  );
});

test("returns empty when a phrase term is missing", () => {
  const index = createTestIndex();

  assert.deepEqual(
    phraseRetriever(["operating", "database"], index),
    []
  );
});

test("supports a single-term phrase", () => {
  const index = createTestIndex();

  assert.deepEqual(
    phraseRetriever(["operating"], index),
    ["D1", "D2", "D3", "D4"]
  );
});

test("rejects an empty phrase", () => {
  const index = createTestIndex();

  assert.throws(
    () => phraseRetriever([], index),
    TypeError
  );
});
test("does not match words in the wrong order", () => {
  const index = new InvertedIndex();

  index.addDocument(
    "D1",
    tokenizeText("system operating concepts")
  );

  assert.deepEqual(
    phraseRetriever(["operating", "system"], index),
    []
  );
});

test("does not match phrases with gaps", () => {
  const index = new InvertedIndex();

  index.addDocument(
    "D1",
    tokenizeText("operating modern system")
  );

  assert.deepEqual(
    phraseRetriever(["operating", "system"], index),
    []
  );
});