import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Flame, Zap, Crown, Star, Trophy, Gift, Calendar,
  Video, Users, Sparkles, BookOpen, Diamond, ChevronRight,
  CheckCircle, Lock, ArrowLeft
} from "lucide-react";

// ── Streak Fire Widget ─────────────────────────────────────────────────────────
function StreakWidget({ streak }: {
  streak: {
    current: number;
    longest: number;
    totalDays: number;
    canClaimDaily: boolean;
    dailyBonusAmount: number;
    lastClaimedAt: Date | string | null;
  };
  onClaim: () => void;
}) {
  const flameColor = streak.current >= 30 ? "text-purple-400" :
    streak.current >= 14 ? "text-yellow-400" :
    streak.current >= 7 ? "text-orange-400" : "text-red-400";

  const milestones = [3, 7, 14, 30];

  return (
    <Card className="bg-gradient-to-br from-orange-950/40 to-red-950/40 border-orange-800/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-300">
          <Flame className={`w-5 h-5 ${flameColor}`} />
          Streak — dny v řadě
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="text-center">
            <div className={`text-6xl font-black ${flameColor}`}>{streak.current}</div>
            <div className="text-xs text-muted-foreground mt-1">aktuální</div>
          </div>
          <div className="flex-1 space-y-2 pb-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nejdelší: <span className="text-foreground font-semibold">{streak.longest} dní</span></span>
              <span>Celkem: <span className="text-foreground font-semibold">{streak.totalDays} dní</span></span>
            </div>
            <div className="flex gap-1">
              {milestones.map(m => (
                <div key={m} className="flex-1 text-center">
                  <div className={`text-xs font-bold ${streak.current >= m ? "text-orange-400" : "text-muted-foreground"}`}>
                    {streak.current >= m ? "✓" : m}
                  </div>
                  <div className={`h-1 rounded-full mt-1 ${streak.current >= m ? "bg-orange-400" : "bg-muted"}`} />
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Milníky: 3 / 7 / 14 / 30 dní</div>
          </div>
        </div>

        {/* Bonus tiers */}
        <div className="grid grid-cols-4 gap-1 text-center text-xs">
          {[
            { days: "1–6", bonus: "+5", active: streak.current < 7 },
            { days: "7–13", bonus: "+10", active: streak.current >= 7 && streak.current < 14 },
            { days: "14–29", bonus: "+15", active: streak.current >= 14 && streak.current < 30 },
            { days: "30+", bonus: "+25", active: streak.current >= 30 },
          ].map(tier => (
            <div key={tier.days} className={`rounded p-1 ${tier.active ? "bg-orange-500/20 border border-orange-500/40" : "bg-muted/30"}`}>
              <div className={`font-bold ${tier.active ? "text-orange-400" : "text-muted-foreground"}`}>{tier.bonus}</div>
              <div className="text-muted-foreground">{tier.days}d</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Daily Bonus Card ───────────────────────────────────────────────────────────
function DailyBonusCard({ canClaim, amount, onClaim, isLoading }: {
  canClaim: boolean;
  amount: number;
  onClaim: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className={`border-2 transition-all ${canClaim ? "border-yellow-500/60 bg-gradient-to-br from-yellow-950/40 to-amber-950/40 shadow-lg shadow-yellow-900/20" : "border-muted bg-muted/10"}`}>
      <CardContent className="pt-6 text-center space-y-4">
        <div className={`text-5xl ${canClaim ? "animate-bounce" : "opacity-40"}`}>🎁</div>
        <div>
          <div className="text-lg font-bold">Denní bonus</div>
          <div className="text-sm text-muted-foreground">Přihlašuj se každý den pro streak bonusy</div>
        </div>
        <div className={`text-3xl font-black ${canClaim ? "text-yellow-400" : "text-muted-foreground"}`}>
          +{amount} kreditů
        </div>
        <Button
          onClick={onClaim}
          disabled={!canClaim || isLoading}
          className={canClaim ? "w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold" : "w-full"}
          variant={canClaim ? "default" : "outline"}
        >
          {isLoading ? "Vybírám..." : canClaim ? "Vybrat bonus" : "Již vybráno dnes ✓"}
        </Button>
        {!canClaim && (
          <div className="text-xs text-muted-foreground">Vrať se zítra pro další bonus</div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Achievement Badge ──────────────────────────────────────────────────────────
function AchievementBadge({ achievement }: {
  achievement: {
    key: string;
    title: string;
    description: string;
    icon: string;
    creditReward: number;
    category: string;
    unlocked: boolean;
    unlockedAt: Date | string | null;
  };
}) {
  const categoryColors: Record<string, string> = {
    creation: "from-blue-950/60 to-cyan-950/60 border-blue-700/40",
    streak: "from-orange-950/60 to-red-950/60 border-orange-700/40",
    milestone: "from-purple-950/60 to-violet-950/60 border-purple-700/40",
    social: "from-green-950/60 to-emerald-950/60 border-green-700/40",
  };

  const colorClass = categoryColors[achievement.category] ?? "from-muted/60 to-muted/40 border-muted";

  return (
    <div className={`relative rounded-xl border bg-gradient-to-br p-4 transition-all ${colorClass} ${achievement.unlocked ? "opacity-100" : "opacity-40 grayscale"}`}>
      {achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
        </div>
      )}
      {!achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <div className="font-bold text-sm">{achievement.title}</div>
      <div className="text-xs text-muted-foreground mt-1">{achievement.description}</div>
      <div className="flex items-center gap-1 mt-2">
        <Star className="w-3 h-3 text-yellow-400" />
        <span className="text-xs text-yellow-400 font-semibold">+{achievement.creditReward} kr</span>
      </div>
      {achievement.unlocked && achievement.unlockedAt && (
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(achievement.unlockedAt).toLocaleDateString("cs-CZ")}
        </div>
      )}
    </div>
  );
}

// ── Achievement Popup ──────────────────────────────────────────────────────────
function AchievementPopup({ achievements, onClose }: {
  achievements: Array<{ achievementKey: string; definition: { title: string; description: string; icon: string; creditReward: number } | null; id: number }>;
  onClose: () => void;
}) {
  if (achievements.length === 0) return null;
  const ach = achievements[0];
  const def = ach.definition;
  if (!def) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border-2 border-yellow-500/60 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl shadow-yellow-900/30 animate-in zoom-in-95">
        <div className="text-6xl mb-4 animate-bounce">{def.icon}</div>
        <div className="text-yellow-400 text-sm font-semibold uppercase tracking-wider mb-1">Achievement odemčen!</div>
        <div className="text-2xl font-black mb-2">{def.title}</div>
        <div className="text-muted-foreground text-sm mb-4">{def.description}</div>
        <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-lg mb-6">
          <Star className="w-5 h-5" />
          +{def.creditReward} kreditů přidáno
        </div>
        <Button onClick={onClose} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
          Super! 🎉
        </Button>
        {achievements.length > 1 && (
          <div className="text-xs text-muted-foreground mt-2">+{achievements.length - 1} dalších achievementů</div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function GamificationDashboard() {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [popupAchievements, setPopupAchievements] = useState<Array<{ achievementKey: string; definition: { title: string; description: string; icon: string; creditReward: number } | null; id: number }>>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: status, refetch } = trpc.gamification.status.useQuery(undefined, {
    enabled: !!user,
  });

  const claimMutation = trpc.gamification.claimDaily.useMutation({
    onSuccess: (data) => {
      toast.success(`+${data.bonusAmount} kreditů! Den ${data.newStreak} v řadě 🔥`);
      if (data.newlyUnlocked.length > 0) {
        setPopupAchievements(data.newlyUnlocked.map(a => ({
          achievementKey: a.achievementKey,
          definition: a.creditReward !== undefined ? { title: a.title ?? "", description: a.description ?? "", icon: a.icon ?? "", creditReward: a.creditReward } : null,
          id: 0,
        })));
        setShowPopup(true);
      }
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const markNotifiedMutation = trpc.gamification.markNotified.useMutation();

  // Show popup for pending notifications on load
  useEffect(() => {
    if (status?.pendingNotifications && status.pendingNotifications.length > 0 && !showPopup) {
      setPopupAchievements(status.pendingNotifications.map(n => ({
        achievementKey: n.achievementKey,
        definition: n.definition,
        id: n.id,
      })));
      setShowPopup(true);
    }
  }, [status?.pendingNotifications]);

  const handleClosePopup = () => {
    setShowPopup(false);
    const ids = popupAchievements.map(a => a.id).filter(id => id > 0);
    if (ids.length > 0) {
      markNotifiedMutation.mutate({ achievementIds: ids });
    }
    refetch();
  };

  const categories = [
    { key: "all", label: "Vše", icon: Trophy },
    { key: "creation", label: "Tvorba", icon: Video },
    { key: "streak", label: "Streak", icon: Flame },
    { key: "milestone", label: "Milníky", icon: Crown },
  ];

  const filteredAchievements = status?.allAchievements?.filter(a =>
    activeCategory === "all" || a.category === activeCategory
  ) ?? [];

  const unlockedCount = status?.allAchievements?.filter(a => a.unlocked).length ?? 0;
  const totalCount = status?.allAchievements?.length ?? 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-lg font-semibold mb-2">Přihlas se pro zobrazení achievementů</div>
          <Link href="/">
            <Button>Zpět na hlavní stránku</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Achievement Popup */}
      {showPopup && (
        <AchievementPopup achievements={popupAchievements} onClose={handleClosePopup} />
      )}

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" />
                Zpět
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-bold">Gamification</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{unlockedCount}/{totalCount} achievementů</span>
            <Progress value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} className="w-24 h-2" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Top Row: Daily Bonus + Streak */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DailyBonusCard
            canClaim={status?.streak.canClaimDaily ?? false}
            amount={status?.streak.dailyBonusAmount ?? 5}
            onClaim={() => claimMutation.mutate()}
            isLoading={claimMutation.isPending}
          />
          <div className="md:col-span-2">
            <StreakWidget
              streak={status?.streak ?? {
                current: 0, longest: 0, totalDays: 0,
                canClaimDaily: true, dailyBonusAmount: 5, lastClaimedAt: null
              }}
              onClaim={() => claimMutation.mutate()}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Flame, label: "Aktuální streak", value: `${status?.streak.current ?? 0} dní`, color: "text-orange-400" },
            { icon: Crown, label: "Nejdelší streak", value: `${status?.streak.longest ?? 0} dní`, color: "text-yellow-400" },
            { icon: Trophy, label: "Achievementy", value: `${unlockedCount}/${totalCount}`, color: "text-purple-400" },
            { icon: Calendar, label: "Celkem dní", value: `${status?.streak.totalDays ?? 0}`, color: "text-blue-400" },
          ].map(stat => (
            <Card key={stat.label} className="bg-card/50">
              <CardContent className="pt-4 pb-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-1 ${stat.color}`} />
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Achievement Badges
            </h2>
            <div className="flex gap-1">
              {categories.map(cat => (
                <Button
                  key={cat.key}
                  variant={activeCategory === cat.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.key)}
                  className="gap-1 text-xs"
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <div>Žádné achievementy v této kategorii</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredAchievements.map(ach => (
                <AchievementBadge key={ach.key} achievement={ach} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Jak získat kredity</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {[
              { icon: Gift, text: "Denní bonus: +5 až +25 kreditů", link: null },
              { icon: Flame, text: "7denní streak: +50 kreditů achievement", link: null },
              { icon: Video, text: "První video: +20 kreditů achievement", link: "/studio" },
              { icon: Users, text: "První Soul postava: +15 kreditů", link: "/characters" },
              { icon: Sparkles, text: "Použij Generate Hub: +10 kreditů", link: "/generate" },
              { icon: Diamond, text: "Power User (500 kr utraceno): +100 kr", link: null },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>{item.text}</span>
                {item.link && (
                  <Link href={item.link}>
                    <ChevronRight className="w-3 h-3 text-primary" />
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
