export function ndcgAtK(rankedDocumentIds, relevanceJudgements, k) {
  if (!Array.isArray(rankedDocumentIds) ||
      !Array.isArray(relevanceJudgements)) {
    throw new TypeError("Inputs must be arrays");
  }

  if (!Number.isInteger(k) || k < 0) {
    throw new TypeError("K must be a non-negative integer");
  }

  if (k === 0) return 0;

  const relevanceMap = new Map();

  for (const item of relevanceJudgements) {
    if (
      !item ||
      typeof item.documentId !== "string" ||
      !Number.isFinite(item.relevance) ||
      item.relevance < 0
    ) {
      throw new TypeError("Invalid relevance judgement");
    }

    if (relevanceMap.has(item.documentId)) {
      throw new TypeError(`Duplicate judgement: ${item.documentId}`);
    }

    relevanceMap.set(item.documentId, item.relevance);
  }

  function dcg(relevances) {
    return relevances.reduce((sum, relevance, index) => {
      return sum +
        (Math.pow(2, relevance) - 1) /
        Math.log2(index + 2);
    }, 0);
  }

  const actualRelevances = rankedDocumentIds
    .slice(0, k)
    .map(id => relevanceMap.get(id) ?? 0);

  const idealRelevances = [...relevanceMap.values()]
    .sort((a, b) => b - a)
    .slice(0, k);

  const idealDcg = dcg(idealRelevances);

  if (idealDcg === 0) return 0;

  return dcg(actualRelevances) / idealDcg;
}