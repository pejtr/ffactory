import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = path.join(__dirname, "../drizzle/0006_lyrical_zaladane.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log("Connected to DB");

const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
for (const stmt of statements) {
  console.log("Executing:", stmt.slice(0, 60) + "...");
  await conn.execute(stmt);
  console.log("OK");
}

await conn.end();
console.log("Migration 006 complete — user_streaks + user_achievements created");
