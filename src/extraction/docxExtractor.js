
const fs = require("node:fs/promises");
const path = require("node:path");
const mammoth = require("mammoth");

async function extractDocxText(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension !== ".docx") {
    throw new Error("Unsupported file format: expected DOCX");
  }

  const buffer = await fs.readFile(filePath);

  if (buffer.length === 0) {
    throw new Error("DOCX file is empty");
  }

  // DOCX files are ZIP containers and begin with a ZIP signature.
  const signature = buffer.subarray(0, 4).toString("hex");

  const validZipSignatures = [
    "504b0304",
    "504b0506",
    "504b0708"
  ];

  if (!validZipSignatures.includes(signature)) {
    throw new Error("Invalid DOCX file signature");
  }

  const result = await mammoth.extractRawText({
    buffer
  });

  const extractedText = result.value.trim();

  if (!extractedText) {
    throw new Error("No readable text found in DOCX");
  }

  return {
    fileName: path.basename(filePath),
    filePath,
    fileType: ".docx",
    extractedText,
    characterCount: extractedText.length,
    wordCount: extractedText.split(/\s+/).length
  };
}

module.exports = { extractDocxText };
