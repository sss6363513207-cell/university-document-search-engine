
const { fork } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs/promises");
const { prepareDocumentForEngine2 } = require("./integration/engine2Adapter");

// Configuration
const WORKER_COUNT = 3;
const MAX_RETRIES = 2;
const DOCUMENT_TIMEOUT_MS = 120000; // 120 seconds

const workerPath = path.join(__dirname, "worker.js");
const inputDirectory = path.join(__dirname, "../input");

// Document tracking
let documents = [];
let nextDocumentIndex = 0;
let completedDocuments = 0;
let successfulDocuments = 0;
let failedDocuments = 0;
let stopped = false;

const workers = new Map();
const retryTasks = [];
const engine2ReadyDocuments = [];

// Clear worker timeout
function clearWorkerTimeout(worker) {
  if (worker.timeoutHandle) {
    clearTimeout(worker.timeoutHandle);
    worker.timeoutHandle = null;
  }
}

// Create a child worker process
function createWorker(workerId) {
  if (stopped) return;

  const child = fork(workerPath, {
    env: process.env
  });

  const worker = {
    id: workerId,
    process: child,
    busy: false,
    currentTask: null,
    handledExit: false,
    timeoutHandle: null
  };

  workers.set(workerId, worker);

  console.log(`Worker ${workerId} started. PID: ${child.pid}`);

  // Handle messages received through IPC
  child.on("message", (message) => {
    if (worker.handledExit) return;

    const task = worker.currentTask;

    if (!task || message.taskId !== task.taskId) {
      console.error(`Unexpected message from Worker ${workerId}`);
      return;
    }

    // Accept only known response types
    if (
      message.type !== "DOCUMENT_SUCCESS" &&
      message.type !== "DOCUMENT_FAILURE"
    ) {
      console.error(`Unknown message from Worker ${workerId}`);
      return;
    }

    // Clear timeout when a valid response arrives
    clearWorkerTimeout(worker);

    // Successful document processing
    if (message.type === "DOCUMENT_SUCCESS") {
      const result = message.result;

      try {
        const engine2Payload = prepareDocumentForEngine2(result);
        engine2ReadyDocuments.push(engine2Payload);

        console.log("Prepared for Engine 2:", engine2Payload.schemaVersion);

        console.log(
          `\nWorker ${workerId} successfully processed ${result.fileName}`
        );

        console.log("Document ID:", result.documentId);
        console.log("File Type:", result.fileType);
        console.log("Words:", result.wordCount);
        console.log("Characters:", result.characterCount);
        console.log("Worker PID:", result.metadata.workerPid);

        console.log(
          "Processing Time:",
          result.metadata.processingTimeMs,
          "ms"
        );

        console.log("Status:", result.processingStatus);

        if (result.metadata.ocrConfidence !== null) {
          console.log(
            "OCR Confidence:",
            `${result.metadata.ocrConfidence}%`
          );
        }

        successfulDocuments++;
        completedDocuments++;

      } catch (error) {
        console.error("Invalid success response:", error.message);

        failedDocuments++;
        completedDocuments++;
      }

    } else if (message.type === "DOCUMENT_FAILURE") {

      // Document processing failure
      console.error(
        `Worker ${workerId} failed: ${message.error}`
      );

      console.log("Error Code:", message.errorCode);
      console.log("Retryable:", message.retryable);
      console.log("Attempt:", task.attempt);

      if (
        message.retryable === true &&
        task.attempt <= MAX_RETRIES
      ) {
        console.log(
          `Retrying document. Next attempt: ${task.attempt + 1}`
        );

        retryTasks.push({
          ...task,
          attempt: task.attempt + 1
        });

      } else {
        console.error(
          "Document marked as permanently failed."
        );

        failedDocuments++;
        completedDocuments++;
      }
    }

    // Release worker
    worker.busy = false;
    worker.currentTask = null;

    dispatchNext(worker);
    checkCompletion();
  });

  // Handle worker process errors
  child.on("error", (error) => {
    console.error(
      `Worker ${workerId} process error:`,
      error.message
    );
  });

  // Handle worker termination
  child.on("exit", (code, signal) => {
    if (worker.handledExit) return;

    worker.handledExit = true;

    // Clear any active timeout
    clearWorkerTimeout(worker);

    workers.delete(workerId);

    console.log(
      `Worker ${workerId} exited. Code: ${code}, Signal: ${signal}`
    );

    if (stopped) return;

    // Recover interrupted document
    if (worker.currentTask) {
      const task = worker.currentTask;

      console.error(
        `Document interrupted: ${path.basename(task.filePath)}`
      );

      worker.currentTask = null;
      worker.busy = false;

      if (task.attempt <= MAX_RETRIES) {
        console.log(
          `Retrying document. Attempt ${task.attempt + 1}`
        );

        retryTasks.push({
          ...task,
          attempt: task.attempt + 1
        });

      } else {
        console.error("Maximum retry attempts reached.");

        failedDocuments++;
        completedDocuments++;
      }
    }

    // Replace terminated worker
    createWorker(workerId);

    checkCompletion();
  });

  dispatchNext(worker);
}

