import { useState, useCallback, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Film, Sparkles, ChevronRight, ChevronLeft, Wand2,
  Clock, Music, Mic, Zap, Eye, Play, CheckCircle2,
  Clapperboard, Star, Loader2, Users, RefreshCw
} from "lucide-react";

type SceneData = {
  title: string;
  description: string;
  sceneType: string;
  emotion: string;
  videoModel: string;
  duration: number;
  dialogue?: string;
  location?: string;
};

type ScreenplayData = {
  title: string;
  logline: string;
  scenes: SceneData[];
  totalDuration: number;
  emotionalArc: string;
  bgmStyle?: string;
};

const GENRES = [
  { id: "Sci-Fi Drama", label: "Sci-Fi", emoji: "🚀" },
  { id: "Drama", label: "Drama", emoji: "🎭" },
  { id: "Action Thriller", label: "Akce", emoji: "💥" },
  { id: "Thriller", label: "Thriller", emoji: "🔥" },
  { id: "Fantasy Epic", label: "Fantasy", emoji: "✨" },
  { id: "Documentary Style", label: "Dokument", emoji: "🎬" },
  { id: "Comedy", label: "Komedie", emoji: "😄" },
  { id: "Horror", label: "Horor", emoji: "👻" },
];

const EMOTIONS = [
  { id: "Epic & Triumphant", label: "Epický", emoji: "⚡" },
  { id: "Romantic & Emotional", label: "Dojemný", emoji: "💙" },
  { id: "Tense & Suspenseful", label: "Napínavý", emoji: "😰" },
  { id: "Hopeful & Inspiring", label: "Nadějný", emoji: "🌅" },
  { id: "Dark & Mysterious", label: "Temný", emoji: "🌑" },
  { id: "Melancholic & Reflective", label: "Melancholický", emoji: "🌧️" },
  { id: "Mysterious", label: "Tajemný", emoji: "🌀" },
  { id: "Energetic & Exciting", label: "Energický", emoji: "🎯" },
];

const SELECTABLE_MODELS = [
  { id: "kling-v3-omni",      label: "Kling 3.0 Omni",   color: "text-blue-400",   costPerSec: 0.08 },
  { id: "kling-v3-motion",    label: "Kling Motion",     color: "text-orange-400", costPerSec: 0.06 },
  { id: "hailuo-minimax-2.3", label: "Hailuo MiniMax",   color: "text-purple-400", costPerSec: 0.04 },
  { id: "wan-2.2-t2v",        label: "WAN 2.2 T2V",      color: "text-teal-400",   costPerSec: 0.02 },
  { id: "wan-2.2-s2v",        label: "WAN 2.2 Lip Sync", color: "text-green-400",  costPerSec: 0.03 },
  { id: "seedance-2.0",       label: "Seedance 2.0",     color: "text-amber-400",  costPerSec: 0.05 },
];

const MODEL_LABELS: Record<string, { label: string; color: string }> = {
  "kling-v3-omni": { label: "Kling 3.0 Omni", color: "text-blue-400" },
  "kling-3.0-omni": { label: "Kling 3.0 Omni", color: "text-blue-400" },
  "hailuo-minimax-2.3": { label: "Hailuo MiniMax", color: "text-purple-400" },
  "wan-2.2-s2v": { label: "WAN 2.2 Lip Sync", color: "text-green-400" },
  "kling-v3-motion": { label: "Kling Motion", color: "text-orange-400" },
  "kling-motion-control": { label: "Kling Motion", color: "text-orange-400" },
  "wan-2.2-t2v": { label: "WAN 2.2 T2V", color: "text-teal-400" },
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  dialogue: "💬 Dialog",
  broll: "🎥 B-Roll",
  action: "💥 Akce",
  lipsync: "🎤 Lip Sync",
  dream: "💭 Sen",
  transition: "🔀 Přechod",
};

