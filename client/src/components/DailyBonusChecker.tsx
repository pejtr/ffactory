import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

/**
 * DailyBonusChecker — mounts globally in App.tsx.
 * When the user is logged in and has an unclaimed daily bonus,
 * shows a persistent toast with a "Claim" button after a short delay.
 */
export default function DailyBonusChecker() {
  const { user } = useAuth();
  const hasChecked = useRef(false);

  const { data: status } = trpc.gamification.status.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  const claimMutation = trpc.gamification.claimDaily.useMutation({
    onSuccess: (data) => {
      toast.success(`🔥 Denní bonus vyzvednut! +${data.bonusAmount} kreditů — streak ${data.newStreak} dní`, {
        duration: 5000,
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (!status || hasChecked.current) return;
    hasChecked.current = true;

    if (status.streak.canClaimDaily) {
      // Delay 2s to not interrupt page load
      const timer = setTimeout(() => {
        toast(
          <div className="flex flex-col gap-2">
            <div className="font-semibold text-sm">🎁 Denní bonus čeká!</div>
            <div className="text-xs text-muted-foreground">
              Streak: {status.streak.current} dní · Bonus: +{status.streak.dailyBonusAmount} kreditů
            </div>
            <Button
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs"
              onClick={() => {
                claimMutation.mutate();
                toast.dismiss();
              }}
            >
              Vyzvednout bonus
            </Button>
          </div>,
          {
            duration: 15000,
            action: {
              label: "Achievements",
              onClick: () => window.location.href = "/achievements",
            },
          }
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return null;
}
