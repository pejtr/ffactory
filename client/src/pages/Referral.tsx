import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ─── Referral Page ────────────────────────────────────────────────────────────
export default function ReferralPage() {
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");

  const { data: codeData, isLoading: codeLoading } = trpc.referral.getMyCode.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: stats, isLoading: statsLoading } = trpc.referral.getStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    if (codeData?.path) {
      setReferralLink(`${window.location.origin}${codeData.path}`);
    }
  }, [codeData]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Odkaz zkopírován do schránky!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nepodařilo se zkopírovat odkaz");
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Video Factory — AI Video Studio",
          text: "Vytvářej cinematic AI videa zdarma! Použij můj referral odkaz a získej bonus kredity.",
          url: referralLink,
        });
      } catch {
        // user cancelled share
      }
    } else {
      handleCopy();
    }
  };
  // Read referral code from URL param if present (for landing on /referral?ref=CODE)
  const urlRef = new URLSearchParams(window.location.search).get("ref") ?? undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-2xl font-bold text-white mb-3">Pozvat přátele</h1>
          <p className="text-gray-400 mb-6">
            Přihlaste se a získejte svůj unikátní referral odkaz. Za každého pozvaného přítele dostanete <strong className="text-yellow-400">+50 kreditů</strong>.
          </p>
          <a
            href={getLoginUrl(urlRef)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
          >
            Přihlásit se
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Zpět
          </Link>
          <h1 className="text-lg font-bold text-white">Pozvat přátele</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-[#0a0a0f] border border-blue-500/20 p-8 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_70%)]" />
          <div className="relative">
            <div className="text-5xl mb-3">🎁</div>
            <h2 className="text-3xl font-extrabold text-white mb-2">
              Pozvi přátele, získej kredity
            </h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              Za každého přítele, který se zaregistruje přes tvůj odkaz, dostaneš{" "}
              <span className="text-yellow-400 font-bold">+50 kreditů</span>.
              Tvůj přítel dostane{" "}
              <span className="text-green-400 font-bold">+25 kreditů</span> jako uvítací bonus.
            </p>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <IconLink /> Tvůj referral odkaz
          </h3>

          {codeLoading ? (
            <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 overflow-hidden">
                <span className="truncate">{referralLink || "Načítání..."}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  <IconCopy />
                  {copied ? "Zkopírováno!" : "Kopírovat"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold text-sm transition-all text-white"
                >
                  <IconShare />
                  Sdílet
                </button>
              </div>
            </div>
          )}

          {codeData && (
            <p className="mt-3 text-xs text-gray-500">
              Kód: <span className="font-mono text-blue-400 font-bold">{codeData.code}</span>
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-blue-400 flex justify-center mb-2"><IconUsers /></div>
            <div className="text-3xl font-extrabold text-white">
              {statsLoading ? "—" : (stats?.totalReferrals ?? 0)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Pozvaných přátel</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-yellow-400 flex justify-center mb-2"><IconStar /></div>
            <div className="text-3xl font-extrabold text-white">
              {statsLoading ? "—" : (stats?.creditsEarned ?? 0)}
            </div>
            <div className="text-sm text-gray-400 mt-1">Kreditů získáno</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-green-400 flex justify-center mb-2"><IconGift /></div>
            <div className="text-3xl font-extrabold text-white">50</div>
            <div className="text-sm text-gray-400 mt-1">Kreditů za pozvánku</div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            Jak to funguje
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: "🔗",
                title: "Sdílej odkaz",
                desc: "Zkopíruj svůj unikátní referral odkaz a pošli ho přátelům — přes WhatsApp, Instagram, email nebo kdekoliv jinde.",
              },
              {
                step: "2",
                icon: "✅",
                title: "Přítel se zaregistruje",
                desc: "Tvůj přítel klikne na odkaz a zaregistruje se do Video Factory. Dostane +25 kreditů jako uvítací bonus.",
              },
              {
                step: "3",
                icon: "💰",
                title: "Ty dostaneš kredity",
                desc: "Automaticky ti přijde +50 kreditů na účet. Bez limitu — čím více přátel pozveš, tím více kreditů získáš.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div>
                  <div className="font-bold text-white mb-1">{item.title}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral history */}
        {stats && stats.referrals.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Historie pozvánek
            </h3>
            <div className="space-y-3">
              {stats.referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400">
                      {(r.referredName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{r.referredName}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString("cs-CZ")}
                      </div>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-bold text-sm">+{r.creditsAwarded} kreditů</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA to credits page */}
        <div className="text-center">
          <Link
            href="/credits"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Zobrazit historii kreditů →
          </Link>
        </div>
      </div>
    </div>
  );
}
