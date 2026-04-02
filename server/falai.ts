// ─── fal.ai Integration ───────────────────────────────────────────────────────
// Models: Hailuo MiniMax 2.3, WAN 2.2, Nano Banana 2, Seedream 5, Kling Edit
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
  maxWaitMs = 600000
): Promise<unknown> {
  const start = Date.now();
  let pollInterval = 5000;

  while (Date.now() - start < maxWaitMs) {
    const status = await falQueueStatus(modelId, requestId);

    if (status.status === "COMPLETED") {
      return falQueueResult(modelId, requestId);
    }
    if (status.status === "FAILED") {
      throw new Error(`fal.ai job FAILED for ${modelId}: ${status.error ?? "unknown error"}`);
    }
    await new Promise((r) => setTimeout(r, pollInterval));
    if (pollInterval < 15000) pollInterval = Math.min(pollInterval + 2500, 15000);
  }
  throw new Error(`fal.ai job timed out after ${maxWaitMs / 1000}s for ${modelId}`);
}

// ─── Hailuo MiniMax 2.3 — Cinematic B-roll ───────────────────────────────────
export async function hailiuoTextToVideo(params: {
  prompt: string;
  resolution?: "768p" | "1080p";
  duration?: 6;
}): Promise<string | null> {
  const modelId = "fal-ai/minimax/video-01-live/text-to-video";
  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, requestId)) as {
    video?: { url: string };
    output?: { video?: { url: string } };
  };
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

// ─── WAN 2.2 Image-to-Video ───────────────────────────────────────────────────
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

// ─── WAN 2.2 Text-to-Video ────────────────────────────────────────────────────
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

// ─── Nano Banana 2 — Text-to-Image (Google Gemini Flash) ─────────────────────
// Best for: fast high-quality image generation, concept art, scene thumbnails
export async function nanoBanana2TextToImage(params: {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9";
  resolution?: "0.5K" | "1K" | "2K" | "4K";
  numImages?: number;
  seed?: number;
  thinkingLevel?: "minimal" | "high";
}): Promise<{ urls: string[]; description: string }> {
  const modelId = "fal-ai/nano-banana-2";
  const result = (await falRequest(modelId, {
    prompt: params.prompt,
    aspect_ratio: params.aspectRatio ?? "1:1",
    resolution: params.resolution ?? "1K",
    num_images: params.numImages ?? 1,
    seed: params.seed,
    thinking_level: params.thinkingLevel,
    limit_generations: true,
  })) as { images?: Array<{ url: string }>; description?: string };
  return {
    urls: result?.images?.map((i) => i.url) ?? [],
    description: result?.description ?? "",
  };
}

// ─── Nano Banana 2 — Image Edit (I2I) ────────────────────────────────────────
// Best for: editing existing images with natural language instructions
export async function nanoBanana2EditImage(params: {
  prompt: string;
  imageUrl: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  resolution?: "0.5K" | "1K" | "2K" | "4K";
}): Promise<{ urls: string[]; description: string }> {
  const modelId = "fal-ai/nano-banana-2/edit";
  const result = (await falRequest(modelId, {
    prompt: params.prompt,
    image_url: params.imageUrl,
    aspect_ratio: params.aspectRatio ?? "1:1",
    resolution: params.resolution ?? "1K",
    limit_generations: true,
  })) as { images?: Array<{ url: string }>; description?: string };
  return {
    urls: result?.images?.map((i) => i.url) ?? [],
    description: result?.description ?? "",
  };
}

// ─── Seedream 5 Lite — Multi-Image Edit ──────────────────────────────────────
// Best for: complex multi-image editing, product design, style transfer
// Supports up to 10 input images, reference via prompt as Figure 1, Figure 2...
export async function seedream5Edit(params: {
  prompt: string;
  imageUrls: string[];  // up to 10 images
  imageSize?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9" | "auto_2K" | "auto_3K";
  numImages?: number;
}): Promise<{ urls: string[]; seed: number }> {
  const modelId = "fal-ai/bytedance/seedream/v5/lite/edit";
  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    image_urls: params.imageUrls.slice(0, 10),
    image_size: params.imageSize ?? "auto_2K",
    num_images: params.numImages ?? 1,
    enable_safety_checker: false,
  });
  const result = (await falPollResult(modelId, requestId)) as {
    images?: Array<{ url: string }>;
    seed?: number;
  };
  return {
    urls: result?.images?.map((i) => i.url) ?? [],
    seed: result?.seed ?? 0,
  };
}

// ─── Kling O1 Video Edit — Video-to-Video with natural language ───────────────
// Best for: transforming existing videos, changing style/character/background
// video_url: mp4/mov, 3-10s, 720-2160px, max 200MB
// Use @Element1, @Element2 for character refs, @Image1, @Image2 for image refs
export async function klingVideoEdit(params: {
  prompt: string;
  videoUrl: string;
  imageUrls?: string[];    // reference images (max 4 total with elements)
  elements?: Array<{       // character elements
    frontalImageUrl: string;
    referenceImageUrls?: string[];
  }>;
  keepAudio?: boolean;
}): Promise<string | null> {
  const modelId = "fal-ai/kling-video/o1/video-to-video/edit";
  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    video_url: params.videoUrl,
    image_urls: params.imageUrls,
    elements: params.elements?.map((e) => ({
      frontal_image_url: e.frontalImageUrl,
      reference_image_urls: e.referenceImageUrls,
    })),
    keep_audio: params.keepAudio ?? true,
  });
  const result = (await falPollResult(modelId, requestId, 900000)) as {
    video?: { url: string };
    output?: { video?: { url: string } };
  };
  return result?.video?.url ?? result?.output?.video?.url ?? null;
}

// ─── Kling 3.0 Pro I2V via fal.ai ────────────────────────────────────────────
export async function klingI2VFal(params: {
  imageUrl: string;
  prompt: string;
  duration?: "5" | "10";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  cfgScale?: number;
  negativePrompt?: string;
}): Promise<string | null> {
  const modelId = "fal-ai/kling-video/v3/pro/image-to-video";
  const requestId = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    duration: params.duration ?? "5",
    aspect_ratio: params.aspectRatio ?? "16:9",
    cfg_scale: params.cfgScale ?? 0.5,
    negative_prompt: params.negativePrompt ?? "blur, distort, low quality",
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
  imageUrl?: string;
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
