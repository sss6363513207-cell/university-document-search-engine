const { extractPptxText } = require("../src/extraction/pptxExtractor");

async function runTest() {
  try {
    const result = await extractPptxText("input/pptx/sample.pptx");

    console.log("\n===== PPTX EXTRACTION RESULT =====");
    console.log("File:", result.fileName);
    console.log("Slides:", result.slideCount);
    console.log("Characters:", result.characterCount);
    console.log("Words:", result.wordCount);

    console.log("\nExtracted text:\n");
    console.log(result.extractedText);
  } catch (error) {
    console.error("PPTX extraction failed:", error.message);
    process.exitCode = 1;
  }
}

runTest();