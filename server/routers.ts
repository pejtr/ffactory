import { z } from "zod";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createVideoProject, getVideoProject, getUserProjects, getProjectScenes,
  getProjectAudioTracks, getVideoProjectByToken,
  cancelVideoProject, resetSceneForRegeneration, resetProjectForRegeneration,
  getUserCharacters, createCharacter, getCharacter, updateCharacterSoulId, deleteCharacter,
  updateCharacterReferenceImages, addCharacterReferenceImage, removeCharacterReferenceImage,
  type ReferenceImage,
  getUserCredits, getCreditHistory, earnCredits, spendCredits, CREDIT_COSTS,
  createGeneration, getGeneration, updateGeneration, getUserGenerations,
  createStoryNotebook, getStoryNotebook, getUserStoryNotebooks, updateStoryNotebook, deleteStoryNotebook,
  createStorySource, getNotebookSources, updateStorySource, deleteStorySource,
  createStoryScript, getStoryScript, getNotebookScripts, updateStoryScript, deleteStoryScript,
  createStoryThumbnail, getScriptThumbnails, setSelectedThumbnail,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { generateScreenplay, calculateTotalCost } from "./screenplay";
import { runVideoPipeline } from "./pipeline";
import { elevenLabsListVoices } from "./audio";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { storyRouter } from "./routers/story";
import { templatesRouter } from "./routers/templates";
import { gamificationRouter } from "./routers/gamification";
import { referralRouter } from "./routers/referral";
import { referenceRecreationRouter } from "./routers/referenceRecreation";
import { youtubeRouter } from "./routers/youtube";
import { agentsRouter } from "./routers/agents";
import { motionTransferRouter } from "./routers/motionTransfer";
import { jobRecoveryRouter } from "./routers/jobRecovery";
import { higgsFieldRouter } from "./routers/higgsfield";
import { humanPlusRouter } from "./routers/humanPlus";

