export function selectTopK(rankedResults, k) {
  if (!Array.isArray(rankedResults)) {
    throw new TypeError("Ranked results must be an array");
  }

  if (!Number.isInteger(k) || k <= 0) {
    throw new TypeError("K must be a positive integer");
  }

  const documentIds = new Set();

  for (const result of rankedResults) {
    if (
      !result ||
      typeof result.documentId !== "string" ||
      result.documentId.trim().length === 0 ||
      !Number.isFinite(result.score)
    ) {
      throw new TypeError("Invalid ranked result");
    }

    if (documentIds.has(result.documentId)) {
      throw new TypeError(`Duplicate document ID: ${result.documentId}`);
    }

    documentIds.add(result.documentId);
  }

  return [...rankedResults]
    .sort((a, b) =>
      b.score - a.score ||
      a.documentId.localeCompare(b.documentId)
    )
    .slice(0, k);
}