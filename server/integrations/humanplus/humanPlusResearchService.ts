import path from "node:path";
import {
  extractHumanPlusMotionPacket,
  runHumanPlusPythonExtractor,
  type HumanPlusExtractorRunner,
} from "./hdf5Extractor";
import { toMotionControlHints } from "./humanPlusAdapter";

export interface HumanPlusResearchFrameInput {
  sessionId: string;
  relativeAnnotationPath: string;
  frameIndex?: number;
}

export interface HumanPlusResearchDeps {
  dataRoot?: string;
  pythonExecutable?: string;
  runner?: HumanPlusExtractorRunner;
}

function resolveResearchPath(root: string, relativePath: string): string {
  if (!relativePath.trim() || path.isAbsolute(relativePath)) {
    throw new Error("HUMANPLUS_RELATIVE_PATH_REQUIRED");
  }

  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, relativePath);
  const rel = path.relative(resolvedRoot, candidate);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("HUMANPLUS_PATH_TRAVERSAL_BLOCKED");
  }

  return candidate;
}

export function getHumanPlusResearchStatus(
  deps: HumanPlusResearchDeps = {},
) {
  const dataRoot = deps.dataRoot ?? process.env.HUMANPLUS_DATA_ROOT;
  const pythonExecutable =
    deps.pythonExecutable ??
    process.env.HUMANPLUS_PYTHON ??
    (process.platform === "win32" ? "python" : "python3");

  return {
    enabled: Boolean(dataRoot),
    dataRootConfigured: Boolean(dataRoot),
    pythonConfigured: Boolean(pythonExecutable),
    source: "humanplus-1000" as const,
    release: "preview" as const,
    license: "CC-BY-NC-4.0" as const,
    mode: "research_only" as const,
    productionGenerationAllowed: false,
    commercialTrainingAllowed: false,
  };
}

export async function loadHumanPlusResearchFrame(
  input: HumanPlusResearchFrameInput,
  deps: HumanPlusResearchDeps = {},
) {
  const dataRoot = deps.dataRoot ?? process.env.HUMANPLUS_DATA_ROOT;
  if (!dataRoot) {
    throw new Error("HUMANPLUS_DATA_ROOT_NOT_CONFIGURED");
  }

  const annotationPath = resolveResearchPath(
    dataRoot,
    input.relativeAnnotationPath,
  );
  const runner = deps.runner ?? runHumanPlusPythonExtractor;

  const packet = await extractHumanPlusMotionPacket(
    {
      annotationPath,
      sessionId: input.sessionId,
      frameIndex: input.frameIndex ?? 0,
      purpose: "research_loader",
      dataRoot,
      pythonExecutable: deps.pythonExecutable ?? process.env.HUMANPLUS_PYTHON,
    },
    runner,
  );

  return {
    packet,
    hints: toMotionControlHints(packet),
    policy: getHumanPlusResearchStatus(deps),
  };
}
