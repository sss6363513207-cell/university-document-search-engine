export function precisionAtK(rankedDocumentIds, relevantDocumentIds, k) {
  validateInputs(rankedDocumentIds, relevantDocumentIds, k);

  if (k === 0) return 0;

  const relevant = new Set(relevantDocumentIds);
  const topK = rankedDocumentIds.slice(0, k);

  const hits = topK.filter(id => relevant.has(id)).length;

  return hits / k;
}

export function recallAtK(rankedDocumentIds, relevantDocumentIds, k) {
  validateInputs(rankedDocumentIds, relevantDocumentIds, k);

  if (relevantDocumentIds.length === 0) return 0;

  const relevant = new Set(relevantDocumentIds);
  const topK = rankedDocumentIds.slice(0, k);

  const hits = topK.filter(id => relevant.has(id)).length;

  return hits / relevant.size;
}

function validateInputs(ranked, relevant, k) {
  if (!Array.isArray(ranked) || !Array.isArray(relevant)) {
    throw new TypeError("Document IDs must be arrays");
  }

  if (!Number.isInteger(k) || k < 0) {
    throw new TypeError("K must be a non-negative integer");
  }
}