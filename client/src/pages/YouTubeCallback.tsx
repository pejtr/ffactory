import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function YouTubeCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const connectMutation = trpc.youtube.exchangeCode.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg(error === "access_denied" ? "Přístup byl zamítnut." : `YouTube chyba: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("Chybí autorizační kód.");
      return;
    }

    connectMutation.mutateAsync({
      code,
      origin: window.location.origin,
    }).then(() => {
      setStatus("success");
      setTimeout(() => navigate("/channels"), 2000);
    }).catch((e: any) => {
      setStatus("error");
      setErrorMsg(e.message || "Nepodařilo se připojit kanál.");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        {status === "processing" && (
          <>
            <div className="text-5xl mb-4 animate-pulse">📺</div>
            <h2 className="font-display text-xl font-bold mb-2">Připojuji YouTube kanál...</h2>
            <p className="text-muted-foreground text-sm">Prosím počkejte, probíhá autorizace.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-display text-xl font-bold text-green-400 mb-2">Kanál úspěšně připojen!</h2>
            <p className="text-muted-foreground text-sm">Přesměrování na Channel Manager...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="font-display text-xl font-bold text-red-400 mb-2">Chyba připojení</h2>
            <p className="text-muted-foreground text-sm mb-4">{errorMsg}</p>
            <button
              onClick={() => navigate("/channels")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
            >
              Zpět na Channel Manager
            </button>
          </>
        )}
      </div>
    </div>
  );
}
