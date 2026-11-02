
import test from "node:test";
import assert from "node:assert/strict";

import { search } from "../../src/searchService.js";

class MockProvider {
  constructor() {
    this.closedSnapshots = [];

    this.documents = {
      D101: {
        title: "Database Systems",
        fileName: "database.pdf",
        fileType: "pdf",
        content: "Database systems use indexing for efficient retrieval."
      },
      D102: {
        title: "Operating Systems",
        fileName: "os.pdf",
        fileType: "pdf",
        content: "Operating systems manage processes and memory."
      }
    };
  }

  async openSnapshot() {
    return {
      snapshotId: "S001",
      indexVersion: "V1",
      documentCount: 2,
      averageDocumentLength: 6,
      normalizationVersion: "1.0"
    };
  }

  async getPostings(terms, snapshotId) {
    const allPostings = {
      database: [
        {
          documentId: "D101",
          termFrequency: 1,
          positions: [0]
        }
      ],
      systems: [
        {
          documentId: "D101",
          termFrequency: 1,
          positions: [1]
        },
        {
          documentId: "D102",
          termFrequency: 1,
          positions: [1]
        }
      ],
      indexing: [
        {
          documentId: "D101",
          termFrequency: 1,
          positions: [3]
        }
      ]
    };

    return {
      snapshotId,
      indexVersion: "V1",
      data: Object.fromEntries(
        terms.map(term => [
          term,
          {
            documentFrequency: (allPostings[term] ?? []).length,
            postings: allPostings[term] ?? []
          }
        ])
      )
    };
  }

  async getAllDocumentIds(snapshotId) {
    return {
      snapshotId,
      indexVersion: "V1",
      data: ["D101", "D102"]
    };
  }

  async getDocumentStats(ids, snapshotId) {
    return {
      snapshotId,
      indexVersion: "V1",
      data: Object.fromEntries(
        ids.map(id => [id, 6])
      )
    };
  }

  async getDocumentContent(ids, snapshotId) {
    return {
      snapshotId,
      indexVersion: "V1",
      data: Object.fromEntries(
        ids.map(id => [id, this.documents[id]])
      )
    };
  }

  async closeSnapshot(id) {
    this.closedSnapshots.push(id);
  }
}

test("searches documents using a term query", async () => {
  const provider = new MockProvider();

  const response = await search(
    { query: "database" },
    provider
  );

  assert.equal(response.success, true);
  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D101");
  assert.deepEqual(provider.closedSnapshots, ["S001"]);
});

test("executes Boolean AND queries", async () => {
  const provider = new MockProvider();

  const response = await search(
    { query: "database AND systems" },
    provider
  );

  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D101");
});

test("executes Boolean OR queries", async () => {
  const provider = new MockProvider();

  const response = await search(
    { query: "database OR systems" },
    provider
  );

  assert.equal(response.pagination.totalResults, 2);
});

test("executes NOT queries", async () => {
  const provider = new MockProvider();

  const response = await search(
    { query: "NOT database" },
    provider
  );

  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D102");
});

test("closes snapshot when query processing fails", async () => {
  const provider = new MockProvider();

  await assert.rejects(
    search({ query: "database AND" }, provider)
  );

  assert.deepEqual(provider.closedSnapshots, []);
});

test("closes snapshot when document retrieval fails", async () => {
  const provider = new MockProvider();

  provider.getDocumentContent = async () => {
    throw new Error("Content retrieval failed");
  };

  await assert.rejects(
    search({ query: "database" }, provider),
    /Content retrieval failed/
  );

  assert.deepEqual(provider.closedSnapshots, ["S001"]);
});

test("executes exact phrase searches", async () => {
  const provider = new MockProvider();

  const response = await search(
    { query: '"database systems"' },
    provider
  );

  assert.equal(response.success, true);
  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D101");
});

test("supports TF-IDF ranking through the search service", async () => {
  const provider = new MockProvider();

  const response = await search(
    {
      query: "database",
      algorithm: "tfidf"
    },
    provider
  );

  assert.equal(response.success, true);
  assert.equal(response.algorithm, "tfidf");
  assert.equal(response.results[0].documentId, "D101");
});

test("supports BM25 ranking through the search service", async () => {
  const provider = new MockProvider();

  const response = await search(
    {
      query: "database",
      algorithm: "bm25"
    },
    provider
  );

  assert.equal(response.success, true);
  assert.equal(response.algorithm, "bm25");
  assert.equal(response.results[0].documentId, "D101");
});

test("supports pagination across search results", async () => {
  const provider = new MockProvider();

  const firstPage = await search(
    {
      query: "systems",
      page: 1,
      pageSize: 1
    },
    provider
  );

  const secondPage = await search(
    {
      query: "systems",
      page: 2,
      pageSize: 1
    },
    provider
  );

  assert.equal(firstPage.pagination.totalResults, 2);
  assert.equal(firstPage.pagination.totalPages, 2);
  assert.equal(firstPage.results.length, 1);

  assert.equal(secondPage.pagination.totalResults, 2);
  assert.equal(secondPage.pagination.totalPages, 2);
  assert.equal(secondPage.results.length, 1);

  assert.notEqual(
    firstPage.results[0].documentId,
    secondPage.results[0].documentId
  );
});

test("rejects invalid pagination values", async () => {
  const provider = new MockProvider();

  await assert.rejects(
    search(
      { query: "systems", page: 0 },
      provider
    ),
    /page must be a positive integer/
  );

  await assert.rejects(
    search(
      { query: "systems", pageSize: 0 },
      provider
    ),
    /pageSize must be a positive integer/
  );
});

test("reports total matches separately from Top-K results", async () => {
  const provider = new MockProvider();

  const response = await search(
    {
      query: "systems",
      topK: 1,
      page: 1,
      pageSize: 1
    },
    provider
  );

  assert.equal(response.pagination.totalMatches, 2);
  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.pagination.totalPages, 1);
  assert.equal(response.results.length, 1);
});

test("normalizes uppercase terms before provider retrieval", async () => {
  const provider = new MockProvider();
  const requestedTerms = [];

  const originalGetPostings = provider.getPostings.bind(provider);

  provider.getPostings = async (terms, snapshotId) => {
    requestedTerms.push(...terms);
    return originalGetPostings(terms, snapshotId);
  };

  const response = await search(
    { query: "DATABASE" },
    provider
  );

  assert.deepEqual(requestedTerms, ["database"]);
  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D101");
});

test("normalizes punctuation before provider retrieval", async () => {
  const provider = new MockProvider();
  const requestedTerms = [];

  const originalGetPostings = provider.getPostings.bind(provider);

  provider.getPostings = async (terms, snapshotId) => {
    requestedTerms.push(...terms);
    return originalGetPostings(terms, snapshotId);
  };

  const response = await search(
    { query: "Database," },
    provider
  );

  assert.deepEqual(requestedTerms, ["database"]);
  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D101");
});

test("normalizes uppercase phrase queries consistently", async () => {
  const provider = new MockProvider();
  const requestedTerms = [];

  const originalGetPostings = provider.getPostings.bind(provider);

  provider.getPostings = async (terms, snapshotId) => {
    requestedTerms.push(...terms);
    return originalGetPostings(terms, snapshotId);
  };

  const response = await search(
    { query: '"DATABASE SYSTEMS"' },
    provider
  );

  assert.deepEqual(requestedTerms, ["database", "systems"]);
  assert.equal(response.pagination.totalResults, 1);
  assert.equal(response.results[0].documentId, "D101");
});
