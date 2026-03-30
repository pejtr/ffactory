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
  Cpu, Star, Zap, RefreshCw, ExternalLink
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted/20" },
  generating: { label: "Generating", color: "text-blue-400", bg: "bg-blue-500/10" },
  completed: { label: "Done", color: "text-green-400", bg: "bg-green-500/10" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/10" },
};

const MODEL_BADGE: Record<string, { label: string; color: string }> = {
  "kling-v3-omni": { label: "Kling 3.0", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  "kling-v3-motion": { label: "Kling Motion", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  "hailuo-minimax-2.3": { label: "Hailuo 2.3", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  "wan-2.2-t2v": { label: "WAN 2.2", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  "wan-2.2-s2v": { label: "WAN S2V", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

const SCENE_TYPE_ICON: Record<string, React.ReactNode> = {
  dialogue: <Mic className="w-3 h-3" />,
  broll: <Film className="w-3 h-3" />,
  action: <Zap className="w-3 h-3" />,
  lipsync: <Cpu className="w-3 h-3" />,
  dream: <Star className="w-3 h-3" />,
  transition: <Video className="w-3 h-3" />,
};

export default function ProjectView() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0");
  const { isAuthenticated } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { data: project, isLoading, refetch } = trpc.video.status.useQuery(
    { id: projectId },
    { enabled: !!projectId && isAuthenticated, refetchInterval: (query) => {
      const d = query.state.data as { status?: string } | undefined;
      if (!d) return 3000;
      return d.status === "processing" || d.status === "pending" ? 3000 : false;
    }}
  );

  const shareMutation = trpc.video.create.useMutation({
    onSuccess: () => {},
    onError: (err: { message: string }) => toast.error(`Share failed: ${err.message}`),
  });

  const handleShare = () => {
    const token = (project as { shareToken?: string } | null | undefined)?.shareToken;
    const url = token ? `${window.location.origin}/share/${token}` : window.location.href;
    setShareUrl(url);
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Share link copied!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Film className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to view this project</p>
          <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display tracking-wider text-sm">LOADING PROJECT...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground mb-2">Project not found</p>
          <Link href="/studio"><Button variant="outline">Back to Studio</Button></Link>
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

  const isProcessing = p.status === "processing" || p.status === "pending";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/studio"><Button variant="ghost" size="sm" className="text-muted-foreground"><ChevronLeft className="w-4 h-4 mr-1" />Studio</Button></Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <span className="font-display text-sm text-foreground truncate max-w-[200px]">{p.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground">
                <RefreshCw className="w-4 h-4 mr-1" />Refresh
              </Button>
            )}
            {p.status === "completed" && (
              <>
                <Button variant="outline" size="sm" onClick={handleShare} disabled={shareMutation.isPending} className="border-border/60 text-xs font-display tracking-wide">
                  <Share2 className="w-3 h-3 mr-2" />SHARE
                </Button>
                {p.finalVideoUrl && (
                  <a href={p.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="glow-blue font-display text-xs tracking-wider">
                      <Download className="w-3 h-3 mr-2" />DOWNLOAD
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
                <Badge className={`font-display text-xs tracking-wider ${
                  p.status === "completed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                  p.status === "failed" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                  "bg-blue-500/20 text-blue-300 border-blue-500/30 pulse-active"
                }`}>
                  {isProcessing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {p.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {p.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                  {p.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {completedScenes}/{totalScenes} scenes complete
                </span>
              </div>
              {p.totalCostUsd != null && (
                <span className="text-xs text-muted-foreground">
                  Cost: <span className="text-primary font-display">${p.totalCostUsd.toFixed(4)}</span>
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2 progress-glow" />
          </div>

          {/* Final Video */}
          {p.status === "completed" && p.finalVideoUrl && (
            <Card className="mb-8 overflow-hidden border-primary/20 glow-blue">
              <div className="aspect-video bg-black">
                <video
                  src={p.finalVideoUrl}
                  controls
                  className="w-full h-full"
                  poster=""
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-primary">{p.title}</h2>
                  {shareUrl && (
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" />{shareUrl}
                    </a>
                  )}
                </div>
                <Button onClick={handleShare} disabled={shareMutation.isPending} className="glow-teal font-display text-xs tracking-wider">
                  <Share2 className="w-4 h-4 mr-2" />SHARE FILM
                </Button>
              </div>
            </Card>
          )}

          {p.status === "failed" && p.errorMessage && (
            <Card className="mb-8 p-4 border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Production Failed</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.errorMessage}</p>
            </Card>
          )}

          {/* Scenes Grid */}
          <div>
            <h3 className="font-display text-sm tracking-wider text-muted-foreground uppercase mb-4">Scene Pipeline</h3>
            <div className="space-y-3">
              {p.scenes.map((scene) => {
                const modelBadge = MODEL_BADGE[scene.videoModel] ?? { label: scene.videoModel, color: "bg-muted text-muted-foreground border-border" };
                const statusCfg = STATUS_CONFIG[scene.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                return (
                  <Card key={scene.id} className={`p-4 border-border/40 ${scene.status === "generating" ? "border-primary/30 pulse-active" : ""}`}>
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusCfg.bg}`}>
                        {scene.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {scene.status === "failed" && <XCircle className="w-4 h-4 text-red-400" />}
                        {scene.status === "generating" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {scene.status === "pending" && <Clock className="w-4 h-4 text-muted-foreground" />}
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
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{scene.duration}s</span>
                          <span className="capitalize text-accent/70">{scene.emotion}</span>
                          <span className={statusCfg.color}>{statusCfg.label}</span>
                        </div>
                      </div>
                      {/* Video Preview */}
                      {scene.videoUrl && (
                        <div className="w-24 h-16 rounded overflow-hidden bg-black shrink-0">
                          <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Audio Tracks */}

        </div>
      </div>
    </div>
  );
}
