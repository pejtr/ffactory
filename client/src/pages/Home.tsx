import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Film, Zap, Music, Users, Star, ChevronRight, Cpu, Wand2, FolderOpen } from "lucide-react";

const MODELS = [
  { name: "Kling 3.0 Omni", type: "Dialogy + Audio", color: "text-blue-400" },
  { name: "Kling Motion Control", type: "Akční scény", color: "text-purple-400" },
  { name: "Hailuo MiniMax 2.3", type: "Filmový B-roll", color: "text-teal-400" },
  { name: "WAN 2.2 S2V", type: "Lip Sync", color: "text-green-400" },
  { name: "ElevenLabs", type: "Hlas & SFX", color: "text-orange-400" },
  { name: "Kie.ai Music", type: "Orchestrální BGM", color: "text-yellow-400" },
];

const FEATURES = [
  { icon: Wand2, title: "AI Scénář Engine", desc: "Gemini AI vytvoří hollywoodský scénář s emočními oblouky, rozpisem scén a filmovými prompty.", color: "text-cyan-400" },
  { icon: Zap, title: "Chytrý Model Router", desc: "Automaticky vybere nejlepší AI model pro každou scénu — dialogy, akce, B-roll, lip sync nebo sny.", color: "text-yellow-400" },
  { icon: Users, title: "Soul Cinema Systém", desc: "Konzistentní postavy napříč všemi scénami. Vytvořte profily postav se Soul ID pro vizuální kontinuitu.", color: "text-purple-400" },
  { icon: Music, title: "Adaptivní Soundtrack", desc: "AI generuje orchestrální hudbu přizpůsobenou emočnímu oblouku vašeho příběhu.", color: "text-green-400" },
  { icon: Film, title: "Sdílatelné Odkazy", desc: "Každý projekt dostane veřejný sdílatelný odkaz. Sdílejte svá AI videa okamžitě s celým světem.", color: "text-blue-400" },
  { icon: Cpu, title: "Optimalizátor Nákladů", desc: "Až 80% levnější než Higgsfield. Chytrý routing používá nejefektivnější model pro každý typ scény.", color: "text-red-400" },
];

