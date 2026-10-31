
const { extractImageText } = require("../src/extraction/ocr/imageExtractor");

async function runTest() {
  try {
    const result = await extractImageText(
      "input/images/sample-notes.png"
    );

    console.log("\n===== OCR TEST RESULT =====");
    console.log("File:", result.fileName);
    console.log("Extracted text:\n", result.extractedText);
    console.log("Confidence:", result.confidence);
  } catch (error) {
    console.error("OCR test failed:", error.message);
    process.exitCode = 1;
  }
}

runTest();
