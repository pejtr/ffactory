// ─── MAGS — AgentBase (abstract class) ───────────────────────────────────────
// Every agent extends this class and implements the abstract methods.
// Pattern: Rules Engine ALWAYS runs before AI analysis.

import { getDb } from "../db";
import { agentRuns, agentThresholds } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { decisionLog } from "./decisionLog";
import { invokeLLM } from "../_core/llm";
import type {
  AgentName,
  AgentDecisionInput,
  AgentRunResult,
  SharedVideoMetrics,
  RiskLevel,
} from "./types";

export abstract class AgentBase {
  abstract readonly name: AgentName;
  abstract readonly schedule: string; // "every_1h" | "every_6h" | "daily_08utc" etc.
  abstract readonly riskLevel: RiskLevel;

  // ── Main entry point — called by orchestrator ────────────────────────────
  async run(metrics: SharedVideoMetrics): Promise<AgentRunResult> {
    const startedAt = Date.now();
    const runId = `${this.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      // 1. Load dynamic thresholds (LeadOS can override these)
      const thresholds = await this.loadThresholds();

      // 2. Rules Engine FIRST — deterministic, fast, predictable
      const ruleDecisions = this.applyRules(metrics, thresholds);

      // 3. AI analysis SECOND — only if rules didn't cover everything
      const aiDecisions = await this.analyzeWithAI(metrics, ruleDecisions, thresholds);

      // 4. Merge all decisions
      const allDecisions: AgentDecisionInput[] = [
        ...ruleDecisions.map((d) => ({ ...d, agentName: this.name, runId })),
        ...aiDecisions.map((d) => ({ ...d, agentName: this.name, runId })),
      ];

      // 5. Execute low-risk decisions automatically
      const appliedDecisions: AgentDecisionInput[] = [];
      for (const decision of allDecisions) {
        if (decision.status === "applied") {
          await this.executeDecision(decision);
          appliedDecisions.push(decision);
        }
      }

      // 6. Save all decisions to DB
      await decisionLog.save(allDecisions);

      // 7. Compute health score
      const score = this.computeScore(metrics);

      // 8. Save agent run to DB
      const result: AgentRunResult = {
        agentName: this.name,
        runId,
        status: "success",
        durationMs: Date.now() - startedAt,
        decisionsCount: allDecisions.length,
        appliedCount: appliedDecisions.length,
        score,
        summary: this.buildSummary(allDecisions, score),
        decisions: allDecisions,
      };
      await this.saveRun(result);
      return result;
    } catch (error: any) {
      const result: AgentRunResult = {
        agentName: this.name,
        runId,
        status: "error",
        durationMs: Date.now() - startedAt,
        decisionsCount: 0,
        appliedCount: 0,
        score: 0,
        summary: `Agent ${this.name} failed: ${error.message}`,
        decisions: [],
        error: error.message,
      };
      await this.saveRun(result);
      return result;
    }
  }

  // ── Abstract methods — each agent implements these ───────────────────────

  // Deterministic rules — ALWAYS before AI
  protected abstract applyRules(
    metrics: SharedVideoMetrics,
    thresholds: Record<string, number>
  ): Omit<AgentDecisionInput, "agentName" | "runId">[];

  // AI analysis — optional, builds on rule results
  protected async analyzeWithAI(
    metrics: SharedVideoMetrics,
    ruleDecisions: Omit<AgentDecisionInput, "agentName" | "runId">[],
    thresholds: Record<string, number>
  ): Promise<Omit<AgentDecisionInput, "agentName" | "runId">[]> {
    return []; // default: no AI analysis
  }

  // Execute a specific decision (side effects)
  protected abstract executeDecision(
    decision: AgentDecisionInput
  ): Promise<void>;

  // Compute health score 0-100
  protected abstract computeScore(metrics: SharedVideoMetrics): number;

  // ── Shared helpers ───────────────────────────────────────────────────────

  protected async loadThresholds(): Promise<Record<string, number>> {
    const db = await getDb();
    if (!db) return {};
    const rows = await db
      .select()
      .from(agentThresholds)
      .where(eq(agentThresholds.agentName, this.name));
    return Object.fromEntries(rows.map((r) => [r.ruleId, r.value]));
  }

  protected async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content as string ?? "";
  }

  private buildSummary(
    decisions: Omit<AgentDecisionInput, "agentName" | "runId">[],
    score: number
  ): string {
    const applied = decisions.filter((d) => d.status === "applied").length;
    const pending = decisions.filter((d) => d.status === "pending").length;
    return `Score: ${score}/100 | ${decisions.length} decisions (${applied} applied, ${pending} pending)`;
  }

  private async saveRun(result: AgentRunResult): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.insert(agentRuns).values({
      agentName: result.agentName,
      runId: result.runId,
      status: result.status,
      durationMs: result.durationMs,
      decisionsCount: result.decisionsCount,
      appliedCount: result.appliedCount,
      score: result.score,
      summary: result.summary,
      errorMessage: result.error,
    });
  }
}
