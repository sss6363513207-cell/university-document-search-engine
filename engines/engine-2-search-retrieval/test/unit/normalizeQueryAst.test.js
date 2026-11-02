import test from "node:test";
import assert from "node:assert/strict";

import { normalizeQueryAst } from "../../src/query/normalizeQueryAst.js";

test("normalizes uppercase TERM nodes", () => {
  assert.deepEqual(
    normalizeQueryAst({
      type: "TERM",
      value: "DATABASE"
    }),
    {
      type: "TERM",
      value: "database"
    }
  );
});

test("normalizes punctuation in TERM nodes", () => {
  assert.deepEqual(
    normalizeQueryAst({
      type: "TERM",
      value: "Memory,"
    }),
    {
      type: "TERM",
      value: "memory"
    }
  );
});

test("rejects a TERM that produces multiple tokens", () => {
  assert.throws(
    () => normalizeQueryAst({
      type: "TERM",
      value: "data-base"
    }),
    error => error.code === "INVALID_QUERY"
  );
});

test("normalizes PHRASE terms", () => {
  assert.deepEqual(
    normalizeQueryAst({
      type: "PHRASE",
      terms: ["DATABASE", "Systems,"]
    }),
    {
      type: "PHRASE",
      terms: ["database", "systems"]
    }
  );
});

test("preserves Boolean operators and structure", () => {
  const ast = {
    type: "AND",
    left: {
      type: "TERM",
      value: "DATABASE"
    },
    right: {
      type: "NOT",
      operand: {
        type: "TERM",
        value: "MEMORY"
      }
    }
  };

  assert.deepEqual(normalizeQueryAst(ast), {
    type: "AND",
    left: {
      type: "TERM",
      value: "database"
    },
    right: {
      type: "NOT",
      operand: {
        type: "TERM",
        value: "memory"
      }
    }
  });
});

test("rejects unsupported AST nodes", () => {
  assert.throws(
    () => normalizeQueryAst({ type: "UNKNOWN" }),
    /Unsupported AST node/
  );
});