const INSPIRATIONS = [
  {
    label: "🚀 Stargate: Legacy",
    text: "Tým SG-1 a Atlantis objeví pod Atlantidou loď třídy Destiny. Carter a McKay musí aktivovat systém cestování na dálku dříve, než dorazí Wraith.",
  },
  {
    label: "🎭 Emotivní drama",
    text: "Mladá astronautka se vrací domů po 10 letech na orbitální stanici a musí znovu navázat vztah s dcerou, která ji nepamatuje.",
  },
  {
    label: "💥 Akční thriller",
    text: "Elitní agent odhalí korupci uvnitř vlastní agentury a musí přežít 24 hodin v nepřátelském městě.",
  },
  {
    label: "✨ Fantasy epika",
    text: "Poslední drak a zapomenutý mág uzavřou spojenectví, aby zachránili svět před starověkým zlem probouzejícím se po tisíci letech.",
  },
];

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              i === current
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                : i < current
                ? "text-green-400"
                : "text-slate-500"
            }`}
          >
            {i < current ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                  i === current ? "border-blue-400 bg-blue-500/30" : "border-slate-600"
                }`}
              >
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-1 ${i < current ? "bg-green-500/50" : "bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Studio() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  // ── Persistent form state (survives page refresh) ──────────────────────────
  const uid = user?.id ?? "guest";
  const [step, setStep] = useLocalStorage(`studio_${uid}_step`, 0);
  const [idea, setIdea] = useLocalStorage(`studio_${uid}_idea`, "");
  const [genre, setGenre] = useLocalStorage(`studio_${uid}_genre`, "Sci-Fi Drama");
  const [emotion, setEmotion] = useLocalStorage(`studio_${uid}_emotion`, "Epic & Triumphant");
  const [duration, setDuration] = useLocalStorage(`studio_${uid}_duration`, 60);
  const [dreamMode, setDreamMode] = useLocalStorage(`studio_${uid}_dreamMode`, false);
  const [screenplay, setScreenplay] = useLocalStorage<ScreenplayData | null>(`studio_${uid}_screenplay`, null);
  const [estimatedCost, setEstimatedCost] = useLocalStorage<number | null>(`studio_${uid}_cost`, null);
  const [budgetMode, setBudgetMode] = useLocalStorage(`studio_${uid}_budgetMode`, false);
  const [sceneModels, setSceneModels] = useLocalStorage<Record<number, string>>(`studio_${uid}_sceneModels`, {});

  // Auto-redirect to last active project if it's still generating
  useEffect(() => {
    if (!user?.id) return;
    try {
      const lastId = localStorage.getItem(`vf_last_project_${user.id}`);
      if (lastId) {
        // Only redirect if we're on step 0 (fresh studio) and idea is empty
        if (step === 0 && !idea) {
          navigate(`/project/${lastId}`);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const BUDGET_MAP: Record<string, string> = {
    "kling-v3-omni": "wan-2.2-t2v",
    "kling-3.0-omni": "wan-2.2-t2v",
    "kling-v3-motion": "wan-2.2-t2v",
    "kling-motion-control": "wan-2.2-t2v",
  };

  const getEffectiveModel = (sceneIdx: number, originalModel: string) =>
    sceneModels[sceneIdx] ?? (budgetMode ? (BUDGET_MAP[originalModel] ?? originalModel) : originalModel);

  const calcBudgetCost = () => {
    if (!screenplay) return null;
    return screenplay.scenes.reduce((sum, scene, i) => {
      const model = getEffectiveModel(i, scene.videoModel);
      const costPerSec = SELECTABLE_MODELS.find((m) => m.id === model)?.costPerSec ?? 0.04;
      return sum + scene.duration * costPerSec;
    }, 0);
  };

  const previewMutation = trpc.video.preview.useMutation();
  const createMutation = trpc.video.create.useMutation();

  // Prefill from Script Templates (Template → Studio pipeline)
  useEffect(() => {
    const prefill = sessionStorage.getItem("studio_prefill");
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        if (data.idea) setIdea(data.idea);
        if (data.genre) setGenre(data.genre);
        if (data.emotion) setEmotion(data.emotion);
        sessionStorage.removeItem("studio_prefill");
        toast.success("Šablona přenesena do Studia");
      } catch {}
    }
  }, []);

  const steps = ["Nápad", "Styl", "Scénář", "Vytvořit"];

  const handlePreview = useCallback(async () => {
    try {
      const result = await previewMutation.mutateAsync({
        idea,
        genre,
        emotionalTone: emotion,
        dreamMode,
        targetDuration: duration,
      });
      setScreenplay(result.screenplay as unknown as ScreenplayData);
      setEstimatedCost(result.estimatedCostUsd);
      setStep(2);
    } catch {
      toast.error("Nepodařilo se vygenerovat scénář. Zkus to znovu.");
    }
  }, [idea, genre, emotion, dreamMode, duration, previewMutation]);

  const handleCreate = useCallback(async () => {
    try {
      const result = await createMutation.mutateAsync({
        idea,
        genre,
        emotionalTone: emotion,
        dreamMode,
        targetDuration: duration,
      });
      // Clear draft after successful creation
      const keys = [`studio_${uid}_step`, `studio_${uid}_idea`, `studio_${uid}_genre`,
        `studio_${uid}_emotion`, `studio_${uid}_duration`, `studio_${uid}_dreamMode`,
        `studio_${uid}_screenplay`, `studio_${uid}_cost`, `studio_${uid}_budgetMode`,
        `studio_${uid}_sceneModels`];
      keys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
      // Remember last active project for auto-redirect
      try { localStorage.setItem(`vf_last_project_${uid}`, String(result.projectId)); } catch {}
      toast.success("Video se začalo generovat!");
      navigate(`/project/${result.projectId}`);
    } catch {
      toast.error("Nepodařilo se spustit generování. Zkus to znovu.");
    }
  }, [idea, genre, emotion, dreamMode, duration, uid, createMutation, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-4">
          <Film className="w-12 h-12 text-blue-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Přihlášení vyžadováno</h2>
          <p className="text-slate-400">Přihlas se pro přístup do Video Factory Studia</p>
          <a href={getLoginUrl()}>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">Přihlásit se</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] pt-4 pb-24 px-4">
      {/* Navigace */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Zpět
          </button>
          <div className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">Studio</span>
          </div>
          <button
            onClick={() => navigate("/characters")}
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <Users className="w-4 h-4 mr-1" /> Postavy
          </button>
        </div>
        <StepIndicator current={step} steps={steps} />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* ── KROK 0: Nápad ─────────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Co chceš natočit?</h2>
              <p className="text-slate-400">Popiš svůj nápad — čím víc detailů, tím lepší scénář AI vytvoří</p>
            </div>

            <div className="relative">
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Příklad: Pilot seriálu Stargate: Legacy — tým SG-1 a Atlantis objeví pod Atlantidou loď třídy Destiny. Carter a McKay musí aktivovat systém cestování na dálku dříve, než dorazí Wraith..."
                className="min-h-[160px] bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-500 text-base resize-none rounded-xl focus:border-blue-500/60"
                maxLength={2000}
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500">{idea.length}/2000</div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Nebo použij inspiraci:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INSPIRATIONS.map((tip) => (
                  <button
                    key={tip.label}
                    onClick={() => setIdea(tip.text)}
                    className="text-left p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-700/40 transition-all group"
                  >
                    <div className="text-sm font-medium text-slate-300 group-hover:text-blue-300">{tip.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tip.text}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setStep(1)}
              disabled={idea.trim().length < 10}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-base"
            >
              Pokračovat — vybrat styl
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* ── KROK 1: Styl ──────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Jaký styl a nálada?</h2>
              <p className="text-slate-400">Tyto parametry ovlivní výběr AI modelů, hudbu i vizuální styl</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">Žánr</label>
              <div className="grid grid-cols-4 gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGenre(g.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      genre === g.id
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-xl mb-1">{g.emoji}</div>
                    <div className="text-xs font-medium">{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">Emoční tón</label>
              <div className="grid grid-cols-4 gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEmotion(e.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      emotion === e.id
                        ? "border-purple-500 bg-purple-500/20 text-purple-300"
                        : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-xl mb-1">{e.emoji}</div>
                    <div className="text-xs font-medium">{e.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Délka videa:{" "}
                <span className="text-blue-400 font-bold">
                  {duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}min${duration % 60 > 0 ? ` ${duration % 60}s` : ""}`}
                </span>
              </label>
              <Slider
                value={[duration]}
                onValueChange={([v]) => setDuration(v)}
                min={15}
                max={300}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>15s (TikTok)</span>
                <span>1 min</span>
                <span>2 min</span>
                <span>5 min (film)</span>
              </div>
            </div>

            <div
              onClick={() => setDreamMode(!dreamMode)}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                dreamMode
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles className={`w-4 h-4 ${dreamMode ? "text-indigo-400" : "text-slate-500"}`} />
                  Dream Mode (WAN 2.2)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Přidá surrealistické snové sekvence mezi scény</div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all relative ${dreamMode ? "bg-indigo-500" : "bg-slate-700"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${dreamMode ? "left-5" : "left-1"}`} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Zpět
              </Button>
              <Button
                onClick={handlePreview}
                disabled={previewMutation.isPending}
                className="flex-[2] h-12 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generuji scénář...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Zobrazit scénář
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── KROK 2: Scénář ────────────────────────────────────────────────── */}
        {step === 2 && screenplay && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">{screenplay.title}</h2>
              <p className="text-slate-400 max-w-xl mx-auto">{screenplay.logline}</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {estimatedCost !== null && (
                  <Badge variant="outline" className="border-yellow-500/40 text-yellow-400 bg-yellow-500/10">
                    <Zap className="w-3 h-3 mr-1" />~${estimatedCost.toFixed(2)}
                  </Badge>
                )}
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  <Clock className="w-3 h-3 mr-1" />{screenplay.totalDuration}s
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  {screenplay.scenes.length} scén
                </Badge>
              </div>
            </div>

            {screenplay.emotionalArc && (
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-sm text-slate-400">
                <span className="text-slate-300 font-medium">Emoční oblouk: </span>
                {screenplay.emotionalArc}
              </div>
            )}

            {/* Budget Mode toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-white">Budget Mode</div>
                  <div className="text-xs text-slate-400">Nahradí drahé modely levnějšími (WAN 2.2 T2V)</div>
                </div>
              </div>
              <button
                onClick={() => setBudgetMode((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${budgetMode ? "bg-yellow-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${budgetMode ? "translate-x-5" : ""}`} />
              </button>
            </div>

            <div className="space-y-2">
              {screenplay.scenes.map((scene, i) => {
                const effectiveModel = getEffectiveModel(i, scene.videoModel);
                const modelInfo = MODEL_LABELS[effectiveModel] ?? { label: effectiveModel, color: "text-slate-400" };
                const sceneCost = scene.duration * (SELECTABLE_MODELS.find((m) => m.id === effectiveModel)?.costPerSec ?? 0.04);
                return (
                <Card key={i} className="bg-slate-800/40 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-white text-sm">{scene.title}</span>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {SCENE_TYPE_LABELS[scene.sceneType] ?? scene.sceneType}
                          </Badge>
                          <span className="text-xs text-slate-500">{scene.duration}s</span>
                          <span className="text-xs text-yellow-500/80">${sceneCost.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{scene.description}</p>
                        {scene.dialogue && (
                          <p className="text-xs text-blue-400 mt-1 italic line-clamp-1">„{scene.dialogue}“</p>
                        )}
                        {/* Per-scene model selector */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {SELECTABLE_MODELS.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setSceneModels((prev) => ({ ...prev, [i]: m.id }))}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                                effectiveModel === m.id
                                  ? `border-current ${m.color} bg-white/5`
                                  : "border-slate-700 text-slate-500 hover:border-slate-500"
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${modelInfo.color}`}>
                        {modelInfo.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Upravit styl
              </Button>
              <Button
                onClick={handlePreview}
                variant="outline"
                disabled={previewMutation.isPending}
                className="h-12 border-slate-600 text-slate-300 hover:bg-slate-700 px-4"
              >
                {previewMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-[2] h-12 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl"
              >
                <Play className="w-4 h-4 mr-2" /> Vytvořit video
              </Button>
            </div>
          </div>
        )}

        {/* ── KROK 3: Vytvořit ──────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Spustit produkci</h2>
              <p className="text-slate-400">AI vygeneruje všechny scény, zvuk a sestříhá finální video</p>
            </div>

            <Card className="bg-slate-800/40 border-slate-700/50 text-left">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Projekt</span>
                  <span className="text-white font-medium">{screenplay?.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Scén</span>
                  <span className="text-white">{screenplay?.scenes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Délka</span>
                  <span className="text-white">{screenplay?.totalDuration}s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Žánr</span>
                  <span className="text-white">
                    {GENRES.find((g) => g.id === genre)?.emoji} {GENRES.find((g) => g.id === genre)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Emoce</span>
                  <span className="text-white">
                    {EMOTIONS.find((e) => e.id === emotion)?.emoji} {EMOTIONS.find((e) => e.id === emotion)?.label}
                  </span>
                </div>
                {dreamMode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Dream Mode</span>
                    <span className="text-indigo-400">✨ Aktivní</span>
                  </div>
                )}
                {estimatedCost !== null && (
                  <div className="flex justify-between text-sm border-t border-slate-700 pt-3">
                    <span className="text-slate-400">Odhadovaná cena</span>
                    <div className="text-right">
                      {(budgetMode || Object.keys(sceneModels).length > 0) && (
                        <div className="text-xs text-slate-500 line-through">${estimatedCost.toFixed(2)}</div>
                      )}
                      <span className="text-yellow-400 font-bold">
                        ~${(calcBudgetCost() ?? estimatedCost).toFixed(2)}
                      </span>
                      {budgetMode && (
                        <div className="text-xs text-green-400 mt-0.5">
                          Ušetříš ${(estimatedCost - (calcBudgetCost() ?? estimatedCost)).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2 text-left">
              {[
                { icon: <Mic className="w-4 h-4" />, label: "Dialogy", model: "Kling 3.0 Omni", color: "text-blue-400" },
                { icon: <Film className="w-4 h-4" />, label: "B-Roll", model: "Hailuo MiniMax 2.3", color: "text-purple-400" },
                { icon: <Music className="w-4 h-4" />, label: "Hudba", model: "Kie.ai Music", color: "text-green-400" },
                { icon: <Star className="w-4 h-4" />, label: "Hlasy", model: "ElevenLabs TTS", color: "text-orange-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/40">
                  <span className={item.color}>{item.icon}</span>
                  <div>
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className={`text-xs font-medium ${item.color}`}>{item.model}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Zpět
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-[2] h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl text-lg"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Spouštím...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" /> 🎬 VYTVOŘIT VIDEO
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
