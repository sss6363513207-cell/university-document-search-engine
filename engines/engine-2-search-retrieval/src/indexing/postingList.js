
import { PostingEntry } from "./postingEntry.js";

export class PostingList {
  constructor() {
    this.postings = [];
  }

  addPosting(entry) {
    if (!(entry instanceof PostingEntry)) {
      throw new TypeError("Expected a PostingEntry instance");
    }

    const existingIndex = this.postings.findIndex(
      posting => posting.documentId === entry.documentId
    );

    if (existingIndex !== -1) {
      throw new Error(
        `Duplicate document ID: ${entry.documentId}`
      );
    }

    // Insert while preserving ascending document ID order.
    let left = 0;
    let right = this.postings.length;

    while (left < right) {
      const middle = Math.floor((left + right) / 2);

      if (this.postings[middle].documentId < entry.documentId) {
        left = middle + 1;
      } else {
        right = middle;
      }
    }

    this.postings.splice(left, 0, entry);
  }

  getPosting(documentId) {
    return (
      this.postings.find(
        posting => posting.documentId === documentId
      ) ?? null
    );
  }

  getAllPostings() {
    return this.postings.map(posting => posting.toJSON());
  }

  getDocumentFrequency() {
    return this.postings.length;
  }

  size() {
    return this.postings.length;
  }

  clear() {
    this.postings = [];
  }
}

