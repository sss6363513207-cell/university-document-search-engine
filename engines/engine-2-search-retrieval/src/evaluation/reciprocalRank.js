export function reciprocalRank(rankedDocumentIds, relevantDocumentIds) {
  if (!Array.isArray(rankedDocumentIds) ||
      !Array.isArray(relevantDocumentIds)) {
    throw new TypeError("Document IDs must be arrays");
  }

  const relevant = new Set(relevantDocumentIds);

  const firstRelevantIndex = rankedDocumentIds.findIndex(
    id => relevant.has(id)
  );

  return firstRelevantIndex === -1
    ? 0
    : 1 / (firstRelevantIndex + 1);
}

export function meanReciprocalRank(queryResults) {
  if (!Array.isArray(queryResults)) {
    throw new TypeError("Query results must be an array");
  }

  if (queryResults.length === 0) return 0;

  const scores = queryResults.map(query =>
    reciprocalRank(
      query.rankedDocumentIds,
      query.relevantDocumentIds
    )
  );

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}