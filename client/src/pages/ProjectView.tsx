import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useParams } from "wouter";
import {
  Film, ChevronLeft, Share2, Download, Loader2,
  CheckCircle2, XCircle, Clock, Music, Mic, Video,
  Cpu, Star, Zap, RefreshCw, ExternalLink, Clapperboard
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:               { label: "Čeká",             color: "text-slate-400",  bg: "bg-slate-500/10" },
  draft:                 { label: "Návrh",             color: "text-slate-400",  bg: "bg-slate-500/10" },
  generating_screenplay: { label: "Scénář",            color: "text-blue-400",   bg: "bg-blue-500/10" },
  generating_scenes:     { label: "Scény",             color: "text-purple-400", bg: "bg-purple-500/10" },
  generating_audio:      { label: "Audio",             color: "text-green-400",  bg: "bg-green-500/10" },
  assembling:            { label: "Střih",             color: "text-yellow-400", bg: "bg-yellow-500/10" },
  processing:            { label: "Zpracovávám",       color: "text-blue-400",   bg: "bg-blue-500/10" },
  completed:             { label: "Hotovo",            color: "text-green-400",  bg: "bg-green-500/10" },
  failed:                { label: "Chyba",             color: "text-red-400",    bg: "bg-red-500/10" },
};

const SCENE_STATUS_LABELS: Record<string, string> = {
  pending:    "Čeká",
  generating: "Generuji...",
  completed:  "Hotovo",
  failed:     "Chyba",
};

