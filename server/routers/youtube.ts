import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { youtubeChannels, channelPosts, channelBlueprints } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";

// ─── YouTube OAuth2 Config ───────────────────────────────────────────────────
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "";
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

// ─── Language Map ────────────────────────────────────────────────────────────
const LANG_MAP: Record<string, string> = {
  cs: "Czech", en: "English", es: "Spanish", de: "German", fr: "French",
  pt: "Portuguese", hi: "Hindi", ar: "Arabic", ja: "Japanese", ko: "Korean",
  zh: "Chinese", it: "Italian", pl: "Polish", nl: "Dutch", ru: "Russian",
  tr: "Turkish", id: "Indonesian", th: "Thai", vi: "Vietnamese", sv: "Swedish",
};

// ─── Helper: Refresh YouTube token ──────────────────────────────────────────
async function refreshYouTubeToken(channelRow: { id: number; refreshToken: string }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: channelRow.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const data = await res.json();
  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
  const db = await getDb();
  if (db) {
    await db
      .update(youtubeChannels)
      .set({ accessToken: data.access_token, tokenExpiresAt: expiresAt })
      .where(eq(youtubeChannels.id, channelRow.id));
  }
  return data.access_token as string;
}

// ─── Helper: Get valid access token ─────────────────────────────────────────
async function getValidToken(channelRow: { id: number; accessToken: string; refreshToken: string; tokenExpiresAt: number }) {
  const now = Math.floor(Date.now() / 1000);
  if (channelRow.tokenExpiresAt > now + 60) return channelRow.accessToken;
  return refreshYouTubeToken(channelRow);
}

// ─── Helper: Fetch YouTube channel info ─────────────────────────────────────
async function fetchChannelInfo(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) throw new Error("No YouTube channel found for this account");
  const ch = data.items[0];
  return {
    channelId: ch.id as string,
    channelName: ch.snippet.title as string,
    channelHandle: (ch.snippet.customUrl || null) as string | null,
    thumbnailUrl: (ch.snippet.thumbnails?.default?.url || null) as string | null,
    subscriberCount: parseInt(ch.statistics.subscriberCount || "0"),
    videoCount: parseInt(ch.statistics.videoCount || "0"),
    viewCount: parseInt(ch.statistics.viewCount || "0"),
  };
}

