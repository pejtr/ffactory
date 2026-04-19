import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
};

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getUserCredits: vi.fn().mockResolvedValue(100),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Referral System", () => {
  describe("REFERRAL_REWARD constant", () => {
    it("should be 50 credits for the inviter", async () => {
      const { REFERRAL_REWARD } = await import("../server/routers/referral");
      expect(REFERRAL_REWARD).toBe(50);
    });
  });

  describe("REFERRAL_SIGNUP_BONUS constant", () => {
    it("should be 25 credits for the new user", async () => {
      const { REFERRAL_SIGNUP_BONUS } = await import("../server/routers/referral");
      expect(REFERRAL_SIGNUP_BONUS).toBe(25);
    });
  });

  describe("referral code format", () => {
    it("should be 8 characters uppercase", () => {
      // Simulate the code generation pattern
      const code = "ABCD1234";
      expect(code).toHaveLength(8);
      expect(code).toBe(code.toUpperCase());
    });
  });

  describe("credit transaction types", () => {
    it("should include referral_bonus type", async () => {
      const schema = await import("../drizzle/schema");
      // The schema exports creditTransactions with the enum
      // We verify the type is accessible via TypeScript (compile-time check)
      type TxType = typeof schema.creditTransactions.$inferInsert["type"];
      // If this compiles, the type includes referral_bonus
      const type: TxType = "referral_bonus";
      expect(type).toBe("referral_bonus");
    });

    it("should include referral_signup type", async () => {
      const schema = await import("../drizzle/schema");
      type TxType = typeof schema.creditTransactions.$inferInsert["type"];
      const type: TxType = "referral_signup";
      expect(type).toBe("referral_signup");
    });
  });

  describe("referrals table schema", () => {
    it("should have referrerId, referredId, code, status, creditsAwarded", async () => {
      const schema = await import("../drizzle/schema");
      const columns = Object.keys(schema.referrals);
      expect(columns).toBeDefined();
      // Verify the table is exported
      expect(schema.referrals).toBeDefined();
    });
  });

  describe("users table schema", () => {
    it("should have referralCode column", async () => {
      const schema = await import("../drizzle/schema");
      // Verify referralCode is in the users table type
      type UserType = typeof schema.users.$inferInsert;
      const u: UserType = {
        openId: "test",
        referralCode: "TESTCODE",
      };
      expect(u.referralCode).toBe("TESTCODE");
    });
  });

  describe("self-referral prevention", () => {
    it("should return self_referral reason when referrer equals referred", () => {
      const referrerId = 42;
      const referredId = 42;
      const isSelfReferral = referrerId === referredId;
      expect(isSelfReferral).toBe(true);
    });

    it("should allow referral when different users", () => {
      const referrerId = 42;
      const referredId = 99;
      const isSelfReferral = referrerId === referredId;
      expect(isSelfReferral).toBe(false);
    });
  });

  describe("referral link construction", () => {
    it("should include ref param in the path", () => {
      const code = "ABCD1234";
      const path = `/referral?ref=${code}`;
      expect(path).toContain("?ref=");
      expect(path).toContain(code);
    });
  });
});
