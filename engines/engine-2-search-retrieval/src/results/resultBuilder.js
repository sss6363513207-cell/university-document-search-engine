export function buildSearchResults({
  query,
  algorithm,
  rankedResults,
  documents,
  page = 1,
  pageSize = 10,
  totalMatches = rankedResults.length
}) {
  if (typeof query !== "string" || !query.trim()) {
    throw new TypeError("Invalid search query");
  }

  if (!["tfidf", "bm25"].includes(algorithm)) {
    throw new TypeError("Unsupported ranking algorithm");
  }

  if (!Array.isArray(rankedResults) || !Array.isArray(documents)) {
    throw new TypeError("Ranked results and documents must be arrays");
  }

  if (!Number.isInteger(page) || page < 1) {
    throw new TypeError("Page must be a positive integer");
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new TypeError("Page size must be a positive integer");
  }

  const documentMap = new Map(
    documents.map(document => [document.documentId, document])
  );

  const startIndex = (page - 1) * pageSize;
  const paginatedResults = rankedResults.slice(
    startIndex,
    startIndex + pageSize
  );

  const results = paginatedResults.map((item, index) => {
    const document = documentMap.get(item.documentId);

    if (!document) {
      throw new Error(`Document metadata not found: ${item.documentId}`);
    }

    return {
      rank: startIndex + index + 1,
      documentId: item.documentId,
      title: document.title ?? document.fileName ?? item.documentId,
      score: item.score,
      snippet: generateSnippet(document.content ?? "", query),
      metadata: {
        fileName: document.fileName ?? null,
        fileType: document.fileType ?? null
      }
    };
  });

  return {
    success: true,
    query,
    algorithm,
    pagination: {
      page,
      pageSize,
      totalMatches,
      totalResults: rankedResults.length,
      totalPages: Math.ceil(rankedResults.length / pageSize)
    },
    results
  };
}

function generateSnippet(content, query, maxLength = 180) {
  if (typeof content !== "string" || content.length === 0) {
    return "";
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const normalizedContent = content.toLowerCase();

  let matchPosition = -1;

  for (const term of terms) {
    const position = normalizedContent.indexOf(term);

    if (position !== -1) {
      matchPosition = position;
      break;
    }
  }

  if (matchPosition === -1) {
    return content.slice(0, maxLength);
  }

  const start = Math.max(0, matchPosition - 60);
  const end = Math.min(content.length, start + maxLength);

  return content.slice(start, end);
}