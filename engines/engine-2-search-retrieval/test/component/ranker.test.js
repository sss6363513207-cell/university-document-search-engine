import test from "node:test";
import assert from "node:assert/strict";

import { InvertedIndex } from "../../src/indexing/invertedIndex.js";
import { tokenizeText } from "../../src/tokenizer/normalization.js";
import { rankDocuments } from "../../src/ranking/ranker.js";

function createIndex() {
  const index = new InvertedIndex();

  index.addDocument("D101", tokenizeText("database database system"));
  index.addDocument("D102", tokenizeText("database network system"));
  index.addDocument("D103", tokenizeText("network security"));

  return index;
}

test("integrates BM25 with Top-K", () => {
  const results = rankDocuments({
    algorithm: "bm25",
    queryTerms: ["database"],
    candidateDocumentIds: ["D101", "D102", "D103"],
    index: createIndex(),
    topK: 2
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].documentId, "D101");
});

test("integrates TF-IDF with Top-K", () => {
  const results = rankDocuments({
    algorithm: "tfidf",
    queryTerms: ["database"],
    candidateDocumentIds: ["D101", "D102", "D103"],
    index: createIndex(),
    topK: 2
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].documentId, "D101");
});

test("rejects unsupported ranking algorithms", () => {
  assert.throws(
    () => rankDocuments({
      algorithm: "unknown",
      queryTerms: ["database"],
      candidateDocumentIds: ["D101"],
      index: createIndex()
    }),
    /Unsupported ranking algorithm/
  );
});

test("uses BM25 by default", () => {
  const index = createIndex();

  const defaultResults = rankDocuments({
    queryTerms: ["database"],
    candidateDocumentIds: ["D101", "D102"],
    index
  });

  const explicitResults = rankDocuments({
    algorithm: "bm25",
    queryTerms: ["database"],
    candidateDocumentIds: ["D101", "D102"],
    index
  });

  assert.deepEqual(defaultResults, explicitResults);
});