const FAL_API_KEY = process.env.FAL_API_KEY!;
const FAL_BASE = "https://fal.run";
const FAL_QUEUE = "https://queue.fal.run";

async function falRequest(modelId: string, input: unknown): Promise<unknown> {
  const res = await fetch(`${FAL_BASE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
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
  const res = await fetch(`${FAL_QUEUE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai queue error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { request_id: string };
  return data.request_id;
}

async function falQueueStatus(modelId: string, requestId: string): Promise<unknown> {
  const res = await fetch(`${FAL_QUEUE}/${modelId}/requests/${requestId}/status`, {
    headers: { Authorization: `Key ${FAL_API_KEY}` },
  });
  if (!res.ok) throw new Error(`fal.ai status error ${res.status}`);
  return res.json();
}

async function falQueueResult(modelId: string, requestId: string): Promise<unknown> {
  const res = await fetch(`${FAL_QUEUE}/${modelId}/requests/${requestId}`, {
    headers: { Authorization: `Key ${FAL_API_KEY}` },
  });
  if (!res.ok) throw new Error(`fal.ai result error ${res.status}`);
  return res.json();
}

export async function falPollResult(
  modelId: string,
  requestId: string,
  maxWaitMs = 300000
): Promise<unknown> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = (await falQueueStatus(modelId, requestId)) as { status: string };
    if (status.status === "COMPLETED") {
      return falQueueResult(modelId, requestId);
    }
    if (status.status === "FAILED") {
      throw new Error(`fal.ai job failed for ${modelId}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`fal.ai job timed out for ${modelId}`);
}

// ─── Hailuo MiniMax 2.3 — Cinematic B-roll ───────────────────────────────────
export async function hailiuoTextToVideo(params: {
  prompt: string;
  resolution?: "768p" | "1080p";
  duration?: 6;
}) {
  const modelId = params.resolution === "1080p"
    ? "fal-ai/minimax/video-01-live/text-to-video"
    : "fal-ai/minimax/video-01-live/text-to-video";

  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, requestId)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

export async function hailiuoImageToVideo(params: {
  imageUrl: string;
  prompt: string;
}) {
  const modelId = "fal-ai/minimax/video-01-live/image-to-video";
  const requestId = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, requestId)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

// ─── WAN 2.2 Image-to-Video ───────────────────────────────────────────────────
export async function wan22ImageToVideo(params: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  resolution?: "480p" | "720p";
}) {
  const modelId = "fal-ai/wan/v2.2/i2v";
  const requestId = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted",
    resolution: params.resolution ?? "720p",
    num_frames: 81,
  });
  const result = (await falPollResult(modelId, requestId)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

// ─── WAN 2.2 Text-to-Video ────────────────────────────────────────────────────
export async function wan22TextToVideo(params: {
  prompt: string;
  negativePrompt?: string;
  resolution?: "480p" | "720p";
}) {
  const modelId = "fal-ai/wan/v2.2/t2v";
  const requestId = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality",
    resolution: params.resolution ?? "720p",
    num_frames: 81,
  });
  const result = (await falPollResult(modelId, requestId)) as { video?: { url: string } };
  return result?.video?.url ?? null;
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
