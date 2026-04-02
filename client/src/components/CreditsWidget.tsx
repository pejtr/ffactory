import { Link } from "wouter";
import { Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Malý widget zobrazující aktuální zůstatek kreditů v navigaci.
 * Kliknutím přejde na stránku /credits.
 */
export function CreditsWidget() {
  const { data } = trpc.credits.balance.useQuery();
  if (data === undefined) return null;
  return (
    <Link href="/credits">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 cursor-pointer hover:bg-yellow-500/20 transition-colors">
        <Zap className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-sm font-bold text-yellow-400">{data.balance}</span>
      </div>
    </Link>
  );
}
