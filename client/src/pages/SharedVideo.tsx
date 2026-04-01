import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { Film, Play, Share2, Loader2, XCircle, ExternalLink } from "lucide-react";
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
    toast.success("Link copied!");
  };

  if (token === "demo") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <nav className="border-b border-border/50 backdrop-blur-md bg-background/80 p-4">
          <div className="container flex items-center justify-between">
            <Link href="/"><div className="flex items-center gap-2 cursor-pointer"><Film className="w-5 h-5 text-primary" /><span className="font-display text-sm text-primary">VIDEO FACTORY</span></div></Link>
            <Link href="/studio"><Button size="sm" className="glow-blue font-display text-xs tracking-wider">CREATE YOUR FILM</Button></Link>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 font-display text-xs tracking-widest">✦ DEMO ✦</Badge>
          <h1 className="font-display text-3xl font-black text-primary text-glow mb-3">STARGATE: LEGACY</h1>
          <p className="text-muted-foreground mb-2">SG-1 + Atlantis · Destiny-class technology</p>
          <p className="text-sm text-muted-foreground mb-8 max-w-lg">
            This is a demo placeholder. Create your own Hollywood-grade AI film using the Video Factory Studio.
          </p>
          <div className="w-full max-w-2xl aspect-video bg-card/60 border border-primary/20 rounded-xl flex items-center justify-center mb-8 glow-blue">
            <div className="text-center">
              <Play className="w-16 h-16 text-primary/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-display tracking-wider">DEMO VIDEO PLACEHOLDER</p>
              <p className="text-xs text-muted-foreground mt-1">Your generated video will appear here</p>
            </div>
          </div>
          <Link href="/studio">
            <Button className="glow-teal font-display tracking-wider" size="lg">
              <Film className="w-5 h-5 mr-2" />CREATE YOUR OWN FILM
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display tracking-wider text-sm">LOADING FILM...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground mb-2">Film not found</p>
          <p className="text-sm text-muted-foreground mb-6">This link may have expired or the film is not public.</p>
          <Link href="/"><Button variant="outline">Go to Video Factory</Button></Link>
        </div>
      </div>
    );
  }

  const raw = project as { project: { title: string; finalVideoUrl?: string; totalCostUsd?: number } };
  const p = raw.project;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="border-b border-border/50 backdrop-blur-md bg-background/80 p-4">
        <div className="container flex items-center justify-between">
          <Link href="/"><div className="flex items-center gap-2 cursor-pointer"><Film className="w-5 h-5 text-primary" /><span className="font-display text-sm text-primary">VIDEO FACTORY</span></div></Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="border-border/60 text-xs font-display tracking-wide">
              <Share2 className="w-3 h-3 mr-2" />SHARE
            </Button>
            <Link href="/studio"><Button size="sm" className="glow-blue font-display text-xs tracking-wider">CREATE YOUR FILM</Button></Link>
          </div>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          <h1 className="font-display text-2xl font-black text-primary text-glow mb-2 text-center">{p.title}</h1>
          <p className="text-center text-xs text-muted-foreground mb-6 font-display tracking-wider">MADE WITH VIDEO FACTORY AI</p>
          {p.finalVideoUrl ? (
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-primary/20 glow-blue mb-6">
              <video src={p.finalVideoUrl} controls autoPlay className="w-full h-full" />
            </div>
          ) : (
            <div className="aspect-video bg-card/60 border border-border/40 rounded-xl flex items-center justify-center mb-6">
              <div className="text-center">
                <Play className="w-12 h-12 text-primary/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Video processing...</p>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={handleShare} className="border-border/60 font-display text-xs tracking-wider">
              <Share2 className="w-4 h-4 mr-2" />SHARE THIS FILM
            </Button>
            {p.finalVideoUrl && (
              <a href={p.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-border/60 font-display text-xs tracking-wider">
                  <ExternalLink className="w-4 h-4 mr-2" />OPEN IN NEW TAB
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
