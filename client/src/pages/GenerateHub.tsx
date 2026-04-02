import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  ImageIcon, VideoIcon, Wand2, Upload, Download, ArrowLeft,
  Sparkles, Layers, Film, Zap, ChevronRight, RefreshCw, X
} from "lucide-react";
import { CreditsWidget } from "@/components/CreditsWidget";

// ─── Types ────────────────────────────────────────────────────────────────────
type GenerationResult = {
  urls?: string[];
  videoUrl?: string | null;
  description?: string;
  seed?: number;
  generationId: number;
};

// ─── Image Upload Helper ──────────────────────────────────────────────────────
function useImageUpload() {
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadToServer = async (base64: string, mimeType: string): Promise<string> => {
    // For Generate Hub we store images directly as data URLs for now
    // In production these would be uploaded to S3
    return base64;
  };

  return { toBase64, uploadToServer };
}

// ─── Image Preview Component ──────────────────────────────────────────────────
function ImagePreview({ src, onRemove, label }: { src: string; onRemove?: () => void; label?: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-white/10">
      <img src={src} alt={label ?? "preview"} className="w-full h-32 object-cover" />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white px-2 py-0.5 truncate">
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Result Display ───────────────────────────────────────────────────────────
function ResultDisplay({ result, type }: { result: GenerationResult; type: "image" | "video" }) {
  if (type === "image" && result.urls && result.urls.length > 0) {
    return (
      <div className="space-y-3">
        <div className={`grid gap-2 ${result.urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {result.urls.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10">
              <img src={url} alt={`Result ${i + 1}`} className="w-full object-cover" />
              <a
                href={url}
                download={`generation-${result.generationId}-${i + 1}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-3 h-3" /> Stáhnout
              </a>
            </div>
          ))}
        </div>
        {result.description && (
          <p className="text-xs text-white/50 italic">{result.description}</p>
        )}
      </div>
    );
  }

  if (type === "video" && result.videoUrl) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
          <video src={result.videoUrl} controls className="w-full" />
        </div>
        <a
          href={result.videoUrl}
          download={`generation-${result.generationId}.mp4`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300"
        >
          <Download className="w-4 h-4" /> Stáhnout video
        </a>
      </div>
    );
  }

  return null;
}

// ─── Nano Banana 2 — T2I ──────────────────────────────────────────────────────
function NanoBananaT2ICard() {
  
  const utils = trpc.useUtils();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9">("1:1");
  const [resolution, setResolution] = useState<"0.5K" | "1K" | "2K" | "4K">("1K");
  const [numImages, setNumImages] = useState(1);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const mutation = trpc.generate.nanoBananaT2I.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.credits.balance.invalidate();
      toast.success('${data.urls.length} obrázek vygenerován.');
    },
    onError: (e) => toast.error(e.message),
  });

  const cost = 2 * numImages;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Nano Banana 2</h3>
          <p className="text-sm text-white/60">Google Gemini Flash — rychlá T2I generace</p>
        </div>
        <Badge className="ml-auto bg-blue-500/20 text-blue-300 border-blue-500/30">{cost} kreditů</Badge>
      </div>

      <Textarea
        placeholder="Popiš obrázek, který chceš vygenerovat... (např. 'Astronaut stojí na Marsu při západu slunce, cinematická fotografie')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Poměr stran</label>
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as typeof aspectRatio)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"].map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Rozlišení</label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as typeof resolution)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["0.5K", "1K", "2K", "4K"].map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Počet ({numImages}x)</label>
          <Slider
            value={[numImages]}
            onValueChange={([v]) => setNumImages(v)}
            min={1} max={4} step={1}
            className="mt-3"
          />
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate({ prompt, aspectRatio, resolution, numImages })}
        disabled={mutation.isPending || prompt.trim().length < 3}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
      >
        {mutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generuji...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" /> Generovat ({cost} kreditů)</>
        )}
      </Button>

      {result && <ResultDisplay result={result} type="image" />}
    </div>
  );
}

