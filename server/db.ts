import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videoProjects, scenes, characters, audioTracks } from "../drizzle/schema";
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
  return db.select().from(characters).where(eq(characters.userId, userId)).orderBy(desc(characters.createdAt));
}

export async function createCharacter(data: {
  userId: number; projectId?: number; name: string; description?: string;
  personality?: string; referenceImageUrl?: string; voiceId?: string; voiceName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(characters).values({
    userId: data.userId, projectId: data.projectId ?? null, name: data.name,
    description: data.description ?? null, personality: data.personality ?? null,
    referenceImageUrl: data.referenceImageUrl ?? null,
    voiceId: data.voiceId ?? null, voiceName: data.voiceName ?? null,
  }).$returningId();
  return result[0]?.id;
}

export async function getCharacter(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateCharacterSoulId(id: number, soulIdImageUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(characters).set({ soulIdImageUrl }).where(eq(characters.id, id));
}

export type ReferenceImage = {
  url: string;
  label: string;  // e.g. "Přední pohled", "Boční pohled", "Character sheet"
  isMultiView: boolean; // true = one image with multiple angles
};

export async function updateCharacterReferenceImages(id: number, images: ReferenceImage[]) {
  const db = await getDb();
  if (!db) return;
  // Also set primary referenceImageUrl to first image for backwards compat
  const primary = images[0]?.url ?? null;
  await db.update(characters).set({
    referenceImages: images as unknown as null,
    referenceImageUrl: primary,
  }).where(eq(characters.id, id));
}

export async function addCharacterReferenceImage(id: number, image: ReferenceImage, existing: ReferenceImage[]) {
  const updated = [...existing, image].slice(0, 5); // max 5
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
