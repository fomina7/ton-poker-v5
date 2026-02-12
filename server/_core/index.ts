import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { gameManager } from "../gameManager";

/**
 * Run database migrations using raw SQL via mysql2.
 * This ensures tables exist before the server starts accepting requests.
 */
async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("[Migrate] No DATABASE_URL set, skipping migrations");
    return;
  }

  try {
    const mysql2 = await import("mysql2/promise");
    const fs = await import("fs");
    const path = await import("path");

    console.log("[Migrate] Connecting to database...");
    const connection = await mysql2.createConnection(dbUrl);

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
    const appliedSet = new Set(
      (applied as any[]).map((r: any) => r.migration_name)
    );

    // Find SQL migration files - check multiple possible locations
    let drizzleDir = "";
    const possiblePaths = [
      path.resolve("drizzle"),
      path.resolve(import.meta.dirname, "../../drizzle"),
      path.resolve(import.meta.dirname, "../drizzle"),
      "/app/drizzle",
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        drizzleDir = p;
        break;
      }
    }

    if (!drizzleDir) {
      console.log(
        "[Migrate] No drizzle directory found, skipping file-based migrations"
      );
      await connection.end();
      return;
    }

    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((f: string) => f.endsWith(".sql"))
      .sort();

    console.log(
      `[Migrate] Found ${sqlFiles.length} migration files in ${drizzleDir}`
    );

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
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      for (const stmt of statements) {
        try {
          await connection.execute(stmt);
        } catch (err: any) {
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
            console.error(
              `[Migrate] Statement: ${stmt.substring(0, 200)}...`
            );
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
  } catch (err) {
    console.error("[Migrate] Migration error:", err);
    // Don't crash the server - let it try to start anyway
    // Tables might already exist from a previous run
  }
}

async function startServer() {
  // Run migrations FIRST before anything else
  await runMigrations();

  const app = express();
  const server = createServer(app);

  // Trust proxy for Railway (behind load balancer)
  app.set("trust proxy", 1);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback (stub for Railway - redirects to /login)
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    // Dynamic import to avoid bundling vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // Inline static serving to avoid any vite imports
    const path = await import("path");
    const fs = await import("fs");
    const distPath = path.resolve(import.meta.dirname, "public");
    if (!fs.existsSync(distPath)) {
      console.error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`
      );
    }
    app.use(express.static(distPath));
    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // Railway provides PORT env var
  const port = parseInt(process.env.PORT || "3000");

  // Initialize WebSocket game manager
  gameManager.init(server);
  console.log("[GameManager] WebSocket server initialized");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
