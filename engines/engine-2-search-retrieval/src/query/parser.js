import { tokenizeQuery } from "./lexer.js";
import { Engine2Error, ERROR_CODES } from "../interfaces/errorCodes.js";
import { tokenizeText } from "../tokenizer/normalization.js";

export function parseQuery(query) {
  const tokens = tokenizeQuery(query);
  let current = 0;

  function peek() {
    return tokens[current] ?? null;
  }

  function consume(expectedType) {
    const token = peek();

    if (!token || token.type !== expectedType) {
      throw new Engine2Error(
        ERROR_CODES.QUERY_SYNTAX_ERROR,
        `Expected ${expectedType}`,
        { position: token?.position ?? query.length }
      );
    }

    current++;
    return token;
  }

  function parsePrimary() {
    const token = peek();

    if (!token) {
      throw new Engine2Error(
        ERROR_CODES.QUERY_SYNTAX_ERROR,
        "Unexpected end of query",
        { position: query.length }
      );
    }

    if (token.type === "TERM") {
      current++;
      return {
        type: "TERM",
        value: token.value
      };
    }

    if (token.type === "PHRASE") {
      current++;

      const terms = tokenizeText(token.value)
        .map(item => item.term);

      if (terms.length === 0) {
        throw new Engine2Error(
          ERROR_CODES.QUERY_SYNTAX_ERROR,
          "Phrase contains no searchable terms",
          { position: token.position }
        );
      }

      return {
        type: "PHRASE",
        terms
      };
    }

    if (token.type === "LPAREN") {
      current++;

      const expression = parseOr();

      consume("RPAREN");

      return expression;
    }

    throw new Engine2Error(
      ERROR_CODES.QUERY_SYNTAX_ERROR,
      "Expected a term, phrase or opening parenthesis",
      { position: token.position }
    );
  }

  function parseNot() {
    if (peek()?.type === "NOT") {
      current++;

      return {
        type: "NOT",
        operand: parseNot()
      };
    }

    return parsePrimary();
  }

  function parseAnd() {
    let left = parseNot();

    while (peek()?.type === "AND") {
      current++;

      const right = parseNot();

      left = {
        type: "AND",
        left,
        right
      };
    }

    return left;
  }

  function parseOr() {
    let left = parseAnd();

    while (peek()?.type === "OR") {
      current++;

      const right = parseAnd();

      left = {
        type: "OR",
        left,
        right
      };
    }

    return left;
  }

  const ast = parseOr();

  if (current < tokens.length) {
    const token = peek();

    throw new Engine2Error(
      ERROR_CODES.QUERY_SYNTAX_ERROR,
      "Unexpected token in query",
      { position: token.position }
    );
  }

  return ast;
}