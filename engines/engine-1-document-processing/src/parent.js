const { fork } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs/promises");
const { prepareDocumentForEngine2 } = require("./integration/engine2Adapter");

// Configuration
const WORKER_COUNT = 3;
const MAX_RETRIES = 2;
const DOCUMENT_TIMEOUT_MS = 120000;

const workerPath = path.join(__dirname, "worker.js");
const inputDirectory = path.join(__dirname, "../input");
const engine3Directory = path.resolve(
  __dirname,
  "../../engine-3-persistent-index"
);

// Engine 3 integration
let engine3 = null;
let indexVersion = null;
let indexedDocuments = 0;
let finalizing = false;

// Document tracking
let documents = [];
let nextDocumentIndex = 0;
let completedDocuments = 0;
let successfulDocuments = 0;
let failedDocuments = 0;
let stopped = false;

const workers = new Map();
const retryTasks = [];

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

  // Handle worker messages
  child.on("message", async (message) => {
    if (worker.handledExit) return;

    const task = worker.currentTask;

    if (!task || message.taskId !== task.taskId) {
      console.error(`Unexpected message from Worker ${workerId}`);
      return;
    }

    if (
      message.type !== "DOCUMENT_SUCCESS" &&
      message.type !== "DOCUMENT_FAILURE"
    ) {
      console.error(`Unknown message from Worker ${workerId}`);
      return;
    }

    clearWorkerTimeout(worker);

    if (message.type === "DOCUMENT_SUCCESS") {
      const result = message.result;

      try {
        // Validate and prepare Engine 1 output
        const engine2Payload = prepareDocumentForEngine2(result);

        // Persist document and build postings in Engine 3
        const insertedDocument = await engine3.insertDocument(
          indexVersion.id,
          engine2Payload
        );

        indexedDocuments++;
        successfulDocuments++;
        completedDocuments++;

        console.log(
          `\nWorker ${workerId} successfully processed and indexed ${result.fileName}`
        );

        console.log("Source Document ID:", result.documentId);
        console.log("Persistent Document ID:", insertedDocument.document_id);
        console.log("File Type:", result.fileType);
        console.log("Words:", result.wordCount);
        console.log("Characters:", result.characterCount);
        console.log("Worker PID:", result.metadata.workerPid);
        console.log("Processing Time:", result.metadata.processingTimeMs, "ms");
        console.log("Tokens Indexed:", insertedDocument.tokenCount);
        console.log("Unique Terms:", insertedDocument.uniqueTermCount);
        console.log("PostgreSQL Persistence: COMPLETED");

      } catch (error) {
        console.error(
          `Document indexing failed for ${result.fileName}:`,
          error.message
        );

        failedDocuments++;
        completedDocuments++;
      }

    } else {
      console.error(`Worker ${workerId} failed: ${message.error}`);

      console.log("Error Code:", message.errorCode);
      console.log("Retryable:", message.retryable);
      console.log("Attempt:", task.attempt);

      if (
        message.retryable === true &&
        task.attempt <= MAX_RETRIES
      ) {
        console.log(`Retrying document. Next attempt: ${task.attempt + 1}`);

        retryTasks.push({
          ...task,
          attempt: task.attempt + 1
        });

      } else {
        console.error("Document marked as permanently failed.");

        failedDocuments++;
        completedDocuments++;
      }
    }

    // Release worker only after persistence has finished
    worker.busy = false;
    worker.currentTask = null;

    dispatchNext(worker);
    void checkCompletion();
  });

  // Handle worker errors
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

    createWorker(workerId);
    void checkCompletion();
  });

  dispatchNext(worker);
}

// Get next document
function getNextTask() {
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

// Assign document directly to an available worker
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
    void checkCompletion();
    return;
  }

  worker.busy = true;
  worker.currentTask = task;

  console.log(
    `Assigning ${path.basename(task.filePath)} to Worker ${worker.id}`
  );

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

    worker.process.kill();

  }, DOCUMENT_TIMEOUT_MS);

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

