import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB helpers
vi.mock("./db", () => ({
  createVideoProject: vi.fn().mockResolvedValue(42),
  getVideoProject: vi.fn().mockResolvedValue({
    id: 42, userId: 1, title: "Test Film", idea: "A test idea",
    status: "draft", genre: "Sci-Fi Drama", emotionalTone: "Epic",
    dreamMode: false, targetDuration: 60, shareToken: "abc123",
    finalVideoUrl: null, estimatedCostUsd: 0.05, errorMessage: null,
    createdAt: new Date(), updatedAt: new Date(),
  }),
  getUserProjects: vi.fn().mockResolvedValue([]),
  getProjectScenes: vi.fn().mockResolvedValue([]),
  getProjectAudioTracks: vi.fn().mockResolvedValue([]),
  getVideoProjectByToken: vi.fn().mockResolvedValue(null),
  getUserCharacters: vi.fn().mockResolvedValue([]),
  createCharacter: vi.fn().mockResolvedValue(10),
  getCharacter: vi.fn().mockResolvedValue({
    id: 10, userId: 1, name: "O'Neill", description: "Colonel",
    personality: "Sarcastic", voiceId: null, voiceName: null,
    soulIdImageUrl: null, createdAt: new Date(), updatedAt: new Date(),
  }),
  updateCharacterSoulId: vi.fn().mockResolvedValue(undefined),
  deleteCharacter: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
}));

vi.mock("./screenplay", () => ({
  generateScreenplay: vi.fn().mockResolvedValue({
    title: "Stargate: Legacy",
    logline: "SG-1 discovers Destiny-class tech beneath Atlantis.",
    genre: "Sci-Fi Drama",
    emotionalArc: "Epic & Triumphant",
    totalDuration: 60,
    bgmPrompt: "Epic orchestral",
    bgmStyle: "Hans Zimmer",
    characters: [{ name: "O'Neill", description: "Colonel" }],
    scenes: [
      {
        index: 0, title: "SGC Briefing", description: "The team gathers.",
        dialogue: "We have a situation.", visualPrompt: "SGC briefing room",
        emotion: "tense", sceneType: "dialogue", videoModel: "kling-v3-omni",
        characters: ["O'Neill"], duration: 10, cameraMove: "static",
        location: "SGC", timeOfDay: "day", soundscape: "ambient",
      },
    ],
  }),
  calculateTotalCost: vi.fn().mockReturnValue(0.05),
}));

vi.mock("./pipeline", () => ({
  runVideoPipeline: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/soul.png" }),
}));

vi.mock("./audio", () => ({
  elevenLabsListVoices: vi.fn().mockResolvedValue({ voices: [] }),
}));

function makeCtx(userId = 1): TrpcContext {
  return {
    user: {
      id: userId, openId: "test-user", email: "test@example.com",
      name: "Test User", loginMethod: "manus", role: "user",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Video Factory — video router", () => {
  it("lists user projects", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.video.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("previews screenplay from idea", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.video.preview({
      idea: "SG-1 discovers a Destiny-class ship beneath Atlantis",
      genre: "Sci-Fi Drama",
      emotionalTone: "Epic & Triumphant",
      dreamMode: false,
      targetDuration: 60,
    });
    expect(result.screenplay.title).toBe("Stargate: Legacy");
    expect(result.estimatedCostUsd).toBe(0.05);
    expect(result.screenplay.scenes).toHaveLength(1);
  });

  it("creates a video project and starts pipeline", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.video.create({
      idea: "SG-1 discovers a Destiny-class ship beneath Atlantis",
      genre: "Sci-Fi Drama",
    });
    expect(result.projectId).toBe(42);
  });

  it("returns project status with scenes", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.video.status({ id: 42 });
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Film");
    expect(result?.status).toBe("draft");
    expect(result?.scenes).toEqual([]);
  });

  it("returns null for shared video with invalid token", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.video.getShared({ token: "invalid-token" });
    expect(result).toBeNull();
  });
});

describe("Video Factory — characters router", () => {
  it("lists user characters", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.characters.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a character", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.characters.create({
      name: "Colonel Jack O'Neill",
      description: "Tall, silver-haired military officer",
      personality: "Sarcastic but brave",
      voiceName: "Deep American male",
    });
    expect(result.id).toBe(10);
  });

  it("generates Soul ID for character", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.characters.generateSoulId({ characterId: 10 });
    expect(result.soulIdImageUrl).toBe("https://cdn.example.com/soul.png");
  });

  it("deletes a character", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.characters.delete({ characterId: 10 });
    expect(result.success).toBe(true);
  });

  it("gets a specific character", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.characters.get({ id: 10 });
    expect(result?.name).toBe("O'Neill");
  });
});

describe("Video Factory — audio router", () => {
  it("lists ElevenLabs voices", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.audio.listVoices();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Video Factory — auth router", () => {
  it("returns current user from me query", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result?.name).toBe("Test User");
  });

  it("clears session cookie on logout", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
