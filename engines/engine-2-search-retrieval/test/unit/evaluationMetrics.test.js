import test from "node:test";
import assert from "node:assert/strict";

import {
  precisionAtK,
  recallAtK
} from "../../src/evaluation/precisionRecall.js";

import {
  averagePrecision,
  meanAveragePrecision
} from "../../src/evaluation/averagePrecision.js";

import {
  reciprocalRank,
  meanReciprocalRank
} from "../../src/evaluation/reciprocalRank.js";

import { ndcgAtK } from "../../src/evaluation/ndcg.js";

const ranked = ["D1", "D2", "D3", "D4"];
const relevant = ["D2", "D4"];

test("calculates Precision@K", () => {
  assert.equal(precisionAtK(ranked, relevant, 4), 0.5);
});

test("calculates Recall@K", () => {
  assert.equal(recallAtK(ranked, relevant, 3), 0.5);
});

test("calculates Average Precision", () => {
  assert.equal(averagePrecision(ranked, relevant), 0.5);
});

test("calculates MAP", () => {
  const queries = [
    { rankedDocumentIds: ranked, relevantDocumentIds: relevant },
    { rankedDocumentIds: ["D2", "D1"], relevantDocumentIds: ["D2"] }
  ];

  assert.equal(meanAveragePrecision(queries), 0.75);
});

test("calculates Reciprocal Rank", () => {
  assert.equal(reciprocalRank(ranked, relevant), 0.5);
});

test("calculates MRR", () => {
  const queries = [
    { rankedDocumentIds: ranked, relevantDocumentIds: relevant },
    { rankedDocumentIds: ["D2", "D1"], relevantDocumentIds: ["D2"] }
  ];

  assert.equal(meanReciprocalRank(queries), 0.75);
});

test("calculates NDCG@K", () => {
  const judgements = [
    { documentId: "D1", relevance: 0 },
    { documentId: "D2", relevance: 2 },
    { documentId: "D3", relevance: 1 },
    { documentId: "D4", relevance: 0 }
  ];

  const score = ndcgAtK(ranked, judgements, 4);

  assert.ok(score > 0 && score < 1);
});

test("returns zero for empty relevance sets", () => {
  assert.equal(recallAtK(ranked, [], 4), 0);
  assert.equal(averagePrecision(ranked, []), 0);
  assert.equal(reciprocalRank(ranked, []), 0);
});

test("rejects invalid K values", () => {
  assert.throws(() => precisionAtK(ranked, relevant, -1));
  assert.throws(() => ndcgAtK(ranked, [], -1));
});

test("returns zero NDCG when all relevance scores are zero", () => {
  assert.equal(
    ndcgAtK(
      ["D1"],
      [{ documentId: "D1", relevance: 0 }],
      1
    ),
    0
  );
});