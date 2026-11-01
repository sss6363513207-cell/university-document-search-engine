import { Engine2Error } from "../interfaces/errorCodes.js";
import { ERROR_CODES } from "../interfaces/errorCodes.js";

export function tokenizeQuery(query) {
  if (typeof query !== "string" || query.trim().length === 0) {
    throw new Engine2Error(
      ERROR_CODES.INVALID_QUERY,
      "Query must be a non-empty string"
    );
  }

  const tokens = [];
  let position = 0;

  while (position < query.length) {
    const char = query[position];

    // Ignore whitespace
    if (/\s/.test(char)) {
      position++;
      continue;
    }

    // Parentheses
    if (char === "(" || char === ")") {
      tokens.push({
        type: char === "(" ? "LPAREN" : "RPAREN",
        value: char,
        position
      });

      position++;
      continue;
    }

    // Quoted phrases
    if (char === '"') {
      const start = position;
      position++;

      const phraseStart = position;

      while (position < query.length && query[position] !== '"') {
        position++;
      }

      if (position >= query.length) {
        throw new Engine2Error(
          ERROR_CODES.QUERY_SYNTAX_ERROR,
          "Unclosed quoted phrase",
          { position: start }
        );
      }

      const phrase = query.slice(phraseStart, position).trim();

      if (!phrase) {
        throw new Engine2Error(
          ERROR_CODES.QUERY_SYNTAX_ERROR,
          "Empty quoted phrase",
          { position: start }
        );
      }

      tokens.push({
        type: "PHRASE",
        value: phrase,
        position: start
      });

      position++;
      continue;
    }

    // Search terms and Boolean operators
    const start = position;

    while (
      position < query.length &&
      !/\s/.test(query[position]) &&
      query[position] !== "(" &&
      query[position] !== ")" &&
      query[position] !== '"'
    ) {
      position++;
    }

    const value = query.slice(start, position);
    const upperValue = value.toUpperCase();

    if (["AND", "OR", "NOT"].includes(upperValue)) {
      tokens.push({
        type: upperValue,
        value: upperValue,
        position: start
      });
    } else {
      tokens.push({
        type: "TERM",
        value: value.toLowerCase(),
        position: start
      });
    }
  }

  return tokens;
}