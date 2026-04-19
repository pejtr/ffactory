import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const connection = await createConnection(process.env.DATABASE_URL);
  console.log("[migrate-007] Connected to database");

  const sqlFile = join(__dirname, "../drizzle/0007_messy_sleeper.sql");
  const sql = readFileSync(sqlFile, "utf-8");
  const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);

  for (const statement of statements) {
    try {
      await connection.execute(statement);
      console.log("[migrate-007] OK:", statement.slice(0, 60).replace(/\n/g, " ") + "...");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR" || err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME") {
        console.log("[migrate-007] SKIP (already exists):", statement.slice(0, 60).replace(/\n/g, " ") + "...");
      } else {
        console.error("[migrate-007] ERROR:", err.message);
        console.error("Statement:", statement);
        throw err;
      }
    }
  }

  await connection.end();
  console.log("[migrate-007] Done: referrals table + users.referralCode column added.");
}

migrate().catch((err) => {
  console.error("[migrate-007] Migration failed:", err);
  process.exit(1);
});
