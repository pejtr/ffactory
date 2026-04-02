import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Film, ChevronLeft, Plus, Users, Loader2, Star, Mic, Trash2,
  Edit, Sparkles, Video, Camera, Upload, X, Image, Zap,
  Play, RefreshCw, Tag, ChevronDown, ChevronUp
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Typy ─────────────────────────────────────────────────────────────────────
type RefImage = { url: string; label: string; isMultiView: boolean };
type Character = {
  id: number; name: string; description?: string | null;
  personality?: string | null; voiceId?: string | null; voiceName?: string | null;
  referenceImageUrl?: string | null; referenceImages?: RefImage[] | null;
  soulIdImageUrl?: string | null; defaultEmotion?: string | null;
  motionPreset?: string | null; tags?: string[] | null;
  usageCount?: number; createdAt: Date | string;
};

const MOTION_PRESETS = [
  { id: "static",   label: "Statický záběr",    emoji: "📷" },
  { id: "dollyIn",  label: "Dolly přiblížení",  emoji: "🔍" },
  { id: "dollyOut", label: "Dolly oddálení",     emoji: "🔎" },
  { id: "panLeft",  label: "Pan doleva",         emoji: "⬅️" },
  { id: "panRight", label: "Pan doprava",        emoji: "➡️" },
  { id: "tiltUp",   label: "Tilt nahoru",        emoji: "⬆️" },
  { id: "tiltDown", label: "Tilt dolů",          emoji: "⬇️" },
  { id: "orbit",    label: "Orbit (kruh)",       emoji: "🔄" },
  { id: "handheld", label: "Ruční kamera",       emoji: "🤳" },
];

const PHOTO_LABELS = [
  "Přední pohled", "Boční pohled", "Záda", "Detail obličeje", "Character sheet",
];

