function validateDocumentResult(document) {
  const requiredFields = [
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

  for (const field of requiredFields) {
    if (document[field] === undefined || document[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (document.processingStatus !== "COMPLETED") {
    throw new Error("Invalid processing status");
  }

  if (typeof document.text !== "string") {
    throw new Error("Document text must be a string");
  }

  return true;
}

module.exports = { validateDocumentResult };
