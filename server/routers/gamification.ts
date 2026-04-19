import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { userStreaks, userAchievements, creditTransactions, videoProjects, characters, generations } from "../../drizzle/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

// ── Achievement Definitions ────────────────────────────────────────────────────
export const ACHIEVEMENTS: Record<string, {
  key: string;
  title: string;
  description: string;
  icon: string;
  creditReward: number;
  category: "creation" | "streak" | "social" | "milestone";
}> = {
  first_video: {
    key: "first_video",
    title: "První záběr",
    description: "Vygeneruj své první video",
    icon: "🎬",
    creditReward: 20,
    category: "creation",
  },
  videos_10: {
    key: "videos_10",
    title: "Filmový tvůrce",
    description: "Vygeneruj 10 videí",
    icon: "🎥",
    creditReward: 50,
    category: "milestone",
  },
  videos_50: {
    key: "videos_50",
    title: "Hollywoodský režisér",
    description: "Vygeneruj 50 videí",
    icon: "🏆",
    creditReward: 200,
    category: "milestone",
  },
  first_soul: {
    key: "first_soul",
    title: "Tvůrce duší",
    description: "Vytvoř svou první Soul postavu",
    icon: "👤",
    creditReward: 15,
    category: "creation",
  },
  characters_5: {
    key: "characters_5",
    title: "Obsazovací ředitel",
    description: "Vytvoř 5 Soul postav",
    icon: "🎭",
    creditReward: 30,
    category: "milestone",
  },
  streak_3: {
    key: "streak_3",
    title: "Pravidelný tvůrce",
    description: "3 dny v řadě",
    icon: "🔥",
    creditReward: 15,
    category: "streak",
  },
  streak_7: {
    key: "streak_7",
    title: "Týdenní šampion",
    description: "7 dní v řadě",
    icon: "⚡",
    creditReward: 50,
    category: "streak",
  },
  streak_30: {
    key: "streak_30",
    title: "Měsíční legenda",
    description: "30 dní v řadě",
    icon: "👑",
    creditReward: 300,
    category: "streak",
  },
  first_generate: {
    key: "first_generate",
    title: "Generátor",
    description: "Použij Generate Hub poprvé",
    icon: "✨",
    creditReward: 10,
    category: "creation",
  },
  first_story: {
    key: "first_story",
    title: "Vypravěč",
    description: "Vytvoř svůj první Story Notebook",
    icon: "📖",
    creditReward: 10,
    category: "creation",
  },
  power_user: {
    key: "power_user",
    title: "Power User",
    description: "Utrati 500 kreditů celkem",
    icon: "💎",
    creditReward: 100,
    category: "milestone",
  },
};

// ── Streak Helpers ─────────────────────────────────────────────────────────────
function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

function isToday(date: Date): boolean {
  return date.toDateString() === new Date().toDateString();
}

