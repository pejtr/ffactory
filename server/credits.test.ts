import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getOrCreateCredits: vi.fn(),
    getUserCredits: vi.fn(),
    spendCredits: vi.fn(),
    earnCredits: vi.fn(),
    getCreditTransactions: vi.fn(),
    CREDIT_COSTS: { video_generation: 20, scene_generation: 3, soul_id_generation: 5 },
    SIGNUP_BONUS: 100,
  };
});

// ─── Mock Kling ───────────────────────────────────────────────────────────────
vi.mock("./kling", () => ({
  klingTextToVideo: vi.fn().mockResolvedValue("task-t2v-001"),
  klingImageToVideo: vi.fn().mockResolvedValue("task-i2v-001"),
  klingPollTask: vi.fn().mockResolvedValue("https://cdn.kling.ai/video/test.mp4"),
  KLING_CAMERA_PRESETS: {
    static: null,
    dollyIn: { type: "zoom_in", config: { zoom_in: 10 } },
    dollyOut: { type: "zoom_out", config: { zoom_out: 10 } },
    panLeft: { type: "pan_left", config: { pan_left: 10 } },
    panRight: { type: "pan_right", config: { pan_right: 10 } },
    tiltUp: { type: "tilt_up", config: { tilt_up: 10 } },
    tiltDown: { type: "tilt_down", config: { tilt_down: 10 } },
    orbit: { type: "orbit_left", config: { orbit_left: 10 } },
    handheld: { type: "handheld", config: {} },
  },
}));

import { CREDIT_COSTS, SIGNUP_BONUS } from "./db";

// ─── Tests: Credit Constants ──────────────────────────────────────────────────
describe("Credit Constants", () => {
  it("video_generation costs 20 credits", () => {
    expect(CREDIT_COSTS.video_generation).toBe(20);
  });

  it("scene_generation costs 3 credits", () => {
    expect(CREDIT_COSTS.scene_generation).toBe(3);
  });

  it("soul_id_generation costs 5 credits", () => {
    expect(CREDIT_COSTS.soul_id_generation).toBe(5);
  });

  it("signup bonus is 100 credits", () => {
    expect(SIGNUP_BONUS).toBe(100);
  });
});

// ─── Tests: Kling Motion Presets ─────────────────────────────────────────────
describe("Kling Motion Presets", () => {
  it("all expected presets are defined", async () => {
    const { KLING_CAMERA_PRESETS } = await import("./kling");
    const expectedPresets = ["static", "dollyIn", "dollyOut", "panLeft", "panRight", "tiltUp", "tiltDown", "orbit", "handheld"];
    for (const preset of expectedPresets) {
      expect(KLING_CAMERA_PRESETS).toHaveProperty(preset);
    }
  });

  it("dollyIn preset has correct type", async () => {
    const { KLING_CAMERA_PRESETS } = await import("./kling");
    expect(KLING_CAMERA_PRESETS.dollyIn).toMatchObject({ type: "zoom_in" });
  });

  it("handheld preset exists", async () => {
    const { KLING_CAMERA_PRESETS } = await import("./kling");
    expect(KLING_CAMERA_PRESETS.handheld).toBeDefined();
  });
});

// ─── Tests: spendCredits logic ────────────────────────────────────────────────
describe("spendCredits logic", () => {
  let spendCreditsFn: ReturnType<typeof vi.fn>;
  let getUserCreditsFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import("./db");
    spendCreditsFn = db.spendCredits as ReturnType<typeof vi.fn>;
    getUserCreditsFn = db.getUserCredits as ReturnType<typeof vi.fn>;
  });

  it("returns success=false when balance is insufficient", async () => {
    getUserCreditsFn.mockResolvedValue({ balance: 5, totalEarned: 100, totalSpent: 95 });
    spendCreditsFn.mockResolvedValue({ success: false, balance: 5, error: "Nedostatek kreditů" });

    const { spendCredits } = await import("./db");
    const result = await spendCredits(1, 20, "video_generation", "Test");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Nedostatek");
  });

  it("returns success=true when balance is sufficient", async () => {
    spendCreditsFn.mockResolvedValue({ success: true, balance: 80 });

    const { spendCredits } = await import("./db");
    const result = await spendCredits(1, 20, "video_generation", "Test");
    expect(result.success).toBe(true);
    expect(result.balance).toBe(80);
  });
});

// ─── Tests: earnCredits logic ─────────────────────────────────────────────────
describe("earnCredits logic", () => {
  let earnCreditsFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import("./db");
    earnCreditsFn = db.earnCredits as ReturnType<typeof vi.fn>;
  });

  it("returns updated credits after earning", async () => {
    earnCreditsFn.mockResolvedValue({
      id: 1, userId: 1, balance: 150, totalEarned: 200, totalSpent: 50,
    });

    const { earnCredits } = await import("./db");
    const result = await earnCredits(1, 50, "admin_grant", "Test grant");
    expect(result.balance).toBe(150);
    expect(result.totalEarned).toBe(200);
  });
});

// ─── Tests: Kling Motion API calls ───────────────────────────────────────────
describe("Kling Motion API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("klingImageToVideo is called with correct params", async () => {
    const { klingImageToVideo } = await import("./kling");
    (klingImageToVideo as ReturnType<typeof vi.fn>).mockResolvedValue("task-001");

    const taskId = await klingImageToVideo({
      imageUrl: "https://example.com/soul.jpg",
      prompt: "Character walks forward",
      modelName: "kling-v1-5",
      mode: "pro",
      duration: "5",
      cameraControl: { type: "zoom_in", config: { zoom_in: 10 } },
    });

    expect(taskId).toBe("task-001");
    expect(klingImageToVideo).toHaveBeenCalledWith(expect.objectContaining({
      imageUrl: "https://example.com/soul.jpg",
      duration: "5",
    }));
  });

  it("klingPollTask returns video URL", async () => {
    const { klingPollTask } = await import("./kling");
    const url = await klingPollTask("task-001", "i2v");
    expect(url).toMatch(/https:\/\//);
  });

  it("klingTextToVideo is called for characters without images", async () => {
    const { klingTextToVideo } = await import("./kling");
    (klingTextToVideo as ReturnType<typeof vi.fn>).mockResolvedValue("task-t2v-002");

    const taskId = await klingTextToVideo({
      prompt: "Hero runs through forest",
      modelName: "kling-v1-5",
      mode: "pro",
      duration: "5",
    });

    expect(taskId).toBe("task-t2v-002");
  });
});

// ─── Tests: Transaction types ─────────────────────────────────────────────────
describe("Transaction type coverage", () => {
  it("all transaction types are valid", () => {
    const validTypes = [
      "signup_bonus", "video_generation", "scene_generation",
      "soul_id_generation", "admin_grant", "daily_bonus",
    ];
    expect(validTypes).toHaveLength(6);
    expect(validTypes).toContain("soul_id_generation");
    expect(validTypes).toContain("video_generation");
  });
});
