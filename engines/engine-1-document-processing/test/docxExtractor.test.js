
const {
  extractDocxText
} = require("../src/extraction/docxExtractor");

async function runTest() {
  try {
    const result = await extractDocxText(
      "input/docx/Gate-1 review.docx"
    );

    console.log("\n===== DOCX EXTRACTION RESULT =====");
    console.log("File:", result.fileName);
    console.log("Characters:", result.characterCount);
    console.log("Words:", result.wordCount);

    console.log("\nExtracted text:\n");
    console.log(result.extractedText);

  } catch (error) {
    console.error("DOCX extraction failed:", error.message);
    process.exitCode = 1;
  }
}

runTest();
