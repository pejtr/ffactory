import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, videoProjects, scenes, characters, audioTracks,
  credits, creditTransactions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized; updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Video Projects ────────────────────────────────────────────────────────────
export async function createVideoProject(data: {
  userId: number; title: string; idea: string;
  genre?: string; emotionalTone?: string; dreamMode?: boolean; targetDuration?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(videoProjects).values({
    userId: data.userId, title: data.title, idea: data.idea,
    genre: data.genre ?? null, emotionalTone: data.emotionalTone ?? null,
    dreamMode: data.dreamMode ?? false, targetDuration: data.targetDuration ?? 60, status: "draft",
  }).$returningId();
  return result[0]?.id;
}

export async function getVideoProject(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoProjects).where(eq(videoProjects.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getVideoProjectByToken(shareToken: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoProjects).where(eq(videoProjects.shareToken, shareToken)).limit(1);
  return result[0] ?? null;
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoProjects).where(eq(videoProjects.userId, userId)).orderBy(desc(videoProjects.createdAt));
}

export async function getProjectScenes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scenes).where(eq(scenes.projectId, projectId)).orderBy(asc(scenes.sceneIndex));
}

export async function getProjectAudioTracks(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(audioTracks).where(eq(audioTracks.projectId, projectId));
}

// ─── Characters ────────────────────────────────────────────────────────────────
export async function getUserCharacters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.updatedAt));
}

export async function createCharacter(data: {
  userId: number; projectId?: number; name: string; description?: string;
  personality?: string; referenceImageUrl?: string; voiceId?: string; voiceName?: string;
  tags?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(characters).values({
    userId: data.userId, projectId: data.projectId ?? null, name: data.name,
    description: data.description ?? null, personality: data.personality ?? null,
    referenceImageUrl: data.referenceImageUrl ?? null,
    voiceId: data.voiceId ?? null, voiceName: data.voiceName ?? null,
    tags: (data.tags ?? []) as unknown as null,
  }).$returningId();
  return result[0]?.id;
}

export async function getCharacter(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateCharacter(id: number, data: {
  name?: string; description?: string; personality?: string;
  voiceId?: string; voiceName?: string; defaultEmotion?: string;
  motionPreset?: string; tags?: string[];
}) {
  const db = await getDb();
  if (!db) return;
  const set: Record<string, unknown> = {};
  if (data.name !== undefined) set.name = data.name;
  if (data.description !== undefined) set.description = data.description;
  if (data.personality !== undefined) set.personality = data.personality;
  if (data.voiceId !== undefined) set.voiceId = data.voiceId;
  if (data.voiceName !== undefined) set.voiceName = data.voiceName;
  if (data.defaultEmotion !== undefined) set.defaultEmotion = data.defaultEmotion;
  if (data.motionPreset !== undefined) set.motionPreset = data.motionPreset;
  if (data.tags !== undefined) set.tags = data.tags as unknown as null;
  if (Object.keys(set).length === 0) return;
  await db.update(characters).set(set).where(eq(characters.id, id));
}

export async function updateCharacterSoulId(id: number, soulIdImageUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(characters).set({ soulIdImageUrl }).where(eq(characters.id, id));
}

export async function incrementCharacterUsage(id: number, projectId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(characters).set({
    usageCount: sql`${characters.usageCount} + 1`,
    lastUsedProjectId: projectId,
  }).where(eq(characters.id, id));
}

export type ReferenceImage = {
  url: string;
  label: string;
  isMultiView: boolean;
};

export async function updateCharacterReferenceImages(id: number, images: ReferenceImage[]) {
  const db = await getDb();
  if (!db) return;
  const primary = images[0]?.url ?? null;
  await db.update(characters).set({
    referenceImages: images as unknown as null,
    referenceImageUrl: primary,
  }).where(eq(characters.id, id));
}

export async function addCharacterReferenceImage(id: number, image: ReferenceImage, existing: ReferenceImage[]) {
  const updated = [...existing, image].slice(0, 5);
  await updateCharacterReferenceImages(id, updated);
  return updated;
}

export async function removeCharacterReferenceImage(id: number, imageUrl: string, existing: ReferenceImage[]) {
  const updated = existing.filter(img => img.url !== imageUrl);
  await updateCharacterReferenceImages(id, updated);
  return updated;
}

export async function deleteCharacter(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(characters).where(eq(characters.id, id));
}

// ─── Credits ──────────────────────────────────────────────────────────────────
// Ceny v kreditech
export const CREDIT_COSTS = {
  video_generation: 20,      // Celé video (odečte se při spuštění)
  scene_generation: 3,       // Každá scéna zvlášť (odečte se po dokončení)
  soul_id_generation: 5,     // Generování Soul ID portrétu
} as const;

export const SIGNUP_BONUS = 100; // Startovní kredity pro nového uživatele

export async function getOrCreateCredits(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  // Nový uživatel — signup bonus
  const result = await db.insert(credits).values({
    userId,
    balance: SIGNUP_BONUS,
    totalEarned: SIGNUP_BONUS,
    totalSpent: 0,
  }).$returningId();
  await db.insert(creditTransactions).values({
    userId,
    amount: SIGNUP_BONUS,
    type: "signup_bonus",
    description: `Startovní bonus ${SIGNUP_BONUS} kreditů`,
  });
  const newRecord = await db.select().from(credits).where(eq(credits.id, result[0].id)).limit(1);
  return newRecord[0];
}

export async function getUserCredits(userId: number) {
  return getOrCreateCredits(userId);
}

export async function spendCredits(userId: number, amount: number, type: "video_generation" | "scene_generation" | "soul_id_generation", description: string, projectId?: number): Promise<{ success: boolean; balance: number; error?: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const userCredits = await getOrCreateCredits(userId);
  if (userCredits.balance < amount) {
    return { success: false, balance: userCredits.balance, error: `Nedostatek kreditů. Potřebuješ ${amount}, máš ${userCredits.balance}.` };
  }
  await db.update(credits).set({
    balance: sql`${credits.balance} - ${amount}`,
    totalSpent: sql`${credits.totalSpent} + ${amount}`,
  }).where(eq(credits.userId, userId));
  await db.insert(creditTransactions).values({
    userId, amount: -amount, type, description, projectId: projectId ?? null,
  });
  const updated = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  return { success: true, balance: updated[0]?.balance ?? 0 };
}

export async function earnCredits(userId: number, amount: number, type: "admin_grant" | "daily_bonus", description: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await getOrCreateCredits(userId); // ensure record exists
  await db.update(credits).set({
    balance: sql`${credits.balance} + ${amount}`,
    totalEarned: sql`${credits.totalEarned} + ${amount}`,
  }).where(eq(credits.userId, userId));
  await db.insert(creditTransactions).values({
    userId, amount, type, description,
  });
  const updated = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  return updated[0];
}

export async function getCreditTransactions(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}
