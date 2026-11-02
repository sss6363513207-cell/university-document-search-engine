
import { pool } from "../../src/database/pool.js";
import { createBuildingVersion } from "../../src/repository/indexVersionRepository.js";

export async function resetTestDatabase() {
  const result = await pool.query(
    "SELECT current_database() AS database"
  );

  if (result.rows[0].database !== "document_search_engine_test") {
    throw new Error(
      "Safety check failed: refusing to reset a non-test database"
    );
  }

  await pool.query(`
    TRUNCATE TABLE
      engine3.snapshots,
      engine3.postings,
      engine3.terms,
      engine3.documents,
      engine3.index_versions
    RESTART IDENTITY CASCADE
  `);

  return createBuildingVersion();
}

export async function closeTestDatabase() {
  await pool.end();
}
