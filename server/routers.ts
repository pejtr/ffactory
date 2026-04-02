import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createVideoProject, getVideoProject, getUserProjects, getProjectScenes,
  getProjectAudioTracks, getVideoProjectByToken,
  getUserCharacters, createCharacter, getCharacter, updateCharacter,
  updateCharacterSoulId, deleteCharacter,
  updateCharacterReferenceImages, addCharacterReferenceImage, removeCharacterReferenceImage,
  incrementCharacterUsage,
  getUserCredits, spendCredits, earnCredits, getCreditTransactions,
  CREDIT_COSTS,
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
import {
  klingTextToVideo, klingImageToVideo, klingPollTask, KLING_CAMERA_PRESETS,
} from "./kling";

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

  // ─── Models status ─────────────────────────────────────────────────────────
  models: router({
    status: publicProcedure.query(async () => ({
      kling: true,
      hailuo: isFalAvailable(),
      wan22: isFalAvailable(),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
      kie: Boolean(process.env.KIE_API_KEY),
    })),
    validateFal: protectedProcedure.mutation(async () => validateFalApiKey()),
    // Vrátí dostupné Kling Motion presety
    klingMotionPresets: publicProcedure.query(() => {
      return Object.entries(KLING_CAMERA_PRESETS).map(([key, value]) => ({
        id: key,
        label: MOTION_PRESET_LABELS[key] ?? key,
        config: value,
      }));
    }),
  }),

  // ─── Video ─────────────────────────────────────────────────────────────────
  video: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserProjects(ctx.user.id)),

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
          idea: input.idea, genre: input.genre,
          emotionalTone: input.emotionalTone, dreamMode: input.dreamMode,
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
        // Zkontroluj kredity před spuštěním
        const userCredits = await getUserCredits(ctx.user.id);
        if (userCredits.balance < CREDIT_COSTS.video_generation) {
          throw new Error(`Nedostatek kreditů. Potřebuješ ${CREDIT_COSTS.video_generation} kreditů, máš ${userCredits.balance}.`);
        }
        const projectId = await createVideoProject({
          userId: ctx.user.id, title: "Generuji...",
          idea: input.idea, genre: input.genre,
          emotionalTone: input.emotionalTone, dreamMode: input.dreamMode,
          targetDuration: input.targetDuration ?? 60,
        });
        if (!projectId) throw new Error("Failed to create project");
        // Odečti kredity za spuštění
        await spendCredits(ctx.user.id, CREDIT_COSTS.video_generation, "video_generation",
          "Generování videa", projectId);
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
          status: project.status, title: project.title,
          completedScenes, totalScenes,
          progress: totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0,
          estimatedCostUsd: project.estimatedCostUsd,
          shareToken: project.shareToken, finalVideoUrl: project.finalVideoUrl,
          errorMessage: project.errorMessage, scenes: projectScenes,
        };
      }),
  }),

  // ─── Characters (Soul Cinema) ───────────────────────────────────────────────
  characters: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserCharacters(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        personality: z.string().optional(),
        voiceId: z.string().optional(),
        voiceName: z.string().optional(),
        tags: z.array(z.string()).optional(),
        motionPreset: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCharacter({
          userId: ctx.user.id, name: input.name,
          description: input.description, personality: input.personality,
          voiceId: input.voiceId, voiceName: input.voiceName,
          tags: input.tags,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        description: z.string().optional(),
        personality: z.string().optional(),
        voiceId: z.string().optional(),
        voiceName: z.string().optional(),
        defaultEmotion: z.string().optional(),
        motionPreset: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.id);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        await updateCharacter(input.id, {
          name: input.name, description: input.description,
          personality: input.personality, voiceId: input.voiceId,
          voiceName: input.voiceName, defaultEmotion: input.defaultEmotion,
          motionPreset: input.motionPreset, tags: input.tags,
        });
        return { success: true };
      }),

    generateSoulId: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        style: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        // Zkontroluj kredity
        const userCredits = await getUserCredits(ctx.user.id);
        if (userCredits.balance < CREDIT_COSTS.soul_id_generation) {
          throw new Error(`Nedostatek kreditů pro Soul ID (potřeba ${CREDIT_COSTS.soul_id_generation}).`);
        }
        // Sestavit prompt — použij referenční fotky pokud jsou k dispozici
        const refImages = (character.referenceImages as ReferenceImage[] | null) ?? [];
        const hasRef = refImages.length > 0 || character.referenceImageUrl;
        const prompt = hasRef
          ? `Consistent character portrait of ${character.name}, based on reference: ${character.description ?? "character"}, ${input.style ?? "cinematic lighting, photorealistic, 8K, detailed face, film still"}`
          : `Portrait of ${character.name}, ${character.description ?? "a character"}, ${input.style ?? "cinematic lighting, photorealistic, 8K, detailed face, consistent character design"}, professional film still`;
        const { url: rawUrl } = await generateImage({ prompt });
        const url = rawUrl ?? "";
        await updateCharacterSoulId(input.characterId, url);
        // Odečti kredity
        await spendCredits(ctx.user.id, CREDIT_COSTS.soul_id_generation, "soul_id_generation",
          `Soul ID pro ${character.name}`);
        return { soulIdImageUrl: url };
      }),

    // Kling Motion — vygeneruj video pro postavu s pohybem kamery
    generateMotion: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        prompt: z.string().min(5).max(2000),
        motionPreset: z.string().default("static"),
        imageUrl: z.string().url().optional(),  // pokud není, použije Soul ID
        duration: z.union([z.literal(5), z.literal(10)]).default(5),
        aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        // Zkontroluj kredity
        const userCredits = await getUserCredits(ctx.user.id);
        if (userCredits.balance < CREDIT_COSTS.scene_generation) {
          throw new Error(`Nedostatek kreditů (potřeba ${CREDIT_COSTS.scene_generation}).`);
        }
        const cameraPreset = KLING_CAMERA_PRESETS[input.motionPreset as keyof typeof KLING_CAMERA_PRESETS];
        const sourceImageUrl = input.imageUrl ?? character.soulIdImageUrl ?? character.referenceImageUrl;
        let taskId: string;
        if (sourceImageUrl) {
          // Image-to-Video s pohybem kamery
          taskId = await klingImageToVideo({
            imageUrl: sourceImageUrl,
            prompt: input.prompt,
            modelName: "kling-v1-5",
            mode: "pro",
            duration: String(input.duration) as "5" | "10",
          cameraControl: cameraPreset,
          });
        } else {
          // Text-to-Video
          taskId = await klingTextToVideo({
            prompt: `${character.name}: ${input.prompt}`,
            modelName: "kling-v1-5",
            mode: "pro",
            duration: String(input.duration) as "5" | "10",
            aspectRatio: input.aspectRatio,
            cameraControl: cameraPreset,
          });
        }
        // Poll na výsledek (max 5 minut)
        const videoUrl = await klingPollTask(taskId, sourceImageUrl ? "i2v" : "t2v", 300_000);
        // Odečti kredity a zaznamenej použití
        await spendCredits(ctx.user.id, CREDIT_COSTS.scene_generation, "scene_generation",
          `Kling Motion: ${character.name}`);
        await incrementCharacterUsage(input.characterId, 0);
        return { videoUrl, taskId };
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

  // ─── Upload ─────────────────────────────────────────────────────────────────
  upload: router({
    characterPhoto: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        label: z.string().default("Referenční fotka"),
        isMultiView: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const ext = input.mimeType === "image/png" ? "png" : "jpg";
        const key = `characters/${ctx.user.id}/${input.characterId}/ref-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const existing = (character.referenceImages as ReferenceImage[] | null) ?? [];
        const updated = await addCharacterReferenceImage(input.characterId, {
          url, label: input.label, isMultiView: input.isMultiView,
        }, existing);
        return { url, images: updated };
      }),

    removeCharacterPhoto: protectedProcedure
      .input(z.object({ characterId: z.number(), imageUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const character = await getCharacter(input.characterId);
        if (!character || character.userId !== ctx.user.id) throw new Error("Character not found");
        const existing = (character.referenceImages as ReferenceImage[] | null) ?? [];
        const updated = await removeCharacterReferenceImage(input.characterId, input.imageUrl, existing);
        return { images: updated };
      }),
  }),

  // ─── Audio ──────────────────────────────────────────────────────────────────
  audio: router({
    listVoices: protectedProcedure.query(async () => {
      try {
        const data = await elevenLabsListVoices() as { voices: unknown[] };
        return data.voices ?? [];
      } catch { return []; }
    }),
  }),

  // ─── Credits ────────────────────────────────────────────────────────────────
  credits: router({
    // Vrátí aktuální zůstatek a historii transakcí
    balance: protectedProcedure.query(async ({ ctx }) => {
      const userCredits = await getUserCredits(ctx.user.id);
      const transactions = await getCreditTransactions(ctx.user.id, 10);
      return {
        balance: userCredits.balance,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
        transactions,
      };
    }),

    // Celá historie transakcí
    history: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ ctx, input }) => {
        return getCreditTransactions(ctx.user.id, input.limit);
      }),

    // Admin: přidat kredity uživateli
    adminGrant: protectedProcedure
      .input(z.object({ amount: z.number().min(1).max(10000), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Pouze admin může přidávat kredity");
        return earnCredits(ctx.user.id, input.amount, "admin_grant",
          input.description ?? `Admin grant ${input.amount} kreditů`);
      }),

    // Ceny modelů (pro zobrazení v UI)
    costs: publicProcedure.query(() => ({
      video_generation: CREDIT_COSTS.video_generation,
      scene_generation: CREDIT_COSTS.scene_generation,
      soul_id_generation: CREDIT_COSTS.soul_id_generation,
    })),
  }),

  // ─── Chatbot (Lucie) ────────────────────────────────────────────────────────
  chatbot: router({
    ask: publicProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        context: z.string().optional(),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Jsi Lucie, AI asistentka Video Factory — profesionálního Hollywood-grade nástroje pro tvorbu AI videí z nápadu.

Tvůj úkol: Dokonale navést uživatele krok za krokem. Jsi přátelská, odborná, konkrétní a inspirativní.

Co umí Video Factory:
1. STUDIO — Zadáš nápad na video, vybereš žánr, emoční tón, délku. AI vygeneruje scénář a pak celé video.
2. SOUL CINEMA — Vytvoříš konzistentní postavy (jméno, popis, osobnost, hlas). Nahráš až 5 referenčních fotek nebo jeden "character sheet". Soul ID zajistí konzistenci obličeje ve všech scénách.
3. KLING MOTION — Pro každou postavu můžeš vygenerovat video s pohybem kamery (dolly, pan, tilt, orbit, handheld).
4. MODELY: Kling 3.0 Omni (dialogy), Hailuo MiniMax 2.3 (B-roll), WAN 2.2 (lip sync), Kling Motion (akce).
5. KREDITY — Každé generování stojí kredity. Nový uživatel dostane 100 kreditů zdarma.

Aktuální stránka: ${input.context ?? "hlavní stránka"}

Odpovídej vždy česky. Buď konkrétní, navrhuj přesné další kroky.`;

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

// ─── Kling Motion preset labels (česky) ───────────────────────────────────────
const MOTION_PRESET_LABELS: Record<string, string> = {
  dollyIn: "Dolly přiblížení",
  dollyOut: "Dolly oddálení",
  panLeft: "Pan doleva",
  panRight: "Pan doprava",
  tiltUp: "Tilt nahoru",
  tiltDown: "Tilt dolů",
  orbit: "Orbit (kruh)",
  handheld: "Ruční kamera",
  static: "Statický záběr",
};

export type AppRouter = typeof appRouter;
