import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  HumanPlusFrameInputSchema,
  normalizeHumanPlusFrame,
  type HumanPlusLicenseGrant,
  type HumanPlusPurpose,
} from "./humanPlusAdapter";
import type { MotionPacket } from "../../../shared/motionIntelligence";

const execFileAsync = promisify(execFile);

export interface HumanPlusExtractOptions {
  annotationPath: string;
  sessionId: string;
  frameIndex?: number;
  purpose?: HumanPlusPurpose;
  grant?: HumanPlusLicenseGrant;
  dataRoot?: string;
  pythonExecutable?: string;
}

export type HumanPlusExtractorRunner = (args: {
  annotationPath: string;
  sessionId: string;
  frameIndex: number;
  pythonExecutable: string;
}) => Promise<unknown>;

function isWithinRoot(candidate: string, root: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

async function validateAnnotationPath(
  annotationPath: string,
  configuredRoot?: string,
): Promise<string> {
  const resolved = path.resolve(annotationPath);
  const extension = path.extname(resolved).toLowerCase();
  if (extension !== ".hdf5" && extension !== ".h5") {
    throw new Error("HUMANPLUS_ANNOTATION_EXTENSION_INVALID");
  }

  const root = configuredRoot ?? process.env.HUMANPLUS_DATA_ROOT;
  if (root && !isWithinRoot(resolved, root)) {
    throw new Error("HUMANPLUS_ANNOTATION_OUTSIDE_DATA_ROOT");
  }

  const stat = await fs.stat(resolved).catch(() => null);
  if (!stat?.isFile()) {
    throw new Error("HUMANPLUS_ANNOTATION_NOT_FOUND");
  }

  return resolved;
}

function extractorScriptPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentFile), "../../../..");
  return path.join(projectRoot, "scripts", "humanplus_extract.py");
}

export const runHumanPlusPythonExtractor: HumanPlusExtractorRunner = async ({
  annotationPath,
  sessionId,
  frameIndex,
  pythonExecutable,
}) => {
  const script = extractorScriptPath();
  const { stdout, stderr } = await execFileAsync(
    pythonExecutable,
    [
      script,
      "--annotation",
      annotationPath,
      "--session-id",
      sessionId,
      "--frame-index",
      String(frameIndex),
    ],
    {
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
      timeout: 30_000,
    },
  );

  if (!stdout.trim()) {
    const detail = stderr.trim() ? ": " + stderr.trim() : "";
    throw new Error("HUMANPLUS_EXTRACTOR_EMPTY_OUTPUT" + detail);
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error("HUMANPLUS_EXTRACTOR_INVALID_JSON: " + detail);
  }
};

export async function extractHumanPlusMotionPacket(
  options: HumanPlusExtractOptions,
  runner: HumanPlusExtractorRunner = runHumanPlusPythonExtractor,
): Promise<MotionPacket> {
  const frameIndex = options.frameIndex ?? 0;
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error("HUMANPLUS_FRAME_INDEX_INVALID");
  }

  const annotationPath =
    runner === runHumanPlusPythonExtractor
      ? await validateAnnotationPath(options.annotationPath, options.dataRoot)
      : path.resolve(options.annotationPath);

  const raw = await runner({
    annotationPath,
    sessionId: options.sessionId,
    frameIndex,
    pythonExecutable:
      options.pythonExecutable ??
      process.env.HUMANPLUS_PYTHON ??
      (process.platform === "win32" ? "python" : "python3"),
  });

  const parsed = HumanPlusFrameInputSchema.parse(raw);
  return normalizeHumanPlusFrame(
    parsed,
    options.purpose ?? "research_loader",
    options.grant,
  );
}
