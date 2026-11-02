import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 5),
  idleTimeoutMillis: Number(
    process.env.DB_IDLE_TIMEOUT_MS ?? 30000
  ),
  connectionTimeoutMillis: Number(
    process.env.DB_CONNECTION_TIMEOUT_MS ?? 5000
  ),
  application_name: "engine-3-persistent-index"
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export async function checkDatabaseConnection() {
  const result = await pool.query(`
    SELECT
      current_database() AS database,
      current_user AS username,
      current_schema() AS schema,
      version() AS postgres_version
  `);

  return result.rows[0];
}

export async function closeDatabaseConnection() {
  await pool.end();
}
