
const fs = require("node:fs/promises");
const path = require("node:path");
const pdfParse = require("pdf-parse");

async function extractPdfText(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension !== ".pdf") {
    throw new Error("Unsupported file format: expected PDF");
  }

  // Read PDF as binary data
  const buffer = await fs.readFile(filePath);

  if (buffer.length === 0) {
    throw new Error("PDF file is empty");
  }

  // Basic PDF signature check
  const header = buffer.subarray(0, 5).toString("ascii");

  if (header !== "%PDF-") {
    throw new Error("Invalid PDF file signature");
  }

  // Extract embedded text
  const result = await pdfParse(buffer);

  const extractedText = result.text.trim();

  if (!extractedText) {
    throw new Error(
      "No embedded text found. This may be a scanned PDF requiring OCR."
    );
  }

  return {
    fileName: path.basename(filePath),
    filePath,
    fileType: ".pdf",
    extractedText,
    pageCount: result.numpages,
    characterCount: extractedText.length,
    wordCount: extractedText.split(/\s+/).length
  };
}

module.exports = { extractPdfText };
