import { getDb } from "./db";
import { videoProjects, scenes, audioTracks, characters } from "../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { generateScreenplay, calculateTotalCost, type Screenplay } from "./screenplay";
import { klingTextToVideo, klingPollTask, KLING_CAMERA_PRESETS } from "./kling";
import { hailiuoTextToVideo, wan22TextToVideo } from "./falai";
import { elevenLabsTTS, kieMusicGenerate, kieMusicPoll } from "./audio";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Update project status helper ─────────────────────────────────────────────
async function updateProjectStatus(
  projectId: number,
  status: typeof videoProjects.$inferSelect["status"],
  extra?: Partial<typeof videoProjects.$inferSelect>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoProjects)
    .set({ status, ...extra })
    .where(eq(videoProjects.id, projectId));
}

async function updateSceneStatus(
  sceneId: number,
  status: typeof scenes.$inferSelect["status"],
  extra?: Partial<typeof scenes.$inferSelect>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(scenes)
    .set({ status, ...extra })
    .where(eq(scenes.id, sceneId));
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────────
export async function runVideoPipeline(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [project] = await db.select().from(videoProjects).where(eq(videoProjects.id, projectId));
  if (!project) throw new Error(`Project ${projectId} not found`);

  try {
    // ── Step 1: Generate Screenplay ──────────────────────────────────────────
    await updateProjectStatus(projectId, "generating_screenplay");

    const screenplay = await generateScreenplay({
      idea: project.idea,
      genre: project.genre ?? undefined,
      emotionalTone: project.emotionalTone ?? undefined,
      dreamMode: project.dreamMode ?? false,
      targetDuration: project.targetDuration ?? 60,
      universe: "Stargate SG-1 and Atlantis universe",
    });

    const estimatedCost = calculateTotalCost(screenplay);

    await db.update(videoProjects)
      .set({
        screenplay: screenplay as unknown as Record<string, unknown>,
        title: screenplay.title,
        status: "generating_scenes",
        estimatedCostUsd: estimatedCost,
      })
      .where(eq(videoProjects.id, projectId));

    // ── Step 2: Save Scenes to DB ────────────────────────────────────────────
    for (const scene of screenplay.scenes) {
      await db.insert(scenes).values({
        projectId,
        sceneIndex: scene.index,
        title: scene.title,
        description: scene.description,
        dialogue: scene.dialogue ?? null,
        visualPrompt: scene.visualPrompt,
        emotion: scene.emotion,
        sceneType: scene.sceneType as typeof scenes.$inferSelect["sceneType"],
        videoModel: scene.videoModel,
        characterIds: scene.characters as unknown as Record<string, unknown>,
        duration: scene.duration,
        status: "pending",
      });
    }

    // ── Step 3: Generate BGM ─────────────────────────────────────────────────
    await updateProjectStatus(projectId, "generating_audio");
    let bgmUrl: string | null = null;
    try {
      const { taskId } = await kieMusicGenerate({
        prompt: screenplay.bgmPrompt,
        style: screenplay.bgmStyle,
        title: screenplay.title,
        instrumental: true,
        model: "V4",
      });
      const [audioTrack] = await db.insert(audioTracks).values({
        projectId,
        trackType: "bgm",
        title: `${screenplay.title} — Score`,
        prompt: screenplay.bgmPrompt,
        status: "generating",
        taskId,
      }).$returningId();

      const urls = await kieMusicPoll(taskId);
      bgmUrl = urls[0] ?? null;
      if (audioTrack?.id) {
        await db.update(audioTracks)
          .set({ audioUrl: bgmUrl, status: "completed" })
          .where(eq(audioTracks.id, audioTrack.id));
      }
    } catch (e) {
      console.error("[Pipeline] BGM generation failed:", e);
    }

    // ── Step 4: Generate Scene Videos ────────────────────────────────────────
    await updateProjectStatus(projectId, "generating_scenes");
    const projectScenes = await db.select().from(scenes)
      .where(eq(scenes.projectId, projectId))
      .orderBy(asc(scenes.sceneIndex));

    for (const scene of projectScenes) {
      await updateSceneStatus(scene.id, "generating");
      try {
        let videoUrl: string | null = null;
        const rawModel = scene.videoModel ?? "wan-2.2-t2v";

        // Budget Mode: Kling requires separate paid account — route to WAN 2.2 T2V
        // Hailuo MiniMax also routed to WAN 2.2 for consistency on fal.ai
        const isKling = rawModel.startsWith("kling") || rawModel === "kling-3.0" || rawModel === "Kling 3.0" || rawModel === "Kling Motion" || rawModel === "Kling 3.0 Omni";
        const isHailuo = rawModel.includes("hailuo") || rawModel.includes("minimax") || rawModel === "Hailuo MiniMax" || rawModel === "Hailuo 2.3";
        const model = (isKling || isHailuo) ? "wan-2.2-t2v" : rawModel;

        if (model === "wan-2.2-t2v" || model === "wan-2.2-s2v" || model === "wan-2.2" || model === "WAN 2.2 T2V") {
          videoUrl = await wan22TextToVideo({
            prompt: scene.visualPrompt ?? scene.description,
            resolution: "720p",
          });
        } else if (rawModel.startsWith("kling") && !isKling) {
          // Direct Kling path — only if Kling account has credit
          const cameraPreset = rawModel === "kling-v3-motion"
            ? KLING_CAMERA_PRESETS.dollyIn
            : KLING_CAMERA_PRESETS.static;
          const task = await klingTextToVideo({
            prompt: scene.visualPrompt ?? scene.description,
            modelName: "kling-v3",
            mode: "std",
            duration: (scene.duration ?? 5) >= 8 ? "10" : "5",
            aspectRatio: "16:9",
            cameraControl: cameraPreset,
          });
          const taskId = task?.data?.task_id;
          if (taskId) {
            await updateSceneStatus(scene.id, "generating", { klingTaskId: taskId });
            videoUrl = await klingPollTask(taskId, "t2v");
          }
        } else {
          // Fallback: WAN 2.2
          videoUrl = await wan22TextToVideo({
            prompt: scene.visualPrompt ?? scene.description,
            resolution: "720p",
          });
        }

        // Generate voiceover for dialogue scenes
        let audioUrl: string | null = null;
        if (scene.dialogue && scene.dialogue.trim()) {
          try {
            audioUrl = await elevenLabsTTS({
              text: scene.dialogue,
              modelId: "eleven_multilingual_v2",
            });
            await db.insert(audioTracks).values({
              projectId,
              trackType: "dialogue",
              prompt: scene.dialogue,
              audioUrl,
              status: "completed",
            });
          } catch (e) {
            console.error(`[Pipeline] Voiceover failed for scene ${scene.id}:`, e);
          }
        }

        await updateSceneStatus(scene.id, "completed", {
          videoUrl,
          audioUrl,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[Pipeline] Scene ${scene.id} failed:`, msg);
        await updateSceneStatus(scene.id, "failed", { errorMessage: msg });
      }
    }

    // ── Step 5: Assemble Final Video ─────────────────────────────────────────
    await updateProjectStatus(projectId, "assembling");

    // For now, use the first completed scene video as the "final" video
    // (Full FFmpeg assembly would be a separate service)
    const completedScenes = await db.select().from(scenes)
      .where(eq(scenes.projectId, projectId))
      .orderBy(asc(scenes.sceneIndex));

    const firstVideo = completedScenes.find((s) => s.videoUrl)?.videoUrl ?? null;
    const shareToken = nanoid(12);

    await updateProjectStatus(projectId, "completed", {
      finalVideoUrl: firstVideo,
      shareToken,
      actualCostUsd: estimatedCost,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Pipeline] Project ${projectId} failed:`, msg);
    await updateProjectStatus(projectId, "failed", { errorMessage: msg });
  }
}
