// Migration script for 0003_cheerful_hemingway.sql
// Run with: node scripts/migrate-003.mjs
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "../drizzle/0003_cheerful_hemingway.sql");
const sql = readFileSync(sqlPath, "utf8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(dbUrl);
console.log("Connected to database. Applying migration...\n");

for (const stmt of statements) {
  console.log("Executing:", stmt.substring(0, 80) + "...");
  try {
    await conn.execute(stmt);
    console.log("  ✓ OK");
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR" || e.code === "ER_DUP_FIELDNAME") {
      console.log("  ⚠ Already exists, skipping");
    } else {
      console.error("  ✗ Error:", e.message);
      process.exit(1);
    }
  }
}

await conn.end();
console.log("\nMigration 0003 complete!");
