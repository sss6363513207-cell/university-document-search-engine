import test from "node:test";
import assert from "node:assert/strict";

import {
  checkDatabaseConnection,
  closeDatabaseConnection
} from "../src/database/pool.js";

test("connects to the isolated Engine 3 test database", async () => {
  try {
    const result = await checkDatabaseConnection();

    assert.equal(result.database, "document_search_engine_test");
    assert.equal(result.username, "shree");

    console.log("Connected test database:", result.database);
    console.log("Database user:", result.username);
    console.log("PostgreSQL version:", result.postgres_version);
  } finally {
    await closeDatabaseConnection();
  }
});
