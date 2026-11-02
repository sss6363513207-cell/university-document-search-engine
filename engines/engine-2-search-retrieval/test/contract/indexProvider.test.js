import test from "node:test";
import assert from "node:assert/strict";

import { IndexProvider } from "../../src/interfaces/indexProvider.js";

import {
  validateSnapshot,
  validateSnapshotResponse,
  validatePostingsResponse,
  validateDocumentStats,
  validateDocumentIds
} from "../../src/interfaces/providerValidator.js";

class MockIndexProvider extends IndexProvider {
  async openSnapshot() {
    return {
      snapshotId: "S001",
      indexVersion: "V1",
      documentCount: 2,
      averageDocumentLength: 5,
      normalizationVersion: "1.1"
    };
  }

  async getPostings(terms) {
    return {
        snapshotId: "S001",
        indexVersion: "V1",
        data: {
            database: {
            documentFrequency: 1,
            postings: [{
                documentId: "D101",
                termFrequency: 2,
                positions: [1, 3]
            }]
           }
          }
        };
     }

  async getDocumentStats() {
    return {
        snapshotId: "S001",
        indexVersion: "V1",
        data: { D101: 5 }
        };
  }

  async getDocumentMetadata() {
    return { D101: { title: "Database Systems" } };
  }

  async getAllDocumentIds() {
    return {
        snapshotId: "S001",
        indexVersion: "V1",
        data: ["D101", "D102"]
        };
  }

  async getDocumentContent() {
    throw new Error("getDocumentContent() must be implemented");
  }

  async closeSnapshot() {
    return true;
  }
}

test("requires provider methods to be implemented", async () => {
  const provider = new IndexProvider();

  await assert.rejects(
    provider.openSnapshot(),
    /must be implemented/
  );
});

test("opens a valid snapshot", async () => {
  const provider = new MockIndexProvider();
  const snapshot = await provider.openSnapshot();

  assert.equal(validateSnapshot(snapshot), true);
});

test("rejects an invalid snapshot", () => {
  assert.throws(
    () => validateSnapshot({ snapshotId: "S001" }),
    /Invalid snapshot response/
  );
});

test("validates posting responses", async () => {
  const provider = new MockIndexProvider();

  const response = await provider.getPostings(
    ["database"],
    "S001"
  );

  const data = validateSnapshotResponse(
    response,
    await provider.openSnapshot()
  );

  assert.equal(
    validatePostingsResponse(data, ["database"]),
    true
  );
});

test("rejects invalid posting frequency", () => {
  assert.throws(
    () => validatePostingsResponse({
      database: {
        documentFrequency: 2,
        postings: []
      }
    }, ["database"])
  );
});

test("validates document statistics", async () => {
  const provider = new MockIndexProvider();

  const stats = await provider.getDocumentStats(["D101"], "S001");

  assert.equal(
    validateDocumentStats(stats, ["D101"]),
    true
  );
});

test("validates sorted document IDs", async () => {
  const provider = new MockIndexProvider();

  const response = await provider.getAllDocumentIds("S001");

  const data = validateSnapshotResponse(
    response,
    await provider.openSnapshot()
  );

  assert.equal(validateDocumentIds(data), true);
});

test("rejects unsorted document IDs", () => {
  assert.throws(
    () => validateDocumentIds(["D102", "D101"])
  );
});

test("closes a snapshot", async () => {
  const provider = new MockIndexProvider();

  assert.equal(await provider.closeSnapshot("S001"), true);
});

import { createSearchIndexView } from "../../src/interfaces/providerAdapter.js";

test("creates a query-scoped index view from provider data", async () => {
  const provider = new MockIndexProvider();

  const { snapshot, view } = await createSearchIndexView(
    provider,
    { type: "TERM", value: "database" }
  );

  assert.equal(snapshot.snapshotId, "S001");
  assert.equal(view.getDocumentCount(), 2);
  assert.equal(view.getDocumentFrequency("database"), 1);
  assert.equal(view.getPostings("database")[0].documentId, "D101");
  assert.deepEqual(view.getAllDocumentIds(), ["D101", "D102"]);
  assert.equal(view.getDocumentLength("D101"), 5);
});

test("closes snapshot when provider data retrieval fails", async () => {
  let closed = false;

  const provider = new MockIndexProvider();

  provider.getPostings = async () => {
    throw new Error("Storage unavailable");
  };

  provider.closeSnapshot = async () => {
    closed = true;
  };

  await assert.rejects(
    createSearchIndexView(provider, { type: "TERM", value: "database" }),
    /Storage unavailable/
  );

  assert.equal(closed, true);
});

const validSnapshot = {
  snapshotId: "S001",
  indexVersion: "V1",
  documentCount: 2,
  averageDocumentLength: 5,
  normalizationVersion: "1.1"
};

test("accepts a matching snapshot response", () => {
  const response = {
    snapshotId: "S001",
    indexVersion: "V1",
    data: { D101: 5 }
  };

  assert.deepEqual(
    validateSnapshotResponse(response, validSnapshot),
    { D101: 5 }
  );
});

test("rejects a mismatched snapshot ID", () => {
  assert.throws(
    () => validateSnapshotResponse({
      snapshotId: "S002",
      indexVersion: "V1",
      data: {}
    }, validSnapshot),
    error => error.code === "SNAPSHOT_MISMATCH"
  );
});

test("rejects a mismatched index version", () => {
  assert.throws(
    () => validateSnapshotResponse({
      snapshotId: "S001",
      indexVersion: "V2",
      data: {}
    }, validSnapshot),
    error => error.code === "INDEX_VERSION_MISMATCH"
  );
});

test("rejects a missing response envelope", () => {
  assert.throws(
    () => validateSnapshotResponse({
      D101: 5
    }, validSnapshot),
    error => error.code === "INVALID_SEARCH_RESPONSE"
  );
});

test("rejects incompatible normalization version and closes snapshot", async () => {
  let closed = false;
  let postingsRequested = false;

  const provider = new MockIndexProvider();

  provider.openSnapshot = async () => ({
    snapshotId: "S002",
    indexVersion: "V1",
    documentCount: 2,
    averageDocumentLength: 5,
    normalizationVersion: "1.0"
  });

  provider.getPostings = async () => {
    postingsRequested = true;
    throw new Error("Postings should not be requested");
  };

  provider.closeSnapshot = async (snapshotId) => {
    assert.equal(snapshotId, "S002");
    closed = true;
    return true;
  };

  await assert.rejects(
    createSearchIndexView(
      provider,
      { type: "TERM", value: "database" }
    ),
    error => error.code === "NORMALIZATION_VERSION_MISMATCH"
  );

  assert.equal(closed, true);
  assert.equal(postingsRequested, false);
});