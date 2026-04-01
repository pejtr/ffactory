import { useState } from "react";
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
  Film, ChevronLeft, Share2, Download, Loader2,
  CheckCircle2, XCircle, Clock, Music, Mic, Video,
  Cpu, Star, Zap, RefreshCw, ExternalLink
} from "lucide-react";

// ─── Status konfigurace (česky) ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:                { label: "Čeká",             color: "text-slate-400",  bg: "bg-slate-500/10" },
  generating:             { label: "Generuje se",      color: "text-blue-400",   bg: "bg-blue-500/10" },
  completed:              { label: "Hotovo",            color: "text-green-400",  bg: "bg-green-500/10" },
  failed:                 { label: "Chyba",             color: "text-red-400",    bg: "bg-red-500/10" },
  draft:                  { label: "Příprava",          color: "text-slate-400",  bg: "bg-slate-500/10" },
  generating_screenplay:  { label: "Píše scénář…",     color: "text-purple-400", bg: "bg-purple-500/10" },
  generating_audio:       { label: "Generuje hudbu…",  color: "text-teal-400",   bg: "bg-teal-500/10" },
  generating_scenes:      { label: "Generuje scény…",  color: "text-blue-400",   bg: "bg-blue-500/10" },
  assembling:             { label: "Sestavuje video…", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  processing:             { label: "Zpracovává se…",   color: "text-blue-400",   bg: "bg-blue-500/10" },
};

