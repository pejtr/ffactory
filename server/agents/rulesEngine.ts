// ─── MAGS — Rules Engine ─────────────────────────────────────────────────────
// Deterministic rules ALWAYS run before AI analysis.
// Rules are sorted by priority (lower = higher priority), first match wins per entity.

import type { AgentDecisionInput, AgentName, RuleResult } from "./types";

export interface Rule<TMetrics> {
  id: string;
  priority: number; // lower = higher priority
  description: string;
  condition: (metrics: TMetrics, thresholds: Record<string, number>) => boolean;
  decision: (metrics: TMetrics) => Omit<AgentDecisionInput, "agentName" | "runId">;
}

export class RulesEngine<TMetrics> {
  private rules: Rule<TMetrics>[] = [];

  register(rule: Rule<TMetrics>): this {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
    return this;
  }

  evaluate(
    metrics: TMetrics,
    thresholds: Record<string, number> = {}
  ): RuleResult[] {
    const results: RuleResult[] = [];
    for (const rule of this.rules) {
      const matched = rule.condition(metrics, thresholds);
      if (matched) {
        results.push({
          ruleId: rule.id,
          matched: true,
          decision: rule.decision(metrics),
        });
      } else {
        results.push({ ruleId: rule.id, matched: false });
      }
    }
    return results;
  }

  getMatchedDecisions(
    agentName: AgentName,
    runId: string,
    metrics: TMetrics,
    thresholds: Record<string, number> = {}
  ): AgentDecisionInput[] {
    return this.evaluate(metrics, thresholds)
      .filter((r) => r.matched && r.decision)
      .map((r) => ({
        agentName,
        runId,
        ...r.decision!,
      }));
  }
}
