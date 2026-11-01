import { tokenizeText } from "../tokenizer/normalization.js";

export function normalizeQueryTerm(term) {
  if (typeof term !== "string" || term.trim().length === 0) {
    throw new TypeError("Query term must be a non-empty string");
  }

  return tokenizeText(term).map(token => token.term);
}

export function normalizeQueryTerms(terms) {
  if (!Array.isArray(terms)) {
    throw new TypeError("Query terms must be an array");
  }

  return terms.flatMap(term => normalizeQueryTerm(term));
}