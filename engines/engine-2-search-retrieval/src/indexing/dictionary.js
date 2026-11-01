
import { PostingList } from "./postingList.js";

export class Dictionary {
  constructor() {
    this.terms = new Map();
  }

  addTerm(term) {
    if (typeof term !== "string" || term.length === 0) {
      throw new TypeError("Term must be a non-empty string");
    }

    if (!this.terms.has(term)) {
      this.terms.set(term, {
        documentFrequency: 0,
        postings: new PostingList()
      });
    }
  }

  addPosting(term, postingEntry) {
    this.addTerm(term);

    const termData = this.terms.get(term);
    termData.postings.addPosting(postingEntry);
    termData.documentFrequency =
      termData.postings.getDocumentFrequency();
  }

  getTerm(term) {
    return this.terms.get(term) ?? null;
  }

  getPostings(term) {
    return this.terms.get(term)?.postings.getAllPostings() ?? [];
  }

  hasTerm(term) {
    return this.terms.has(term);
  }

  getDocumentFrequency(term) {
    return this.terms.get(term)?.documentFrequency ?? 0;
  }

  getAllTerms() {
    return [...this.terms.keys()];
  }

  size() {
    return this.terms.size;
  }

  clear() {
    this.terms.clear();
  }
}
