import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Link } from "wouter";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconYouTube() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
function IconDisconnect() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    uploading: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    published: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labels: Record<string, string> = {
    draft: "Koncept",
    scheduled: "Naplánováno",
    uploading: "Nahrávání...",
    published: "Publikováno",
    failed: "Chyba",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Format number ────────────────────────────────────────────────────────────
function formatNumber(n: number | null | undefined): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ChannelManager() {
  const { user, isAuthenticated, loading } = useAuth();
  const [connecting, setConnecting] = useState(false);

  // Queries
  const channelsQuery = trpc.youtube.list.useQuery(undefined, { enabled: isAuthenticated });
  const postsQuery = trpc.youtube.listPosts.useQuery(undefined, { enabled: isAuthenticated });
  const authUrlQuery = trpc.youtube.getAuthUrl.useQuery(
    { origin: typeof window !== "undefined" ? window.location.origin : "" },
    { enabled: isAuthenticated }
  );

  // Mutations
  const disconnectMutation = trpc.youtube.disconnect.useMutation();
  const refreshStatsMutation = trpc.youtube.refreshStats.useMutation();
  const utils = trpc.useUtils();

  // Auth redirect
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleConnect = () => {
    if (authUrlQuery.data?.error) {
      toast.error(authUrlQuery.data.error);
      return;
    }
    if (authUrlQuery.data?.url) {
      setConnecting(true);
      window.location.href = authUrlQuery.data.url;
    } else {
      toast.error("YouTube OAuth URL není k dispozici.");
    }
  };

  const handleDisconnect = async (id: number) => {
    if (!confirm("Opravdu chcete odpojit tento kanál?")) return;
    try {
      await disconnectMutation.mutateAsync({ id });
      toast.success("Kanál odpojen");
      utils.youtube.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Chyba při odpojování");
    }
  };

  const handleRefresh = async (id: number) => {
    try {
      await refreshStatsMutation.mutateAsync({ id });
      toast.success("Statistiky aktualizovány");
      utils.youtube.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Chyba při aktualizaci");
    }
  };

  const channels = channelsQuery.data || [];
  const posts = postsQuery.data || [];
  const isYouTubeConfigured = authUrlQuery.data && !authUrlQuery.data.error;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <IconArrowLeft />
                <span className="text-sm">Zpět</span>
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <IconYouTube />
            </div>
            <span className="font-display text-lg font-bold text-red-400">CHANNEL EMPIRE</span>
          </div>
          <div />
        </div>
      </nav>

      <div className="container pt-24 pb-16 max-w-5xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-black mb-3">
            <span className="text-foreground">YOUR </span>
            <span className="text-red-400">YOUTUBE</span>
            <span className="text-foreground"> EMPIRE</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Připojte své YouTube kanály, generujte SEO metadata, thumbnaily a publikujte videa přímo z Video Factory.
          </p>
        </div>

        {/* Not configured warning */}
        {!isYouTubeConfigured && !authUrlQuery.isLoading && (
          <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
            <div className="text-yellow-400 text-lg font-bold mb-2">⚠️ YouTube API není nakonfigurováno</div>
            <p className="text-muted-foreground text-sm mb-3">
              Pro připojení YouTube kanálu je potřeba nastavit YOUTUBE_CLIENT_ID a YOUTUBE_CLIENT_SECRET v nastavení projektu.
            </p>
            <p className="text-xs text-muted-foreground">
              Vytvořte OAuth 2.0 credentials v{" "}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                Google Cloud Console
              </a>{" "}
              a přidejte redirect URI: <code className="text-xs bg-card px-1 py-0.5 rounded">{window.location.origin}/youtube-callback</code>
            </p>
          </div>
        )}

        {/* Connect Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleConnect}
            disabled={connecting || !isYouTubeConfigured}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-red-600/20"
          >
            <IconPlus />
            <span>Připojit YouTube kanál</span>
          </button>
        </div>

        {/* Connected Channels */}
        {channels.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <IconYouTube />
              Připojené kanály ({channels.length})
            </h2>
            <div className="grid gap-4">
              {channels.map((ch) => (
                <div key={ch.id} className="rounded-xl border border-border/50 bg-card/60 p-5 flex items-center gap-4">
                  {/* Channel thumbnail */}
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-red-500/30 flex-shrink-0">
                    {ch.thumbnailUrl ? (
                      <img src={ch.thumbnailUrl} alt={ch.channelName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-500/20 flex items-center justify-center text-red-400">
                        <IconYouTube />
                      </div>
                    )}
                  </div>

                  {/* Channel info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground truncate">{ch.channelName}</div>
                    {ch.channelHandle && (
                      <div className="text-xs text-muted-foreground">{ch.channelHandle}</div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1" title="Odběratelé">
                      <IconUsers />
                      <span>{formatNumber(ch.subscriberCount)}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Videa">
                      <IconVideo />
                      <span>{formatNumber(ch.videoCount)}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Zhlédnutí">
                      <IconEye />
                      <span>{formatNumber(ch.viewCount)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRefresh(ch.id)}
                      disabled={refreshStatsMutation.isPending}
                      className="p-2 rounded-lg hover:bg-card border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                      title="Aktualizovat statistiky"
                    >
                      <IconRefresh />
                    </button>
                    <button
                      onClick={() => handleDisconnect(ch.id)}
                      disabled={disconnectMutation.isPending}
                      className="p-2 rounded-lg hover:bg-red-500/10 border border-border/50 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Odpojit kanál"
                    >
                      <IconDisconnect />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {channels.length === 0 && !channelsQuery.isLoading && (
          <div className="text-center py-12 rounded-xl border border-border/30 bg-card/30 mb-12">
            <div className="text-4xl mb-3">📺</div>
            <div className="text-foreground font-bold mb-1">Žádné připojené kanály</div>
            <p className="text-sm text-muted-foreground">Připojte svůj YouTube kanál a začněte publikovat AI videa přímo na YouTube.</p>
          </div>
        )}

        {/* Posts History */}
        {posts.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-4">
              📋 Historie publikací ({posts.length})
            </h2>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card/80 border-b border-border/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Video</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Kanál</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Datum</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Statistiky</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-border/30 hover:bg-card/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground truncate max-w-[200px]">{post.title}</div>
                        {post.youtubeVideoId && (
                          <a
                            href={`https://youtube.com/watch?v=${post.youtubeVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Otevřít na YouTube →
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {channels.find((c) => c.id === post.channelId)?.channelName || `#${post.channelId}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("cs-CZ")
                          : post.scheduledAt
                          ? `Plán: ${new Date(post.scheduledAt).toLocaleDateString("cs-CZ")}`
                          : new Date(post.createdAt).toLocaleDateString("cs-CZ")}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {post.status === "published" && (
                          <span>{formatNumber(post.viewCount)} zhlédnutí</span>
                        )}
                        {post.status === "failed" && (
                          <span className="text-red-400" title={post.errorMessage || ""}>Chyba</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Blueprint CTA */}
        <section className="mt-12 mb-8">
          <Link href="/channel-blueprint">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center hover:bg-primary/10 transition-all cursor-pointer group">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                CHANNEL BLUEPRINT GENERATOR
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto text-sm mb-4">
                AI vygeneruje kompletní strategii: 30 video nápadů s SEO, brand identity, 90-denní roadmapu a monetizační plán.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">🔍 Validace niché</span>
                <span>→</span>
                <span className="flex items-center gap-1">📋 30 videí</span>
                <span>→</span>
                <span className="flex items-center gap-1">🎨 Branding</span>
                <span>→</span>
                <span className="flex items-center gap-1">🗺️ Roadmapa</span>
              </div>
            </div>
          </Link>
        </section>

        {/* Quick Actions */}
        <section className="grid md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/50 bg-card/40 p-5 text-center">
            <div className="text-2xl mb-2">🎬</div>
            <div className="font-bold text-foreground text-sm mb-1">AI SEO Metadata</div>
            <p className="text-xs text-muted-foreground">Titulky, popisy, tagy + chapters optimalizované pro YouTube.</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/40 p-5 text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="font-bold text-foreground text-sm mb-1">A/B Thumbnaily</div>
            <p className="text-xs text-muted-foreground">3 varianty thumbnailů pro A/B testování na YouTube.</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/40 p-5 text-center">
            <div className="text-2xl mb-2">🌍</div>
            <div className="font-bold text-foreground text-sm mb-1">Multi-language</div>
            <p className="text-xs text-muted-foreground">Přeložte skripty do 20 jazyků a rozšiřte dosah globálně.</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/40 p-5 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-bold text-foreground text-sm mb-1">Policy Check</div>
            <p className="text-xs text-muted-foreground">AI kontrola unikátnosti a souladu s YouTube pravidly.</p>
          </div>
        </section>

        {/* Best Practices Tip */}
        <section className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
          <h4 className="font-bold text-blue-400 text-sm mb-2">💡 Best Practices pro maximální růst</h4>
          <div className="grid md:grid-cols-2 gap-3 text-xs text-blue-200">
            <div>• Publikujte min. 3-5× týdně (ideálně denně)</div>
            <div>• Cílte na 8-10 min délku videa (monetizace)</div>
            <div>• Každé video musí být UNIKÁTNÍ (ne repetitivní)</div>
            <div>• A/B testujte thumbnaily pro vyšší CTR</div>
            <div>• Používejte chapters/timestamps pro SEO</div>
            <div>• Plánujte digitální produkty od začátku</div>
          </div>
        </section>
      </div>
    </div>
  );
}
