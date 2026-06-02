// Run the video pipeline for a specific project ID
// Usage: node scripts/run-pipeline.mjs <projectId>
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const projectId = parseInt(process.argv[2] ?? "90001");
console.log(`[run-pipeline] Starting pipeline for project ${projectId}...`);

// Import compiled server code via ts-node or directly
// We'll use the REST API approach instead — call the tRPC endpoint
const DEV_URL = process.env.DEV_URL ?? "http://localhost:3000";

// First get a session token by calling the internal generate endpoint
const res = await fetch(`${DEV_URL}/api/internal/run-pipeline`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-internal-key": process.env.BUILT_IN_FORGE_API_KEY ?? "" },
  body: JSON.stringify({ projectId }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`[run-pipeline] HTTP ${res.status}: ${text}`);
  process.exit(1);
}

const data = await res.json();
console.log("[run-pipeline] Response:", JSON.stringify(data, null, 2));
