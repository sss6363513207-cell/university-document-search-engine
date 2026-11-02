import {
  Engine2Error,
  ERROR_CODES
} from "./errorCodes.js";

export function validateSnapshot(snapshot) {
  if (
    !snapshot ||
    typeof snapshot.snapshotId !== "string" ||
    !snapshot.snapshotId.trim() ||
    typeof snapshot.indexVersion !== "string" ||
    !Number.isInteger(snapshot.documentCount) ||
    snapshot.documentCount < 0 ||
    !Number.isFinite(snapshot.averageDocumentLength) ||
    snapshot.averageDocumentLength < 0 ||
    typeof snapshot.normalizationVersion !== "string"
  ) {
    throw new Engine2Error(
      ERROR_CODES.INVALID_SEARCH_RESPONSE,
      "Invalid snapshot response"
    );
  }

  return true;
}

export function validateSnapshotResponse(response, snapshot) {
  if (
    !response ||
    typeof response !== "object" ||
    typeof response.snapshotId !== "string" ||
    typeof response.indexVersion !== "string" ||
    !Object.hasOwn(response, "data")
  ) {
    throw new Engine2Error(
      ERROR_CODES.INVALID_SEARCH_RESPONSE,
      "Invalid snapshot response envelope"
    );
  }

  if (response.snapshotId !== snapshot.snapshotId) {
    throw new Engine2Error(
      ERROR_CODES.SNAPSHOT_MISMATCH,
      "Provider response belongs to a different snapshot"
    );
  }

  if (response.indexVersion !== snapshot.indexVersion) {
    throw new Engine2Error(
      ERROR_CODES.INDEX_VERSION_MISMATCH,
      "Provider response belongs to a different index version"
    );
  }

  return response.data;
}

export function validatePostingsResponse(response, requestedTerms) {
  if (!response || typeof response !== "object") {
    throw new Engine2Error(
      ERROR_CODES.INVALID_POSTING_LIST,
      "Invalid postings response"
    );
  }

  for (const term of requestedTerms) {
    const data = response[term];

    if (
      !data ||
      !Number.isInteger(data.documentFrequency) ||
      data.documentFrequency < 0 ||
      !Array.isArray(data.postings) ||
      data.documentFrequency !== data.postings.length
    ) {
      throw new Engine2Error(
        ERROR_CODES.INVALID_POSTING_LIST,
        `Invalid postings for term: ${term}`
      );
    }

    let previousDocumentId = null;

    for (const posting of data.postings) {
      if (
        !posting ||
        typeof posting.documentId !== "string" ||
        !posting.documentId.trim() ||
        !Number.isInteger(posting.termFrequency) ||
        posting.termFrequency <= 0 ||
        !Array.isArray(posting.positions) ||
        posting.positions.length !== posting.termFrequency ||
        !posting.positions.every(Number.isInteger)
      ) {
        throw new Engine2Error(
          ERROR_CODES.INVALID_POSTING_LIST,
          `Invalid posting entry for term: ${term}`
        );
      }

      if (
        previousDocumentId !== null &&
        posting.documentId <= previousDocumentId
      ) {
        throw new Engine2Error(
          ERROR_CODES.INVALID_POSTING_LIST,
          "Posting document IDs must be unique and sorted"
        );
      }

      for (let i = 0; i < posting.positions.length; i++) {
        if (
          posting.positions[i] < 0 ||
          (i > 0 && posting.positions[i] <= posting.positions[i - 1])
        ) {
          throw new Engine2Error(
            ERROR_CODES.INVALID_POSTING_LIST,
            "Posting positions must be non-negative and increasing"
          );
        }
      }

      previousDocumentId = posting.documentId;
    }
  }

  return true;
}

export function validateDocumentStats(stats, requestedIds) {
  if (!stats || typeof stats !== "object") {
    throw new TypeError("Invalid document statistics response");
  }

  for (const documentId of requestedIds) {
    const length = stats[documentId];

    if (
      length !== undefined &&
      (!Number.isInteger(length) || length <= 0)
    ) {
      throw new TypeError(
        `Invalid document length: ${documentId}`
      );
    }
  }

  return true;
}

export function validateDocumentIds(documentIds) {
  if (!Array.isArray(documentIds)) {
    throw new TypeError("Document IDs must be an array");
  }

  for (let i = 0; i < documentIds.length; i++) {
    if (
      typeof documentIds[i] !== "string" ||
      !documentIds[i].trim() ||
      (i > 0 && documentIds[i] <= documentIds[i - 1])
    ) {
      throw new TypeError(
        "Document IDs must be unique and sorted"
      );
    }
  }

  return true;
}

export function validateDocumentContent(response, requestedIds) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Invalid document content response");
  }

  for (const documentId of requestedIds) {
    const document = response[documentId];

    if (
      !document ||
      typeof document.content !== "string"
    ) {
      throw new TypeError(
        `Missing document content: ${documentId}`
      );
    }
  }

  return true;
}