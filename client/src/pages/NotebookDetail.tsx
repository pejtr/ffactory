import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CreditsWidget } from "@/components/CreditsWidget";
import {
  ArrowLeft, BookOpen, Globe, Brain, FileText, Sparkles, Trash2,
  Plus, Zap, Target, TrendingUp, Image, Copy, Check, RefreshCw,
  Youtube, Link2, AlignLeft, ChevronDown, ChevronUp, Download
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "sources" | "scripts" | "thumbnails";

// ─── Sources Tab ──────────────────────────────────────────────────────────────
function SourcesTab({ notebookId }: { notebookId: number }) {
  const [sourceType, setSourceType] = useState<"youtube_url" | "text" | "url">("youtube_url");
  const [sourceInput, setSourceInput] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: sources, refetch } = trpc.story.sources.list.useQuery({ notebookId }, { enabled: !!notebookId });

  const addMutation = trpc.story.sources.add.useMutation({
    onSuccess: () => { toast.success("Zdroj přidán"); setSourceInput(""); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteMutation = trpc.story.sources.delete.useMutation({
    onSuccess: () => { toast.success("Zdroj smazán"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const TYPE_ICONS = {
    youtube_url: <Youtube className="w-3.5 h-3.5 text-red-400" />,
    url: <Link2 className="w-3.5 h-3.5 text-blue-400" />,
    text: <AlignLeft className="w-3.5 h-3.5 text-green-400" />,
  };

  const TYPE_LABELS = {
    youtube_url: "YouTube URL",
    url: "Web URL",
    text: "Text",
  };

  return (
    <div className="space-y-6">
      {/* Add source form */}
      <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-5">
        <h3 className="font-display text-sm text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          Přidat zdroj
        </h3>
        <div className="flex gap-2 mb-3">
          {(["youtube_url", "url", "text"] as const).map(t => (
            <button
              key={t}
              onClick={() => setSourceType(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                sourceType === t
                  ? "bg-accent/20 border border-accent/40 text-accent"
                  : "bg-[oklch(0.08_0.02_240)] border border-[oklch(0.20_0.03_230)] text-muted-foreground hover:text-foreground"
              }`}
            >
              {TYPE_ICONS[t]}
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {sourceType === "text" ? (
          <Textarea
            value={sourceInput}
            onChange={e => setSourceInput(e.target.value)}
            placeholder="Vlož text, přepis videa, článek nebo poznámky..."
            rows={4}
            className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)] resize-none mb-3"
          />
        ) : (
          <Input
            value={sourceInput}
            onChange={e => setSourceInput(e.target.value)}
            placeholder={sourceType === "youtube_url" ? "https://youtube.com/watch?v=..." : "https://..."}
            className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)] mb-3"
          />
        )}
        <Button
          onClick={() => addMutation.mutate({ notebookId, type: sourceType, content: sourceInput })}
          disabled={!sourceInput.trim() || addMutation.isPending}
          className="glow-blue w-full"
          size="sm"
        >
          {addMutation.isPending ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Analyzuji s AI...</>
          ) : (
            <><Zap className="w-3.5 h-3.5 mr-2" />Přidat a analyzovat</>
          )}
        </Button>
      </Card>

      {/* Sources list */}
      {!sources || sources.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Žádné zdroje — přidej YouTube video, URL nebo text</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map(src => {
            // Sources have direct fields (not nested aiAnalysis)
            const keyInsights = (src.keyInsights as string[] | null) ?? [];
            const hookPatterns = (src.hookPatterns as string[] | null) ?? [];
            const metadata = src.metadata as { targetAudience?: string; contentAngles?: string[] } | null;
            const isExpanded = expanded === src.id;

            return (
              <Card key={src.id} className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {TYPE_ICONS[src.type as keyof typeof TYPE_ICONS]}
                    <span className="text-xs text-foreground truncate font-mono">
                      {src.type === "text" ? (src.content ?? "").slice(0, 60) + "..." : src.content}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {src.viralScore && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-600/40 text-yellow-400">
                        {src.viralScore}/10
                      </Badge>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : src.id)}
                    aria-label="Toggle details"
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: src.id })}
                      className="text-muted-foreground hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-[oklch(0.18_0.03_230)] pt-3">
                    {src.summary && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono mb-1">SHRNUTÍ</div>
                        <p className="text-xs text-foreground/80">{src.summary}</p>
                      </div>
                    )}
                    {keyInsights.length > 0 && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono mb-1">KLÍČOVÉ POZNATKY</div>
                        <ul className="space-y-1">
                          {keyInsights.map((insight, i) => (
                            <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                              <span className="text-accent mt-0.5">•</span>{insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {hookPatterns.length > 0 && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono mb-1">HOOK VZORY</div>
                        <div className="flex flex-wrap gap-1.5">
                          {hookPatterns.map((h, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-purple-600/40 text-purple-300">{h}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {metadata?.contentAngles && metadata.contentAngles.length > 0 && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono mb-1">CONTENT ÚHLY</div>
                        <div className="flex flex-wrap gap-1.5">
                          {metadata.contentAngles.map((a, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] border-blue-600/40 text-blue-300">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Scripts Tab ──────────────────────────────────────────────────────────────
function ScriptsTab({ notebookId }: { notebookId: number }) {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("300");
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: scripts, refetch } = trpc.story.scripts.list.useQuery({ notebookId });

  const generateMutation = trpc.story.scripts.generate.useMutation({
    onSuccess: () => { toast.success("Skript vygenerován"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteMutation = trpc.story.scripts.delete.useMutation({
    onSuccess: () => { toast.success("Skript smazán"); refetch(); setSelectedScript(null); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeScript = scripts?.find(s => s.id === selectedScript);
  const seoTitles = (activeScript?.seoTitles as string[] | null) ?? [];
  const seoTags = (activeScript?.seoTags as string[] | null) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Script list + generate */}
      <div className="space-y-4">
        <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4">
          <h3 className="font-display text-sm text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Generovat skript
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Téma videa *</label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Např. Jak funguje černá díra..."
                className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)] text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Délka videa</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minuta (Short)</SelectItem>
                  <SelectItem value="180">3 minuty</SelectItem>
                  <SelectItem value="300">5 minut</SelectItem>
                  <SelectItem value="600">10 minut</SelectItem>
                  <SelectItem value="900">15 minut</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateMutation.mutate({ notebookId, title: topic, idea: topic, targetDurationSec: parseInt(duration) })}
              disabled={!topic.trim() || generateMutation.isPending}
              className="glow-blue w-full"
              size="sm"
            >
              {generateMutation.isPending ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Generuji...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 mr-2" />Generovat (5 kr)</>
              )}
            </Button>
          </div>
        </Card>

        {/* Script list */}
        <div className="space-y-2">
          {scripts?.map(script => (
            <button
              key={script.id}
              onClick={() => setSelectedScript(script.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedScript === script.id
                  ? "bg-accent/10 border-accent/40"
                  : "bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] hover:border-[oklch(0.30_0.05_230)]"
              }`}
            >
              <div className="text-xs font-medium text-foreground truncate">{script.title}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {Math.round((script.targetDurationSec ?? 300) / 60)} min · {new Date(script.createdAt).toLocaleDateString("cs")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Script content */}
      <div className="lg:col-span-2">
        {!activeScript ? (
          <div className="text-center py-16 border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Vyber skript ze seznamu nebo vygeneruj nový</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hook */}
            {activeScript.hook && (
              <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-yellow-400" />HOOK (první 3 sekundy)
                  </div>
                  <button
                    onClick={() => copyToClipboard(activeScript.hook!, "hook")}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    {copied === "hook" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm text-yellow-300 font-medium">{activeScript.hook}</p>
              </Card>
            )}

            {/* Full script */}
            {activeScript.script && (
              <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-blue-400" />KOMPLETNÍ SKRIPT
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(activeScript.script!, "script")}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      {copied === "script" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: activeScript.id })}
                      className="text-muted-foreground hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-foreground/80 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                  {activeScript.script}
                </div>
              </Card>
            )}

            {/* SEO */}
            {(seoTitles.length > 0 || activeScript.seoDescription || seoTags.length > 0) && (
              <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4">
                <div className="text-[10px] text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-green-400" />SEO METADATA
                </div>
                {seoTitles.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] text-muted-foreground mb-1.5">TITULKY (A/B test)</div>
                    <div className="space-y-1.5">
                      {seoTitles.map((title, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-foreground flex-1">{title}</span>
                          <button onClick={() => copyToClipboard(title, `title-${i}`)} className="text-muted-foreground hover:text-foreground p-0.5">
                            {copied === `title-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeScript.seoDescription && (
                  <div className="mb-3">
                    <div className="text-[10px] text-muted-foreground mb-1.5">POPIS</div>
                    <p className="text-xs text-foreground/80">{activeScript.seoDescription}</p>
                  </div>
                )}
                {seoTags.length > 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1.5">TAGY</div>
                    <div className="flex flex-wrap gap-1.5">
                      {seoTags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-green-600/40 text-green-300 cursor-pointer"
                          onClick={() => copyToClipboard(tag, `tag-${i}`)}>
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Thumbnails Tab ───────────────────────────────────────────────────────────
function ThumbnailsTab({ notebookId }: { notebookId: number }) {
  const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);
  const [style, setStyle] = useState<"cinematic" | "minimal" | "bold" | "educational">("cinematic");

  const { data: scripts } = trpc.story.scripts.list.useQuery({ notebookId });
  const { data: thumbnails, refetch } = trpc.story.scripts.thumbnails.useQuery(
    { scriptId: selectedScriptId! },
    { enabled: !!selectedScriptId }
  );

  const generateMutation = trpc.story.scripts.generateThumbnail.useMutation({
    onSuccess: () => { toast.success("Thumbnail vygenerován"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const selectMutation = trpc.story.scripts.selectThumbnail.useMutation({
    onSuccess: () => { toast.success("Thumbnail vybrán"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const STYLES = [
    { value: "cinematic", label: "Kinematografický", color: "text-blue-400" },
    { value: "minimal", label: "Minimalistický", color: "text-gray-400" },
    { value: "bold", label: "Výrazný / Bold", color: "text-red-400" },
    { value: "educational", label: "Vzdělávací", color: "text-green-400" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-5">
        <h3 className="font-display text-sm text-foreground mb-4 flex items-center gap-2">
          <Image className="w-4 h-4 text-yellow-400" />
          AI Thumbnail Generátor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Skript</label>
            <Select value={selectedScriptId?.toString() ?? ""} onValueChange={v => setSelectedScriptId(parseInt(v))}>
              <SelectTrigger className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]">
                <SelectValue placeholder="Vyber skript..." />
              </SelectTrigger>
              <SelectContent>
                {scripts?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Styl thumbnailu</label>
            <Select value={style} onValueChange={v => setStyle(v as typeof style)}>
              <SelectTrigger className="bg-[oklch(0.08_0.02_240)] border-[oklch(0.22_0.03_230)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className={s.color}>{s.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={() => generateMutation.mutate({ scriptId: selectedScriptId!, style: style })}
          disabled={!selectedScriptId || generateMutation.isPending}
          className="glow-blue w-full"
          size="sm"
        >
          {generateMutation.isPending ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Generuji thumbnail...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-2" />Generovat thumbnail (3 kr)</>
          )}
        </Button>
      </Card>

      {/* Thumbnails grid */}
      {!selectedScriptId ? (
        <div className="text-center py-10 border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl">
          <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Vyber skript pro zobrazení thumbnailů</p>
        </div>
      ) : !thumbnails || thumbnails.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl">
          <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Žádné thumbnaily — vygeneruj první</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {thumbnails.map((thumb) => (
            <div
              key={thumb.id}
              className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                thumb.isSelected
                  ? "border-accent shadow-[0_0_20px_oklch(0.6_0.2_230/0.4)]"
                  : "border-[oklch(0.22_0.03_230)] hover:border-[oklch(0.35_0.08_230)]"
              }`}
              onClick={() => selectMutation.mutate({ scriptId: thumb.scriptId, thumbnailId: thumb.id })}
            >
              {thumb.imageUrl ? (
                <img src={thumb.imageUrl} alt={thumb.prompt ?? "thumbnail"} className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-[oklch(0.08_0.02_240)] flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {thumb.isSelected && (
                <div className="absolute top-2 right-2 bg-accent rounded-full p-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] border-white/20 text-white/80">{thumb.style}</Badge>
                  {thumb.imageUrl && (
                    <a
                      href={thumb.imageUrl}
                      download
                      onClick={e => e.stopPropagation()}
                      className="ml-auto text-white/60 hover:text-white"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>();
  const notebookId = parseInt(id ?? "0");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("sources");

  const { data: notebook, isLoading } = trpc.story.notebooks.get.useQuery(
    { id: notebookId },
    { enabled: !!user && !!notebookId }
  );

  const analyzeMutation = trpc.story.notebooks.analyze.useMutation({
    onSuccess: () => toast.success("Analýza niky dokončena"),
    onError: e => toast.error(e.message),
  });

  const generateIdeasMutation = trpc.story.notebooks.generateIdeas.useMutation({
    onSuccess: () => toast.success("Nápady vygenerovány"),
    onError: e => toast.error(e.message),
  });

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "sources", label: "Zdroje", icon: <Globe className="w-3.5 h-3.5" /> },
    { id: "scripts", label: "Skripty + SEO", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "thumbnails", label: "Thumbnaily", icon: <Image className="w-3.5 h-3.5" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-display text-lg text-foreground mb-2">Notebook nenalezen</h2>
          <Link href="/story"><Button variant="outline">Zpět na Story Studio</Button></Link>
        </div>
      </div>
    );
  }

  const ideas = (notebook.videoIdeas as { title: string; hook: string; viralPotential: string }[] | null) ?? [];
  const analysis = notebook.aiAnalysis as { nicheOverview?: string; audienceProfile?: string; contentFormula?: string } | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[oklch(0.18_0.03_230)] bg-[oklch(0.08_0.02_240)/80] backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/story">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="font-display text-sm tracking-wider text-foreground truncate max-w-[200px]">{notebook.title}</span>
            </div>
            {notebook.niche && (
              <Badge variant="outline" className="text-[10px] border-accent/30 text-accent hidden md:flex">
                {notebook.niche}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs hidden md:flex"
              onClick={() => analyzeMutation.mutate({ id: notebookId })}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> : <Brain className="w-3 h-3 mr-1.5" />}
              Analyzovat niku
            </Button>
            <Button
              size="sm"
              className="glow-blue text-xs hidden md:flex"
              onClick={() => generateIdeasMutation.mutate({ id: notebookId })}
              disabled={generateIdeasMutation.isPending}
            >
              {generateIdeasMutation.isPending ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
              Generovat nápady
            </Button>
            <CreditsWidget />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Niche analysis summary */}
        {analysis && (
          <Card className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.nicheOverview && (
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1"><Globe className="w-3 h-3" />PŘEHLED NIKY</div>
                  <p className="text-xs text-foreground/80">{analysis.nicheOverview}</p>
                </div>
              )}
              {analysis.audienceProfile && (
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1"><Target className="w-3 h-3" />CÍLOVÁ SKUPINA</div>
                  <p className="text-xs text-foreground/80">{analysis.audienceProfile}</p>
                </div>
              )}
              {analysis.contentFormula && (
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono mb-1 flex items-center gap-1"><Zap className="w-3 h-3" />CONTENT FORMULE</div>
                  <p className="text-xs text-foreground/80">{analysis.contentFormula}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Video ideas */}
        {ideas.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="font-display text-sm text-foreground">Nápady na videa ({ideas.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ideas.slice(0, 6).map((idea, i) => (
                <Card key={i} className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-3">
                  <div className="font-display text-xs text-foreground mb-1">{idea.title}</div>
                  <p className="text-[11px] text-muted-foreground">{idea.hook}</p>
                  {idea.viralPotential && (
                    <Badge variant="outline" className="text-[9px] mt-2 border-yellow-600/40 text-yellow-400">{idea.viralPotential}</Badge>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[oklch(0.08_0.02_240)] rounded-lg p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[oklch(0.15_0.04_240)] text-foreground border border-[oklch(0.25_0.05_230)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "sources" && <SourcesTab notebookId={notebookId} />}
        {activeTab === "scripts" && <ScriptsTab notebookId={notebookId} />}
        {activeTab === "thumbnails" && <ThumbnailsTab notebookId={notebookId} />}
      </div>
    </div>
  );
}
