import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft, Coins, TrendingDown, TrendingUp, Clock,
  Film, Image, Sparkles, Zap, BookOpen, RefreshCw
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video_generation: <Film className="w-3.5 h-3.5 text-blue-400" />,
  generate_hub: <Image className="w-3.5 h-3.5 text-purple-400" />,
  story_script: <BookOpen className="w-3.5 h-3.5 text-green-400" />,
  story_thumbnail: <Sparkles className="w-3.5 h-3.5 text-yellow-400" />,
  kling_motion: <Zap className="w-3.5 h-3.5 text-orange-400" />,
  signup_bonus: <TrendingUp className="w-3.5 h-3.5 text-green-400" />,
  admin_grant: <TrendingUp className="w-3.5 h-3.5 text-accent" />,
};

const CREDIT_COSTS = [
  { label: "Video (Kling 3.0 Pro)", cost: 20, icon: <Film className="w-4 h-4 text-blue-400" /> },
  { label: "Nano Banana 2 (T2I)", cost: 2, icon: <Image className="w-4 h-4 text-purple-400" /> },
  { label: "Seedream 5 Lite", cost: 3, icon: <Image className="w-4 h-4 text-pink-400" /> },
  { label: "Kling Motion Control", cost: 8, icon: <Zap className="w-4 h-4 text-orange-400" /> },
  { label: "Kling Video Edit", cost: 10, icon: <Film className="w-4 h-4 text-yellow-400" /> },
  { label: "AI Skript + SEO", cost: 5, icon: <BookOpen className="w-4 h-4 text-green-400" /> },
  { label: "AI Thumbnail", cost: 3, icon: <Sparkles className="w-4 h-4 text-yellow-400" /> },
];

export default function Credits() {
  const { user, isAuthenticated } = useAuth();

  const { data: balance, isLoading: balanceLoading } = trpc.credits.balance.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: history, isLoading: historyLoading } = trpc.credits.history.useQuery(undefined, { enabled: !!user });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="font-display text-xl mb-2">Kredity</h2>
          <p className="text-muted-foreground mb-6">Přihlas se pro správu kreditů</p>
          <a href={getLoginUrl()}><Button className="glow-blue">Přihlásit se</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[oklch(0.18_0.03_230)] bg-[oklch(0.08_0.02_240)/80] backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/"><button className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></button></Link>
          <div className="w-px h-4 bg-border" />
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-display text-sm tracking-wider text-foreground">KREDITY</span>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="md:col-span-1 bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-6 flex flex-col items-center justify-center text-center">
            <Coins className="w-8 h-8 text-yellow-400 mb-3" />
            <div className="text-[10px] text-muted-foreground font-mono mb-1">AKTUÁLNÍ ZŮSTATEK</div>
            {balanceLoading ? <RefreshCw className="w-6 h-6 text-accent animate-spin" /> : (
              <div className="font-display text-4xl text-yellow-400">{typeof balance === "object" && balance ? balance.balance : (balance ?? 0)}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">kreditů</div>
          </Card>
          <Card className="md:col-span-2 bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] p-6">
            <div className="text-[10px] text-muted-foreground font-mono mb-4">CENÍK GENEROVÁNÍ</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CREDIT_COSTS.map(item => (
                <div key={item.label} className="flex items-center justify-between gap-2 py-1.5 border-b border-[oklch(0.15_0.02_230)] last:border-0">
                  <div className="flex items-center gap-2">{item.icon}<span className="text-xs text-foreground/80">{item.label}</span></div>
                  <Badge variant="outline" className="text-[10px] border-yellow-600/40 text-yellow-400 shrink-0">{item.cost} kr</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div>
          <h2 className="font-display text-sm text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />Historie transakcí
          </h2>
          {historyLoading ? (
            <div className="flex items-center justify-center py-10"><RefreshCw className="w-5 h-5 text-accent animate-spin" /></div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[oklch(0.22_0.03_230)] rounded-xl">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Žádné transakce</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(tx => (
                <Card key={tx.id} className="bg-[oklch(0.10_0.02_240)] border-[oklch(0.22_0.03_230)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0">{TYPE_ICONS[tx.type] ?? <Coins className="w-3.5 h-3.5 text-muted-foreground" />}</div>
                      <div className="min-w-0">
                        <div className="text-xs text-foreground truncate">{tx.description ?? tx.type}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleString("cs", { dateStyle: "short", timeStyle: "short" })}</div>
                      </div>
                    </div>
                    <div className={`font-display text-sm shrink-0 flex items-center gap-1 ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
