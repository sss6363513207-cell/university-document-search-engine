
export class PostingEntry {
  constructor(documentId, positions) {
    if (
      typeof documentId !== "string" ||
      documentId.trim().length === 0
    ) {
      throw new TypeError("Invalid document ID");
    }

    if (!Array.isArray(positions) || positions.length === 0) {
      throw new TypeError("Positions must be a non-empty array");
    }

    const validPositions = positions.every(
      (position, index) =>
        Number.isInteger(position) &&
        position >= 0 &&
        (index === 0 || position > positions[index - 1])
    );

    if (!validPositions) {
      throw new TypeError(
        "Positions must be non-negative and strictly increasing"
      );
    }

    this.documentId = documentId;
    this.positions = [...positions];
    this.termFrequency = positions.length;
  }

  getTermFrequency() {
    return this.termFrequency;
  }

  getPositions() {
    return [...this.positions];
  }

  toJSON() {
    return {
      documentId: this.documentId,
      termFrequency: this.termFrequency,
      positions: [...this.positions]
    };
  }
}

