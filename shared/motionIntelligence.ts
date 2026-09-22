import { z } from "zod";

export const MotionPacketVersionSchema = z.literal("motion-packet.v1");
export const NanosecondTimestampSchema = z.string().regex(/^\d+$/, "timestampNs must be an integer string");

export const Matrix4Schema = z.array(z.number().finite()).length(16);
export const NumericVectorSchema = z.array(z.number().finite());
export const Vec3Schema = z.array(z.number().finite()).length(3);

export const MotionHandSchema = z.object({
  globalOrient: NumericVectorSchema.optional(),
  pose: NumericVectorSchema.optional(),
  betas: NumericVectorSchema.optional(),
  joints3d: z.array(Vec3Schema).optional(),
  wristPositionCamera: Vec3Schema.optional(),
  valid: z.boolean().optional(),
  confidence: z.number().finite().optional(),
});

export const MotionBodySchema = z.object({
  rootTransform: Matrix4Schema.optional(),
  smplhPose: NumericVectorSchema.optional(),
  bodyKeypoints: z.array(Vec3Schema).optional(),
  footContactProbability: NumericVectorSchema.optional(),
});

export const MotionCameraSchema = z.object({
  slamWorldCamera: Matrix4Schema.optional(),
  frame: z.string().optional(),
});

export const MotionWorldSchema = z.object({
  depthAvailable: z.boolean().default(false),
  pointCloudAvailable: z.boolean().default(false),
});

export const MotionSemanticSchema = z.object({
  activitySummary: z.string().optional(),
  motionNarration: z.string().optional(),
  atomicAction: z.string().optional(),
});

export const MotionPacketSchema = z.object({
  version: MotionPacketVersionSchema,
  source: z.literal("humanplus-1000"),
  sourceLicense: z.literal("CC-BY-NC-4.0"),
  sourceRelease: z.literal("preview"),
  sessionId: z.string().min(1),
  timestampNs: NanosecondTimestampSchema,
  body: MotionBodySchema.optional(),
  hands: z.object({
    left: MotionHandSchema.optional(),
    right: MotionHandSchema.optional(),
  }).optional(),
  camera: MotionCameraSchema.optional(),
  world: MotionWorldSchema.optional(),
  semantic: MotionSemanticSchema.optional(),
});

export type MotionPacket = z.infer<typeof MotionPacketSchema>;

export const MotionControlHintsSchema = z.object({
  sessionId: z.string(),
  timestampNs: NanosecondTimestampSchema,
  action: z.string().optional(),
  narration: z.string().optional(),
  hasBodyMotion: z.boolean(),
  hasCameraPose: z.boolean(),
  hasLeftHand: z.boolean(),
  hasRightHand: z.boolean(),
  hasDepth: z.boolean(),
  hasPointCloud: z.boolean(),
  rootTransform: Matrix4Schema.optional(),
  cameraTransform: Matrix4Schema.optional(),
  footContactProbability: NumericVectorSchema.optional(),
});

export type MotionControlHints = z.infer<typeof MotionControlHintsSchema>;