// Publish the persistent index after all documents finish
async function checkCompletion() {
  if (stopped || finalizing) return;

  const allAssigned = nextDocumentIndex >= documents.length;
  const noRetries = retryTasks.length === 0;

  const allIdle = [...workers.values()].every(
    worker => !worker.busy
  );

  if (
    allAssigned &&
    noRetries &&
    allIdle &&
    completedDocuments === documents.length
  ) {
    finalizing = true;

    try {
      if (indexedDocuments === documents.length) {
        const publishedVersion = await engine3.publishVersion(
          indexVersion.id
        );

        console.log("\nPostgreSQL index version published.");
        console.log("Index Version ID:", publishedVersion.id);
        console.log("Version Number:", publishedVersion.version_number);
        console.log("Index Status:", publishedVersion.status);

      } else {
        await engine3.failVersion(indexVersion.id);

        console.error(
          "Not all documents were indexed. Index version marked FAILED."
        );

        process.exitCode = 1;
      }

    } catch (error) {
      console.error("Index publication failed:", error.message);

      try {
        await engine3.failVersion(indexVersion.id);
      } catch (failureError) {
        console.error(
          "Could not mark index version as FAILED:",
          failureError.message
        );
      }

      process.exitCode = 1;

    } finally {
      stopped = true;

      console.log("\n===== ENGINE 1 SUMMARY =====");
      console.log("Total documents:", documents.length);
      console.log("Successfully indexed:", indexedDocuments);
      console.log("Failed:", failedDocuments);
      console.log("============================\n");

      for (const worker of workers.values()) {
        clearWorkerTimeout(worker);

        if (worker.process.connected) {
          worker.process.disconnect();
        }
      }

      try {
        await engine3.closeDatabaseConnection();
      } catch (error) {
        console.error("Database connection cleanup failed:", error.message);
        process.exitCode = 1;
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
    if (entry.name.startsWith(".")) continue;

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

// Main execution
async function main() {
  // Load Engine 3 database configuration
  process.loadEnvFile(
    path.join(engine3Directory, ".env")
  );

  // Import Engine 3 repositories
  const [
    versionRepository,
    documentRepository,
    database
  ] = await Promise.all([
    import("../../engine-3-persistent-index/src/repository/indexVersionRepository.js"),
    import("../../engine-3-persistent-index/src/repository/documentRepository.js"),
    import("../../engine-3-persistent-index/src/database/pool.js")
  ]);

  engine3 = {
    createBuildingVersion: versionRepository.createBuildingVersion,
    publishVersion: versionRepository.publishVersion,
    failVersion: versionRepository.failVersion,
    insertDocument: documentRepository.insertDocument,
    closeDatabaseConnection: database.closeDatabaseConnection
  };

  // Ensure input directory exists
  await fs.mkdir(inputDirectory, {
    recursive: true
  });

  // Discover documents
  documents = await getAllFiles(inputDirectory);

  if (documents.length === 0) {
    console.log("No documents found in input directory.");
    await engine3.closeDatabaseConnection();
    return;
  }

  // Create persistent index version before processing
  indexVersion = await engine3.createBuildingVersion();

  console.log("\n===== ENGINE 1 STARTED =====");
  console.log("Documents found:", documents.length);
  console.log("Worker limit:", WORKER_COUNT);
  console.log("Maximum retries:", MAX_RETRIES);
  console.log("Index Version ID:", indexVersion.id);
  console.log("Normalization Version:", indexVersion.normalization_version);
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
main().catch(async (error) => {
  console.error("Engine 1 failed:", error);
  process.exitCode = 1;

  if (engine3?.closeDatabaseConnection) {
    try {
      await engine3.closeDatabaseConnection();
    } catch (closeError) {
      console.error("Database cleanup failed:", closeError.message);
    }
  }
});