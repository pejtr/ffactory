// ─── MAGS — Vitest Tests ──────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RulesEngine } from "./agents/rulesEngine";
import type { SharedVideoMetrics } from "./agents/types";

// ── RulesEngine unit tests ─────────────────────────────────────────────────────
describe("RulesEngine", () => {
  const engine = new RulesEngine<SharedVideoMetrics>();

  const baseMetrics: SharedVideoMetrics = {
    totalProjects: 10,
    activeProjects: 2,
    stalledProjects: 0,
    failedProjectsLast24h: 0,
    avgQualityScore: 85,
    completedLast7d: 5,
    totalChannels: 2,
    channelsWithPostingGap: 0,
    avgCTR: 4.5,
    totalSubscribers: 1000,
    lowCTRVideos: 0,
    subscriberDropChannels: 0,
    totalQueuedVideos: 5,
    channelsWithEmptyQueue: 0,
    avgPostingCadenceAdherence: 90,
    abTestsRunning: 0,
    abTestsWithWinner: 0,
    activeBlueprints: 1,
    totalBlueprints: 2,
    blueprintExecutionRate: 60,
    collectedAt: new Date(),
  };

  beforeEach(() => {
    // Clear registered rules between tests
    (engine as any).rules = [];
  });

  it("registers rules and evaluates conditions", () => {
    engine.register({
      id: "TEST1",
      priority: 1,
      description: "Test rule",
      condition: (m) => m.stalledProjects > 0,
      decision: () => ({
        decisionType: "alert" as const,
        source: "rules" as const,
        title: "Stalled projects",
        reasoning: "Test",
        impact: "Test impact",
        confidence: 90,
        status: "applied" as const,
        metadata: {},
      }),
    });

    // Should NOT fire when stalledProjects = 0
    const noMatch = engine.getMatchedDecisions("VideoAgent", "run-1", baseMetrics, {});
    expect(noMatch).toHaveLength(0);

    // Should fire when stalledProjects > 0
    const withStalled = { ...baseMetrics, stalledProjects: 3 };
    const match = engine.getMatchedDecisions("VideoAgent", "run-1", withStalled, {});
    expect(match).toHaveLength(1);
    expect(match[0].title).toBe("Stalled projects");
    expect(match[0].agentName).toBe("VideoAgent");
  });

  it("respects threshold overrides", () => {
    engine.register({
      id: "T1",
      priority: 1,
      description: "Threshold rule",
      condition: (m, t) => m.stalledProjects > (t["T1_threshold"] ?? 2),
      decision: () => ({
        decisionType: "alert" as const,
        source: "rules" as const,
        title: "Threshold test",
        reasoning: "Test",
        impact: "Test",
        confidence: 80,
        status: "applied" as const,
        metadata: {},
      }),
    });

    const metrics = { ...baseMetrics, stalledProjects: 3 };

    // Default threshold = 2, stalledProjects = 3 → fires
    const defaultMatch = engine.getMatchedDecisions("VideoAgent", "run-1", metrics, {});
    expect(defaultMatch).toHaveLength(1);

    // Custom threshold = 5, stalledProjects = 3 → does NOT fire
    const noMatch = engine.getMatchedDecisions("VideoAgent", "run-1", metrics, { T1_threshold: 5 });
    expect(noMatch).toHaveLength(0);
  });

  it("sorts by priority", () => {
    engine.register({
      id: "LOW",
      priority: 10,
      description: "Low priority",
      condition: () => true,
      decision: () => ({
        decisionType: "recommend" as const,
        source: "rules" as const,
        title: "Low priority",
        reasoning: "Test",
        impact: "Test",
        confidence: 50,
        status: "pending" as const,
        metadata: {},
      }),
    });
    engine.register({
      id: "HIGH",
      priority: 1,
      description: "High priority",
      condition: () => true,
      decision: () => ({
        decisionType: "alert" as const,
        source: "rules" as const,
        title: "High priority",
        reasoning: "Test",
        impact: "Test",
        confidence: 95,
        status: "applied" as const,
        metadata: {},
      }),
    });

    const results = engine.getMatchedDecisions("TestAgent", "run-1", baseMetrics, {});
    expect(results[0].title).toBe("High priority");
    expect(results[1].title).toBe("Low priority");
  });
});

