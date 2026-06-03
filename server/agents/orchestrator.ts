// ─── MAGS — AgentOrchestrator ─────────────────────────────────────────────────
// Coordinates all agents, computes overall health score, pushes events to LeadOS.
// Triggered by: Heartbeat cron (every 6h) | LeadOS webhook | Manual

import { getDb } from "../db";
import { orchestratorRuns, leadosConfig } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { collectSharedMetrics } from "./sharedMetrics";
import { decisionLog } from "./decisionLog";
import { notifyOwner } from "../_core/notification";
import { videoAgent } from "./videoAgent";
import { channelAgent } from "./channelAgent";
import { contentCalendarAgent } from "./contentCalendarAgent";
import { thumbnailABAgent } from "./thumbnailABAgent";
import { blueprintAgent } from "./blueprintAgent";
import type { AgentRunResult, OrchestratorRunResult } from "./types";

// Weighted health score formula (from MAGS blueprint)
const AGENT_WEIGHTS = {
  VideoAgent: 0.30,
  ChannelAgent: 0.25,
  ContentCalendarAgent: 0.20,
  ThumbnailABAgent: 0.15,
  BlueprintAgent: 0.10,
} as const;

export async function runOrchestrator(
  triggeredBy: "cron" | "manual" | "leadOS" | "event" = "manual"
): Promise<OrchestratorRunResult> {
  const startedAt = new Date();
  const runId = `orch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  console.log(`[Orchestrator] Starting cycle ${runId} (triggered by: ${triggeredBy})`);

  // 1. Collect shared metrics ONCE — all agents use this snapshot
  const metrics = await collectSharedMetrics();

  // 2. Run agents in parallel groups
  // Group A: independent agents (run in parallel)
  const [videoResult, channelResult, contentResult, blueprintResult] =
    await Promise.all([
      videoAgent.run(metrics),
      channelAgent.run(metrics),
      contentCalendarAgent.run(metrics),
      blueprintAgent.run(metrics),
    ]);

  // Group B: depends on channel data (run after Group A)
  const thumbnailResult = await thumbnailABAgent.run(metrics);

  const agentResults: AgentRunResult[] = [
    videoResult,
    channelResult,
    contentResult,
    thumbnailResult,
    blueprintResult,
  ];

  // 3. Compute weighted overall health score
  const scoreMap: Record<string, number> = {};
  for (const r of agentResults) {
    scoreMap[r.agentName] = r.score;
  }
  const overallScore = Math.round(
    Object.entries(AGENT_WEIGHTS).reduce((sum, [name, weight]) => {
      return sum + (scoreMap[name] ?? 50) * weight;
    }, 0)
  );

  // 4. Aggregate decisions
  const allDecisions = agentResults.flatMap((r) => r.decisions);
  const totalDecisions = allDecisions.length;
  const appliedDecisions = allDecisions.filter((d) => d.status === "applied").length;
  const pendingDecisions = allDecisions.filter((d) => d.status === "pending").length;

  // 5. Build alerts (high-confidence, applied alerts)
  const alerts = agentResults
    .flatMap((r) =>
      r.decisions
        .filter((d) => d.decisionType === "alert" && d.confidence >= 85)
        .map((d) => ({
          agent: r.agentName,
          message: d.title,
          severity: (d.confidence >= 95 ? "high" : "medium") as "high" | "medium" | "low",
        }))
    );

  // 6. Build summary
  const summary = buildSummary(overallScore, agentResults, alerts.length);

  // 7. Save orchestrator run to DB
  const finishedAt = new Date();
  const db = await getDb();
  if (db) {
    await db.insert(orchestratorRuns).values({
      runId,
      triggeredBy,
      overallScore,
      totalDecisions,
      appliedDecisions,
      pendingDecisions,
      summary,
      agentResults: agentResults.map((r) => ({
        agentName: r.agentName,
        score: r.score,
        decisionsCount: r.decisionsCount,
        appliedCount: r.appliedCount,
        status: r.status,
        summary: r.summary,
      })),
      alerts,
      startedAt,
      finishedAt,
    });
  }

  // 8. Notify owner if score < 50 or alerts exist
  if (overallScore < 50 || alerts.length > 0) {
    const alertText = alerts.map((a) => `• [${a.agent}] ${a.message}`).join("\n");
    await notifyOwner({
      title: `MAGS Alert — Health Score: ${overallScore}/100`,
      content: `${summary}\n\n${alertText ? `Alerts:\n${alertText}` : ""}`,
    }).catch(() => {}); // non-blocking
  }

  // 9. Push event to LeadOS (if configured)
  const result: OrchestratorRunResult = {
    runId,
    triggeredBy,
    overallScore,
    totalDecisions,
    appliedDecisions,
    pendingDecisions,
    summary,
    agentResults,
    alerts,
    startedAt,
    finishedAt,
  };
  await pushToLeadOS(result).catch((err) =>
    console.warn("[Orchestrator] LeadOS push failed:", err.message)
  );

  console.log(`[Orchestrator] Cycle complete. Score: ${overallScore}/100, Decisions: ${totalDecisions}`);
  return result;
}

async function pushToLeadOS(result: OrchestratorRunResult): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Find any user's LeadOS config (owner config)
  const configs = await db
    .select()
    .from(leadosConfig)
    .where(eq(leadosConfig.enabled, true))
    .limit(1);

  if (configs.length === 0) return;
  const config = configs[0];
  if (!config.webhookUrl) return;

  // Get pending approvals for the payload
  const pendingApprovals = await decisionLog.getPending();

  const payload = {
    event_type: "mags_cycle_complete",
    project_id: "video-factory",
    overall_score: result.overallScore,
    total_decisions: result.totalDecisions,
    applied_decisions: result.appliedDecisions,
    pending_decisions: result.pendingDecisions,
    alerts: result.alerts,
    pending_approvals: pendingApprovals.slice(0, 10).map((d) => ({
      id: d.id,
      agent: d.agentName,
      title: d.title,
      confidence: d.confidence,
    })),
    dashboard_url: `${process.env.VITE_OAUTH_PORTAL_URL ?? ""}/admin/agents`,
    run_id: result.runId,
    triggered_by: result.triggeredBy,
    timestamp: result.finishedAt.toISOString(),
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  // Update last push status
  await db
    .update(leadosConfig)
    .set({
      lastPushAt: new Date(),
      lastPushStatus: response.ok ? "success" : "failed",
    })
    .where(eq(leadosConfig.id, config.id));

  if (!response.ok) {
    throw new Error(`LeadOS webhook returned ${response.status}`);
  }
  console.log(`[Orchestrator] LeadOS push successful (${response.status})`);
}

function buildSummary(
  score: number,
  results: AgentRunResult[],
  alertCount: number
): string {
  const scoreLabel = score >= 80 ? "Healthy" : score >= 60 ? "Good" : score >= 40 ? "Warning" : "Critical";
  const agentSummary = results
    .map((r) => `${r.agentName}: ${r.score}/100`)
    .join(", ");
  return `Overall: ${score}/100 (${scoreLabel}) | ${alertCount} alert(s) | ${agentSummary}`;
}
