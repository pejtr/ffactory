import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { Film, Play, Share2, Loader2, XCircle, ExternalLink, Clapperboard } from "lucide-react";
import { toast } from "sonner";

export default function SharedVideo() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const { data: project, isLoading } = trpc.video.getShared.useQuery(
    { token },
    { enabled: !!token && token !== "demo" }
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    toast.success("Odkaz zkopírován do schránky!");
  };

  // Demo stránka
  if (token === "demo") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
        <nav className="border-b border-slate-800/60 backdrop-blur-md bg-[#0a0f1a]/80 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Clapperboard className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold text-sm">Video Factory</span>
              </div>
            </Link>
            <Link href="/studio">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                Vytvořit vlastní video
              </Button>
            </Link>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">✦ DEMO ✦</Badge>
          <h1 className="text-3xl font-bold text-white">Stargate: Legacy</h1>
          <p className="text-slate-400">SG-1 + Atlantis · Technologie třídy Destiny</p>
          <div className="w-full max-w-2xl aspect-video bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-center">
            <div className="text-center space-y-3">
              <Play className="w-16 h-16 text-blue-400/40 mx-auto" />
              <p className="text-slate-500 text-sm">Demo ukázka — tvoje video bude tady</p>
            </div>
          </div>
          <Link href="/studio">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" size="lg">
              <Film className="w-5 h-5 mr-2" /> Vytvořit vlastní film
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Načítám film...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-4">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Film nenalezen</h2>
          <p className="text-slate-400 text-sm">Tento odkaz je neplatný nebo vypršel.</p>
          <Link href="/"><Button variant="outline" className="border-slate-600 text-slate-300">Domů</Button></Link>
        </div>
      </div>
    );
  }

  const raw = project as { project: { title: string; finalVideoUrl?: string; totalCostUsd?: number; status: string } };
  const p = raw.project;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
      <nav className="border-b border-slate-800/60 backdrop-blur-md bg-[#0a0f1a]/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Clapperboard className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold text-sm">Video Factory</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs">
              <Share2 className="w-3 h-3 mr-1" /> Sdílet
            </Button>
            <Link href="/studio">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
                Vytvořit vlastní video
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-white">{p.title}</h1>
            <p className="text-xs text-slate-500">Vytvořeno pomocí Video Factory AI</p>
          </div>

          {p.finalVideoUrl ? (
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-700/50">
              <video src={p.finalVideoUrl} controls autoPlay className="w-full h-full" />
            </div>
          ) : (
            <div className="aspect-video bg-slate-800/40 border border-slate-700/40 rounded-xl flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Video se zpracovává...</p>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {p.status === "assembling" ? "Střihuji..." : "Generuji scény..."}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 flex-wrap">
            <Button variant="outline" onClick={handleShare}
              className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Share2 className="w-4 h-4 mr-2" /> Sdílet tento film
            </Button>
            {p.finalVideoUrl && (
              <a href={p.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  <ExternalLink className="w-4 h-4 mr-2" /> Otevřít v nové záložce
                </Button>
              </a>
            )}
            <Link href="/studio">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                <Film className="w-4 h-4 mr-2" /> Vytvořit vlastní film
              </Button>
            </Link>
          </div>

          {p.totalCostUsd != null && (
            <p className="text-center text-xs text-slate-600">
              Cena produkce: <span className="text-yellow-500">${p.totalCostUsd.toFixed(4)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