// ─── Nano Banana 2 — Edit ─────────────────────────────────────────────────────
function NanoBananaEditCard() {
  
  const utils = trpc.useUtils();
  const { toBase64 } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [result, setResult] = useState<GenerationResult | null>(null);

  const mutation = trpc.generate.nanoBananaEdit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.credits.balance.invalidate();
      toast.success('Obrázek upraven.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setImagePreview(b64);
    setImageUrl(b64);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Nano Banana 2 Edit</h3>
          <p className="text-sm text-white/60">Editace obrázku přirozeným jazykem</p>
        </div>
        <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30">3 kredity</Badge>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
      >
        {imagePreview ? (
          <ImagePreview src={imagePreview} onRemove={() => { setImagePreview(""); setImageUrl(""); }} label="Vstupní obrázek" />
        ) : (
          <div className="py-4">
            <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/50">Klikni pro nahrání obrázku</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <Textarea
        placeholder="Popiš úpravy... (např. 'Změň pozadí na hvězdnou oblohu' nebo 'Přidej sluneční brýle')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-white/50 mb-1 block">Poměr stran</label>
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as typeof aspectRatio)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["1:1", "16:9", "9:16", "4:3", "3:4"].map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate({ prompt, imageUrl, aspectRatio })}
        disabled={mutation.isPending || !imageUrl || prompt.trim().length < 3}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
      >
        {mutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Upravuji...</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" /> Upravit obrázek (3 kredity)</>
        )}
      </Button>

      {result && <ResultDisplay result={result} type="image" />}
    </div>
  );
}

// ─── Seedream 5 — Multi-Image Edit ───────────────────────────────────────────
function Seedream5Card() {
  
  const utils = trpc.useUtils();
  const { toBase64 } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageSize, setImageSize] = useState<"square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9" | "auto_2K" | "auto_3K">("auto_2K");
  const [numImages, setNumImages] = useState(1);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const mutation = trpc.generate.seedream5Edit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.credits.balance.invalidate();
      toast.success('${data.urls.length} obrázek vygenerován.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - imageUrls.length);
    for (const file of files) {
      const b64 = await toBase64(file);
      setImagePreviews(prev => [...prev, b64]);
      setImageUrls(prev => [...prev, b64]);
    }
  };

  const removeImage = (idx: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const cost = 4 * numImages;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Seedream 5 Lite Edit</h3>
          <p className="text-sm text-white/60">ByteDance — multi-image editace (až 10 fotek)</p>
        </div>
        <Badge className="ml-auto bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{cost} kreditů</Badge>
      </div>

      <div className="space-y-2">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-3 cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          {imagePreviews.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((src, i) => (
                <ImagePreview key={i} src={src} onRemove={() => removeImage(i)} label={`Figure ${i + 1}`} />
              ))}
              {imagePreviews.length < 10 && (
                <div className="h-32 border border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/30 text-xs">
                  + Přidat
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <Layers className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/50">Nahraj 1–10 obrázků</p>
              <p className="text-xs text-white/30 mt-1">V promptu je referuj jako Figure 1, Figure 2...</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        </div>
      </div>

      <Textarea
        placeholder="Popiš co chceš vytvořit... (např. 'Kombinuj Figure 1 a Figure 2 do jedné scény, Figure 1 drží Figure 2 za ruku')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Výstupní velikost</label>
          <Select value={imageSize} onValueChange={(v) => setImageSize(v as typeof imageSize)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto_2K">Auto 2K</SelectItem>
              <SelectItem value="auto_3K">Auto 3K</SelectItem>
              <SelectItem value="square_hd">Čtverec HD</SelectItem>
              <SelectItem value="landscape_16_9">Landscape 16:9</SelectItem>
              <SelectItem value="portrait_16_9">Portrait 16:9</SelectItem>
              <SelectItem value="landscape_4_3">Landscape 4:3</SelectItem>
              <SelectItem value="portrait_4_3">Portrait 4:3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Počet výstupů ({numImages}x)</label>
          <Slider
            value={[numImages]}
            onValueChange={([v]) => setNumImages(v)}
            min={1} max={4} step={1}
            className="mt-3"
          />
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate({ prompt, imageUrls, imageSize, numImages })}
        disabled={mutation.isPending || imageUrls.length === 0 || prompt.trim().length < 3}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
      >
        {mutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generuji...</>
        ) : (
          <><Layers className="w-4 h-4 mr-2" /> Generovat ({cost} kreditů)</>
        )}
      </Button>

      {result && <ResultDisplay result={result} type="image" />}
    </div>
  );
}

