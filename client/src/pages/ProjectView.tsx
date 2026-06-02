import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import {
  Film, ChevronLeft, Play, Share2, Download, Loader2,
  CheckCircle2, XCircle, Clock, Music, Mic, Video,
  Cpu, Star, Zap, RefreshCw, ExternalLink, Ban,
  RotateCcw, AlertTriangle, Clapperboard, Wand2, Volume2
} from "lucide-react";

// ─── Pipeline phase definitions ────────────────────────────────────────────────
const PIPELINE_PHASES = [
  { id: "generating_screenplay", label: "Scénář", icon: <Wand2 className="w-3.5 h-3.5" />, pct: 15 },
  { id: "generating_audio",      label: "Hudba",   icon: <Volume2 className="w-3.5 h-3.5" />, pct: 30 },
  { id: "generating_scenes",     label: "Scény",   icon: <Clapperboard className="w-3.5 h-3.5" />, pct: 85 },
  { id: "assembling",            label: "Střih",   icon: <Film className="w-3.5 h-3.5" />, pct: 95 },
  { id: "completed",             label: "Hotovo",  icon: <CheckCircle2 className="w-3.5 h-3.5" />, pct: 100 },
];

function getPhaseProgress(status: string, completedScenes: number, totalScenes: number): number {
  if (status === "completed") return 100;
  if (status === "failed" || status === "cancelled") return 0;
  const phase = PIPELINE_PHASES.find((p) => p.id === status);
  if (!phase) return 5;
  if (status === "generating_scenes" && totalScenes > 0) {
    const base = 30;
    const range = 55; // 30% → 85%
    return Math.round(base + (completedScenes / totalScenes) * range);
  }
  return phase.pct;
}

const STATUS_CONFIG = {
  pending:    { label: "Čeká",       color: "text-muted-foreground", bg: "bg-muted/20" },
  generating: { label: "Generuji",   color: "text-blue-400",         bg: "bg-blue-500/10" },
  completed:  { label: "Hotovo",     color: "text-green-400",        bg: "bg-green-500/10" },
  failed:     { label: "Chyba",      color: "text-red-400",          bg: "bg-red-500/10" },
  cancelled:  { label: "Zrušeno",    color: "text-yellow-400",       bg: "bg-yellow-500/10" },
};

