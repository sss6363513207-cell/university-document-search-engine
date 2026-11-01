import { intersection } from "../retrieval/intersection.js";
import { union } from "../retrieval/union.js";
import { difference } from "../retrieval/difference.js";
import { phraseRetriever } from "../retrieval/phraseRetriever.js";
import { Engine2Error, ERROR_CODES } from "../interfaces/errorCodes.js";

export function executePlan(plan, index) {
  if (!plan || typeof plan !== "object") {
    throw new Engine2Error(
      ERROR_CODES.INVALID_EXECUTION_PLAN,
      "Invalid execution plan"
    );
  }

  if (!index || typeof index.getPostings !== "function") {
    throw new TypeError("A valid inverted index is required");
  }

  switch (plan.type) {
    case "TERM": {
      if (typeof plan.term !== "string" || !plan.term.trim()) {
        throw new Engine2Error(
          ERROR_CODES.INVALID_EXECUTION_PLAN,
          "Invalid TERM plan"
        );
      }

      return index
        .getPostings(plan.term)
        .map(posting => posting.documentId);
    }

    case "PHRASE":
      return phraseRetriever(plan.terms, index);

    case "AND": {
      const left = executePlan(plan.left, index);
      const right = executePlan(plan.right, index);

      return intersection(left, right);
    }

    case "OR": {
      const left = executePlan(plan.left, index);
      const right = executePlan(plan.right, index);

      return union(left, right);
    }

    case "NOT": {
      const excluded = executePlan(plan.operand, index);

      if (typeof index.getAllDocumentIds !== "function") {
        throw new Engine2Error(
          ERROR_CODES.DOCUMENT_UNIVERSE_UNAVAILABLE,
          "Document universe is unavailable"
        );
      }

      return difference(index.getAllDocumentIds(), excluded);
    }

    default:
      throw new Engine2Error(
        ERROR_CODES.INVALID_EXECUTION_PLAN,
        `Unsupported plan type: ${plan.type}`
      );
  }
}