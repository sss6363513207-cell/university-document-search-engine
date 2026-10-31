const { normalizeText } = require("../src/extraction/textNormalizer");

const sampleText = `
    Operating Systems


    Process Management
    \t CPU Scheduling


    Memory Management
`;

const result = normalizeText(sampleText);

console.log("\n===== TEXT NORMALIZATION TEST =====");
console.log("Original characters:", sampleText.length);
console.log("Normalized characters:", result.length);
console.log("\nNormalized text:\n");
console.log(result);

if (result.includes("\r")) {
  throw new Error("Line endings were not normalized");
}

if (result.includes("\t")) {
  throw new Error("Tabs were not normalized");
}

if (result.includes("\n\n\n")) {
  throw new Error("Excessive blank lines remain");
}

console.log("\nTEST PASSED");