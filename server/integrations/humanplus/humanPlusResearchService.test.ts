import { describe, expect, it, vi } from "vitest";
import {
  getHumanPlusResearchStatus,
  loadHumanPlusResearchFrame,
} from "./humanPlusResearchService";

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
    footContactProbability: [0.95, 0.91],
  },
  slam: {
    slamWorldCamera: [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ],
    pointCloudAvailable: true,
  },
  depth: { available: true },
  behavior: { atomicAction: "reach", motionNarration: "Reaches for cup" },
};

describe("HumanPlus research service", () => {
  it("reports a fail-closed research-only policy", () => {
    const status = getHumanPlusResearchStatus({ dataRoot: "C:/research" });

    expect(status.enabled).toBe(true);
    expect(status.mode).toBe("research_only");
    expect(status.productionGenerationAllowed).toBe(false);
    expect(status.commercialTrainingAllowed).toBe(false);
    expect(status.license).toBe("CC-BY-NC-4.0");
  });

  it("returns MotionPacket + MotionControlHints through a read-only runner", async () => {
    const runner = vi.fn(async () => rawFrame);

    const result = await loadHumanPlusResearchFrame(
      {
        sessionId: "HP_S000001",
        relativeAnnotationPath: "data/HP_S000001/annotation.hdf5",
        frameIndex: 0,
      },
      {
        dataRoot: "C:/research/humanplus",
        runner,
        pythonExecutable: "python",
      },
    );

    expect(result.packet.sessionId).toBe("HP_S000001");
    expect(result.hints.action).toBe("reach");
    expect(result.hints.hasCameraPose).toBe(true);
    expect(result.policy.productionGenerationAllowed).toBe(false);
  });

  it("blocks path traversal before the extractor can run", async () => {
    const runner = vi.fn(async () => rawFrame);

    await expect(
      loadHumanPlusResearchFrame(
        {
          sessionId: "HP_S000001",
          relativeAnnotationPath: "../secrets.hdf5",
        },
        { dataRoot: "C:/research/humanplus", runner },
      ),
    ).rejects.toThrow("HUMANPLUS_PATH_TRAVERSAL_BLOCKED");

    expect(runner).not.toHaveBeenCalled();
  });

  it("requires an explicit dataset root", async () => {
    const previous = process.env.HUMANPLUS_DATA_ROOT;
    delete process.env.HUMANPLUS_DATA_ROOT;
    try {
      await expect(
        loadHumanPlusResearchFrame(
          {
            sessionId: "HP_S000001",
            relativeAnnotationPath: "data/HP_S000001/annotation.hdf5",
          },
          { dataRoot: undefined, runner: vi.fn(async () => rawFrame) },
        ),
      ).rejects.toThrow("HUMANPLUS_DATA_ROOT_NOT_CONFIGURED");
    } finally {
      if (previous !== undefined) process.env.HUMANPLUS_DATA_ROOT = previous;
    }
  });
});
