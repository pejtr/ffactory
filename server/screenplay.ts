import { invokeLLM } from "./_core/llm";

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

// Smart model router based on scene type
export function routeVideoModel(scene: Partial<ScreenplayScene>): string {
  switch (scene.sceneType) {
    case "dialogue":
      return "kling-v3-omni"; // Kling 3.0 Omni — native audio + dialogue
    case "action":
      return "kling-v3-motion"; // Kling Motion Control — dynamic action
    case "lipsync":
      return "wan-2.2-s2v"; // WAN 2.2 Speech-to-Video — lip sync
    case "dream":
      return "wan-2.2-t2v"; // WAN 2.2 — surreal/dream sequences
    case "broll":
    case "transition":
    default:
      return "hailuo-minimax-2.3"; // Hailuo MiniMax 2.3 — cinematic B-roll (cheapest)
  }
}

export function estimateSceneCost(model: string, durationSec: number): number {
  const costPerSec: Record<string, number> = {
    "kling-v3-omni": 0.14,       // Kling 3.0 with audio
    "kling-v3-motion": 0.10,     // Kling Motion Control
    "wan-2.2-s2v": 0.20,         // WAN 2.2 Speech-to-Video
    "wan-2.2-t2v": 0.08,         // WAN 2.2 Text-to-Video
    "hailuo-minimax-2.3": 0.047, // Hailuo MiniMax 2.3 Fast (cheapest)
  };
  return (costPerSec[model] ?? 0.10) * durationSec;
}

export async function generateScreenplay(params: {
  idea: string;
  genre?: string;
  emotionalTone?: string;
  dreamMode?: boolean;
  targetDuration?: number;
  characters?: string[];
  universe?: string;
}): Promise<Screenplay> {
  const sceneCount = Math.max(4, Math.min(12, Math.round((params.targetDuration ?? 60) / 8)));

  const systemPrompt = `You are a Hollywood-grade AI screenwriter and director. 
You specialize in creating emotionally powerful, visually stunning screenplays optimized for AI video generation.
You understand cinematic language, emotional arcs, and how to write prompts that work best with AI video models.

Available video models and their best use cases:
- kling-v3-omni: Dialogue scenes with native audio, character conversations, emotional close-ups
- kling-v3-motion: Action sequences, dynamic camera moves, fight scenes, chase sequences  
- wan-2.2-s2v: Lip sync scenes, singing, detailed mouth movement required
- wan-2.2-t2v: Dream sequences, surreal/abstract visuals, fantasy landscapes
- hailuo-minimax-2.3: Cinematic B-roll, establishing shots, space/nature/architecture (most cost-effective)

For visual prompts, use cinematic language: "golden hour lighting", "shallow depth of field", "anamorphic lens flare", "8K ultra-detailed", "photorealistic", "cinematic color grading".`;

  const userPrompt = `Create a complete screenplay for an AI video with these parameters:

IDEA: ${params.idea}
GENRE: ${params.genre ?? "sci-fi drama"}
EMOTIONAL TONE: ${params.emotionalTone ?? "epic, emotional, hopeful"}
DREAM MODE: ${params.dreamMode ? "YES - include surreal/dream sequences" : "NO"}
TARGET DURATION: ${params.targetDuration ?? 60} seconds total
NUMBER OF SCENES: ${sceneCount}
${params.universe ? `UNIVERSE/SETTING: ${params.universe}` : ""}
${params.characters?.length ? `CHARACTERS: ${params.characters.join(", ")}` : ""}

Return a JSON object with this exact structure:
{
  "title": "Episode title",
  "logline": "One sentence summary",
  "genre": "genre",
  "emotionalArc": "Description of emotional journey",
  "totalDuration": ${params.targetDuration ?? 60},
  "bgmPrompt": "Detailed music prompt for background score",
  "bgmStyle": "e.g. cinematic orchestral, electronic ambient",
  "characters": [
    {
      "name": "Character name",
      "description": "Physical appearance for AI image generation",
      "personality": "Personality traits",
      "voiceDescription": "Voice characteristics for TTS"
    }
  ],
  "scenes": [
    {
      "index": 0,
      "title": "Scene title",
      "description": "What happens in this scene",
      "dialogue": "Spoken lines (only if sceneType is dialogue or lipsync)",
      "visualPrompt": "Detailed cinematic prompt for AI video generation, 50-100 words",
      "emotion": "dominant emotion: joy|sadness|fear|anger|surprise|anticipation|epic|mysterious|romantic|tense",
      "sceneType": "dialogue|broll|action|lipsync|dream|transition",
      "videoModel": "kling-v3-omni|kling-v3-motion|wan-2.2-s2v|wan-2.2-t2v|hailuo-minimax-2.3",
      "characters": ["character names in this scene"],
      "duration": 5,
      "cameraMove": "dolly_in|dolly_out|pan_left|pan_right|orbit|handheld|static",
      "location": "Scene location",
      "timeOfDay": "day|night|golden_hour|blue_hour|dawn",
      "soundscape": "Brief description of ambient sounds"
    }
  ]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "screenplay",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            logline: { type: "string" },
            genre: { type: "string" },
            emotionalArc: { type: "string" },
            totalDuration: { type: "number" },
            bgmPrompt: { type: "string" },
            bgmStyle: { type: "string" },
            characters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  personality: { type: "string" },
                  voiceDescription: { type: "string" },
                },
                required: ["name", "description", "personality", "voiceDescription"],
                additionalProperties: false,
              },
            },
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" },
                  dialogue: { type: "string" },
                  visualPrompt: { type: "string" },
                  emotion: { type: "string" },
                  sceneType: { type: "string" },
                  videoModel: { type: "string" },
                  characters: { type: "array", items: { type: "string" } },
                  duration: { type: "number" },
                  cameraMove: { type: "string" },
                  location: { type: "string" },
                  timeOfDay: { type: "string" },
                  soundscape: { type: "string" },
                },
                required: [
                  "index", "title", "description", "visualPrompt",
                  "emotion", "sceneType", "videoModel", "characters",
                  "duration", "cameraMove", "location", "timeOfDay", "soundscape"
                ],
                additionalProperties: false,
              },
            },
          },
          required: [
            "title", "logline", "genre", "emotionalArc", "totalDuration",
            "bgmPrompt", "bgmStyle", "characters", "scenes"
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("No screenplay generated");

  const screenplay = typeof content === "string" ? JSON.parse(content) : content;

  // Ensure model routing is correct
  screenplay.scenes = screenplay.scenes.map((scene: ScreenplayScene) => ({
    ...scene,
    videoModel: scene.videoModel ?? routeVideoModel(scene),
    dialogue: scene.dialogue ?? "",
  }));

  return screenplay as Screenplay;
}

export function calculateTotalCost(screenplay: Screenplay): number {
  return screenplay.scenes.reduce((total, scene) => {
    return total + estimateSceneCost(scene.videoModel, scene.duration);
  }, 0);
}
