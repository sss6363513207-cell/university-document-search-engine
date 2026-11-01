import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { parseQuery } from "../../src/query/parser.js";
import { buildExecutionPlan } from "../../src/planning/executionPlanner.js";
import { executePlan } from "../../src/planning/planExecutor.js";

function createTestIndex() {
  const index = new InvertedIndex();

  index.addDocument("D1", tokenizeText("operating system"));
  index.addDocument("D2", tokenizeText("operating database"));
  index.addDocument("D3", tokenizeText("database system"));
  index.addDocument("D4", tokenizeText("computer networks"));

  return index;
}

function search(query, index) {
  const ast = parseQuery(query);
  const plan = buildExecutionPlan(ast, index);

  return executePlan(plan, index);
}

test("executes a simple term query", () => {
  const index = createTestIndex();

  assert.deepEqual(search("operating", index), ["D1", "D2"]);
});

test("executes AND queries", () => {
  const index = createTestIndex();

  assert.deepEqual(
    search("operating AND system", index),
    ["D1"]
  );
});

test("executes OR queries", () => {
  const index = createTestIndex();

  assert.deepEqual(
    search("operating OR database", index),
    ["D1", "D2", "D3"]
  );
});

test("executes NOT queries", () => {
  const index = createTestIndex();

  assert.deepEqual(
    search("NOT operating", index),
    ["D3", "D4"]
  );
});

test("executes exact phrase queries", () => {
  const index = createTestIndex();

  assert.deepEqual(
    search('"operating system"', index),
    ["D1"]
  );
});

test("executes nested Boolean expressions", () => {
  const index = createTestIndex();

  assert.deepEqual(
    search("(operating OR database) AND system", index),
    ["D1", "D3"]
  );
});

test("executes combined NOT and OR expressions", () => {
  const index = createTestIndex();

  assert.deepEqual(
    search("operating OR NOT database", index),
    ["D1", "D2", "D4"]
  );
});

test("rejects unsupported execution plans", () => {
  const index = createTestIndex();

  assert.throws(
    () => executePlan({ type: "UNKNOWN" }, index)
  );
});