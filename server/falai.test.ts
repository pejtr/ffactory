import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ─── Mock global fetch ────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Helper to import module fresh after env changes ─────────────────────────
async function importFalai() {
  vi.resetModules();
  return import("./falai");
}

describe("fal.ai — isFalAvailable()", () => {
  it("returns false when FAL_API_KEY is not set", async () => {
    const originalKey = process.env.FAL_API_KEY;
    delete process.env.FAL_API_KEY;
    const { isFalAvailable } = await importFalai();
    expect(isFalAvailable()).toBe(false);
    if (originalKey) process.env.FAL_API_KEY = originalKey;
  });

  it("returns true when FAL_API_KEY is set", async () => {
    process.env.FAL_API_KEY = "test-key-12345";
    const { isFalAvailable } = await importFalai();
    expect(isFalAvailable()).toBe(true);
  });
});

describe("fal.ai — validateFalApiKey()", () => {
  beforeEach(() => {
    process.env.FAL_API_KEY = "test-key-12345";
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.FAL_API_KEY;
  });

  it("returns valid=true when API responds with 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "req-abc" }),
    });
    const { validateFalApiKey } = await importFalai();
    const result = await validateFalApiKey();
    expect(result.valid).toBe(true);
  });

  it("returns valid=true when API responds with 422 (key valid, input rejected)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: "validation error" }),
    });
    const { validateFalApiKey } = await importFalai();
    const result = await validateFalApiKey();
    // 422 is NOT 401, so key is valid
    expect(result.valid).toBe(true);
  });

  it("returns valid=false when API responds with 401 (invalid key)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    });
    const { validateFalApiKey } = await importFalai();
    const result = await validateFalApiKey();
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid FAL_API_KEY");
  });

  it("returns valid=false when FAL_API_KEY is missing", async () => {
    delete process.env.FAL_API_KEY;
    const { validateFalApiKey } = await importFalai();
    const result = await validateFalApiKey();
    expect(result.valid).toBe(false);
    expect(result.error).toContain("FAL_API_KEY is not configured");
  });

  it("returns valid=false on network error", async () => {
    process.env.FAL_API_KEY = "test-key";
    mockFetch.mockRejectedValueOnce(new Error("Network unreachable"));
    const { validateFalApiKey } = await importFalai();
    const result = await validateFalApiKey();
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Network unreachable");
  });
});

describe("fal.ai — hailiuoTextToVideo()", () => {
  beforeEach(() => {
    process.env.FAL_API_KEY = "test-key-12345";
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.FAL_API_KEY;
  });

  it("submits to correct Hailuo MiniMax model ID and returns video URL", async () => {
    // Mock queue submit
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "hailuo-req-001" }),
    });
    // Mock status check — COMPLETED
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "COMPLETED" }),
    });
    // Mock result fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ video: { url: "https://cdn.fal.ai/hailuo/output.mp4" } }),
    });

    const { hailiuoTextToVideo } = await importFalai();
    const url = await hailiuoTextToVideo({ prompt: "Cinematic space shot, Milky Way galaxy" });

    expect(url).toBe("https://cdn.fal.ai/hailuo/output.mp4");

    // Verify correct model ID was used
    const submitCall = mockFetch.mock.calls[0];
    expect(submitCall[0]).toContain("fal-ai/minimax/video-01-live/text-to-video");

    // Verify Authorization header
    const headers = submitCall[1].headers;
    expect(headers.Authorization).toBe("Key test-key-12345");
  });

  it("throws error when FAL_API_KEY is not set", async () => {
    delete process.env.FAL_API_KEY;
    const { hailiuoTextToVideo } = await importFalai();
    await expect(hailiuoTextToVideo({ prompt: "test" })).rejects.toThrow("FAL_API_KEY is not configured");
  });

  it("throws error when queue submit fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });
    const { hailiuoTextToVideo } = await importFalai();
    await expect(hailiuoTextToVideo({ prompt: "test" })).rejects.toThrow("fal.ai queue submit error 500");
  });

  it("throws error when job fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "req-fail" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "FAILED", error: "GPU out of memory" }),
    });
    const { hailiuoTextToVideo } = await importFalai();
    await expect(hailiuoTextToVideo({ prompt: "test" })).rejects.toThrow("fal.ai job FAILED");
  });
});

describe("fal.ai — wan22TextToVideo()", () => {
  beforeEach(() => {
    process.env.FAL_API_KEY = "test-key-12345";
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.FAL_API_KEY;
  });

  it("submits to correct WAN 2.2 T2V model ID and returns video URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "wan-req-001" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "COMPLETED" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ video: { url: "https://cdn.fal.ai/wan/dream.mp4" } }),
    });

    const { wan22TextToVideo } = await importFalai();
    const url = await wan22TextToVideo({ prompt: "Surreal dream sequence, floating islands" });

    expect(url).toBe("https://cdn.fal.ai/wan/dream.mp4");

    const submitCall = mockFetch.mock.calls[0];
    expect(submitCall[0]).toContain("fal-ai/wan/v2.2/t2v");
    expect(submitCall[1].headers.Authorization).toBe("Key test-key-12345");
  });

  it("uses 720p resolution by default", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "wan-req-002" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "COMPLETED" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ video: { url: "https://cdn.fal.ai/wan/output.mp4" } }),
    });

    const { wan22TextToVideo } = await importFalai();
    await wan22TextToVideo({ prompt: "test" });

    const submitBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(submitBody.input.resolution).toBe("720p");
  });
});

describe("fal.ai — wan22ImageToVideo()", () => {
  beforeEach(() => {
    process.env.FAL_API_KEY = "test-key-12345";
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.FAL_API_KEY;
  });

  it("submits to correct WAN 2.2 I2V model ID with image_url", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ request_id: "wan-i2v-001" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: "COMPLETED" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ video: { url: "https://cdn.fal.ai/wan/lipsync.mp4" } }),
    });

    const { wan22ImageToVideo } = await importFalai();
    const url = await wan22ImageToVideo({
      imageUrl: "https://cdn.example.com/character.jpg",
      prompt: "Character speaking dialogue, lip sync",
    });

    expect(url).toBe("https://cdn.fal.ai/wan/lipsync.mp4");

    const submitCall = mockFetch.mock.calls[0];
    expect(submitCall[0]).toContain("fal-ai/wan/v2.2/i2v");

    const body = JSON.parse(submitCall[1].body);
    expect(body.input.image_url).toBe("https://cdn.example.com/character.jpg");
  });
});

describe("fal.ai — pipeline model fallback", () => {
  it("isFalAvailable returns false without key, enabling Kling fallback logic", async () => {
    delete process.env.FAL_API_KEY;
    const { isFalAvailable } = await importFalai();
    // When FAL is not available, pipeline should fall back to kling-v3-omni
    // This test verifies the guard function works correctly
    expect(isFalAvailable()).toBe(false);
  });

  it("isFalAvailable returns true with key set", async () => {
    process.env.FAL_API_KEY = "fal-key-abc123:secret456";
    const { isFalAvailable } = await importFalai();
    expect(isFalAvailable()).toBe(true);
    delete process.env.FAL_API_KEY;
  });
});
