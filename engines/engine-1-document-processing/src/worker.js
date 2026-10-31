const fs = require("node:fs/promises");
const path = require("node:path");

const { validateFile } = require("./validation/fileValidator");
const { extractImageText } = require("./extraction/ocr/imageExtractor");
const { extractPdfText } = require("./extraction/pdfExtractor");
const {extractDocxText} = require("./extraction/docxExtractor");
const { extractPptxText } = require("./extraction/pptxExtractor");
const { normalizeText } = require("./extraction/textNormalizer");

const TEXT_EXTENSIONS = [".txt"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const PDF_EXTENSIONS = [".pdf"];
const DOCX_EXTENSIONS = [".docx"];
const PPTX_EXTENSIONS = [".pptx"];

async function processDocument(filePath) {
  // 1. Validate the document before extraction
  const validation = await validateFile(filePath);

  const extension = validation.extension;

  let extractedText;
  let confidence = null;

  // 2. Extract text from TXT documents
  if (TEXT_EXTENSIONS.includes(extension)) {
    extractedText = await fs.readFile(filePath, "utf8");

    if (!extractedText.trim()) {
      throw new Error("Document is empty");
    }
  }

  // 3. Extract text from images using OCR
  else if (IMAGE_EXTENSIONS.includes(extension)) {
    const result = await extractImageText(filePath);

    extractedText = result.extractedText;
    confidence = result.confidence;
  }
 // 4. Extract text from PDFs
    else if (PDF_EXTENSIONS.includes(extension)) {
    const result = await extractPdfText(filePath);

    extractedText = result.extractedText;
    confidence = null;
  }
 // 5. Extract text from DOCX files
    else if (DOCX_EXTENSIONS.includes(extension)) {
    const result = await extractDocxText(filePath);

    extractedText = result.extractedText;
    confidence = null;
  }
 // 6. Extract text from PPTX files
    else if (PPTX_EXTENSIONS.includes(extension)) {
    const result = await extractPptxText(filePath);

    extractedText = result.extractedText;
    confidence = null;
  }
  // 4. Reject unsupported formats
  else {
    throw new Error(`Unsupported file format: ${extension}`);
  }

  const normalizedText = normalizeText(extractedText);

  if (!normalizedText) {
   throw new Error("No readable text found after normalization");
 }

  // 5. Return a common document result
  return {
    fileName: path.basename(filePath),
    filePath,
    extension,
    text: normalizedText,
    characterCount: normalizedText.length,
    wordCount: normalizedText.split(/\s+/).length,
    confidence
  };
}

// IPC communication with parent process
process.on("message", async (message) => {
  if (message.type !== "PROCESS_DOCUMENT") return;

  const { taskId, filePath, attempt } = message;

  try {
    // Testing only: simulate worker crash on first attempt
    const crashFile = process.env.ENGINE1_TEST_CRASH_FILE;

    if (
      crashFile &&
      path.basename(filePath) === crashFile &&
      attempt === 1
    ) {
      console.error("Simulating worker crash:", filePath);
      process.exit(1);
      return;
    }

    const startTime = process.hrtime.bigint();

    const result = await processDocument(filePath);

    const endTime = process.hrtime.bigint();

    const processingTimeMs = Number(
    endTime - startTime
    ) / 1_000_000;

    const structuredResult = {
    documentId: taskId,
    fileName: result.fileName,
    filePath: result.filePath,
    fileType: result.extension,
    text: result.text,
    characterCount: result.characterCount,
    wordCount: result.wordCount,
    processingStatus: "COMPLETED",

    metadata: {
        workerPid: process.pid,
        processingTimeMs: Number(processingTimeMs.toFixed(2)),
        ocrConfidence: result.confidence ?? null
    }
    };

    if (process.send) {
    process.send({
        type: "DOCUMENT_SUCCESS",
        taskId,
        result: structuredResult
    });
    }

  } catch (error) {
    const retryableErrorCodes = [
      "EIO",
      "EAGAIN",
      "EBUSY",
      "EMFILE",
      "ENFILE",
      "ETIMEDOUT",
      "ECONNRESET"
    ];

    const retryable = retryableErrorCodes.includes(error.code);

    if (process.send) {
      process.send({
        type: "DOCUMENT_FAILURE",
        taskId,
        filePath,
        attempt,
        error: error.message,
        errorCode: error.code || "UNKNOWN",
        retryable
      });
    }
  }
});
