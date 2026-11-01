import { parseQuery } from "./query/parser.js";
import { validateQueryAst } from "./query/queryValidator.js";
import { normalizeQueryTerms } from "./query/queryNormalizer.js";
import { collectAstTerms } from "./query/astTerms.js";

import { buildExecutionPlan } from "./planning/executionPlanner.js";
import { executePlan } from "./planning/planExecutor.js";

import { rankDocuments } from "./ranking/ranker.js";
import { buildSearchResults } from "./results/resultBuilder.js";

import { createSearchIndexView } from "./interfaces/providerAdapter.js";

import {
  validateDocumentStats,
  validateDocumentContent
} from "./interfaces/providerValidator.js";

export async function search(request, provider) {
  if (!request || typeof request !== "object") {
    throw new TypeError("Invalid search request");
  }

  const {
    query,
    algorithm = "bm25",
    topK = 10,
    page = 1,
    pageSize = 10,
    parameters = {}
  } = request;

  if (typeof query !== "string" || !query.trim()) {
    throw new TypeError("Search query must be a non-empty string");
  }

  if (!["bm25", "tfidf"].includes(algorithm.toLowerCase())) {
    throw new TypeError("Unsupported ranking algorithm");
  }

  if (!Number.isInteger(topK) || topK < 1) {
    throw new TypeError("topK must be a positive integer");
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new TypeError("page must be a positive integer");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new TypeError("pageSize must be a positive integer");
  }

  let snapshot;

  try {
    const ast = parseQuery(query);
    validateQueryAst(ast);

    const rawTerms = collectAstTerms(ast);
    const queryTerms = normalizeQueryTerms(rawTerms);

    const adapterResult = await createSearchIndexView(
      provider,
      ast
    );

    snapshot = adapterResult.snapshot;

    const index = adapterResult.view;

    const plan = buildExecutionPlan(ast, index);
    const candidateDocumentIds = executePlan(plan, index);

    const statsResponse = await provider.getDocumentStats(
      candidateDocumentIds,
      snapshot.snapshotId
    );

    validateDocumentStats(statsResponse, candidateDocumentIds);

    const documentStats = candidateDocumentIds
      .filter(id => statsResponse[id] !== undefined)
      .map(id => [
        id,
        { documentLength: statsResponse[id] }
      ]);

    index.setDocumentStats(documentStats);

    const rankedResults = rankDocuments({
      algorithm: algorithm.toLowerCase(),
      queryTerms,
      candidateDocumentIds,
      index,
      topK,
      parameters
    });

    const resultDocumentIds = rankedResults.map(
      result => result.documentId
    );

    const documentResponse = await provider.getDocumentContent(
      resultDocumentIds,
      snapshot.snapshotId
    );

    validateDocumentContent(
      documentResponse,
      resultDocumentIds
    );

    const documents = resultDocumentIds.map(id => ({
      documentId: id,
      ...documentResponse[id]
    }));

    return buildSearchResults({
      query,
      algorithm: algorithm.toLowerCase(),
      rankedResults,
      documents,
      page,
      pageSize,
      totalMatches: candidateDocumentIds.length
    });
  } finally {
    if (snapshot?.snapshotId) {
      await provider.closeSnapshot(snapshot.snapshotId);
    }
  }
}