// ─── YouTube Router ──────────────────────────────────────────────────────────
export const youtubeRouter = router({
  // Get OAuth2 URL for connecting YouTube channel
  getAuthUrl: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .query(({ ctx, input }) => {
      if (!YOUTUBE_CLIENT_ID) {
        return { url: null, error: "YouTube API není nakonfigurováno. Nastavte YOUTUBE_CLIENT_ID a YOUTUBE_CLIENT_SECRET." };
      }
      const redirectUri = `${input.origin}/youtube-callback`;
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64");
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", YOUTUBE_CLIENT_ID);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", YOUTUBE_SCOPES);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      url.searchParams.set("state", state);
      return { url: url.toString(), error: null };
    }),

  // Exchange OAuth2 code for tokens (called from callback page)
  exchangeCode: protectedProcedure
    .input(z.object({ code: z.string(), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const redirectUri = `${input.origin}/youtube-callback`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: input.code,
          client_id: YOUTUBE_CLIENT_ID,
          client_secret: YOUTUBE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Token exchange failed: ${err}`);
      }
      const tokens = await tokenRes.json();
      const accessToken = tokens.access_token;
      const refreshToken = tokens.refresh_token;
      const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600);

      // Fetch channel info
      const info = await fetchChannelInfo(accessToken);

      // Check if channel already connected
      const existing = await db
        .select()
        .from(youtubeChannels)
        .where(and(eq(youtubeChannels.userId, ctx.user.id), eq(youtubeChannels.channelId, info.channelId)));
      if (existing.length > 0) {
        await db
          .update(youtubeChannels)
          .set({
            accessToken, refreshToken, tokenExpiresAt: expiresAt, isActive: true,
            channelName: info.channelName, channelHandle: info.channelHandle,
            thumbnailUrl: info.thumbnailUrl, subscriberCount: info.subscriberCount,
            videoCount: info.videoCount, viewCount: info.viewCount,
          })
          .where(eq(youtubeChannels.id, existing[0].id));
        return { channelId: existing[0].id, isNew: false };
      }

      // Insert new channel
      const [result] = await db.insert(youtubeChannels).values({
        userId: ctx.user.id,
        channelId: info.channelId,
        channelName: info.channelName,
        channelHandle: info.channelHandle,
        thumbnailUrl: info.thumbnailUrl,
        accessToken,
        refreshToken,
        tokenExpiresAt: expiresAt,
        subscriberCount: info.subscriberCount,
        videoCount: info.videoCount,
        viewCount: info.viewCount,
      });
      return { channelId: (result as any).insertId, isNew: true };
    }),

  // List user's connected YouTube channels
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: youtubeChannels.id,
        channelId: youtubeChannels.channelId,
        channelName: youtubeChannels.channelName,
        channelHandle: youtubeChannels.channelHandle,
        thumbnailUrl: youtubeChannels.thumbnailUrl,
        subscriberCount: youtubeChannels.subscriberCount,
        videoCount: youtubeChannels.videoCount,
        viewCount: youtubeChannels.viewCount,
        isActive: youtubeChannels.isActive,
        createdAt: youtubeChannels.createdAt,
      })
      .from(youtubeChannels)
      .where(and(eq(youtubeChannels.userId, ctx.user.id), eq(youtubeChannels.isActive, true)));
  }),

  // Disconnect a YouTube channel
  disconnect: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(youtubeChannels)
        .set({ isActive: false })
        .where(and(eq(youtubeChannels.id, input.id), eq(youtubeChannels.userId, ctx.user.id)));
      return { success: true };
    }),

  // Refresh channel stats from YouTube API
  refreshStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [channel] = await db
        .select()
        .from(youtubeChannels)
        .where(and(eq(youtubeChannels.id, input.id), eq(youtubeChannels.userId, ctx.user.id)));
      if (!channel) throw new Error("Channel not found");
      const token = await getValidToken(channel);
      const info = await fetchChannelInfo(token);
      await db
        .update(youtubeChannels)
        .set({ subscriberCount: info.subscriberCount, videoCount: info.videoCount, viewCount: info.viewCount })
        .where(eq(youtubeChannels.id, channel.id));
      return info;
    }),

  // ─── SEO Metadata Generation ───────────────────────────────────────────────
  generateSEO: protectedProcedure
    .input(z.object({
      projectTitle: z.string(),
      projectDescription: z.string(),
      genre: z.string().optional(),
      language: z.string().default("cs"),
    }))
    .mutation(async ({ input }) => {
      const langName = LANG_MAP[input.language] || "Czech";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a YouTube SEO expert. Generate optimized metadata in ${langName} for a video. Return JSON only.`,
          },
          {
            role: "user",
            content: `Video title: "${input.projectTitle}"\nDescription: "${input.projectDescription}"\nGenre: ${input.genre || "general"}\n\nGenerate:\n1. An attention-grabbing YouTube title (max 70 chars)\n2. A compelling description (150-300 words) with relevant keywords\n3. 15-20 relevant tags\n\nReturn as JSON: { "title": "...", "description": "...", "tags": ["..."] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "seo_metadata",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "YouTube video title" },
                description: { type: "string", description: "YouTube video description" },
                tags: { type: "array", items: { type: "string" }, description: "SEO tags" },
              },
              required: ["title", "description", "tags"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content;
      const text = typeof content === "string" ? content : JSON.stringify(content);
      return JSON.parse(text) as { title: string; description: string; tags: string[] };
    }),

  // ─── Thumbnail Generation ──────────────────────────────────────────────────
  generateThumbnail: protectedProcedure
    .input(z.object({
      projectTitle: z.string(),
      sceneDescription: z.string().optional(),
      style: z.string().default("cinematic"),
    }))
    .mutation(async ({ input }) => {
      const prompt = `YouTube thumbnail, ${input.style} style, dramatic lighting, bold composition. Scene: ${input.sceneDescription || input.projectTitle}. Text overlay: "${input.projectTitle.slice(0, 30)}". High contrast, 16:9 aspect ratio, eye-catching, professional quality.`;
      const { url } = await generateImage({ prompt });
      return { thumbnailUrl: url };
    }),

  // ─── Upload to YouTube ─────────────────────────────────────────────────────
  upload: protectedProcedure
    .input(z.object({
      channelDbId: z.number(),
      projectId: z.number(),
      title: z.string().max(100),
      description: z.string(),
      tags: z.array(z.string()),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      language: z.string().default("cs"),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [channel] = await db
        .select()
        .from(youtubeChannels)
        .where(and(eq(youtubeChannels.id, input.channelDbId), eq(youtubeChannels.userId, ctx.user.id)));
      if (!channel) throw new Error("Channel not found");
      const accessToken = await getValidToken(channel);

      // Create post record
      const [postResult] = await db.insert(channelPosts).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        channelId: input.channelDbId,
        title: input.title,
        description: input.description,
        tags: JSON.stringify(input.tags),
        language: input.language,
        thumbnailUrl: input.thumbnailUrl || null,
        status: input.scheduledAt ? "scheduled" : "uploading",
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      });
      const postId = (postResult as any).insertId;

      if (input.scheduledAt) {
        return { postId, status: "scheduled" as const };
      }

      // Download video file
      const videoRes = await fetch(input.videoUrl);
      if (!videoRes.ok) throw new Error("Failed to download video");
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

      try {
        await db.update(channelPosts).set({ status: "uploading" }).where(eq(channelPosts.id, postId));

        const metadata = {
          snippet: {
            title: input.title,
            description: input.description,
            tags: input.tags,
            defaultLanguage: input.language,
            categoryId: "22",
          },
          status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
        };

        const initRes = await fetch(
          "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json; charset=UTF-8",
              "X-Upload-Content-Length": String(videoBuffer.length),
              "X-Upload-Content-Type": "video/mp4",
            },
            body: JSON.stringify(metadata),
          }
        );
        if (!initRes.ok) {
          const err = await initRes.text();
          throw new Error(`YouTube upload init failed: ${err}`);
        }
        const uploadUrl = initRes.headers.get("location");
        if (!uploadUrl) throw new Error("No upload URL returned");

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "video/mp4", "Content-Length": String(videoBuffer.length) },
          body: videoBuffer,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.text();
          throw new Error(`YouTube upload failed: ${err}`);
        }
        const uploadData = await uploadRes.json();
        const youtubeVideoId = uploadData.id;

        if (input.thumbnailUrl) {
          try {
            const thumbRes = await fetch(input.thumbnailUrl);
            const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
            await fetch(
              `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${youtubeVideoId}`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "image/png" },
                body: thumbBuffer,
              }
            );
          } catch (e) {
            console.error("[YouTube] Thumbnail upload failed:", e);
          }
        }

        await db
          .update(channelPosts)
          .set({ status: "published", youtubeVideoId, publishedAt: new Date() })
          .where(eq(channelPosts.id, postId));

        return { postId, status: "published" as const, youtubeVideoId };
      } catch (error: any) {
        await db
          .update(channelPosts)
          .set({ status: "failed", errorMessage: error.message })
          .where(eq(channelPosts.id, postId));
        throw error;
      }
    }),

  // ─── List Posts ────────────────────────────────────────────────────────────
  listPosts: protectedProcedure
    .input(z.object({ channelDbId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(channelPosts.userId, ctx.user.id)];
      if (input?.channelDbId) conditions.push(eq(channelPosts.channelId, input.channelDbId));
      return db
        .select()
        .from(channelPosts)
        .where(and(...conditions))
        .orderBy(desc(channelPosts.createdAt))
        .limit(50);
    }),

  // ─── Multi-language translate ──────────────────────────────────────────────
  translateScript: protectedProcedure
    .input(z.object({
      script: z.string(),
      targetLanguage: z.string(),
    }))
    .mutation(async ({ input }) => {
      const langName = LANG_MAP[input.targetLanguage] || input.targetLanguage;
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following video script to ${langName}. Keep the same structure, tone, and emotional impact. Return only the translated text.`,
          },
          { role: "user", content: input.script },
        ],
      });
      const content = response.choices[0]?.message?.content;
      const text = typeof content === "string" ? content : "";
      return { translatedScript: text };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL BLUEPRINT — AI-generated 30-video content plan + 90-day roadmap
  // ═══════════════════════════════════════════════════════════════════════════

  // Validate niche viability
  validateNiche: protectedProcedure
    .input(z.object({ niche: z.string().min(3).max(200) }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a YouTube market research expert. Analyze the given niche for YouTube channel viability. Consider: search volume, competition level, monetization potential, content sustainability, audience size. Return a JSON analysis.`,
          },
          {
            role: "user",
            content: `Analyze this YouTube niche: "${input.niche}"\n\nProvide:\n1. Viability score (0-100)\n2. Monthly search volume estimate (low/medium/high/very_high)\n3. Competition level (low/medium/high/saturated)\n4. Monetization potential (low/medium/high/excellent)\n5. Content sustainability (how many unique videos possible)\n6. Target audience description\n7. Top 5 sub-niches within this niche\n8. Risks and opportunities\n9. Recommended angle/differentiation`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "niche_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                viabilityScore: { type: "integer", description: "0-100 score" },
                searchVolume: { type: "string", description: "low/medium/high/very_high" },
                competition: { type: "string", description: "low/medium/high/saturated" },
                monetization: { type: "string", description: "low/medium/high/excellent" },
                sustainability: { type: "string", description: "How many unique videos possible" },
                targetAudience: { type: "string", description: "Target audience description" },
                subNiches: { type: "array", items: { type: "string" }, description: "Top 5 sub-niches" },
                risks: { type: "array", items: { type: "string" }, description: "Key risks" },
                opportunities: { type: "array", items: { type: "string" }, description: "Key opportunities" },
                recommendedAngle: { type: "string", description: "Recommended differentiation" },
              },
              required: ["viabilityScore", "searchVolume", "competition", "monetization", "sustainability", "targetAudience", "subNiches", "risks", "opportunities", "recommendedAngle"],
              additionalProperties: false,
            },
          },
        },
      });
      const c = response.choices[0]?.message?.content;
      return JSON.parse(typeof c === "string" ? c : "{}");
    }),

  // Generate full channel blueprint (30 video ideas + SEO + 90-day plan)
  generateBlueprint: protectedProcedure
    .input(z.object({
      niche: z.string().min(3).max(200),
      channelId: z.number().optional(),
      language: z.string().default("cs"),
      postingCadence: z.enum(["daily", "5x_week", "3x_week", "2x_week", "weekly"]).default("3x_week"),
      tone: z.string().optional(), // e.g. "educational", "entertaining", "inspirational"
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const langName = LANG_MAP[input.language] || "Czech";

      // Create blueprint record
      const [result] = await db.insert(channelBlueprints).values({
        userId: ctx.user.id,
        channelId: input.channelId || null,
        niche: input.niche,
        postingCadence: input.postingCadence,
        targetLanguage: input.language,
        status: "generating",
      });
      const blueprintId = (result as any).insertId;

      // Generate video plan (30 ideas)
      const videoPlanResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a top YouTube strategist who creates viral content blueprints. Generate a comprehensive 30-video content plan in ${langName}. Each video must be UNIQUE and provide real value (not repetitive). Follow YouTube best practices: 8-10 min optimal length, compelling hooks, SEO-optimized titles.`,
          },
          {
            role: "user",
            content: `Niche: "${input.niche}"\nTone: ${input.tone || "educational + entertaining"}\nLanguage: ${langName}\nPosting cadence: ${input.postingCadence.replace("_", " ")}\n\nGenerate 30 unique video ideas. For each video provide:\n1. Title (max 70 chars, compelling, keyword-rich)\n2. Description (150-200 words with hook + bullet points + hashtags)\n3. 15 SEO tags\n4. Suggested thumbnail text (short, punchy, max 4 words)\n5. Thumbnail visual description (for AI image generation)\n6. Video chapters/timestamps (5-8 chapters)\n7. Target duration in minutes\n8. Content category (educational/entertainment/tutorial/story/review)\n9. Estimated viral potential (1-10)\n\nEnsure variety: mix tutorials, stories, lists, deep-dives, trending topics.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "video_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                videos: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      title: { type: "string" },
                      description: { type: "string" },
                      tags: { type: "array", items: { type: "string" } },
                      thumbnailText: { type: "string" },
                      thumbnailVisual: { type: "string" },
                      chapters: { type: "array", items: { type: "string" } },
                      durationMinutes: { type: "integer" },
                      category: { type: "string" },
                      viralPotential: { type: "integer" },
                    },
                    required: ["id", "title", "description", "tags", "thumbnailText", "thumbnailVisual", "chapters", "durationMinutes", "category", "viralPotential"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["videos"],
              additionalProperties: false,
            },
          },
        },
      });
      const videoPlanContent = videoPlanResponse.choices[0]?.message?.content;
      const videoPlan = JSON.parse(typeof videoPlanContent === "string" ? videoPlanContent : '{"videos":[]}');

      // Generate 90-day roadmap
      const roadmapResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a YouTube growth strategist. Create a detailed 90-day action plan in ${langName} for a new channel. Include milestones, optimization strategies, and growth tactics.`,
          },
          {
            role: "user",
            content: `Niche: "${input.niche}"\nPosting cadence: ${input.postingCadence.replace("_", " ")}\n\nCreate a 90-day roadmap with:\n- Week-by-week milestones (12 weeks)\n- Key metrics to track each week\n- Optimization actions (thumbnails A/B testing, title tweaks, posting time experiments)\n- Community building tactics\n- Monetization milestones (when to expect: 1K subs, 4K watch hours, first $)\n- Content strategy evolution (what to adjust based on analytics)`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "roadmap",
            strict: true,
            schema: {
              type: "object",
              properties: {
                weeks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "integer" },
                      milestone: { type: "string" },
                      actions: { type: "array", items: { type: "string" } },
                      metrics: { type: "array", items: { type: "string" } },
                      tips: { type: "string" },
                    },
                    required: ["week", "milestone", "actions", "metrics", "tips"],
                    additionalProperties: false,
                  },
                },
                monetizationTimeline: { type: "string" },
                keySuccessFactors: { type: "array", items: { type: "string" } },
              },
              required: ["weeks", "monetizationTimeline", "keySuccessFactors"],
              additionalProperties: false,
            },
          },
        },
      });
      const roadmapContent = roadmapResponse.choices[0]?.message?.content;
      const roadmap = JSON.parse(typeof roadmapContent === "string" ? roadmapContent : '{"weeks":[],"monetizationTimeline":"","keySuccessFactors":[]}');

      // Generate brand identity suggestions
      const brandResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a brand identity expert for YouTube channels. Generate channel branding suggestions in ${langName}.`,
          },
          {
            role: "user",
            content: `Niche: "${input.niche}"\nTone: ${input.tone || "educational + entertaining"}\n\nSuggest:\n1. 3 channel name options (catchy, memorable, SEO-friendly)\n2. Channel tagline\n3. Color palette (3 colors as hex codes)\n4. Visual style description (for logo/banner AI generation)\n5. Content tone description\n6. Target audience persona`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "brand_identity",
            strict: true,
            schema: {
              type: "object",
              properties: {
                channelNames: { type: "array", items: { type: "string" } },
                tagline: { type: "string" },
                colors: { type: "array", items: { type: "string" } },
                visualStyle: { type: "string" },
                contentTone: { type: "string" },
                audiencePersona: { type: "string" },
              },
              required: ["channelNames", "tagline", "colors", "visualStyle", "contentTone", "audiencePersona"],
              additionalProperties: false,
            },
          },
        },
      });
      const brandContent = brandResponse.choices[0]?.message?.content;
      const brandIdentity = JSON.parse(typeof brandContent === "string" ? brandContent : '{}');

      // Update blueprint with all generated data
      await db
        .update(channelBlueprints)
        .set({
          videoPlan: videoPlan,
          roadmap: roadmap,
          brandIdentity: brandIdentity,
          channelName: brandIdentity.channelNames?.[0] || input.niche,
          status: "ready",
        })
        .where(eq(channelBlueprints.id, blueprintId));

      return { blueprintId, videoPlan, roadmap, brandIdentity };
    }),

  // Get user's blueprints
  listBlueprints: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(channelBlueprints)
      .where(eq(channelBlueprints.userId, ctx.user.id))
      .orderBy(desc(channelBlueprints.createdAt));
  }),

  // Get single blueprint
  getBlueprint: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [bp] = await db
        .select()
        .from(channelBlueprints)
        .where(and(eq(channelBlueprints.id, input.id), eq(channelBlueprints.userId, ctx.user.id)));
      return bp || null;
    }),

  // Generate A/B thumbnail variants
  generateThumbnailVariants: protectedProcedure
    .input(z.object({
      projectTitle: z.string(),
      sceneDescription: z.string().optional(),
      style: z.string().default("cinematic"),
      count: z.number().min(2).max(4).default(3),
    }))
    .mutation(async ({ input }) => {
      const styles = [
        `Bold text with dramatic face close-up, ${input.style} lighting`,
        `Minimalist design with strong color contrast, single focal point`,
        `Action shot with motion blur, text overlay with glow effect`,
        `Split composition with before/after or vs layout, high energy`,
      ];
      const variants: { url: string; style: string }[] = [];
      for (let i = 0; i < Math.min(input.count, styles.length); i++) {
        const prompt = `YouTube thumbnail, ${styles[i]}. Topic: ${input.sceneDescription || input.projectTitle}. Text: "${input.projectTitle.slice(0, 25)}". 16:9 aspect ratio, 1280x720, professional, eye-catching, high CTR.`;
        const result = await generateImage({ prompt });
        const imageUrl = result.url || "";
        const styleName = String(styles[i]).split(",")[0] || "";
        if (imageUrl) variants.push({ url: imageUrl, style: styleName });
      }
      return { variants };
    }),

  // Enhanced SEO with chapters, hashtags, CTA
  generateEnhancedSEO: protectedProcedure
    .input(z.object({
      projectTitle: z.string(),
      projectDescription: z.string(),
      genre: z.string().optional(),
      language: z.string().default("cs"),
      durationMinutes: z.number().optional(),
      includeChapters: z.boolean().default(true),
      includeHashtags: z.boolean().default(true),
      includeCTA: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const langName = LANG_MAP[input.language] || "Czech";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a YouTube SEO expert specializing in maximum discoverability and engagement. Generate comprehensive, optimized metadata in ${langName}. Follow all YouTube best practices from top creators.`,
          },
          {
            role: "user",
            content: `Video: "${input.projectTitle}"\nDescription: "${input.projectDescription}"\nGenre: ${input.genre || "general"}\nDuration: ~${input.durationMinutes || 8} minutes\n\nGenerate:\n1. Title (max 70 chars, compelling hook + keyword)\n2. Full description with sections:\n   - Opening hook (2-3 sentences explaining value)\n   - "What you'll learn" bullet points (5-7 items)\n   - Chapters/timestamps (${input.includeChapters ? "yes, 6-8 chapters with timestamps like 0:00, 1:30, etc." : "skip"})\n   - Call to action (subscribe + like + comment prompt)\n   - ${input.includeHashtags ? "Hashtag block (8-12 relevant hashtags)" : ""}\n3. 15-20 SEO tags (mix of broad + long-tail keywords)\n4. Pinned comment suggestion (engaging question to boost comments)`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "enhanced_seo",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                chapters: { type: "array", items: { type: "object", properties: { time: { type: "string" }, label: { type: "string" } }, required: ["time", "label"], additionalProperties: false } },
                hashtags: { type: "array", items: { type: "string" } },
                callToAction: { type: "string" },
                pinnedComment: { type: "string" },
              },
              required: ["title", "description", "tags", "chapters", "hashtags", "callToAction", "pinnedComment"],
              additionalProperties: false,
            },
          },
        },
      });
      const c = response.choices[0]?.message?.content;
      return JSON.parse(typeof c === "string" ? c : "{}");
    }),

  // Content uniqueness check
  checkUniqueness: protectedProcedure
    .input(z.object({ script: z.string(), niche: z.string().optional() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a YouTube content policy expert. Analyze the script for uniqueness and potential policy violations. YouTube deletes channels that post repetitive or low-value AI content.`,
          },
          {
            role: "user",
            content: `Niche: ${input.niche || "general"}\n\nScript:\n${input.script.slice(0, 3000)}\n\nAnalyze:\n1. Uniqueness score (0-100) — how original is this content?\n2. Value score (0-100) — does it provide real value to viewers?\n3. Policy risk flags (any potential YouTube policy violations?)\n4. Suggestions to make it more unique\n5. Overall verdict: safe/caution/risky`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "uniqueness_check",
            strict: true,
            schema: {
              type: "object",
              properties: {
                uniquenessScore: { type: "integer" },
                valueScore: { type: "integer" },
                policyRisks: { type: "array", items: { type: "string" } },
                suggestions: { type: "array", items: { type: "string" } },
                verdict: { type: "string" },
              },
              required: ["uniquenessScore", "valueScore", "policyRisks", "suggestions", "verdict"],
              additionalProperties: false,
            },
          },
        },
      });
      const c = response.choices[0]?.message?.content;
      return JSON.parse(typeof c === "string" ? c : "{}");
    }),
});
