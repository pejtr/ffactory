import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Film, User, Sparkles, Copy, Play, ChevronRight, Plus, Trash2,
  Camera, Clock, Mic, Zap, BookOpen, ArrowLeft, Download, Eye
} from "lucide-react";

// ── Camera motion labels ──────────────────────────────────────────────────────
const CAMERA_LABELS: Record<string, string> = {
  static: "Static",
  dolly_in: "Dolly In",
  dolly_out: "Dolly Out",
  pan_left: "Pan Left",
  pan_right: "Pan Right",
  tilt_up: "Tilt Up",
  tilt_down: "Tilt Down",
  orbit: "Orbit",
  handheld_shaky: "Handheld",
  drone_aerial: "Drone",
  extreme_close_up: "Extreme CU",
  slow_zoom_in: "Slow Zoom",
};

// ── Mood colors ───────────────────────────────────────────────────────────────
const MOOD_COLORS: Record<string, string> = {
  shocking: "bg-red-500/20 text-red-300 border-red-500/30",
  curious: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  dread: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  horror: "bg-red-900/40 text-red-200 border-red-800/50",
  claustrophobic: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  sinister: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  tense: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  joyful: "bg-green-500/20 text-green-300 border-green-500/30",
  epic: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

// ── Persona Card ──────────────────────────────────────────────────────────────
function PersonaCard({ persona, onSelect, selected }: {
  persona: any;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? "border-cyan-400/60 bg-cyan-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-lg font-bold text-white/80 flex-shrink-0">
          {persona.name[0]}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-white text-sm truncate">{persona.name}</div>
          <div className="text-xs text-white/50 truncate">{persona.role || "No role"}</div>
        </div>
        {selected && <div className="ml-auto text-cyan-400 text-xs font-bold">✓</div>}
      </div>
    </button>
  );
}

// ── Scene Card ────────────────────────────────────────────────────────────────
function SceneCard({ scene, index }: { scene: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const moodClass = MOOD_COLORS[scene.mood] || "bg-white/10 text-white/60 border-white/20";

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/3 hover:border-white/20 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{scene.title}</div>
          <div className="text-xs text-white/50 truncate mt-0.5">{scene.setting}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`text-xs border ${moodClass}`}>{scene.mood}</Badge>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            {scene.duration}s
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Camera className="w-3 h-3" />
            {CAMERA_LABELS[scene.cameraMotion] || scene.cameraMotion}
          </div>
          <ChevronRight className={`w-4 h-4 text-white/40 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Action</div>
            <p className="text-sm text-white/80 leading-relaxed">{scene.action}</p>
          </div>
          {scene.dialogue && (
            <div>
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mic className="w-3 h-3" /> Dialogue
              </div>
              <pre className="text-sm text-cyan-300/90 font-mono whitespace-pre-wrap bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
                {scene.dialogue}
              </pre>
            </div>
          )}
          {scene.notes && (
            <div className="text-xs text-amber-300/70 bg-amber-500/5 rounded-lg p-2 border border-amber-500/10">
              💡 {scene.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Persona Dialog ─────────────────────────────────────────────────────
function CreatePersonaDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("victim");
  const [generating, setGenerating] = useState(false);

  const createMutation = trpc.scriptTemplates.personas.create.useMutation();
  const generateMutation = trpc.scriptTemplates.personas.generateFromDescription.useMutation();

  const handleGenerate = async () => {
    if (!description.trim()) { toast.error("Zadej popis persony"); return; }
    setGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({ description, genre: "horror", role });
      toast.success(`Persona "${result.persona.name}" vygenerována`);
      onCreated();
      setOpen(false);
      setDescription("");
    } catch (e: any) {
      toast.error(e.message || "Chyba při generování");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Zadej jméno persony"); return; }
    try {
      await createMutation.mutateAsync({ name, role, personality: description });
      toast.success(`Persona "${name}" vytvořena`);
      onCreated();
      setOpen(false);
      setName("");
      setDescription("");
    } catch (e: any) {
      toast.error(e.message || "Chyba při vytváření");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-white/20 text-white/70 hover:text-white">
          <Plus className="w-4 h-4 mr-1" /> Nová persona
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1117] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Vytvořit personu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-white/70 text-sm">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1117] border-white/10">
                {["victim", "villain", "hero", "mentor", "trickster", "sidekick"].map(r => (
                  <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="manual">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="manual" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">Ručně</TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">AI generátor</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="space-y-3 mt-3">
              <div>
                <Label className="text-white/70 text-sm">Jméno</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Emma, Mara, Jack..." className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-white/70 text-sm">Osobnost / popis (volitelné)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Klidná a manipulativní, skrývá temné tajemství..." className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3} />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-cyan-600 hover:bg-cyan-500">
                {createMutation.isPending ? "Vytváření..." : "Vytvořit personu"}
              </Button>
            </TabsContent>
            <TabsContent value="ai" className="space-y-3 mt-3">
              <div>
                <Label className="text-white/70 text-sm">Popis postavy</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mladá žena v 20s, klidná a manipulativní, skrývá temné tajemství, mluví pomalu a přesně..." className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={4} />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full bg-purple-600 hover:bg-purple-500">
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "AI generuje personu..." : "Vygenerovat personu"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScriptTemplates() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"builtin" | "library" | "personas">("builtin");
  const [personaBindings, setPersonaBindings] = useState<Record<string, number>>({});
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [filledScenes, setFilledScenes] = useState<any[] | null>(null);
  const [filling, setFilling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [newIdea, setNewIdea] = useState("");
  const [newGenre, setNewGenre] = useState("horror");

  const { data: builtIn } = trpc.scriptTemplates.templates.getBuiltIn.useQuery();
  const { data: personas, refetch: refetchPersonas } = trpc.scriptTemplates.personas.list.useQuery();
  const { data: userTemplates, refetch: refetchTemplates } = trpc.scriptTemplates.templates.list.useQuery();
  const fillMutation = trpc.scriptTemplates.templates.fillWithPersonas.useMutation();
  const generateMutation = trpc.scriptTemplates.templates.generateFromIdea.useMutation();
  const deletePersonaMutation = trpc.scriptTemplates.personas.delete.useMutation();
  const deleteTemplateMutation = trpc.scriptTemplates.templates.delete.useMutation();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="text-center">
          <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Přihlas se pro přístup ke skript šablonám</p>
        </div>
      </div>
    );
  }

  const handleFill = async () => {
    if (!builtIn) return;
    setFilling(true);
    try {
      const result = await fillMutation.mutateAsync({
        templateData: builtIn,
        personaBindings,
        variableValues,
      });
      setFilledScenes(result.filledScenes);
      toast.success("Scény vyplněny personami!");
    } catch (e: any) {
      toast.error(e.message || "Chyba při vyplňování");
    } finally {
      setFilling(false);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!newIdea.trim()) { toast.error("Zadej nápad"); return; }
    setGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({ idea: newIdea, genre: newGenre, language: "cs" });
      toast.success("Šablona vygenerována a uložena!");
      refetchTemplates();
      setNewIdeaOpen(false);
      setNewIdea("");
    } catch (e: any) {
      toast.error(e.message || "Chyba při generování");
    } finally {
      setGenerating(false);
    }
  };

  const copyScenesToClipboard = () => {
    const scenes = filledScenes || builtIn?.scenes || [];
    const text = scenes.map((s: any, i: number) => [
      `=== SCÉNA ${i + 1}: ${s.title} ===`,
      `Prostředí: ${s.setting}`,
      `Délka: ${s.duration}s | Kamera: ${CAMERA_LABELS[s.cameraMotion] || s.cameraMotion} | Nálada: ${s.mood}`,
      ``,
      `AKCE:`,
      s.action,
      ``,
      s.dialogue ? `DIALOG:\n${s.dialogue}` : "",
      s.notes ? `POZNÁMKA: ${s.notes}` : "",
    ].filter(Boolean).join("\n")).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Scénář zkopírován do schránky");
  };

  const displayScenes = filledScenes || builtIn?.scenes || [];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-white">Skript Šablony</span>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">Beta</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyScenesToClipboard}
              className="border-white/20 text-white/70 hover:text-white"
            >
              <Copy className="w-4 h-4 mr-1" /> Kopírovat scénář
            </Button>
            <Button
              size="sm"
              onClick={() => setNewIdeaOpen(true)}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <Sparkles className="w-4 h-4 mr-1" /> AI šablona
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="builtin" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
              <Film className="w-4 h-4 mr-2" /> The Trap & Switch
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" /> Moje šablony
              {userTemplates && userTemplates.length > 0 && (
                <Badge className="ml-2 bg-white/10 text-white/60 text-xs">{userTemplates.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="personas" className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" /> Persony
              {personas && personas.length > 0 && (
                <Badge className="ml-2 bg-white/10 text-white/60 text-xs">{personas.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Built-in Template Tab ── */}
          <TabsContent value="builtin">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Template info + persona binding */}
              <div className="space-y-4">
                {/* Template header */}
                <Card className="bg-gradient-to-br from-red-900/30 to-purple-900/20 border-red-500/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{builtIn?.title}</CardTitle>
                        <p className="text-white/50 text-sm mt-1">{builtIn?.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-400">{builtIn?.viralScore}</div>
                        <div className="text-xs text-white/40">viral score</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">{builtIn?.genre}</Badge>
                      <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{builtIn?.format}</Badge>
                      <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{builtIn?.scenes?.length} scén</Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Persona Bindings */}
                <Card className="bg-white/3 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-cyan-400" /> Dosadit persony
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {builtIn?.personaSlots?.map((slot: any) => (
                      <div key={slot.slot}>
                        <div className="text-xs text-white/50 mb-1">{slot.label}</div>
                        <div className="text-xs text-white/30 mb-2">{slot.description}</div>
                        {personas && personas.length > 0 ? (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {personas.map((p: any) => (
                              <PersonaCard
                                key={p.id}
                                persona={p}
                                selected={personaBindings[slot.slot] === p.id}
                                onSelect={() => setPersonaBindings(prev => ({ ...prev, [slot.slot]: p.id }))}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-white/30 bg-white/5 rounded-lg p-3 text-center">
                            Žádné persony — vytvoř je v záložce Persony
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Variables */}
                <Card className="bg-white/3 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" /> Proměnné
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {builtIn?.variables?.map((v: any) => (
                      <div key={v.key}>
                        <Label className="text-xs text-white/50">{v.label}</Label>
                        <Input
                          value={variableValues[v.key] ?? v.defaultValue}
                          onChange={e => setVariableValues(prev => ({ ...prev, [v.key]: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white text-sm mt-1 h-8"
                          placeholder={v.defaultValue}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleFill}
                  disabled={filling || Object.keys(personaBindings).length === 0}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {filling ? "Dosazuji persony..." : "Dosadit persony do scénáře"}
                </Button>

                {filledScenes && (
                  <div className="text-xs text-green-400 bg-green-500/10 rounded-lg p-2 border border-green-500/20 text-center">
                    ✓ Scénář vyplněn — {filledScenes.length} scén připraveno
                  </div>
                )}
              </div>

              {/* Right: Scenes */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    {filledScenes ? "Vyplněný scénář" : "Šablona scén"}
                  </h3>
                  <div className="flex items-center gap-2">
                    {filledScenes && (
                      <Button size="sm" variant="ghost" onClick={() => setFilledScenes(null)} className="text-white/40 hover:text-white text-xs">
                        Zobrazit šablonu
                      </Button>
                    )}
                    <div className="text-xs text-white/40">
                      {displayScenes.reduce((a: number, s: any) => a + (s.duration || 0), 0)}s celkem
                    </div>
                  </div>
                </div>
                {displayScenes.map((scene: any, i: number) => (
                  <SceneCard key={i} scene={scene} index={i} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── User Templates Tab ── */}
          <TabsContent value="library">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Moje AI šablony</h3>
                <Button size="sm" onClick={() => setNewIdeaOpen(true)} className="bg-purple-600 hover:bg-purple-500">
                  <Sparkles className="w-4 h-4 mr-1" /> Vygenerovat šablonu
                </Button>
              </div>

              {!userTemplates || userTemplates.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Žádné šablony</p>
                  <p className="text-sm">Klikni na "Vygenerovat šablonu" a AI vytvoří šablonu z tvého nápadu</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTemplates.map((t: any) => (
                    <Card key={t.id} className="bg-white/3 border-white/10 hover:border-white/20 transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-white text-sm">{t.title}</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await deleteTemplateMutation.mutateAsync({ id: t.id });
                              refetchTemplates();
                              toast.success("Šablona smazána");
                            }}
                            className="text-white/20 hover:text-red-400 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{t.genre}</Badge>
                          <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{t.format}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-white/40 line-clamp-2">{t.description}</p>
                        {t.viralScore && (
                          <div className="mt-2 text-xs text-white/50">
                            Viral score: <span className="text-cyan-400 font-bold">{t.viralScore}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Personas Tab ── */}
          <TabsContent value="personas">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Persony</h3>
                <CreatePersonaDialog onCreated={refetchPersonas} />
              </div>

              {!personas || personas.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Žádné persony</p>
                  <p className="text-sm">Vytvoř persony pro dosazení do šablon</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personas.map((p: any) => (
                    <Card key={p.id} className="bg-white/3 border-white/10 hover:border-white/20 transition-all">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-xl font-bold text-white/80 flex-shrink-0">
                            {p.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-white">{p.name}</div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  await deletePersonaMutation.mutateAsync({ id: p.id });
                                  refetchPersonas();
                                  toast.success("Persona smazána");
                                }}
                                className="text-white/20 hover:text-red-400 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {p.role && <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{p.role}</Badge>}
                              {p.gender && <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{p.gender}</Badge>}
                              {p.age && <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">{p.age}</Badge>}
                            </div>
                          </div>
                        </div>
                        {p.appearance && (
                          <p className="text-xs text-white/40 mt-3 line-clamp-2">{p.appearance}</p>
                        )}
                        {p.catchphrase && (
                          <p className="text-xs text-cyan-300/60 mt-2 italic">"{p.catchphrase}"</p>
                        )}
                        {p.voiceStyle && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-white/30">
                            <Mic className="w-3 h-3" /> {p.voiceStyle}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Template Dialog */}
      <Dialog open={newIdeaOpen} onOpenChange={setNewIdeaOpen}>
        <DialogContent className="bg-[#0d1117] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> AI Generátor šablon
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-sm">Nápad / premisa</Label>
              <Textarea
                value={newIdea}
                onChange={e => setNewIdea(e.target.value)}
                placeholder="Detektiv zjistí, že jeho partner je AI... Vědec otevře portál do minulosti... Dívka najde dopis od sebe z budoucnosti..."
                className="bg-white/5 border-white/10 text-white mt-1 resize-none"
                rows={4}
              />
            </div>
            <div>
              <Label className="text-white/70 text-sm">Žánr</Label>
              <Select value={newGenre} onValueChange={setNewGenre}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-white/10">
                  {["horror", "thriller", "sci-fi", "romance", "comedy", "drama", "action", "mystery"].map(g => (
                    <SelectItem key={g} value={g} className="text-white">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerateTemplate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? "AI generuje šablonu..." : "Vygenerovat šablonu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
