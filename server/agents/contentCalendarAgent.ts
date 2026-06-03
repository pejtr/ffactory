// ─── MAGS — ContentCalendarAgent ─────────────────────────────────────────────
// Manages posting queue: auto-generates calendar when queue is low.
// Schedule: daily at 20:00 UTC

import { AgentBase } from "./agentBase";
import { RulesEngine } from "./rulesEngine";
import type { AgentDecisionInput, AgentName, SharedVideoMetrics } from "./types";

const rulesEngine = new RulesEngine<SharedVideoMetrics>();

// CC1: Queue < 3 videos → auto-generate 7-day calendar (Medium/Auto)
rulesEngine.register({
  id: "CC1",
  priority: 1,
  description: "Content queue running low",
  condition: (m, t) =>
    m.totalChannels > 0 && m.totalQueuedVideos < (t["CC1_threshold"] ?? 3),
  decision: (m) => ({
    decisionType: "create",
    source: "rules",
    title: `Content queue low: ${m.totalQueuedVideos} video(s) queued`,
    reasoning: `Queue has fewer than 3 videos. Auto-generating 7-day content calendar from active blueprints to maintain posting consistency.`,
    impact: "Posting consistency and algorithm ranking",
    confidence: 88,
    status: "applied" as const,
    metadata: { queuedVideos: m.totalQueuedVideos, activeBlueprints: m.activeBlueprints },
  }),
});

// CC2: Channels with empty queue → emergency generate (High/Alert)
rulesEngine.register({
  id: "CC2",
  priority: 2,
  description: "Channels with empty content queue",
  condition: (m, t) => m.channelsWithEmptyQueue > (t["CC2_threshold"] ?? 0),
  decision: (m) => ({
    decisionType: "alert",
    source: "rules",
    title: `${m.channelsWithEmptyQueue} channel(s) have empty content queue`,
    reasoning: `Empty queue means posting will stop completely. Emergency content generation triggered.`,
    impact: "CRITICAL: Channel posting will stop",
    confidence: 99,
    status: "applied" as const,
    metadata: { emptyChannels: m.channelsWithEmptyQueue },
  }),
});

// CC3: No active blueprints → recommend creating one (Low/Pending)
rulesEngine.register({
  id: "CC3",
  priority: 3,
  description: "No active blueprints for content generation",
  condition: (m) => m.totalChannels > 0 && m.activeBlueprints === 0,
  decision: () => ({
    decisionType: "recommend",
    source: "rules",
    title: "No active Channel Blueprints found",
    reasoning: "Without an active blueprint, content calendar cannot auto-generate topics. Create a Channel Blueprint to enable autonomous content planning.",
    impact: "Content automation disabled",
    confidence: 95,
    status: "pending" as const,
    metadata: {},
  }),
});

export class ContentCalendarAgent extends AgentBase {
  readonly name: AgentName = "ContentCalendarAgent";
  readonly schedule = "daily_20utc";
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
    if (decision.decisionType === "create") {
      console.log(`[ContentCalendarAgent] Triggering 7-day calendar generation`);
    }
    if (decision.decisionType === "alert") {
      console.log(`[ContentCalendarAgent] EMERGENCY: generating content for empty queues`);
    }
  }

  protected computeScore(metrics: SharedVideoMetrics): number {
    if (metrics.totalChannels === 0) return 75;
    let score = 100;
    if (metrics.channelsWithEmptyQueue > 0) score -= 40;
    else if (metrics.totalQueuedVideos < 3) score -= 20;
    if (metrics.activeBlueprints === 0 && metrics.totalChannels > 0) score -= 20;
    const adherence = metrics.avgPostingCadenceAdherence;
    if (adherence < 50) score -= 20;
    else if (adherence < 80) score -= 10;
    return Math.max(0, Math.min(100, score));
  }
}

export const contentCalendarAgent = new ContentCalendarAgent();
