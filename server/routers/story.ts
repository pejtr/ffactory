import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import {
  createStoryNotebook, getStoryNotebook, getUserStoryNotebooks, updateStoryNotebook, deleteStoryNotebook,
  createStorySource, getNotebookSources, updateStorySource, deleteStorySource,
  createStoryScript, getStoryScript, getNotebookScripts, updateStoryScript, deleteStoryScript,
  createStoryThumbnail, getScriptThumbnails, setSelectedThumbnail,
  createHookTemplate, getNotebookHooks, getUserHooks, toggleHookFavorite, incrementHookUsage, deleteHookTemplate,
  spendCredits, CREDIT_COSTS,
} from "../db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function analyzeSourceWithAI(source: { type: string; url?: string | null; content?: string | null; title?: string | null }, notebookContext: { niche?: string | null; contentStyle?: string; language?: string }) {
  const sourceDesc = source.type === "youtube_url"
    ? `YouTube video URL: ${source.url}`
    : source.type === "url"
    ? `Web URL: ${source.url}`
    : `Text content: ${(source.content ?? "").slice(0, 3000)}`;

  const prompt = `Analyze this content source for a ${notebookContext.contentStyle ?? "educational"} content creator in the "${notebookContext.niche ?? "general"}" niche.

Source: ${sourceDesc}

Provide analysis in JSON format with these fields:
- summary: string (2-3 sentences)
- keyInsights: string[] (5-7 key insights)
- hookPatterns: { pattern: string, example: string, type: string }[] (3-5 hook patterns found)
- viralScore: number (0-100, estimate viral potential)
- targetAudience: string
- contentAngles: string[] (3-5 unique content angles to explore)
- emotionalTriggers: string[] (main emotions this content evokes)

Language for analysis: ${notebookContext.language ?? "cs"}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert content strategist and viral content analyst. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "source_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyInsights: { type: "array", items: { type: "string" } },
            hookPatterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pattern: { type: "string" },
                  example: { type: "string" },
                  type: { type: "string" },
                },
                required: ["pattern", "example", "type"],
                additionalProperties: false,
              },
            },
            viralScore: { type: "number" },
            targetAudience: { type: "string" },
            contentAngles: { type: "array", items: { type: "string" } },
            emotionalTriggers: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "keyInsights", "hookPatterns", "viralScore", "targetAudience", "contentAngles", "emotionalTriggers"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = String(response.choices?.[0]?.message?.content ?? "{}");
  return JSON.parse(content);
}

async function generateScriptWithAI(params: {
  title: string;
  idea: string;
  scriptType: string;
  targetDurationSec: number;
  language: string;
  sources: { summary?: string | null; keyInsights?: unknown; hookPatterns?: unknown }[];
  notebookContext: { niche?: string | null; contentStyle?: string; targetAudience?: string | null };
}) {
  const sourceSummaries = params.sources.slice(0, 5).map((s, i) =>
    `Source ${i + 1}: ${s.summary ?? ""}\nKey insights: ${JSON.stringify(s.keyInsights ?? [])}`
  ).join("\n\n");

  const wordCount = Math.round(params.targetDurationSec * 2.5); // ~150 words/min

  const prompt = `Write a compelling ${params.scriptType} script for a ${params.notebookContext.contentStyle ?? "educational"} video.

Title: ${params.title}
Core Idea: ${params.idea}
Target Duration: ${params.targetDurationSec} seconds (~${wordCount} words)
Language: ${params.language}
Target Audience: ${params.notebookContext.targetAudience ?? "general audience"}
Niche: ${params.notebookContext.niche ?? "general"}

${sourceSummaries ? `Research Sources:\n${sourceSummaries}` : ""}

Requirements:
- Start with a powerful hook (first 3-5 seconds must grab attention)
- Write in natural conversational tone (no bullet points in script)
- Include emotional storytelling elements
- End with clear call-to-action
- Optimize for 21st century attention spans

