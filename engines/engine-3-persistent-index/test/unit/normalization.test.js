import test from "node:test";
import assert from "node:assert/strict";

import {
  NORMALIZATION_VERSION,
  normalizeText,
  tokenizeText
} from "../../src/tokenizer/normalization.js";

test("uses normalization version 1.1", () => {
  assert.equal(NORMALIZATION_VERSION, "1.1");
});

test("normalizes Unicode using NFC", () => {
  assert.equal(normalizeText("cafe\u0301"), "café");
});

test("converts text to lowercase", () => {
  assert.equal(normalizeText("SEARCH ENGINE"), "search engine");
});

test("tokenizes words with sequential positions", () => {
  assert.deepEqual(
    tokenizeText("Search engines are useful"),
    [
      { term: "search", position: 0 },
      { term: "engines", position: 1 },
      { term: "are", position: 2 },
      { term: "useful", position: 3 }
    ]
  );
});

test("preserves apostrophes inside tokens", () => {
  assert.deepEqual(
    tokenizeText("student's research"),
    [
      { term: "student's", position: 0 },
      { term: "research", position: 1 }
    ]
  );
});

test("returns an empty array for punctuation-only text", () => {
  assert.deepEqual(tokenizeText("!@#$%^&*"), []);
});

test("rejects non-string input", () => {
  assert.throws(() => tokenizeText(123), TypeError);
});

test("preserves Kannada combining marks in tokens", () => {
  assert.deepEqual(
    tokenizeText("ಕಂಪ್ಯೂಟರ್ ವಿಜ್ಞಾನ"),
    [
      { term: "ಕಂಪ್ಯೂಟರ್", position: 0 },
      { term: "ವಿಜ್ಞಾನ", position: 1 }
    ]
  );
});
