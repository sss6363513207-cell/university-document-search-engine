import test from "node:test";
import assert from "node:assert/strict";

import { collectAstTerms } from "../../src/query/astTerms.js";

test("collects a single TERM", () => {
  assert.deepEqual(
    collectAstTerms({ type: "TERM", value: "database" }),
    ["database"]
  );
});

test("collects all PHRASE terms", () => {
  assert.deepEqual(
    collectAstTerms({
      type: "PHRASE",
      terms: ["database", "systems"]
    }),
    ["database", "systems"]
  );
});

test("collects terms from AND expressions", () => {
  assert.deepEqual(
    collectAstTerms({
      type: "AND",
      left: { type: "TERM", value: "database" },
      right: { type: "TERM", value: "systems" }
    }),
    ["database", "systems"]
  );
});

test("collects terms from nested expressions", () => {
  const ast = {
    type: "OR",
    left: {
      type: "AND",
      left: { type: "TERM", value: "database" },
      right: { type: "TERM", value: "index" }
    },
    right: {
      type: "NOT",
      operand: { type: "TERM", value: "network" }
    }
  };

  assert.deepEqual(
    collectAstTerms(ast),
    ["database", "index", "network"]
  );
});

test("rejects invalid AST nodes", () => {
  assert.throws(
    () => collectAstTerms(null),
    /Invalid query AST/
  );
});

test("rejects unsupported AST node types", () => {
  assert.throws(
    () => collectAstTerms({ type: "UNKNOWN" }),
    /Unsupported AST node/
  );
});