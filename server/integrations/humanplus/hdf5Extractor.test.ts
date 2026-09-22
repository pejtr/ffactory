import { describe, expect, it, vi } from "vitest";
import { extractHumanPlusMotionPacket } from "./hdf5Extractor";

const rawFrame = {
  sessionId: "HP_S000001",
  timestampNs: "1790034000000000000",
  bodyMotion: {
    mocapWorldRoot: [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ],
    smplhPose: [0.1, 0.2, 0.3],
    bodyKeypoints: [[0, 1, 2]],
    footContactProbability: [0.9, 0.8],
  },
  handMotion: {
    left: {
      valid: true,
      confidence: 0.99,
      wristPositionCamera: [0.1, 0.2, 0.3],
    },
  },
  slam: {
    slamWorldCamera: [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ],
    cameraFrame: "camera",
    pointCloudAvailable: true,
  },
  depth: { available: true },
  behavior: {
    activitySummarization: "Preparing tea",
    motionNarration: "Reaches for cup",
    atomicAction: "reach",
  },
};

describe("HumanPlus HDF5 extractor bridge", () => {
  it("normalizes extractor JSON without invoking production generation", async () => {
    const runner = vi.fn(async () => rawFrame);
    const packet = await extractHumanPlusMotionPacket(
      {
        annotationPath: "C:/research/annotation.hdf5",
        sessionId: "HP_S000001",
        frameIndex: 7,
        purpose: "research_loader",
      },
      runner,
    );

    expect(runner).toHaveBeenCalledOnce();
    expect(packet.source).toBe("humanplus-1000");
    expect(packet.sessionId).toBe("HP_S000001");
    expect(packet.timestampNs).toBe("1790034000000000000");
    expect(packet.semantic?.atomicAction).toBe("reach");
    expect(packet.world?.depthAvailable).toBe(true);
  });

  it("fails closed if the extracted frame is routed to commercial production", async () => {
    const runner = vi.fn(async () => rawFrame);

    await expect(
      extractHumanPlusMotionPacket(
        {
          annotationPath: "C:/research/annotation.hdf5",
          sessionId: "HP_S000001",
          purpose: "production_generation",
        },
        runner,
      ),
    ).rejects.toThrow(/CC-BY-NC-4\.0/);
  });

  it("rejects invalid frame indices before any extractor process is started", async () => {
    const runner = vi.fn(async () => rawFrame);

    await expect(
      extractHumanPlusMotionPacket(
        {
          annotationPath: "C:/research/annotation.hdf5",
          sessionId: "HP_S000001",
          frameIndex: -1,
        },
        runner,
      ),
    ).rejects.toThrow("HUMANPLUS_FRAME_INDEX_INVALID");

    expect(runner).not.toHaveBeenCalled();
  });
});
