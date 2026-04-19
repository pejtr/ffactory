import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, referrals, creditTransactions } from "../../drizzle/schema";
import { eq, and, count, sum } from "drizzle-orm";
import { nanoid } from "nanoid";

export const REFERRAL_REWARD = 50; // credits awarded to inviter per successful referral
export const REFERRAL_SIGNUP_BONUS = 25; // credits awarded to the new user who used a code

/**
 * Generate a unique 8-character referral code for a user.
 * Retries up to 5 times to avoid collisions.
 */
async function generateUniqueCode(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  for (let i = 0; i < 5; i++) {
    const code = nanoid(8).toUpperCase();
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error("Failed to generate unique referral code");
}

export const referralRouter = router({
  /**
   * Get (or lazily generate) the current user's referral code and invite link.
   */
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    let [user] = await db.select({ id: users.id, referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user.referralCode) {
      const code = await generateUniqueCode();
      await db.update(users).set({ referralCode: code }).where(eq(users.id, ctx.user.id));
      user = { ...user, referralCode: code };
    }

    return {
      code: user.referralCode!,
      // Frontend will prepend window.location.origin
      path: `/referral?ref=${user.referralCode}`,
    };
  }),

  /**
   * Return referral statistics for the current user.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalReferrals: 0, creditsEarned: 0, referrals: [] };

    const rows = await db.select({
      id: referrals.id,
      referredId: referrals.referredId,
      creditsAwarded: referrals.creditsAwarded,
      createdAt: referrals.createdAt,
      referredName: users.name,
    })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(referrals.createdAt);

    const creditsEarned = rows.reduce((acc, r) => acc + (r.creditsAwarded ?? 0), 0);

    return {
      totalReferrals: rows.length,
      creditsEarned,
      referrals: rows.map((r) => ({
        id: r.id,
        referredName: r.referredName ?? "Anonymní uživatel",
        creditsAwarded: r.creditsAwarded,
        createdAt: r.createdAt,
      })),
    };
  }),

  /**
   * Apply a referral code for the current user (called after first login).
   * Awards REFERRAL_REWARD credits to the inviter and REFERRAL_SIGNUP_BONUS to the new user.
   * Idempotent — silently ignores if the user already used a code.
   */
  applyCode: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const code = input.code.trim().toUpperCase();

      // Check if this user already used any referral code
      const alreadyUsed = await db.select({ id: referrals.id })
        .from(referrals)
        .where(eq(referrals.referredId, ctx.user.id))
        .limit(1);

      if (alreadyUsed.length > 0) {
        return { success: false, reason: "already_used" };
      }

      // Find the referrer by code
      const [referrer] = await db.select({ id: users.id, referralCode: users.referralCode })
        .from(users)
        .where(eq(users.referralCode, code))
        .limit(1);

      if (!referrer) {
        return { success: false, reason: "invalid_code" };
      }

      // Cannot refer yourself
      if (referrer.id === ctx.user.id) {
        return { success: false, reason: "self_referral" };
      }

      // Record the referral
      await db.insert(referrals).values({
        referrerId: referrer.id,
        referredId: ctx.user.id,
        code,
        status: "completed",
        creditsAwarded: REFERRAL_REWARD,
      });

      // Award credits to the inviter
      await db.insert(creditTransactions).values({
        userId: referrer.id,
        amount: REFERRAL_REWARD,
        type: "referral_bonus",
        description: `Pozvánka přijata — nový uživatel se zaregistroval přes tvůj odkaz`,
        referenceId: String(ctx.user.id),
      });

      // Award signup bonus to the new user
      await db.insert(creditTransactions).values({
        userId: ctx.user.id,
        amount: REFERRAL_SIGNUP_BONUS,
        type: "referral_signup",
        description: `Bonus za registraci přes referral odkaz`,
        referenceId: String(referrer.id),
      });

      return { success: true, creditsEarned: REFERRAL_SIGNUP_BONUS };
    }),
});
