
import { Dictionary } from "./dictionary.js";
import { PostingEntry } from "./postingEntry.js";

export class InvertedIndex {
  constructor() {
    this.dictionary = new Dictionary();
    this.documents = new Map();
  }

  addDocument(documentId, tokens) {
    if (
      typeof documentId !== "string" ||
      documentId.trim().length === 0
    ) {
      throw new TypeError("Invalid document ID");
    }

    if (this.documents.has(documentId)) {
      throw new Error(`Document already indexed: ${documentId}`);
    }

    if (!Array.isArray(tokens)) {
      throw new TypeError("Tokens must be an array");
    }

    // Validate all tokens before modifying the index.
    let previousPosition = -1;

    for (const token of tokens) {
      if (
        typeof token.term !== "string" ||
        token.term.length === 0 ||
        !Number.isInteger(token.position) ||
        token.position < 0 ||
        token.position <= previousPosition
      ) {
        throw new TypeError("Invalid or unordered document tokens");
      }

      previousPosition = token.position;
    }

    // Group positions by term.
    const termPositions = new Map();

    for (const token of tokens) {
      if (!termPositions.has(token.term)) {
        termPositions.set(token.term, []);
      }

      termPositions.get(token.term).push(token.position);
    }

    // Build postings.
    for (const [term, positions] of termPositions) {
      const posting = new PostingEntry(documentId, positions);
      this.dictionary.addPosting(term, posting);
    }

    this.documents.set(documentId, {
      documentLength: tokens.length
    });
  }

  getPostings(term) {
    return this.dictionary.getPostings(term);
  }

  getDocumentFrequency(term) {
    return this.dictionary.getDocumentFrequency(term);
  }

  getDocumentLength(documentId) {
    return this.documents.get(documentId)?.documentLength ?? null;
  }

  getAllDocumentIds() {
    return [...this.documents.keys()].sort();
  }

  getAllTerms() {
    return this.dictionary.getAllTerms();
  }

  getDocumentCount() {
    return this.documents.size;
  }

  getAverageDocumentLength() {
    if (this.documents.size === 0) {
      return 0;
    }

    const totalLength = [...this.documents.values()]
      .reduce((sum, document) => sum + document.documentLength, 0);

    return totalLength / this.documents.size;
  }

  clear() {
    this.dictionary.clear();
    this.documents.clear();
  }
}
