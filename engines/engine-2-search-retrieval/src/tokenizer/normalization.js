export const NORMALIZATION_VERSION = "1.1";

export function normalizeText(text) {
  if (typeof text !== "string") {
    throw new TypeError("Input must be a string");
  }

  return text.normalize("NFC").toLowerCase();
}

export function tokenizeText(text) {
  const normalizedText = normalizeText(text);

  const tokenPattern =
    /[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:['’][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/gu;

  const matches = normalizedText.match(tokenPattern) || [];

  return matches.map((term, position) => ({
    term,
    position
  }));
}
