
const REQUIRED_FIELDS = [
  "documentId",
  "fileName",
  "filePath",
  "fileType",
  "text",
  "characterCount",
  "wordCount",
  "processingStatus",
  "metadata"
];

export function validateEngine1Payload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("Engine 1 payload must be an object");
  }

  if (payload.schemaVersion !== "1.0") {
    throw new Error("Unsupported Engine 1 payload schema version");
  }

  const document = payload.document;

  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new TypeError("Engine 1 payload must contain a document object");
  }

  for (const field of REQUIRED_FIELDS) {
    if (!Object.hasOwn(document, field) || document[field] == null) {
      throw new Error(`Missing required document field: ${field}`);
    }
  }

  for (const field of [
    "documentId",
    "fileName",
    "filePath",
    "fileType"
  ]) {
    if (typeof document[field] !== "string" || !document[field].trim()) {
      throw new TypeError(`${field} must be a non-empty string`);
    }
  }

  if (typeof document.text !== "string") {
    throw new TypeError("Document text must be a string");
  }

  if (
    !Number.isSafeInteger(document.characterCount) ||
    document.characterCount < 0
  ) {
    throw new TypeError("characterCount must be a non-negative integer");
  }

  if (
    !Number.isSafeInteger(document.wordCount) ||
    document.wordCount < 0
  ) {
    throw new TypeError("wordCount must be a non-negative integer");
  }

  if (document.processingStatus !== "COMPLETED") {
    throw new Error("Only COMPLETED documents can be indexed");
  }

  if (
    !document.metadata ||
    typeof document.metadata !== "object" ||
    Array.isArray(document.metadata)
  ) {
    throw new TypeError("Document metadata must be an object");
  }

  if (document.characterCount !== document.text.length) {
    throw new Error("characterCount does not match extracted text");
  }

  return document;
}
