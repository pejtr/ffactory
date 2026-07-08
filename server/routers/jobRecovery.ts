/**
 * Job Recovery Router — tRPC procedures for handling stalled video generation jobs
 * 
 * Provides:
 * - Job status checking with timeout detection
 * - Manual retry functionality
 * - Job cancellation
 * - Error log retrieval
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { videoProjects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  checkJobTimeout,
  retryFailedJob,
  cancelStuckJob,
} from "../agents/jobMonitorAgent";

export const jobRecoveryRouter = router({
  /**
   * Check if a job has timed out
   * Returns timeout status and retry information
   */
  checkTimeout: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const project = await db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      if (project[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return await checkJobTimeout(input.projectId);
    }),

  /**
   * Get job status with detailed information
   */
  getJobStatus: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const project = await db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      if (project[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const proj = project[0];
      const minutesElapsed = Math.floor(
        (Date.now() - proj.updatedAt.getTime()) / 60000
      );

      return {
        id: proj.id,
        title: proj.title,
        status: proj.status,
        errorMessage: proj.errorMessage,
        minutesElapsed,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
        isStalled: minutesElapsed > 30 && proj.status !== "completed" && proj.status !== "failed",
      };
    }),

  /**
   * Manually retry a failed or stalled job
   */
  retryJob: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const project = await db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      if (project[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return await retryFailedJob(input.projectId);
    }),

  /**
   * Cancel a stuck job
   */
  cancelJob: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const project = await db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      if (project[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return await cancelStuckJob(input.projectId);
    }),

  /**
   * Get error log for a project
   */
  getErrorLog: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const project = await db
        .select()
        .from(videoProjects)
        .where(eq(videoProjects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      if (project[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const proj = project[0];
      return {
        projectId: proj.id,
        status: proj.status,
        errorMessage: proj.errorMessage,
        createdAt: proj.createdAt,
        updatedAt: proj.updatedAt,
      };
    }),

  /**
   * Get all stalled projects for current user
   */
  listStalledProjects: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const timeoutThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 min

    const stalledProjects = await db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.userId, ctx.user.id));

    return stalledProjects
      .filter((p) => p.updatedAt < timeoutThreshold && p.status !== "completed" && p.status !== "failed")
      .map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        minutesElapsed: Math.floor((Date.now() - p.updatedAt.getTime()) / 60000),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
  }),
});
