import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_TIPS = [
  "Jak začít s prvním videem?",
  "Co je Soul Cinema?",
  "Jak vytvořit Stargate: Legacy?",
  "Který model je nejlepší?",
  "Jak nahrát referenční fotku?",
];

export default function LucieChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ahoj! Jsem **Lucie**, tvůj AI průvodce Video Factory. 🎬\n\nMůžu ti pomoci s:\n- Vytvořením prvního videa krok za krokem\n- Nastavením Soul Cinema postav\n- Výběrem správného modelu pro každou scénu\n- Generováním Stargate: Legacy pilotu\n\nCo tě zajímá?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.chatbot.ask.useMutation({
    onSuccess: (data: { reply: string | unknown[] }) => {
      const content = typeof data.reply === "string" ? data.reply : JSON.stringify(data.reply);
      setMessages(prev => [...prev, {
        role: "assistant",
        content,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    },
    onError: (err: { message: string }) => {
      toast.error(`Chyba: ${err.message}`);
      setIsTyping(false);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    const userMessage: Message = { role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    chatMutation.mutate({ message: content, history });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? "bg-red-500 hover:bg-red-400 rotate-0"
            : "bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 animate-pulse-slow"
        }`}
        style={{ boxShadow: open ? "0 0 20px rgba(239,68,68,0.5)" : "0 0 30px rgba(6,182,212,0.6)" }}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[520px] rounded-2xl border border-white/20 bg-[oklch(0.10_0.02_240)] shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: "0 0 40px rgba(6,182,212,0.2), 0 20px 60px rgba(0,0,0,0.8)" }}>

          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-['Orbitron'] text-sm font-bold text-white/90">LUCIE</h3>
              <p className="text-xs text-cyan-400">AI průvodce studiem</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/40">online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                    : "bg-white/20"
                }`}>
                  {msg.role === "assistant" ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-white/8 text-white/85 border border-white/10"
                    : "bg-cyan-500/20 text-white/90 border border-cyan-500/30"
                }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white/8 border border-white/10 rounded-xl px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick tips */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-white/40 mb-2">Rychlé otázky:</p>
              <div className="flex flex-wrap gap-1">
                {QUICK_TIPS.map((tip, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(tip)}
                    className="text-xs px-2 py-1 rounded-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  >
                    {tip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Zeptej se Lucie..."
              className="flex-1 bg-white/8 border border-white/20 rounded-lg px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
              disabled={isTyping}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              {isTyping ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
