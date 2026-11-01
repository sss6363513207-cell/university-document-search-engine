import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSearchResults
} from "../../src/results/resultBuilder.js";

const rankedResults = [
  { documentId: "D101", score: 0.95 },
  { documentId: "D102", score: 0.85 },
  { documentId: "D103", score: 0.75 }
];

const documents = [
  {
    documentId: "D101",
    title: "Database Management",
    content: "Database management uses relational tables and SQL.",
    fileName: "database.pdf",
    fileType: "pdf"
  },
  {
    documentId: "D102",
    title: "Operating Systems",
    content: "Operating systems manage processes and memory.",
    fileName: "os.pdf",
    fileType: "pdf"
  },
  {
    documentId: "D103",
    title: "Computer Networks",
    content: "Computer networks support communication protocols.",
    fileName: "network.pdf",
    fileType: "pdf"
  }
];

test("builds structured search results", () => {
  const response = buildSearchResults({
    query: "database",
    algorithm: "bm25",
    rankedResults,
    documents
  });

  assert.equal(response.success, true);
  assert.equal(response.results.length, 3);
  assert.equal(response.results[0].documentId, "D101");
});

test("generates matching snippets", () => {
  const response = buildSearchResults({
    query: "database",
    algorithm: "bm25",
    rankedResults,
    documents
  });

  assert.match(response.results[0].snippet, /Database/);
});

test("supports pagination", () => {
  const response = buildSearchResults({
    query: "database",
    algorithm: "tfidf",
    rankedResults,
    documents,
    page: 2,
    pageSize: 2
  });

  assert.equal(response.results.length, 1);
  assert.equal(response.results[0].documentId, "D103");
  assert.equal(response.results[0].rank, 3);
  assert.equal(response.pagination.totalPages, 2);
});

test("rejects invalid page numbers", () => {
  assert.throws(
    () => buildSearchResults({
      query: "database",
      algorithm: "bm25",
      rankedResults,
      documents,
      page: 0
    }),
    /positive integer/
  );
});

test("rejects unsupported algorithms", () => {
  assert.throws(
    () => buildSearchResults({
      query: "database",
      algorithm: "unknown",
      rankedResults,
      documents
    }),
    /Unsupported ranking algorithm/
  );
});

test("rejects missing document metadata", () => {
  assert.throws(
    () => buildSearchResults({
      query: "database",
      algorithm: "bm25",
      rankedResults: [
        { documentId: "UNKNOWN", score: 0.5 }
      ],
      documents
    }),
    /Document metadata not found/
  );
});

test("handles documents without content", () => {
  const response = buildSearchResults({
    query: "database",
    algorithm: "bm25",
    rankedResults: [
      { documentId: "D104", score: 0.5 }
    ],
    documents: [
      { documentId: "D104", title: "Research Paper" }
    ]
  });

  assert.equal(response.results[0].snippet, "");
});