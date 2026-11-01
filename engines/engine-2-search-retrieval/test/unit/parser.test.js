import test from "node:test";
import assert from "node:assert/strict";

import { parseQuery } from "../../src/query/parser.js";
import { ERROR_CODES } from "../../src/interfaces/errorCodes.js";

test("parses a simple term", () => {
  assert.deepEqual(
    parseQuery("operating"),
    { type: "TERM", value: "operating" }
  );
});

test("AND has higher precedence than OR", () => {
  assert.deepEqual(
    parseQuery("operating AND system OR database"),
    {
      type: "OR",
      left: {
        type: "AND",
        left: { type: "TERM", value: "operating" },
        right: { type: "TERM", value: "system" }
      },
      right: { type: "TERM", value: "database" }
    }
  );
});

test("NOT has higher precedence than AND", () => {
  assert.deepEqual(
    parseQuery("operating AND NOT database"),
    {
      type: "AND",
      left: { type: "TERM", value: "operating" },
      right: {
        type: "NOT",
        operand: { type: "TERM", value: "database" }
      }
    }
  );
});

test("parentheses override operator precedence", () => {
  assert.deepEqual(
    parseQuery("(operating OR database) AND system"),
    {
      type: "AND",
      left: {
        type: "OR",
        left: { type: "TERM", value: "operating" },
        right: { type: "TERM", value: "database" }
      },
      right: { type: "TERM", value: "system" }
    }
  );
});

test("supports nested NOT", () => {
  assert.deepEqual(
    parseQuery("NOT NOT operating"),
    {
      type: "NOT",
      operand: {
        type: "NOT",
        operand: { type: "TERM", value: "operating" }
      }
    }
  );
});

test("preserves Boolean keywords inside phrases", () => {
  assert.deepEqual(
    parseQuery('"research and development"'),
    {
      type: "PHRASE",
      terms: ["research", "and", "development"]
    }
  );
});

test("rejects missing operands", () => {
  for (const query of [
    "operating AND",
    "AND operating",
    "operating OR",
    "NOT",
    "operating AND OR database"
  ]) {
    assert.throws(
      () => parseQuery(query),
      error => error.code === ERROR_CODES.QUERY_SYNTAX_ERROR
    );
  }
});

test("rejects unclosed parentheses", () => {
  assert.throws(
    () => parseQuery("(operating AND system"),
    error => error.code === ERROR_CODES.QUERY_SYNTAX_ERROR
  );
});

test("rejects unexpected closing parentheses", () => {
  assert.throws(
    () => parseQuery("operating AND system)"),
    error => error.code === ERROR_CODES.QUERY_SYNTAX_ERROR
  );
});

test("rejects empty parentheses", () => {
  assert.throws(
    () => parseQuery("()"),
    error => error.code === ERROR_CODES.QUERY_SYNTAX_ERROR
  );
});