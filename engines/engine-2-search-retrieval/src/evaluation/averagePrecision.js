import { precisionAtK } from "./precisionRecall.js";

export function averagePrecision(rankedDocumentIds, relevantDocumentIds) {
  if (!Array.isArray(rankedDocumentIds) ||
      !Array.isArray(relevantDocumentIds)) {
    throw new TypeError("Document IDs must be arrays");
  }

  if (relevantDocumentIds.length === 0) return 0;

  const relevant = new Set(relevantDocumentIds);

  let relevantHits = 0;
  let precisionSum = 0;

  rankedDocumentIds.forEach((documentId, index) => {
    if (relevant.has(documentId)) {
      relevantHits++;
      precisionSum += precisionAtK(
        rankedDocumentIds,
        relevantDocumentIds,
        index + 1
      );
    }
  });

  return precisionSum / relevant.size;
}

export function meanAveragePrecision(queryResults) {
  if (!Array.isArray(queryResults)) {
    throw new TypeError("Query results must be an array");
  }

  if (queryResults.length === 0) return 0;

  const scores = queryResults.map(query =>
    averagePrecision(
      query.rankedDocumentIds,
      query.relevantDocumentIds
    )
  );

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}