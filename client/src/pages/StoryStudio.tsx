import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BookOpen, Plus, Sparkles, ArrowLeft, Trash2, ChevronRight,
  Globe, FileText, Zap, BarChart2, Lightbulb, Target, TrendingUp,
  Users, Brain, Layers, Flame, Trophy, ExternalLink
} from "lucide-react";
import { CreditsWidget } from "@/components/CreditsWidget";
import { getLoginUrl } from "@/const";

// ─── Types ────────────────────────────────────────────────────────────────────
type ContentStyle = "educational" | "storytelling" | "explainer" | "documentary" | "entertainment" | "news" | "tutorial";

const STYLE_LABELS: Record<ContentStyle, string> = {
  educational: "Vzdělávací",
  storytelling: "Storytelling",
  explainer: "Explainer",
  documentary: "Dokumentární",
  entertainment: "Zábavný",
  news: "Zpravodajský",
  tutorial: "Tutorial",
};

const STYLE_ICONS: Record<ContentStyle, React.ReactNode> = {
  educational: <Brain className="w-4 h-4" />,
  storytelling: <BookOpen className="w-4 h-4" />,
  explainer: <Lightbulb className="w-4 h-4" />,
  documentary: <Globe className="w-4 h-4" />,
  entertainment: <Sparkles className="w-4 h-4" />,
  news: <BarChart2 className="w-4 h-4" />,
  tutorial: <Layers className="w-4 h-4" />,
};

