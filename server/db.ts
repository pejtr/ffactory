import { eq, desc, asc, inArray, and } from "drizzle-orm";
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

// ─── Video Project Control ─────────────────────────────────────────────────────
export async function cancelVideoProject(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(videoProjects)
    .set({ status: "cancelled" })
    .where(eq(videoProjects.id, projectId));
  await db.update(scenes)
    .set({ status: "cancelled" })
    .where(and(eq(scenes.projectId, projectId), inArray(scenes.status, ["pending", "generating"])));
}

export async function resetSceneForRegeneration(sceneId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(scenes)
    .set({ status: "pending", videoUrl: null, errorMessage: null, klingTaskId: null, falTaskId: null })
    .where(eq(scenes.id, sceneId));
}

export async function resetProjectForRegeneration(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(videoProjects)
    .set({ status: "generating_scenes", errorMessage: null })
    .where(eq(videoProjects.id, projectId));
  await db.update(scenes)
    .set({ status: "pending", videoUrl: null, errorMessage: null, klingTaskId: null, falTaskId: null })
    .where(eq(scenes.projectId, projectId));
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

// ─── Credits ───────────────────────────────────────────────────────────────────
import { creditTransactions, generations, storyNotebooks, storySources, storyScripts, storyThumbnails, hookTemplates } from "../drizzle/schema";
import { sum } from "drizzle-orm";

export const CREDIT_COSTS = {
  video_generation: 20,
  image_generation: 2,
  audio_generation: 5,
  motion_generation: 10,
  video_edit: 8,
  image_edit: 3,
  generate_hub: 2,
  story_script: 5,
  story_video: 15,
  story_thumbnail: 2,
} as const;

export async function getUserCredits(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sum(creditTransactions.amount) })
    .from(creditTransactions).where(eq(creditTransactions.userId, userId));
  return Number(result[0]?.total ?? 0);
}

export async function getCreditHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt)).limit(limit);
}

export async function earnCredits(userId: number, amount: number, type: typeof creditTransactions.$inferInsert["type"], description?: string, referenceId?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(creditTransactions).values({ userId, amount: Math.abs(amount), type, description: description ?? null, referenceId: referenceId ?? null });
}

export async function spendCredits(userId: number, amount: number, type: typeof creditTransactions.$inferInsert["type"], description?: string, referenceId?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const balance = await getUserCredits(userId);
  if (balance < amount) return false;
  await db.insert(creditTransactions).values({ userId, amount: -Math.abs(amount), type, description: description ?? null, referenceId: referenceId ?? null });
  return true;
}

// ─── Generations ───────────────────────────────────────────────────────────────
export async function createGeneration(data: typeof generations.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(generations).values(data).$returningId();
  return result[0]?.id;
}

export async function getGeneration(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateGeneration(id: number, data: Partial<typeof generations.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(generations).set(data).where(eq(generations.id, id));
}

export async function getUserGenerations(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generations).where(eq(generations.userId, userId)).orderBy(desc(generations.createdAt)).limit(limit);
}

// ─── Story Notebooks ───────────────────────────────────────────────────────────
export async function createStoryNotebook(data: typeof storyNotebooks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(storyNotebooks).values(data).$returningId();
  return result[0]?.id;
}

export async function getStoryNotebook(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(storyNotebooks).where(eq(storyNotebooks.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserStoryNotebooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storyNotebooks).where(eq(storyNotebooks.userId, userId)).orderBy(desc(storyNotebooks.createdAt));
}

export async function updateStoryNotebook(id: number, data: Partial<typeof storyNotebooks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(storyNotebooks).set(data).where(eq(storyNotebooks.id, id));
}

export async function deleteStoryNotebook(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(storyNotebooks).where(eq(storyNotebooks.id, id));
}

// ─── Story Sources ─────────────────────────────────────────────────────────────
export async function createStorySource(data: typeof storySources.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(storySources).values(data).$returningId();
  return result[0]?.id;
}

export async function getNotebookSources(notebookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storySources).where(eq(storySources.notebookId, notebookId)).orderBy(desc(storySources.createdAt));
}

export async function updateStorySource(id: number, data: Partial<typeof storySources.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(storySources).set(data).where(eq(storySources.id, id));
}

export async function deleteStorySource(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(storySources).where(eq(storySources.id, id));
}

// ─── Story Scripts ─────────────────────────────────────────────────────────────
export async function createStoryScript(data: typeof storyScripts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(storyScripts).values(data).$returningId();
  return result[0]?.id;
}

export async function getStoryScript(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(storyScripts).where(eq(storyScripts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getNotebookScripts(notebookId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storyScripts).where(eq(storyScripts.notebookId, notebookId)).orderBy(desc(storyScripts.createdAt));
}

export async function updateStoryScript(id: number, data: Partial<typeof storyScripts.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(storyScripts).set(data).where(eq(storyScripts.id, id));
}

export async function deleteStoryScript(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(storyScripts).where(eq(storyScripts.id, id));
}

// ─── Story Thumbnails ──────────────────────────────────────────────────────────
export async function createStoryThumbnail(data: typeof storyThumbnails.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(storyThumbnails).values(data).$returningId();
  return result[0]?.id;
}

export async function getScriptThumbnails(scriptId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storyThumbnails).where(eq(storyThumbnails.scriptId, scriptId)).orderBy(desc(storyThumbnails.createdAt));
}

export async function setSelectedThumbnail(scriptId: number, thumbnailId: number) {
  const db = await getDb();
  if (!db) return;
  // Deselect all, then select the chosen one
  await db.update(storyThumbnails).set({ isSelected: false }).where(eq(storyThumbnails.scriptId, scriptId));
  await db.update(storyThumbnails).set({ isSelected: true }).where(eq(storyThumbnails.id, thumbnailId));
}

// ─── Hook Templates ─────────────────────────────────────────────────────────────
export async function createHookTemplate(data: typeof hookTemplates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(hookTemplates).values(data).$returningId();
  return result[0]?.id;
}

export async function getNotebookHooks(notebookId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hookTemplates)
    .where(eq(hookTemplates.notebookId, notebookId))
    .orderBy(desc(hookTemplates.viralScore), desc(hookTemplates.usageCount));
}

export async function getUserHooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hookTemplates)
    .where(eq(hookTemplates.userId, userId))
    .orderBy(desc(hookTemplates.viralScore), desc(hookTemplates.usageCount));
}

export async function toggleHookFavorite(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select({ isFavorite: hookTemplates.isFavorite })
    .from(hookTemplates).where(eq(hookTemplates.id, id)).limit(1);
  const current = result[0]?.isFavorite ?? false;
  await db.update(hookTemplates).set({ isFavorite: !current }).where(eq(hookTemplates.id, id));
  return !current;
}

export async function incrementHookUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  // Use raw SQL for increment
  await db.update(hookTemplates)
    .set({ usageCount: 999 }) // placeholder — will be overridden below
    .where(eq(hookTemplates.id, id));
  // Get current count and increment
  const result = await db.select({ usageCount: hookTemplates.usageCount })
    .from(hookTemplates).where(eq(hookTemplates.id, id)).limit(1);
  const count = (result[0]?.usageCount ?? 0) + 1;
  await db.update(hookTemplates).set({ usageCount: count }).where(eq(hookTemplates.id, id));
}

export async function deleteHookTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(hookTemplates).where(eq(hookTemplates.id, id));
}
