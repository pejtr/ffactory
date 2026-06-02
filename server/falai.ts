const FAL_API_KEY = process.env.FAL_API_KEY!;
const FAL_BASE = "https://fal.run";
const FAL_QUEUE = "https://queue.fal.run";

// fal.ai REST API: input is sent directly (no { input: ... } wrapper)
// Status/result URLs come from the submit response — do NOT construct them from modelId

type FalQueueResponse = {
  request_id: string;
  status_url: string;
  response_url: string;
  cancel_url: string;
};

async function falRequest(modelId: string, input: unknown): Promise<unknown> {
  const res = await fetch(`${FAL_BASE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai error ${res.status} for ${modelId}: ${text}`);
  }
  return res.json();
}

async function falQueueSubmit(modelId: string, input: unknown): Promise<FalQueueResponse> {
  const res = await fetch(`${FAL_QUEUE}/${modelId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai queue error ${res.status}: ${text}`);
  }
  return res.json() as Promise<FalQueueResponse>;
}

async function falQueueStatusByUrl(statusUrl: string): Promise<{ status: string }> {
  const res = await fetch(statusUrl, {
    headers: { Authorization: `Key ${FAL_API_KEY}` },
  });
  if (!res.ok) throw new Error(`fal.ai status error ${res.status}`);
  return res.json() as Promise<{ status: string }>;
}

async function falQueueResultByUrl(responseUrl: string): Promise<unknown> {
  const res = await fetch(responseUrl, {
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
  // Reconstruct URLs using the pattern from fal.ai responses
  // Pattern: queue.fal.run/{namespace}/requests/{id}/status
  // where namespace is the first two path segments of modelId (e.g. "fal-ai/wan")
  const namespace = modelId.split("/").slice(0, 2).join("/");
  const statusUrl = `${FAL_QUEUE}/${namespace}/requests/${requestId}/status`;
  const responseUrl = `${FAL_QUEUE}/${namespace}/requests/${requestId}`;

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await falQueueStatusByUrl(statusUrl);
    if (status.status === "COMPLETED") {
      return falQueueResultByUrl(responseUrl);
    }
    if (status.status === "FAILED") {
      throw new Error(`fal.ai job failed for ${modelId}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`fal.ai job timed out for ${modelId}`);
}

// ─── Hailuo MiniMax — Cinematic B-roll ───────────────────────────────────────
export async function hailiuoTextToVideo(params: {
  prompt: string;
  resolution?: "768p" | "1080p";
  duration?: 6;
}) {
  const modelId = "fal-ai/minimax/video-01/text-to-video";
  const queueResp = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, queueResp.request_id)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

export async function hailiuoImageToVideo(params: {
  imageUrl: string;
  prompt: string;
}) {
  const modelId = "fal-ai/minimax/video-01/image-to-video";
  const queueResp = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    prompt_optimizer: true,
  });
  const result = (await falPollResult(modelId, queueResp.request_id)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

// ─── WAN 2.2 Image-to-Video ───────────────────────────────────────────────────
export async function wan22ImageToVideo(params: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  resolution?: "480p" | "720p";
}) {
  const modelId = "fal-ai/wan/v2.2-a14b/image-to-video";
  const queueResp = await falQueueSubmit(modelId, {
    image_url: params.imageUrl,
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted",
    resolution: params.resolution ?? "720p",
  });
  const result = (await falPollResult(modelId, queueResp.request_id)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

// ─── WAN 2.2 Text-to-Video ────────────────────────────────────────────────────
export async function wan22TextToVideo(params: {
  prompt: string;
  negativePrompt?: string;
  resolution?: "480p" | "720p";
}) {
  const modelId = "fal-ai/wan/v2.2-a14b/text-to-video";
  const queueResp = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality",
    resolution: params.resolution ?? "720p",
  });
  const result = (await falPollResult(modelId, queueResp.request_id)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

// ─── Seedance 2.0 — Text-to-Video ────────────────────────────────────────────
export async function seedance20TextToVideo(params: {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  durationSeconds?: 5 | 10;
  resolution?: "720p" | "1080p";
}): Promise<string | null> {
  const modelId = "fal-ai/bytedance/seedance/v2/non-fast";
  const queueResp = await falQueueSubmit(modelId, {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted, jitter, face drift, extra fingers, broken limbs, text artifacts",
    aspect_ratio: params.aspectRatio ?? "16:9",
    duration: params.durationSeconds ?? 5,
    resolution: params.resolution ?? "720p",
  });
  const result = (await falPollResult(modelId, queueResp.request_id, 360000)) as { video?: { url: string } };
  return result?.video?.url ?? null;
}

// ─── Seedance 2.0 — Video Reference Recreation ───────────────────────────────
export async function seedance20ReferenceRecreation(params: {
  masterPrompt: string;
  referenceVideoUrl: string;
  referenceUsageNote?: string;
  negativePrompt?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  durationSeconds?: 5 | 10;
  resolution?: "720p" | "1080p";
}): Promise<string | null> {
  const modelId = "fal-ai/bytedance/seedance/v2/non-fast";
  const queueResp = await falQueueSubmit(modelId, {
    prompt: params.masterPrompt,
    reference_video_url: params.referenceVideoUrl,
    reference_usage: params.referenceUsageNote ?? "Use only for pacing, shot order, and camera energy. Do not copy exact faces, logos, or watermarks.",
    negative_prompt: params.negativePrompt ?? "avoid readable logos, avoid real team names, avoid warped hands, avoid broken legs, avoid face drift, avoid outfit drift, avoid jitter, avoid temporal flicker, avoid text artifacts",
    aspect_ratio: params.aspectRatio ?? "9:16",
    duration: params.durationSeconds ?? 10,
    resolution: params.resolution ?? "720p",
  });
  const result = (await falPollResult(modelId, queueResp.request_id, 600000)) as { video?: { url: string } };
  return result?.video?.url ?? null;
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
