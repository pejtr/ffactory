import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import {
  Film, Wand2, ChevronLeft, Zap, Clock, DollarSign,
  Play, Eye, Share2, Loader2, CheckCircle2, XCircle,
  Music, Mic, Video, Cpu, Star, Users
} from "lucide-react";
import { getLoginUrl } from "@/const";

const GENRES = [
  "Sci-Fi Drama", "Action Thriller", "Fantasy Epic", "Horror", "Romance",
  "Documentary Style", "Comedy", "Mystery", "Adventure", "Cyberpunk"
];

const EMOTIONS = [
  "Epic & Triumphant", "Dark & Mysterious", "Hopeful & Inspiring",
  "Tense & Suspenseful", "Romantic & Emotional", "Melancholic & Reflective",
  "Energetic & Exciting", "Peaceful & Serene"
];

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

export default function Studio() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Sci-Fi Drama");
  const [emotion, setEmotion] = useState("Epic & Triumphant");
  const [dreamMode, setDreamMode] = useState(false);
  const [duration, setDuration] = useState([60]);
  const [previewData, setPreviewData] = useState<{
    screenplay: {
      title: string;
      logline: string;
      bgmStyle: string;
      emotionalArc: string;
      characters: Array<{ name: string; description: string }>;
      scenes: Array<{
        index: number;
        title: string;
        description: string;
        sceneType: string;
        videoModel: string;
        emotion: string;
        duration: number;
        location?: string;
        dialogue?: string;
      }>;
    };
    estimatedCostUsd: number;
  } | null>(null);

  const previewMutation = trpc.video.preview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      toast.success("Screenplay generated! Review and create your video.");
    },
    onError: (e) => toast.error(`Preview failed: ${e.message}`),
  });

  const createMutation = trpc.video.create.useMutation({
    onSuccess: (data) => {
      toast.success("Video production started!");
      navigate(`/project/${data.projectId}`);
    },
    onError: (e) => toast.error(`Creation failed: ${e.message}`),
  });

  const handlePreview = () => {
    if (!idea.trim()) { toast.error("Please enter your video idea"); return; }
    previewMutation.mutate({ idea, genre, emotionalTone: emotion, dreamMode, targetDuration: duration[0] });
  };

  const handleCreate = () => {
    if (!previewData) { handlePreview(); return; }
    createMutation.mutate({ idea, genre, emotionalTone: emotion, dreamMode, targetDuration: duration[0] });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Film className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display text-xl text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Sign in to access the Video Factory Studio</p>
          <a href={getLoginUrl()}><Button className="glow-blue font-display tracking-wider">SIGN IN</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="ghost" size="sm" className="text-muted-foreground"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button></Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <span className="font-display text-sm text-primary">STUDIO</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/characters"><Button variant="outline" size="sm" className="border-border/60 text-xs font-display tracking-wide"><Users className="w-3 h-3 mr-2" />CHARACTERS</Button></Link>
            <Link href="/studio"><Button variant="ghost" size="sm" className="text-muted-foreground text-xs">My Projects</Button></Link>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-16">
        <div className="container max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* ── Left: Input Form ── */}
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  CREATE YOUR <span className="text-primary text-glow">FILM</span>
                </h1>
                <p className="text-sm text-muted-foreground">Describe your idea and let AI build the entire production pipeline</p>
              </div>

              <Card className="p-5 bg-card/60 border-border/50">
                <div className="space-y-5">
                  <div>
                    <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2 block">
                      Your Video Idea *
                    </Label>
                    <Textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="e.g. SG-1 team discovers a Destiny-class ship hidden beneath Atlantis. Carter and McKay must activate its long-range travel system before the Wraith arrive..."
                      className="min-h-[120px] bg-background/50 border-border/60 text-sm resize-none focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{idea.length}/2000 characters</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2 block">Genre</Label>
                      <Select value={genre} onValueChange={setGenre}>
                        <SelectTrigger className="bg-background/50 border-border/60 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2 block">Emotional Tone</Label>
                      <Select value={emotion} onValueChange={setEmotion}>
                        <SelectTrigger className="bg-background/50 border-border/60 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2 block">
                      Duration: <span className="text-primary">{duration[0]}s</span> ({Math.round(duration[0] / 60 * 10) / 10} min)
                    </Label>
                    <Slider
                      value={duration}
                      onValueChange={setDuration}
                      min={15} max={300} step={15}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>15s</span><span>1 min</span><span>2 min</span><span>5 min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/40">
                    <div>
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent" />
                        Dream Mode
                      </div>
                      <div className="text-xs text-muted-foreground">Include surreal/dream sequences with WAN 2.2</div>
                    </div>
                    <Switch checked={dreamMode} onCheckedChange={setDreamMode} />
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={previewMutation.isPending || !idea.trim()}
                  variant="outline"
                  className="flex-1 border-primary/40 text-primary hover:bg-primary/10 font-display text-xs tracking-wider"
                >
                  {previewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                  PREVIEW SCREENPLAY
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !idea.trim()}
                  className="flex-1 glow-blue font-display text-xs tracking-wider"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  {previewData ? "CREATE VIDEO" : "GENERATE & CREATE"}
                </Button>
              </div>

              {/* Cost estimate */}
              {previewData && (
                <Card className="p-4 bg-card/40 border-border/40">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>Estimated cost</span>
                    </div>
                    <span className="font-bold text-primary font-display">
                      ~${previewData.estimatedCostUsd.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Scenes</span>
                    </div>
                    <span className="text-foreground">{previewData.screenplay.scenes.length} scenes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Music className="w-4 h-4" />
                      <span>BGM Style</span>
                    </div>
                    <span className="text-foreground text-xs">{previewData.screenplay.bgmStyle}</span>
                  </div>
                </Card>
              )}
            </div>

            {/* ── Right: Screenplay Preview ── */}
            <div className="space-y-4">
              {previewMutation.isPending ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm text-muted-foreground font-display tracking-wider">GENERATING SCREENPLAY...</p>
                  <p className="text-xs text-muted-foreground">Gemini AI is crafting your Hollywood script</p>
                </div>
              ) : previewData ? (
                <>
                  <div>
                    <h2 className="font-display text-xl font-bold text-primary text-glow">
                      {previewData.screenplay.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 italic">{previewData.screenplay.logline}</p>
                    <p className="text-xs text-accent mt-2">{previewData.screenplay.emotionalArc}</p>
                  </div>

                  {previewData.screenplay.characters.length > 0 && (
                    <div>
                      <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-2">Characters</p>
                      <div className="flex flex-wrap gap-2">
                        {previewData.screenplay.characters.map((c) => (
                          <Badge key={c.name} variant="outline" className="border-border/60 text-xs">
                            <Users className="w-3 h-3 mr-1" />{c.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-3">Scene Breakdown</p>
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {previewData.screenplay.scenes.map((scene) => {
                        const modelBadge = MODEL_BADGE[scene.videoModel] ?? { label: scene.videoModel, color: "bg-muted text-muted-foreground border-border" };
                        return (
                          <div key={scene.index} className="video-card rounded-lg p-3 bg-card/50 border border-border/40">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-display">#{scene.index + 1}</span>
                                <span className="text-sm font-medium text-foreground">{scene.title}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge className={`text-xs border ${modelBadge.color}`}>{modelBadge.label}</Badge>
                                <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                                  {SCENE_TYPE_ICON[scene.sceneType]}
                                  <span className="ml-1">{scene.sceneType}</span>
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{scene.description}</p>
                            {scene.dialogue && (
                              <p className="text-xs text-accent/80 mt-1 italic">"{scene.dialogue.substring(0, 80)}..."</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{scene.duration}s</span>
                              <span>{scene.location}</span>
                              <span className="capitalize text-accent/70">{scene.emotion}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4 border border-dashed border-border/40 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Film className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Enter your idea and click</p>
                    <p className="text-sm font-display text-primary">PREVIEW SCREENPLAY</p>
                    <p className="text-xs text-muted-foreground mt-1">to see the AI-generated scene breakdown</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
