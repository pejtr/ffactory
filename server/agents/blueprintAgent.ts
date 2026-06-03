// ─── MAGS — BlueprintAgent ────────────────────────────────────────────────────
// Monitors Channel Blueprint execution: tracks progress, detects niche decay.
// Schedule: daily at 08:00 UTC

import { AgentBase } from "./agentBase";
import { RulesEngine } from "./rulesEngine";
import type { AgentDecisionInput, AgentName, SharedVideoMetrics } from "./types";

const rulesEngine = new RulesEngine<SharedVideoMetrics>();

// B1: No active blueprints but channels exist → recommend blueprint (Low/Pending)
rulesEngine.register({
  id: "B1",
  priority: 1,
  description: "Channels without active blueprint",
  condition: (m) => m.totalChannels > 0 && m.activeBlueprints === 0,
  decision: (m) => ({
    decisionType: "recommend",
    source: "rules",
    title: `${m.totalChannels} channel(s) have no active Channel Blueprint`,
    reasoning: "A Channel Blueprint provides a 30-video content plan with SEO metadata, 90-day roadmap, and brand identity. Without it, content strategy is ad-hoc.",
    impact: "Channel growth potential unrealized",
    confidence: 90,
    status: "pending" as const,
    metadata: { channels: m.totalChannels },
  }),
});

// B2: Blueprint execution rate < 30% → recommend action (Medium/Pending)
rulesEngine.register({
  id: "B2",
  priority: 2,
  description: "Low blueprint execution rate",
  condition: (m, t) =>
    m.activeBlueprints > 0 && m.blueprintExecutionRate < (t["B2_threshold"] ?? 30),
  decision: (m) => ({
    decisionType: "recommend",
    source: "rules",
    title: `Blueprint execution rate ${m.blueprintExecutionRate.toFixed(0)}% — below 30%`,
    reasoning: `Only ${m.blueprintExecutionRate.toFixed(0)}% of planned videos from active blueprints have been produced. Recommend reviewing production pipeline and scheduling remaining videos.`,
    impact: "90-day growth roadmap behind schedule",
    confidence: 85,
    status: "pending" as const,
    metadata: { executionRate: m.blueprintExecutionRate, activeBlueprints: m.activeBlueprints },
  }),
});

// B3: No blueprints at all → onboarding recommendation (Low/Pending)
rulesEngine.register({
  id: "B3",
  priority: 3,
  description: "No blueprints created yet",
  condition: (m) => m.totalBlueprints === 0,
  decision: () => ({
    decisionType: "recommend",
    source: "rules",
    title: "Start your Channel Empire with a Blueprint",
    reasoning: "No Channel Blueprints have been created. The Channel Blueprint Generator creates a complete 30-video content plan, brand identity, and 90-day growth roadmap.",
    impact: "Unlock autonomous YouTube growth",
    confidence: 100,
    status: "pending" as const,
    metadata: {},
  }),
});

export class BlueprintAgent extends AgentBase {
  readonly name: AgentName = "BlueprintAgent";
  readonly schedule = "daily_08utc";
  readonly riskLevel = "low" as const;

  protected applyRules(
    metrics: SharedVideoMetrics,
    thresholds: Record<string, number>
  ): Omit<AgentDecisionInput, "agentName" | "runId">[] {
    return rulesEngine
      .getMatchedDecisions(this.name, "temp", metrics, thresholds)
      .map(({ agentName, runId, ...rest }) => rest);
  }

  protected async executeDecision(decision: AgentDecisionInput): Promise<void> {
    // Blueprint agent decisions are all recommendations — no auto-execution
    console.log(`[BlueprintAgent] Recommendation logged: ${decision.title}`);
  }

  protected computeScore(metrics: SharedVideoMetrics): number {
    if (metrics.totalBlueprints === 0) return 40;
    let score = 100;
    if (metrics.activeBlueprints === 0) score -= 30;
    if (metrics.blueprintExecutionRate < 30) score -= 30;
    else if (metrics.blueprintExecutionRate < 60) score -= 15;
    return Math.max(0, Math.min(100, score));
  }
}

export const blueprintAgent = new BlueprintAgent();
