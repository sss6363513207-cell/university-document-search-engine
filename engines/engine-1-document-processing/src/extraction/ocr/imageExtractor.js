
const Tesseract = require("tesseract.js");
const path = require("node:path");

const SUPPORTED_IMAGE_FORMATS = [
  ".jpg",
  ".jpeg",
  ".png"
];

async function extractImageText(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_IMAGE_FORMATS.includes(extension)) {
    throw new Error("Unsupported image format");
  }

  const result = await Tesseract.recognize(
    filePath,
    "eng",
    {
      logger: (info) => {
        if (info.status === "recognizing text") {
          console.log(
            `OCR progress: ${Math.round(info.progress * 100)}%`
          );
        }
      }
    }
  );

  const extractedText = result.data.text.trim();

  if (!extractedText) {
    throw new Error("No readable text found in image");
  }

  return {
    fileName: path.basename(filePath),
    filePath,
    fileType: extension,
    extractedText,
    confidence: result.data.confidence
  };
}

module.exports = { extractImageText };
