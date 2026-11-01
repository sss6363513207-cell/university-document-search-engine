import test from "node:test";
import assert from "node:assert/strict";

import { intersection } from "../../src/retrieval/intersection.js";
import { union } from "../../src/retrieval/union.js";
import { difference } from "../../src/retrieval/difference.js";

test("intersection returns common document IDs", () => {
  assert.deepEqual(
    intersection(["D1", "D2", "D3"], ["D2", "D3", "D4"]),
    ["D2", "D3"]
  );
});

test("intersection handles empty lists", () => {
  assert.deepEqual(intersection([], ["D1"]), []);
});

test("union combines lists without duplicates", () => {
  assert.deepEqual(
    union(["D1", "D2", "D3"], ["D2", "D3", "D4"]),
    ["D1", "D2", "D3", "D4"]
  );
});

test("union handles empty lists", () => {
  assert.deepEqual(union([], ["D1", "D2"]), ["D1", "D2"]);
});

test("difference returns IDs present only in first list", () => {
  assert.deepEqual(
    difference(["D1", "D2", "D3", "D4"], ["D2", "D4"]),
    ["D1", "D3"]
  );
});

test("difference handles empty second list", () => {
  assert.deepEqual(difference(["D1", "D2"], []), ["D1", "D2"]);
});

test("Boolean operations reject non-array inputs", () => {
  assert.throws(() => intersection(null, []), TypeError);
  assert.throws(() => union([], null), TypeError);
  assert.throws(() => difference("D1", []), TypeError);
});