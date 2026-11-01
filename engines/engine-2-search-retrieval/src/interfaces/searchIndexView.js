export class SearchIndexView {
  constructor({
    documentCount,
    averageDocumentLength,
    documentIds,
    postingsByTerm,
    documentStats
  }) {
    this.documentCount = documentCount;
    this.averageDocumentLength = averageDocumentLength;
    this.documentIds = [...documentIds];
    this.postingsByTerm = new Map(postingsByTerm);
    this.documentStats = new Map(documentStats);
  }

  getDocumentCount() {
    return this.documentCount;
  }

  getAverageDocumentLength() {
    return this.averageDocumentLength;
  }

  getAllDocumentIds() {
    return [...this.documentIds];
  }

  getPostings(term) {
    return (this.postingsByTerm.get(term) ?? []).map(posting => ({
      ...posting,
      positions: [...posting.positions]
    }));
  }

  getDocumentFrequency(term) {
    return this.postingsByTerm.get(term)?.length ?? 0;
  }

  getDocumentLength(documentId) {
    return this.documentStats.get(documentId)?.documentLength ?? null;
  }
  setDocumentStats(documentStats) {
    this.documentStats = new Map(documentStats);
  }
}