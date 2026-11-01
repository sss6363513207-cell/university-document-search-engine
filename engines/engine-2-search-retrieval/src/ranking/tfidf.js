export function scoreTfIdf(queryTerms, candidateDocumentIds, index) {
  if (!Array.isArray(queryTerms) || !Array.isArray(candidateDocumentIds)) {
    throw new TypeError("Query terms and candidate IDs must be arrays");
  }

  if (
    !index ||
    typeof index.getPostings !== "function" ||
    typeof index.getDocumentFrequency !== "function" ||
    typeof index.getDocumentCount !== "function" ||
    typeof index.getDocumentLength !== "function"
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

  const uniqueTerms = [...new Set(queryTerms)];
  const documentCount = index.getDocumentCount();

  const scores = new Map(
    candidateDocumentIds.map(documentId => [documentId, 0])
  );

  for (const term of uniqueTerms) {
    const documentFrequency = index.getDocumentFrequency(term);

    const idf = Math.log(
      (documentCount + 1) / (documentFrequency + 1)
    ) + 1;

    const postings = index.getPostings(term);

    for (const posting of postings) {
      if (!scores.has(posting.documentId)) {
        continue;
      }

      const documentLength = index.getDocumentLength(
        posting.documentId
      );

      if (!Number.isInteger(documentLength) || documentLength <= 0) {
        throw new Error(
          `Invalid document length: ${posting.documentId}`
        );
      }

      const tf = posting.termFrequency / documentLength;

      scores.set(
        posting.documentId,
        scores.get(posting.documentId) + tf * idf
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