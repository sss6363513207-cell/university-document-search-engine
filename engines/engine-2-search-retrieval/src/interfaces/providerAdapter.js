import { SearchIndexView } from "./searchIndexView.js";

import {
  validateSnapshot,
  validatePostingsResponse,
  validateDocumentStats,
  validateDocumentIds
} from "./providerValidator.js";

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

    const [
      postingsResponse,
      documentIds
    ] = await Promise.all([
      provider.getPostings(queryTerms, snapshot.snapshotId),
      provider.getAllDocumentIds(snapshot.snapshotId)
    ]);

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

    const statsResponse = await provider.getDocumentStats(
      candidateIds,
      snapshot.snapshotId
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