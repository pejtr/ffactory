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
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
  // Kling Motion — uložené pohyby kamery pro tuto postavu
  motionPreset: varchar("motionPreset", { length: 64 }).default("static"),
  // Archivní tagy pro filtrování
  tags: json("tags"),                               // string[]
  // Počet použití v projektech
  usageCount: int("usageCount").default(0).notNull(),
  // Poslední projekt, ve kterém byla postava použita
  lastUsedProjectId: int("lastUsedProjectId"),
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

// ─── Credits (kreditový systém) ────────────────────────────────────────────────
export const credits = mysqlTable("credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  balance: int("balance").default(100).notNull(),   // aktuální zůstatek
  totalEarned: int("totalEarned").default(100).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Credits = typeof credits.$inferSelect;
export type InsertCredits = typeof credits.$inferInsert;

// ─── Credit Transactions ───────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),                  // kladné = příjem, záporné = výdaj
  type: mysqlEnum("type", [
    "signup_bonus",
    "video_generation",
    "scene_generation",
    "soul_id_generation",
    "admin_grant",
    "daily_bonus",
    "generate_hub",
  ]).notNull(),
  description: varchar("description", { length: 255 }),
  projectId: int("projectId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── Generate Hub Generations ──────────────────────────────────────────────────────────────────────────────────────
export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  model: mysqlEnum("model", [
    "nano-banana-2",
    "nano-banana-2-edit",
    "nano-banana-pro",
    "nano-banana-pro-edit",
    "seedream-5-edit",
    "kling-motion-control",
    "kling-video-edit",
    "kling-i2v",
    "hailuo-t2v",
    "hailuo-i2v",
    "wan22-t2v",
    "wan22-i2v",
  ]).notNull(),
  type: mysqlEnum("type", ["t2i", "i2i", "t2v", "i2v", "v2v"]).notNull(),
  prompt: text("prompt").notNull(),
  inputImageUrls: json("inputImageUrls"),   // string[]
  inputVideoUrl: text("inputVideoUrl"),
  resultUrl: text("resultUrl"),             // final image/video URL
  resultUrls: json("resultUrls"),           // string[] for multi-image results
  falRequestId: varchar("falRequestId", { length: 128 }),
  klingTaskId: varchar("klingTaskId", { length: 128 }),
  creditsCost: int("creditsCost").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;
