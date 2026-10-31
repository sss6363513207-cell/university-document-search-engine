
const { validateFile } = require("../src/validation/fileValidator");

async function runTests() {
  const files = [
    "input/os.txt",
    "input/dbms.txt",
    "input/images/sample-notes.png"
  ];

  for (const file of files) {
    try {
      const result = await validateFile(file);
      console.log("VALID:", result);
    } catch (error) {
      console.log("INVALID:", file, "-", error.message);
    }
  }
}

runTests();
