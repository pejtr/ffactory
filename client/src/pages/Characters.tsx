import { useState, useEffect } from "react";
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
  const [tab, setTab] = useState<"local" | "library">("local");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");

  const { data: characters, isLoading, refetch } = trpc.characters.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: higgsFieldData, isLoading: isLoadingHiggsfield } = trpc.higgsfield.listCharacters.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const higgsFieldCharacters = higgsFieldData?.characters ?? [];

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
      <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-border/50 backdrop-blur-md bg-background">
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
            <p className="text-sm text-muted-foreground mb-4">
              Create persistent character profiles for visual consistency across all scenes.
              Each character gets a unique Soul ID that maintains their appearance throughout your film.
            </p>
            
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <Button
                variant={tab === "local" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("local")}
                className="font-display text-xs tracking-wider"
              >
                MY CHARACTERS
              </Button>
              <Button
                variant={tab === "library" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("library")}
                className="font-display text-xs tracking-wider"
              >
                SOUL CINEMA LIBRARY ({higgsFieldCharacters.length})
              </Button>
            </div>
          </div>

          {/* Local Characters Tab */}
          {tab === "local" && isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : tab === "local" && chars.length === 0 ? (
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
          ) : tab === "local" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chars.map((char) => (
                <Card key={char.id} className="bg-card/50 border-border/60 hover:border-primary/40 transition-all">
                  <div className="p-4">
                    {char.referenceImageUrl && (
                      <div className="w-full h-40 mb-3 rounded-lg overflow-hidden bg-muted/20">
                        <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-display text-sm font-bold text-foreground mb-1">{char.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{char.description}</p>
                    {char.personality && <p className="text-xs text-muted-foreground mb-3"><span className="text-primary">Personality:</span> {char.personality}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs font-display h-7">
                        <Edit className="w-3 h-3 mr-1" />EDIT
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs font-display h-7 text-red-400 border-red-500/40 hover:bg-red-500/10"
                        onClick={() => deleteMutation.mutate({ characterId: char.id })}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />DELETE
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {/* Higgsfield Library Tab */}
          {tab === "library" && isLoadingHiggsfield ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : tab === "library" && higgsFieldCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border/40 rounded-xl gap-4">
              <Users className="w-12 h-12 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No Soul Cinema characters available</p>
              </div>
            </div>
          ) : tab === "library" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {higgsFieldCharacters.map((char: any) => (
                <Card key={char.id} className="bg-card/50 border-border/60 hover:border-primary/40 transition-all overflow-hidden group">
                  <div className="p-4">
                    {char.imageUrl && (
                      <div className="w-full h-40 mb-3 rounded-lg overflow-hidden bg-muted/20">
                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <h3 className="font-display text-sm font-bold text-foreground mb-1 truncate">{char.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{char.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                        {char.category}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-display tracking-wider h-7"
                        onClick={() => {
                          toast.success(`Imported: ${char.name}`);
                          // TODO: Add import functionality
                        }}
                      >
                        IMPORT
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