// ── Achievement Checker ────────────────────────────────────────────────────────
async function checkAndUnlockAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const unlocked: string[] = [];

  const existing = await db.select({ key: userAchievements.achievementKey })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const unlockedKeys = new Set(existing.map(e => e.key));

  async function unlock(achievementKey: string) {
    if (unlockedKeys.has(achievementKey)) return;
    const ach = ACHIEVEMENTS[achievementKey];
    if (!ach) return;
    await db!.insert(userAchievements).values({
      userId,
      achievementKey,
      creditReward: ach.creditReward,
      notified: false,
    });
    if (ach.creditReward > 0) {
      await db!.insert(creditTransactions).values({
        userId,
        amount: ach.creditReward,
        type: "signup_bonus",
        description: `Achievement: ${ach.title}`,
        referenceId: achievementKey,
      });
    }
    unlocked.push(achievementKey);
    unlockedKeys.add(achievementKey);
  }

  // Video count checks
  const [videoRow] = await db.select({ c: count() }).from(videoProjects).where(eq(videoProjects.userId, userId));
  const vCount = videoRow?.c ?? 0;
  if (vCount >= 1) await unlock("first_video");
  if (vCount >= 10) await unlock("videos_10");
  if (vCount >= 50) await unlock("videos_50");

  // Character count checks
  const [charRow] = await db.select({ c: count() }).from(characters).where(eq(characters.userId, userId));
  const cCount = charRow?.c ?? 0;
  if (cCount >= 1) await unlock("first_soul");
  if (cCount >= 5) await unlock("characters_5");

  // Generation count checks
  const [genRow] = await db.select({ c: count() }).from(generations).where(eq(generations.userId, userId));
  if ((genRow?.c ?? 0) >= 1) await unlock("first_generate");

  // Total credits spent
  const [spentRow] = await db.select({ total: sql<number>`COALESCE(SUM(ABS(amount)), 0)` })
    .from(creditTransactions)
    .where(and(eq(creditTransactions.userId, userId), sql`amount < 0`));
  if ((spentRow?.total ?? 0) >= 500) await unlock("power_user");

  return unlocked;
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const gamificationRouter = router({
  // Get full gamification status
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const userId = ctx.user.id;

    // Get or create streak record
    let streakRows = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
    if (streakRows.length === 0) {
      await db.insert(userStreaks).values({ userId });
      streakRows = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
    }
    const streak = streakRows[0];

    // Get achievements
    const achievements = await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));

    const lastClaimed = streak?.lastClaimedAt ? new Date(streak.lastClaimedAt) : null;
    const canClaimDaily = !lastClaimed || !isToday(lastClaimed);

    const currentStreak = streak?.currentStreak ?? 0;
    let dailyBonusAmount = 5;
    if (currentStreak >= 30) dailyBonusAmount = 25;
    else if (currentStreak >= 14) dailyBonusAmount = 15;
    else if (currentStreak >= 7) dailyBonusAmount = 10;

    const pendingNotifications = achievements.filter(a => !a.notified);

    return {
      streak: {
        current: currentStreak,
        longest: streak?.longestStreak ?? 0,
        totalDays: streak?.totalDaysClaimed ?? 0,
        lastClaimedAt: streak?.lastClaimedAt ?? null,
        canClaimDaily,
        dailyBonusAmount,
        streakFreezeUsed: streak?.streakFreezeUsed ?? false,
      },
      achievements: achievements.map(a => ({
        ...a,
        definition: ACHIEVEMENTS[a.achievementKey] ?? null,
      })),
      allAchievements: Object.values(ACHIEVEMENTS).map(def => ({
        ...def,
        unlocked: achievements.some(a => a.achievementKey === def.key),
        unlockedAt: achievements.find(a => a.achievementKey === def.key)?.unlockedAt ?? null,
      })),
      pendingNotifications: pendingNotifications.map(a => ({
        ...a,
        definition: ACHIEVEMENTS[a.achievementKey] ?? null,
      })),
    };
  }),

  // Claim daily bonus
  claimDaily: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const userId = ctx.user.id;

    let streakRows = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
    if (streakRows.length === 0) {
      await db.insert(userStreaks).values({ userId });
      streakRows = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));
    }
    const streak = streakRows[0];
    const lastClaimed = streak?.lastClaimedAt ? new Date(streak.lastClaimedAt) : null;

    if (lastClaimed && isToday(lastClaimed)) {
      throw new Error("Denní bonus byl již dnes vybrán");
    }

    let newStreak = 1;
    if (lastClaimed && isYesterday(lastClaimed)) {
      newStreak = (streak?.currentStreak ?? 0) + 1;
    }

    const newLongest = Math.max(newStreak, streak?.longestStreak ?? 0);

    let bonusAmount = 5;
    if (newStreak >= 30) bonusAmount = 25;
    else if (newStreak >= 14) bonusAmount = 15;
    else if (newStreak >= 7) bonusAmount = 10;

    await db.update(userStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastClaimedAt: new Date(),
        totalDaysClaimed: (streak?.totalDaysClaimed ?? 0) + 1,
      })
      .where(eq(userStreaks.userId, userId));

    await db.insert(creditTransactions).values({
      userId,
      amount: bonusAmount,
      type: "signup_bonus",
      description: `Denní bonus — den ${newStreak} v řadě`,
      referenceId: `daily_${new Date().toISOString().slice(0, 10)}`,
    });

    // Check streak achievements
    const existing = await db.select({ key: userAchievements.achievementKey })
      .from(userAchievements).where(eq(userAchievements.userId, userId));
    const unlockedKeys = new Set(existing.map(e => e.key));
    const newlyUnlocked: string[] = [];

    async function unlockStreakAch(achievementKey: string) {
      if (unlockedKeys.has(achievementKey)) return;
      const ach = ACHIEVEMENTS[achievementKey];
      if (!ach) return;
      await db!.insert(userAchievements).values({
        userId, achievementKey, creditReward: ach.creditReward, notified: false,
      });
      if (ach.creditReward > 0) {
        await db!.insert(creditTransactions).values({
          userId, amount: ach.creditReward, type: "signup_bonus",
          description: `Achievement: ${ach.title}`, referenceId: achievementKey,
        });
      }
      newlyUnlocked.push(achievementKey);
    }

    if (newStreak >= 3) await unlockStreakAch("streak_3");
    if (newStreak >= 7) await unlockStreakAch("streak_7");
    if (newStreak >= 30) await unlockStreakAch("streak_30");

    return {
      bonusAmount,
      newStreak,
      newlyUnlocked: newlyUnlocked.map(k => ({ achievementKey: k, ...ACHIEVEMENTS[k] })),
    };
  }),

  // Mark notifications as seen
  markNotified: protectedProcedure
    .input(z.object({ achievementIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      for (const id of input.achievementIds) {
        await db.update(userAchievements)
          .set({ notified: true })
          .where(and(
            eq(userAchievements.id, id),
            eq(userAchievements.userId, ctx.user.id)
          ));
      }
      return { ok: true };
    }),

  // Trigger achievement check (called after key actions)
  checkAchievements: protectedProcedure.mutation(async ({ ctx }) => {
    const unlocked = await checkAndUnlockAchievements(ctx.user.id);
    return {
      newlyUnlocked: unlocked.map(k => ({ achievementKey: k, ...ACHIEVEMENTS[k] })),
    };
  }),
});
