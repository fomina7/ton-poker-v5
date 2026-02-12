/**
 * Standalone migration script for Railway.
 * Reads SQL files from /app/drizzle/ and executes them against DATABASE_URL.
 * Uses mysql2 directly - no TypeScript, no drizzle-kit needed.
 */
import fs from "fs";
import path from "path";
import { createConnection } from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set, skipping migrations");
  process.exit(0);
}

async function runMigrations() {
  console.log("[Migrate] Connecting to database...");
  const connection = await createConnection(DATABASE_URL);

  // Create migrations tracking table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(256) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get already applied migrations
  const [applied] = await connection.execute(
    "SELECT migration_name FROM __drizzle_migrations"
  );
  const appliedSet = new Set(applied.map((r) => r.migration_name));

  // Find SQL migration files
  const drizzleDir = path.resolve("drizzle");
  const sqlFiles = fs
    .readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`[Migrate] Found ${sqlFiles.length} migration files`);

  for (const file of sqlFiles) {
    if (appliedSet.has(file)) {
      console.log(`[Migrate] Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`[Migrate] Applying ${file}...`);
    const sql = fs.readFileSync(path.join(drizzleDir, file), "utf-8");

    // Split by statement breakpoint marker
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await connection.execute(stmt);
      } catch (err) {
        // Ignore "already exists" / "duplicate column" errors
        if (
          err.code === "ER_TABLE_EXISTS_ERROR" ||
          err.code === "ER_DUP_FIELDNAME" ||
          err.code === "ER_DUP_KEYNAME" ||
          err.errno === 1060 ||
          err.errno === 1061 ||
          err.errno === 1050
        ) {
          console.log(`[Migrate]   (skipped: ${err.message})`);
        } else {
          console.error(`[Migrate] Error in ${file}: ${err.message}`);
          console.error(`[Migrate] Statement: ${stmt.substring(0, 200)}...`);
          throw err;
        }
      }
    }

    // Record migration as applied
    await connection.execute(
      "INSERT INTO __drizzle_migrations (migration_name) VALUES (?)",
      [file]
    );
    console.log(`[Migrate] Applied ${file}`);
  }

  await connection.end();
  console.log("[Migrate] All migrations complete");
}

runMigrations().catch((err) => {
  console.error("[Migrate] Fatal error:", err);
  process.exit(1);
});
