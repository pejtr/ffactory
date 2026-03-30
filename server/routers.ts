import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createVideoProject, getVideoProject, getUserProjects, getProjectScenes,
  getProjectAudioTracks, getVideoProjectByToken,
  getUserCharacters, createCharacter, getCharacter, updateCharacterSoulId, deleteCharacter,
} from "./db";
import { generateScreenplay, calculateTotalCost } from "./screenplay";
import { runVideoPipeline } from "./pipeline";
import { elevenLabsListVoices } from "./audio";
import { generateImage } from "./_core/imageGeneration";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  video: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserProjects(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getVideoProject(input.id);
        if (!project || project.userId !== ctx.user.id) return null;
        const projectScenes = await getProjectScenes(input.id);
        const tracks = await getProjectAudioTracks(input.id);
        return { project, scenes: projectScenes, audioTracks: tracks };
      }),

    getShared: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const project = await getVideoProjectByToken(input.token);
        if (!project) return null;
        const projectScenes = await getProjectScenes(project.id);
        return { project, scenes: projectScenes };
      }),

    preview: protectedProcedure
      .input(z.object({
        idea: z.string().min(10).max(2000),
        genre: z.string().optional(),
        emotionalTone: z.string().optional(),
        dreamMode: z.boolean().optional(),
        targetDuration: z.number().min(15).max(300).optional(),
      }))
      .mutation(async ({ input }) => {
        const screenplay = await generateScreenplay({
          idea: input.idea,
          genre: input.genre,
          emotionalTone: input.emotionalTone,
          dreamMode: input.dreamMode,
          targetDuration: input.targetDuration ?? 60,
        });
        const estimatedCost = calculateTotalCost(screenplay);
        return { screenplay, estimatedCostUsd: estimatedCost };
      }),

    create: protectedProcedure
      .input(z.object({
        idea: z.string().min(10).max(2000),
        genre: z.string().optional(),
        emotionalTone: z.string().optional(),
        dreamMode: z.boolean().optional(),
        targetDuration: z.number().min(15).max(300).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await createVideoProject({
          userId: ctx.user.id,
          title: "Generating...",
          idea: input.idea,
          genre: input.genre,
          emotionalTone: input.emotionalTone,
          dreamMode: input.dreamMode,
          targetDuration: input.targetDuration ?? 60,
        });
        if (!projectId) throw new Error("Failed to create project");
        runVideoPipeline(projectId).catch((e) =>
          console.error(`[Pipeline] Background error for project ${projectId}:`, e)
        );
        return { projectId };
      }),

    status: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await getVideoProject(input.id);
        if (!project || project.userId !== ctx.user.id) return null;
        const projectScenes = await getProjectScenes(input.id);
        const completedScenes = projectScenes.filter((s) => s.status === "completed").length;
        const totalScenes = projectScenes.length;
        return {
          status: project.status,
          title: project.title,
          completedScenes,
          totalScenes,
          progress: totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0,
          estimatedCostUsd: project.estimatedCostUsd,
          shareToken: project.shareToken,
          finalVideoUrl: project.finalVideoUrl,
          errorMessage: project.errorMessage,
          scenes: projectScenes,
        };
      }),
  }),

  characters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCharacters(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        personality: z.string().optional(),
        voiceId: z.string().optional(),
        voiceName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCharacter({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          personality: input.personality,
          voiceId: input.voiceId,
          voiceName: input.voiceName,
        });
        return { id };
      }),

    generateSoulId: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        style: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        const prompt = `Portrait of ${character.name}, ${character.description ?? "a character"}, ${input.style ?? "cinematic lighting, photorealistic, 8K, detailed face, consistent character design"}, professional film still, high quality`;
        const { url: rawUrl } = await generateImage({ prompt });
        const url = rawUrl ?? "";
        await updateCharacterSoulId(input.characterId, url);
        return { soulIdImageUrl: url };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const character = await getCharacter(input.id);
        if (!character || character.userId !== ctx.user.id) return null;
        return character;
      }),
    delete: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        await deleteCharacter(input.characterId);
        return { success: true };
      }),
  }),

  audio: router({
    listVoices: protectedProcedure.query(async () => {
      try {
        const data = await elevenLabsListVoices() as { voices: unknown[] };
        return data.voices ?? [];
      } catch { return []; }
    }),
  }),
});

export type AppRouter = typeof appRouter;
