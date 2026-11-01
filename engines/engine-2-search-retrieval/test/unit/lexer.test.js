import test from "node:test";
import assert from "node:assert/strict";

import { tokenizeQuery } from "../../src/query/lexer.js";
import { ERROR_CODES } from "../../src/interfaces/errorCodes.js";

test("recognizes search terms", () => {
  assert.deepEqual(
    tokenizeQuery("operating system").map(t => t.type),
    ["TERM", "TERM"]
  );
});

test("recognizes Boolean operators", () => {
  assert.deepEqual(
    tokenizeQuery("operating AND system OR database NOT networks")
      .map(t => t.type),
    ["TERM", "AND", "TERM", "OR", "TERM", "NOT", "TERM"]
  );
});

test("recognizes operators case-insensitively", () => {
  assert.deepEqual(
    tokenizeQuery("operating and SYSTEM").map(t => t.type),
    ["TERM", "AND", "TERM"]
  );
});

test("recognizes quoted phrases", () => {
  assert.deepEqual(
    tokenizeQuery('"operating system"').map(t => t.type),
    ["PHRASE"]
  );

  assert.equal(
    tokenizeQuery('"operating system"')[0].value,
    "operating system"
  );
});

test("recognizes parentheses", () => {
  assert.deepEqual(
    tokenizeQuery("(operating OR database)").map(t => t.type),
    ["LPAREN", "TERM", "OR", "TERM", "RPAREN"]
  );
});

test("records original character positions", () => {
  assert.deepEqual(
    tokenizeQuery("operating AND system").map(t => t.position),
    [0, 10, 14]
  );
});

test("rejects empty queries", () => {
  assert.throws(
    () => tokenizeQuery(""),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});

test("rejects unclosed quoted phrases", () => {
  assert.throws(
    () => tokenizeQuery('"operating system'),
    error => error.code === ERROR_CODES.QUERY_SYNTAX_ERROR
  );
});

test("rejects empty quoted phrases", () => {
  assert.throws(
    () => tokenizeQuery('""'),
    error => error.code === ERROR_CODES.QUERY_SYNTAX_ERROR
  );
});