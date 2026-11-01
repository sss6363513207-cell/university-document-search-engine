import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeQueryTerm,
  normalizeQueryTerms
} from "../../src/query/queryNormalizer.js";

test("converts query terms to lowercase", () => {
  assert.deepEqual(
    normalizeQueryTerm("Operating SYSTEM"),
    ["operating", "system"]
  );
});

test("removes punctuation as token separators", () => {
  assert.deepEqual(
    normalizeQueryTerm("database, networks!"),
    ["database", "networks"]
  );
});

test("preserves apostrophes inside words", () => {
  assert.deepEqual(
    normalizeQueryTerm("user's data"),
    ["user's", "data"]
  );
});

test("normalizes multiple query terms", () => {
  assert.deepEqual(
    normalizeQueryTerms(["Operating", "SYSTEM"]),
    ["operating", "system"]
  );
});

test("normalizes Unicode text using NFC", () => {
  assert.deepEqual(
    normalizeQueryTerm("cafe\u0301"),
    ["café"]
  );
});

test("rejects empty query terms", () => {
  assert.throws(
    () => normalizeQueryTerm(""),
    TypeError
  );
});

test("rejects non-string query terms", () => {
  assert.throws(
    () => normalizeQueryTerm(123),
    TypeError
  );
});

test("rejects non-array input for multiple terms", () => {
  assert.throws(
    () => normalizeQueryTerms("operating"),
    TypeError
  );
});
