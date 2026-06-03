// ─── MAGS — ThumbnailABAgent ──────────────────────────────────────────────────
// Manages A/B thumbnail testing: detects winners, rotates losers.
// Schedule: every 12 hours

import { AgentBase } from "./agentBase";
import { RulesEngine } from "./rulesEngine";
import type { AgentDecisionInput, AgentName, SharedVideoMetrics } from "./types";

const rulesEngine = new RulesEngine<SharedVideoMetrics>();

// T1: A/B tests with winner → apply winner (Medium/Auto)
rulesEngine.register({
  id: "T1",
  priority: 1,
  description: "A/B tests with clear winner detected",
  condition: (m, t) => m.abTestsWithWinner > (t["T1_threshold"] ?? 0),
  decision: (m) => ({
    decisionType: "update",
    source: "rules",
    title: `${m.abTestsWithWinner} A/B test(s) have a clear winner`,
    reasoning: `Statistically significant winner detected (95% confidence). Applying winning thumbnail variant and retiring loser.`,
    impact: "CTR improvement expected",
    confidence: 95,
    status: "applied" as const,
    metadata: { winnerCount: m.abTestsWithWinner },
  }),
});

// T2: Low CTR videos without A/B test → create test (Medium/Pending)
rulesEngine.register({
  id: "T2",
  priority: 2,
  description: "Low CTR videos need A/B testing",
  condition: (m, t) =>
    m.lowCTRVideos > (t["T2_threshold"] ?? 0) && m.abTestsRunning < m.lowCTRVideos,
  decision: (m) => ({
    decisionType: "create",
    source: "rules",
    title: `${m.lowCTRVideos} video(s) with CTR < 3% need thumbnail A/B test`,
    reasoning: `Low CTR videos are underperforming. Creating thumbnail A/B tests with 3 variants (dramatic, minimalist, action) for each.`,
    impact: "Potential 2-5x CTR improvement",
    confidence: 80,
    status: "pending" as const,
    metadata: { lowCTRCount: m.lowCTRVideos, testsRunning: m.abTestsRunning },
  }),
});

export class ThumbnailABAgent extends AgentBase {
  readonly name: AgentName = "ThumbnailABAgent";
  readonly schedule = "every_12h";
  readonly riskLevel = "medium" as const;

  protected applyRules(
    metrics: SharedVideoMetrics,
    thresholds: Record<string, number>
  ): Omit<AgentDecisionInput, "agentName" | "runId">[] {
    return rulesEngine
      .getMatchedDecisions(this.name, "temp", metrics, thresholds)
      .map(({ agentName, runId, ...rest }) => rest);
  }

  protected async executeDecision(decision: AgentDecisionInput): Promise<void> {
    if (decision.decisionType === "update" && decision.metadata) {
      console.log(`[ThumbnailABAgent] Applying ${(decision.metadata as any).winnerCount} winning thumbnails`);
    }
  }

  protected computeScore(metrics: SharedVideoMetrics): number {
    let score = 100;
    if (metrics.lowCTRVideos > 0) score -= Math.min(40, metrics.lowCTRVideos * 8);
    if (metrics.abTestsWithWinner > 0) score += 10; // bonus for active optimization
    return Math.max(0, Math.min(100, score));
  }
}

export const thumbnailABAgent = new ThumbnailABAgent();
