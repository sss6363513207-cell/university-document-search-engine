
const fs = require("node:fs/promises");
const path = require("node:path");

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

const SUPPORTED_SIGNATURES = {
  ".txt": null,
  ".jpg": ["FFD8FF"],
  ".jpeg": ["FFD8FF"],
  ".png": ["89504E47"],
  ".pdf": ["25504446"],
  ".docx": ["504B0304", "504B0506", "504B0708"],
  ".pptx": ["504B0304", "504B0506", "504B0708"]
};

async function validateFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (!Object.hasOwn(SUPPORTED_SIGNATURES, extension)) {
    throw new Error(`Unsupported file format: ${extension || "unknown"}`);
  }

  const stats = await fs.stat(filePath);

  if (!stats.isFile()) {
    throw new Error("Input is not a regular file");
  }

  if (stats.size === 0) {
    throw new Error("File is empty");
  }

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds maximum allowed size of 30 MB");
  }

  // Validate image signatures
  const signatures = SUPPORTED_SIGNATURES[extension];

  if (signatures) {
    const fileHandle = await fs.open(filePath, "r");

    try {
      const buffer = Buffer.alloc(4);
      const { bytesRead } = await fileHandle.read(buffer, 0, 4, 0);
      const actualSignature = buffer.subarray(0, bytesRead).toString("hex").toUpperCase();

      const valid = signatures.some(signature =>
        actualSignature.startsWith(signature)
      );

      if (!valid) {
        throw new Error("File content does not match its extension");
      }
    } finally {
      await fileHandle.close();
    }
  }

  return {
    valid: true,
    fileName: path.basename(filePath),
    extension,
    size: stats.size
  };
}

module.exports = { validateFile };