// ─── Komponenta: Character Card ───────────────────────────────────────────────
function CharacterCard({
  char,
  onDelete,
  onEdit,
  onGenerateSoulId,
  onGenerateMotion,
  onUploadPhoto,
  onRemovePhoto,
  isGeneratingSoulId,
  isGeneratingMotion,
}: {
  char: Character;
  onDelete: () => void;
  onEdit: () => void;
  onGenerateSoulId: () => void;
  onGenerateMotion: () => void;
  onUploadPhoto: (file: File, label: string, isMultiView: boolean) => void;
  onRemovePhoto: (url: string) => void;
  isGeneratingSoulId: boolean;
  isGeneratingMotion: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [photoLabel, setPhotoLabel] = useState(PHOTO_LABELS[0]);
  const [isMultiView, setIsMultiView] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refImages = (char.referenceImages ?? []) as RefImage[];
  const primaryImage = char.soulIdImageUrl ?? char.referenceImageUrl ?? refImages[0]?.url;

  return (
    <Card className="bg-slate-900/70 border-slate-700/60 overflow-hidden hover:border-slate-600/80 transition-all group">
      {/* Hlavní portrét */}
      <div className="relative aspect-[3/4] bg-slate-800/60 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={char.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600">
            <Users className="w-12 h-12" />
            <span className="text-xs">Bez portrétu</span>
          </div>
        )}
        {/* Soul ID badge */}
        {char.soulIdImageUrl && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-purple-500/80 text-white text-xs border-0 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />Soul ID
            </Badge>
          </div>
        )}
        {/* Usage count */}
        {(char.usageCount ?? 0) > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/60 text-slate-300 text-xs border-0 backdrop-blur-sm">
              {char.usageCount}× použita
            </Badge>
          </div>
        )}
        {/* Overlay akce */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 gap-2">
          <Button
            size="sm"
            onClick={onGenerateSoulId}
            disabled={isGeneratingSoulId}
            className="flex-1 bg-purple-600/90 hover:bg-purple-500 text-white text-xs h-8"
          >
            {isGeneratingSoulId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            <span className="ml-1">Soul ID</span>
          </Button>
          <Button
            size="sm"
            onClick={onGenerateMotion}
            disabled={isGeneratingMotion}
            className="flex-1 bg-blue-600/90 hover:bg-blue-500 text-white text-xs h-8"
          >
            {isGeneratingMotion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
            <span className="ml-1">Motion</span>
          </Button>
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{char.name}</h3>
            {char.description && (
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{char.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-blue-400 transition-colors">
              <Edit className="w-3 h-3" />
            </button>
            <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tagy */}
        {(char.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(char.tags as string[]).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-slate-700 text-slate-400 py-0">
                <Tag className="w-2 h-2 mr-1" />{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Hlas */}
        {char.voiceName && (
          <div className="flex items-center gap-1 text-xs text-teal-400">
            <Mic className="w-3 h-3" />{char.voiceName}
          </div>
        )}

        {/* Motion preset */}
        {char.motionPreset && char.motionPreset !== "static" && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <Camera className="w-3 h-3" />
            {MOTION_PRESETS.find(p => p.id === char.motionPreset)?.label ?? char.motionPreset}
          </div>
        )}

        {/* Rozbalit — referenční fotky */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1 border-t border-slate-800"
        >
          <span className="flex items-center gap-1">
            <Image className="w-3 h-3" />
            Referenční fotky ({refImages.length}/5)
          </span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="space-y-2">
            {/* Existující fotky */}
            {refImages.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                {refImages.map((img) => (
                  <div key={img.url} className="relative group/img aspect-square rounded overflow-hidden bg-slate-800">
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    {img.isMultiView && (
                      <div className="absolute top-0.5 left-0.5">
                        <Badge className="bg-purple-500/80 text-white text-[9px] border-0 px-1 py-0">4-view</Badge>
                      </div>
                    )}
                    <button
                      onClick={() => onRemovePhoto(img.url)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X className="w-2 h-2 text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-slate-300 px-1 py-0.5 truncate">
                      {img.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload nové fotky */}
            {refImages.length < 5 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  <Select value={photoLabel} onValueChange={setPhotoLabel}>
                    <SelectTrigger className="h-7 text-xs bg-slate-800 border-slate-700 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_LABELS.map(l => (
                        <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setIsMultiView(!isMultiView)}
                    className={`px-2 h-7 rounded text-xs border transition-colors ${isMultiView ? "border-purple-500 text-purple-400 bg-purple-500/10" : "border-slate-700 text-slate-500"}`}
                  >
                    4-view
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { onUploadPhoto(file, photoLabel, isMultiView); e.target.value = ""; }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-7 text-xs border-dashed border-slate-600 text-slate-400 hover:border-blue-500/60 hover:text-blue-400"
                >
                  <Upload className="w-3 h-3 mr-1" />Nahrát fotku
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Komponenta: Motion Dialog ────────────────────────────────────────────────
function MotionDialog({
  char,
  open,
  onClose,
}: {
  char: Character | null;
  open: boolean;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [motionPreset, setMotionPreset] = useState("static");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const motionMutation = trpc.characters.generateMotion.useMutation({
    onSuccess: (data) => {
      setResultUrl(data.videoUrl);
      toast.success("Kling Motion video vygenerováno!");
    },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const handleGenerate = () => {
    if (!char) return;
    if (!prompt.trim()) { toast.error("Zadej popis scény"); return; }
    setResultUrl(null);
    motionMutation.mutate({
      characterId: char.id,
      prompt,
      motionPreset,
      duration,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setResultUrl(null); setPrompt(""); } }}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            Kling Motion — {char?.name}
          </DialogTitle>
        </DialogHeader>

        {resultUrl ? (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <video src={resultUrl} controls autoPlay className="w-full h-full" />
            </div>
            <div className="flex gap-2">
              <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                  <Play className="w-4 h-4 mr-2" />Stáhnout video
                </Button>
              </a>
              <Button variant="outline" onClick={() => setResultUrl(null)} className="border-slate-600 text-slate-300">
                <RefreshCw className="w-4 h-4 mr-2" />Znovu
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Náhled postavy */}
            {(char?.soulIdImageUrl ?? char?.referenceImageUrl) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <img
                  src={(char?.soulIdImageUrl ?? char?.referenceImageUrl) as string}
                  alt={char?.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/40"
                />
                <div>
                  <div className="text-sm font-medium text-white">{char?.name}</div>
                  <div className="text-xs text-slate-400">
                    {char?.soulIdImageUrl ? "Soul ID k dispozici" : "Referenční fotka"}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-slate-400 mb-1.5 block">Popis scény *</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Postava kráčí po nábřeží, západ slunce, epická nálada..."
                className="bg-slate-800 border-slate-700 text-white resize-none min-h-[80px] text-sm"
                maxLength={500}
              />
            </div>

            <div>
              <Label className="text-xs text-slate-400 mb-1.5 block">Pohyb kamery</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {MOTION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setMotionPreset(p.id)}
                    className={`p-2 rounded-lg text-center text-xs border transition-all ${
                      motionPreset === p.id
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    <div className="text-base mb-0.5">{p.emoji}</div>
                    <div className="leading-tight">{p.label.split(" ").slice(0, 2).join(" ")}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-400 mb-1.5 block">
                Délka: <span className="text-blue-400 font-bold">{duration}s</span>
              </Label>
              <div className="flex gap-2">
                {[5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d as 5 | 10)}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                      duration === d
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-slate-700 bg-slate-800/40 text-slate-400"
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/40 rounded-lg p-2">
              <Zap className="w-3 h-3 text-yellow-400" />
              Cena: <span className="text-yellow-400 font-bold">3 kredity</span>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={motionMutation.isPending || !prompt.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold h-11"
            >
              {motionMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generuji (2–3 min)...</>
              ) : (
                <><Video className="w-4 h-4 mr-2" />Generovat Kling Motion</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Komponenta: Edit Dialog ──────────────────────────────────────────────────
function EditDialog({
  char,
  open,
  onClose,
  onSaved,
}: {
  char: Character | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(char?.name ?? "");
  const [description, setDescription] = useState(char?.description ?? "");
  const [personality, setPersonality] = useState(char?.personality ?? "");
  const [voiceName, setVoiceName] = useState(char?.voiceName ?? "");
  const [motionPreset, setMotionPreset] = useState(char?.motionPreset ?? "static");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>((char?.tags as string[]) ?? []);

  const updateMutation = trpc.characters.update.useMutation({
    onSuccess: () => { toast.success("Postava uložena"); onSaved(); onClose(); },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  // Sync when char changes
  const prevId = useRef<number | null>(null);
  if (char && char.id !== prevId.current) {
    prevId.current = char.id;
    setName(char.name);
    setDescription(char.description ?? "");
    setPersonality(char.personality ?? "");
    setVoiceName(char.voiceName ?? "");
    setMotionPreset(char.motionPreset ?? "static");
    setTags((char.tags as string[]) ?? []);
  }

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="w-4 h-4 text-blue-400" />Upravit postavu
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Jméno *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Vizuální popis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-800 border-slate-700 text-white resize-none min-h-[70px] text-sm" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Osobnost</Label>
            <Input value={personality} onChange={(e) => setPersonality(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Hlas (popis)</Label>
            <Input value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="např. Hluboký, autoritativní" className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Výchozí pohyb kamery</Label>
            <Select value={motionPreset} onValueChange={setMotionPreset}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTION_PRESETS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.emoji} {p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Tagy</Label>
            <div className="flex gap-1 mb-1.5 flex-wrap">
              {tags.map((t) => (
                <Badge key={t} className="bg-slate-700 text-slate-300 border-0 text-xs cursor-pointer hover:bg-red-500/30"
                  onClick={() => setTags(tags.filter(x => x !== t))}>
                  {t} <X className="w-2 h-2 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Přidat tag..."
                className="bg-slate-800 border-slate-700 text-white text-sm h-8"
              />
              <Button size="sm" variant="outline" onClick={addTag} className="border-slate-600 text-slate-300 h-8">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Button
            onClick={() => updateMutation.mutate({ id: char!.id, name, description, personality, voiceName, motionPreset, tags })}
            disabled={updateMutation.isPending || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
            Uložit postavu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Hlavní stránka ───────────────────────────────────────────────────────────
export default function Characters() {
  const { isAuthenticated } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editChar, setEditChar] = useState<Character | null>(null);
  const [motionChar, setMotionChar] = useState<Character | null>(null);
  const [generatingSoulIds, setGeneratingSoulIds] = useState<Set<number>>(new Set());
  const [generatingMotions, setGeneratingMotions] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Formulář pro novou postavu
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPersonality, setNewPersonality] = useState("");
  const [newVoiceName, setNewVoiceName] = useState("");

  const { data: characters, isLoading, refetch } = trpc.characters.list.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const { data: credits } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });

  const createMutation = trpc.characters.create.useMutation({
    onSuccess: () => {
      toast.success("Postava vytvořena!");
      setCreateOpen(false);
      setNewName(""); setNewDescription(""); setNewPersonality(""); setNewVoiceName("");
      refetch();
    },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const deleteMutation = trpc.characters.delete.useMutation({
    onSuccess: () => { toast.success("Postava smazána"); refetch(); },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const soulIdMutation = trpc.characters.generateSoulId.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Soul ID vygenerováno!");
      setGeneratingSoulIds(prev => { const s = new Set(prev); s.delete(vars.characterId); return s; });
      refetch();
    },
    onError: (e, vars) => {
      toast.error(`Soul ID chyba: ${e.message}`);
      setGeneratingSoulIds(prev => { const s = new Set(prev); s.delete(vars.characterId); return s; });
    },
  });

  const uploadMutation = trpc.upload.characterPhoto.useMutation({
    onSuccess: () => { toast.success("Fotka nahrána!"); refetch(); },
    onError: (e) => toast.error(`Upload chyba: ${e.message}`),
  });

  const removePhotoMutation = trpc.upload.removeCharacterPhoto.useMutation({
    onSuccess: () => { toast.success("Fotka odstraněna"); refetch(); },
    onError: (e) => toast.error(`Chyba: ${e.message}`),
  });

  const handleUploadPhoto = useCallback(async (charId: number, file: File, label: string, isMultiView: boolean) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      uploadMutation.mutate({ characterId: charId, base64, mimeType: file.type, label, isMultiView });
    };
    reader.readAsDataURL(file);
  }, [uploadMutation]);

  const handleGenerateSoulId = (charId: number) => {
    setGeneratingSoulIds(prev => new Set(prev).add(charId));
    soulIdMutation.mutate({ characterId: charId });
  };

  const chars = (characters ?? []) as Character[];
  const filtered = chars.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((c.tags as string[]) ?? []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Pro správu postav se přihlas</p>
          <a href={getLoginUrl()}><Button className="bg-blue-600 hover:bg-blue-500 text-white">Přihlásit se</Button></a>
        </div>
      </div>
    );
  }

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
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Soul Cinema — Archiv postav</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {credits && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{credits.balance}</span>
                <span className="text-xs text-slate-400">kreditů</span>
              </div>
            )}
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />Nová postava
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-16">
        <div className="container max-w-6xl">
          {/* Nadpis + vyhledávání */}
          <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Soul Cinema <span className="text-purple-400">Archiv</span>
              </h1>
              <p className="text-sm text-slate-400">
                {chars.length} postav — konzistentní Soul ID pro každou scénu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat postavu..."
                className="bg-slate-800/60 border-slate-700 text-white w-48 h-9 text-sm"
              />
            </div>
          </div>

          {/* Grid postav */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-700/50 rounded-2xl gap-4">
              <Users className="w-16 h-16 text-slate-700" />
              <div className="text-center">
                <p className="text-slate-400 font-medium">
                  {searchQuery ? "Žádná postava nenalezena" : "Zatím žádné postavy"}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {searchQuery ? "Zkus jiný vyhledávací dotaz" : "Vytvoř první postavu pro Soul Cinema konzistenci"}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => setCreateOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />Vytvořit první postavu
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((char) => (
                <CharacterCard
                  key={char.id}
                  char={char}
                  onDelete={() => deleteMutation.mutate({ characterId: char.id })}
                  onEdit={() => setEditChar(char)}
                  onGenerateSoulId={() => handleGenerateSoulId(char.id)}
                  onGenerateMotion={() => setMotionChar(char)}
                  onUploadPhoto={(file, label, isMultiView) => handleUploadPhoto(char.id, file, label, isMultiView)}
                  onRemovePhoto={(url) => removePhotoMutation.mutate({ characterId: char.id, imageUrl: url })}
                  isGeneratingSoulId={generatingSoulIds.has(char.id)}
                  isGeneratingMotion={generatingMotions.has(char.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Nová postava */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />Nová Soul Cinema postava
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Jméno *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="např. Plukovník Jack O'Neill"
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Vizuální popis</Label>
              <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Fyzický vzhled, věk, oblečení, výrazné rysy..."
                className="bg-slate-800 border-slate-700 text-white resize-none min-h-[80px] text-sm" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Osobnost</Label>
              <Input value={newPersonality} onChange={(e) => setNewPersonality(e.target.value)}
                placeholder="např. Sarkastický, odvážný, ochranitelský"
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Hlas (popis)</Label>
              <Input value={newVoiceName} onChange={(e) => setNewVoiceName(e.target.value)}
                placeholder="např. Hluboký, autoritativní, americký přízvuk"
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/40 rounded-lg p-2">
              <Film className="w-3 h-3 text-blue-400" />
              Po vytvoření nahraj referenční fotky a vygeneruj Soul ID pro konzistenci
            </div>
            <Button
              onClick={() => createMutation.mutate({ name: newName, description: newDescription, personality: newPersonality, voiceName: newVoiceName })}
              disabled={createMutation.isPending || !newName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
              Vytvořit postavu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editace */}
      <EditDialog
        char={editChar}
        open={!!editChar}
        onClose={() => setEditChar(null)}
        onSaved={() => refetch()}
      />

      {/* Dialog: Kling Motion */}
      <MotionDialog
        char={motionChar}
        open={!!motionChar}
        onClose={() => setMotionChar(null)}
      />
    </div>
  );
}