// ─── Kling Motion Control ─────────────────────────────────────────────────────
function KlingMotionControlCard() {
  
  const utils = trpc.useUtils();
  const { toBase64 } = useImageUpload();
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [motionVideoUrl, setMotionVideoUrl] = useState("");
  const [motionVideoPreview, setMotionVideoPreview] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [result, setResult] = useState<GenerationResult | null>(null);

  const mutation = trpc.generate.klingMotionControl.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.credits.balance.invalidate();
      toast.success('Kling Motion Control video vygenerováno.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setImagePreview(b64);
    setImageUrl(b64);
  };

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMotionVideoPreview(url);
    // For motion control we need a URL — in production upload to S3
    // For now use object URL (works for preview, actual generation needs real URL)
    setMotionVideoUrl(url);
    toast.info('Pro produkční použití nahraj video na cloud storage a vlož URL.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Kling Motion Control</h3>
          <p className="text-sm text-white/60">Přenos pohybu z referenčního videa na obrázek</p>
        </div>
        <Badge className="ml-auto bg-orange-500/20 text-orange-300 border-orange-500/30">8 kreditů</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Zdrojový obrázek (postava)</label>
          <div
            onClick={() => imgRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-3 cursor-pointer hover:border-orange-500/50 transition-colors h-32 flex items-center justify-center"
          >
            {imagePreview ? (
              <img src={imagePreview} className="h-full w-full object-cover rounded-lg" alt="source" />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-6 h-6 text-white/30 mx-auto mb-1" />
                <p className="text-xs text-white/40">Nahrát obrázek</p>
              </div>
            )}
            <input ref={imgRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Referenční video (pohyb)</label>
          <div
            onClick={() => vidRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-3 cursor-pointer hover:border-orange-500/50 transition-colors h-32 flex items-center justify-center"
          >
            {motionVideoPreview ? (
              <video src={motionVideoPreview} className="h-full w-full object-cover rounded-lg" muted />
            ) : (
              <div className="text-center">
                <VideoIcon className="w-6 h-6 text-white/30 mx-auto mb-1" />
                <p className="text-xs text-white/40">Nahrát video (3–10s)</p>
              </div>
            )}
            <input ref={vidRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
          </div>
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-xs text-orange-300">
        <strong>Tip:</strong> Nahraj video s pohybem (chůze, tanec, gesto) a obrázek postavy. Kling přenese pohyb z videa na tvou postavu.
      </div>

      <Textarea
        placeholder="Volitelný popis pohybu... (např. 'Postava kráčí pomalu kupředu, cinematický záběr')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[60px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Délka videa</label>
          <Select value={duration} onValueChange={(v) => setDuration(v as "5" | "10")}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 sekund</SelectItem>
              <SelectItem value="10">10 sekund</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Poměr stran</label>
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as typeof aspectRatio)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
              <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
              <SelectItem value="1:1">1:1 (Čtverec)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate({ imageUrl, motionVideoUrl, prompt: prompt || undefined, duration, aspectRatio })}
        disabled={mutation.isPending || !imageUrl || !motionVideoUrl}
        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
      >
        {mutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generuji (může trvat 2–5 min)...</>
        ) : (
          <><Film className="w-4 h-4 mr-2" /> Spustit Motion Control (8 kreditů)</>
        )}
      </Button>

      {result && <ResultDisplay result={result} type="video" />}
    </div>
  );
}

// ─── Kling Video Edit ─────────────────────────────────────────────────────────
function KlingVideoEditCard() {
  
  const utils = trpc.useUtils();
  const { toBase64 } = useImageUpload();
  const vidRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [keepAudio, setKeepAudio] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const mutation = trpc.generate.klingVideoEdit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.credits.balance.invalidate();
      toast.success('Video editováno.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setVideoUrl(url);
  };

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - imageUrls.length);
    for (const file of files) {
      const b64 = await toBase64(file);
      setImagePreviews(prev => [...prev, b64]);
      setImageUrls(prev => [...prev, b64]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <VideoIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Kling O1 Video Edit</h3>
          <p className="text-sm text-white/60">Video-to-video editace přirozeným jazykem</p>
        </div>
        <Badge className="ml-auto bg-cyan-500/20 text-cyan-300 border-cyan-500/30">10 kreditů</Badge>
      </div>

      <div>
        <label className="text-xs text-white/50 mb-1 block">Vstupní video (3–10s, max 200MB)</label>
        <div
          onClick={() => vidRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          {videoPreview ? (
            <video src={videoPreview} controls className="w-full rounded-lg max-h-40" />
          ) : (
            <div className="text-center py-4">
              <VideoIcon className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/50">Klikni pro nahrání videa</p>
              <p className="text-xs text-white/30 mt-1">MP4/MOV, 720–2160px, 3–10 sekund</p>
            </div>
          )}
          <input ref={vidRef} type="file" accept="video/mp4,video/mov,video/quicktime" onChange={handleVideo} className="hidden" />
        </div>
      </div>

      <div>
        <label className="text-xs text-white/50 mb-1 block">Referenční obrázky (volitelné, max 4) — použij @Image1, @Image2 v promptu</label>
        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} className="w-16 h-16 object-cover rounded-lg border border-white/10" alt={`ref ${i + 1}`} />
              <button
                onClick={() => { setImagePreviews(p => p.filter((_, j) => j !== i)); setImageUrls(p => p.filter((_, j) => j !== i)); }}
                className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-white bg-black/60 rounded-b-lg">@Image{i + 1}</span>
            </div>
          ))}
          {imagePreviews.length < 4 && (
            <div
              onClick={() => imgRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors"
            >
              <Upload className="w-4 h-4 text-white/30" />
              <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
            </div>
          )}
        </div>
      </div>

      <Textarea
        placeholder="Popiš změny... (např. 'Změň oblečení postavy na středověkou zbroj @Image1' nebo 'Přidej dramatické osvětlení a mlhu')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={() => setKeepAudio(!keepAudio)}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            keepAudio ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-white/5 border-white/10 text-white/50"
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${keepAudio ? "bg-cyan-400" : "bg-white/20"}`} />
          Zachovat audio
        </button>
      </div>

      <Button
        onClick={() => mutation.mutate({ prompt, videoUrl, imageUrls: imageUrls.length > 0 ? imageUrls : undefined, keepAudio })}
        disabled={mutation.isPending || !videoUrl || prompt.trim().length < 5}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
      >
        {mutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Edituje se (může trvat 5–15 min)...</>
        ) : (
          <><VideoIcon className="w-4 h-4 mr-2" /> Editovat video (10 kreditů)</>
        )}
      </Button>

      {result && <ResultDisplay result={result} type="video" />}
    </div>
  );
}

// ─── Kling I2V ────────────────────────────────────────────────────────────────
function KlingI2VCard() {
  
  const utils = trpc.useUtils();
  const { toBase64 } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [cfgScale, setCfgScale] = useState(0.5);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const mutation = trpc.generate.klingI2V.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.credits.balance.invalidate();
      toast.success('Kling 3.0 Pro I2V video vygenerováno.');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setImagePreview(b64);
    setImageUrl(b64);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Kling 3.0 Pro I2V</h3>
          <p className="text-sm text-white/60">Obrázek → Video s cinematickým pohybem</p>
        </div>
        <Badge className="ml-auto bg-yellow-500/20 text-yellow-300 border-yellow-500/30">5 kreditů</Badge>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-white/20 rounded-xl p-4 cursor-pointer hover:border-yellow-500/50 transition-colors"
      >
        {imagePreview ? (
          <ImagePreview src={imagePreview} onRemove={() => { setImagePreview(""); setImageUrl(""); }} label="Zdrojový obrázek" />
        ) : (
          <div className="text-center py-4">
            <ImageIcon className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-sm text-white/50">Klikni pro nahrání obrázku</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <Textarea
        placeholder="Popiš pohyb a akci... (např. 'Postava se pomalu otáčí, vítr jí pohybuje vlasy, cinematické osvětlení')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Délka</label>
          <Select value={duration} onValueChange={(v) => setDuration(v as "5" | "10")}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 sekund</SelectItem>
              <SelectItem value="10">10 sekund</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Poměr stran</label>
          <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as typeof aspectRatio)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs text-white/50 mb-1 block">Kreativita: {cfgScale.toFixed(1)} (0 = volné, 1 = přesné)</label>
        <Slider
          value={[cfgScale]}
          onValueChange={([v]) => setCfgScale(v)}
          min={0} max={1} step={0.1}
        />
      </div>

      <Button
        onClick={() => mutation.mutate({ imageUrl, prompt, duration, aspectRatio, cfgScale })}
        disabled={mutation.isPending || !imageUrl || prompt.trim().length < 3}
        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white"
      >
        {mutation.isPending ? (
          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generuji...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Generovat video (5 kreditů)</>
        )}
      </Button>

      {result && <ResultDisplay result={result} type="video" />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GenerateHub() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-sm">
          <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Přihlášení vyžadováno</h2>
          <p className="text-white/60 mb-4">Pro přístup k Generate Hub se musíš přihlásit.</p>
          <Link href="/">
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-black">Zpět na hlavní stránku</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm leading-none">Generate Hub</h1>
                <p className="text-[10px] text-white/40">AI Generátor Médií</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditsWidget />
            <Link href="/studio">
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs">
                Studio <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            AI Generate Hub
          </h2>
          <p className="text-white/60 max-w-2xl">
            Kompletní sada AI generovacích nástrojů — obrázky, videa, editace. Každý model je optimalizován pro jiný typ obsahu.
          </p>
        </div>

        {/* Model Grid */}
        <Tabs defaultValue="images" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="images" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">
              <ImageIcon className="w-4 h-4 mr-2" /> Obrázky
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">
              <VideoIcon className="w-4 h-4 mr-2" /> Videa
            </TabsTrigger>
            <TabsTrigger value="edit" className="data-[state=active]:bg-white/10 text-white/60 data-[state=active]:text-white">
              <Wand2 className="w-4 h-4 mr-2" /> Editace
            </TabsTrigger>
          </TabsList>

          {/* Images Tab */}
          <TabsContent value="images">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <NanoBananaT2ICard />
              </Card>
              <Card className="bg-white/5 border-white/10 p-6">
                <NanoBananaEditCard />
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <KlingI2VCard />
              </Card>
              <Card className="bg-white/5 border-white/10 p-6">
                <KlingMotionControlCard />
              </Card>
            </div>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <Seedream5Card />
              </Card>
              <Card className="bg-white/5 border-white/10 p-6">
                <KlingVideoEditCard />
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pricing Overview */}
        <div className="mt-10 border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Ceník kreditů
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Nano Banana 2 T2I", cost: "2 kr/obr", color: "blue" },
              { name: "Nano Banana 2 Edit", cost: "3 kr", color: "purple" },
              { name: "Seedream 5 Edit", cost: "4 kr/obr", color: "emerald" },
              { name: "Kling 3.0 I2V", cost: "5 kr", color: "yellow" },
              { name: "Kling Motion Control", cost: "8 kr", color: "orange" },
              { name: "Kling Video Edit", cost: "10 kr", color: "cyan" },
            ].map(({ name, cost, color }) => (
              <div key={name} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-3 text-center`}>
                <p className="text-xs text-white/60 mb-1">{name}</p>
                <p className={`text-sm font-bold text-${color}-300`}>{cost}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
