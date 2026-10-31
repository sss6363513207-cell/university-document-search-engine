
const { extractPdfText } = require("../src/extraction/pdfExtractor");

async function runTest() {
  try {
    const result = await extractPdfText(
      "input/pdf/sample.pdf"
    );

    console.log("\n===== PDF EXTRACTION RESULT =====");
    console.log("File:", result.fileName);
    console.log("Pages:", result.pageCount);
    console.log("Characters:", result.characterCount);
    console.log("Words:", result.wordCount);

    console.log("\nExtracted text:\n");
    console.log(result.extractedText);

  } catch (error) {
    console.error("PDF extraction failed:", error.message);
    process.exitCode = 1;
  }
}

runTest();
