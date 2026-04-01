import React, { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Film, ChevronLeft, Plus, Users, Loader2, Star, Mic, Trash2, Upload,
  X, Image as ImageIcon, CheckCircle2, AlertCircle, Camera
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getLoginUrl } from "@/const";

type ReferenceImage = { url: string; label: string; isMultiView: boolean };

export default function Characters() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [voiceName, setVoiceName] = useState("");

  const { data: characters, isLoading, refetch } = trpc.characters.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.characters.create.useMutation({
    onSuccess: () => {
      toast.success("Postava vytvořena!");
      setOpen(false);
      setName(""); setDescription(""); setPersonality(""); setVoiceName("");
      refetch();
    },
    onError: (err: { message: string }) => toast.error(`Chyba: ${err.message}`),
  });

  const deleteMutation = trpc.characters.delete.useMutation({
    onSuccess: () => { toast.success("Postava smazána"); refetch(); },
    onError: (err: { message: string }) => toast.error(`Chyba: ${err.message}`),
  });

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Jméno je povinné"); return; }
    createMutation.mutate({ name, description, personality, voiceName });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.08_0.02_240)]">
        <div className="text-center">
          <Users className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white/80 mb-2">Přihlaste se pro správu postav</h2>
          <a href={getLoginUrl()}>
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black">Přihlásit se</Button>
          </a>
        </div>
      </div>
    );
  }

  const chars = (characters ?? []) as Array<{
    id: number; name: string; description?: string | null; personality?: string | null;
    voiceName?: string | null; referenceImages?: ReferenceImage[] | null; soulId?: string | null;
  }>;

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.02_240)]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">← Zpět</Link>
            <span className="text-white/20">|</span>
            <h1 className="text-lg font-bold text-white/90 font-['Orbitron'] tracking-wider">
              SOUL CINEMA — POSTAVY
            </h1>
            {chars && (
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                {chars.length} postav
              </Badge>
            )}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Nová postava
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[oklch(0.12_0.02_240)] border-white/20 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-['Orbitron'] text-white/90">VYTVOŘIT POSTAVU</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs font-semibold text-white/60 uppercase mb-1 block">Jméno *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Colonel Jack O'Neill" className="bg-white/5 border-white/20 text-white/90" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-white/60 uppercase mb-1 block">Vizuální popis</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fyzický vzhled, věk, oblečení, charakteristické rysy..." className="bg-white/5 border-white/20 text-white/90 resize-none min-h-[80px]" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-white/60 uppercase mb-1 block">Osobnost</Label>
                  <Input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="např. Sarkastický, odvážný, ochránce týmu" className="bg-white/5 border-white/20 text-white/90" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-white/60 uppercase mb-1 block">Styl hlasu</Label>
                  <Input value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="např. Hluboký, autoritativní, americký přízvuk" className="bg-white/5 border-white/20 text-white/90" />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                  VYTVOŘIT POSTAVU
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white/90 mb-2 font-['Orbitron']">
            SOUL CINEMA <span className="text-cyan-400">POSTAVY</span>
          </h2>
          <p className="text-sm text-white/50 max-w-3xl">
            Vytvořte konzistentní profily postav pro vizuální kontinuitu napříč všemi scénami.
            Každá postava dostane unikátní <strong>Soul ID</strong>, které udržuje její vzhled v celém filmu.
          </p>
          <div className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-white/70">
                <strong className="text-cyan-400">Tip:</strong> Pro nejlepší výsledky nahrajte <strong>"character sheet"</strong> — jednu fotku se 4 záběry z různých úhlů (přední, boční, 3/4, detail obličeje). AI tak získá kompletní 3D pochopení obličeje.
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : chars.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/20 rounded-xl gap-4">
            <Users className="w-16 h-16 text-white/20" />
            <div className="text-center">
              <p className="text-white/60 mb-1">Zatím žádné postavy</p>
              <p className="text-xs text-white/40">Vytvořte první postavu pro aktivaci Soul Cinema konzistence</p>
            </div>
            <Button variant="outline" onClick={() => setOpen(true)} className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-semibold">
              <Plus className="w-4 h-4 mr-2" />VYTVOŘIT PRVNÍ POSTAVU
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chars.map((char) => (
              <CharacterCard key={char.id} character={char} onDelete={() => deleteMutation.mutate({ characterId: char.id })} onRefetch={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterCard({ character, onDelete, onRefetch }: {
  character: {
    id: number; name: string; description?: string | null; personality?: string | null;
    voiceName?: string | null; referenceImages?: ReferenceImage[] | null; soulId?: string | null;
  };
  onDelete: () => void;
  onRefetch: () => void;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.characterPhoto.useMutation({
    onSuccess: () => {
      toast.success("Fotka nahrána!");
      onRefetch();
    },
    onError: (err: { message: string }) => toast.error(`Chyba: ${err.message}`),
  });

  const removeMutation = trpc.upload.removeCharacterPhoto.useMutation({
    onSuccess: () => {
      toast.success("Fotka odstraněna");
      onRefetch();
    },
    onError: (err: { message: string }) => toast.error(`Chyba: ${err.message}`),
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Pouze obrázky jsou podporovány");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await uploadMutation.mutateAsync({
          characterId: character.id,
          base64,
          mimeType: file.type,
          label: "Referenční fotka",
          isMultiView: false,
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const images = character.referenceImages ?? [];
  const hasImages = images.length > 0;

  return (
    <Card className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden p-4">
      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
              {hasImages ? (
                <img src={images[0]?.url} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-6 h-6 text-cyan-400/60" />
              )}
            </div>
            <div>
              <h3 className="font-['Orbitron'] text-sm font-bold text-white/90">{character.name}</h3>
              {character.soulId && (
                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30 mt-1">
                  <CheckCircle2 className="w-2 h-2 mr-1" /> Soul ID
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-white/40 hover:text-red-400" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Description */}
        {character.description && (
          <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-2">{character.description}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {character.personality && (
            <Badge variant="outline" className="text-xs border-white/20 text-white/50">
              <Star className="w-2 h-2 mr-1" />{character.personality.substring(0, 20)}
            </Badge>
          )}
          {character.voiceName && (
            <Badge variant="outline" className="text-xs border-white/20 text-white/50">
              <Mic className="w-2 h-2 mr-1" />{character.voiceName.substring(0, 20)}
            </Badge>
          )}
        </div>

        {/* Reference images gallery */}
        {hasImages && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-2">
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-white/60 font-semibold">Referenční fotky ({images.length}/5)</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded overflow-hidden border border-white/10 group/img">
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMutation.mutate({ characterId: character.id, imageUrl: img.url })}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {img.isMultiView && (
                    <div className="absolute bottom-0 left-0 right-0 bg-cyan-500/80 text-black text-[8px] text-center py-0.5 font-bold">
                      MULTI
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 text-xs">
              <Upload className="w-3 h-3 mr-1" /> {hasImages ? "Přidat fotku" : "Nahrát referenční fotky"}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[oklch(0.12_0.02_240)] border-white/20 max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-['Orbitron'] text-white/90">NAHRÁT REFERENČNÍ FOTKY</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-white/70">
                    <strong className="text-cyan-400">Doporučení:</strong> Nahrajte "character sheet" (1 fotka se 4 záběry z různých úhlů) pro nejlepší konzistenci, nebo až 5 samostatných fotek.
                  </div>
                </div>
              </div>

              {/* Drag & drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  dragActive ? "border-cyan-400 bg-cyan-500/10" : "border-white/20 hover:border-cyan-500/50 hover:bg-white/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                )}
                <p className="text-sm text-white/70 font-semibold mb-1">
                  {uploading ? "Nahrávám..." : "Klikněte nebo přetáhněte fotku"}
                </p>
                <p className="text-xs text-white/40">PNG, JPG, WEBP (max 10MB)</p>
              </div>

              {/* Current images count */}
              <div className="text-center text-xs text-white/50">
                {images.length}/5 fotek nahráno
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
