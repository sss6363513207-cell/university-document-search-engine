import { validateQueryAst } from "../query/queryValidator.js";
import { Engine2Error, ERROR_CODES } from "../interfaces/errorCodes.js";

export function buildExecutionPlan(ast, index) {
  validateQueryAst(ast);

  if (
    !index ||
    typeof index.getDocumentFrequency !== "function" ||
    typeof index.getDocumentCount !== "function"
  ) {
    throw new TypeError("A valid inverted index is required");
  }

  const documentCount = index.getDocumentCount();

  function createPlan(node) {
    switch (node.type) {
      case "TERM": {
        const df = index.getDocumentFrequency(node.value);

        return {
          type: "TERM",
          term: node.value,
          estimatedCardinality: df
        };
      }

      case "PHRASE": {
        const frequencies = node.terms.map(
          term => index.getDocumentFrequency(term)
        );

        return {
          type: "PHRASE",
          terms: [...node.terms],
          estimatedCardinality: Math.min(...frequencies)
        };
      }

      case "AND": {
        let left = createPlan(node.left);
        let right = createPlan(node.right);

        // Execute the lower-cardinality operand first.
        if (
          left.estimatedCardinality >
          right.estimatedCardinality
        ) {
          [left, right] = [right, left];
        }

        return {
          type: "AND",
          left,
          right,
          estimatedCardinality: Math.min(
            left.estimatedCardinality,
            right.estimatedCardinality
          )
        };
      }

      case "OR": {
        const left = createPlan(node.left);
        const right = createPlan(node.right);

        return {
          type: "OR",
          left,
          right,
          estimatedCardinality: Math.min(
            documentCount,
            left.estimatedCardinality +
              right.estimatedCardinality
          )
        };
      }

      case "NOT": {
        const operand = createPlan(node.operand);

        return {
          type: "NOT",
          operand,
          estimatedCardinality: Math.max(
            0,
            documentCount - operand.estimatedCardinality
          )
        };
      }

      default:
        throw new Engine2Error(
          ERROR_CODES.INVALID_EXECUTION_PLAN,
          `Unsupported AST node: ${node.type}`
        );
    }
  }

  return createPlan(ast);
}