const STEPS = [
  { num: "01", title: "Zadejte nápad", desc: "Popište svůj příběh — od jednoduchého nápadu až po detailní scénář." },
  { num: "02", title: "Vyberte styl", desc: "Zvolte žánr, emocionální tón, délku a zapněte Dream Mode pro surrealistické scény." },
  { num: "03", title: "Zkontrolujte scénář", desc: "AI vygeneruje kompletní scénář s rozpisem scén, modely a odhadem nákladů." },
  { num: "04", title: "Vytvořte video", desc: "Pipeline automaticky generuje všechny scény, audio a hudbu paralelně." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-[oklch(0.08_0.02_240)] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md bg-black/40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Film className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-['Orbitron'] text-lg font-bold text-cyan-400" style={{ textShadow: "0 0 20px rgba(6,182,212,0.5)" }}>VIDEO FACTORY</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white/90">
                    <FolderOpen className="w-4 h-4 mr-2" />Moje projekty
                  </Button>
                </Link>
                <Link href="/characters">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white/90">
                    <Users className="w-4 h-4 mr-2" />Postavy
                  </Button>
                </Link>
                <Link href="/studio">
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                    Otevřít Studio <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                  Spustit Studio <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, oklch(0.3 0.1 220) 0%, transparent 70%)"
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(oklch(0.2 0.05 220 / 0.1) 1px, transparent 1px), linear-gradient(90deg, oklch(0.2 0.05 220 / 0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="max-w-7xl mx-auto px-4 relative text-center">
          <Badge variant="outline" className="mb-6 border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-['Orbitron'] text-xs tracking-widest">
            ✦ HOLLYWOODSKÉ AI VIDEO STUDIO ✦
          </Badge>
          <h1 className="font-['Orbitron'] text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-white/90">VYTVOŘTE</span>{" "}
            <span className="text-cyan-400" style={{ textShadow: "0 0 40px rgba(6,182,212,0.6)" }}>FILMOVÁ</span>
            <br />
            <span className="text-white/90">AI VIDEA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-4 font-light">
            Od nápadu k hollywoodskému videu za minuty. Multi-model AI pipeline s emočním vyprávěním, konzistentními postavami a adaptivními soundtracky.
          </p>
          <p className="text-sm text-cyan-400 font-medium mb-10">
            Až 80% levnější než Higgsfield · Kling 3.0 · WAN 2.2 · Hailuo MiniMax 2.3
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link href="/studio">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 text-base" style={{ boxShadow: "0 0 30px rgba(6,182,212,0.4)" }}>
                    <Film className="w-5 h-5 mr-2" />Otevřít Studio
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button size="lg" variant="outline" className="border-white/20 text-white/70 hover:text-white hover:border-white/40 px-8 text-base">
                    <FolderOpen className="w-5 h-5 mr-2" />Moje projekty
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 text-base" style={{ boxShadow: "0 0 30px rgba(6,182,212,0.4)" }}>
                  <Film className="w-5 h-5 mr-2" />Začít zdarma
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-['Orbitron'] text-3xl md:text-4xl font-bold text-white/90 mb-4">
              JAK TO <span className="text-cyan-400">FUNGUJE</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Čtyři jednoduché kroky od nápadu k hotovému videu</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative">
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-cyan-500/30 to-transparent z-10" />
                )}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-cyan-500/30 hover:bg-white/8 transition-all">
                  <div className="font-['Orbitron'] text-3xl font-black text-cyan-400/30 mb-3">{step.num}</div>
                  <h3 className="font-bold text-white/90 mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs font-['Orbitron'] tracking-widest text-white/40 mb-8 uppercase">Poháněno nejlepšími AI modely</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {MODELS.map((m) => (
              <div key={m.name} className="rounded-lg p-3 bg-white/5 border border-white/10 text-center hover:border-white/20 transition-all">
                <div className="text-xs font-semibold text-white/80 leading-tight">{m.name}</div>
                <div className={"text-xs mt-1 " + m.color}>{m.type}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-['Orbitron'] text-3xl md:text-4xl font-bold text-white/90 mb-4">
              MOŽNOSTI <span className="text-cyan-400">STUDIA</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">Vše co potřebujete pro profesionální AI filmovou produkci</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl p-6 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all group">
                <f.icon className={`w-8 h-8 mb-4 ${f.color} group-hover:scale-110 transition-transform`} />
                <h3 className="font-bold text-white/90 mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stargate CTA */}
      <section className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 p-8 md:p-12 text-center">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "linear-gradient(oklch(0.5 0.1 220 / 0.2) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.1 220 / 0.2) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
            <div className="relative">
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-['Orbitron'] text-xs tracking-widest">✦ PILOTNÍ PROJEKT ✦</Badge>
              <h2 className="font-['Orbitron'] text-2xl md:text-4xl font-black text-white/90 mb-3">STARGATE: LEGACY</h2>
              <p className="text-white/60 mb-2 max-w-lg mx-auto">SG-1 + Atlantis postavy · Destiny-class technologie cestování na dálku</p>
              <p className="text-sm text-cyan-400 mb-8">Náš první hollywoodský AI seriál — testuje každou schopnost pipeline</p>
              {isAuthenticated ? (
                <Link href="/studio">
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm" size="lg" style={{ boxShadow: "0 0 30px rgba(6,182,212,0.4)" }}>
                    <Wand2 className="w-5 h-5 mr-2" />VYTVOŘIT PILOTNÍ EPIZODU
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm" size="lg" style={{ boxShadow: "0 0 30px rgba(6,182,212,0.4)" }}>
                    <Wand2 className="w-5 h-5 mr-2" />VYTVOŘIT PILOTNÍ EPIZODU
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="font-['Orbitron'] text-sm text-white/40">VIDEO FACTORY</span>
          </div>
          <p className="text-xs text-white/30">Hollywoodská AI video produkce · Multi-model pipeline · Soul Cinema systém</p>
        </div>
      </footer>
    </div>
  );
}
