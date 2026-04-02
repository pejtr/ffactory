import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { ArrowLeft, Sparkles, Image, Film, RefreshCw, Download, Zap, Wand2, X } from "lucide-react";

type ActiveTab = "images" | "videos" | "edit";

export default function GenerateHub() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("images");
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgModel, setImgModel] = useState<"nano-banana" | "seedream">("nano-banana");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidImageUrl, setVidImageUrl] = useState("");
  const [vidDuration, setVidDuration] = useState<"5" | "10">("5");
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const nanoBananaMutation = trpc.generate.nanoBanana.useMutation({
    onSuccess: (data) => { setGeneratedImage(data.imageUrl ?? null); toast.success("Obrazek vygenerovan"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const seedreamMutation = trpc.generate.seedream.useMutation({
    onSuccess: (data) => { setGeneratedImage(data.imageUrl ?? null); toast.success("Obrazek vygenerovan"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const klingI2VMutation = trpc.generate.klingI2V.useMutation({
    onSuccess: (data) => { setGeneratedVideo(data.videoUrl ?? null); toast.success("Video vygenerovano"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const TABS = [
    { id: "images" as ActiveTab, label: "Obrazky", icon: <Image className="w-3.5 h-3.5" /> },
    { id: "videos" as ActiveTab, label: "Videa", icon: <Film className="w-3.5 h-3.5" /> },
    { id: "edit" as ActiveTab, label: "Editace", icon: <Wand2 className="w-3.5 h-3.5" /> },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="font-display text-xl mb-2">Generate Hub</h2>
          <p className="text-muted-foreground mb-6">Prihlaste se pro pristup ke generovani</p>
          <a href={getLoginUrl()}><Button className="glow-blue">Prihlasit se</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[oklch(0.18_0.03_230)] bg-[oklch(0.08_0.02_240)/80] backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/"><button className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></button></Link>
          <div className="w-px h-4 bg-border" />
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="font-display text-sm tracking-wider text-foreground">GENERATE HUB</span>
          <div className="ml-auto flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${activeTab === tab.id ? "bg-accent/20 border border-accent/40 text-accent" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "images" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-5">
              <h3 className="font-display text-sm text-foreground mb-4 flex items-center gap-2"><Image className="w-4 h-4 text-purple-400" />Generovat obrazek</h3>
              <div className="flex gap-2 mb-3">
                {[{id: "nano-banana" as const, label: "Nano Banana 2", cost: 2}, {id: "seedream" as const, label: "Seedream 5", cost: 3}].map(m => (
                  <button key={m.id} onClick={() => setImgModel(m.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs border transition-colors ${imgModel === m.id ? "bg-accent/20 border-accent/40 text-accent" : "bg-[oklch(0.08_0.02_240)] border-[oklch(0.20_0.03_230)] text-muted-foreground"}`}>
                    <div>{m.label}</div><div className="text-[10px] text-muted-foreground">{m.cost} kr</div>
                  </button>
                ))}
              </div>
              <Textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
                placeholder="Popis obrazku..." rows={4}
                className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)] resize-none mb-3" />
              <Button onClick={() => imgModel === "nano-banana" ? nanoBananaMutation.mutate({ prompt: imgPrompt }) : seedreamMutation.mutate({ prompt: imgPrompt })}
                disabled={!imgPrompt.trim() || nanoBananaMutation.isPending || seedreamMutation.isPending}
                className="glow-blue w-full">
                {(nanoBananaMutation.isPending || seedreamMutation.isPending) ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generuji...</> : <><Sparkles className="w-4 h-4 mr-2" />Generovat</>}
              </Button>
            </Card>
            <div>
              {!generatedImage ? (
                <div className="h-full min-h-[300px] border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl flex items-center justify-center">
                  <div className="text-center"><Image className="w-10 h-10 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Vysledek se zobrazi zde</p></div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-[oklch(0.22_0.03_230)]">
                  <img src={generatedImage} alt="Generated" className="w-full" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <a href={generatedImage} download className="bg-black/60 hover:bg-black/80 p-2 rounded-lg transition-colors"><Download className="w-4 h-4 text-white" /></a>
                    <button onClick={() => setGeneratedImage(null)} className="bg-black/60 hover:bg-black/80 p-2 rounded-lg transition-colors"><X className="w-4 h-4 text-white" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "videos" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-5">
              <h3 className="font-display text-sm text-foreground mb-4 flex items-center gap-2"><Film className="w-4 h-4 text-blue-400" />Kling Image-to-Video</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">URL vstupniho obrazku *</label>
                  <Input value={vidImageUrl} onChange={e => setVidImageUrl(e.target.value)} placeholder="https://..." className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Popis pohybu</label>
                  <Textarea value={vidPrompt} onChange={e => setVidPrompt(e.target.value)} placeholder="Popis pohybu..." rows={3} className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)] resize-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Delka</label>
                  <Select value={vidDuration} onValueChange={v => setVidDuration(v as "5" | "10")}>
                    <SelectTrigger className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="5">5 sekund</SelectItem><SelectItem value="10">10 sekund</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button onClick={() => klingI2VMutation.mutate({ imageUrl: vidImageUrl, prompt: vidPrompt, duration: vidDuration })}
                  disabled={!vidImageUrl.trim() || klingI2VMutation.isPending} className="glow-blue w-full">
                  {klingI2VMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generuji...</> : <><Zap className="w-4 h-4 mr-2" />Kling I2V (15 kr)</>}
                </Button>
              </div>
            </Card>
            <div>
              {!generatedVideo ? (
                <div className="h-full min-h-[300px] border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl flex items-center justify-center">
                  <div className="text-center"><Film className="w-10 h-10 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Video se zobrazi zde</p></div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-[oklch(0.22_0.03_230)]">
                  <video src={generatedVideo} controls className="w-full" />
                  <div className="absolute top-2 right-2">
                    <a href={generatedVideo} download className="bg-black/60 hover:bg-black/80 p-2 rounded-lg transition-colors inline-block"><Download className="w-4 h-4 text-white" /></a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "edit" && (
          <div className="text-center py-16">
            <Wand2 className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">Kling Video Edit</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Editace videi pomoci prirodzeneho jazyka. Dostupne v Characters Studio.</p>
            <Link href="/characters"><Button className="glow-blue"><Film className="w-4 h-4 mr-2" />Otevrit Characters Studio</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
