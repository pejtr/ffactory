/**
 * Direct generation script for the 3 Rachel continuation videos.
 * Bypasses HTTP/tRPC and calls the DB + falai functions directly.
 * Run: node scripts/generate-continuations.mjs
 */
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load env
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
const FAL_API_KEY = process.env.FAL_API_KEY;
const OWNER_USER_ID = 1; // admin user id from DB

if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
if (!FAL_API_KEY) { console.error("FAL_API_KEY not set"); process.exit(1); }

// ─── Parse DB URL ─────────────────────────────────────────────────────────────
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };
}

// ─── fal.ai helpers ───────────────────────────────────────────────────────────
async function falRequest(method, path, body) {
  const res = await fetch(`https://queue.fal.run${path}`, {
    method,
    headers: {
      "Authorization": `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function seedance20TextToVideo(params) {
  const modelPath = "/fal-ai/bytedance/seedance/v2/non-fast";
  console.log(`  → Submitting to fal.ai Seedance 2.0...`);
  const submitted = await falRequest("POST", modelPath, {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted, jitter, face drift, extra fingers, broken limbs, text artifacts",
    aspect_ratio: params.aspectRatio ?? "9:16",
    duration: params.durationSeconds ?? 10,
    resolution: "720p",
  });
  const requestId = submitted.request_id;
  console.log(`  → Request ID: ${requestId}`);
  
  // Poll for result
  const statusPath = `${modelPath}/requests/${requestId}/status`;
  const resultPath = `${modelPath}/requests/${requestId}`;
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000));
    attempts++;
    try {
      const status = await falRequest("GET", statusPath, null);
      console.log(`  → [${attempts * 5}s] Status: ${status.status}`);
      if (status.status === "COMPLETED") {
        const result = await falRequest("GET", resultPath, null);
        return result?.video?.url ?? null;
      }
      if (status.status === "FAILED") {
        console.error(`  → Generation FAILED:`, status.error);
        return null;
      }
    } catch (e) {
      console.log(`  → Poll error (attempt ${attempts}): ${e.message}`);
    }
  }
  console.error("  → Timeout after 10 minutes");
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const prompts = JSON.parse(readFileSync("/home/ubuntu/video-continuations/prompts.json", "utf8"));

async function generateAll() {
  const db = await createConnection(parseDbUrl(DATABASE_URL));
  console.log("✓ Connected to database");

  const results = [];

  for (const tpl of prompts) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`▶ Starting: ${tpl.title}`);
    console.log(`${"─".repeat(60)}`);

    // 1. Insert project
    const [insertResult] = await db.execute(
      `INSERT INTO video_projects (userId, title, idea, projectType, aspectRatio, seedancePrompt, status, createdAt, updatedAt)
       VALUES (?, ?, ?, 'reference_recreation', ?, ?, 'generating_scenes', NOW(), NOW())`,
      [
        OWNER_USER_ID,
        tpl.title,
        tpl.prompt.master_prompt.substring(0, 500),
        tpl.aspectRatio,
        JSON.stringify(tpl.prompt),
      ]
    );
    const projectId = insertResult.insertId;
    console.log(`  → Project created: ID ${projectId}`);

    // 2. Generate video
    let videoUrl = null;
    let errorMsg = null;
    try {
      videoUrl = await seedance20TextToVideo({
        prompt: buildFullPrompt(tpl.prompt),
        negativePrompt: tpl.prompt.negative_prompt,
        aspectRatio: tpl.prompt.aspect_ratio,
        durationSeconds: tpl.prompt.duration_seconds,
      });
      console.log(`  → Video URL: ${videoUrl}`);
    } catch (err) {
      errorMsg = err.message;
      console.error(`  → Error: ${err.message}`);
    }

    // 3. Update project status
    await db.execute(
      `UPDATE video_projects SET status = ?, finalVideoUrl = ?, errorMessage = ?, updatedAt = NOW() WHERE id = ?`,
      [videoUrl ? "completed" : "failed", videoUrl, errorMsg, projectId]
    );

    results.push({
      id: tpl.id,
      title: tpl.title,
      projectId,
      videoUrl,
      error: errorMsg,
      status: videoUrl ? "completed" : "failed",
    });

    console.log(`  → Status: ${videoUrl ? "✓ COMPLETED" : "✗ FAILED"}`);
  }

  await db.end();

  // Summary
  console.log(`\n${"═".repeat(60)}`);
  console.log("GENERATION SUMMARY");
  console.log(`${"═".repeat(60)}`);
  for (const r of results) {
    console.log(`\n${r.status === "completed" ? "✓" : "✗"} ${r.title}`);
    console.log(`  Project ID: ${r.projectId}`);
    if (r.videoUrl) console.log(`  Video URL: ${r.videoUrl}`);
    if (r.error) console.log(`  Error: ${r.error}`);
  }

  // Save results to file
  import("fs").then(fs => {
    fs.writeFileSync(
      "/home/ubuntu/video-continuations/results.json",
      JSON.stringify(results, null, 2)
    );
    console.log("\n✓ Results saved to /home/ubuntu/video-continuations/results.json");
  });
}

function buildFullPrompt(prompt) {
  let full = prompt.master_prompt;
  if (prompt.shot_script && prompt.shot_script.length > 0) {
    full += "\n\nSHOT BREAKDOWN:\n";
    for (const shot of prompt.shot_script) {
      full += `[${shot.time}] ${shot.shot}: ${shot.action}`;
      if (shot.camera) full += ` Camera: ${shot.camera}.`;
      if (shot.visual_details) full += ` Visual: ${shot.visual_details}.`;
      full += "\n";
    }
  }
  if (prompt.style) {
    const s = prompt.style;
    full += `\nSTYLE: Look: ${s.look || ""}. Lighting: ${s.lighting || ""}. Colors: ${s.color_palette || ""}. Motion: ${s.motion || ""}. Tone: ${s.tone || ""}.`;
  }
  if (prompt.continuity_rules && prompt.continuity_rules.length > 0) {
    full += `\nCONTINUITY: ${prompt.continuity_rules.join(" ")}`;
  }
  return full;
}

generateAll().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
