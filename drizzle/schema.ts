import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  float,
  tinyint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  referralCode: varchar("referralCode", { length: 16 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Video Projects ────────────────────────────────────────────────────────────
export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  idea: text("idea").notNull(),
  genre: varchar("genre", { length: 64 }),
  emotionalTone: varchar("emotionalTone", { length: 64 }),
  dreamMode: boolean("dreamMode").default(false),
  targetDuration: int("targetDuration").default(60),
  status: mysqlEnum("status", [
    "draft",
    "generating_screenplay",
    "generating_scenes",
    "generating_audio",
    "assembling",
    "completed",
    "failed",
  ]).default("draft").notNull(),
  screenplay: json("screenplay"),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  finalVideoUrl: text("finalVideoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  estimatedCostUsd: float("estimatedCostUsd"),
  actualCostUsd: float("actualCostUsd"),
  errorMessage: text("errorMessage"),
  // Reference Recreation fields
  projectType: mysqlEnum("projectType", ["standard", "reference_recreation"]).default("standard").notNull(),
  referenceVideoUrl: text("referenceVideoUrl"),
  referenceUsageNote: text("referenceUsageNote"),
  aspectRatio: varchar("aspectRatio", { length: 8 }).default("16:9"),
  seedancePrompt: json("seedancePrompt"), // full structured JSON prompt
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;

// ─── Characters (Soul Cinema System) ──────────────────────────────────────────
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  personality: text("personality"),
  referenceImageUrl: text("referenceImageUrl"),   // primary / legacy single image
  referenceImages: json("referenceImages"),         // array of {url, label, isMultiView}
  soulIdImageUrl: text("soulIdImageUrl"),
  voiceId: varchar("voiceId", { length: 128 }),
  voiceName: varchar("voiceName", { length: 128 }),
  defaultEmotion: varchar("defaultEmotion", { length: 64 }).default("neutral"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

// ─── Scenes ────────────────────────────────────────────────────────────────────
export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneIndex: int("sceneIndex").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description").notNull(),
  dialogue: text("dialogue"),
  visualPrompt: text("visualPrompt"),
  emotion: varchar("emotion", { length: 64 }).default("neutral"),
  sceneType: mysqlEnum("sceneType", [
    "dialogue",
    "broll",
    "action",
    "lipsync",
    "dream",
    "transition",
  ]).default("broll").notNull(),
  videoModel: varchar("videoModel", { length: 64 }),
  characterIds: json("characterIds"),
  duration: int("duration").default(5),
  status: mysqlEnum("status", [
    "pending", "generating", "completed", "failed"
  ]).default("pending").notNull(),
  videoUrl: text("videoUrl"),
  audioUrl: text("audioUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  klingTaskId: varchar("klingTaskId", { length: 128 }),
  falTaskId: varchar("falTaskId", { length: 128 }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

// ─── Audio Tracks ──────────────────────────────────────────────────────────────
export const audioTracks = mysqlTable("audio_tracks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  trackType: mysqlEnum("trackType", [
    "bgm",
    "voiceover",
    "sfx",
    "dialogue",
  ]).notNull(),
  title: varchar("title", { length: 255 }),
  prompt: text("prompt"),
  audioUrl: text("audioUrl"),
  duration: float("duration"),
  characterId: int("characterId"),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  taskId: varchar("taskId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudioTrack = typeof audioTracks.$inferSelect;
export type InsertAudioTrack = typeof audioTracks.$inferInsert;

// ─── Credits ───────────────────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", [
    "signup_bonus",
    "purchase",
    "video_generation",
    "image_generation",
    "audio_generation",
    "motion_generation",
    "video_edit",
    "image_edit",
    "generate_hub",
    "story_script",
    "story_video",
    "story_thumbnail",
    "refund",
    "referral_bonus",
    "referral_signup",
  ]).notNull(),
  description: text("description"),
  referenceId: varchar("referenceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── Generations (Generate Hub) ────────────────────────────────────────────────
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["text_to_image", "image_to_image", "text_to_video", "image_to_video", "video_edit", "motion_control"]).notNull(),
  prompt: text("prompt"),
  inputImageUrl: text("inputImageUrl"),
  inputVideoUrl: text("inputVideoUrl"),
  outputUrl: text("outputUrl"),
  outputUrls: json("outputUrls"),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  taskId: varchar("taskId", { length: 256 }),
  creditsUsed: int("creditsUsed").default(0),
  metadata: json("metadata"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;

// ─── Story Ecosystem (NotebookLM-style) ────────────────────────────────────────
export const storyNotebooks = mysqlTable("story_notebooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  niche: varchar("niche", { length: 128 }),
  targetAudience: text("targetAudience"),
  contentStyle: mysqlEnum("contentStyle", [
    "educational",
    "storytelling",
    "explainer",
    "documentary",
    "entertainment",
    "news",
    "tutorial",
  ]).default("educational").notNull(),
  language: varchar("language", { length: 16 }).default("cs").notNull(),
  aiAnalysis: json("aiAnalysis"),        // niche analysis, hook patterns, viral score
  hookTemplates: json("hookTemplates"),  // extracted hook library
  videoIdeas: json("videoIdeas"),        // generated video ideas
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoryNotebook = typeof storyNotebooks.$inferSelect;
export type InsertStoryNotebook = typeof storyNotebooks.$inferInsert;

export const storySources = mysqlTable("story_sources", {
  id: int("id").autoincrement().primaryKey(),
  notebookId: int("notebookId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["youtube_url", "text", "url", "file"]).notNull(),
  title: varchar("title", { length: 512 }),
  content: text("content"),           // raw text / transcript
  url: text("url"),
  summary: text("summary"),           // AI-generated summary
  keyInsights: json("keyInsights"),   // extracted insights
  hookPatterns: json("hookPatterns"), // extracted hooks
  viralScore: float("viralScore"),    // 0-100 viral potential score
  metadata: json("metadata"),
  status: mysqlEnum("status", ["pending", "processing", "ready", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StorySource = typeof storySources.$inferSelect;
export type InsertStorySource = typeof storySources.$inferInsert;

export const storyScripts = mysqlTable("story_scripts", {
  id: int("id").autoincrement().primaryKey(),
  notebookId: int("notebookId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  hook: text("hook"),
  script: text("script").notNull(),
  scriptType: mysqlEnum("scriptType", [
    "youtube_short",
    "youtube_long",
    "explainer",
    "whiteboard",
    "documentary",
    "story",
    "educational",
  ]).default("educational").notNull(),
  targetDurationSec: int("targetDurationSec").default(180),
  language: varchar("language", { length: 16 }).default("cs").notNull(),
  // SEO
  seoTitles: json("seoTitles"),       // 10 click-worthy titles
  seoDescription: text("seoDescription"),
  seoTags: json("seoTags"),
  // Generated outputs
  voiceoverUrl: text("voiceoverUrl"),
  videoUrl: text("videoUrl"),
  videoStyle: mysqlEnum("videoStyle", [
    "whiteboard",
    "kinetic",
    "anime",
    "watercolor",
    "hand_drawn",
    "classic",
    "illusion",
  ]),
  videoStatus: mysqlEnum("videoStatus", ["none", "generating", "completed", "failed"]).default("none").notNull(),
  videoTaskId: varchar("videoTaskId", { length: 256 }),
  creditsUsed: int("creditsUsed").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoryScript = typeof storyScripts.$inferSelect;
export type InsertStoryScript = typeof storyScripts.$inferInsert;

export const storyThumbnails = mysqlTable("story_thumbnails", {
  id: int("id").autoincrement().primaryKey(),
  scriptId: int("scriptId").notNull(),
  userId: int("userId").notNull(),
  prompt: text("prompt"),
  style: varchar("style", { length: 64 }),
  imageUrl: text("imageUrl"),
  isSelected: boolean("isSelected").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoryThumbnail = typeof storyThumbnails.$inferSelect;
export type InsertStoryThumbnail = typeof storyThumbnails.$inferInsert;

// ─── Hook Templates Library ─────────────────────────────────────────────────────
export const hookTemplates = mysqlTable("hook_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notebookId: int("notebookId"),        // null = global library
  sourceId: int("sourceId"),            // extracted from which source
  category: mysqlEnum("category", [
    "question",
    "shock",
    "story",
    "statistic",
    "controversy",
    "promise",
    "curiosity",
    "challenge",
  ]).notNull(),
  template: text("template").notNull(),  // e.g. "Did you know that {X}?"
  example: text("example"),             // real example from source
  viralScore: float("viralScore"),       // 0-100
  usageCount: int("usageCount").default(0).notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type HookTemplate = typeof hookTemplates.$inferSelect;
export type InsertHookTemplate = typeof hookTemplates.$inferInsert;

// ── Script Templates ───────────────────────────────────────────────────────────
export const scriptTemplates = mysqlTable("script_templates", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  genre: varchar("genre", { length: 100 }).notNull().default("horror"),
  format: varchar("format", { length: 50 }).notNull().default("shorts"),
  description: text("description"),
  scenes: json("scenes"),
  personaSlots: json("persona_slots"),
  variables: json("variables"),
  isPublic: tinyint("is_public").notNull().default(0),
  usageCount: int("usage_count").notNull().default(0),
  viralScore: float("viral_score"),
  tags: varchar("tags", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ScriptTemplate = typeof scriptTemplates.$inferSelect;
export type InsertScriptTemplate = typeof scriptTemplates.$inferInsert;

// ── Personas ───────────────────────────────────────────────────────────────────
export const personas = mysqlTable("personas", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }),
  gender: varchar("gender", { length: 50 }),
  age: varchar("age", { length: 50 }),
  appearance: text("appearance"),
  personality: text("personality"),
  voiceStyle: varchar("voice_style", { length: 100 }),
  catchphrase: varchar("catchphrase", { length: 500 }),
  backstory: text("backstory"),
  avatarUrl: varchar("avatar_url", { length: 1000 }),
  characterId: int("character_id"),
  tags: varchar("tags", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

// ─── Referrals ────────────────────────────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").primaryKey().autoincrement(),
  referrerId: int("referrerId").notNull(),   // user who shared the code
  referredId: int("referredId").notNull(),   // new user who used the code
  code: varchar("code", { length: 16 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed"]).default("completed").notNull(),
  creditsAwarded: int("creditsAwarded").notNull().default(50),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ─── Gamification: User Streaks ─────────────────────────────────────────────────
export const userStreaks = mysqlTable("user_streaks", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  lastClaimedAt: timestamp("lastClaimedAt"),
  streakFreezeUsed: boolean("streakFreezeUsed").default(false).notNull(),
  totalDaysClaimed: int("totalDaysClaimed").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;

// ── Gamification: User Achievements ───────────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  achievementKey: varchar("achievementKey", { length: 128 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  creditReward: int("creditReward").notNull().default(0),
  notified: boolean("notified").default(false).notNull(),
});
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
