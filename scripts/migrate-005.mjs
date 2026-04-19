import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(resolve(__dirname, "../drizzle/0005_keen_carmella_unuscione.sql"), "utf8");

const conn = await createConnection(process.env.DATABASE_URL);

const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("✓ Executed:", stmt.slice(0, 60));
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠ Table already exists, skipping");
    } else {
      console.error("✗ Error:", e.message);
    }
  }
}

await conn.end();
console.log("Migration 005 complete");
