function normalizeText(text) {
  if (typeof text !== "string") {
    throw new TypeError("Input must be a string");
  }

  let normalized = text;

  // 1. Unicode normalization
  normalized = normalized.normalize("NFC");

  // 2. Normalize line endings
  normalized = normalized.replace(/\r\n?/g, "\n");

  // 3. Remove unwanted control characters
  // Preserve newline and tab characters
  normalized = normalized.replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
    ""
  );

  // 4. Replace multiple spaces and tabs with one space
  normalized = normalized.replace(/[^\S\n]+/g, " ");

  // 5. Remove spaces at the beginning and end of each line
  normalized = normalized
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // 6. Limit excessive blank lines
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // 7. Remove leading and trailing whitespace
  return normalized.trim();
}

module.exports = { normalizeText };