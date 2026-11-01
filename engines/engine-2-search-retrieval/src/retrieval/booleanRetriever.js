import { intersection } from "./intersection.js";
import { union } from "./union.js";
import { difference } from "./difference.js";
import { phraseRetriever } from "./phraseRetriever.js";

export function booleanRetriever(expression, index) {
  if (!expression || typeof expression !== "object") {
    throw new TypeError("Expression must be an object");
  }

  if (!index || typeof index.getPostings !== "function") {
    throw new TypeError("A valid inverted index is required");
  }

  switch (expression.type) {
    case "TERM": {
      if (
        typeof expression.value !== "string" ||
        expression.value.trim().length === 0
      ) {
        throw new TypeError("Term value must be a non-empty string");
      }

      return index
        .getPostings(expression.value)
        .map(posting => posting.documentId);
    }

    case "PHRASE":
      return phraseRetriever(expression.terms, index);

    case "AND": {
      const left = booleanRetriever(expression.left, index);
      const right = booleanRetriever(expression.right, index);

      return intersection(left, right);
    }

    case "OR": {
      const left = booleanRetriever(expression.left, index);
      const right = booleanRetriever(expression.right, index);

      return union(left, right);
    }

    case "NOT": {
      const excluded = booleanRetriever(expression.operand, index);
      const universe = index.getAllDocumentIds();

      return difference(universe, excluded);
    }

    default:
      throw new TypeError(
        `Unsupported expression type: ${expression.type}`
      );
  }
}