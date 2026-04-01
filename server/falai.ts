// ─── fal.ai Integration ───────────────────────────────────────────────────────
// Models: Hailuo MiniMax 2.3 (B-roll), WAN 2.2 T2V/I2V (lip-sync, dream)
// Auth: Key-based via Authorization header

const FAL_BASE = "https://fal.run";
const FAL_QUEUE = "https://queue.fal.run";

function getFalApiKey(): string {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_API_KEY is not configured. Please add it in Settings → Secrets.");
  return key;
}

// ─── Check if fal.ai is available (key is set) ────────────────────────────────
export function isFalAvailable(): boolean {
  return Boolean(process.env.FAL_API_KEY);
}

// ─── Validate fal.ai key by calling the models list endpoint ──────────────────
export async function validateFalApiKey(): Promise<{ valid: boolean; error?: string }> {
  try {
    const key = getFalApiKey();
    // Use a lightweight status check — just verify auth works
    const res = await fetch(`${FAL_QUEUE}/fal-ai/wan/v2.2/t2v`, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { prompt: "test", resolution: "480p", num_frames: 1 },
      }),
    });
    // 200 or 422 (validation error) both mean the key is valid
    // 401 means invalid key
    if (res.status === 401) {
      return { valid: false, error: "Invalid FAL_API_KEY — authentication failed." };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Core Request Helpers ─────────────────────────────────────────────────────

async function falRequest(modelId: string, input: unknown): Promise<unknown> {
  const key = getFalApiKey();
  const res = await fetch(`${FAL_BASE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai error ${res.status} for ${modelId}: ${text}`);
  }
  return res.json();
}

async function falQueueSubmit(modelId: string, input: unknown): Promise<string> {
  const key = getFalApiKey();
  const res = await fetch(`${FAL_QUEUE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai queue submit error ${res.status} for ${modelId}: ${text}`);
  }
  const data = (await res.json()) as { request_id: string };
  if (!data.request_id) throw new Error(`fal.ai: no request_id returned for ${modelId}`);
  return data.request_id;
}

async function falQueueStatus(modelId: string, requestId: string): Promise<{ status: string; error?: string }> {
  const key = getFalApiKey();
  const res = await fetch(`${FAL_QUEUE}/${modelId}/requests/${requestId}/status`, {
    headers: { Authorization: `Key ${key}` },
  });
  if (!res.ok) throw new Error(`fal.ai status check error ${res.status} for request ${requestId}`);
  return res.json() as Promise<{ status: string; error?: string }>;
}

async function falQueueResult(modelId: string, requestId: string): Promise<unknown> {
  const key = getFalApiKey();
  const res = await fetch(`${FAL_QUEUE}/${modelId}/requests/${requestId}`, {
    headers: { Authorization: `Key ${key}` },
  });
  if (!res.ok) throw new Error(`fal.ai result fetch error ${res.status} for request ${requestId}`);
  return res.json();
}

export async function falPollResult(
  modelId: string,
  requestId: string,
  maxWaitMs = 600000 // 10 minutes max for video generation
): Promise<unknown> {
  const start = Date.now();
  let pollInterval = 5000; // Start at 5s, back off to 15s

  while (Date.now() - start < maxWaitMs) {
    const status = await falQueueStatus(modelId, requestId);

    if (status.status === "COMPLETED") {
      return falQueueResult(modelId, requestId);
    }
    if (status.status === "FAILED") {
      throw new Error(`fal.ai job FAILED for ${modelId}: ${status.error ?? "unknown error"}`);
    }
    // IN_QUEUE or IN_PROGRESS — keep polling
    await new Promise((r) => setTimeout(r, pollInterval));
    // Gradually back off: 5s → 10s → 15s
    if (pollInterval < 15000) pollInterval = Math.min(pollInterval + 2500, 15000);
  }
  throw new Error(`fal.ai job timed out after ${maxWaitMs / 1000}s for ${modelId}`);
}

// ─── Hailuo MiniMax 2.3 — Cinematic B-roll ───────────────────────────────────
// Best for: establishing shots, space/nature/architecture, transitions
// Cost: ~$0.047/sec (cheapest option)

export async function hailiuoTextToVideo(params: {
  prompt: string;
  resolution?: "768p" | "1080p";
  duration?: 6;
}): Promise<string | null> {
  // Correct fal.ai model ID for Hailuo MiniMax Video 01 Live
  const modelId = "fal-ai/minimax/video-01-live/text-to-video";

  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, requestId)) as {
    video?: { url: string };
    output?: { video?: { url: string } };
  };
  // Handle both response shapes
  return result?.video?.url ?? result?.output?.video?.url ?? null;
}

export async function hailiuoImageToVideo(params: {
  imageUrl: string;
  prompt: string;
}): Promise<string | null> {
  const modelId = "fal-ai/minimax/video-01-live/image-to-video";
  const requestId = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, requestId)) as {
    video?: { url: string };
    output?: { video?: { url: string } };
  };
  return result?.video?.url ?? result?.output?.video?.url ?? null;
}

// ─── WAN 2.2 Image-to-Video — Lip-sync / Speech-to-Video ─────────────────────
// Best for: lip sync scenes, singing, detailed mouth movement
// Cost: ~$0.20/sec

export async function wan22ImageToVideo(params: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  resolution?: "480p" | "720p";
}): Promise<string | null> {
  const modelId = "fal-ai/wan/v2.2/i2v";
  const requestId = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted, watermark",
    resolution: params.resolution ?? "720p",
    num_frames: 81,
  });
  const result = (await falPollResult(modelId, requestId)) as {
    video?: { url: string };
    output?: { video?: { url: string } };
  };
  return result?.video?.url ?? result?.output?.video?.url ?? null;
}

// ─── WAN 2.2 Text-to-Video — Dream / Surreal sequences ───────────────────────
// Best for: dream sequences, surreal/abstract visuals, fantasy landscapes
// Cost: ~$0.08/sec

export async function wan22TextToVideo(params: {
  prompt: string;
  negativePrompt?: string;
  resolution?: "480p" | "720p";
}): Promise<string | null> {
  const modelId = "fal-ai/wan/v2.2/t2v";
  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, watermark, text overlay",
    resolution: params.resolution ?? "720p",
    num_frames: 81,
  });
  const result = (await falPollResult(modelId, requestId)) as {
    video?: { url: string };
    output?: { video?: { url: string } };
  };
  return result?.video?.url ?? result?.output?.video?.url ?? null;
}

// ─── Generate Image via fal.ai (for character Soul ID) ───────────────────────
export async function falGenerateImage(params: {
  prompt: string;
  imageUrl?: string; // reference image for consistency
  modelId?: string;
}): Promise<string> {
  const modelId = params.modelId ?? "fal-ai/flux/schnell";
  const input: Record<string, unknown> = { prompt: params.prompt };
  if (params.imageUrl) {
    input.image_url = params.imageUrl;
  }
  const result = (await falRequest(modelId, input)) as {
    images?: Array<{ url: string }>;
  };
  return result?.images?.[0]?.url ?? "";
}
