import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { videoProjects, generations } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { spendCredits, earnCredits, CREDIT_COSTS } from "../db";
import { storagePut } from "../storage";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const ShotScriptItemSchema = z.object({
  time: z.string(),
  shot: z.string(),
  camera: z.string().optional(),
  action: z.string(),
  visual_details: z.string().optional(),
});

const SeedancePromptSchema = z.object({
  model: z.string().default("seedance_2_0_non_fast"),
  mode: z.string().default("video_reference_recreation"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4"]).default("9:16"),
  duration_seconds: z.number().int().default(10),
  reference_usage: z.record(z.string(), z.string()).optional(),
  master_prompt: z.string(),
  shot_script: z.array(ShotScriptItemSchema).optional(),
  style: z.object({
    look: z.string().optional(),
    lighting: z.string().optional(),
    color_palette: z.string().optional(),
    motion: z.string().optional(),
    tone: z.string().optional(),
  }).optional(),
  negative_prompt: z.string().optional(),
  continuity_rules: z.array(z.string()).optional(),
});

export type SeedancePrompt = z.infer<typeof SeedancePromptSchema>;

// ─── Credit cost for reference recreation ────────────────────────────────────
const REFERENCE_RECREATION_COST = 30; // credits per generation

// ─── Router ──────────────────────────────────────────────────────────────────
export const referenceRecreationRouter = router({

  // Create a new reference recreation project
  createProject: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      seedancePrompt: SeedancePromptSchema,
      referenceVideoUrl: z.string().url().optional(),
      referenceUsageNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(videoProjects).values({
        userId: ctx.user.id,
        title: input.title,
        idea: input.seedancePrompt.master_prompt,
        projectType: "reference_recreation",
        referenceVideoUrl: input.referenceVideoUrl ?? null,
        referenceUsageNote: input.referenceUsageNote ?? null,
        aspectRatio: input.seedancePrompt.aspect_ratio,
        seedancePrompt: input.seedancePrompt,
        status: "draft",
      });

      return { id: (result as { insertId: number }).insertId };
    }),

  // Update project prompt
  updateProject: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      seedancePrompt: SeedancePromptSchema.optional(),
      referenceVideoUrl: z.string().url().optional().nullable(),
      referenceUsageNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, unknown> = {};
      if (input.title) updates.title = input.title;
      if (input.seedancePrompt) {
        updates.seedancePrompt = input.seedancePrompt;
        updates.aspectRatio = input.seedancePrompt.aspect_ratio;
        updates.idea = input.seedancePrompt.master_prompt;
      }
      if (input.referenceVideoUrl !== undefined) updates.referenceVideoUrl = input.referenceVideoUrl;
      if (input.referenceUsageNote) updates.referenceUsageNote = input.referenceUsageNote;

      await db.update(videoProjects)
        .set(updates)
        .where(and(eq(videoProjects.id, input.id), eq(videoProjects.userId, ctx.user.id)));

      return { success: true };
    }),

  // Get all reference recreation projects for user
  listProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select()
        .from(videoProjects)
        .where(and(
          eq(videoProjects.userId, ctx.user.id),
          eq(videoProjects.projectType, "reference_recreation")
        ))
        .orderBy(desc(videoProjects.createdAt))
        .limit(50);
    }),

  // Get single project
  getProject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [project] = await db.select()
        .from(videoProjects)
        .where(and(eq(videoProjects.id, input.id), eq(videoProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");
      return project;
    }),

  // Generate video using Seedance 2.0
  generate: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      useReferenceVideo: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Load project
      const [project] = await db.select()
        .from(videoProjects)
        .where(and(eq(videoProjects.id, input.projectId), eq(videoProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");

      const prompt = project.seedancePrompt as SeedancePrompt | null;
      if (!prompt) throw new Error("No prompt configured for this project");

      // Spend credits
      await spendCredits(ctx.user.id, REFERENCE_RECREATION_COST, "video_generation", `Seedance 2.0 Reference Recreation: ${project.title}`);

      // Update project status
      await db.update(videoProjects)
        .set({ status: "generating_scenes" })
        .where(eq(videoProjects.id, input.projectId));

      // Kick off generation asynchronously
      (async () => {
        try {
          const { seedance20TextToVideo, seedance20ReferenceRecreation } = await import("../falai");

          let videoUrl: string | null = null;

          if (input.useReferenceVideo && project.referenceVideoUrl) {
            videoUrl = await seedance20ReferenceRecreation({
              masterPrompt: prompt.master_prompt,
              referenceVideoUrl: project.referenceVideoUrl,
              referenceUsageNote: project.referenceUsageNote ?? undefined,
              negativePrompt: prompt.negative_prompt,
              aspectRatio: prompt.aspect_ratio as "16:9" | "9:16" | "1:1" | "4:3" | "3:4",
              durationSeconds: (prompt.duration_seconds <= 10 ? prompt.duration_seconds : 10) as 5 | 10,
              resolution: "720p",
            });
          } else {
            videoUrl = await seedance20TextToVideo({
              prompt: prompt.master_prompt,
              negativePrompt: prompt.negative_prompt,
              aspectRatio: prompt.aspect_ratio as "16:9" | "9:16" | "1:1" | "4:3" | "3:4",
              durationSeconds: (prompt.duration_seconds <= 10 ? prompt.duration_seconds : 10) as 5 | 10,
              resolution: "720p",
            });
          }

          await db.update(videoProjects)
            .set({
              status: videoUrl ? "completed" : "failed",
              finalVideoUrl: videoUrl,
              errorMessage: videoUrl ? null : "Generation returned no video URL",
            })
            .where(eq(videoProjects.id, input.projectId));

          // Save to generations table for history
          if (videoUrl) {
            await db.insert(generations).values({
              userId: ctx.user.id,
              type: "text_to_video",
              model: "seedance-2.0",
              prompt: prompt.master_prompt,
              status: "completed",
              outputUrl: videoUrl,
              creditsUsed: REFERENCE_RECREATION_COST,
            });
          }
        } catch (err) {
          await db.update(videoProjects)
            .set({
              status: "failed",
              errorMessage: err instanceof Error ? err.message : "Unknown error",
            })
            .where(eq(videoProjects.id, input.projectId));
        }
      })();

      return { projectId: input.projectId, status: "generating" };
    }),

  // Poll project status (for frontend polling)
  pollStatus: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [project] = await db.select({
        id: videoProjects.id,
        status: videoProjects.status,
        finalVideoUrl: videoProjects.finalVideoUrl,
        errorMessage: videoProjects.errorMessage,
        updatedAt: videoProjects.updatedAt,
      })
        .from(videoProjects)
        .where(and(eq(videoProjects.id, input.projectId), eq(videoProjects.userId, ctx.user.id)))
        .limit(1);
      if (!project) throw new Error("Project not found");
      return project;
    }),

  // Upload reference video to S3 and return URL
  uploadReferenceVideo: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileBase64: z.string(), // base64 encoded video
      mimeType: z.string().default("video/mp4"),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length > 50 * 1024 * 1024) {
        throw new Error("File too large (max 50MB)");
      }
      const suffix = Date.now().toString(36);
      const key = `reference-videos/${ctx.user.id}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // Get credit cost
  getCost: protectedProcedure.query(() => ({
    referenceRecreation: REFERENCE_RECREATION_COST,
  })),
});