Return JSON with:
- hook: string (opening 1-2 sentences)
- script: string (full script text, natural paragraphs)
- seoTitles: string[] (10 click-worthy title variations)
- seoDescription: string (YouTube description with keywords, 150-200 words)
- seoTags: string[] (15-20 relevant tags)`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert scriptwriter for viral educational and storytelling content. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "script_output",
        strict: true,
        schema: {
          type: "object",
          properties: {
            hook: { type: "string" },
            script: { type: "string" },
            seoTitles: { type: "array", items: { type: "string" } },
            seoDescription: { type: "string" },
            seoTags: { type: "array", items: { type: "string" } },
          },
          required: ["hook", "script", "seoTitles", "seoDescription", "seoTags"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = String(response.choices?.[0]?.message?.content ?? "{}");
  return JSON.parse(content);
}

async function generateNotebookAnalysis(params: {
  niche: string;
  contentStyle: string;
  language: string;
  sources: { summary?: string | null; hookPatterns?: unknown; keyInsights?: unknown; viralScore?: number | null }[];
}) {
  const allHooks = params.sources.flatMap(s => (s.hookPatterns as { pattern: string; type: string }[] ?? []));
  const avgViralScore = params.sources.length > 0
    ? params.sources.reduce((sum, s) => sum + (s.viralScore ?? 50), 0) / params.sources.length
    : 0;

  const prompt = `Analyze a content niche and create a strategic content playbook.

Niche: ${params.niche}
Content Style: ${params.contentStyle}
Language: ${params.language}
Number of sources analyzed: ${params.sources.length}
Average viral score: ${avgViralScore.toFixed(1)}

Hook patterns found: ${JSON.stringify(allHooks.slice(0, 20))}

Create a comprehensive analysis with:
- nicheOverview: string (2-3 sentences about the niche)
- audienceProfile: { age: string, interests: string[], painPoints: string[], desires: string[] }
- contentFormula: string (the winning formula for this niche)
- viralElements: string[] (5-7 elements that make content viral in this niche)
- contentCalendar: { theme: string, frequency: string, bestTime: string }[]
- competitiveAdvantage: string[] (3-5 ways to stand out)
- monetizationPaths: string[] (3-5 monetization strategies)`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a top-tier content strategy consultant. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "notebook_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            nicheOverview: { type: "string" },
            audienceProfile: {
              type: "object",
              properties: {
                age: { type: "string" },
                interests: { type: "array", items: { type: "string" } },
                painPoints: { type: "array", items: { type: "string" } },
                desires: { type: "array", items: { type: "string" } },
              },
              required: ["age", "interests", "painPoints", "desires"],
              additionalProperties: false,
            },
            contentFormula: { type: "string" },
            viralElements: { type: "array", items: { type: "string" } },
            contentCalendar: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  theme: { type: "string" },
                  frequency: { type: "string" },
                  bestTime: { type: "string" },
                },
                required: ["theme", "frequency", "bestTime"],
                additionalProperties: false,
              },
            },
            competitiveAdvantage: { type: "array", items: { type: "string" } },
            monetizationPaths: { type: "array", items: { type: "string" } },
          },
          required: ["nicheOverview", "audienceProfile", "contentFormula", "viralElements", "contentCalendar", "competitiveAdvantage", "monetizationPaths"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = String(response.choices?.[0]?.message?.content ?? "{}");
  return JSON.parse(content);
}

async function generateVideoIdeas(params: {
  niche: string;
  contentStyle: string;
  language: string;
  count: number;
  sources: { summary?: string | null; keyInsights?: unknown }[];
}) {
  const sourceSummaries = params.sources.slice(0, 5).map(s => s.summary ?? "").join("; ");

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a viral content ideation expert. Always respond with valid JSON." },
      { role: "user", content: `Generate ${params.count} unique video ideas for a ${params.contentStyle} channel in the "${params.niche}" niche.

