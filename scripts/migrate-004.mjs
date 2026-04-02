import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '../drizzle/0004_mature_nextwave.sql');
const sql = readFileSync(sqlPath, 'utf8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

const conn = await createConnection(process.env.DATABASE_URL);
for (const stmt of statements) {
  console.log('Running:', stmt.substring(0, 80) + '...');
  await conn.execute(stmt);
  console.log('OK');
}
await conn.end();
console.log('Migration 0004 complete');
