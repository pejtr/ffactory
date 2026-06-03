// ─── MAGS — Shared Types ──────────────────────────────────────────────────────

export type AgentName =
  | "VideoAgent"
  | "ChannelAgent"
  | "ContentCalendarAgent"
  | "ThumbnailABAgent"
  | "BlueprintAgent"
  | "ThumbnailCreativeAgent";

export type DecisionType =
  | "pause" | "scale" | "create" | "update" | "alert" | "approve" | "reject" | "recommend";

export type DecisionSource = "rules" | "ai" | "hybrid";

export type DecisionStatus =
  | "applied" | "pending" | "approved" | "rejected" | "superseded";

export type RiskLevel = "low" | "medium" | "high";

export interface AgentDecisionInput {
  agentName: AgentName;
  runId: string;
  decisionType: DecisionType;
  source: DecisionSource;
  title: string;
  reasoning: string;
  impact?: string;
  confidence: number; // 0-100
  status: DecisionStatus;
  metadata?: Record<string, unknown>;
}

export interface AgentDecisionRecord extends AgentDecisionInput {
  id: number;
  createdAt: Date;
  appliedAt?: Date | null;
  approvedBy?: string | null;
  rejectedReason?: string | null;
}

export interface AgentRunResult {
  agentName: AgentName;
  runId: string;
  status: "success" | "error" | "skipped";
  durationMs: number;
  decisionsCount: number;
  appliedCount: number;
  score: number; // 0-100
  summary: string;
  decisions: AgentDecisionInput[];
  error?: string;
}

export interface SharedVideoMetrics {
  // Video pipeline metrics
  totalProjects: number;
  activeProjects: number;
  stalledProjects: number; // stuck > 30 min
  failedProjectsLast24h: number;
  avgQualityScore: number;
  completedLast7d: number;

  // Channel metrics
  totalChannels: number;
  channelsWithPostingGap: number; // no post > 3 days
  avgCTR: number; // across all channels
  totalSubscribers: number;
  subscriberDropChannels: number; // > 5% drop last 7d

  // Content calendar metrics
  totalQueuedVideos: number;
  channelsWithEmptyQueue: number;
  avgPostingCadenceAdherence: number; // 0-100%

  // Blueprint metrics
  totalBlueprints: number;
  activeBlueprints: number;
  blueprintExecutionRate: number; // % of 30 videos actually produced

  // Thumbnail metrics
  lowCTRVideos: number; // CTR < 3%
  abTestsRunning: number;
  abTestsWithWinner: number;

  // Timestamp
  collectedAt: Date;
}

export interface RuleResult {
  ruleId: string;
  matched: boolean;
  decision?: Omit<AgentDecisionInput, "agentName" | "runId">;
}

export interface OrchestratorRunResult {
  runId: string;
  triggeredBy: "cron" | "manual" | "leadOS" | "event";
  overallScore: number;
  totalDecisions: number;
  appliedDecisions: number;
  pendingDecisions: number;
  summary: string;
  agentResults: AgentRunResult[];
  alerts: Array<{ agent: AgentName; message: string; severity: RiskLevel }>;
  startedAt: Date;
  finishedAt: Date;
}
