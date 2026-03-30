import * as jose from "jose";

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY!;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY!;
const KLING_BASE_URL = "https://api.klingai.com";

// Generate JWT token for Kling API authentication
async function getKlingToken(): Promise<string> {
  const secret = new TextEncoder().encode(KLING_SECRET_KEY);
  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .setIssuer(KLING_ACCESS_KEY)
    .sign(secret);
  return token;
}

async function klingRequest(path: string, method: string, body?: unknown) {
  const token = await getKlingToken();
  const res = await fetch(`${KLING_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kling API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Kling 3.0 Text-to-Video ──────────────────────────────────────────────────
export async function klingTextToVideo(params: {
  prompt: string;
  negativePrompt?: string;
  modelName?: string; // "kling-v3" | "kling-v2-master" | "kling-v1-6"
  mode?: "std" | "pro";
  duration?: "5" | "10";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  cameraControl?: {
    type: string;
    config?: Record<string, number>;
  };
  callbackUrl?: string;
}) {
  return klingRequest("/v1/videos/text2video", "POST", {
    model_name: params.modelName ?? "kling-v3",
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted",
    mode: params.mode ?? "std",
    duration: params.duration ?? "5",
    aspect_ratio: params.aspectRatio ?? "16:9",
    camera_control: params.cameraControl,
    callback_url: params.callbackUrl,
  });
}

// ─── Kling Image-to-Video ─────────────────────────────────────────────────────
export async function klingImageToVideo(params: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  modelName?: string;
  mode?: "std" | "pro";
  duration?: "5" | "10";
  cameraControl?: {
    type: string;
    config?: Record<string, number>;
  };
}) {
  return klingRequest("/v1/videos/image2video", "POST", {
    model_name: params.modelName ?? "kling-v3",
    image: params.imageUrl,
    prompt: params.prompt,
    negative_prompt: params.negativePrompt ?? "blurry, low quality",
    mode: params.mode ?? "std",
    duration: params.duration ?? "5",
    camera_control: params.cameraControl,
  });
}

// ─── Kling Get Task Status ────────────────────────────────────────────────────
export async function klingGetVideoTask(taskId: string) {
  return klingRequest(`/v1/videos/text2video/${taskId}`, "GET");
}

export async function klingGetI2VTask(taskId: string) {
  return klingRequest(`/v1/videos/image2video/${taskId}`, "GET");
}

// ─── Kling Poll Until Done ────────────────────────────────────────────────────
export async function klingPollTask(
  taskId: string,
  type: "t2v" | "i2v" = "t2v",
  maxWaitMs = 300000
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = type === "t2v"
      ? await klingGetVideoTask(taskId)
      : await klingGetI2VTask(taskId);

    const status = result?.data?.task_status;
    if (status === "succeed") {
      const videoUrl = result?.data?.task_result?.videos?.[0]?.url;
      if (!videoUrl) throw new Error("Kling task succeeded but no video URL found");
      return videoUrl;
    }
    if (status === "failed") {
      throw new Error(`Kling task failed: ${result?.data?.task_status_msg}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Kling task timed out");
}

// ─── Kling Motion Control Camera Types ───────────────────────────────────────
export const KLING_CAMERA_PRESETS = {
  dollyIn: { type: "zoom_in" },
  dollyOut: { type: "zoom_out" },
  panLeft: { type: "pan_left" },
  panRight: { type: "pan_right" },
  tiltUp: { type: "tilt_up" },
  tiltDown: { type: "tilt_down" },
  orbit: { type: "orbit_left" },
  handheld: { type: "shake" },
  static: { type: "static" },
} as const;