Research context: ${sourceSummaries}
Language: ${params.language}

For each idea provide:
- title: string (compelling, SEO-optimized)
- hook: string (opening line)
- description: string (2-3 sentences)
- viralPotential: number (0-100)
- scriptType: "youtube_short" | "youtube_long" | "explainer" | "whiteboard" | "documentary" | "story" | "educational"
- estimatedDurationSec: number

Return as JSON array.` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_ideas",
        strict: true,
        schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  hook: { type: "string" },
                  description: { type: "string" },
                  viralPotential: { type: "number" },
                  scriptType: { type: "string" },
                  estimatedDurationSec: { type: "number" },
                },
                required: ["title", "hook", "description", "viralPotential", "scriptType", "estimatedDurationSec"],
                additionalProperties: false,
              },
            },
          },
          required: ["ideas"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = String(response.choices?.[0]?.message?.content ?? '{"ideas":[]}');
  return JSON.parse(content).ideas ?? [];
}

// ─── Story Router ─────────────────────────────────────────────────────────────

export const storyRouter = router({

  // ── Notebooks ──────────────────────────────────────────────────────────────
  notebooks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserStoryNotebooks(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.id);
        if (!nb || nb.userId !== ctx.user.id) return null;
        return nb;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        niche: z.string().optional(),
        targetAudience: z.string().optional(),
        contentStyle: z.enum(["educational", "storytelling", "explainer", "documentary", "entertainment", "news", "tutorial"]).default("educational"),
        language: z.string().default("cs"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createStoryNotebook({
          userId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          niche: input.niche ?? null,
          targetAudience: input.targetAudience ?? null,
          contentStyle: input.contentStyle,
          language: input.language,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        niche: z.string().optional(),
        targetAudience: z.string().optional(),
        contentStyle: z.enum(["educational", "storytelling", "explainer", "documentary", "entertainment", "news", "tutorial"]).optional(),
        language: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.id);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");
        const { id, ...data } = input;
        await updateStoryNotebook(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.id);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");
        await deleteStoryNotebook(input.id);
        return { success: true };
      }),

    // Generate full notebook analysis from all sources
    analyze: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.id);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");
        const sources = await getNotebookSources(input.id);
        const readySources = sources.filter(s => s.status === "ready");
        if (readySources.length === 0) throw new Error("Add and process at least one source first");

        const analysis = await generateNotebookAnalysis({
          niche: nb.niche ?? "general",
          contentStyle: nb.contentStyle,
          language: nb.language,
          sources: readySources,
        });

        // Extract hook templates from all sources
        const allHooks = readySources.flatMap(s => (s.hookPatterns as { pattern: string; type: string; example: string }[] ?? []));
        const uniqueHooks = allHooks.reduce((acc: { pattern: string; type: string; example: string }[], h) => {
          if (!acc.find(x => x.pattern === h.pattern)) acc.push(h);
          return acc;
        }, []);

        await updateStoryNotebook(input.id, {
          aiAnalysis: analysis as unknown as null,
          hookTemplates: uniqueHooks as unknown as null,
        });

        return { analysis, hookTemplates: uniqueHooks };
      }),

    // Generate video ideas
    generateIdeas: protectedProcedure
      .input(z.object({ id: z.number(), count: z.number().min(1).max(20).default(10) }))
      .mutation(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.id);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");
        const sources = await getNotebookSources(input.id);

        const ideas = await generateVideoIdeas({
          niche: nb.niche ?? "general",
          contentStyle: nb.contentStyle,
          language: nb.language,
          count: input.count,
          sources: sources.filter(s => s.status === "ready"),
        });

        await updateStoryNotebook(input.id, { videoIdeas: ideas as unknown as null });
        return { ideas };
      }),
  }),

  // ── Sources ────────────────────────────────────────────────────────────────
  sources: router({
    list: protectedProcedure
      .input(z.object({ notebookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.notebookId);
        if (!nb || nb.userId !== ctx.user.id) return [];
        return getNotebookSources(input.notebookId);
      }),

    add: protectedProcedure
      .input(z.object({
        notebookId: z.number(),
        type: z.enum(["youtube_url", "text", "url", "file"]),
        url: z.string().optional(),
        content: z.string().optional(),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.notebookId);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");

        const id = await createStorySource({
          notebookId: input.notebookId,
          userId: ctx.user.id,
          type: input.type,
          url: input.url ?? null,
          content: input.content ?? null,
          title: input.title ?? null,
          status: "pending",
        });

        return { id };
      }),

    // Process source with AI analysis
    process: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get source and verify ownership via notebook
        const sources = await (async () => {
          const { getDb } = await import("../db");
          const db = await getDb();
          if (!db) return [];
          const { storySources } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          return db.select().from(storySources).where(eq(storySources.id, input.id)).limit(1);
        })();
        const source = sources[0];
        if (!source) throw new Error("Source not found");

        const nb = await getStoryNotebook(source.notebookId);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");

        await updateStorySource(input.id, { status: "processing" });

        try {
          const analysis = await analyzeSourceWithAI(source, {
            niche: nb.niche,
            contentStyle: nb.contentStyle,
            language: nb.language,
          });

          await updateStorySource(input.id, {
            status: "ready",
            summary: analysis.summary,
            keyInsights: analysis.keyInsights as unknown as null,
            hookPatterns: analysis.hookPatterns as unknown as null,
            viralScore: analysis.viralScore,
            metadata: { targetAudience: analysis.targetAudience, contentAngles: analysis.contentAngles, emotionalTriggers: analysis.emotionalTriggers } as unknown as null,
          });

          return { success: true, analysis };
        } catch (err) {
          await updateStorySource(input.id, { status: "failed" });
          throw err;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sources = await (async () => {
          const { getDb } = await import("../db");
          const db = await getDb();
          if (!db) return [];
          const { storySources } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          return db.select().from(storySources).where(eq(storySources.id, input.id)).limit(1);
        })();
        const source = sources[0];
        if (!source) throw new Error("Not found");
        const nb = await getStoryNotebook(source.notebookId);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");
        await deleteStorySource(input.id);
        return { success: true };
      }),
  }),

  // ── Scripts ────────────────────────────────────────────────────────────────
  scripts: router({
    list: protectedProcedure
      .input(z.object({ notebookId: z.number() }))
      .query(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.notebookId);
        if (!nb || nb.userId !== ctx.user.id) return [];
        return getNotebookScripts(input.notebookId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const script = await getStoryScript(input.id);
        if (!script || script.userId !== ctx.user.id) return null;
        return script;
      }),

    generate: protectedProcedure
      .input(z.object({
        notebookId: z.number(),
        title: z.string().min(1),
        idea: z.string().min(1),
        scriptType: z.enum(["youtube_short", "youtube_long", "explainer", "whiteboard", "documentary", "story", "educational"]).default("educational"),
        targetDurationSec: z.number().min(30).max(3600).default(180),
        language: z.string().default("cs"),
      }))
      .mutation(async ({ ctx, input }) => {
        const nb = await getStoryNotebook(input.notebookId);
        if (!nb || nb.userId !== ctx.user.id) throw new Error("Not found");

        // Spend credits
        const spent = await spendCredits(ctx.user.id, CREDIT_COSTS.story_script, "story_script", `Script: ${input.title}`);
        if (!spent) throw new Error("Nedostatek kreditů. Potřebuješ " + CREDIT_COSTS.story_script + " kreditů.");

        const sources = await getNotebookSources(input.notebookId);
        const readySources = sources.filter(s => s.status === "ready");

        const result = await generateScriptWithAI({
          title: input.title,
          idea: input.idea,
          scriptType: input.scriptType,
          targetDurationSec: input.targetDurationSec,
          language: input.language,
          sources: readySources,
          notebookContext: { niche: nb.niche, contentStyle: nb.contentStyle, targetAudience: nb.targetAudience },
        });

        const id = await createStoryScript({
          notebookId: input.notebookId,
          userId: ctx.user.id,
          title: input.title,
          hook: result.hook,
          script: result.script,
          scriptType: input.scriptType,
          targetDurationSec: input.targetDurationSec,
          language: input.language,
          seoTitles: result.seoTitles as unknown as null,
          seoDescription: result.seoDescription,
          seoTags: result.seoTags as unknown as null,
          creditsUsed: CREDIT_COSTS.story_script,
        });

        return { id, ...result };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        hook: z.string().optional(),
        script: z.string().optional(),
        seoDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const script = await getStoryScript(input.id);
        if (!script || script.userId !== ctx.user.id) throw new Error("Not found");
        const { id, ...data } = input;
        await updateStoryScript(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const script = await getStoryScript(input.id);
        if (!script || script.userId !== ctx.user.id) throw new Error("Not found");
        await deleteStoryScript(input.id);
        return { success: true };
      }),

    // Generate thumbnail for script
    generateThumbnail: protectedProcedure
      .input(z.object({
        scriptId: z.number(),
        style: z.string().optional(),
        customPrompt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const script = await getStoryScript(input.scriptId);
        if (!script || script.userId !== ctx.user.id) throw new Error("Not found");

        const spent = await spendCredits(ctx.user.id, CREDIT_COSTS.story_thumbnail, "story_thumbnail", `Thumbnail: ${script.title}`);
        if (!spent) throw new Error("Nedostatek kreditů.");

        const thumbnailPrompt = input.customPrompt ?? `YouTube thumbnail for: "${script.title}". ${script.hook ?? ""}. Style: ${input.style ?? "bold, high contrast, dramatic lighting, professional"}. No text overlay. Cinematic, eye-catching, viral potential.`;

        const { url: imageUrl } = await generateImage({ prompt: thumbnailPrompt });

        // Upload to S3
        if (!imageUrl) throw new Error("Image generation failed");
        const resp = await fetch(imageUrl);
        const buffer = Buffer.from(await resp.arrayBuffer());
        const key = `thumbnails/${ctx.user.id}/${nanoid()}.jpg`;
        const { url: s3Url } = await storagePut(key, buffer, "image/jpeg");

        const id = await createStoryThumbnail({
          scriptId: input.scriptId,
          userId: ctx.user.id,
          prompt: thumbnailPrompt,
          style: input.style ?? "default",
          imageUrl: s3Url,
        });

        return { id, imageUrl: s3Url };
      }),

    // Get thumbnails for script
    thumbnails: protectedProcedure
      .input(z.object({ scriptId: z.number() }))
      .query(async ({ ctx, input }) => {
        const script = await getStoryScript(input.scriptId);
        if (!script || script.userId !== ctx.user.id) return [];
        return getScriptThumbnails(input.scriptId);
      }),

    selectThumbnail: protectedProcedure
      .input(z.object({ scriptId: z.number(), thumbnailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const script = await getStoryScript(input.scriptId);
        if (!script || script.userId !== ctx.user.id) throw new Error("Not found");
        await setSelectedThumbnail(input.scriptId, input.thumbnailId);
        return { success: true };
      }),

    // Regenerate SEO for existing script
    regenerateSEO: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const script = await getStoryScript(input.id);
        if (!script || script.userId !== ctx.user.id) throw new Error("Not found");

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an SEO expert for video content. Always respond with valid JSON." },
            { role: "user", content: `Generate optimized SEO metadata for this video script.

