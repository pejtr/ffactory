// ─── MAGS — VideoAgent ────────────────────────────────────────────────────────
// Monitors video pipeline: stalled jobs, quality scores, failures.
// Schedule: every 1 hour

import { AgentBase } from "./agentBase";
import { RulesEngine } from "./rulesEngine";
import type {
  AgentDecisionInput,
  AgentName,
  SharedVideoMetrics,
} from "./types";

type VideoMetrics = SharedVideoMetrics;

const rulesEngine = new RulesEngine<VideoMetrics>();

// V1: Video job stuck > 30 min → alert + retry (Low/Auto)
rulesEngine.register({
  id: "V1",
  priority: 1,
  description: "Stalled video jobs detected",
  condition: (m, t) => m.stalledProjects > (t["V1_threshold"] ?? 0),
  decision: (m) => ({
    decisionType: "alert",
    source: "rules",
    title: `${m.stalledProjects} video job(s) stalled > 30 min`,
    reasoning: `${m.stalledProjects} video projects have not progressed in over 30 minutes. Auto-retry will be triggered.`,
    impact: "Video pipeline throughput reduced",
    confidence: 95,
    status: "applied" as const,
    metadata: { stalledCount: m.stalledProjects },
  }),
});

// V2: Quality score < 40 → flag for review (Medium/Pending)
rulesEngine.register({
  id: "V2",
  priority: 2,
  description: "Low average quality score",
  condition: (m, t) => m.avgQualityScore < (t["V2_threshold"] ?? 40),
  decision: (m) => ({
    decisionType: "alert",
    source: "rules",
    title: `Average quality score ${m.avgQualityScore}/100 below threshold`,
    reasoning: `The average quality score of generated videos has dropped below 40. Manual review of generation parameters recommended.`,
    impact: "Video quality degraded, user satisfaction at risk",
    confidence: 85,
    status: "pending" as const,
    metadata: { avgQualityScore: m.avgQualityScore },
  }),
});

// V3: 3+ failed jobs in 24h → alert owner (High/Alert)
rulesEngine.register({
  id: "V3",
  priority: 3,
  description: "Multiple pipeline failures",
  condition: (m, t) => m.failedProjectsLast24h >= (t["V3_threshold"] ?? 3),
  decision: (m) => ({
    decisionType: "alert",
    source: "rules",
    title: `${m.failedProjectsLast24h} video generation failures in last 24h`,
    reasoning: `High failure rate detected. This may indicate API issues, quota exhaustion, or configuration problems.`,
    impact: "Critical: video production pipeline degraded",
    confidence: 98,
    status: "applied" as const,
    metadata: { failedCount: m.failedProjectsLast24h },
  }),
});

// V4: No completions in 7 days → investigate (Medium/Pending)
rulesEngine.register({
  id: "V4",
  priority: 4,
  description: "No completed videos in 7 days",
  condition: (m, t) =>
    m.totalProjects > 0 && m.completedLast7d === 0,
  decision: (m) => ({
    decisionType: "recommend",
    source: "rules",
    title: "Zero video completions in the last 7 days",
    reasoning: `No videos have been completed in 7 days despite ${m.totalProjects} total projects. Check for systemic issues.`,
    impact: "Content production at standstill",
    confidence: 80,
    status: "pending" as const,
    metadata: { totalProjects: m.totalProjects },
  }),
});

export class VideoAgent extends AgentBase {
  readonly name: AgentName = "VideoAgent";
  readonly schedule = "every_1h";
  readonly riskLevel = "low" as const;

  protected applyRules(
    metrics: VideoMetrics,
    thresholds: Record<string, number>
  ): Omit<AgentDecisionInput, "agentName" | "runId">[] {
    return rulesEngine
      .getMatchedDecisions(this.name, "temp", metrics, thresholds)
      .map(({ agentName, runId, ...rest }) => rest);
  }

  protected async executeDecision(decision: AgentDecisionInput): Promise<void> {
    // V1: stalled jobs — log for now (actual retry logic would call video pipeline)
    if (decision.metadata && (decision.metadata as any).stalledCount > 0) {
      console.log(`[VideoAgent] Alerting owner about ${(decision.metadata as any).stalledCount} stalled jobs`);
    }
    // V3: multiple failures — log alert
    if (decision.metadata && (decision.metadata as any).failedCount >= 3) {
      console.log(`[VideoAgent] CRITICAL: ${(decision.metadata as any).failedCount} failures in 24h`);
    }
  }

  protected computeScore(metrics: VideoMetrics): number {
    let score = 100;
    // Deduct for stalled jobs
    score -= Math.min(30, metrics.stalledProjects * 10);
    // Deduct for failures
    score -= Math.min(30, metrics.failedProjectsLast24h * 10);
    // Deduct for quality
    if (metrics.avgQualityScore < 40) score -= 20;
    else if (metrics.avgQualityScore < 60) score -= 10;
    // Deduct for no completions
    if (metrics.totalProjects > 0 && metrics.completedLast7d === 0) score -= 20;
    return Math.max(0, Math.min(100, score));
  }
}

export const videoAgent = new VideoAgent();
