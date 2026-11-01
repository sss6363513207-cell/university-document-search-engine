import { scoreTfIdf } from "./tfidf.js";
import { scoreBm25 } from "./bm25.js";
import { selectTopK } from "./topK.js";

export function rankDocuments({
  algorithm = "bm25",
  queryTerms,
  candidateDocumentIds,
  index,
  topK = 10,
  parameters = {}
}) {
  let rankedResults;

  switch (algorithm.toLowerCase()) {
    case "tfidf":
      rankedResults = scoreTfIdf(
        queryTerms,
        candidateDocumentIds,
        index
      );
      break;

    case "bm25":
      rankedResults = scoreBm25(
        queryTerms,
        candidateDocumentIds,
        index,
        parameters
      );
      break;

    default:
      throw new TypeError(`Unsupported ranking algorithm: ${algorithm}`);
  }

  return selectTopK(rankedResults, topK);
}