// ── Agent score computation tests ──────────────────────────────────────────────
describe("Agent score computation", () => {
  it("VideoAgent returns 100 score for healthy metrics", async () => {
    const { VideoAgent } = await import("./agents/videoAgent");
    const agent = new VideoAgent();
    const metrics: SharedVideoMetrics = {
      totalProjects: 10,
      activeProjects: 2,
      stalledProjects: 0,
      failedProjectsLast24h: 0,
      avgQualityScore: 90,
      completedLast7d: 5,
      totalChannels: 1,
      channelsWithPostingGap: 0,
      avgCTR: 5,
      totalSubscribers: 1000,
      lowCTRVideos: 0,
      subscriberDropChannels: 0,
      totalQueuedVideos: 5,
      channelsWithEmptyQueue: 0,
      avgPostingCadenceAdherence: 95,
      abTestsRunning: 0,
      abTestsWithWinner: 0,
      activeBlueprints: 1,
      totalBlueprints: 2,
      blueprintExecutionRate: 70,
      collectedAt: new Date(),
    };
    const score = (agent as any).computeScore(metrics);
    expect(score).toBe(100);
  });

  it("VideoAgent deducts for stalled and failed projects", async () => {
    const { VideoAgent } = await import("./agents/videoAgent");
    const agent = new VideoAgent();
    const metrics: SharedVideoMetrics = {
      totalProjects: 10,
      activeProjects: 3,
      stalledProjects: 3,
      failedProjectsLast24h: 2,
      avgQualityScore: 50,
      completedLast7d: 0,
      totalChannels: 1,
      channelsWithPostingGap: 0,
      avgCTR: 5,
      totalSubscribers: 1000,
      lowCTRVideos: 0,
      subscriberDropChannels: 0,
      totalQueuedVideos: 5,
      channelsWithEmptyQueue: 0,
      avgPostingCadenceAdherence: 95,
      abTestsRunning: 0,
      abTestsWithWinner: 0,
      activeBlueprints: 1,
      totalBlueprints: 2,
      blueprintExecutionRate: 70,
      collectedAt: new Date(),
    };
    const score = (agent as any).computeScore(metrics);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("ChannelAgent returns 50 when no channels", async () => {
    const { ChannelAgent } = await import("./agents/channelAgent");
    const agent = new ChannelAgent();
    const metrics: SharedVideoMetrics = {
      totalProjects: 0,
      activeProjects: 0,
      stalledProjects: 0,
      failedProjectsLast24h: 0,
      avgQualityScore: 0,
      completedLast7d: 0,
      totalChannels: 0,
      channelsWithPostingGap: 0,
      avgCTR: 0,
      totalSubscribers: 0,
      lowCTRVideos: 0,
      subscriberDropChannels: 0,
      totalQueuedVideos: 0,
      channelsWithEmptyQueue: 0,
      avgPostingCadenceAdherence: 0,
      abTestsRunning: 0,
      abTestsWithWinner: 0,
      activeBlueprints: 0,
      totalBlueprints: 0,
      blueprintExecutionRate: 0,
      collectedAt: new Date(),
    };
    const score = (agent as any).computeScore(metrics);
    expect(score).toBe(50);
  });

  it("BlueprintAgent returns 40 when no blueprints exist", async () => {
    const { BlueprintAgent } = await import("./agents/blueprintAgent");
    const agent = new BlueprintAgent();
    const metrics: SharedVideoMetrics = {
      totalProjects: 0,
      activeProjects: 0,
      stalledProjects: 0,
      failedProjectsLast24h: 0,
      avgQualityScore: 0,
      completedLast7d: 0,
      totalChannels: 1,
      channelsWithPostingGap: 0,
      avgCTR: 0,
      totalSubscribers: 0,
      lowCTRVideos: 0,
      subscriberDropChannels: 0,
      totalQueuedVideos: 0,
      channelsWithEmptyQueue: 0,
      avgPostingCadenceAdherence: 0,
      abTestsRunning: 0,
      abTestsWithWinner: 0,
      activeBlueprints: 0,
      totalBlueprints: 0,
      blueprintExecutionRate: 0,
      collectedAt: new Date(),
    };
    const score = (agent as any).computeScore(metrics);
    expect(score).toBe(40);
  });
});

// ── MAGS types validation ──────────────────────────────────────────────────────
describe("MAGS types", () => {
  it("AgentDecisionInput has required fields", () => {
    const decision = {
      agentName: "VideoAgent" as const,
      runId: "run-123",
      decisionType: "alert" as const,
      source: "rules" as const,
      title: "Test decision",
      reasoning: "Test reasoning",
      impact: "Test impact",
      confidence: 85,
      status: "applied" as const,
      metadata: { test: true },
    };
    expect(decision.agentName).toBe("VideoAgent");
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(100);
  });
});
