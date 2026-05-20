import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Film, Upload, Zap, Star, ChevronRight, Play, Copy, Download,
  Loader2, CheckCircle, AlertCircle, ArrowLeft, Plus, Trash2, Eye
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShotScriptItem {
  time: string;
  shot: string;
  camera?: string;
  action: string;
  visual_details?: string;
}

interface SeedancePrompt {
  model: string;
  mode: string;
  aspect_ratio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  duration_seconds: number;
  reference_usage?: Record<string, string>;
  master_prompt: string;
  shot_script?: ShotScriptItem[];
  style?: {
    look?: string;
    lighting?: string;
    color_palette?: string;
    motion?: string;
    tone?: string;
  };
  negative_prompt?: string;
  continuity_rules?: string[];
}

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({ tpl, onSelect }: { tpl: any; onSelect: (t: any) => void }) {
  return (
    <Card className="border border-cyan-500/20 bg-slate-900/60 hover:border-cyan-400/50 transition-all cursor-pointer group"
      onClick={() => onSelect(tpl)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
            {tpl.title}
          </CardTitle>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs shrink-0">
            <Star className="w-3 h-3 mr-1" />
            {tpl.viralScore}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-400 leading-relaxed">
          {tpl.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-3">
          {(tpl.tags as string).split(",").slice(0, 4).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-400 px-1.5 py-0">
              {tag.trim()}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{tpl.aspectRatio} · {tpl.durationSeconds}s</span>
          <span className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300">
            Use template <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Shot Script Editor ───────────────────────────────────────────────────────
function ShotScriptEditor({ shots, onChange }: {
  shots: ShotScriptItem[];
  onChange: (shots: ShotScriptItem[]) => void;
}) {
  const addShot = () => onChange([...shots, { time: "", shot: "", camera: "", action: "", visual_details: "" }]);
  const removeShot = (i: number) => onChange(shots.filter((_, idx) => idx !== i));
  const updateShot = (i: number, field: keyof ShotScriptItem, value: string) => {
    const updated = shots.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {shots.map((shot, i) => (
        <div key={i} className="border border-slate-700 rounded-lg p-3 bg-slate-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400">Shot {i + 1}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
              onClick={() => removeShot(i)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-slate-400">Time</Label>
              <Input value={shot.time} onChange={e => updateShot(i, "time", e.target.value)}
                placeholder="00:00-00:03" className="h-7 text-xs bg-slate-900 border-slate-600" />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Shot name</Label>
              <Input value={shot.shot} onChange={e => updateShot(i, "shot", e.target.value)}
                placeholder="Opening wide" className="h-7 text-xs bg-slate-900 border-slate-600" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Camera</Label>
            <Input value={shot.camera ?? ""} onChange={e => updateShot(i, "camera", e.target.value)}
              placeholder="handheld close-up, slight wobble" className="h-7 text-xs bg-slate-900 border-slate-600" />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Action</Label>
            <Textarea value={shot.action} onChange={e => updateShot(i, "action", e.target.value)}
              placeholder="Describe what happens in this shot..." rows={2}
              className="text-xs bg-slate-900 border-slate-600 resize-none" />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Visual details</Label>
            <Input value={shot.visual_details ?? ""} onChange={e => updateShot(i, "visual_details", e.target.value)}
              placeholder="Colors, textures, atmosphere..." className="h-7 text-xs bg-slate-900 border-slate-600" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addShot}
        className="w-full border-dashed border-slate-600 text-slate-400 hover:text-cyan-300 hover:border-cyan-500">
        <Plus className="w-3 h-3 mr-1" /> Add Shot
      </Button>
    </div>
  );
}

// ─── Project Status Card ──────────────────────────────────────────────────────
function ProjectStatusCard({ projectId }: { projectId: number }) {
  const [shouldPoll, setShouldPoll] = useState(true);
  const { data: status, isLoading } = trpc.refRecreation.pollStatus.useQuery(
    { projectId },
    { refetchInterval: shouldPoll ? 5000 : false }
  );
  // Stop polling once terminal state is reached
  if (status && (status.status === "completed" || status.status === "failed") && shouldPoll) {
    setShouldPoll(false);
  }

  if (isLoading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Checking status...
    </div>
  );

  if (!status) return null;

  const isGenerating = status.status === "generating_scenes";
  const isCompleted = status.status === "completed";
  const isFailed = status.status === "failed";

  return (
    <Card className={`border ${isCompleted ? "border-green-500/40 bg-green-950/20" : isFailed ? "border-red-500/40 bg-red-950/20" : "border-cyan-500/30 bg-slate-900/60"}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {isGenerating && <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
          {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
          {isFailed && <AlertCircle className="w-5 h-5 text-red-400" />}
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {isGenerating ? "Generating with Seedance 2.0..." : isCompleted ? "Video ready!" : "Generation failed"}
            </p>
            {isFailed && status.errorMessage && (
              <p className="text-xs text-red-400 mt-0.5">{status.errorMessage}</p>
            )}
          </div>
        </div>
        {isCompleted && status.finalVideoUrl && (
          <div className="mt-3 space-y-2">
            <video src={status.finalVideoUrl} controls className="w-full rounded-lg max-h-64 bg-black" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 border-green-500/40 text-green-300 hover:bg-green-950/40"
                onClick={() => window.open(status.finalVideoUrl!, "_blank")}>
                <Download className="w-3 h-3 mr-1" /> Download
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-slate-600 text-slate-300"
                onClick={() => navigator.clipboard.writeText(status.finalVideoUrl!)}>
                <Copy className="w-3 h-3 mr-1" /> Copy URL
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReferenceRecreation() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Templates
  const { data: templates, isLoading: templatesLoading } = trpc.scriptTemplates.templates.getBuiltInRefRec.useQuery();

  // Active project state
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("templates");

  // Prompt editor state
  const [projectTitle, setProjectTitle] = useState("My Reference Recreation");
  const [prompt, setPrompt] = useState<SeedancePrompt>({
    model: "seedance_2_0_non_fast",
    mode: "video_reference_recreation",
    aspect_ratio: "9:16",
    duration_seconds: 10,
    master_prompt: "",
    shot_script: [],
    style: { look: "", lighting: "", color_palette: "", motion: "", tone: "" },
    negative_prompt: "",
    continuity_rules: [],
  });
  const [referenceVideoUrl, setReferenceVideoUrl] = useState("");
  const [useRefVideo, setUseRefVideo] = useState(false);
  const [continuityRulesText, setContinuityRulesText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // tRPC mutations
  const createProject = trpc.refRecreation.createProject.useMutation();
  const generateMutation = trpc.refRecreation.generate.useMutation();
  const uploadRefVideo = trpc.refRecreation.uploadReferenceVideo.useMutation();

  // Load template into editor
  const handleSelectTemplate = useCallback((tpl: any) => {
    setProjectTitle(tpl.title);
    const p = tpl.prompt as SeedancePrompt;
    setPrompt(p);
    setContinuityRulesText((p.continuity_rules ?? []).join("\n"));
    setActiveTab("editor");
      toast.success(`Template loaded: ${tpl.title}`, { description: "Customize the prompt and generate." });
  }, [toast]);

  // Handle reference video upload
  const handleVideoUpload = useCallback(async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 50MB for reference videos." });
      return;
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadRefVideo.mutateAsync({
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type || "video/mp4",
        });
        setReferenceVideoUrl(result.url);
        setUseRefVideo(true);
        toast.success("Reference video uploaded", { description: "Ready to use for recreation." });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Upload failed", { description: String(err) });
      setIsUploading(false);
    }
  }, [uploadRefVideo, toast]);

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!prompt.master_prompt.trim()) {
      toast.error("Master prompt required", { description: "Describe what you want to generate." });
      return;
    }
    setIsGenerating(true);
    try {
      const finalPrompt: SeedancePrompt = {
        ...prompt,
        continuity_rules: continuityRulesText.split("\n").filter(l => l.trim()),
      };

      const { id } = await createProject.mutateAsync({
        title: projectTitle,
        seedancePrompt: finalPrompt,
        referenceVideoUrl: referenceVideoUrl || undefined,
      });

      await generateMutation.mutateAsync({ projectId: id, useReferenceVideo: useRefVideo && !!referenceVideoUrl });
      setActiveProjectId(id);
      setActiveTab("status");
      toast.success("Generation started!", { description: "Seedance 2.0 is creating your video. This takes 2-5 minutes." });
    } catch (err) {
      toast.error("Generation failed", { description: String(err) });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, projectTitle, referenceVideoUrl, useRefVideo, continuityRulesText, createProject, generateMutation, toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="border-slate-700 bg-slate-900 p-8 text-center max-w-sm">
          <Film className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
          <p className="text-slate-400 text-sm mb-4">Create an account to use Reference Recreation.</p>
          <Link href="/"><Button className="bg-cyan-600 hover:bg-cyan-500">Go to Home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Reference Recreation</h1>
              <p className="text-xs text-slate-400">Seedance 2.0 · Viral Video Generator</p>
            </div>
          </div>
          <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Zap className="w-3 h-3 mr-1" /> 30 credits / generation
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700 mb-6">
            <TabsTrigger value="templates" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Star className="w-3 h-3 mr-1.5" /> Templates
            </TabsTrigger>
            <TabsTrigger value="editor" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Film className="w-3 h-3 mr-1.5" /> Prompt Editor
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              disabled={!activeProjectId}>
              <Play className="w-3 h-3 mr-1.5" /> Generation Status
            </TabsTrigger>
          </TabsList>

          {/* ── Templates Tab ── */}
          <TabsContent value="templates">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Viral Reference Recreation Templates</h2>
              <p className="text-sm text-slate-400">
                Pre-engineered prompts optimized for Seedance 2.0. Select one to load into the editor, then customize and generate.
              </p>
            </div>
            {templatesLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading templates...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(templates ?? []).map((tpl: any) => (
                  <TemplateCard key={tpl.id} tpl={tpl} onSelect={handleSelectTemplate} />
                ))}
              </div>
            )}

            {/* How it works */}
            <div className="mt-8 border border-slate-700 rounded-xl p-6 bg-slate-900/40">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> How Reference Recreation Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: "1", title: "Choose Template", desc: "Pick a viral template or start from scratch in the editor." },
                  { step: "2", title: "Upload Reference", desc: "Optionally upload a reference video for pacing and camera style." },
                  { step: "3", title: "Customize Prompt", desc: "Edit the master prompt, shot script, style, and continuity rules." },
                  { step: "4", title: "Generate", desc: "Seedance 2.0 creates your video in 2-5 minutes. Download and share." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="text-center">
                    <div className="w-8 h-8 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xs font-bold text-cyan-300">{step}</span>
                    </div>
                    <p className="text-xs font-semibold text-white mb-1">{title}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Editor Tab ── */}
          <TabsContent value="editor">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Main prompt */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Project Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-400">Project title</Label>
                      <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">Aspect ratio</Label>
                        <Select value={prompt.aspect_ratio}
                          onValueChange={v => setPrompt(p => ({ ...p, aspect_ratio: v as SeedancePrompt["aspect_ratio"] }))}>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["9:16", "16:9", "1:1", "4:3", "3:4"].map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Duration (seconds)</Label>
                        <Select value={String(prompt.duration_seconds)}
                          onValueChange={v => setPrompt(p => ({ ...p, duration_seconds: Number(v) }))}>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5s</SelectItem>
                            <SelectItem value="10">10s</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Master Prompt</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      The main description of your video. Be specific about characters, actions, settings, and mood.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={prompt.master_prompt}
                      onChange={e => setPrompt(p => ({ ...p, master_prompt: e.target.value }))}
                      placeholder="Describe your video in detail. Include character appearance, actions, setting, camera style, and mood..."
                      rows={6}
                      className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">{prompt.master_prompt.length} chars</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Shot Script</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Break down your video into individual shots for precise control.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShotScriptEditor
                      shots={prompt.shot_script ?? []}
                      onChange={shots => setPrompt(p => ({ ...p, shot_script: shots }))}
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Negative Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={prompt.negative_prompt ?? ""}
                      onChange={e => setPrompt(p => ({ ...p, negative_prompt: e.target.value }))}
                      placeholder="avoid warped hands, avoid face drift, avoid text artifacts..."
                      rows={3}
                      className="bg-slate-800 border-slate-600 text-white text-sm resize-none"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right: Style, reference, continuity */}
              <div className="space-y-4">
                {/* Reference Video */}
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-cyan-400" /> Reference Video
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Upload a video to borrow its pacing and camera style.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
                    />
                    {referenceVideoUrl ? (
                      <div className="space-y-2">
                        <video src={referenceVideoUrl} className="w-full rounded-lg max-h-32 bg-black" controls />
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="useRef" checked={useRefVideo}
                            onChange={e => setUseRefVideo(e.target.checked)}
                            className="accent-cyan-500" />
                          <Label htmlFor="useRef" className="text-xs text-slate-300 cursor-pointer">
                            Use for pacing & camera style
                          </Label>
                        </div>
                        <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-400"
                          onClick={() => { setReferenceVideoUrl(""); setUseRefVideo(false); }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm"
                        className="w-full border-dashed border-slate-600 text-slate-400 hover:text-cyan-300 hover:border-cyan-500"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}>
                        {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                        {isUploading ? "Uploading..." : "Upload reference video"}
                      </Button>
                    )}
                    <p className="text-xs text-slate-500">Max 50MB · MP4, MOV, WebM</p>
                  </CardContent>
                </Card>

                {/* Style */}
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Style Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(["look", "lighting", "color_palette", "motion", "tone"] as const).map(field => (
                      <div key={field}>
                        <Label className="text-xs text-slate-400 capitalize">{field.replace("_", " ")}</Label>
                        <Input
                          value={(prompt.style as any)?.[field] ?? ""}
                          onChange={e => setPrompt(p => ({ ...p, style: { ...p.style, [field]: e.target.value } }))}
                          placeholder={field === "look" ? "hyper-realistic broadcast" : field === "lighting" ? "stadium floodlights" : ""}
                          className="h-7 text-xs bg-slate-800 border-slate-600 text-white"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Continuity Rules */}
                <Card className="border-slate-700 bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-white">Continuity Rules</CardTitle>
                    <CardDescription className="text-xs text-slate-400">One rule per line.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={continuityRulesText}
                      onChange={e => setContinuityRulesText(e.target.value)}
                      placeholder={"Same character throughout.\nKey prop must appear in final frame."}
                      rows={4}
                      className="bg-slate-800 border-slate-600 text-white text-xs resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-3"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.master_prompt.trim()}>
                  {isGenerating
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting generation...</>
                    : <><Zap className="w-4 h-4 mr-2" /> Generate with Seedance 2.0</>
                  }
                </Button>
                <p className="text-xs text-center text-slate-500">30 credits · 2-5 minutes</p>
              </div>
            </div>
          </TabsContent>

          {/* ── Status Tab ── */}
          <TabsContent value="status">
            {activeProjectId ? (
              <div className="max-w-lg mx-auto space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-white">Generation in Progress</h2>
                  <p className="text-sm text-slate-400">Seedance 2.0 is rendering your video. Check back in 2-5 minutes.</p>
                </div>
                <ProjectStatusCard projectId={activeProjectId} />
                <Button variant="outline" className="w-full border-slate-600 text-slate-300"
                  onClick={() => { setActiveTab("editor"); setActiveProjectId(null); }}>
                  Start New Generation
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No active generation. Start one from the Editor tab.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
