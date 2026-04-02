import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = readFileSync(resolve(__dirname, "../drizzle/0003_lying_shotgun.sql"), "utf-8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

const conn = await createConnection(DATABASE_URL);
console.log(`Running ${statements.length} statements...`);

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  try {
    await conn.execute(stmt);
    console.log(`[${i + 1}/${statements.length}] OK`);
  } catch (err) {
    if (err.code === "ER_TABLE_EXISTS_ERROR" || err.message?.includes("already exists")) {
      console.log(`[${i + 1}/${statements.length}] SKIP (already exists)`);
    } else {
      console.error(`[${i + 1}/${statements.length}] ERROR:`, err.message);
    }
  }
}

await conn.end();
console.log("Migration complete.");