export const appRouter = router({
  system: systemRouter,
  story: storyRouter,
  scriptTemplates: templatesRouter,
  gamification: gamificationRouter,
  referral: referralRouter,
  refRecreation: referenceRecreationRouter,
  youtube: youtubeRouter,
  agents: agentsRouter,
  motionTransfer: motionTransferRouter,
  jobRecovery: jobRecoveryRouter,
  higgsfield: higgsFieldRouter,
  humanPlus: humanPlusRouter,
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
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await getVideoProject(input.id);
        if (!project || project.userId !== ctx.user.id) throw new Error("Not found");
        await cancelVideoProject(input.id);
        return { success: true };
      }),
    regenerateScene: protectedProcedure
      .input(z.object({ projectId: z.number(), sceneId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await getVideoProject(input.projectId);
        if (!project || project.userId !== ctx.user.id) throw new Error("Not found");
        await resetSceneForRegeneration(input.sceneId);
        // Fire pipeline for just this scene in background
        runVideoPipeline(input.projectId).catch((e) =>
          console.error(`[Pipeline] Regen scene error for project ${input.projectId}:`, e)
        );
        return { success: true };
      }),
    regenerateProject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const project = await getVideoProject(input.id);
        if (!project || project.userId !== ctx.user.id) throw new Error("Not found");
        await resetProjectForRegeneration(input.id);
        runVideoPipeline(input.id).catch((e) =>
          console.error(`[Pipeline] Regen project error for project ${input.id}:`, e)
        );
        return { success: true };
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

  upload: router({
    // Upload a single reference image for a character (base64 encoded)
    characterPhoto: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        base64: z.string(),          // data:image/jpeg;base64,...
        mimeType: z.string().default("image/jpeg"),
        label: z.string().default("Referenční fotka"),
        isMultiView: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");

        // Decode base64 and upload to S3
        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = input.mimeType === "image/png" ? "png" : "jpg";
        const key = `characters/${ctx.user.id}/${input.characterId}/ref-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        const existing = (character.referenceImages as ReferenceImage[] | null) ?? [];
        const updated = await addCharacterReferenceImage(input.characterId, {
          url,
          label: input.label,
          isMultiView: input.isMultiView,
        }, existing);
        return { url, images: updated };
      }),

    removeCharacterPhoto: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        imageUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        const existing = (character.referenceImages as ReferenceImage[] | null) ?? [];
        const updated = await removeCharacterReferenceImage(input.characterId, input.imageUrl, existing);
        return { images: updated };
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

  credits: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      const balance = await getUserCredits(ctx.user.id);
      return { balance };
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return getCreditHistory(ctx.user.id);
    }),
    costs: publicProcedure.query(() => CREDIT_COSTS),
    earn: protectedProcedure
      .input(z.object({ amount: z.number().positive(), type: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await earnCredits(ctx.user.id, input.amount, input.type as Parameters<typeof earnCredits>[2], input.description);
        return { success: true };
      }),
  }),

  generate: router({
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getUserGenerations(ctx.user.id, input.limit ?? 20);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const gen = await getGeneration(input.id);
        if (!gen || gen.userId !== ctx.user.id) return null;
        return gen;
      }),
    nanoBanana: protectedProcedure
      .input(z.object({ prompt: z.string().min(1), width: z.number().optional(), height: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const spent = await spendCredits(ctx.user.id, CREDIT_COSTS.generate_hub, 'generate_hub', 'Nano Banana 2 T2I');
        if (!spent) throw new Error('Nedostatek kreditů');
        const { falGenerateImage } = await import('./falai');
        const imageUrl = await falGenerateImage({ prompt: input.prompt, modelId: 'fal-ai/nano-banana-2' });
        const id = await createGeneration({ userId: ctx.user.id, type: 'text_to_image', model: 'nano-banana-2', prompt: input.prompt, status: 'completed', outputUrl: imageUrl, creditsUsed: CREDIT_COSTS.generate_hub });
        return { id, imageUrl };
      }),
    seedream: protectedProcedure
      .input(z.object({ prompt: z.string().min(1), imageUrls: z.array(z.string()).optional() }))
      .mutation(async ({ ctx, input }) => {
        const spent = await spendCredits(ctx.user.id, CREDIT_COSTS.generate_hub, 'generate_hub', 'Seedream 5');
        if (!spent) throw new Error('Nedostatek kreditů');
        const { falGenerateImage } = await import('./falai');
        const imageUrl = await falGenerateImage({ prompt: input.prompt, modelId: 'fal-ai/bytedance/seedream/v5/lite', imageUrl: input.imageUrls?.[0] });
        const id = await createGeneration({ userId: ctx.user.id, type: input.imageUrls?.length ? 'image_to_image' : 'text_to_image', model: 'seedream-5', prompt: input.prompt, status: 'completed', outputUrl: imageUrl, creditsUsed: CREDIT_COSTS.generate_hub });
        return { id, imageUrl };
      }),
    klingI2V: protectedProcedure
      .input(z.object({ prompt: z.string().min(1), imageUrl: z.string(), duration: z.enum(['5', '10']).default('5'), aspectRatio: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const cost = CREDIT_COSTS.motion_generation;
        const spent = await spendCredits(ctx.user.id, cost, 'motion_generation', 'Kling I2V');
        if (!spent) throw new Error('Nedostatek kreditů');
        const { klingImageToVideo } = await import('./kling');
        const result = await klingImageToVideo({ prompt: input.prompt, imageUrl: input.imageUrl, duration: input.duration, modelName: 'kling-v3' });
        const id = await createGeneration({ userId: ctx.user.id, type: 'image_to_video', model: 'kling-3.0', prompt: input.prompt, status: result.status === 'completed' ? 'completed' : 'generating', outputUrl: result.videoUrl ?? null, creditsUsed: cost });
        return { id, videoUrl: result.videoUrl, status: result.status };
      }),
    klingEdit: protectedProcedure
      .input(z.object({ prompt: z.string().min(1), videoUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const cost = CREDIT_COSTS.video_edit;
        const spent = await spendCredits(ctx.user.id, cost, 'video_edit', 'Kling Video Edit');
        if (!spent) throw new Error('Nedostatek kreditů');
        // Use fal.ai Hailuo as video edit fallback (Kling O1 edit requires direct API access)
        const { hailiuoTextToVideo } = await import('./falai');
        const videoUrl = await hailiuoTextToVideo({ prompt: `Edit video with instruction: ${input.prompt}` });
        const id = await createGeneration({ userId: ctx.user.id, type: 'video_edit', model: 'kling-o1-edit', prompt: input.prompt, status: 'completed', outputUrl: videoUrl, creditsUsed: cost });
        return { id, videoUrl };
      }),
    motionControl: protectedProcedure
      .input(z.object({ imageUrl: z.string(), motionVideoUrl: z.string().optional(), prompt: z.string().optional(), duration: z.enum(['5', '10']).default('5') }))
      .mutation(async ({ ctx, input }) => {
        const cost = CREDIT_COSTS.motion_generation;
        const spent = await spendCredits(ctx.user.id, cost, 'motion_generation', 'Kling Motion Control');
        if (!spent) throw new Error('Nedostatek kreditů');
        const { klingImageToVideo } = await import('./kling');
        const result = await klingImageToVideo({ prompt: input.prompt ?? 'Motion control animation', imageUrl: input.imageUrl, duration: input.duration, modelName: 'kling-v3' });
        const id = await createGeneration({ userId: ctx.user.id, type: 'motion_control', model: 'kling-motion', prompt: input.prompt ?? '', status: result.status === 'completed' ? 'completed' : 'generating', outputUrl: result.videoUrl ?? null, creditsUsed: cost });
        return { id, videoUrl: result.videoUrl, status: result.status };
      }),
  }),

  chatbot: router({
    ask: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        context: z.string().optional(), // current page context
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Jsi Lucie, AI asistentka Video Factory — profesionálního Hollywood-grade nástroje pro tvorbu AI vidé z nápadu.

Tvůj úkol: Dokonale navést uživatele krok za krokem. Jsi přátelská, odborná, konkrétní a inspirativní.

Co umí Video Factory:
1. STUDIO — Zadáš nápad na video (napr. "Pilot seriálu Stargate: Legacy"), vybereš žánr, emoční tón, délku. AI vygeneruje scénář a pak celé video.
2. SOUL CINEMA — Vytvoříš konzistentní postavy (jméno, popis, osobnost, hlas). Nahráš až 5 referenčních fotek nebo jeden "character sheet" (4 záběry z různých úhlů na jedné fotce). Soul ID zajistí konzistenci obličeje ve všech scénách.
3. MODELY: Kling 3.0 Omni (dialogy s nativním zvukem), Hailuo MiniMax 2.3 (kinematografický B-roll), WAN 2.2 Speech-to-Video (lip sync), Kling Motion Control (akce).
4. AUDIO: ElevenLabs TTS (hlasy postav), Kie.ai Music (originelní hudba).
5. SDILENÍ: Každé video dostane sdílelný odkaz.

Aktuální stránka: ${input.context ?? "hlavní stránka"}

Odpovídej vždy česky. Buď konkrétní, navrhuj přísné další kroky. Používej emoji umírneně pro přehlednost.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...(input.history ?? []).map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user" as const, content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const reply = response.choices?.[0]?.message?.content ?? "Omlouvám se, nemohu teď odpovědět.";
        return { reply };
      }),
  }),
});
// ─── Chatbot (Lucie) ──────────────────────────────────────────────────────────
// Note: streaming via standard tRPC mutation returning full text (SSE upgrade later)
export type AppRouter = typeof appRouter;
