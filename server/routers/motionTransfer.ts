import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  motionTransferProjects,
  motionTransferSettings,
  motionTransferQueue,
} from "../../drizzle/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { invokeLLM } from "../_core/llm";

/**
 * Motion Transfer Router (Phase 17: SCAIL-2 GGUF)
 * Handles character animation from driving videos using Wan 2.1 motion transfer
 */

export const motionTransferRouter = router({
  // ─── Project Management ────────────────────────────────────────────────────
  
  /**
   * Create a new motion transfer project
   * Accepts reference image (character) and driving video (motion source)
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        referenceImageUrl: z.string().url(),
        drivingVideoUrl: z.string().url(),
        videoProjectId: z.number().optional(),
        gpuConfig: z.object({
          multiGpu: z.boolean().default(false),
          offloadGpu: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Create project record
      const result = await db
        .insert(motionTransferProjects)
        .values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          referenceImageUrl: input.referenceImageUrl,
          drivingVideoUrl: input.drivingVideoUrl,
          videoProjectId: input.videoProjectId,
          status: "draft",
          progress: 0,
          gpuConfig: input.gpuConfig || { multiGpu: false },
          metadata: {
            createdAt: new Date().toISOString(),
            model: "wan21",
            version: "v1.0",
          },
        });

      const projectId = result[0].insertId;

      // Queue for processing
      await db
        .insert(motionTransferQueue)
        .values({
          projectId: projectId,
          userId: ctx.user.id,
          priority: 5,
          status: "pending",
        });

      return {
        id: projectId,
        status: "draft",
        progress: 0,
      };
    }),

  /**
   * Get motion transfer project by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const project = await db
        .select()
        .from(motionTransferProjects)
        .where(
          and(
            eq(motionTransferProjects.id, input.id),
            eq(motionTransferProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      return project[0] || null;
    }),

  /**
   * List user's motion transfer projects
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["draft", "uploading", "processing", "completed", "failed", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const projects = await db
        .select()
        .from(motionTransferProjects)
        .where(
          input.status
            ? and(
                eq(motionTransferProjects.userId, ctx.user.id),
                eq(motionTransferProjects.status, input.status)
              )
            : eq(motionTransferProjects.userId, ctx.user.id)
        )
        .orderBy(desc(motionTransferProjects.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return projects;
    }),

  /**
   * Update project status and progress
   * Called by backend processing pipeline
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "uploading", "processing", "completed", "failed", "cancelled"]),
        progress: z.number().min(0).max(100),
        currentPhase: z.string().optional(),
        outputVideoUrl: z.string().url().optional(),
        previewUrl: z.string().url().optional(),
        errorMessage: z.string().optional(),
        processingTimeSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify ownership
      const project = await db
        .select()
        .from(motionTransferProjects)
        .where(
          and(
            eq(motionTransferProjects.id, input.id),
            eq(motionTransferProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project[0]) {
        throw new Error("Project not found");
      }

      await db
        .update(motionTransferProjects)
        .set({
          status: input.status,
          progress: input.progress,
          currentPhase: input.currentPhase,
          outputVideoUrl: input.outputVideoUrl,
          previewUrl: input.previewUrl,
          errorMessage: input.errorMessage,
          processingTimeSeconds: input.processingTimeSeconds,
          updatedAt: new Date(),
        })
        .where(eq(motionTransferProjects.id, input.id));

      return { success: true };
    }),

  /**
   * Delete motion transfer project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const project = await db
        .select()
        .from(motionTransferProjects)
        .where(
          and(
            eq(motionTransferProjects.id, input.id),
            eq(motionTransferProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project[0]) {
        throw new Error("Project not found");
      }

      await db
        .delete(motionTransferProjects)
        .where(eq(motionTransferProjects.id, input.id));

      return { success: true };
    }),

  // ─── Settings Management ───────────────────────────────────────────────────

  /**
   * Get or create user's motion transfer settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
      if (!db) throw new Error("Database not available");
    let settings = await db
      .select()
      .from(motionTransferSettings)
      .where(eq(motionTransferSettings.userId, ctx.user.id))
      .limit(1);

    if (!settings[0]) {
      // Create default settings
      await db.insert(motionTransferSettings).values({
        userId: ctx.user.id,
        enableMultiGpu: false,
        defaultChunkSize: 81,
        defaultColorMatchingThreshold: 0.95,
        outputResolution: "1920x1080",
        outputFps: 30,
        outputCodec: "h264",
        enableAutoMasking: true,
        maskingQuality: "high",
      });

      settings = await db
        .select()
        .from(motionTransferSettings)
        .where(eq(motionTransferSettings.userId, ctx.user.id))
        .limit(1);
    }

    return settings[0];
  }),

  /**
   * Update motion transfer settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        enableMultiGpu: z.boolean().optional(),
        primaryGpuId: z.string().optional(),
        secondaryGpuId: z.string().optional(),
        maxVramGb: z.number().optional(),
        defaultChunkSize: z.number().optional(),
        defaultColorMatchingThreshold: z.number().optional(),
        outputResolution: z.string().optional(),
        outputFps: z.number().optional(),
        outputCodec: z.string().optional(),
        enableAutoMasking: z.boolean().optional(),
        maskingQuality: z.enum(["low", "medium", "high"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get or create settings
      let settings = await db
        .select()
        .from(motionTransferSettings)
        .where(eq(motionTransferSettings.userId, ctx.user.id))
        .limit(1);

      if (!settings[0]) {
        await db.insert(motionTransferSettings).values({
          userId: ctx.user.id,
        });
      }

      await db
        .update(motionTransferSettings)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(motionTransferSettings.userId, ctx.user.id));

      return { success: true };
    }),

  // ─── Processing & Generation ──────────────────────────────────────────────

  /**
   * Start motion transfer generation
   * Validates inputs and queues for processing
   */
  generate: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        estimatedDurationSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify project ownership
      const project = await db
        .select()
        .from(motionTransferProjects)
        .where(
          and(
            eq(motionTransferProjects.id, input.projectId),
            eq(motionTransferProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project[0]) {
        throw new Error("Project not found");
      }

      // Update status to processing
      await db
        .update(motionTransferProjects)
        .set({
          status: "processing",
          progress: 5,
          currentPhase: "initializing",
          updatedAt: new Date(),
        })
        .where(eq(motionTransferProjects.id, input.projectId));

      // Update queue status
      await db
        .update(motionTransferQueue)
        .set({
          status: "processing",
          startedAt: new Date(),
        })
        .where(eq(motionTransferQueue.projectId, input.projectId));

      return {
        projectId: input.projectId,
        status: "processing",
        message: "Motion transfer generation started",
      };
    }),

  /**
   * Cancel motion transfer generation
   */
  cancel: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const project = await db
        .select()
        .from(motionTransferProjects)
        .where(
          and(
            eq(motionTransferProjects.id, input.projectId),
            eq(motionTransferProjects.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!project[0]) {
        throw new Error("Project not found");
      }

      await db
        .update(motionTransferProjects)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(motionTransferProjects.id, input.projectId));

      await db
        .update(motionTransferQueue)
        .set({
          status: "failed",
          completedAt: new Date(),
        })
        .where(eq(motionTransferQueue.projectId, input.projectId));

      return { success: true };
    }),

  // ─── Analytics & Stats ────────────────────────────────────────────────────

  /**
   * Get motion transfer statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
      if (!db) throw new Error("Database not available");
    const projects = await db
      .select()
      .from(motionTransferProjects)
      .where(eq(motionTransferProjects.userId, ctx.user.id));

    const completed = projects.filter((p: any) => p.status === "completed").length;
    const processing = projects.filter((p: any) => p.status === "processing").length;
    const failed = projects.filter((p: any) => p.status === "failed").length;

    const totalProcessingTime = projects
      .filter((p: any) => p.processingTimeSeconds)
      .reduce((sum: number, p: any) => sum + (p.processingTimeSeconds || 0), 0);

    const avgProcessingTime =
      completed > 0 ? totalProcessingTime / completed : 0;

    const totalCost = projects.reduce(
      (sum: number, p: any) => sum + (p.actualCostUsd || 0),
      0
    );

    return {
      total: projects.length,
      completed,
      processing,
      failed,
      avgProcessingTimeSeconds: Math.round(avgProcessingTime),
      totalCostUsd: Math.round(totalCost * 100) / 100,
    };
  }),

  /**
   * Estimate cost for motion transfer
   */
  estimateCost: protectedProcedure
    .input(
      z.object({
        videoDurationSeconds: z.number().min(1).max(3600),
        quality: z.enum(["low", "medium", "high"]).default("high"),
      })
    )
    .query(async ({ input }) => {
      // Cost: $0.01 per video (fal.ai Kling Motion Transfer)
      // + $0.001 per minute for processing
      const baseCost = 0.01;
      const processingCost = (input.videoDurationSeconds / 60) * 0.001;
      const qualityMultiplier = {
        low: 0.8,
        medium: 1.0,
        high: 1.5,
      }[input.quality];

      const totalCost = (baseCost + processingCost) * qualityMultiplier;

      return {
        baseCost,
        processingCost,
        qualityMultiplier,
        totalCostUsd: Math.round(totalCost * 10000) / 10000,
        estimatedProcessingTimeSeconds: Math.ceil(input.videoDurationSeconds * 0.3),
      };
    }),
});
