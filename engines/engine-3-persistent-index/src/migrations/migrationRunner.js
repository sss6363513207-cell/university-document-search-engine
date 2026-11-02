
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "../database/pool.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const MIGRATION_FILE_PATTERN = /^\d+_[a-z0-9_-]+\.sql$/;

function calculateChecksum(content) {
  return createHash("sha256").update(content).digest("hex");
}

export async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS engine3;

      CREATE TABLE IF NOT EXISTS engine3.schema_migrations (
        migration_name TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const files = (await readdir(currentDirectory))
      .filter(file => MIGRATION_FILE_PATTERN.test(file))
      .sort();

    const results = [];

    for (const migrationName of files) {
      const migrationPath = path.join(currentDirectory, migrationName);
      const sql = await readFile(migrationPath, "utf8");
      const checksum = calculateChecksum(sql);

      const existing = await client.query(
        `SELECT checksum
         FROM engine3.schema_migrations
         WHERE migration_name = $1`,
        [migrationName]
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(
            `Applied migration was modified: ${migrationName}`
          );
        }

        results.push({ migrationName, status: "SKIPPED" });
        continue;
      }

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          `INSERT INTO engine3.schema_migrations
             (migration_name, checksum)
           VALUES ($1, $2)`,
          [migrationName, checksum]
        );

        await client.query("COMMIT");

        results.push({ migrationName, status: "APPLIED" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    return results;
  } finally {
    client.release();
  }
}
