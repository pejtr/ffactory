import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Film, ChevronLeft, Plus, Users, Loader2, Star, Mic, Trash2, Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getLoginUrl } from "@/const";

export default function Characters() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");

  const { data: characters, isLoading, refetch } = trpc.characters.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.characters.create.useMutation({
    onSuccess: () => {
      toast.success("Character created!");
      setOpen(false);
      setName(""); setDescription(""); setPersonality(""); setVoiceDescription(""); setReferenceImageUrl("");
      refetch();
    },
    onError: (err: { message: string }) => toast.error(`Failed: ${err.message}`),
  });

  const deleteMutation = trpc.characters.delete.useMutation({
    onSuccess: () => { toast.success("Character deleted"); refetch(); },
    onError: (err: { message: string }) => toast.error(`Failed: ${err.message}`),
  });

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({ name, description, personality, voiceName: voiceDescription });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to manage characters</p>
          <a href={getLoginUrl()}><Button className="glow-blue font-display tracking-wider">SIGN IN</Button></a>
        </div>
      </div>
    );
  }

  const chars = (characters ?? []) as Array<{
    id: number; name: string; description?: string; personality?: string;
    voiceDescription?: string; referenceImageUrl?: string; soulId?: string;
  }>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/studio"><Button variant="ghost" size="sm" className="text-muted-foreground"><ChevronLeft className="w-4 h-4 mr-1" />Studio</Button></Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-display text-sm text-primary">SOUL CINEMA — CHARACTERS</span>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="glow-blue font-display text-xs tracking-wider">
                <Plus className="w-4 h-4 mr-2" />NEW CHARACTER
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/60 max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-primary">CREATE CHARACTER</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1 block">Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Colonel Jack O'Neill" className="bg-background/50 border-border/60" />
                </div>
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1 block">Visual Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Physical appearance, age, clothing, distinctive features..." className="bg-background/50 border-border/60 resize-none min-h-[80px]" />
                </div>
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1 block">Personality</Label>
                  <Input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="e.g. Sarcastic, brave, protective of team" className="bg-background/50 border-border/60" />
                </div>
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1 block">Voice Style</Label>
                  <Input value={voiceDescription} onChange={(e) => setVoiceDescription(e.target.value)} placeholder="e.g. Deep, authoritative, slight American accent" className="bg-background/50 border-border/60" />
                </div>
                <div>
                  <Label className="text-xs font-display tracking-wider text-muted-foreground uppercase mb-1 block">Reference Image URL (optional)</Label>
                  <Input value={referenceImageUrl} onChange={(e) => setReferenceImageUrl(e.target.value)} placeholder="https://..." className="bg-background/50 border-border/60" />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full glow-blue font-display tracking-wider">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Star className="w-4 h-4 mr-2" />}
                  CREATE SOUL ID
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="pt-20 pb-16">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              SOUL CINEMA <span className="text-primary text-glow">CHARACTERS</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Create persistent character profiles for visual consistency across all scenes.
              Each character gets a unique Soul ID that maintains their appearance throughout your film.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : chars.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border/40 rounded-xl gap-4">
              <Users className="w-12 h-12 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No characters yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first character to enable Soul Cinema consistency</p>
              </div>
              <Button variant="outline" onClick={() => setOpen(true)} className="border-primary/40 text-primary hover:bg-primary/10 font-display text-xs tracking-wider">
                <Plus className="w-4 h-4 mr-2" />CREATE FIRST CHARACTER
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chars.map((char) => (
                <Card key={char.id} className="video-card p-4 bg-card/60 border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                      {char.referenceImageUrl ? (
                        <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-primary/60" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ characterId: char.id })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-display text-sm font-bold text-foreground mb-1">{char.name}</h3>
                  {char.description && <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{char.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {char.personality && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                        <Star className="w-2 h-2 mr-1" />{char.personality.substring(0, 20)}
                      </Badge>
                    )}
                    {char.voiceDescription && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                        <Mic className="w-2 h-2 mr-1" />{char.voiceDescription.substring(0, 20)}
                      </Badge>
                    )}
                    {char.soulId && (
                      <Badge className="text-xs bg-accent/20 text-accent border-accent/30">
                        Soul ID ✓
                      </Badge>
                    )}
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
