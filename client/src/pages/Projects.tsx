import React from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Film, Plus, Clock, CheckCircle2, XCircle, Loader2,
  Share2, Play, Eye, Clapperboard, Zap, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:                { label: "Čeká",           color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  generating_screenplay:{ label: "Scénář…",        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",      icon: Loader2 },
  generating_scenes:    { label: "Scény…",          color: "bg-blue-500/20 text-blue-400 border-blue-500/30",      icon: Loader2 },
  generating_audio:     { label: "Audio…",          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",icon: Loader2 },
  assembling:           { label: "Skládám…",        color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",      icon: Loader2 },
  completed:            { label: "Hotovo",          color: "bg-green-500/20 text-green-400 border-green-500/30",   icon: CheckCircle2 },
  failed:               { label: "Chyba",           color: "bg-red-500/20 text-red-400 border-red-500/30",         icon: XCircle },
};

function ProjectCard({ project }: { project: {
  id: number; title: string; status: string; genre?: string | null;
  emotionalTone?: string | null; targetDuration?: number | null;  estimatedCostUsd?: number | null;
  shareToken?: string | null;
  finalVideoUrl?: string | null;
  createdAt: Date;
}}) {
  const cfg = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const isGenerating = project.status === "generating";

  const { data: statusData } = trpc.video.status.useQuery(
    { id: project.id },
    { enabled: isGenerating, refetchInterval: isGenerating ? 5000 : false }
  );

  const progress = isGenerating ? (statusData?.progress ?? 0) : (project.status === "completed" ? 100 : 0);

  const copyShareLink = () => {
    if (!project.shareToken) return;
    const url = `${window.location.origin}/share/${project.shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Odkaz zkopírován do schránky!");
  };

  return (
    <div className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden">
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none" />

      {/* Video thumbnail / placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {project.finalVideoUrl ? (
          <video
            src={project.finalVideoUrl}
            className="w-full h-full object-cover"
            muted
            onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Clapperboard className="w-12 h-12 text-white/20 mx-auto mb-2" />
              {isGenerating && (
                <div className="px-4">
                  <Progress value={progress} className="h-1 bg-white/10" />
                  <p className="text-xs text-white/40 mt-1">{progress}% hotovo</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${cfg.color}`}>
            <Icon className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating && statusData ? `${statusData.completedScenes}/${statusData.totalScenes} scén` : cfg.label}
          </span>
        </div>

        {/* Play button overlay for completed */}
        {project.finalVideoUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <div className="w-14 h-14 rounded-full bg-cyan-500/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white/90 truncate mb-1 font-['Orbitron']">
          {project.title || "Generuji název…"}
        </h3>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
          {project.genre && <span className="capitalize">{project.genre}</span>}
          {project.targetDuration && <span>· {project.targetDuration}s</span>}
          {project.estimatedCostUsd && (
              <span className="ml-auto flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              ${Number(project.estimatedCostUsd).toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/project/${project.id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-xs">
              <Eye className="w-3 h-3 mr-1" /> Detail
            </Button>
          </Link>
          {project.shareToken && (
            <Button size="sm" variant="outline" onClick={copyShareLink}
              className="border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-xs">
              <Share2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="px-4 pb-3 flex items-center gap-1 text-xs text-white/25">
        <Calendar className="w-3 h-3" />
        {new Date(project.createdAt).toLocaleDateString("cs-CZ")}
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAuthenticated, loading } = useAuth();
  const { data: projects, isLoading } = trpc.video.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000, // Auto-refresh every 10s for generating projects
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white/80 mb-2">Přihlaste se pro přístup k projektům</h2>
          <a href={getLoginUrl()}>
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black">Přihlásit se</Button>
          </a>
        </div>
      </div>
    );
  }

  const GENERATING_STATUSES = ["generating_screenplay", "generating_scenes", "generating_audio", "assembling"];
  const generating = projects?.filter(p => GENERATING_STATUSES.includes(p.status)) ?? [];
  const completed  = projects?.filter(p => p.status === "completed")  ?? [];
  const failed     = projects?.filter(p => p.status === "failed")     ?? [];
  const pending    = projects?.filter(p => p.status === "draft")      ?? [];

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.02_240)]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">← Zpět</Link>
            <span className="text-white/20">|</span>
            <h1 className="text-lg font-bold text-white/90 font-['Orbitron'] tracking-wider">
              MOJE PROJEKTY
            </h1>
            {projects && (
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                {projects.length} celkem
              </Badge>
            )}
          </div>
          <Link href="/studio">
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Nové video
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!projects || projects.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Film className="w-12 h-12 text-cyan-400/60" />
            </div>
            <h2 className="text-2xl font-bold text-white/70 mb-3 font-['Orbitron']">Zatím žádné projekty</h2>
            <p className="text-white/40 mb-8 max-w-md mx-auto">
              Vytvořte své první Hollywood-grade AI video. Stačí zadat nápad a AI se postará o zbytek.
            </p>
            <Link href="/studio">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 text-lg">
                <Plus className="w-5 h-5 mr-2" /> Vytvořit první video
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Generating section */}
            {generating.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Právě se generuje ({generating.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {generating.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </section>
            )}

            {/* Completed section */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Hotová videa ({completed.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {completed.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </section>
            )}

            {/* Pending section */}
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Ve frontě ({pending.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pending.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </section>
            )}

            {/* Failed section */}
            {failed.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Chyba ({failed.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {failed.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
