export class IndexProvider {
  async openSnapshot() {
    throw new Error("openSnapshot() must be implemented");
  }

  async getPostings(terms, snapshotId) {
    throw new Error("getPostings() must be implemented");
  }

  async getDocumentStats(documentIds, snapshotId) {
    throw new Error("getDocumentStats() must be implemented");
  }

  async getDocumentMetadata(documentIds, snapshotId) {
    throw new Error("getDocumentMetadata() must be implemented");
  }

  async getAllDocumentIds(snapshotId) {
    throw new Error("getAllDocumentIds() must be implemented");
  }

  async closeSnapshot(snapshotId) {
    throw new Error("closeSnapshot() must be implemented");
  }

  async getDocumentContent(documentIds, snapshotId) {
    throw new Error("getDocumentContent() must be implemented");
  }
}

 