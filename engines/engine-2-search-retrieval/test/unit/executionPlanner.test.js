import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { parseQuery } from "../../src/query/parser.js";
import { buildExecutionPlan } from "../../src/planning/executionPlanner.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument("D1", tokenizeText("operating system"));
  index.addDocument("D2", tokenizeText("operating database"));
  index.addDocument("D3", tokenizeText("operating networks"));
  index.addDocument("D4", tokenizeText("database system"));

  return index;
}

test("creates a TERM execution plan", () => {
  const index = createTestIndex();
  const ast = parseQuery("operating");

  assert.deepEqual(buildExecutionPlan(ast, index), {
    type: "TERM",
    term: "operating",
    estimatedCardinality: 3
  });
});

test("optimizes AND using rare-term-first ordering", () => {
  const index = createTestIndex();
  const ast = parseQuery("operating AND database");

  const plan = buildExecutionPlan(ast, index);

  assert.equal(plan.type, "AND");
  assert.equal(plan.left.term, "database");
  assert.equal(plan.right.term, "operating");
  assert.equal(plan.estimatedCardinality, 2);
});

test("preserves OR operand order", () => {
  const index = createTestIndex();
  const ast = parseQuery("operating OR database");

  const plan = buildExecutionPlan(ast, index);

  assert.equal(plan.type, "OR");
  assert.equal(plan.left.term, "operating");
  assert.equal(plan.right.term, "database");
  assert.equal(plan.estimatedCardinality, 4);
});

test("creates a NOT execution plan", () => {
  const index = createTestIndex();
  const ast = parseQuery("NOT operating");

  const plan = buildExecutionPlan(ast, index);

  assert.equal(plan.type, "NOT");
  assert.equal(plan.operand.term, "operating");
  assert.equal(plan.estimatedCardinality, 1);
});

test("creates a PHRASE execution plan", () => {
  const index = createTestIndex();
  const ast = parseQuery('"operating system"');

  const plan = buildExecutionPlan(ast, index);

  assert.equal(plan.type, "PHRASE");
  assert.deepEqual(plan.terms, ["operating", "system"]);
  assert.equal(plan.estimatedCardinality, 2);
});

test("creates a plan for nested expressions", () => {
  const index = createTestIndex();
  const ast = parseQuery("(operating OR database) AND system");

  const plan = buildExecutionPlan(ast, index);

  assert.equal(plan.type, "AND");
  assert.equal(plan.left.type, "TERM");
  assert.equal(plan.right.type, "OR");
});

test("rejects invalid AST input", () => {
  const index = createTestIndex();

  assert.throws(
    () => buildExecutionPlan({ type: "UNKNOWN" }, index),
    /Unsupported AST node type/
  );
});

test("rejects an invalid index", () => {
  assert.throws(
    () => buildExecutionPlan(
      { type: "TERM", value: "operating" },
      {}
    ),
    TypeError
  );
});