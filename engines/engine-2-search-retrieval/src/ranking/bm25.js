const DEFAULT_K1 = 1.2;
const DEFAULT_B = 0.75;

export function scoreBm25(
  queryTerms,
  candidateDocumentIds,
  index,
  parameters = {}
) {
  if (!Array.isArray(queryTerms) || !Array.isArray(candidateDocumentIds)) {
    throw new TypeError("Query terms and candidate IDs must be arrays");
  }

  if (
    !index ||
    typeof index.getPostings !== "function" ||
    typeof index.getDocumentFrequency !== "function" ||
    typeof index.getDocumentCount !== "function" ||
    typeof index.getDocumentLength !== "function" ||
    typeof index.getAverageDocumentLength !== "function"
  ) {
    throw new TypeError("A valid inverted index is required");
  }

  if (
    !queryTerms.every(
      term => typeof term === "string" && term.trim().length > 0
    )
  ) {
    throw new TypeError("Invalid query terms");
  }

  if (
    !candidateDocumentIds.every(
      id => typeof id === "string" && id.trim().length > 0
    )
  ) {
    throw new TypeError("Invalid candidate document IDs");
  }

  const k1 = parameters.k1 ?? DEFAULT_K1;
  const b = parameters.b ?? DEFAULT_B;

  if (
    !Number.isFinite(k1) ||
    k1 <= 0 ||
    !Number.isFinite(b) ||
    b < 0 ||
    b > 1
  ) {
    throw new TypeError("Invalid BM25 parameters");
  }

  const documentCount = index.getDocumentCount();
  const averageDocumentLength = index.getAverageDocumentLength();

  if (documentCount <= 0 || averageDocumentLength <= 0) {
    throw new Error("Index contains no valid documents");
  }

  const uniqueTerms = [...new Set(queryTerms)];

  const scores = new Map(
    candidateDocumentIds.map(documentId => [documentId, 0])
  );

  for (const term of uniqueTerms) {
    const documentFrequency = index.getDocumentFrequency(term);

    if (documentFrequency === 0) {
      continue;
    }

    const idf = Math.log(
      1 +
      (documentCount - documentFrequency + 0.5) /
      (documentFrequency + 0.5)
    );

    const postings = index.getPostings(term);

    for (const posting of postings) {
      if (!scores.has(posting.documentId)) {
        continue;
      }

      const documentLength = index.getDocumentLength(
        posting.documentId
      );

      if (
        !Number.isInteger(documentLength) ||
        documentLength <= 0
      ) {
        throw new Error(
          `Invalid document length: ${posting.documentId}`
        );
      }

      const frequency = posting.termFrequency;

      const denominator =
        frequency +
        k1 * (
          1 - b +
          b * (documentLength / averageDocumentLength)
        );

      const termScore =
        idf *
        (frequency * (k1 + 1)) /
        denominator;

      scores.set(
        posting.documentId,
        scores.get(posting.documentId) + termScore
      );
    }
  }

  return [...scores.entries()]
    .map(([documentId, score]) => ({ documentId, score }))
    .sort((a, b) =>
      b.score - a.score ||
      a.documentId.localeCompare(b.documentId)
    );
}