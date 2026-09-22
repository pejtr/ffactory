import { z } from "zod";
import {
  Matrix4Schema,
  MotionControlHintsSchema,
  MotionPacketSchema,
  NanosecondTimestampSchema,
  NumericVectorSchema,
  Vec3Schema,
  type MotionControlHints,
  type MotionPacket,
} from "../../../shared/motionIntelligence";

export const HUMANPLUS_DATASET = {
  repoId: "humanplus-ai/humanplus-1000",
  license: "CC-BY-NC-4.0",
  release: "preview",
  annotationFile: "annotation.hdf5",
} as const;

export const HumanPlusPurposeSchema = z.enum([
  "research_loader",
  "research_eval",
  "noncommercial_experiment",
  "production_generation",
  "commercial_training",
  "commercial_finetune",
]);
export type HumanPlusPurpose = z.infer<typeof HumanPlusPurposeSchema>;

export type HumanPlusLicenseGrant = {
  grantId: string;
  commercialUseAllowed: true;
};

export function assertHumanPlusUseAllowed(
  purpose: HumanPlusPurpose,
  grant?: HumanPlusLicenseGrant,
): void {
  const nonCommercial = new Set<HumanPlusPurpose>([
    "research_loader",
    "research_eval",
    "noncommercial_experiment",
  ]);

  if (nonCommercial.has(purpose)) return;
  if (grant?.commercialUseAllowed === true && grant.grantId.trim().length > 0) return;

  throw new Error(
    `HumanPlus-1000 is gated for ${purpose}: the public preview is CC-BY-NC-4.0. ` +
      "Provide an explicit commercial license grant before production or commercial training.",
  );
}

const HumanPlusHandInputSchema = z.object({
  manoHandGlobalOrient: NumericVectorSchema.optional(),
  manoHandPose: NumericVectorSchema.optional(),
  manoBetas: NumericVectorSchema.optional(),
  joints3d: z.array(Vec3Schema).optional(),
  wristPositionCamera: Vec3Schema.optional(),
  valid: z.boolean().optional(),
  confidence: z.number().finite().optional(),
});

export const HumanPlusFrameInputSchema = z.object({
  sessionId: z.string().min(1),
  timestampNs: NanosecondTimestampSchema,
  bodyMotion: z.object({
    mocapWorldRoot: Matrix4Schema.optional(),
    smplhPose: NumericVectorSchema.optional(),
    bodyKeypoints: z.array(Vec3Schema).optional(),
    footContactProbability: NumericVectorSchema.optional(),
  }).optional(),
  handMotion: z.object({
    left: HumanPlusHandInputSchema.optional(),
    right: HumanPlusHandInputSchema.optional(),
  }).optional(),
  slam: z.object({
    slamWorldCamera: Matrix4Schema.optional(),
    cameraFrame: z.string().optional(),
    pointCloudAvailable: z.boolean().default(false),
  }).optional(),
  depth: z.object({
    available: z.boolean().default(false),
  }).optional(),
  behavior: z.object({
    activitySummarization: z.string().optional(),
    motionNarration: z.string().optional(),
    atomicAction: z.string().optional(),
  }).optional(),
});

export type HumanPlusFrameInput = z.infer<typeof HumanPlusFrameInputSchema>;

function normalizeHand(hand: z.infer<typeof HumanPlusHandInputSchema> | undefined) {
  if (!hand) return undefined;
  return {
    globalOrient: hand.manoHandGlobalOrient,
    pose: hand.manoHandPose,
    betas: hand.manoBetas,
    joints3d: hand.joints3d,
    wristPositionCamera: hand.wristPositionCamera,
    valid: hand.valid,
    confidence: hand.confidence,
  };
}

export function normalizeHumanPlusFrame(
  raw: HumanPlusFrameInput,
  purpose: HumanPlusPurpose,
  grant?: HumanPlusLicenseGrant,
): MotionPacket {
  assertHumanPlusUseAllowed(purpose, grant);
  const input = HumanPlusFrameInputSchema.parse(raw);

  return MotionPacketSchema.parse({
    version: "motion-packet.v1",
    source: "humanplus-1000",
    sourceLicense: HUMANPLUS_DATASET.license,
    sourceRelease: HUMANPLUS_DATASET.release,
    sessionId: input.sessionId,
    timestampNs: input.timestampNs,
    body: input.bodyMotion ? {
      rootTransform: input.bodyMotion.mocapWorldRoot,
      smplhPose: input.bodyMotion.smplhPose,
      bodyKeypoints: input.bodyMotion.bodyKeypoints,
      footContactProbability: input.bodyMotion.footContactProbability,
    } : undefined,
    hands: input.handMotion ? {
      left: normalizeHand(input.handMotion.left),
      right: normalizeHand(input.handMotion.right),
    } : undefined,
    camera: input.slam ? {
      slamWorldCamera: input.slam.slamWorldCamera,
      frame: input.slam.cameraFrame,
    } : undefined,
    world: {
      depthAvailable: input.depth?.available ?? false,
      pointCloudAvailable: input.slam?.pointCloudAvailable ?? false,
    },
    semantic: input.behavior ? {
      activitySummary: input.behavior.activitySummarization,
      motionNarration: input.behavior.motionNarration,
      atomicAction: input.behavior.atomicAction,
    } : undefined,
  });
}

export function toMotionControlHints(packet: MotionPacket): MotionControlHints {
  const parsed = MotionPacketSchema.parse(packet);
  return MotionControlHintsSchema.parse({
    sessionId: parsed.sessionId,
    timestampNs: parsed.timestampNs,
    action: parsed.semantic?.atomicAction,
    narration: parsed.semantic?.motionNarration,
    hasBodyMotion: Boolean(parsed.body),
    hasCameraPose: Boolean(parsed.camera?.slamWorldCamera),
    hasLeftHand: parsed.hands?.left?.valid === true,
    hasRightHand: parsed.hands?.right?.valid === true,
    hasDepth: parsed.world?.depthAvailable ?? false,
    hasPointCloud: parsed.world?.pointCloudAvailable ?? false,
    rootTransform: parsed.body?.rootTransform,
    cameraTransform: parsed.camera?.slamWorldCamera,
    footContactProbability: parsed.body?.footContactProbability,
  });
}
