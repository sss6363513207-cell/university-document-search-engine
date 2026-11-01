export function phraseRetriever(terms, index) {
  if (!Array.isArray(terms) || terms.length === 0) {
    throw new TypeError("Terms must be a non-empty array");
  }

  if (!index || typeof index.getPostings !== "function") {
    throw new TypeError("A valid inverted index is required");
  }

  if (
    !terms.every(
      term => typeof term === "string" && term.trim().length > 0
    )
  ) {
    throw new TypeError("Every phrase term must be a non-empty string");
  }

  // A single term is equivalent to ordinary term retrieval.
  if (terms.length === 1) {
    return index.getPostings(terms[0]).map(posting => posting.documentId);
  }

  const postingLists = terms.map(term => index.getPostings(term));

  // If any term is missing, the phrase cannot match.
  if (postingLists.some(list => list.length === 0)) {
    return [];
  }

  const firstPostings = new Map(
    postingLists[0].map(posting => [
      posting.documentId,
      posting.positions
    ])
  );

  const results = [];

  for (const [documentId, firstPositions] of firstPostings) {
    let matchingPositions = firstPositions;

    for (let termIndex = 1; termIndex < terms.length; termIndex++) {
      const posting = postingLists[termIndex].find(
        item => item.documentId === documentId
      );

      if (!posting) {
        matchingPositions = [];
        break;
      }

      const nextPositions = new Set(posting.positions);

      matchingPositions = matchingPositions.filter(
        position => nextPositions.has(position + termIndex)
      );

      if (matchingPositions.length === 0) {
        break;
      }
    }

    if (matchingPositions.length > 0) {
      results.push(documentId);
    }
  }

  return results.sort();
}