import { storagePut } from "./storage";
import { nanoid } from "nanoid";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const KIE_API_KEY = process.env.KIE_API_KEY!;

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
export async function elevenLabsTTS(params: {
  text: string;
  voiceId?: string; // default: Rachel
  modelId?: string; // default: eleven_multilingual_v2
  stability?: number;
  similarityBoost?: number;
  style?: number;
}): Promise<string> {
  const voiceId = params.voiceId ?? "21m00Tcm4TlvDq8ikWAM"; // Rachel
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: params.text,
        model_id: params.modelId ?? "eleven_multilingual_v2",
        voice_settings: {
          stability: params.stability ?? 0.5,
          similarity_boost: params.similarityBoost ?? 0.75,
          style: params.style ?? 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs TTS error ${res.status}: ${text}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const key = `audio/tts-${nanoid(8)}.mp3`;
  const { url } = await storagePut(key, buffer, "audio/mpeg");
  return url;
}

// ─── ElevenLabs Sound Effects ─────────────────────────────────────────────────
export async function elevenLabsSFX(params: {
  text: string;
  durationSeconds?: number;
  promptInfluence?: number;
}): Promise<string> {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: params.text,
      duration_seconds: params.durationSeconds ?? 5,
      prompt_influence: params.promptInfluence ?? 0.3,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ElevenLabs SFX error ${res.status}: ${text}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const key = `audio/sfx-${nanoid(8)}.mp3`;
  const { url } = await storagePut(key, buffer, "audio/mpeg");
  return url;
}

// ─── ElevenLabs List Voices ───────────────────────────────────────────────────
export async function elevenLabsListVoices() {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices error ${res.status}`);
  return res.json();
}

// ─── Kie.ai Music Generation (Suno API) ──────────────────────────────────────
export async function kieMusicGenerate(params: {
  prompt: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string; // "V3_5" | "V4" | "V4_5" | "V5"
}): Promise<{ taskId: string }> {
  const res = await fetch("https://api.kie.ai/api/suno/v1/music", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: params.prompt,
      style: params.style ?? "cinematic orchestral epic",
      title: params.title ?? "Video Score",
      customMode: true,
      instrumental: params.instrumental ?? true,
      model: params.model ?? "V4",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kie.ai music error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { code: number; data: { taskId: string } };
  return { taskId: data.data.taskId };
}

export async function kieMusicGetTask(taskId: string) {
  const res = await fetch(`https://api.kie.ai/api/suno/v1/music/${taskId}`, {
    headers: { Authorization: `Bearer ${KIE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Kie.ai task error ${res.status}`);
  return res.json();
}

export async function kieMusicPoll(taskId: string, maxWaitMs = 300000): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const result = await kieMusicGetTask(taskId);
    const status = result?.data?.status;
    if (status === "complete" || status === "completed") {
      const tracks = result?.data?.sunoData ?? [];
      return tracks.map((t: { audioUrl: string }) => t.audioUrl).filter(Boolean);
    }
    if (status === "failed" || status === "error") {
      throw new Error(`Kie.ai music generation failed`);
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  throw new Error("Kie.ai music generation timed out");
}