const MODEL_BADGE: Record<string, { label: string; color: string }> = {
  "kling-v3-omni":       { label: "Kling 3.0 Omni",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "kling-v3-motion":     { label: "Kling Motion",     color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "hailuo-minimax-2.3":  { label: "Hailuo 2.3",       color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  "wan-2.2-t2v":         { label: "WAN 2.2",          color: "bg-green-500/20 text-green-300 border-green-500/30" },
  "wan-2.2-s2v":         { label: "WAN S2V",          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

const SCENE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  dialogue:   { label: "Dialog",     icon: <Mic className="w-3 h-3" /> },
  broll:      { label: "B-Roll",     icon: <Film className="w-3 h-3" /> },
  action:     { label: "Akce",       icon: <Zap className="w-3 h-3" /> },
  lipsync:    { label: "Lip Sync",   icon: <Cpu className="w-3 h-3" /> },
  dream:      { label: "Sen",        icon: <Star className="w-3 h-3" /> },
  transition: { label: "Přechod",    icon: <Video className="w-3 h-3" /> },
  music:      { label: "Hudba",      icon: <Music className="w-3 h-3" /> },
};

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
        if (!d) return 3000;
        const activeStatuses = ["processing", "pending", "generating_screenplay", "generating_scenes", "generating_audio", "assembling"];
        return activeStatuses.includes(d.status ?? "") ? 3000 : false;
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
        <div className="text-center space-y-4">
          <Film className="w-12 h-12 text-blue-400 mx-auto" />
          <p className="text-slate-400">Přihlas se pro zobrazení projektu</p>
          <Link href="/"><Button variant="outline">Domů</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Načítám projekt...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-white font-medium">Projekt nenalezen</p>
          <Link href="/studio"><Button variant="outline">Zpět do Studia</Button></Link>
        </div>
      </div>
    );
  }

  const p = project as {
    title: string; status: string; shareToken?: string;
    finalVideoUrl?: string; totalCostUsd?: number; errorMessage?: string;
    completedScenes: number; totalScenes: number; progress: number;
    scenes: Array<{
      id: number; sceneIndex: number; title: string; description: string;
      sceneType: string; videoModel: string; status: string; videoUrl?: string;
      duration: number; emotion: string;
    }>;
  };

  const completedScenes = p.completedScenes ?? 0;
  const totalScenes = p.totalScenes ?? 0;
  const progress = p.progress ?? 0;
  const activeStatuses = ["processing", "pending", "generating_screenplay", "generating_scenes", "generating_audio", "assembling"];
  const isProcessing = activeStatuses.includes(p.status);
  const statusCfg = STATUS_LABELS[p.status] ?? STATUS_LABELS.pending;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Hlavička */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 backdrop-blur-md bg-[#0a0f1a]/80">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/projects">
              <button className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Moje projekty
              </button>
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium truncate max-w-[200px]">{p.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <button onClick={() => refetch()} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {p.status === "completed" && (
              <>
                <Button variant="outline" size="sm" onClick={handleShare}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs">
                  <Share2 className="w-3 h-3 mr-1" /> Sdílet
                </Button>
                {p.finalVideoUrl && (
                  <a href={p.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                      <Download className="w-3 h-3 mr-1" /> Stáhnout
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Status banner */}
          <div className="mb-8 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge className={`text-xs font-medium ${statusCfg.bg} ${statusCfg.color} border-0`}>
                  {isProcessing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {p.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {p.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                  {statusCfg.label}
                </Badge>
                <span className="text-sm text-slate-400">
                  {completedScenes} / {totalScenes} scén dokončeno
                </span>
              </div>
              {p.totalCostUsd != null && (
                <span className="text-xs text-slate-500">
                  Cena: <span className="text-yellow-400 font-medium">${p.totalCostUsd.toFixed(4)}</span>
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            {isProcessing && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Automaticky se aktualizuje každé 3 sekundy...
              </p>
            )}
          </div>

          {/* Hotové video */}
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
                  <h2 className="text-lg font-bold text-white">{p.title}</h2>
                  {shareUrl && (
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" />{shareUrl}
                    </a>
                  )}
                </div>
                <Button onClick={handleShare} className="bg-blue-600 hover:bg-blue-500 text-white text-sm">
                  <Share2 className="w-4 h-4 mr-2" /> Sdílet film
                </Button>
              </div>
            </Card>
          )}

          {/* Chybová zpráva */}
          {p.status === "failed" && p.errorMessage && (
            <Card className="mb-8 p-4 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Produkce selhala</span>
              </div>
              <p className="text-xs text-slate-400">{p.errorMessage}</p>
              <Link href="/studio">
                <Button size="sm" variant="outline" className="mt-3 border-slate-600 text-slate-300">
                  Zkusit znovu ve Studiu
                </Button>
              </Link>
            </Card>
          )}

          {/* Pipeline scén */}
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
              Pipeline scén
            </h3>
            <div className="space-y-3">
              {p.scenes.map((scene) => {
                const modelBadge = MODEL_BADGE[scene.videoModel] ?? { label: scene.videoModel, color: "bg-slate-700 text-slate-300 border-slate-600" };
                const sceneType = SCENE_TYPE_LABELS[scene.sceneType] ?? { label: scene.sceneType, icon: <Film className="w-3 h-3" /> };
                const sceneStatusLabel = SCENE_STATUS_LABELS[scene.status] ?? scene.status;
                return (
                  <Card key={scene.id} className={`p-4 border-slate-700/40 bg-slate-800/30 ${scene.status === "generating" ? "border-blue-500/30" : ""}`}>
                    <div className="flex items-start gap-4">
                      {/* Status ikona */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        scene.status === "completed" ? "bg-green-500/20" :
                        scene.status === "failed" ? "bg-red-500/20" :
                        scene.status === "generating" ? "bg-blue-500/20" :
                        "bg-slate-700/50"
                      }`}>
                        {scene.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {scene.status === "failed" && <XCircle className="w-4 h-4 text-red-400" />}
                        {scene.status === "generating" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {scene.status === "pending" && <Clock className="w-4 h-4 text-slate-500" />}
                      </div>
                      {/* Obsah */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-slate-500">#{scene.sceneIndex + 1}</span>
                          <span className="text-sm font-medium text-white">{scene.title}</span>
                          <Badge className={`text-xs border ${modelBadge.color}`}>{modelBadge.label}</Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400 flex items-center gap-1">
                            {sceneType.icon}
                            <span>{sceneType.label}</span>
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{scene.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{scene.duration}s</span>
                          <span className="capitalize text-slate-400">{scene.emotion}</span>
                          <span className={
                            scene.status === "completed" ? "text-green-400" :
                            scene.status === "failed" ? "text-red-400" :
                            scene.status === "generating" ? "text-blue-400" :
                            "text-slate-500"
                          }>{sceneStatusLabel}</span>
                        </div>
                      </div>
                      {/* Video náhled */}
                      {scene.videoUrl && (
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-700/50">
                          <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
