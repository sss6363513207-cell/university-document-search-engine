const fs = require("node:fs/promises");
const path = require("node:path");
const JSZip = require("jszip");
const { XMLParser } = require("fast-xml-parser");

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: true,
  trimValues: false
});

// Extract all text nodes inside a slide paragraph.
function extractParagraphText(node) {
  const parts = [];

  function visit(current) {
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }

    if (!current || typeof current !== "object") return;

    for (const [key, value] of Object.entries(current)) {
      if (key === "#text") {
        parts.push(String(value));
      } else {
        visit(value);
      }
    }
  }

  visit(node);
  return parts.join("");
}

// Find paragraphs in XML while preserving their original order.
function extractSlideParagraphs(xmlObject) {
  const paragraphs = [];

  function visit(current) {
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }

    if (!current || typeof current !== "object") return;

    for (const [key, value] of Object.entries(current)) {
      if (key === "a:p") {
        const items = Array.isArray(value) ? value : [value];

        for (const paragraph of items) {
          const text = extractParagraphText(paragraph).trim();
          if (text) paragraphs.push(text);
        }
      } else {
        visit(value);
      }
    }
  }

  visit(xmlObject);
  return paragraphs;
}

async function extractPptxText(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension !== ".pptx") {
    throw new Error("Unsupported file format: expected PPTX");
  }

  const buffer = await fs.readFile(filePath);

  if (buffer.length === 0) {
    throw new Error("PPTX file is empty");
  }

  const signature = buffer.subarray(0, 4).toString("hex");

  if (!["504b0304", "504b0506", "504b0708"].includes(signature)) {
    throw new Error("Invalid PPTX file signature");
  }

  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .map((name) => {
      const match = name.match(/^ppt\/slides\/slide(\d+)\.xml$/);
      return match ? { name, number: Number(match[1]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);

  if (slideFiles.length === 0) {
    throw new Error("No PowerPoint slides found");
  }

  const extractedSlides = [];

  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile.name).async("string");
    const parsedXml = parser.parse(xml);
    const paragraphs = extractSlideParagraphs(parsedXml);

    extractedSlides.push({
      slideNumber: slideFile.number,
      text: paragraphs.join("\n")
    });
  }

  const extractedText = extractedSlides
    .map((slide) => slide.text)
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (!extractedText) {
    throw new Error("No readable text found in PPTX");
  }

  return {
    fileName: path.basename(filePath),
    filePath,
    fileType: ".pptx",
    slideCount: slideFiles.length,
    extractedText,
    characterCount: extractedText.length,
    wordCount: extractedText.split(/\s+/).length
  };
}

module.exports = { extractPptxText };