// Get next document to process
function getNextTask() {

  // Retry interrupted documents first
  if (retryTasks.length > 0) {
    return retryTasks.shift();
  }

  if (nextDocumentIndex < documents.length) {
    const filePath = documents[nextDocumentIndex];
    const taskId = nextDocumentIndex + 1;

    nextDocumentIndex++;

    return {
      taskId,
      filePath,
      attempt: 1
    };
  }

  return null;
}

// Assign a document to an available worker
function dispatchNext(worker) {
  if (
    stopped ||
    worker.busy ||
    !worker.process.connected ||
    worker.process.killed
  ) {
    return;
  }

  const task = getNextTask();

  if (!task) {
    checkCompletion();
    return;
  }

  worker.busy = true;
  worker.currentTask = task;

  console.log(
    `Assigning ${path.basename(task.filePath)} to Worker ${worker.id}`
  );

  // Start document processing timeout
  worker.timeoutHandle = setTimeout(() => {

    if (
      !worker.busy ||
      !worker.currentTask ||
      worker.currentTask.taskId !== task.taskId
    ) {
      return;
    }

    console.error(
      `Worker ${worker.id} timed out while processing:`,
      path.basename(task.filePath)
    );

    console.error(
      `Timeout limit: ${DOCUMENT_TIMEOUT_MS / 1000} seconds`
    );

    // Kill unresponsive worker.
    // Exit handler will recover the interrupted task.
    worker.process.kill();

  }, DOCUMENT_TIMEOUT_MS);

  // Send task to worker
  worker.process.send(
    {
      type: "PROCESS_DOCUMENT",
      ...task
    },
    (error) => {
      if (error) {
        console.error(
          `IPC send failed for Worker ${worker.id}:`,
          error.message
        );

        worker.process.kill();
      }
    }
  );
}

// Check whether all documents have finished processing
function checkCompletion() {
  if (stopped) return;

  const allAssigned =
    nextDocumentIndex >= documents.length;

  const noRetries =
    retryTasks.length === 0;

  const allIdle =
    [...workers.values()].every(
      worker => !worker.busy
    );

  if (
    allAssigned &&
    noRetries &&
    allIdle &&
    completedDocuments === documents.length
  ) {
    stopped = true;

    console.log("\n===== ENGINE 1 SUMMARY =====");
    console.log("Total documents:", documents.length);
    console.log("Successful:", successfulDocuments);
    console.log("Failed:", failedDocuments);
    console.log("Prepared for Engine 2:", engine2ReadyDocuments.length);
    console.log("============================\n");

    // Gracefully disconnect workers
    for (const worker of workers.values()) {
      clearWorkerTimeout(worker);

      if (worker.process.connected) {
        worker.process.disconnect();
      }
    }
  }
}

// Recursively discover files
async function getAllFiles(directory) {
  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {

    // Ignore hidden files and folders
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await getAllFiles(fullPath);
      files.push(...nestedFiles);

    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution function
async function main() {

  // Ensure input directory exists
  await fs.mkdir(inputDirectory, {
    recursive: true
  });

  // Discover documents
  documents = await getAllFiles(inputDirectory);

  if (documents.length === 0) {
    console.log("No documents found in input directory.");
    return;
  }

  console.log("\n===== ENGINE 1 STARTED =====");
  console.log("Documents found:", documents.length);
  console.log("Worker limit:", WORKER_COUNT);
  console.log("Maximum retries:", MAX_RETRIES);
  console.log(
    "Document timeout:",
    DOCUMENT_TIMEOUT_MS / 1000,
    "seconds"
  );
  console.log("============================\n");

  // Start worker processes
  for (let i = 1; i <= WORKER_COUNT; i++) {
    createWorker(i);
  }
}

// Start Engine 1
main().catch(error => {
  console.error("Engine 1 failed:", error);
  process.exitCode = 1;
});
