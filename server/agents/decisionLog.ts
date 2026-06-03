// ─── MAGS — Decision Log ─────────────────────────────────────────────────────
// Persists every agent decision to DB with full audit trail.

import { getDb } from "../db";
import { agentDecisions } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import type { AgentDecisionInput, AgentDecisionRecord, AgentName } from "./types";

export class DecisionLog {
  async save(decisions: AgentDecisionInput[]): Promise<void> {
    if (decisions.length === 0) return;
    const db = await getDb();
    if (!db) return;
    await db.insert(agentDecisions).values(
      decisions.map((d) => ({
        agentName: d.agentName,
        runId: d.runId,
        decisionType: d.decisionType,
        source: d.source,
        title: d.title,
        reasoning: d.reasoning,
        impact: d.impact,
        confidence: d.confidence,
        status: d.status,
        metadata: d.metadata ?? null,
        appliedAt: d.status === "applied" ? new Date() : null,
      }))
    );
  }

  async getPending(agentName?: AgentName): Promise<AgentDecisionRecord[]> {
    const db = await getDb();
    if (!db) return [];
    const rows = agentName
      ? await db
          .select()
          .from(agentDecisions)
          .where(
            and(
              eq(agentDecisions.status, "pending"),
              eq(agentDecisions.agentName, agentName)
            )
          )
          .orderBy(desc(agentDecisions.createdAt))
          .limit(50)
      : await db
          .select()
          .from(agentDecisions)
          .where(eq(agentDecisions.status, "pending"))
          .orderBy(desc(agentDecisions.createdAt))
          .limit(50);
    return rows as AgentDecisionRecord[];
  }

  async approve(id: number, approvedBy: string = "manual"): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db
      .update(agentDecisions)
      .set({ status: "approved", approvedBy, appliedAt: new Date() })
      .where(eq(agentDecisions.id, id));
  }

  async reject(id: number, reason: string): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db
      .update(agentDecisions)
      .set({ status: "rejected", rejectedReason: reason })
      .where(eq(agentDecisions.id, id));
  }

  async getHistory(limit = 100, agentName?: AgentName): Promise<AgentDecisionRecord[]> {
    const db = await getDb();
    if (!db) return [];
    const rows = agentName
      ? await db
          .select()
          .from(agentDecisions)
          .where(eq(agentDecisions.agentName, agentName))
          .orderBy(desc(agentDecisions.createdAt))
          .limit(limit)
      : await db
          .select()
          .from(agentDecisions)
          .orderBy(desc(agentDecisions.createdAt))
          .limit(limit);
    return rows as AgentDecisionRecord[];
  }

  async markSuperseded(runId: string, agentName: AgentName): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db
      .update(agentDecisions)
      .set({ status: "superseded" })
      .where(
        and(
          eq(agentDecisions.agentName, agentName),
          eq(agentDecisions.status, "pending"),
          // not the current run
        )
      );
  }
}

export const decisionLog = new DecisionLog();
