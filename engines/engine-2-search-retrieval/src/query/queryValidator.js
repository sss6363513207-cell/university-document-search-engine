import { Engine2Error, ERROR_CODES } from "../interfaces/errorCodes.js";

export function validateQueryAst(ast) {
  function validateNode(node) {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      throw new Engine2Error(
        ERROR_CODES.INVALID_QUERY,
        "Invalid query AST node"
      );
    }

    switch (node.type) {
      case "TERM":
        if (
          typeof node.value !== "string" ||
          node.value.trim().length === 0
        ) {
          throw new Engine2Error(
            ERROR_CODES.INVALID_QUERY,
            "TERM node requires a non-empty value"
          );
        }
        break;

      case "PHRASE":
        if (
          !Array.isArray(node.terms) ||
          node.terms.length === 0 ||
          !node.terms.every(
            term => typeof term === "string" && term.trim().length > 0
          )
        ) {
          throw new Engine2Error(
            ERROR_CODES.INVALID_QUERY,
            "PHRASE node requires a non-empty array of valid terms"
          );
        }
        break;

      case "AND":
      case "OR":
        validateNode(node.left);
        validateNode(node.right);
        break;

      case "NOT":
        validateNode(node.operand);
        break;

      default:
        throw new Engine2Error(
          ERROR_CODES.INVALID_QUERY,
          `Unsupported AST node type: ${node.type}`
        );
    }
  }

  validateNode(ast);
  return true;
}