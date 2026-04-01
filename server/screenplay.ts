import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
// Use gemini-2.5-flash for best cost/quality ratio — ~$0.075/1M input tokens
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export type SceneType = "dialogue" | "broll" | "action" | "lipsync" | "dream" | "transition";

export interface ScreenplayScene {
  index: number;
  title: string;
  description: string;
  dialogue?: string;
  visualPrompt: string;
  emotion: string;
  sceneType: SceneType;
  videoModel: string;
  characters: string[];
  duration: number;
  cameraMove?: string;
  location?: string;
  timeOfDay?: string;
  soundscape?: string;
}

export interface Screenplay {
  title: string;
  logline: string;
  genre: string;
  emotionalArc: string;
  totalDuration: number;
  bgmPrompt: string;
  bgmStyle: string;
  scenes: ScreenplayScene[];
  characters: Array<{
    name: string;
    description: string;
    personality: string;
    voiceDescription: string;
  }>;
}

/**
 * Smart model router — Kling 3.0 as primary for consistency.
 * Hailuo MiniMax ONLY for pure environment shots with no characters.
 */
export function routeVideoModel(scene: Partial<ScreenplayScene>): string {
  const hasCharacters = scene.characters && scene.characters.length > 0;
  switch (scene.sceneType) {
    case "dialogue":   return "kling-v3-omni";     // Native audio + dialogue
    case "action":     return "kling-v3-motion";   // Motion control
    case "lipsync":    return "kling-v3-omni";     // Best lip sync
    case "dream":      return "kling-v3-omni";     // Consistent surreal
    case "transition": return hasCharacters ? "kling-v3-omni" : "hailuo-minimax-2.3";
    case "broll":
    default:           return hasCharacters ? "kling-v3-omni" : "hailuo-minimax-2.3";
  }
}

export function estimateSceneCost(model: string, durationSec: number): number {
  const costPerSec: Record<string, number> = {
    "kling-v3-omni":    0.14,
    "kling-v3-motion":  0.10,
    "hailuo-minimax-2.3": 0.047,
  };
  return (costPerSec[model] ?? 0.14) * durationSec;
}

// Cached system prompt to reduce token usage
const SYSTEM_PROMPT = `You are a Hollywood-grade AI screenwriter. Create emotionally powerful screenplays optimized for AI video generation.

MODEL ROUTING (character consistency is #1 priority):
- kling-v3-omni: ALL scenes with characters (dialogue, emotional, dream, action with faces) ~80% of scenes
- kling-v3-motion: Pure action sequences needing dynamic camera motion control
- hailuo-minimax-2.3: ONLY pure environment/space/nature B-roll with NO characters (filler/transitions)

Visual prompts: use cinematic language — "golden hour", "shallow DOF", "anamorphic lens", "8K photorealistic", "IMAX quality".`;

export async function generateScreenplay(params: {
  idea: string;
  genre?: string;
  emotionalTone?: string;
  dreamMode?: boolean;
  targetDuration?: number;
  characters?: string[];
  universe?: string;
}): Promise<Screenplay> {
  const targetDuration = params.targetDuration ?? 60;
  const sceneCount = Math.max(4, Math.min(12, Math.round(targetDuration / 8)));

  const userPrompt = `Create a ${sceneCount}-scene screenplay:

IDEA: ${params.idea}
GENRE: ${params.genre ?? "sci-fi drama"}
TONE: ${params.emotionalTone ?? "epic, emotional, hopeful"}
DREAM MODE: ${params.dreamMode ? "YES — include surreal sequences" : "NO"}
DURATION: ${targetDuration}s total
${params.universe ? `UNIVERSE: ${params.universe}` : ""}
${params.characters?.length ? `CHARACTERS: ${params.characters.join(", ")}` : ""}

Return ONLY valid JSON (no markdown):
{
  "title": "string",
  "logline": "string",
  "genre": "string",
  "emotionalArc": "string",
  "totalDuration": ${targetDuration},
  "bgmPrompt": "detailed music description",
  "bgmStyle": "e.g. cinematic orchestral",
  "characters": [{"name":"","description":"physical appearance for AI","personality":"","voiceDescription":""}],
  "scenes": [{
    "index": 0,
    "title": "string",
    "description": "string",
    "dialogue": "spoken lines or empty string",
    "visualPrompt": "50-100 word cinematic prompt, photorealistic 8K",
    "emotion": "joy|sadness|fear|anger|surprise|anticipation|epic|mysterious|romantic|tense",
    "sceneType": "dialogue|broll|action|lipsync|dream|transition",
    "videoModel": "kling-v3-omni|kling-v3-motion|hailuo-minimax-2.3",
    "characters": ["names or empty array"],
    "duration": 8,
    "cameraMove": "dolly_in|dolly_out|pan_left|pan_right|orbit|handheld|static",
    "location": "string",
    "timeOfDay": "day|night|golden_hour|blue_hour|dawn",
    "soundscape": "string"
  }]
}`;

  const response = await axios.post(GEMINI_URL, {
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will create a Hollywood-grade screenplay as JSON." }] },
      { role: "user", parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 6000, // Optimized — enough for 12 scenes
    },
  }, { timeout: 60000 });

  const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("No screenplay generated from Gemini");

  let screenplay: Screenplay;
  try {
    screenplay = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse screenplay JSON");
    screenplay = JSON.parse(jsonMatch[0]);
  }

  // Always re-route for consistency enforcement
  screenplay.scenes = screenplay.scenes.map((scene: ScreenplayScene) => ({
    ...scene,
    videoModel: routeVideoModel(scene),
    dialogue: scene.dialogue ?? "",
  }));

  return screenplay;
}

export function calculateTotalCost(screenplay: Screenplay): number {
  return screenplay.scenes.reduce((total, scene) => {
    return total + estimateSceneCost(scene.videoModel, scene.duration);
  }, 0);
}