// ─── Viral Score Leaderboard ─────────────────────────────────────────────────
function ViralScoreLeaderboard() {
  const { user } = useAuth();
  const { data: topSources, isLoading } = trpc.story.sources.topViral.useQuery(
    { limit: 5 },
    { enabled: !!user }
  );

  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h2 className="font-display text-base text-foreground">TOP VIRAL ZDROJE</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[oklch(0.10_0.02_240)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!topSources || topSources.length === 0) return null;

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    const s = score / 10;
    if (s >= 8) return "text-red-400";
    if (s >= 6) return "text-orange-400";
    if (s >= 4) return "text-yellow-400";
    if (s >= 2) return "text-blue-400";
    return "text-muted-foreground";
  };

  const getScoreBg = (score: number | null) => {
    if (!score) return "bg-[oklch(0.10_0.02_240)]";
    const s = score / 10;
    if (s >= 8) return "bg-red-950/40 border-red-500/30";
    if (s >= 6) return "bg-orange-950/40 border-orange-500/30";
    if (s >= 4) return "bg-yellow-950/40 border-yellow-500/30";
    if (s >= 2) return "bg-blue-950/40 border-blue-500/30";
    return "bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)]";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <span className="text-yellow-400 text-base">🥇</span>;
    if (rank === 1) return <span className="text-slate-300 text-base">🥈</span>;
    if (rank === 2) return <span className="text-amber-600 text-base">🥉</span>;
    return <span className="font-mono text-xs text-muted-foreground">#{rank + 1}</span>;
  };

  // SVG arc gauge (mini)
  const MiniGauge = ({ score }: { score: number | null }) => {
    const s = (score ?? 0) / 100;
    const r = 18;
    const cx = 22;
    const cy = 22;
    const startAngle = -225;
    const sweepAngle = 270;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const arcX = (angle: number) => cx + r * Math.cos(toRad(angle));
    const arcY = (angle: number) => cy + r * Math.sin(toRad(angle));
    const endAngle = startAngle + sweepAngle * s;
    const largeArc = sweepAngle * s > 180 ? 1 : 0;
    const trackPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 1 1 ${arcX(startAngle + sweepAngle - 0.01)} ${arcY(startAngle + sweepAngle - 0.01)}`;
    const fillPath = s > 0
      ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(endAngle)} ${arcY(endAngle)}`
      : "";
    const scoreColor = score && score >= 80 ? "#f87171" : score && score >= 60 ? "#fb923c" : score && score >= 40 ? "#facc15" : "#60a5fa";
    return (
      <svg width="44" height="44" viewBox="0 0 44 44">
        <path d={trackPath} fill="none" stroke="oklch(0.22 0.03 230)" strokeWidth="3" strokeLinecap="round" />
        {fillPath && <path d={fillPath} fill="none" stroke={scoreColor} strokeWidth="3" strokeLinecap="round" />}
        <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="bold" fill={scoreColor}>
          {score ? (score / 10).toFixed(1) : "–"}
        </text>
      </svg>
    );
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h2 className="font-display text-base text-foreground tracking-wider">TOP VIRAL ZDROJE</h2>
          <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400 px-1.5 py-0">LIVE</Badge>
        </div>
        <span className="text-xs text-muted-foreground">Napříč všemi notebooky</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {topSources.map((src, i) => (
          <Link key={src.id} href={`/story/${src.notebookId}`}>
            <Card className={`border p-3 hover:scale-[1.02] transition-all cursor-pointer h-full ${getScoreBg(src.viralScore)}`}>
              {/* Rank + gauge row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {getRankIcon(i)}
                </div>
                <MiniGauge score={src.viralScore} />
              </div>

              {/* Title */}
              <p className="text-xs font-medium text-foreground line-clamp-2 mb-1.5 leading-tight">
                {src.title ?? (src.url ? new URL(src.url).hostname : "Zdroj bez názvu")}
              </p>

              {/* Notebook badge */}
              <div className="flex items-center gap-1 mt-auto">
                <BookOpen className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground truncate">{src.notebookTitle}</span>
              </div>

              {/* Score label */}
              <div className={`flex items-center gap-1 mt-1.5 ${getScoreColor(src.viralScore)}`}>
                <Flame className="w-3 h-3" />
                <span className="text-[10px] font-mono font-bold">
                  {src.viralScore ? (src.viralScore / 10).toFixed(1) : "–"} / 10
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Create Notebook Dialog ───────────────────────────────────────────────────
function CreateNotebookDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [contentStyle, setContentStyle] = useState<ContentStyle>("educational");
  const [language, setLanguage] = useState("cs");
  const [description, setDescription] = useState("");

  const createMutation = trpc.story.notebooks.create.useMutation({
    onSuccess: (data) => {
      toast.success("Notebook vytvořen");
      onCreated(data.id!);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)]">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-foreground">Nový Story Notebook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Název projektu *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Např. Věda pro děti — YouTube kanál"
              className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nika / Téma</label>
            <Input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="Např. věda, historie, psychologie, finance..."
              className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Styl obsahu</label>
              <Select value={contentStyle} onValueChange={v => setContentStyle(v as ContentStyle)}>
                <SelectTrigger className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STYLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Jazyk</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Čeština</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sk">Slovenčina</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Popis (volitelný)</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Krátký popis projektu a cíle..."
              rows={2}
              className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)] resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Zrušit</Button>
            <Button
              onClick={() => createMutation.mutate({ title, niche, contentStyle, language, description })}
              disabled={!title.trim() || createMutation.isPending}
              className="flex-1 glow-blue"
            >
              {createMutation.isPending ? "Vytvářím..." : "Vytvořit Notebook"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Notebook Card ────────────────────────────────────────────────────────────
function NotebookCard({ notebook, onDelete }: {
  notebook: { id: number; title: string; niche?: string | null; contentStyle: ContentStyle; language: string; aiAnalysis?: unknown; videoIdeas?: unknown; createdAt: Date };
  onDelete: (id: number) => void;
}) {
  const [, navigate] = useLocation();
  const ideas = (notebook.videoIdeas as { title: string }[] | null) ?? [];
  const analysis = notebook.aiAnalysis as { nicheOverview?: string } | null;

  return (
    <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-5 hover:border-[oklch(0.35_0.08_230)] transition-all cursor-pointer group"
      onClick={() => navigate(`/story/${notebook.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.15_0.04_240)] flex items-center justify-center text-accent">
            {STYLE_ICONS[notebook.contentStyle]}
          </div>
          <div>
            <h3 className="font-display text-sm font-medium text-foreground group-hover:text-accent transition-colors">{notebook.title}</h3>
            <p className="text-xs text-muted-foreground">{notebook.niche ?? "Bez niky"} · {STYLE_LABELS[notebook.contentStyle]}</p>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(notebook.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {analysis?.nicheOverview && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{analysis.nicheOverview}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-yellow-400" />
          {ideas.length} nápadů
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[oklch(0.25_0.04_230)]">
          {notebook.language.toUpperCase()}
        </Badge>
        <span className="ml-auto flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          Otevřít <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StoryStudio() {
  const { user, isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [, navigate] = useLocation();

  const { data: notebooks, refetch } = trpc.story.notebooks.list.useQuery(undefined, { enabled: !!user });
  const deleteMutation = trpc.story.notebooks.delete.useMutation({
    onSuccess: () => { toast.success("Notebook smazán"); refetch(); },
    onError: e => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="font-display text-xl mb-2">Story Studio</h2>
          <p className="text-muted-foreground mb-6">Přihlas se pro přístup k Story Studiu</p>
          <a href={getLoginUrl()}><Button className="glow-blue">Přihlásit se</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[oklch(0.18_0.03_230)] bg-[oklch(0.08_0.02_240)/80] backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><button className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></button></Link>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="font-display text-sm tracking-wider text-foreground">STORY STUDIO</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditsWidget />
            <Button size="sm" className="glow-blue font-display text-xs tracking-wider" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />NOVÝ NOTEBOOK
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-accent border-accent/30 text-xs">EKOSYSTÉM 21. STOLETÍ</Badge>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">
            Od nápadu k <span className="text-accent">virálnímu obsahu</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Analyzuj úspěšné kanály, generuj skripty s AI, vytvárej SEO-optimalizovaný obsah a produkuj videa — vše v jednom místě.
          </p>
        </div>

        {/* Workflow steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { icon: <Globe className="w-5 h-5" />, step: "01", title: "Analyzuj zdroje", desc: "YouTube URL, texty, weby", color: "text-blue-400" },
            { icon: <Brain className="w-5 h-5" />, step: "02", title: "AI Skript", desc: "Hook + skript + SEO", color: "text-purple-400" },
            { icon: <Target className="w-5 h-5" />, step: "03", title: "Thumbnail", desc: "AI generátor náhledů", color: "text-yellow-400" },
            { icon: <TrendingUp className="w-5 h-5" />, step: "04", title: "Publikuj", desc: "Export + SEO metadata", color: "text-green-400" },
          ].map(item => (
            <Card key={item.step} className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4">
              <div className={`${item.color} mb-2`}>{item.icon}</div>
              <div className="text-[10px] text-muted-foreground font-mono mb-1">KROK {item.step}</div>
              <div className="font-display text-sm text-foreground">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </Card>
          ))}
        </div>

        {/* Viral Score Leaderboard */}
        <ViralScoreLeaderboard />

        {/* Notebooks grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground">Moje Notebooky</h2>
          <span className="text-xs text-muted-foreground">{notebooks?.length ?? 0} projektů</span>
        </div>

        {!notebooks || notebooks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display text-base text-foreground mb-2">Žádné notebooky</h3>
            <p className="text-sm text-muted-foreground mb-5">Vytvoř první notebook pro svůj obsah</p>
            <Button className="glow-blue" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />Vytvořit první Notebook
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map(nb => (
              <NotebookCard
                key={nb.id}
                notebook={nb as Parameters<typeof NotebookCard>[0]["notebook"]}
                onDelete={(id) => deleteMutation.mutate({ id })}
              />
            ))}
            <Card
              className="bg-[oklch(0.08_0.02_240)] border-dashed border-[oklch(0.22_0.03_230)] p-5 flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors min-h-[140px]"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Nový Notebook</span>
            </Card>
          </div>
        )}

        {/* Stats bar */}
        {notebooks && notebooks.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Notebooky", value: notebooks.length, icon: <BookOpen className="w-4 h-4" /> },
              { label: "Celkem nápadů", value: notebooks.reduce((sum, nb) => sum + ((nb.videoIdeas as unknown[]) ?? []).length, 0), icon: <Lightbulb className="w-4 h-4" /> },
              { label: "Analyzováno", value: notebooks.filter(nb => nb.aiAnalysis).length, icon: <Brain className="w-4 h-4" /> },
            ].map(stat => (
              <Card key={stat.label} className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4 flex items-center gap-3">
                <div className="text-accent">{stat.icon}</div>
                <div>
                  <div className="font-display text-xl text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateNotebookDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => navigate(`/story/${id}`)}
      />
    </div>
  );
}
