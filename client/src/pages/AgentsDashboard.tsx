import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "wouter";

// ── Health Score Gauge ─────────────────────────────────────────────────────────
function HealthGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
  const label =
    score >= 80 ? "Healthy" : score >= 60 ? "Good" : score >= 40 ? "Warning" : "Critical";
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle
          cx="70" cy="70" r="54" fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
          {score}
        </text>
        <text x="70" y="85" textAnchor="middle" fill="#94a3b8" fontSize="11">
          / 100
        </text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Agent Card ─────────────────────────────────────────────────────────────────
function AgentCard({
  agentName,
  score,
  decisionsCount,
  appliedCount,
  status,
  summary,
  onTrigger,
  isTriggering,
}: {
  agentName: string;
  score: number;
  decisionsCount: number;
  appliedCount: number;
  status: string;
  summary?: string | null;
  onTrigger: () => void;
  isTriggering: boolean;
}) {
  const scoreColor =
    score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : score >= 40 ? "text-orange-400" : "text-red-400";
  const statusColor =
    status === "success" ? "bg-green-500/20 text-green-400" :
    status === "error" ? "bg-red-500/20 text-red-400" :
    "bg-slate-500/20 text-slate-400";

  const agentIcons: Record<string, string> = {
    VideoAgent: "🎬",
    ChannelAgent: "📺",
    ContentCalendarAgent: "📅",
    ThumbnailABAgent: "🖼️",
    BlueprintAgent: "🗺️",
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700 hover:border-slate-500 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{agentIcons[agentName] ?? "🤖"}</span>
            <div>
              <p className="font-semibold text-white text-sm">{agentName}</p>
              <Badge className={`text-xs ${statusColor}`}>{status}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
            <p className="text-xs text-slate-500">/ 100</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Decisions:</span>{" "}
            <span className="text-white">{decisionsCount}</span>
          </div>
          <div>
            <span className="text-slate-500">Applied:</span>{" "}
            <span className="text-green-400">{appliedCount}</span>
          </div>
        </div>

        {summary && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{summary}</p>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          onClick={onTrigger}
          disabled={isTriggering}
        >
          {isTriggering ? "Running..." : "▶ Trigger"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Decision Badge ─────────────────────────────────────────────────────────────
function DecisionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-blue-500/20 text-blue-400",
    rejected: "bg-red-500/20 text-red-400",
    superseded: "bg-slate-500/20 text-slate-400",
  };
  return <Badge className={`text-xs ${map[status] ?? "bg-slate-500/20 text-slate-400"}`}>{status}</Badge>;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AgentsDashboard() {
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [leadosUrl, setLeadosUrl] = useState("");
  const [leadosApiKey, setLeadosApiKey] = useState("");
  const [leadosEnabled, setLeadosEnabled] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const overview = trpc.agents.getOverview.useQuery(undefined, { refetchInterval: 30000 });
  const pendingDecisions = trpc.agents.getPendingDecisions.useQuery({});
  const decisionHistory = trpc.agents.getDecisionHistory.useQuery({ limit: 50 });
  const orchestratorRuns = trpc.agents.getOrchestratorRuns.useQuery({ limit: 10 });
  const leadosConfig = trpc.agents.getLeadosConfig.useQuery();

  // Mutations
  const runFull = trpc.agents.runFull.useMutation({
    onSuccess: (data) => {
      toast.success(`MAGS Cycle Complete — Score: ${data.overallScore}/100 | ${data.totalDecisions} decisions`);
      utils.agents.getOverview.invalidate();
      utils.agents.getPendingDecisions.invalidate();
      utils.agents.getOrchestratorRuns.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const triggerAgent = trpc.agents.triggerAgent.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.agentName} complete — Score: ${data.score}/100 | ${data.decisionsCount} decisions`);
      utils.agents.getOverview.invalidate();
      utils.agents.getPendingDecisions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveDecision = trpc.agents.approveDecision.useMutation({
    onSuccess: () => {
      toast.success("Decision approved");
      utils.agents.getPendingDecisions.invalidate();
      utils.agents.getDecisionHistory.invalidate();
    },
  });

  const rejectDecision = trpc.agents.rejectDecision.useMutation({
    onSuccess: () => {
      toast.success("Decision rejected");
      utils.agents.getPendingDecisions.invalidate();
      utils.agents.getDecisionHistory.invalidate();
    },
  });

  const saveLeadosConfig = trpc.agents.saveLeadosConfig.useMutation({
    onSuccess: () => {
      toast.success("LeadOS config saved");
      utils.agents.getLeadosConfig.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Sync LeadOS config from query
  const leadosData = leadosConfig.data;

  const ALL_AGENTS = ["VideoAgent", "ChannelAgent", "ContentCalendarAgent", "ThumbnailABAgent", "BlueprintAgent"];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">← Zpět</Link>
            <span className="text-slate-600">|</span>
            <div>
              <h1 className="text-lg font-bold text-white">🤖 MAGS Command Center</h1>
              <p className="text-xs text-slate-500">Multi-Agent Autonomous Growth System</p>
            </div>
          </div>
          <Button
            onClick={() => runFull.mutate()}
            disabled={runFull.isPending}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            {runFull.isPending ? "⏳ Running..." : "▶ Run All Agents"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Health Score */}
          <Card className="bg-slate-900 border-slate-700 md:col-span-1">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Overall Health</p>
              <HealthGauge score={overview.data?.latestRun?.overallScore ?? 50} />
              {overview.data?.latestRun && (
                <p className="text-xs text-slate-600 mt-2">
                  Last run: {new Date(overview.data.latestRun.startedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">
                  {overview.data?.pendingCount ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Pending Approvals</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-400">
                  {overview.data?.latestRun?.appliedDecisions ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Applied (last run)</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">
                  {overview.data?.latestRun?.totalDecisions ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Total Decisions</p>
              </CardContent>
            </Card>

            {/* Alerts */}
            {(() => {
              const alerts = overview.data?.latestRun?.alerts as any[] | undefined;
              if (!alerts || alerts.length === 0) return null;
              return (
                <div className="col-span-3">
                  <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-400 mb-2">⚠ Active Alerts</p>
                    {alerts.map((alert: any, i: number) => (
                      <p key={i} className="text-xs text-red-300">
                        [{String(alert.agent)}] {String(alert.message)}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Agent Cards */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Agenti</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {ALL_AGENTS.map((agentName) => {
              const agentData = overview.data?.agentScores?.find((a: any) => a.agentName === agentName);
              return (
                <AgentCard
                  key={agentName}
                  agentName={agentName}
                  score={agentData?.score ?? 50}
                  decisionsCount={agentData?.decisionsCount ?? 0}
                  appliedCount={agentData?.appliedCount ?? 0}
                  status={agentData?.status ?? "skipped"}
                  summary={agentData?.summary}
                  onTrigger={() => triggerAgent.mutate({ agentName })}
                  isTriggering={triggerAgent.isPending && triggerAgent.variables?.agentName === agentName}
                />
              );
            })}
          </div>
        </div>

        {/* Tabs: Pending / History / Runs / LeadOS */}
        <Tabs defaultValue="pending">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
              Pending Approvals
              {(overview.data?.pendingCount ?? 0) > 0 && (
                <span className="ml-2 bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5">
                  {overview.data?.pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-700">Decision History</TabsTrigger>
            <TabsTrigger value="runs" className="data-[state=active]:bg-slate-700">Orchestrator Runs</TabsTrigger>
            <TabsTrigger value="leados" className="data-[state=active]:bg-slate-700">LeadOS Config</TabsTrigger>
          </TabsList>

          {/* Pending Approvals */}
          <TabsContent value="pending">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4">
                {pendingDecisions.data?.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">✓ No pending approvals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingDecisions.data?.map((d: any) => (
                      <div key={d.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-violet-500/20 text-violet-300 text-xs">{d.agentName}</Badge>
                              <Badge className="bg-slate-600/40 text-slate-300 text-xs">{d.decisionType}</Badge>
                              <span className="text-xs text-slate-500">confidence: {d.confidence}%</span>
                            </div>
                            <p className="font-semibold text-white text-sm">{d.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{d.reasoning}</p>
                            {d.impact && (
                              <p className="text-xs text-orange-400 mt-1">Impact: {d.impact}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-500 text-white text-xs"
                              onClick={() => approveDecision.mutate({ id: d.id })}
                              disabled={approveDecision.isPending}
                            >
                              ✓ Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-700 text-red-400 hover:bg-red-950 text-xs"
                              onClick={() => rejectDecision.mutate({
                                id: d.id,
                                reason: rejectReason[d.id] || "Rejected by admin",
                              })}
                              disabled={rejectDecision.isPending}
                            >
                              ✗ Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decision History */}
          <TabsContent value="history">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4">
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {decisionHistory.data?.map((d: any) => (
                    <div key={d.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                      <div className="shrink-0 mt-0.5">
                        <DecisionStatusBadge status={d.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-violet-400">{d.agentName}</span>
                          <span className="text-xs text-slate-600">•</span>
                          <span className="text-xs text-slate-500">{d.source}</span>
                          <span className="text-xs text-slate-600">•</span>
                          <span className="text-xs text-slate-500">{d.confidence}% confidence</span>
                        </div>
                        <p className="text-sm text-white">{d.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{d.reasoning}</p>
                      </div>
                      <span className="text-xs text-slate-600 shrink-0">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orchestrator Runs */}
          <TabsContent value="runs">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {orchestratorRuns.data?.map((run: any) => {
                    const scoreColor =
                      run.overallScore >= 80 ? "text-green-400" :
                      run.overallScore >= 60 ? "text-yellow-400" :
                      run.overallScore >= 40 ? "text-orange-400" : "text-red-400";
                    return (
                      <div key={run.id} className="bg-slate-800 rounded-lg p-3 flex items-center gap-4">
                        <div className="text-center shrink-0">
                          <p className={`text-xl font-bold ${scoreColor}`}>{run.overallScore}</p>
                          <p className="text-xs text-slate-500">score</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-slate-700 text-slate-300 text-xs">{run.triggeredBy}</Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(run.startedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{run.summary}</p>
                        </div>
                        <div className="text-right shrink-0 text-xs text-slate-500">
                          <p>{run.totalDecisions} decisions</p>
                          <p className="text-green-400">{run.appliedDecisions} applied</p>
                          {run.pendingDecisions > 0 && (
                            <p className="text-yellow-400">{run.pendingDecisions} pending</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LeadOS Configuration */}
          <TabsContent value="leados">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  🔗 LeadOS Integration
                  {leadosData?.enabled && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-400 space-y-2">
                  <p className="font-semibold text-white">Inbound webhook (LeadOS → Video Factory):</p>
                  <code className="block bg-slate-950 rounded p-2 text-xs text-green-400 font-mono">
                    POST {window.location.origin}/api/agents/webhook
                  </code>
                  <p className="text-xs">Actions: <code className="text-violet-400">run_full</code>, <code className="text-violet-400">run_agent</code>, <code className="text-violet-400">approve_decision</code>, <code className="text-violet-400">reject_decision</code>, <code className="text-violet-400">get_report</code></p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">LeadOS Webhook URL (outbound)</Label>
                    <Input
                      placeholder="https://your-leados-instance.com/webhook/mags"
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                      defaultValue={leadosData?.webhookUrl ?? ""}
                      onChange={(e) => setLeadosUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Video Factory pushes events here after each MAGS cycle</p>
                  </div>

                  <div>
                    <Label className="text-slate-300 text-sm">API Key (Bearer token)</Label>
                    <Input
                      type="password"
                      placeholder="••••••••••••••••"
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                      onChange={(e) => setLeadosApiKey(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={leadosEnabled || leadosData?.enabled || false}
                      onCheckedChange={setLeadosEnabled}
                    />
                    <Label className="text-slate-300 text-sm">Enable LeadOS outbound push</Label>
                  </div>

                  {leadosData?.lastPushAt && (
                    <div className="text-xs text-slate-500">
                      Last push: {new Date(leadosData.lastPushAt).toLocaleString()} —{" "}
                      <span className={leadosData.lastPushStatus === "success" ? "text-green-400" : "text-red-400"}>
                        {leadosData.lastPushStatus}
                      </span>
                    </div>
                  )}

                  <Button
                    className="bg-violet-600 hover:bg-violet-500 text-white"
                    onClick={() =>
                      saveLeadosConfig.mutate({
                        webhookUrl: leadosUrl || leadosData?.webhookUrl || "",
                        apiKey: leadosApiKey || undefined,
                        enabled: leadosEnabled || leadosData?.enabled || false,
                      })
                    }
                    disabled={saveLeadosConfig.isPending}
                  >
                    {saveLeadosConfig.isPending ? "Saving..." : "💾 Save LeadOS Config"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