// ─── Model badge konfigurace ──────────────────────────────────────────────────
const MODEL_BADGE: Record<string, { label: string; color: string }> = {
  "kling-v3-omni":        { label: "Kling 3.0 Omni",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "kling-v3-motion":      { label: "Kling Motion",      color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  "hailuo-minimax-2.3":   { label: "Hailuo MiniMax",    color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  "wan-2.2-t2v":          { label: "WAN 2.2 T2V",       color: "bg-green-500/20 text-green-300 border-green-500/30" },
  "wan-2.2-s2v":          { label: "WAN 2.2 Lip Sync",  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

const SCENE_TYPE_ICON: Record<string, React.ReactNode> = {
  dialogue:   <Mic className="w-3 h-3" />,
  broll:      <Film className="w-3 h-3" />,
  action:     <Zap className="w-3 h-3" />,
  lipsync:    <Cpu className="w-3 h-3" />,
  dream:      <Star className="w-3 h-3" />,
  transition: <Video className="w-3 h-3" />,
};

const SCENE_TYPE_LABEL: Record<string, string> = {
  dialogue:   "Dialog",
  broll:      "B-Roll",
  action:     "Akce",
  lipsync:    "Lip Sync",
  dream:      "Sen",
  transition: "Přechod",
};

// Statusy, při kterých se má pokračovat v pollingu
const ACTIVE_STATUSES = new Set([
  "draft", "processing", "pending",
  "generating_screenplay", "generating_audio",
  "generating_scenes", "assembling",
]);

export default function ProjectView() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0");
  const { isAuthenticated } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { data: project, isLoading, refetch } = trpc.video.status.useQuery(
    { id: projectId },
    {
      enabled: !!projectId && isAuthenticated,
      refetchInterval: (query) => {
        const d = query.state.data as { status?: string } | undefined;
        if (!d?.status) return 3000;
        return ACTIVE_STATUSES.has(d.status) ? 3000 : false;
      },
    }
  );

  const handleShare = () => {
    const token = (project as { shareToken?: string } | null | undefined)?.shareToken;
    const url = token ? `${window.location.origin}/share/${token}` : window.location.href;
    setShareUrl(url);
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Odkaz zkopírován do schránky!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <Film className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Pro zobrazení projektu se přihlas</p>
          <Link href="/"><Button variant="outline">Zpět domů</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm tracking-wider">NAČÍTÁM PROJEKT…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-2">Projekt nenalezen</p>
          <Link href="/studio"><Button variant="outline">Zpět do Studia</Button></Link>
        </div>
      </div>
    );
  }

  const p = project as {
    title: string; status: string; shareToken?: string;
    finalVideoUrl?: string; estimatedCostUsd?: number; errorMessage?: string;
    completedScenes: number; totalScenes: number; progress: number;
    scenes: Array<{
      id: number; sceneIndex: number; title: string; description: string;
      sceneType: string; videoModel: string; status: string; videoUrl?: string;
      audioUrl?: string; duration: number; emotion: string;
    }>;
  };

  const completedScenes = p.completedScenes ?? 0;
  const totalScenes = p.totalScenes ?? 0;
  const progress = p.progress ?? 0;
  const isActive = ACTIVE_STATUSES.has(p.status);
  const statusCfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.processing;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 backdrop-blur-md bg-[#0a0f1a]/90">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/studio">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" />Studio
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white truncate max-w-[200px]">{p.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-slate-400 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-1" />Obnovit
              </Button>
            )}
            {p.status === "completed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                >
                  <Share2 className="w-3 h-3 mr-2" />SDÍLET
                </Button>
                {p.finalVideoUrl && (
                  <a href={p.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
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

          {/* Status Banner */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge className={`text-xs tracking-wider ${
                  p.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                  p.status === "failed"    ? "bg-red-500/20 text-red-300 border-red-500/30" :
                  "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}>
                  {isActive && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {p.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {p.status === "failed"    && <XCircle className="w-3 h-3 mr-1" />}
                  {statusCfg.label}
                </Badge>
                <span className="text-sm text-slate-400">
                  {completedScenes}/{totalScenes} scén dokončeno
                </span>
              </div>
              {p.estimatedCostUsd != null && (
                <span className="text-xs text-slate-500">
                  Odhadovaná cena:{" "}
                  <span className="text-yellow-400 font-bold">${p.estimatedCostUsd.toFixed(4)}</span>
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Final Video */}
          {p.status === "completed" && p.finalVideoUrl && (
            <Card className="mb-8 overflow-hidden border-blue-500/20 bg-slate-900/60">
              <div className="aspect-video bg-black">
                <video
                  src={p.finalVideoUrl}
                  controls
                  className="w-full h-full"
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-blue-300">{p.title}</h2>
                  {shareUrl && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />{shareUrl}
                    </a>
                  )}
                </div>
                <Button
                  onClick={handleShare}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs"
                >
                  <Share2 className="w-4 h-4 mr-2" />SDÍLET FILM
                </Button>
              </div>
            </Card>
          )}

          {/* Error */}
          {p.status === "failed" && p.errorMessage && (
            <Card className="mb-8 p-4 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Produkce selhala</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{p.errorMessage}</p>
            </Card>
          )}

          {/* Scene Pipeline */}
          <div>
            <h3 className="text-xs tracking-wider text-slate-500 uppercase mb-4 flex items-center gap-2">
              <Film className="w-3 h-3" />
              Pipeline scén
            </h3>
            <div className="space-y-3">
              {p.scenes.map((scene) => {
                const modelBadge = MODEL_BADGE[scene.videoModel] ?? {
                  label: scene.videoModel,
                  color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
                };
                const sceneStatus = STATUS_CONFIG[scene.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;

                return (
                  <Card
                    key={scene.id}
                    className={`p-4 bg-slate-900/60 border-slate-800/60 ${
                      scene.status === "generating" ? "border-blue-500/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status ikona */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sceneStatus.bg}`}>
                        {scene.status === "completed"  && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {scene.status === "failed"     && <XCircle className="w-4 h-4 text-red-400" />}
                        {scene.status === "generating" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {scene.status === "pending"    && <Clock className="w-4 h-4 text-slate-400" />}
                      </div>

                      {/* Obsah */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-slate-500">#{scene.sceneIndex + 1}</span>
                          <span className="text-sm font-medium text-white">{scene.title}</span>
                          <Badge className={`text-xs border ${modelBadge.color}`}>
                            {modelBadge.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                            {SCENE_TYPE_ICON[scene.sceneType]}
                            <span className="ml-1">{SCENE_TYPE_LABEL[scene.sceneType] ?? scene.sceneType}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{scene.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{scene.duration}s
                          </span>
                          <span className="capitalize text-slate-400">{scene.emotion}</span>
                          <span className={sceneStatus.color}>{sceneStatus.label}</span>
                          {scene.audioUrl && (
                            <span className="flex items-center gap-1 text-teal-400">
                              <Music className="w-3 h-3" />Hlas
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Video náhled */}
                      {scene.videoUrl && (
                        <div className="w-24 h-16 rounded overflow-hidden bg-black shrink-0">
                          <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Prázdný stav */}
              {p.scenes.length === 0 && isActive && (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
                  <p className="text-sm">Generuji scénář a připravuji scény…</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
