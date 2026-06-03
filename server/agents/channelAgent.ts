// ─── MAGS — ChannelAgent ──────────────────────────────────────────────────────
// Monitors YouTube channel health: posting gaps, CTR, subscriber drops.
// Schedule: every 6 hours

import { AgentBase } from "./agentBase";
import { RulesEngine } from "./rulesEngine";
import type {
  AgentDecisionInput,
  AgentName,
  SharedVideoMetrics,
} from "./types";

type ChannelMetrics = SharedVideoMetrics;

const rulesEngine = new RulesEngine<ChannelMetrics>();

// C1: Posting gap > 3 days → generate next video from blueprint (Medium/Auto)
rulesEngine.register({
  id: "C1",
  priority: 1,
  description: "Channels with posting gap detected",
  condition: (m, t) => m.channelsWithPostingGap > (t["C1_threshold"] ?? 0),
  decision: (m) => ({
    decisionType: "create",
    source: "rules",
    title: `${m.channelsWithPostingGap} channel(s) have posting gap > 3 days`,
    reasoning: `YouTube algorithm penalizes inconsistent posting. ${m.channelsWithPostingGap} channels haven't posted in 3+ days. Auto-generating next video from blueprint.`,
    impact: "Channel growth and algorithm ranking at risk",
    confidence: 90,
    status: "applied" as const,
    metadata: { channelsWithGap: m.channelsWithPostingGap },
  }),
});

// C2: Avg CTR < 3% → trigger thumbnail A/B test (Medium/Pending)
rulesEngine.register({
  id: "C2",
  priority: 2,
  description: "Low average CTR across channels",
  condition: (m, t) =>
    m.avgCTR > 0 && m.avgCTR < (t["C2_threshold"] ?? 3),
  decision: (m) => ({
    decisionType: "update",
    source: "rules",
    title: `Average CTR ${m.avgCTR.toFixed(1)}% below 3% threshold`,
    reasoning: `Low click-through rate indicates thumbnail/title issues. Triggering A/B thumbnail testing for underperforming videos.`,
    impact: "Video reach and views significantly reduced",
    confidence: 85,
    status: "pending" as const,
    metadata: { avgCTR: m.avgCTR, lowCTRVideos: m.lowCTRVideos },
  }),
});

// C3: Subscriber drop > 5% in 7 days → alert (High/Alert)
rulesEngine.register({
  id: "C3",
  priority: 3,
  description: "Subscriber count drop detected",
  condition: (m, t) => m.subscriberDropChannels > (t["C3_threshold"] ?? 0),
  decision: (m) => ({
    decisionType: "alert",
    source: "rules",
    title: `${m.subscriberDropChannels} channel(s) losing subscribers`,
    reasoning: `Subscriber drop > 5% in 7 days detected. This may indicate content quality issues or algorithm changes.`,
    impact: "Channel authority and monetization at risk",
    confidence: 92,
    status: "applied" as const,
    metadata: { affectedChannels: m.subscriberDropChannels },
  }),
});

// C4: No channels connected → recommend setup (Low/Pending)
rulesEngine.register({
  id: "C4",
  priority: 4,
  description: "No YouTube channels connected",
  condition: (m, t) => m.totalChannels === 0,
  decision: () => ({
    decisionType: "recommend",
    source: "rules",
    title: "No YouTube channels connected",
    reasoning: "Connect a YouTube channel to enable automated publishing, analytics tracking, and Channel Empire features.",
    impact: "YouTube automation features unavailable",
    confidence: 100,
    status: "pending" as const,
    metadata: {},
  }),
});

export class ChannelAgent extends AgentBase {
  readonly name: AgentName = "ChannelAgent";
  readonly schedule = "every_6h";
  readonly riskLevel = "medium" as const;

  protected applyRules(
    metrics: ChannelMetrics,
    thresholds: Record<string, number>
  ): Omit<AgentDecisionInput, "agentName" | "runId">[] {
    return rulesEngine
      .getMatchedDecisions(this.name, "temp", metrics, thresholds)
      .map(({ agentName, runId, ...rest }) => rest);
  }

  protected async executeDecision(decision: AgentDecisionInput): Promise<void> {
    // C1: posting gap — log trigger for content calendar generation
    if (decision.decisionType === "create" && decision.metadata) {
      console.log(`[ChannelAgent] Triggering content generation for ${(decision.metadata as any).channelsWithGap} channels`);
    }
    // C3: subscriber drop — log alert
    if (decision.decisionType === "alert" && decision.metadata) {
      console.log(`[ChannelAgent] ALERT: ${(decision.metadata as any).affectedChannels} channels losing subscribers`);
    }
  }

  protected computeScore(metrics: ChannelMetrics): number {
    if (metrics.totalChannels === 0) return 50; // neutral when no channels
    let score = 100;
    // Deduct for posting gaps
    const gapRatio = metrics.channelsWithPostingGap / metrics.totalChannels;
    score -= Math.round(gapRatio * 40);
    // Deduct for low CTR
    if (metrics.avgCTR > 0 && metrics.avgCTR < 2) score -= 25;
    else if (metrics.avgCTR > 0 && metrics.avgCTR < 3) score -= 15;
    // Deduct for subscriber drops
    if (metrics.subscriberDropChannels > 0) score -= 20;
    return Math.max(0, Math.min(100, score));
  }
}

export const channelAgent = new ChannelAgent();
