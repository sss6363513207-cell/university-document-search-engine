import { SearchIndexView } from "./searchIndexView.js";

import {
  Engine2Error,
  ERROR_CODES
} from "./errorCodes.js";

import {
  validateSnapshot,
  validateSnapshotResponse,
  validatePostingsResponse,
  validateDocumentStats,
  validateDocumentIds
} from "./providerValidator.js";

import {
  NORMALIZATION_VERSION
} from "../tokenizer/normalization.js";
import { collectAstTerms } from "../query/astTerms.js";

export async function createSearchIndexView(provider, ast) {
  if (
    !provider ||
    typeof provider.openSnapshot !== "function"
  ) {
    throw new TypeError("Invalid index provider");
  }

  const queryTerms = [...new Set(collectAstTerms(ast))];

  let snapshot;

  try {
    snapshot = await provider.openSnapshot();
    validateSnapshot(snapshot);

    if (snapshot.normalizationVersion !== NORMALIZATION_VERSION) {
      throw new Engine2Error(
        ERROR_CODES.NORMALIZATION_VERSION_MISMATCH,
        "Index normalization version is incompatible with Engine 2",
        {
          expectedVersion: NORMALIZATION_VERSION,
          actualVersion: snapshot.normalizationVersion
        }
      );
    }

    const [
      rawPostingsResponse,
      rawDocumentIdsResponse
    ] = await Promise.all([
      provider.getPostings(queryTerms, snapshot.snapshotId),
      provider.getAllDocumentIds(snapshot.snapshotId)
    ]);

    const postingsResponse = validateSnapshotResponse(
      rawPostingsResponse,
      snapshot
    );

    const documentIds = validateSnapshotResponse(
      rawDocumentIdsResponse,
      snapshot
    );

    validatePostingsResponse(postingsResponse, queryTerms);
    validateDocumentIds(documentIds);

    const candidateIds = [
      ...new Set(
        queryTerms.flatMap(term =>
          postingsResponse[term].postings.map(
            posting => posting.documentId
          )
        )
      )
    ].sort();

    const rawStatsResponse = await provider.getDocumentStats(
      candidateIds,
      snapshot.snapshotId
    );

    const statsResponse = validateSnapshotResponse(
      rawStatsResponse,
      snapshot
    );

    validateDocumentStats(statsResponse, candidateIds);

    const postingsByTerm = queryTerms.map(term => [
      term,
      postingsResponse[term].postings
    ]);

    const documentStats = candidateIds
      .filter(id => statsResponse[id] !== undefined)
      .map(id => [
        id,
        { documentLength: statsResponse[id] }
      ]);

    const view = new SearchIndexView({
      documentCount: snapshot.documentCount,
      averageDocumentLength: snapshot.averageDocumentLength,
      documentIds,
      postingsByTerm,
      documentStats
    });

    return {
      snapshot,
      view,
      candidateIds
    };
  } catch (error) {
    if (snapshot?.snapshotId) {
      await provider.closeSnapshot(snapshot.snapshotId);
    }

    throw error;
  }
}