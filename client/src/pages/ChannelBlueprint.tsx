import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type NicheAnalysis = {
  viabilityScore: number;
  searchVolume: string;
  competition: string;
  monetization: string;
  sustainability: string;
  targetAudience: string;
  subNiches: string[];
  risks: string[];
  opportunities: string[];
  recommendedAngle: string;
};

type VideoIdea = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  thumbnailText: string;
  thumbnailVisual: string;
  chapters: string[];
  durationMinutes: number;
  category: string;
  viralPotential: number;
};

type RoadmapWeek = {
  week: number;
  milestone: string;
  actions: string[];
  metrics: string[];
  tips: string;
};

type BrandIdentity = {
  channelNames: string[];
  tagline: string;
  colors: string[];
  visualStyle: string;
  contentTone: string;
  audiencePersona: string;
};

// ─── Phase Steps ──────────────────────────────────────────────────────────────
const PHASES = [
  { id: 1, label: "Validace Niché", icon: "🔍" },
  { id: 2, label: "Blueprint", icon: "📋" },
  { id: 3, label: "Brand Identity", icon: "🎨" },
  { id: 4, label: "Video Plán", icon: "🎬" },
  { id: 5, label: "Roadmapa", icon: "🗺️" },
];

// ─── Score Gauge ──────────────────────────────────────────────────────────────
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";
  const bgColor = score >= 70 ? "stroke-green-400" : score >= 40 ? "stroke-yellow-400" : "stroke-red-400";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/30" />
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
          className={bgColor} strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className={`${color} text-xl font-bold`} fill="currentColor" fontSize="20">{score}</text>
      </svg>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    very_high: "bg-red-500/20 text-red-400 border-red-500/30",
    saturated: "bg-red-500/20 text-red-400 border-red-500/30",
    excellent: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[level] || colors.medium}`}>
      {level.replace("_", " ")}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ChannelBlueprint() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPhase, setCurrentPhase] = useState(1);
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("educational");
  const [language, setLanguage] = useState("cs");
  const [cadence, setCadence] = useState<"daily" | "5x_week" | "3x_week" | "2x_week" | "weekly">("3x_week");
  const [nicheAnalysis, setNicheAnalysis] = useState<NicheAnalysis | null>(null);
  const [blueprintData, setBlueprintData] = useState<{
    videoPlan: { videos: VideoIdea[] };
    roadmap: { weeks: RoadmapWeek[]; monetizationTimeline: string; keySuccessFactors: string[] };
    brandIdentity: BrandIdentity;
  } | null>(null);

  // Mutations
  const validateNicheMutation = trpc.youtube.validateNiche.useMutation();
  const generateBlueprintMutation = trpc.youtube.generateBlueprint.useMutation();
  const exportPdfMutation = trpc.youtube.exportBlueprintPdf.useMutation();
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!blueprintData) return;
    setExportingPdf(true);
    try {
      const result = await exportPdfMutation.mutateAsync({
        niche,
        brandIdentity: blueprintData.brandIdentity,
        videoPlan: blueprintData.videoPlan,
        roadmap: blueprintData.roadmap,
      });
      window.open(result.url, "_blank");
      toast.success("PDF vygenerováno! Otevírám ke stažení.");
    } catch (e: any) {
      toast.error(e.message || "Chyba při generování PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleValidateNiche = async () => {
    if (!niche.trim()) { toast.error("Zadejte niché"); return; }
    try {
      const result = await validateNicheMutation.mutateAsync({ niche: niche.trim() });
      setNicheAnalysis(result);
      toast.success("Analýza niché dokončena!");
    } catch (e: any) {
      toast.error(e.message || "Chyba při analýze");
    }
  };

  const handleGenerateBlueprint = async () => {
    if (!niche.trim()) { toast.error("Zadejte niché"); return; }
    try {
      const result = await generateBlueprintMutation.mutateAsync({
        niche: niche.trim(),
        language,
        postingCadence: cadence,
        tone,
      });
      setBlueprintData(result as any);
      setCurrentPhase(3);
      toast.success("Blueprint vygenerován!");
    } catch (e: any) {
      toast.error(e.message || "Chyba při generování");
    }
  };

  const canProceed = useMemo(() => {
    if (currentPhase === 1) return nicheAnalysis && nicheAnalysis.viabilityScore >= 30;
    if (currentPhase === 2) return !!blueprintData;
    return true;
  }, [currentPhase, nicheAnalysis, blueprintData]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <Link href="/channels">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
              ← Zpět na Channel Manager
            </button>
          </Link>
          <span className="font-display text-lg font-bold text-primary">CHANNEL BLUEPRINT</span>
          <div />
        </div>
      </nav>

      <div className="container pt-24 pb-16 max-w-5xl mx-auto">
        {/* Phase Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {PHASES.map((p, i) => (
            <div key={p.id} className="flex items-center">
              <button
                onClick={() => setCurrentPhase(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                  currentPhase === p.id
                    ? "bg-primary/20 border border-primary/40 text-primary"
                    : currentPhase > p.id
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-card/40 border border-border/30 text-muted-foreground"
                }`}
              >
                <span>{p.icon}</span>
                <span className="hidden md:inline">{p.label}</span>
              </button>
              {i < PHASES.length - 1 && <div className="w-6 h-px bg-border/50 mx-1" />}
            </div>
          ))}
        </div>

        {/* ═══ PHASE 1: Niche Validation ═══ */}
        {currentPhase === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">🔍 Validace Niché</h2>
              <p className="text-muted-foreground">Zadejte niché a AI analyzuje jeho potenciál na YouTube.</p>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Vaše niché</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="např. AI automation tutorials, personal finance, cooking hacks..."
                  className="w-full px-4 py-3 rounded-xl bg-card/60 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Tón obsahu</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/50 text-foreground"
                  >
                    <option value="educational">Vzdělávací</option>
                    <option value="entertaining">Zábavný</option>
                    <option value="inspirational">Inspirativní</option>
                    <option value="dramatic">Dramatický</option>
                    <option value="humorous">Humorný</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Jazyk</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/50 text-foreground"
                  >
                    <option value="cs">Čeština</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="pl">Polski</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleValidateNiche}
                disabled={validateNicheMutation.isPending || !niche.trim()}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold transition-all"
              >
                {validateNicheMutation.isPending ? "⏳ Analyzuji..." : "🔍 Analyzovat niché"}
              </button>
            </div>

            {/* Analysis Results */}
            {nicheAnalysis && (
              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreGauge score={nicheAnalysis.viabilityScore} label="Viabilita" />
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card/40 border border-border/30">
                    <LevelBadge level={nicheAnalysis.searchVolume} />
                    <span className="text-xs text-muted-foreground mt-2">Hledanost</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card/40 border border-border/30">
                    <LevelBadge level={nicheAnalysis.competition} />
                    <span className="text-xs text-muted-foreground mt-2">Konkurence</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card/40 border border-border/30">
                    <LevelBadge level={nicheAnalysis.monetization} />
                    <span className="text-xs text-muted-foreground mt-2">Monetizace</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-card/40 border border-border/30 p-5">
                    <h4 className="font-bold text-foreground text-sm mb-2">🎯 Cílová skupina</h4>
                    <p className="text-sm text-muted-foreground">{nicheAnalysis.targetAudience}</p>
                  </div>
                  <div className="rounded-xl bg-card/40 border border-border/30 p-5">
                    <h4 className="font-bold text-foreground text-sm mb-2">💡 Doporučený úhel</h4>
                    <p className="text-sm text-muted-foreground">{nicheAnalysis.recommendedAngle}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-card/40 border border-border/30 p-5">
                    <h4 className="font-bold text-foreground text-sm mb-2">🌱 Sub-niché</h4>
                    <div className="flex flex-wrap gap-2">
                      {nicheAnalysis.subNiches.map((s, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-card/40 border border-border/30 p-5">
                    <h4 className="font-bold text-foreground text-sm mb-2">📈 Příležitosti</h4>
                    <ul className="space-y-1">
                      {nicheAnalysis.opportunities.map((o, i) => (
                        <li key={i} className="text-xs text-green-400 flex items-start gap-1">
                          <span className="mt-0.5">✓</span> {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {nicheAnalysis.risks.length > 0 && (
                  <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-5">
                    <h4 className="font-bold text-red-400 text-sm mb-2">⚠️ Rizika</h4>
                    <ul className="space-y-1">
                      {nicheAnalysis.risks.map((r, i) => (
                        <li key={i} className="text-xs text-red-300">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={() => setCurrentPhase(2)}
                    disabled={nicheAnalysis.viabilityScore < 30}
                    className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold transition-all"
                  >
                    {nicheAnalysis.viabilityScore >= 30 ? "✓ Pokračovat k Blueprint →" : "⚠️ Niché má nízké skóre"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PHASE 2: Generate Blueprint ═══ */}
        {currentPhase === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">📋 Generování Blueprint</h2>
              <p className="text-muted-foreground">AI vygeneruje kompletní 30-video plán, branding a 90-denní roadmapu.</p>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
              <div className="rounded-xl bg-card/40 border border-border/30 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-bold text-foreground">{niche}</div>
                    <div className="text-xs text-muted-foreground">Skóre: {nicheAnalysis?.viabilityScore || "?"}/100</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Frekvence publikování</label>
                <select
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-card/60 border border-border/50 text-foreground"
                >
                  <option value="daily">Denně (nejlepší pro růst)</option>
                  <option value="5x_week">5× týdně</option>
                  <option value="3x_week">3× týdně (doporučeno)</option>
                  <option value="2x_week">2× týdně</option>
                  <option value="weekly">1× týdně</option>
                </select>
              </div>

              <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 text-sm text-blue-300">
                <strong>💡 Tip z best practices:</strong> Ideálně publikujte denně. Minimum je 3-5× týdně pro stabilní růst. Konzistence je klíčová pro YouTube algoritmus.
              </div>

              <button
                onClick={handleGenerateBlueprint}
                disabled={generateBlueprintMutation.isPending}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold transition-all text-lg"
              >
                {generateBlueprintMutation.isPending ? "⏳ Generuji Blueprint (30-60s)..." : "🚀 Vygenerovat Channel Blueprint"}
              </button>

              {generateBlueprintMutation.isPending && (
                <div className="text-center text-sm text-muted-foreground">
                  <div className="animate-pulse">AI generuje 30 video nápadů + SEO metadata + 90-denní roadmapu...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PHASE 3: Brand Identity ═══ */}
        {currentPhase === 3 && blueprintData?.brandIdentity && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">🎨 Brand Identity</h2>
              <p className="text-muted-foreground">AI navrhla vizuální identitu pro váš kanál.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-card/40 border border-border/30 p-6">
                <h4 className="font-bold text-foreground mb-3">📛 Návrhy názvů kanálu</h4>
                <div className="space-y-2">
                  {blueprintData.brandIdentity.channelNames.map((name, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${i === 0 ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card/30"}`}>
                      <span className="font-bold text-foreground">{name}</span>
                      {i === 0 && <span className="ml-2 text-xs text-primary">⭐ Doporučeno</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-card/40 border border-border/30 p-6">
                <h4 className="font-bold text-foreground mb-3">🎨 Barevná paleta</h4>
                <div className="flex gap-3 mb-4">
                  {blueprintData.brandIdentity.colors.map((color, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-lg border border-border/30" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground mt-1">{color}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">Tagline:</div>
                  <div className="text-sm text-foreground font-medium italic">"{blueprintData.brandIdentity.tagline}"</div>
                </div>
              </div>

              <div className="rounded-xl bg-card/40 border border-border/30 p-6">
                <h4 className="font-bold text-foreground mb-3">🎭 Vizuální styl</h4>
                <p className="text-sm text-muted-foreground">{blueprintData.brandIdentity.visualStyle}</p>
              </div>

              <div className="rounded-xl bg-card/40 border border-border/30 p-6">
                <h4 className="font-bold text-foreground mb-3">👤 Cílová persona</h4>
                <p className="text-sm text-muted-foreground">{blueprintData.brandIdentity.audiencePersona}</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold transition-all"
              >
                {exportingPdf ? "⏳ Generuji PDF..." : "📄 Exportovat Brand Identity PDF"}
              </button>
              <button onClick={() => setCurrentPhase(4)} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all">
                Pokračovat k Video Plánu →
              </button>
            </div>
          </div>
        )}

        {/* ═══ PHASE 4: Video Plan (30 ideas) ═══ */}
        {currentPhase === 4 && blueprintData?.videoPlan?.videos && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">🎬 30 Video Plán</h2>
              <p className="text-muted-foreground">Kompletní obsahový plán s SEO metadata pro každé video.</p>
            </div>

            <div className="grid gap-3">
              {blueprintData.videoPlan.videos.map((video) => (
                <VideoIdeaCard key={video.id} video={video} />
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-4 flex-wrap">
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold transition-all"
              >
                {exportingPdf ? "⏳ Generuji PDF..." : "📄 Exportovat Video Plán PDF"}
              </button>
              <button onClick={() => setCurrentPhase(5)} className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all">
                Zobrazit 90-denní Roadmapu →
              </button>
            </div>
          </div>
        )}

        {/* ═══ PHASE 5: 90-Day Roadmap ═══ */}
        {currentPhase === 5 && blueprintData?.roadmap && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold mb-2">🗺️ 90-Denní Roadmapa</h2>
              <p className="text-muted-foreground">Strukturovaný plán růstu vašeho kanálu.</p>
            </div>

            {/* Key Success Factors */}
            <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-5 mb-6">
              <h4 className="font-bold text-green-400 text-sm mb-3">🏆 Klíčové faktory úspěchu</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {blueprintData.roadmap.keySuccessFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-green-300">
                    <span className="mt-0.5">✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Monetization Timeline */}
            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-5 mb-6">
              <h4 className="font-bold text-yellow-400 text-sm mb-2">💰 Monetizační timeline</h4>
              <p className="text-sm text-yellow-200">{blueprintData.roadmap.monetizationTimeline}</p>
            </div>

            {/* Weekly Roadmap */}
            <div className="space-y-3">
              {blueprintData.roadmap.weeks.map((week) => (
                <div key={week.week} className="rounded-xl bg-card/40 border border-border/30 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                      {week.week}
                    </span>
                    <div>
                      <div className="font-bold text-foreground text-sm">{week.milestone}</div>
                      <div className="text-xs text-muted-foreground">Týden {week.week}</div>
                    </div>
                  </div>
                  <div className="ml-11 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {week.actions.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20">{a}</span>
                      ))}
                    </div>
                    {week.tips && (
                      <div className="text-xs text-blue-300 italic">💡 {week.tips}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 pt-6 flex-wrap">
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold transition-all shadow-lg shadow-red-600/20"
              >
                {exportingPdf ? (
                  <><span className="animate-spin">⏳</span> Generuji PDF...</>
                ) : (
                  <>📄 Exportovat celý Blueprint PDF</>
                )}
              </button>
              <Link href="/channels">
                <button className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all">
                  ✓ Blueprint hotov — zpět na Channel Manager
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video Idea Card ──────────────────────────────────────────────────────────
function VideoIdeaCard({ video }: { video: VideoIdea }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl bg-card/40 border border-border/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-card/60 transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {video.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground text-sm truncate">{video.title}</div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span>{video.category}</span>
            <span>·</span>
            <span>{video.durationMinutes} min</span>
            <span>·</span>
            <span className="text-yellow-400">⚡ {video.viralPotential}/10</span>
          </div>
        </div>
        <span className="text-muted-foreground text-sm">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/20 space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Popis:</div>
            <p className="text-sm text-foreground/80">{video.description}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Thumbnail text:</div>
            <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-sm font-bold">{video.thumbnailText}</span>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Kapitoly:</div>
            <div className="space-y-0.5">
              {video.chapters.map((ch, i) => (
                <div key={i} className="text-xs text-muted-foreground">{ch}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">SEO Tagy:</div>
            <div className="flex flex-wrap gap-1">
              {video.tags.map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-card border border-border/50 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
