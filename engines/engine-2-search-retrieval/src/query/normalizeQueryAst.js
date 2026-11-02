import { normalizeQueryTerm } from "./queryNormalizer.js";
import { Engine2Error, ERROR_CODES } from "../interfaces/errorCodes.js";

export function normalizeQueryAst(ast) {
  if (!ast || typeof ast !== "object") {
    throw new TypeError("Invalid query AST");
  }

  switch (ast.type) {
    case "TERM": {
      const terms = normalizeQueryTerm(ast.value);

      if (terms.length !== 1) {
        throw new Engine2Error(
          ERROR_CODES.INVALID_QUERY,
          "A search term must normalize to exactly one token"
        );
      }

      return {
        type: "TERM",
        value: terms[0]
      };
    }

    case "PHRASE": {
      if (!Array.isArray(ast.terms)) {
        throw new TypeError("Invalid phrase AST");
      }

      const terms = ast.terms.flatMap(term =>
        normalizeQueryTerm(term)
      );

      if (terms.length === 0) {
        throw new Engine2Error(
          ERROR_CODES.INVALID_QUERY,
          "Phrase contains no searchable terms"
        );
      }

      return {
        type: "PHRASE",
        terms
      };
    }

    case "AND":
    case "OR":
      return {
        type: ast.type,
        left: normalizeQueryAst(ast.left),
        right: normalizeQueryAst(ast.right)
      };

    case "NOT":
      return {
        type: "NOT",
        operand: normalizeQueryAst(ast.operand)
      };

    default:
      throw new TypeError(
        `Unsupported AST node: ${ast.type}`
      );
  }
}