Title: ${script.title}
Hook: ${script.hook ?? ""}
Script excerpt: ${script.script.slice(0, 500)}

Return JSON with:
- seoTitles: string[] (10 click-worthy title variations)
- seoDescription: string (YouTube description, 150-200 words, with keywords)
- seoTags: string[] (15-20 relevant tags)` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "seo_output",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  seoTitles: { type: "array", items: { type: "string" } },
                  seoDescription: { type: "string" },
                  seoTags: { type: "array", items: { type: "string" } },
                },
                required: ["seoTitles", "seoDescription", "seoTags"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = String(response.choices?.[0]?.message?.content ?? "{}");
        const seo = JSON.parse(content);
        await updateStoryScript(input.id, {
          seoTitles: seo.seoTitles as unknown as null,
          seoDescription: seo.seoDescription,
          seoTags: seo.seoTags as unknown as null,
        });

        return seo;
      }),
  }),

  // ─── Hooks Router ──────────────────────────────────────────────────────────────
  hooks: router({
    // List all hooks for a notebook
    list: protectedProcedure
      .input(z.object({ notebookId: z.number() }))
      .query(async ({ input, ctx }) => {
        return getNotebookHooks(input.notebookId, ctx.user.id);
      }),

    // Extract hooks from all analyzed sources in a notebook using AI
    extract: protectedProcedure
      .input(z.object({ notebookId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const notebook = await getStoryNotebook(input.notebookId);
        if (!notebook || notebook.userId !== ctx.user.id) throw new Error("Notebook not found");

        const sources = await getNotebookSources(input.notebookId);
        const readySources = sources.filter(s => s.status === "ready" && s.hookPatterns);

        if (readySources.length === 0) return { extracted: 0 };

        // Collect all raw hook patterns from sources
        const allRawHooks = readySources.flatMap(src => {
          const patterns = src.hookPatterns as { pattern: string; example: string; type: string }[] ?? [];
          return patterns.map(p => ({ ...p, sourceId: src.id, viralScore: src.viralScore }));
        });

        if (allRawHooks.length === 0) return { extracted: 0 };

        // Use AI to categorize and templatize hooks
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert in viral content hooks. Categorize and templatize the provided hooks into reusable templates. Always respond with valid JSON." },
            { role: "user", content: `Analyze these ${allRawHooks.length} hook patterns and create reusable templates.

