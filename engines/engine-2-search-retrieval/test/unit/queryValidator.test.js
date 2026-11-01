import test from "node:test";
import assert from "node:assert/strict";

import { validateQueryAst } from "../../src/query/queryValidator.js";
import { ERROR_CODES } from "../../src/interfaces/errorCodes.js";

test("accepts a valid TERM node", () => {
  assert.equal(
    validateQueryAst({ type: "TERM", value: "operating" }),
    true
  );
});

test("accepts a valid PHRASE node", () => {
  assert.equal(
    validateQueryAst({
      type: "PHRASE",
      terms: ["operating", "system"]
    }),
    true
  );
});

test("accepts valid AND and OR nodes", () => {
  assert.equal(
    validateQueryAst({
      type: "AND",
      left: { type: "TERM", value: "operating" },
      right: { type: "TERM", value: "system" }
    }),
    true
  );

  assert.equal(
    validateQueryAst({
      type: "OR",
      left: { type: "TERM", value: "database" },
      right: { type: "TERM", value: "network" }
    }),
    true
  );
});

test("accepts a valid NOT node", () => {
  assert.equal(
    validateQueryAst({
      type: "NOT",
      operand: { type: "TERM", value: "database" }
    }),
    true
  );
});

test("accepts nested Boolean expressions", () => {
  assert.equal(
    validateQueryAst({
      type: "AND",
      left: {
        type: "OR",
        left: { type: "TERM", value: "operating" },
        right: { type: "TERM", value: "database" }
      },
      right: {
        type: "NOT",
        operand: { type: "TERM", value: "network" }
      }
    }),
    true
  );
});

test("rejects an empty TERM value", () => {
  assert.throws(
    () => validateQueryAst({ type: "TERM", value: "" }),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});

test("rejects an empty PHRASE", () => {
  assert.throws(
    () => validateQueryAst({ type: "PHRASE", terms: [] }),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});

test("rejects missing AND operands", () => {
  assert.throws(
    () => validateQueryAst({
      type: "AND",
      left: { type: "TERM", value: "operating" }
    }),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});

test("rejects missing NOT operand", () => {
  assert.throws(
    () => validateQueryAst({ type: "NOT" }),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});

test("rejects unsupported node types", () => {
  assert.throws(
    () => validateQueryAst({ type: "UNKNOWN" }),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});

test("rejects null and invalid AST nodes", () => {
  assert.throws(
    () => validateQueryAst(null),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );

  assert.throws(
    () => validateQueryAst("operating"),
    error => error.code === ERROR_CODES.INVALID_QUERY
  );
});