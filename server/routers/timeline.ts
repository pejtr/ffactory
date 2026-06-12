import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { timelineProjects, timelineClips, renderedVideos, renderingQueue } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { ffmpegRenderer, type ClipData, type RenderOptions } from "../ffmpegRenderer";
import * as fs from "fs";
import * as path from "path";

/**
 * Timeline Editor Router
 * Manages timeline projects, clips, and video rendering
 * 
 * Fixes:
 * - Proper clip concatenation (FFmpeg concat demuxer)
 * - BGM mixing support
 * - Download endpoint for rendered videos
 */
export const timelineRouter = router({
  /**
   * Create a new timeline project
   */
  createProject: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3"]).default("16:9"),
        fps: z.number().int().min(24).max(60).default(30),
        resolution: z.enum(["720p", "1080p", "2K", "4K"]).default("1080p"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.insert(timelineProjects).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        aspectRatio: input.aspectRatio,
        fps: input.fps,
        resolution: input.resolution,
        status: "draft",
        clipsCount: 0,
        totalDuration: 0,
      });

      // Get the created project
      const projects = await db
        .select()
        .from(timelineProjects)
        .where(eq(timelineProjects.userId, ctx.user.id))
        .orderBy(desc(timelineProjects.createdAt))
        .limit(1);

      return { id: projects[0].id, ...input };
    }),

  /**
   * Get timeline project details
   */
  getProject: protectedProcedure
    .input(z.object({ projectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const project = await db
        .select()
        .from(timelineProjects)
        .where(and(eq(timelineProjects.id, input.projectId), eq(timelineProjects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      const clips = await db
        .select()
        .from(timelineClips)
        .where(eq(timelineClips.projectId, input.projectId))
        .orderBy((t) => t.position);

      return {
        ...project[0],
        clips: clips.map((c) => ({
          ...c,
          effects: c.effects ? JSON.parse(c.effects as string) : null,
          textStyle: c.textStyle ? JSON.parse(c.textStyle as string) : null,
        })),
      };
    }),

  /**
   * Add a clip to timeline
   */
  addClip: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
        type: z.enum(["video", "image", "text", "audio", "transition"]),
        sourceUrl: z.string().optional(),
        duration: z.number().positive(),
        effects: z.record(z.string(), z.any()).optional(),
        text: z.string().optional(),
        textStyle: z.record(z.string(), z.any()).optional(),
        transitionType: z.string().optional(),
        transitionDuration: z.number().default(0.5),
        watermarkUrl: z.string().optional(),
        watermarkOpacity: z.number().min(0).max(1).default(0.5),
        watermarkPosition: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify project ownership
      const project = await db
        .select()
        .from(timelineProjects)
        .where(and(eq(timelineProjects.id, input.projectId), eq(timelineProjects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      // Get last clip position
      const lastClip = await db
        .select({ position: timelineClips.position })
        .from(timelineClips)
        .where(eq(timelineClips.projectId, input.projectId))
        .orderBy(desc(timelineClips.position))
        .limit(1);

      const nextPosition = (lastClip[0]?.position ?? -1) + 1;

      // Insert clip
      await db.insert(timelineClips).values({
        projectId: input.projectId,
        position: nextPosition,
        type: input.type,
        sourceUrl: input.sourceUrl,
        duration: input.duration,
        trimStart: 0,
        trimEnd: input.duration,
        effects: input.effects ? JSON.stringify(input.effects) : null,
        text: input.text,
        textStyle: input.textStyle ? JSON.stringify(input.textStyle) : null,
        transitionType: input.transitionType,
        transitionDuration: input.transitionDuration || 0.5,
        watermarkUrl: input.watermarkUrl,
        watermarkOpacity: input.watermarkOpacity || 0.5,
        watermarkPosition: input.watermarkPosition,
        audioVolume: 1,
        audioFadeIn: 0,
        audioFadeOut: 0,
      });

      // Get the created clip
      const clips = await db
        .select()
        .from(timelineClips)
        .where(eq(timelineClips.projectId, input.projectId))
        .orderBy(desc(timelineClips.createdAt))
        .limit(1);

      // Update project clips count and total duration
      const newClipsCount = (project[0].clipsCount ?? 0) + 1;
      const newTotalDuration = (project[0].totalDuration ?? 0) + input.duration;

      await db
        .update(timelineProjects)
        .set({
          clipsCount: newClipsCount,
          totalDuration: newTotalDuration,
        })
        .where(eq(timelineProjects.id, input.projectId));

      return { id: clips[0].id, ...input };
    }),

  /**
   * Update a clip
   */
  updateClip: protectedProcedure
    .input(
      z.object({
        clipId: z.number().int(),
        projectId: z.number().int(),
        duration: z.number().positive().optional(),
        effects: z.record(z.string(), z.any()).optional(),
        text: z.string().optional(),
        textStyle: z.record(z.string(), z.any()).optional(),
        transitionType: z.string().optional(),
        transitionDuration: z.number().optional(),
        watermarkOpacity: z.number().optional(),
        watermarkPosition: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify ownership
      const clip = await db
        .select()
        .from(timelineClips)
        .where(eq(timelineClips.id, input.clipId))
        .limit(1);

      if (!clip.length) throw new Error("Clip not found");

      const project = await db
        .select()
        .from(timelineProjects)
        .where(and(eq(timelineProjects.id, input.projectId), eq(timelineProjects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) throw new Error("Project not found");

      // Update clip
      await db
        .update(timelineClips)
        .set({
          duration: input.duration,
          effects: input.effects ? JSON.stringify(input.effects) : undefined,
          text: input.text,
          textStyle: input.textStyle ? JSON.stringify(input.textStyle) : undefined,
          transitionType: input.transitionType,
          transitionDuration: input.transitionDuration,
          watermarkOpacity: input.watermarkOpacity,
          watermarkPosition: input.watermarkPosition,
        })
        .where(eq(timelineClips.id, input.clipId));

      return { success: true };
    }),

  /**
   * Delete a clip
   */
  deleteClip: protectedProcedure
    .input(z.object({ clipId: z.number().int(), projectId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify ownership
      const project = await db
        .select()
        .from(timelineProjects)
        .where(and(eq(timelineProjects.id, input.projectId), eq(timelineProjects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) throw new Error("Project not found");

      // Get clip to get duration
      const clip = await db
        .select()
        .from(timelineClips)
        .where(eq(timelineClips.id, input.clipId))
        .limit(1);

      if (clip.length) {
        // Update project duration
        const newTotalDuration = Math.max(0, (project[0].totalDuration ?? 0) - clip[0].duration);
        const newClipsCount = Math.max(0, (project[0].clipsCount ?? 0) - 1);

        await db
          .update(timelineProjects)
          .set({
            totalDuration: newTotalDuration,
            clipsCount: newClipsCount,
          })
          .where(eq(timelineProjects.id, input.projectId));
      }

      // Delete clip
      await db.delete(timelineClips).where(eq(timelineClips.id, input.clipId));

      return { success: true };
    }),

  /**
   * Start rendering timeline to video
   */
  renderVideo: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int(),
        mode: z.enum(["realtime", "batch"]).default("realtime"),
        priority: z.number().int().min(1).max(10).default(5),
        bgmUrl: z.string().optional(),
        bgmVolume: z.number().min(0).max(1).default(0.3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify project ownership
      const project = await db
        .select()
        .from(timelineProjects)
        .where(and(eq(timelineProjects.id, input.projectId), eq(timelineProjects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      // Create rendered video record
      await db.insert(renderedVideos).values({
        projectId: input.projectId,
        userId: ctx.user.id,
        status: "queued",
        progress: 0,
      });

      // Get the created video
      const videos = await db
        .select()
        .from(renderedVideos)
        .where(and(eq(renderedVideos.projectId, input.projectId), eq(renderedVideos.userId, ctx.user.id)))
        .orderBy(desc(renderedVideos.createdAt))
        .limit(1);

      const videoId = videos[0].id;

      // Add to rendering queue
      await db.insert(renderingQueue).values({
        videoId: videoId,
        priority: input.priority,
        mode: input.mode,
        status: "pending",
        bgmUrl: input.bgmUrl,
        bgmVolume: input.bgmVolume,
      });

      return { videoId: videoId, status: "queued", downloadUrl: null };
    }),

  /**
   * Get rendering progress
   */
  getProgress: protectedProcedure
    .input(z.object({ videoId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const video = await db.select().from(renderedVideos).where(eq(renderedVideos.id, input.videoId)).limit(1);

      if (!video.length || video[0].userId !== ctx.user.id) {
        throw new Error("Video not found");
      }

      return {
        status: video[0].status,
        progress: video[0].progress,
        outputUrl: video[0].outputUrl,
        errorMessage: video[0].errorMessage,
      };
    }),

  /**
   * Get download URL for rendered video
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ videoId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const video = await db.select().from(renderedVideos).where(eq(renderedVideos.id, input.videoId)).limit(1);

      if (!video.length || video[0].userId !== ctx.user.id) {
        throw new Error("Video not found");
      }

      if (video[0].status !== "completed" || !video[0].outputUrl) {
        throw new Error("Video not ready for download");
      }

      return {
        downloadUrl: video[0].outputUrl,
        filename: `timeline_${video[0].projectId}_${video[0].id}.mp4`,
      };
    }),

  /**
   * List rendered videos for a project
   */
  listRenderedVideos: protectedProcedure
    .input(z.object({ projectId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const videos = await db
        .select()
        .from(renderedVideos)
        .where(and(eq(renderedVideos.projectId, input.projectId), eq(renderedVideos.userId, ctx.user.id)))
        .orderBy(desc(renderedVideos.createdAt));

      return videos;
    }),

  /**
   * Delete a timeline project
   */
  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify project ownership
      const project = await db
        .select()
        .from(timelineProjects)
        .where(and(eq(timelineProjects.id, input.projectId), eq(timelineProjects.userId, ctx.user.id)))
        .limit(1);

      if (!project.length) {
        throw new Error("Project not found");
      }

      // Delete clips
      await db.delete(timelineClips).where(eq(timelineClips.projectId, input.projectId));

      // Delete rendered videos
      const videos = await db
        .select({ id: renderedVideos.id })
        .from(renderedVideos)
        .where(eq(renderedVideos.projectId, input.projectId));

      for (const video of videos) {
        await db.delete(renderingQueue).where(eq(renderingQueue.videoId, video.id));
        await db.delete(renderedVideos).where(eq(renderedVideos.id, video.id));
      }

      // Delete project
      await db.delete(timelineProjects).where(eq(timelineProjects.id, input.projectId));

      return { success: true };
    }),
});