Hooks: ${JSON.stringify(allRawHooks.slice(0, 30))}

For each unique hook pattern, create a template with:
- category: one of: question, shock, story, statistic, controversy, promise, curiosity, challenge
- template: reusable template with {X} placeholders (e.g. "Did you know that {X} can {Y}?")
- example: best real example from the hooks
- viralScore: 0-100 estimate

Return JSON: { templates: Array<{category, template, example, viralScore}> }` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hook_templates_output",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  templates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        template: { type: "string" },
                        example: { type: "string" },
                        viralScore: { type: "number" },
                      },
                      required: ["category", "template", "example", "viralScore"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["templates"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = String(response.choices?.[0]?.message?.content ?? '{"templates":[]}');
        const { templates } = JSON.parse(content) as { templates: { category: string; template: string; example: string; viralScore: number }[] };

        const VALID_CATEGORIES = ["question", "shock", "story", "statistic", "controversy", "promise", "curiosity", "challenge"] as const;
        let extracted = 0;
        for (const t of templates.slice(0, 20)) {
          const cat = VALID_CATEGORIES.includes(t.category as typeof VALID_CATEGORIES[number])
            ? (t.category as typeof VALID_CATEGORIES[number])
            : "curiosity" as const;
          await createHookTemplate({
            userId: ctx.user.id,
            notebookId: input.notebookId,
            category: cat,
            template: t.template,
            example: t.example,
            viralScore: Math.min(100, Math.max(0, t.viralScore)),
          });
          extracted++;
        }

        return { extracted };
      }),

    // Toggle favorite status
    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await toggleHookFavorite(input.id, ctx.user.id);
        return { isFavorite: result };
      }),

    // Increment usage count when hook is used in a script
    use: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementHookUsage(input.id);
        return { ok: true };
      }),

    // Delete hook template
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteHookTemplate(input.id, ctx.user.id);
        return { ok: true };
      }),
  }),
});
