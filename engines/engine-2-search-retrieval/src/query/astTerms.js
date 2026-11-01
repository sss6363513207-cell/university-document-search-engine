export function collectAstTerms(ast) {
  if (!ast || typeof ast !== "object") {
    throw new TypeError("Invalid query AST");
  }

  switch (ast.type) {
    case "TERM":
      return [ast.value];

    case "PHRASE":
      return [...ast.terms];

    case "AND":
    case "OR":
      return [
        ...collectAstTerms(ast.left),
        ...collectAstTerms(ast.right)
      ];

    case "NOT":
      return collectAstTerms(ast.operand);

    default:
      throw new TypeError(`Unsupported AST node: ${ast.type}`);
  }
}