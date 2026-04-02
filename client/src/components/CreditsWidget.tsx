import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Coins } from "lucide-react";

export function CreditsWidget() {
  const { user } = useAuth();
  const { data } = trpc.credits.balance.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (!user) return null;

  const balance = data?.balance ?? 0;

  return (
    <Link href="/credits">
      <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-950/30 border border-yellow-800/40 hover:border-yellow-600/60 transition-colors text-xs font-mono">
        <Coins className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-yellow-300 font-medium">{balance}</span>
      </button>
    </Link>
  );
}
