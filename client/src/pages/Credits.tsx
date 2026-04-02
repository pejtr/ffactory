import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Zap, ChevronLeft, Film, Sparkles, Video, TrendingUp, TrendingDown,
  Gift, Shield, Star, Loader2, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { getLoginUrl } from "@/const";

type TxType = "signup_bonus" | "video_generation" | "scene_generation" | "soul_id_generation" | "admin_grant" | "daily_bonus";

const TX_CONFIG: Record<TxType, { label: string; icon: React.ReactNode; color: string }> = {
  signup_bonus:      { label: "Startovní bonus",       icon: <Gift className="w-3.5 h-3.5" />,     color: "text-green-400" },
  video_generation:  { label: "Generování videa",      icon: <Film className="w-3.5 h-3.5" />,     color: "text-red-400" },
  scene_generation:  { label: "Kling Motion scéna",    icon: <Video className="w-3.5 h-3.5" />,    color: "text-orange-400" },
  soul_id_generation:{ label: "Soul ID generování",    icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-purple-400" },
  admin_grant:       { label: "Admin grant",            icon: <Shield className="w-3.5 h-3.5" />,   color: "text-blue-400" },
  daily_bonus:       { label: "Denní bonus",            icon: <Star className="w-3.5 h-3.5" />,     color: "text-yellow-400" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("cs-CZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Credits() {
  const { isAuthenticated } = useAuth();
  const { data: balance, isLoading } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: history, isLoading: histLoading } = trpc.credits.history.useQuery(
    { limit: 50 }, { enabled: isAuthenticated }
  );
  const { data: costs } = trpc.credits.costs.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Pro zobrazení kreditů se přihlas</p>
          <a href={getLoginUrl()}><Button className="bg-blue-600 hover:bg-blue-500 text-white">Přihlásit se</Button></a>
        </div>
      </div>
    );
  }

  const transactions = (history ?? []) as Array<{
    id: number; amount: number; type: TxType; description?: string | null; createdAt: Date | string;
  }>;

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
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Kredity</span>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-16">
        <div className="container max-w-3xl">
          <h1 className="text-2xl font-bold text-white mb-6">
            Kreditový <span className="text-yellow-400">systém</span>
          </h1>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Zůstatek */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30 col-span-1">
                  <CardContent className="p-5 text-center">
                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-3xl font-black text-yellow-400">{balance?.balance ?? 0}</div>
                    <div className="text-xs text-slate-400 mt-1">Aktuální zůstatek</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/70 border-slate-700/60">
                  <CardContent className="p-5 text-center">
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-400">{balance?.totalEarned ?? 0}</div>
                    <div className="text-xs text-slate-400 mt-1">Celkem získáno</div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/70 border-slate-700/60">
                  <CardContent className="p-5 text-center">
                    <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-400">{balance?.totalSpent ?? 0}</div>
                    <div className="text-xs text-slate-400 mt-1">Celkem utraceno</div>
                  </CardContent>
                </Card>
              </div>

              {/* Ceník */}
              <Card className="bg-slate-900/70 border-slate-700/60 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />Ceník generování
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Celé video (spuštění pipeline)", cost: costs?.video_generation ?? 20, icon: <Film className="w-4 h-4 text-blue-400" /> },
                    { label: "Kling Motion scéna", cost: costs?.scene_generation ?? 3, icon: <Video className="w-4 h-4 text-orange-400" /> },
                    { label: "Soul ID portrét", cost: costs?.soul_id_generation ?? 5, icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                  ].map(({ label, cost, icon }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        {icon}{label}
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        <Zap className="w-3 h-3 mr-1" />{cost} kreditů
                      </Badge>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 pt-1">
                    Nový uživatel dostane 100 kreditů zdarma při registraci.
                  </p>
                </CardContent>
              </Card>

              {/* Historie transakcí */}
              <Card className="bg-slate-900/70 border-slate-700/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300">Historie transakcí</CardTitle>
                </CardHeader>
                <CardContent>
                  {histLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-center text-slate-500 text-sm py-6">Zatím žádné transakce</p>
                  ) : (
                    <div className="space-y-1">
                      {transactions.map((tx) => {
                        const cfg = TX_CONFIG[tx.type] ?? { label: tx.type, icon: <Zap className="w-3.5 h-3.5" />, color: "text-slate-400" };
                        const isPositive = tx.amount > 0;
                        return (
                          <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isPositive ? "bg-green-500/15" : "bg-red-500/15"}`}>
                                <span className={cfg.color}>{cfg.icon}</span>
                              </div>
                              <div>
                                <div className="text-sm text-slate-300">{tx.description ?? cfg.label}</div>
                                <div className="text-xs text-slate-600">{formatDate(tx.createdAt)}</div>
                              </div>
                            </div>
                            <div className={`flex items-center gap-1 font-bold text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
                              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {isPositive ? "+" : ""}{tx.amount}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
