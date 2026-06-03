// ─── MAGS — Agents tRPC Router ────────────────────────────────────────────────
// Exposes MAGS procedures for the admin dashboard + LeadOS webhook handler.

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  agentDecisions,
  agentRuns,
  orchestratorRuns,
  agentThresholds,
  leadosConfig,
} from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { decisionLog } from "../agents/decisionLog";
import { runOrchestrator } from "../agents/orchestrator";

export const agentsRouter = router({
  // ── Dashboard overview ──────────────────────────────────────────────────

  getOverview: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // Latest orchestrator run
    const latestRun = await db
      .select()
      .from(orchestratorRuns)
      .orderBy(desc(orchestratorRuns.startedAt))
      .limit(1);

    // Per-agent latest scores via subquery
    const latestAgentRuns = await db
      .select({
        agentName: agentRuns.agentName,
        score: agentRuns.score,
        decisionsCount: agentRuns.decisionsCount,
        appliedCount: agentRuns.appliedCount,
        status: agentRuns.status,
        createdAt: agentRuns.createdAt,
        summary: agentRuns.summary,
      })
      .from(agentRuns)
      .orderBy(desc(agentRuns.createdAt))
      .limit(20);

    // Deduplicate: keep only latest per agent
    const agentScoreMap = new Map<string, typeof latestAgentRuns[0]>();
    for (const r of latestAgentRuns) {
      if (!agentScoreMap.has(r.agentName)) agentScoreMap.set(r.agentName, r);
    }

    // Pending decisions count
    const pendingCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(agentDecisions)
      .where(eq(agentDecisions.status, "pending"));

    return {
      latestRun: latestRun[0] ?? null,
      agentScores: Array.from(agentScoreMap.values()),
      pendingCount: Number(pendingCount[0]?.count ?? 0),
    };
  }),

  // ── Orchestrator runs history ───────────────────────────────────────────

  getOrchestratorRuns: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(orchestratorRuns)
        .orderBy(desc(orchestratorRuns.startedAt))
        .limit(input.limit);
    }),

  // ── Decision management ─────────────────────────────────────────────────

  getPendingDecisions: protectedProcedure
    .input(z.object({ agentName: z.string().optional() }))
    .query(async ({ input }) => {
      return decisionLog.getPending(input.agentName as any);
    }),

  getDecisionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        agentName: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return decisionLog.getHistory(input.limit, input.agentName as any);
    }),

  approveDecision: protectedProcedure
    .input(z.object({ id: z.number(), approvedBy: z.string().default("admin") }))
    .mutation(async ({ input }) => {
      await decisionLog.approve(input.id, input.approvedBy);
      return { success: true };
    }),

  rejectDecision: protectedProcedure
    .input(z.object({ id: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      await decisionLog.reject(input.id, input.reason);
      return { success: true };
    }),

  // ── Trigger agents ──────────────────────────────────────────────────────

  runFull: protectedProcedure.mutation(async () => {
    const result = await runOrchestrator("manual");
    return {
      runId: result.runId,
      overallScore: result.overallScore,
      totalDecisions: result.totalDecisions,
      appliedDecisions: result.appliedDecisions,
      pendingDecisions: result.pendingDecisions,
      summary: result.summary,
      alerts: result.alerts,
    };
  }),

  triggerAgent: protectedProcedure
    .input(z.object({ agentName: z.string() }))
    .mutation(async ({ input }) => {
      const { collectSharedMetrics } = await import("../agents/sharedMetrics");
      const metrics = await collectSharedMetrics();

      let result;
      switch (input.agentName) {
        case "VideoAgent": {
          const { videoAgent } = await import("../agents/videoAgent");
          result = await videoAgent.run(metrics);
          break;
        }
        case "ChannelAgent": {
          const { channelAgent } = await import("../agents/channelAgent");
          result = await channelAgent.run(metrics);
          break;
        }
        case "ContentCalendarAgent": {
          const { contentCalendarAgent } = await import("../agents/contentCalendarAgent");
          result = await contentCalendarAgent.run(metrics);
          break;
        }
        case "ThumbnailABAgent": {
          const { thumbnailABAgent } = await import("../agents/thumbnailABAgent");
          result = await thumbnailABAgent.run(metrics);
          break;
        }
        case "BlueprintAgent": {
          const { blueprintAgent } = await import("../agents/blueprintAgent");
          result = await blueprintAgent.run(metrics);
          break;
        }
        default:
          throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown agent: ${input.agentName}` });
      }

      return {
        agentName: result.agentName,
        score: result.score,
        decisionsCount: result.decisionsCount,
        appliedCount: result.appliedCount,
        summary: result.summary,
        status: result.status,
      };
    }),

  // ── Threshold management ────────────────────────────────────────────────

  getThresholds: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(agentThresholds).orderBy(agentThresholds.agentName);
  }),

  updateThreshold: protectedProcedure
    .input(
      z.object({
        agentName: z.string(),
        ruleId: z.string(),
        value: z.number(),
        reason: z.string().optional(),
        updatedBy: z.string().default("admin"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Upsert threshold
      const existing = await db
        .select()
        .from(agentThresholds)
        .where(
          and(
            eq(agentThresholds.agentName, input.agentName),
            eq(agentThresholds.ruleId, input.ruleId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(agentThresholds)
          .set({ value: input.value, reason: input.reason, updatedBy: input.updatedBy })
          .where(eq(agentThresholds.id, existing[0].id));
      } else {
        await db.insert(agentThresholds).values({
          agentName: input.agentName,
          ruleId: input.ruleId,
          value: input.value,
          reason: input.reason,
          updatedBy: input.updatedBy,
        });
      }
      return { success: true };
    }),

  // ── LeadOS configuration ────────────────────────────────────────────────

  getLeadosConfig: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(leadosConfig)
      .where(eq(leadosConfig.userId, ctx.user.id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      webhookUrl: row.webhookUrl,
      enabled: row.enabled,
      lastPushAt: row.lastPushAt,
      lastPushStatus: row.lastPushStatus,
      // Never return apiKey to frontend
    };
  }),

  saveLeadosConfig: protectedProcedure
    .input(
      z.object({
        webhookUrl: z.string().url().optional().or(z.literal("")),
        apiKey: z.string().optional(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select()
        .from(leadosConfig)
        .where(eq(leadosConfig.userId, ctx.user.id))
        .limit(1);

      const updateData: Record<string, unknown> = {
        webhookUrl: input.webhookUrl || null,
        enabled: input.enabled,
      };
      if (input.apiKey) updateData.apiKey = input.apiKey;

      if (existing.length > 0) {
        await db
          .update(leadosConfig)
          .set(updateData)
          .where(eq(leadosConfig.userId, ctx.user.id));
      } else {
        await db.insert(leadosConfig).values({
          userId: ctx.user.id,
          webhookUrl: input.webhookUrl || null,
          apiKey: input.apiKey || null,
          enabled: input.enabled,
        });
      }
      return { success: true };
    }),

  // ── Report generation ───────────────────────────────────────────────────

  getReport: protectedProcedure
    .input(z.object({ format: z.enum(["json", "markdown"]).default("markdown") }))
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const latestRun = await db
        .select()
        .from(orchestratorRuns)
        .orderBy(desc(orchestratorRuns.startedAt))
        .limit(1);

      const recentDecisions = await decisionLog.getHistory(20);

      return {
        latestRun: latestRun[0] ?? null,
        recentDecisions,
        generatedAt: new Date(),
      };
    }),
});
