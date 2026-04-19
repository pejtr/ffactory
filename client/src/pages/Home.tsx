import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Film, Zap, Music, Users, Star, ChevronRight, Cpu, Layers, Mic, Video, Wand2, Globe, BookOpen } from "lucide-react";

const MODELS = [
  { name: "Kling 3.0 Omni", type: "Dialogue + Audio", color: "text-blue-400", icon: "mic" },
  { name: "Kling Motion Control", type: "Action Scenes", color: "text-purple-400", icon: "video" },
  { name: "Hailuo MiniMax 2.3", type: "Cinematic B-roll", color: "text-teal-400", icon: "film" },
  { name: "WAN 2.2 S2V", type: "Lip Sync", color: "text-green-400", icon: "cpu" },
  { name: "ElevenLabs", type: "Voice & SFX", color: "text-orange-400", icon: "mic" },
  { name: "Kie.ai Music", type: "Orchestral BGM", color: "text-yellow-400", icon: "music" },
];

const FEATURES = [
  { title: "AI Screenplay Engine", desc: "Gemini AI generates Hollywood-grade screenplays with emotional arcs, scene breakdowns, and cinematic prompts." },
  { title: "Smart Model Router", desc: "Automatically selects the best AI model per scene — dialogue, action, B-roll, lip sync, or dream sequences." },
  { title: "Soul Cinema System", desc: "Consistent characters across all scenes. Create character profiles with Soul IDs for visual continuity." },
  { title: "Adaptive Soundtrack", desc: "AI-generated orchestral scores matched to your emotional arc via Kie.ai Suno Music API." },
  { title: "Shareable Links", desc: "Every project gets a public shareable link. Share your AI films with the world instantly." },
  { title: "Cost Optimizer", desc: "Up to 80% cheaper than Higgsfield. Smart routing uses the most cost-effective model for each scene type." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-blue">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-primary text-glow">VIDEO FACTORY</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/characters"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground"><Users className="w-4 h-4 mr-2" />Characters</Button></Link>
                <Link href="/templates"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground"><BookOpen className="w-4 h-4 mr-2" />Templates</Button></Link>
                <Link href="/studio"><Button size="sm" className="glow-blue font-display text-xs tracking-wider">OPEN STUDIO <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
              </>
            ) : (
              <a href={getLoginUrl()}><Button size="sm" className="glow-blue font-display text-xs tracking-wider">LAUNCH STUDIO <ChevronRight className="w-4 h-4 ml-1" /></Button></a>
            )}
          </div>
        </div>
      </nav>
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 atlantis-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-primary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-primary/20 pointer-events-none" />
        <div className="container relative text-center">
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary bg-primary/10 font-display text-xs tracking-widest">✦ HOLLYWOOD-GRADE AI VIDEO STUDIO ✦</Badge>
          <h1 className="font-display text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-foreground">CREATE</span> <span className="text-primary text-glow">CINEMATIC</span><br />
            <span className="text-foreground">AI VIDEOS</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 font-light">From idea to Hollywood-grade video in minutes. Multi-model AI pipeline with emotional storytelling, consistent characters, and adaptive soundtracks.</p>
          <p className="text-sm text-accent font-medium mb-10">Up to 80% cheaper than Higgsfield · Kling 3.0 · WAN 2.2 · Hailuo MiniMax 2.3</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/studio"><Button size="lg" className="glow-blue font-display tracking-wider text-sm px-8"><Film className="w-5 h-5 mr-2" />OPEN STUDIO</Button></Link>
            ) : (
              <a href={getLoginUrl()}><Button size="lg" className="glow-blue font-display tracking-wider text-sm px-8"><Film className="w-5 h-5 mr-2" />START CREATING FREE</Button></a>
            )}
          </div>
        </div>
      </section>
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <p className="text-center text-xs font-display tracking-widest text-muted-foreground mb-8 uppercase">Powered by the best AI models</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MODELS.map((m) => (
              <div key={m.name} className="video-card rounded-lg p-3 bg-card/50 border border-border/50 text-center">
                <div className="text-xs font-semibold text-foreground leading-tight">{m.name}</div>
                <div className={"text-xs mt-1 " + m.color}>{m.type}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">STUDIO <span className="text-primary text-glow">CAPABILITIES</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to produce professional AI films.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="video-card rounded-xl p-6 bg-card/60 border border-border/50">
                <h3 className="font-display text-sm font-bold text-foreground mb-2 tracking-wide">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card/40 p-8 md:p-12 text-center glow-blue">
            <div className="absolute inset-0 atlantis-grid opacity-20" />
            <div className="relative">
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 font-display text-xs tracking-widest">✦ PILOT PROJECT ✦</Badge>
              <h2 className="font-display text-2xl md:text-4xl font-black text-foreground mb-3">STARGATE: LEGACY</h2>
              <p className="text-muted-foreground mb-2 max-w-lg mx-auto">SG-1 + Atlantis characters · Destiny-class long-range travel technology</p>
              <p className="text-sm text-accent mb-8">Our first Hollywood-grade AI series — testing every capability of the pipeline</p>
              {isAuthenticated ? (
                <Link href="/studio"><Button className="glow-teal font-display tracking-wider text-sm" size="lg"><Wand2 className="w-5 h-5 mr-2" />CREATE PILOT EPISODE</Button></Link>
              ) : (
                <a href={getLoginUrl()}><Button className="glow-teal font-display tracking-wider text-sm" size="lg"><Wand2 className="w-5 h-5 mr-2" />CREATE PILOT EPISODE</Button></a>
              )}
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-border/30 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><Film className="w-4 h-4 text-primary" /><span className="font-display text-sm text-muted-foreground">VIDEO FACTORY</span></div>
          <p className="text-xs text-muted-foreground">Hollywood-grade AI video production · Multi-model pipeline · Soul Cinema system</p>
        </div>
      </footer>
    </div>
  );
}