const MODEL_BADGE: Record<string, { label: string; color: string }> = {
  "kling-v3-omni":     { label: "Kling 3.0",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "kling-3.0-omni":    { label: "Kling 3.0",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "kling-v3-motion":   { label: "Kling Motion", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "hailuo-minimax-2.3":{ label: "Hailuo 2.3",  color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  "wan-2.2-t2v":       { label: "WAN 2.2 T2V", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  "wan-2.2-s2v":       { label: "WAN S2V",     color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  "seedance-2.0":      { label: "Seedance 2.0", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

const SCENE_TYPE_ICON: Record<string, React.ReactNode> = {
  dialogue:   <Mic className="w-3 h-3" />,
  broll:      <Film className="w-3 h-3" />,
  action:     <Zap className="w-3 h-3" />,
  lipsync:    <Cpu className="w-3 h-3" />,
  dream:      <Star className="w-3 h-3" />,
  transition: <Video className="w-3 h-3" />,
};

const STATUS_LABEL_CS: Record<string, string> = {
  draft:                 "Koncept",
  generating_screenplay: "Generuji scénář…",
  generating_audio:      "Generuji hudbu…",
  generating_scenes:     "Generuji scény…",
  assembling:            "Střihám video…",
  completed:             "Dokončeno",
  failed:                "Chyba",
  cancelled:             "Zrušeno",
};

export default function ProjectView() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0");
  const { isAuthenticated, user } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const utils = trpc.useUtils();

  // Persist last viewed project so Studio can redirect back on refresh
  useEffect(() => {
    if (projectId && user?.id) {
      try { localStorage.setItem(`vf_last_project_${user.id}`, String(projectId)); } catch {}
    }
  }, [projectId, user?.id]);

  const isActiveStatus = (s?: string) =>
    s === "generating_screenplay" || s === "generating_audio" ||
    s === "generating_scenes" || s === "assembling";

  const { data: project, isLoading } = trpc.video.status.useQuery(
    { id: projectId },
    {
      enabled: !!projectId && isAuthenticated,
      refetchInterval: (query) => {
        const d = query.state.data as { status?: string } | undefined;
        if (!d) return 3000;
        return isActiveStatus(d.status) ? 2000 : false;
      },
    }
  );

  const cancelMutation = trpc.video.cancel.useMutation({
    onSuccess: () => {
      toast.success("Generace zrušena");
      utils.video.status.invalidate({ id: projectId });
    },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const regenProjectMutation = trpc.video.regenerateProject.useMutation({
    onSuccess: () => {
      toast.success("Regenerace spuštěna");
      utils.video.status.invalidate({ id: projectId });
    },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const regenSceneMutation = trpc.video.regenerateScene.useMutation({
    onSuccess: () => {
      toast.success("Scéna se regeneruje");
      utils.video.status.invalidate({ id: projectId });
    },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const handleShare = () => {
    const token = (project as { shareToken?: string } | null | undefined)?.shareToken;
    const url = token ? `${window.location.origin}/share/${token}` : window.location.href;
    setShareUrl(url);
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Odkaz zkopírován!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Film className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Přihlas se pro zobrazení projektu</p>
          <Link href="/"><Button variant="outline">Domů</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display tracking-wider text-sm">NAČÍTÁM PROJEKT…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground mb-2">Projekt nenalezen</p>
          <Link href="/studio"><Button variant="outline">Zpět do Studia</Button></Link>
        </div>
      </div>
    );
  }

  const p = project as {
    title: string; status: string; shareToken?: string;
    finalVideoUrl?: string; totalCostUsd?: number; estimatedCostUsd?: number; errorMessage?: string;
    completedScenes: number; totalScenes: number; progress: number;
    scenes: Array<{
      id: number; sceneIndex: number; title: string; description: string;
      sceneType: string; videoModel: string; status: string; videoUrl?: string;
      duration: number; emotion: string; errorMessage?: string;
    }>;
  };

  const completedScenes = p.completedScenes ?? 0;
  const totalScenes = p.totalScenes ?? 0;
  const progress = getPhaseProgress(p.status, completedScenes, totalScenes);
  const isActive = isActiveStatus(p.status);
  const isFailed = p.status === "failed";
  const isCancelled = p.status === "cancelled";
  const isCompleted = p.status === "completed";

  // Current phase index for stepper
  const currentPhaseIdx = PIPELINE_PHASES.findIndex((ph) => ph.id === p.status);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/studio">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" />Studio
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <span className="font-display text-sm text-foreground truncate max-w-[200px]">{p.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelMutation.mutate({ id: projectId })}
                disabled={cancelMutation.isPending}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-display tracking-wide"
              >
                {cancelMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                ZRUŠIT
              </Button>
            )}
            {(isFailed || isCancelled) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenProjectMutation.mutate({ id: projectId })}
                disabled={regenProjectMutation.isPending}
                className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-display tracking-wide"
              >
                {regenProjectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                REGENEROVAT
              </Button>
            )}
            {isCompleted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-border/60 text-xs font-display tracking-wide"
                >
                  <Share2 className="w-3 h-3 mr-2" />SDÍLET
                </Button>
                {p.finalVideoUrl && (
                  <a href={p.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="glow-blue font-display text-xs tracking-wider">
                      <Download className="w-3 h-3 mr-2" />STÁHNOUT
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="pt-20 pb-16">
        <div className="container max-w-5xl">

          {/* ── Progress Section ── */}
          <div className="mb-8">
            {/* Phase stepper */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
              {PIPELINE_PHASES.map((phase, idx) => {
                const isDone = isCompleted || (currentPhaseIdx > idx);
                const isCurrent = currentPhaseIdx === idx && isActive;
                return (
                  <div key={phase.id} className="flex items-center gap-1 shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display transition-all ${
                      isDone ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                      isCurrent ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 pulse-active" :
                      "bg-muted/30 text-muted-foreground border border-border/30"
                    }`}>
                      {isCurrent && <Loader2 className="w-3 h-3 animate-spin" />}
                      {isDone && <CheckCircle2 className="w-3 h-3" />}
                      {!isCurrent && !isDone && phase.icon}
                      <span>{phase.label}</span>
                    </div>
                    {idx < PIPELINE_PHASES.length - 1 && (
                      <div className={`w-4 h-px ${isDone ? "bg-green-500/40" : "bg-border/30"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar + stats */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Badge className={`font-display text-xs tracking-wider ${
                  isCompleted ? "bg-green-500/20 text-green-300 border-green-500/30" :
                  isFailed    ? "bg-red-500/20 text-red-300 border-red-500/30" :
                  isCancelled ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                  "bg-blue-500/20 text-blue-300 border-blue-500/30 pulse-active"
                }`}>
                  {isActive && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {isCompleted && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {isFailed && <XCircle className="w-3 h-3 mr-1" />}
                  {isCancelled && <Ban className="w-3 h-3 mr-1" />}
                  {STATUS_LABEL_CS[p.status] ?? p.status.toUpperCase()}
                </Badge>
                {totalScenes > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {completedScenes}/{totalScenes} scén dokončeno
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {p.estimatedCostUsd != null && (
                  <span className="text-xs text-muted-foreground">
                    Odhadovaná cena: <span className="text-primary font-display">${p.estimatedCostUsd.toFixed(2)}</span>
                  </span>
                )}
                <span className="text-xs font-display text-muted-foreground">{progress}%</span>
              </div>
            </div>
            <Progress value={progress} className="h-2.5 progress-glow" />
          </div>

          {/* ── Final Video ── */}
          {isCompleted && p.finalVideoUrl && (
            <Card className="mb-8 overflow-hidden border-primary/20 glow-blue">
              <div className="aspect-video bg-black">
                <video src={p.finalVideoUrl} controls className="w-full h-full" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-primary">{p.title}</h2>
                  {shareUrl && (
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" />{shareUrl}
                    </a>
                  )}
                </div>
                <Button onClick={handleShare} className="glow-teal font-display text-xs tracking-wider">
                  <Share2 className="w-4 h-4 mr-2" />SDÍLET FILM
                </Button>
              </div>
            </Card>
          )}

          {/* ── Error Banner ── */}
          {(isFailed || isCancelled) && (
            <Card className={`mb-8 p-4 ${isFailed ? "border-destructive/30 bg-destructive/5" : "border-yellow-500/30 bg-yellow-500/5"}`}>
              <div className={`flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  {isFailed ? <XCircle className="w-4 h-4 text-destructive" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  <span className={`text-sm font-medium ${isFailed ? "text-destructive" : "text-yellow-400"}`}>
                    {isFailed ? "Produkce selhala" : "Produkce zrušena"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => regenProjectMutation.mutate({ id: projectId })}
                  disabled={regenProjectMutation.isPending}
                  className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs"
                >
                  {regenProjectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                  Zkusit znovu
                </Button>
              </div>
              {p.errorMessage && (
                <p className="text-xs text-muted-foreground mt-2">{p.errorMessage}</p>
              )}
            </Card>
          )}

          {/* ── Scene Pipeline ── */}
          <div>
            <h3 className="font-display text-sm tracking-wider text-muted-foreground uppercase mb-4">
              Scene Pipeline
            </h3>
            <div className="space-y-3">
              {p.scenes.map((scene) => {
                const modelBadge = MODEL_BADGE[scene.videoModel] ?? { label: scene.videoModel, color: "bg-muted text-muted-foreground border-border" };
                const statusCfg = STATUS_CONFIG[scene.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                const canRegen = scene.status === "failed" || scene.status === "cancelled" || scene.status === "completed";
                return (
                  <Card key={scene.id} className={`p-4 border-border/40 transition-all ${
                    scene.status === "generating" ? "border-primary/30 pulse-active" :
                    scene.status === "failed" ? "border-red-500/20" : ""
                  }`}>
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusCfg.bg}`}>
                        {scene.status === "completed"  && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {scene.status === "failed"     && <XCircle className="w-4 h-4 text-red-400" />}
                        {scene.status === "generating" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {scene.status === "pending"    && <Clock className="w-4 h-4 text-muted-foreground" />}
                        {scene.status === "cancelled"  && <Ban className="w-4 h-4 text-yellow-400" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-muted-foreground font-display">#{scene.sceneIndex + 1}</span>
                          <span className="text-sm font-medium text-foreground">{scene.title}</span>
                          <Badge className={`text-xs border ${modelBadge.color}`}>{modelBadge.label}</Badge>
                          <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                            {SCENE_TYPE_ICON[scene.sceneType]}
                            <span className="ml-1">{scene.sceneType}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{scene.description}</p>
                        {scene.errorMessage && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />{scene.errorMessage}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{scene.duration}s</span>
                          <span className="capitalize text-accent/70">{scene.emotion}</span>
                          <span className={statusCfg.color}>{statusCfg.label}</span>
                        </div>
                      </div>

                      {/* Right side: video preview + regen button */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {scene.videoUrl && (
                          <div className="w-24 h-16 rounded overflow-hidden bg-black">
                            <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                          </div>
                        )}
                        {canRegen && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => regenSceneMutation.mutate({ projectId, sceneId: scene.id })}
                            disabled={regenSceneMutation.isPending}
                            className="text-xs text-muted-foreground hover:text-blue-400 h-7 px-2"
                            title="Regenerovat scénu"
                          >
                            {regenSceneMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Music tracks section */}
          {isCompleted && (
            <div className="mt-8">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground uppercase mb-4">
                <Music className="w-4 h-4 inline mr-2" />Hudební stopy
              </h3>
              <p className="text-xs text-muted-foreground">Hudba je součástí finálního videa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
