import { describe, expect, it } from "vitest";
import {
  assertHumanPlusUseAllowed,
  normalizeHumanPlusFrame,
  toMotionControlHints,
} from "./humanPlusAdapter";

const identity4 = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

const frame = {
  sessionId: "HP_S000001",
  timestampNs: "1790034000000000000",
  bodyMotion: {
    mocapWorldRoot: identity4,
    smplhPose: [0.1, 0.2, 0.3],
    bodyKeypoints: [[0, 1, 2] as [number, number, number]],
    footContactProbability: [0.95, 0.91],
  },
  handMotion: {
    left: {
      valid: true,
      confidence: 0.98,
      wristPositionCamera: [0.1, 0.2, 0.3] as [number, number, number],
    },
    right: {
      valid: false,
      confidence: 0.25,
    },
  },
  slam: {
    slamWorldCamera: identity4,
    cameraFrame: "camera",
    pointCloudAvailable: true,
  },
  depth: { available: true },
  behavior: {
    activitySummarization: "Preparing a drink",
    motionNarration: "Reaches toward the cup",
    atomicAction: "reach",
  },
};

describe("HumanPlus research adapter", () => {
  it("normalizes an aligned HumanPlus frame into MotionPacket v1", () => {
    const packet = normalizeHumanPlusFrame(frame, "research_loader");

    expect(packet.version).toBe("motion-packet.v1");
    expect(packet.source).toBe("humanplus-1000");
    expect(packet.sourceLicense).toBe("CC-BY-NC-4.0");
    expect(packet.timestampNs).toBe(frame.timestampNs);
    expect(packet.body?.rootTransform).toEqual(identity4);
    expect(packet.hands?.left?.valid).toBe(true);
    expect(packet.camera?.slamWorldCamera).toEqual(identity4);
    expect(packet.world?.depthAvailable).toBe(true);
    expect(packet.semantic?.atomicAction).toBe("reach");
  });

  it("extracts provider-neutral motion-control hints", () => {
    const packet = normalizeHumanPlusFrame(frame, "research_eval");
    const hints = toMotionControlHints(packet);

    expect(hints.action).toBe("reach");
    expect(hints.hasBodyMotion).toBe(true);
    expect(hints.hasCameraPose).toBe(true);
    expect(hints.hasLeftHand).toBe(true);
    expect(hints.hasRightHand).toBe(false);
    expect(hints.hasDepth).toBe(true);
    expect(hints.hasPointCloud).toBe(true);
    expect(hints.footContactProbability).toEqual([0.95, 0.91]);
  });

  it("fails closed for production use without a commercial grant", () => {
    expect(() => assertHumanPlusUseAllowed("production_generation")).toThrow(
      /CC-BY-NC-4\.0/,
    );
    expect(() => normalizeHumanPlusFrame(frame, "commercial_finetune")).toThrow(
      /commercial license grant/i,
    );
  });

  it("allows commercial wiring only when an explicit grant is supplied", () => {
    const packet = normalizeHumanPlusFrame(
      frame,
      "production_generation",
      { grantId: "contract-test-only", commercialUseAllowed: true },
    );

    expect(packet.sessionId).toBe("HP_S000001");
  });

  it("keeps nanosecond timestamps as strings to avoid JS precision loss", () => {
    expect(() =>
      normalizeHumanPlusFrame(
        { ...frame, timestampNs: "1790034000000000000.1" },
        "research_loader",
      ),
    ).toThrow(/integer string/i);
  });
});
