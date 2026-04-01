import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createVideoProject, getVideoProject, getUserProjects, getProjectScenes,
  getProjectAudioTracks, getVideoProjectByToken,
  getUserCharacters, createCharacter, getCharacter, updateCharacterSoulId, deleteCharacter,
  updateCharacterReferenceImages, addCharacterReferenceImage, removeCharacterReferenceImage,
  type ReferenceImage,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { generateScreenplay, calculateTotalCost } from "./screenplay";
import { runVideoPipeline } from "./pipeline";
import { elevenLabsListVoices } from "./audio";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { isFalAvailable, validateFalApiKey } from "./falai";

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

  models: router({
    // Returns which AI models are currently available (based on configured API keys)
    status: publicProcedure.query(async () => {
      return {
        kling: true,                    // Always available (keys pre-configured)
        hailuo: isFalAvailable(),       // Requires FAL_API_KEY
        wan22: isFalAvailable(),        // Requires FAL_API_KEY
        elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
        kie: Boolean(process.env.KIE_API_KEY),
      };
    }),

    // Validate FAL API key (admin use)
    validateFal: protectedProcedure.mutation(async () => {
      return validateFalApiKey();
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
