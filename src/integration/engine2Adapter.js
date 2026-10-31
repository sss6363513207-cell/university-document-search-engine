const {
  validateDocumentResult
} = require("../interfaces/documentContract");

function prepareDocumentForEngine2(document) {
  validateDocumentResult(document);

  return {
    schemaVersion: "1.0",
    document: {
      documentId: document.documentId,
      fileName: document.fileName,
      filePath: document.filePath,
      fileType: document.fileType,
      text: document.text,
      characterCount: document.characterCount,
      wordCount: document.wordCount,
      processingStatus: document.processingStatus,
      metadata: document.metadata
    }
  };
}

module.exports = {
  prepareDocumentForEngine2
};
