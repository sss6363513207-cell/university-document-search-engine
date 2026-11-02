import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeText,
  tokenizeText,
  NORMALIZATION_VERSION
} from "../../src/tokenizer/normalization.js";

test("should expose normalization version", () => {
  assert.equal(NORMALIZATION_VERSION, "1.1");
});

test("should convert text to lowercase", () => {
  assert.equal(normalizeText("OPERATING SYSTEM"), "operating system");
});

test("should tokenize English text", () => {
  assert.deepEqual(
    tokenizeText("Operating Systems manage memory."),
    [
      { term: "operating", position: 0 },
      { term: "systems", position: 1 },
      { term: "manage", position: 2 },
      { term: "memory", position: 3 }
    ]
  );
});

test("should remove punctuation as token separators", () => {
  assert.deepEqual(
    tokenizeText("Memory, Process! System."),
    [
      { term: "memory", position: 0 },
      { term: "process", position: 1 },
      { term: "system", position: 2 }
    ]
  );
});

test("should preserve apostrophes inside words", () => {
  assert.deepEqual(
    tokenizeText("computer's system"),
    [
      { term: "computer's", position: 0 },
      { term: "system", position: 1 }
    ]
  );
});

test("should normalize Unicode using NFC", () => {
  assert.equal(normalizeText("cafe\u0301"), "café");
});



test("should reject non-string input", () => {
  assert.throws(() => tokenizeText(123), TypeError);
});
